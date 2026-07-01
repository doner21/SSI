// src/metrics.ts — G1B Falsifier exact per-user estimators (HARNESS-SPEC §10 / PRE-REGISTRATION §6 + §7.6).
//
// Deterministic, closed-form estimators that turn a method's {MethodDecision} stream plus the
// §2.5 synthetic-oracle labels (worth_surfacing, answer_changes_IR) into the locked per-user
// metrics (AQ, US, VoI) and their registered-weight composite, plus the reported-only
// calibration/reliability curves (§6.5) and the §7.6 negative-control specificity guard. [ARCH][GATE]
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules (NodeNext `.js` import specifiers),
// no `any` in public signatures, IEEE-754 `number`. This module consumes NO randomness and
// reads NO global state — every registered constant arrives through the injected `LockedConfig`.
//
// Locked conventions honored (PRE-REGISTRATION §6 [GATE]):
//   • AQ = balanced accuracy of the surface decision vs `ws` (§6.1) — so always-ask / always-
//     abstain cannot game it (always-abstain ⇒ sensitivity 0, specificity 1 ⇒ AQ = 0.5).
//   • US = precision of surfaced vs `ws`, VoI = precision of surfaced vs `vc`; both use the
//     registered null value 0 when a method surfaces nothing (§6.2 / §6.3).
//   • composite = w_AQ·AQ + w_US·US + w_VoI·VoI with the locked weights read from CONFIG (§6.4).
//   • Calibration (reliability curves + ECE) is REPORTED, NEVER gated (§6.5).
//   • negControlSpecificity = per-user specificity restricted to the registered negative-control
//     cases, for the §7.6 H-NC guard (gate uses the across-user average ≥ 0.80, applied in §9).
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no new parameters; calibrationBins is the only
//        knob and it comes from CONFIG):
//
//   M1. Per-user scope. The declared signatures take (decisions, cases) without a userId
//       (HARNESS-SPEC §10). These estimators are defined PER USER (§6.1–§6.3 use the per-user
//       case set D_u). The caller therefore passes ONE user's eval cases + that user's
//       decisions; the implementation simply computes over whatever (decisions, cases) pair it
//       is given, so per-user slicing by the caller yields the per-user statistic and a pooled
//       slice yields a pooled diagnostic. No new parameter is introduced.
//
//   M2. Decision↔case join. Decisions are matched to cases by `caseId` (the only shared key,
//       HARNESS-SPEC §2). A case with no matching decision is treated as an ABSTAIN
//       (surface = 0, score = 0): a method that never decided a case did not surface it. Under
//       the locked run every eval case receives exactly one decision, so this default is
//       unreachable in practice; it only guards against a malformed decision stream.
//
//   M3. Empty-class half-term (§6.1). Balanced accuracy needs both a positive (ws=1) and a
//       negative (ws=0) case for the user. PRE-REGISTRATION §5.3 GUARANTEES both classes per
//       user, so neither denominator is empty under the locked run. For the residual/defensive
//       empty-class path PRE-REGISTRATION §6.1 says the missing half-term is "set to the
//       registered prior rate": we use the chance rate 0.5 — the prior/expected value of a
//       balanced-accuracy half-term for a non-informative decision, which keeps AQ ∈ [0,1] and
//       introduces NO new numeric parameter. (Unreachable under §5.3.)
//
//   M4. Reliability binning & ECE scale (§6.5). The reliability curve bins cases into
//       `cfg.calibrationBins` EQUAL-WIDTH bins. The method surfacing score (EVSI / rule score)
//       is measured in nats / arbitrary units, not a probability, while the empirical term is a
//       rate ∈ [0,1]; for the two to be commensurate in ECE = Σ_b (|b|/N)·|meanPred−emp| the
//       scores are min–max normalized to [0,1] across the supplied cases BEFORE equal-width
//       binning (deterministic; degenerate range ⇒ all mass in bin 0 with meanPred = 0).
//       `meanPred` is reported on this normalized [0,1] scale. All `calibrationBins` bins are
//       emitted (empty bins carry their bin-center as meanPred, empirical 0, count 0, and
//       contribute exactly 0 to ECE). Calibration is diagnostic only and never gates (§6.5).
//
//   M5. Negative-control empty set (§7.6). If a user has no registered negative-control case,
//       negControlSpecificity returns 1 (vacuously specific — there is no false interruption to
//       commit). §5.3's negativeControlFrac guarantees NC cases per user, so this is defensive.

import type {
  LockedConfig,
  MethodDecision,
  ConsequenceCase,
} from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Internal join helper (NOTES M2). Returns surface ∈ {0,1} and score for a case.
// ─────────────────────────────────────────────────────────────────────────────

