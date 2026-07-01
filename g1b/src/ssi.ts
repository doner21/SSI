// src/ssi.ts — G1B Falsifier method under test (HARNESS-SPEC §8 / PRE-REGISTRATION §3.0, §4.3–§4.7).
//
// SSI = the §4.1 factored, context-conditioned posterior (src/posterior.ts) PLUS the S1–S6
// salience math locked in §4.3–§4.7: Bayesian-surprise screen (S1), affordance/safety predicates
// (S2/S6), the EVSI value-of-information gate (S4 — the load-bearing mechanism), and EIG ranking
// under a hard turn budget (S5). SSI is the claimant H1 must defend; baseline (v) is the same
// posterior with S4/S5 removed, so this module is the EXACT locus of the EIG/VoI contribution.
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules (NodeNext `.js` import specifiers),
// no `any` in public signatures, IEEE-754 `number`, NATURAL-LOG NATS for every information
// quantity. This module consumes NO randomness (§4.7: "SSI's decisions are analytic and
// seed-free") and reads NO global state — every registered constant arrives via `LockedConfig`.
//
// Integrity (§2.6 / §4.7) [GATE]: SSI NEVER reads ground-truth θ_u. Belief is formed only from
// the user's observable fossils (posterior.ts) and the registered IR oracle (generative.ts).
// The `user` parameter is used only for its fossils via the posterior; θ is never inspected here.
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no new parameters; every constant comes from CONFIG):
//
//   S1. EVSI formulation (§4.5). The locked spec asserts TWO invariants that must hold together:
//       (a) EVSI ≥ 0 always, and (b) EVSI = 0 EXACTLY when "both answers yield the same chosen IR"
//       (the answer cannot change the IR). The only formulation satisfying BOTH with the FIXED
//       (non-argmax) IR oracle of §2.5 is the standard VoI form where each candidate IR is valued
//       under the SAME belief state it is selected for, then differenced and averaged:
//
//         EVSI(C,c) = Σ_r P(answer = r | C,c) · [ Value(IR_answered(r) | belief_r)
//                                                 − Value(IR_silent       | belief_r) ]
//
//       where belief_r is the consequence-conditioned posterior cc with the TOUCHED axes
//       collapsed to the answered levels r (a one-hot per touched axis), and IR_silent is the
//       IR the oracle selects from cc's posterior-mean tolerance with NO question.
//         • If IR_answered(r) == IR_silent for every positive-probability answer r, each bracket
//           is Value(IR | belief_r) − Value(IR | belief_r) = 0 ⇒ EVSI = 0 EXACTLY (invariant b). ✓
//         • Otherwise IR_answered(r) selects exactly the answered levels, which maximize
//           irValue under the one-hot belief_r, so every bracket ≥ 0 ⇒ EVSI ≥ 0 (invariant a). ✓
//       This is the decision-theoretic EVSI ("value of acting optimally given the answer, minus
//       the value of the silent default, under the post-answer state"); it introduces no new
//       parameter — Value and IR* are the registered §2.5 oracle (generative.ts).
//
//   S2. The question q(C) queries ALL of C's touched axes JOINTLY (the axes the IR oracle reads,
//       §4.4). The predictive answer distribution is the product of the per-axis consequence-
//       conditioned posteriors cc[axis] (factored model, §4.1): P(r) = Π_{a∈touched} cc[a][r_a].
//       `evsi` enumerates this FULL joint (3^|touched| answers) so the EVSI = 0 condition mirrors
//       the oracle's full-θ-vs-prior IR comparison (generative.oracleAnswerChangesIR). The public
//       `answerDist` helper has a locked flat return type `{level, p}[]`, which cannot encode a
//       multi-axis joint tuple, so it exposes the predictive over the PRIMARY touched axis (first
//       in canonical CONFIG axis order) for inspection/calibration; for the single-touched-axis
//       families it coincides exactly with the joint used by `evsi`. answerDist never drives the
//       gate — the gate uses `evsi`'s joint computation.
//
//   S3. EIG (§4.6) is the factor-additive expected entropy reduction. A question fully reveals
//       each touched axis, so the post-answer entropy of every touched axis collapses to 0
//       (§4.6: "the inner H collapses to 0"); untouched axes are not queried and contribute 0.
//       Hence EIG(C,c) = Σ_{a∈touched} H(cc[a]) (entropyAxis of the consequence-conditioned
//       posterior, nats) ≥ 0 — exact under the factored model, mirroring the KL factor-additivity
//       of §4.3.
//
//   S4. Ranking key (§4.6, locked): S6-forced cases first; then descending EIG; ties broken by
//       descending EVSI; then ascending fixed family ordinal (the family's index in CONFIG.families
//       — a registered, deterministic ordering). The top ≤ B (= turnBudget = 3) survive the budget;
//       the rest abstain. This makes the procedure fully reproducible without any randomness.
//
//   S5. `score` for calibration (§6.5). ssiDecide computes EVSI for EVERY case (surfaced or not)
//       and reports it as MethodDecision.score, per HARNESS-SPEC §8 ("score = EVSI for calibration").
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AxisId,
  AxisPosterior,
  Context,
  FactoredPosterior,
  FamilyId,
  AxisLevel,
  ConsequenceCase,
  IRId,
  IRSelectionInput,
  LockedConfig,
  MethodDecision,
  SyntheticUser,
} from "./types.js";
import {
  consequenceConditioned,
  entropyAxis,
  factoredPosterior,
  klFactored,
} from "./posterior.js";
import { irValue, selectIR } from "./generative.js";

const LEVELS: readonly AxisLevel[] = [0, 1, 2]; // K_a = 3 (§2.1)

// ── CONFIG lookups (no parameters defined here; everything reads from CONFIG). ──
function familySig(cfg: LockedConfig, family: FamilyId) {
  const sig = cfg.families.find((f) => f.family === family);
  if (sig === undefined) throw new Error(`[ssi] unknown family ${family} (not in CONFIG §2.4)`);
  return sig;
}

/** Touched axes of a family, in canonical CONFIG axis order (matches generative.touchedAxesOrdered). */
function touchedAxes(cfg: LockedConfig, family: FamilyId): readonly AxisId[] {
  const touched = new Set<AxisId>(familySig(cfg, family).touchedAxes);
  return cfg.axes.map((a) => a.id).filter((id) => touched.has(id));
}

/** Fixed family ordinal = index in CONFIG.families (the registered deterministic ordering, §4.6). */
function familyOrdinal(cfg: LockedConfig, family: FamilyId): number {
  return cfg.families.findIndex((f) => f.family === family);
}

/** One-hot AxisPosterior placing all mass on a single answered level (the post-answer belief, S1). */
function oneHot(level: AxisLevel): AxisPosterior {
  return [level === 0 ? 1 : 0, level === 1 ? 1 : 0, level === 2 ? 1 : 0];
}

// ─────────────────────────────────────────────────────────────────────────────
// §4.3 — S1 Bayesian-surprise screen
// ─────────────────────────────────────────────────────────────────────────────

/** §4.3 S1(C,c) = KL( P(Intent | C,c) ‖ P(Intent | c) ) = klFactored(cc, base), nats. */
export function s1Surprise(_cfg: LockedConfig, base: FactoredPosterior, cc: FactoredPosterior): number {
  return klFactored(cc, base);
}

/** §4.3 S1 gate: C passes the surprise screen iff S1(C,c) > θ_surprise (registered, conservative). */
export function s1Pass(cfg: LockedConfig, surprise: number): boolean {
  return surprise > cfg.thetaSurprise;
}

// ─────────────────────────────────────────────────────────────────────────────
// §4.4 — S2 affordance predicate / S6 safety override (S3 collapsed to identity gate)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * §4.4 S2 affordance predicate: C "materially changes affordances" iff its registered signature
 * is non-flat on at least one axis the IR oracle reads — i.e. it has touched axes. Deterministic,
 * derived from CONFIG + family only (no tunable S2 in G1B). `ctx` is part of the locked signature.
 */
export function s2AffordsChange(cfg: LockedConfig, family: FamilyId, _ctx: Context): boolean {
  return touchedAxes(cfg, family).length > 0;
}

/** §4.4 S6 safety/constraint override: families registered as safety-class are forced-surfaced. */
export function s6Safety(cfg: LockedConfig, family: FamilyId): boolean {
  return familySig(cfg, family).familyClass === "safety";
}

// ─────────────────────────────────────────────────────────────────────────────
// §4.5 — S4 EVSI gate (the load-bearing value-of-information mechanism)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * §4.5 predictive answer distribution over the PRIMARY touched axis (NOTES S2). For single-axis
 * families this is the exact predictive `evsi` integrates over; for multi-axis families it is an
 * inspection/calibration view of the first touched axis. Returns [] if the family touches no axis.
 */