interface JoinedCase {
  readonly surface: 0 | 1;
  readonly score: number;
  readonly ws: 0 | 1; // oracle worth_surfacing label (§2.5)
  readonly vc: 0 | 1; // oracle answer_changes_IR label (§2.5)
  readonly negativeControl: boolean;
}

function decisionIndex(
  decisions: readonly MethodDecision[],
): ReadonlyMap<number, MethodDecision> {
  const m = new Map<number, MethodDecision>();
  for (const d of decisions) m.set(d.caseId, d);
  return m;
}

function join(
  decisions: readonly MethodDecision[],
  cases: readonly ConsequenceCase[],
): readonly JoinedCase[] {
  const idx = decisionIndex(decisions);
  return cases.map((c) => {
    const d = idx.get(c.caseId); // missing ⇒ treated as abstain (NOTES M2)
    return {
      surface: d ? d.surface : 0,
      score: d ? d.score : 0,
      ws: c.oracle.worthSurfacing,
      vc: c.oracle.answerChangesIR,
      negativeControl: c.oracle.negativeControl,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// §6.1 — Abstention quality AQ = balanced accuracy of surface vs ws. [ARCH][GATE]
// AQ = ½·(sensitivity + specificity), so always-ask/always-abstain ⇒ 0.5 floor.
// ─────────────────────────────────────────────────────────────────────────────

export function abstentionQuality(
  decisions: readonly MethodDecision[],
  cases: readonly ConsequenceCase[],
): number {
  const j = join(decisions, cases);
  let TP = 0;
  let FN = 0;
  let TN = 0;
  let FP = 0;
  for (const x of j) {
    if (x.ws === 1) {
      if (x.surface === 1) TP++;
      else FN++;
    } else {
      if (x.surface === 1) FP++;
      else TN++;
    }
  }
  const posDenom = TP + FN; // # ws=1 cases (guaranteed ≥1 per user, §5.3)
  const negDenom = TN + FP; // # ws=0 cases (guaranteed ≥1 per user, §5.3)
  // Registered prior-rate fallback for the (unreachable) empty class (NOTES M3).
  const sensitivity = posDenom > 0 ? TP / posDenom : 0.5;
  const specificity = negDenom > 0 ? TN / negDenom : 0.5;
  return 0.5 * (sensitivity + specificity);
}

// ─────────────────────────────────────────────────────────────────────────────
// §6.2 — Usefulness US = precision of surfaced vs ws; null = 0 if nothing surfaced.
// ─────────────────────────────────────────────────────────────────────────────

export function usefulness(
  decisions: readonly MethodDecision[],
  cases: readonly ConsequenceCase[],
): number {
  const j = join(decisions, cases);
  let surfaced = 0;
  let surfacedAndWorth = 0;
  for (const x of j) {
    if (x.surface === 1) {
      surfaced++;
      if (x.ws === 1) surfacedAndWorth++;
    }
  }
  return surfaced > 0 ? surfacedAndWorth / surfaced : 0; // registered null = 0 (§6.2)
}

// ─────────────────────────────────────────────────────────────────────────────
// §6.3 — Answer-changing VoI = precision of surfaced vs vc; null = 0 if nothing surfaced.
// ─────────────────────────────────────────────────────────────────────────────

export function answerChangingVoI(
  decisions: readonly MethodDecision[],
  cases: readonly ConsequenceCase[],
): number {
  const j = join(decisions, cases);
  let surfaced = 0;
  let surfacedAndPivotal = 0;
  for (const x of j) {
    if (x.surface === 1) {
      surfaced++;
      if (x.vc === 1) surfacedAndPivotal++;
    }
  }
  return surfaced > 0 ? surfacedAndPivotal / surfaced : 0; // registered null = 0 (§6.3)
}

// ─────────────────────────────────────────────────────────────────────────────
// §6.4 / §7.1 — locked-weight composite per user. Weights READ FROM CONFIG.
// ─────────────────────────────────────────────────────────────────────────────

export interface PerUserMetrics {
  readonly aq: number;
  readonly us: number;
  readonly voi: number;
  readonly composite: number;
}

export function composite(
  cfg: LockedConfig,
  m: { aq: number; us: number; voi: number },
): number {
  const { wAQ, wUS, wVoI } = cfg.weights;
  return wAQ * m.aq + wUS * m.us + wVoI * m.voi;
}

export function perUserMetrics(
  cfg: LockedConfig,
  decisions: readonly MethodDecision[],
  cases: readonly ConsequenceCase[],
): PerUserMetrics {
  const aq = abstentionQuality(decisions, cases);
  const us = usefulness(decisions, cases);
  const voi = answerChangingVoI(decisions, cases);
  return { aq, us, voi, composite: composite(cfg, { aq, us, voi }) };
}

// ─────────────────────────────────────────────────────────────────────────────
// §6.5 — Calibration / reliability curves + ECE (DIAGNOSTIC, NEVER GATED). [ARCH]
// ─────────────────────────────────────────────────────────────────────────────

export interface ReliabilityBin {
  readonly meanPred: number; // mean normalized surfacing score in the bin (NOTES M4)
  readonly empirical: number; // mean oracle label in the bin (vc for surfacing, ws for abstention)
  readonly count: number;
}

// Shared equal-width reliability construction over min–max normalized scores (NOTES M4).
function reliabilityCurve(
  cfg: LockedConfig,
  scores: readonly number[],
  labels: readonly (0 | 1)[],
): { bins: readonly ReliabilityBin[]; ece: number } {
  const B = cfg.calibrationBins; // fixed equal-width bin count (§6.5), from CONFIG
  const n = scores.length;

  // Pre-allocate B empty bins with their bin-centers as the default meanPred.
  const sum = new Array<number>(B).fill(0); // Σ normalized score in bin
  const lab = new Array<number>(B).fill(0); // Σ label in bin
  const cnt = new Array<number>(B).fill(0); // # cases in bin

  if (n === 0) {
    const empty = Array.from({ length: B }, (_, b) => ({
      meanPred: (b + 0.5) / B,
      empirical: 0,
      count: 0,
    }));
    return { bins: empty, ece: 0 };
  }

  // Min–max normalize scores to [0,1] so meanPred and empirical share a scale (NOTES M4).
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of scores) {
    if (s < lo) lo = s;
    if (s > hi) hi = s;
  }
  const range = hi - lo;
  const norm = (s: number): number => (range > 0 ? (s - lo) / range : 0);

  for (let i = 0; i < n; i++) {
    const p = norm(scores[i]!);
    // Equal-width bin index in [0, B-1]; the right edge (p === 1) folds into the last bin.
    let b = Math.floor(p * B);
    if (b >= B) b = B - 1;
    if (b < 0) b = 0;
    sum[b]! += p;
    lab[b]! += labels[i]!;
    cnt[b]! += 1;
  }

  let ece = 0;
  const bins = new Array<ReliabilityBin>(B);
  for (let b = 0; b < B; b++) {
    const c = cnt[b]!;
    if (c > 0) {
      const meanPred = sum[b]! / c;
      const empirical = lab[b]! / c;
      bins[b] = { meanPred, empirical, count: c };
      ece += (c / n) * Math.abs(meanPred - empirical);
    } else {
      // Empty bin: report bin-center as meanPred, contributes 0 to ECE.
      bins[b] = { meanPred: (b + 0.5) / B, empirical: 0, count: 0 };
    }
  }
  return { bins, ece };
}

// Surfacing-reliability: predicted surfacing score vs empirical PIVOTALITY (vc). (§6.5)
export function surfacingReliability(
  cfg: LockedConfig,
  decisions: readonly MethodDecision[],
  cases: readonly ConsequenceCase[],
): { bins: readonly ReliabilityBin[]; ece: number } {
  const j = join(decisions, cases);
  const scores = j.map((x) => x.score);
  const labels = j.map((x) => x.vc);
  return reliabilityCurve(cfg, scores, labels);
}

// Abstention-reliability: predicted surfacing score vs empirical WORTH-SURFACING (ws). (§6.5)
export function abstentionReliability(
  cfg: LockedConfig,
  decisions: readonly MethodDecision[],
  cases: readonly ConsequenceCase[],
): { bins: readonly ReliabilityBin[]; ece: number } {
  const j = join(decisions, cases);
  const scores = j.map((x) => x.score);
  const labels = j.map((x) => x.ws);
  return reliabilityCurve(cfg, scores, labels);
}

// ─────────────────────────────────────────────────────────────────────────────
// §7.6 — Negative-control specificity H-NC (per user, for the guard). [ARCH][GATE]
// Restricted to the registered negative-control cases (ws=0 with a detected consequence):
// specificity = (# abstained) / (# negative-control cases). Across-user average ≥ 0.80 is
// the §7.6 gate, applied in §9 (this returns the per-user value only).
// ─────────────────────────────────────────────────────────────────────────────

export function negControlSpecificity(
  decisions: readonly MethodDecision[],
  cases: readonly ConsequenceCase[],
): number {
  const j = join(decisions, cases);
  let nc = 0;
  let abstained = 0;
  for (const x of j) {
    if (x.negativeControl) {
      nc++;
      if (x.surface === 0) abstained++;
    }
  }
  return nc > 0 ? abstained / nc : 1; // vacuously specific if no NC cases (NOTES M5)
}