export function answerDist(
  cfg: LockedConfig,
  cc: FactoredPosterior,
  family: FamilyId,
): readonly { level: AxisLevel; p: number }[] {
  const touched = touchedAxes(cfg, family);
  if (touched.length === 0) return [];
  const primary = touched[0]!;
  const p = cc[primary];
  return LEVELS.map((level) => ({ level, p: p[level] }));
}

/**
 * §4.5 EVSI(C,c) — the value of information of asking about C, in the registered IR-value units.
 * Joint over the touched axes' answers (NOTES S2), each candidate IR valued under its own
 * post-answer belief (NOTES S1) so EVSI ≥ 0 and EVSI = 0 EXACTLY when no answer changes the IR.
 *
 * `_user` is part of the locked signature but is NEVER read (integrity §2.6/§4.7: SSI must not
 * touch θ; belief already arrives pre-computed in `base`/`cc`).
 */
export function evsi(
  cfg: LockedConfig,
  _user: SyntheticUser,
  _base: FactoredPosterior,
  cc: FactoredPosterior,
  family: FamilyId,
  ctx: Context,
): number {
  const touched = touchedAxes(cfg, family);
  if (touched.length === 0) return 0; // nothing the IR oracle reads ⇒ no answer can move the IR

  // IR the oracle would silently pick from the posterior-mean tolerance (no question asked).
  const silentTol = { ...cc } as Record<AxisId, AxisPosterior | AxisLevel>;
  const irSilent: IRId = selectIR(cfg, { effectiveTolerance: silentTol, context: ctx, family });

  // Enumerate the full joint over touched-axis answers: P(r) = Π cc[a][r_a].
  let total = 0;
  const combo: AxisLevel[] = touched.map(() => 0);
  const enumerate = (i: number, prob: number): void => {
    if (i === touched.length) {
      // belief_r: cc with every touched axis collapsed to its answered (one-hot) level.
      const beliefR = { ...cc } as Record<AxisId, AxisPosterior>;
      const answeredTol = { ...cc } as Record<AxisId, AxisPosterior | AxisLevel>;
      for (let t = 0; t < touched.length; t++) {
        const ax = touched[t]!;
        const r = combo[t]!;
        beliefR[ax] = oneHot(r);
        answeredTol[ax] = r; // explicit answered level (§4.5 "tolerance implied by answer r")
      }
      const irAnswered: IRId = selectIR(cfg, { effectiveTolerance: answeredTol, context: ctx, family });
      const beliefRFactored = beliefR as FactoredPosterior;
      // Value of each IR under the SAME post-answer state belief_r (NOTES S1).
      const gain = irValue(cfg, irAnswered, beliefRFactored, ctx) - irValue(cfg, irSilent, beliefRFactored, ctx);
      total += prob * gain;
      return;
    }
    const ax = touched[i]!;
    const p = cc[ax];
    for (const level of LEVELS) {
      const pk = p[level];
      if (pk <= 0) continue; // zero-probability answers contribute nothing
      combo[i] = level;
      enumerate(i + 1, prob * pk);
    }
  };
  enumerate(0, 1);
  return total;
}

/** §4.5 VoI/EVSI gate: C is VoI-eligible iff EVSI(C,c) > κ (κ ≥ 0, registered). EVSI=0 ⇒ abstain. */
export function s4Eligible(cfg: LockedConfig, evsiValue: number): boolean {
  return evsiValue > cfg.kappa;
}

// ─────────────────────────────────────────────────────────────────────────────
// §4.6 — S5 EIG ranking + turn budget
// ─────────────────────────────────────────────────────────────────────────────

/**
 * §4.6 EIG(C,c): factor-additive expected information gain. A question fully reveals each touched
 * axis, so its post-answer entropy collapses to 0 (NOTES S3); EIG = Σ_{a∈touched} H(cc[a]), nats.
 * `_base` is part of the locked signature; the gain is computed against the consequence-conditioned
 * posterior `cc` whose touched-axis entropies the answer removes.
 */
export function eig(
  cfg: LockedConfig,
  _base: FactoredPosterior,
  cc: FactoredPosterior,
  family: FamilyId,
  _ctx: Context,
): number {
  let h = 0;
  for (const ax of touchedAxes(cfg, family)) h += entropyAxis(cc[ax]);
  return h;
}

/** §4.6 one VoI-eligible (∪ S6-forced) case awaiting ranking under the turn budget. */
export interface EligibleCase {
  readonly caseId: number;
  readonly eig: number;
  readonly evsi: number;
  readonly forcedS6: boolean;
  readonly familyOrdinal: number;
}

/**
 * §4.6 rank the eligible (∪ S6-forced) cases and apply the hard turn budget B = turnBudget.
 * Order (locked, NOTES S4): S6-forced first; then descending EIG; ties → descending EVSI; then
 * ascending fixed family ordinal. Returns the caseIds to surface (≤ B), in surfacing order.
 */
export function rankAndBudget(cfg: LockedConfig, eligible: readonly EligibleCase[]): readonly number[] {
  const ordered = [...eligible].sort((a, b) => {
    if (a.forcedS6 !== b.forcedS6) return a.forcedS6 ? -1 : 1; // S6 forced first
    if (b.eig !== a.eig) return b.eig - a.eig; // descending EIG
    if (b.evsi !== a.evsi) return b.evsi - a.evsi; // tie-break: descending EVSI
    return a.familyOrdinal - b.familyOrdinal; // final tie-break: ascending family ordinal
  });
  return ordered.slice(0, cfg.turnBudget).map((e) => e.caseId);
}

// ─────────────────────────────────────────────────────────────────────────────
// §4.7 — the locked SSI decision pipeline (one transaction over a user's eval cases)
// ─────────────────────────────────────────────────────────────────────────────

/** Per-case intermediate quantities computed once and reused for eligibility, ranking, and score. */
interface CaseQuantities {
  readonly caseId: number;
  readonly family: FamilyId;
  readonly forcedS6: boolean;
  readonly eligible: boolean; // forced S6 OR (S1 pass ∧ S4 EVSI gate pass)
  readonly eig: number;
  readonly evsi: number;
}

/**
 * §4.7 the locked SSI pipeline run over all of a user's eval `cases` as ONE transaction:
 *   1. S6 first  — safety/constraint-class ⇒ forced-surface (bypass S1/S4).
 *   2. S1 screen — non-forced cases abstain unless surprise > θ_surprise.
 *   3. S4 gate   — survivors abstain unless EVSI > κ (EVSI = 0 ⇒ abstain).
 *   4. S5 budget — rank survivors (∪ forced) by EIG and surface the top ≤ B; the rest abstain.
 * Returns exactly one MethodDecision per case, with score = EVSI for calibration (§6.5, NOTES S5).
 * Consumes NO randomness and never reads θ_u (§4.7 / §2.6) [GATE].
 */
export function ssiDecide(
  cfg: LockedConfig,
  user: SyntheticUser,
  cases: readonly ConsequenceCase[],
): readonly MethodDecision[] {
  const quantities: CaseQuantities[] = cases.map((cc0) => {
    const base = factoredPosterior(cfg, user, cc0.context);
    const conditioned = consequenceConditioned(cfg, base, cc0.family, cc0.context);

    const forcedS6 = s6Safety(cfg, cc0.family);
    const surprise = s1Surprise(cfg, base, conditioned);
    const evsiVal = evsi(cfg, user, base, conditioned, cc0.family, cc0.context);
    const eigVal = eig(cfg, base, conditioned, cc0.family, cc0.context);

    // §4.7 eligibility: S6 forced bypasses S1/S4; otherwise require S1 screen AND S4 EVSI gate.
    const eligible = forcedS6 || (s1Pass(cfg, surprise) && s4Eligible(cfg, evsiVal));

    return { caseId: cc0.caseId, family: cc0.family, forcedS6, eligible, eig: eigVal, evsi: evsiVal };
  });

  // §4.6 rank the eligible (∪ forced) set and apply the hard turn budget.
  const eligibleCases: EligibleCase[] = quantities
    .filter((q) => q.eligible)
    .map((q) => ({
      caseId: q.caseId,
      eig: q.eig,
      evsi: q.evsi,
      forcedS6: q.forcedS6,
      familyOrdinal: familyOrdinal(cfg, q.family),
    }));
  const surfaced = new Set<number>(rankAndBudget(cfg, eligibleCases));

  // §4.7 one decision per case; abstain ⇔ not surfaced; score = EVSI (§6.5).
  return quantities.map((q) => ({
    caseId: q.caseId,
    surface: surfaced.has(q.caseId) ? 1 : 0,
    score: q.evsi,
  }));
}
