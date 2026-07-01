// src/baselines.ts — G1B Falsifier: the FIVE baselines (the ladder).
// HARNESS-SPEC.md §9 / PRE-REGISTRATION.md §3.1–§3.6, §5.2.
//
// Each baseline is fit ONLY on the TRAIN split (§5.2 wall) and consumes the SAME per-user
// fossils SSI sees; only the surface/abstain logic differs. All five are deliberately STRONG
// (not strawmen, §3.6) so an SSI win is meaningful and an SSI loss is possible.
//
//   (i)   silent-route2     — never surfaces (perfect specificity, zero usefulness). §3.1
//   (ii)  generic-linter    — best FIXED user-independent family rule, tuned on TRAIN. §3.2
//   (iii) user-heuristic    — strong profile + coarse-context heuristic, tuned threshold. §3.3
//   (iv)  loo-classifier    — discriminative fossil classifier, honest leave-one-family-out. §3.4
//   (v)   factored-ablation — SSI's IDENTICAL posterior + surprise threshold, NO EVSI/EIG. §3.5
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules (NodeNext `.js` specifiers), no `any`
// in public signatures, IEEE-754 `number`, natural-log nats for information quantities. The
// ONLY randomness permitted is the injected `looRng` (baseline iv); there is NO `Math.random`
// anywhere. Every registered constant arrives through the injected `LockedConfig` — this file
// introduces NO new tunable parameter beyond what §9.4 already freezes.
//
// ─────────────────────────────────────────────────────────────────────────────
// ABLATION-ISOLATION INVARIANT (§3.5 / §4.5) [GATE]
//   `makeFactoredAblation` calls the IDENTICAL `posterior.ts` belief functions SSI uses
//   (`factoredPosterior`, `consequenceConditioned`, `klFactored`) and decides via a surprise
//   threshold tuned on TRAIN ONLY — with NO call into any `evsi`/`eig` function and NO import
//   from `ssi.ts`. This module imports NOTHING from `src/ssi.ts`; grep for `evsi`/`eig` here
//   returns nothing. That absence is precisely what makes SSI-vs-(v) the clean, load-bearing
//   isolation of the EIG/VoI machinery (PRE-REGISTRATION §1.3, Decision #5).
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no new parameters; all constants come from CONFIG):
//
//   B1. TRAIN-only fitting (§5.2). `fit(cfg, trainCases, users)` may read the oracle labels of
//       TRAIN cases (legitimate per §5.2: "all baseline thresholds/features... fit only on
//       TRAIN"). `decide(...)` NEVER reads `case.oracle` — decisions are functions of (user
//       fossils, context, family) only, so no held-out label is ever touched pre-scoring.
//
//   B2. Threshold tuning maximizes BALANCED ACCURACY of `surface` against the TRAIN
//       `worth_surfacing` label (mirroring the §6.1 AQ metric, so each baseline is tuned to its
//       own best operating point on the metric it is judged by). The decision rule is
//       `surface ⇔ score ≥ threshold`. Ties in balanced accuracy break toward the LARGER
//       threshold (i.e. toward silence) per §5.7's conservative-by-default posture. Degenerate
//       TRAIN slices (no positives ⇒ never surface = +∞ threshold; no negatives ⇒ always
//       surface = −∞ threshold) are handled explicitly so tuning is total.
//
//   B3. `profileMean(user, axis)` is a COARSE profile estimate — the mean observed fossil level
//       on that axis across ALL contexts (no Dirichlet posterior, no (subdomain,genre) bucket
//       conditioning). This is deliberately weaker than SSI's context-conditioned posterior
//       (posterior.ts) so baseline (iii)/(iv) genuinely lack the calibrated-posterior machinery
//       they are denied (§3.3/§3.4). The neutral midpoint 1.0 is the structural centre of the
//       K_a = 3 level set {0,1,2}, not a registered/tunable parameter (used as the no-evidence
//       default and as the heuristic's deviation anchor).
//
//   B4. Baseline (iii) coarse context = a per-SUBDOMAIN additive offset learned on TRAIN
//       (P(worth|subdomain) − global base rate). Using only the coarse `subdomain` axis (not
//       the full (profile × subdomain × genre) cell) is exactly the coarseness §5.6/§3.3
//       predicts will BREAK on the held-out (grit-leaning × clean-mastering) context combos,
//       where the context-conditioned posterior is predicted to generalize. It is the strongest
//       honest profile+coarse-context rule, not a strawman.
//
//   B5. Baseline (iv) is a logistic-regression classifier over fossil-derived + coarse-context
//       features, fit by deterministic SGD (epoch shuffles drawn from the injected `looRng`).
//       Its operating threshold is selected by HONEST leave-one-(TRAIN-family)-out CV: for each
//       TRAIN family f, train on the OTHER train families and predict f's pooled out-of-fold
//       probabilities, then tune the threshold on that pool — so it must generalize to a family
//       it did not fit, nested inside the global §5.2 wall (it is still scored on the global
//       HELD-OUT families like everyone else; §5.2 "no special access"). The final predictive
//       model is refit on all TRAIN cases. Subdomain/genre ordinals are structural enumerations
//       (synthesis<mixing<mastering, lofi<clean-pop<experimental), not registered parameters.
//
//   B6. Baseline (v) surprise = klFactored( P(Intent|C,c) ‖ P(Intent|c) ) computed via the
//       SAME posterior.ts functions SSI's S1 screen uses (§4.3). It then thresholds that
//       surprise ALONE — no EVSI gate, no EIG ranking, no turn budget. This is SSI minus the
//       EIG/VoI mechanism, and nothing else.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AxisId,
  Context,
  ConsequenceCase,
  FamilyClass,
  FamilyId,
  GenreLevel,
  LockedConfig,
  MethodDecision,
  SubdomainLevel,
  SurfaceDecision,
  SyntheticUser,
} from "./types.js";
import type { Rng } from "./prng.js";
// Baseline (v) uses SSI's IDENTICAL belief core — and ONLY this. No evsi/eig symbol exists here.
import { consequenceConditioned, factoredPosterior, klFactored } from "./posterior.js";

// ─────────────────────────────────────────────────────────────────────────────
// Public contract (HARNESS-SPEC §9)
// ─────────────────────────────────────────────────────────────────────────────

export type BaselineId =
  | "silent-route2"
  | "generic-linter"
  | "user-heuristic"
  | "loo-classifier"
  | "factored-ablation";

export interface Baseline {
  readonly id: BaselineId;
  /** Fit on the TRAIN split ONLY (§5.2). May read TRAIN oracle labels; never held-out labels. */
  fit(cfg: LockedConfig, trainCases: readonly ConsequenceCase[], users: readonly SyntheticUser[]): void;
  /** Decide surface/abstain per case from (fossils, context, family) only — never `case.oracle`. */
  decide(cfg: LockedConfig, user: SyntheticUser, cases: readonly ConsequenceCase[]): readonly MethodDecision[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers (no new parameters; structural constants only)
// ─────────────────────────────────────────────────────────────────────────────

/** Structural midpoint of the K_a = 3 ordinal level set {0,1,2} (NOTES B3) — not a parameter. */
const NEUTRAL = 1.0;

/** Map userId → SyntheticUser so per-case scoring can recover the user's fossils. */
function userMap(users: readonly SyntheticUser[]): ReadonlyMap<number, SyntheticUser> {
  const m = new Map<number, SyntheticUser>();
  for (const u of users) m.set(u.id, u);
  return m;
}

/** Registered §2.4 signature lookup (touched axes + family class) for a family. */
function touchedAxes(cfg: LockedConfig, family: FamilyId): readonly AxisId[] {
  const sig = cfg.families.find((f) => f.family === family);
  if (sig === undefined) throw new Error(`[baselines] no registered family '${family}' (§2.4)`);
  return sig.touchedAxes;
}
function familyClassOf(cfg: LockedConfig, family: FamilyId): FamilyClass {
  const sig = cfg.families.find((f) => f.family === family);
  if (sig === undefined) throw new Error(`[baselines] no registered family '${family}' (§2.4)`);
  return sig.familyClass;
}

/** COARSE per-axis profile estimate: mean observed fossil level (no posterior/bucket) (NOTES B3). */
function profileMean(user: SyntheticUser, axis: AxisId): number {
  let sum = 0;
  let cnt = 0;
  for (const f of user.fossils) {
    if (f.axis === axis) {
      sum += f.observedLevel;
      cnt += 1;
    }
  }
  return cnt > 0 ? sum / cnt : NEUTRAL; // no evidence ⇒ structural neutral
}

/** Structural ordinal enumerations for coarse-context features (NOTES B5) — not parameters. */
function subdomainOrd(s: SubdomainLevel): number {
  return s === "synthesis" ? 0 : s === "mixing" ? 1 : 2; // synthesis<mixing<mastering
}
function genreOrd(g: GenreLevel): number {
  return g === "lofi" ? 0 : g === "clean-pop" ? 1 : 2; // lofi<clean-pop<experimental
}

/** A scored TRAIN case used for threshold tuning. */
interface Scored {
  readonly score: number;
  readonly label: 0 | 1; // worth_surfacing
}

/** Balanced accuracy of `surface ⇔ pred(score)` against the worth_surfacing labels (NOTES B2). */
function balancedAccuracy(pred: (s: number) => boolean, data: readonly Scored[]): number {
  let tp = 0;
  let fn = 0;
  let tn = 0;
  let fp = 0;
  for (const d of data) {
    const s = pred(d.score);
    if (d.label === 1) {
      if (s) tp += 1;
      else fn += 1;
    } else if (s) fp += 1;
    else tn += 1;
  }
  const pos = tp + fn;
  const neg = tn + fp;
  if (pos === 0 && neg === 0) return 0;
  if (pos === 0) return tn / neg; // only negatives present → specificity
  if (neg === 0) return tp / pos; // only positives present → recall
  return 0.5 * (tp / pos + tn / neg);
}

/**
 * Tune `threshold` so `surface ⇔ score ≥ threshold` maximizes balanced accuracy on TRAIN.
 * Ties break toward the LARGER threshold (toward silence, §5.7). Degenerate slices resolve to
 * +∞ (never surface) or −∞ (always surface). (NOTES B2)
 */
function tuneThreshold(data: readonly Scored[]): number {
  if (data.length === 0) return Number.POSITIVE_INFINITY; // nothing to learn ⇒ silence
  const hasPos = data.some((d) => d.label === 1);
  const hasNeg = data.some((d) => d.label === 0);
  if (!hasPos) return Number.POSITIVE_INFINITY; // nothing worth surfacing ⇒ never surface
  if (!hasNeg) return Number.NEGATIVE_INFINITY; // everything worth surfacing ⇒ always surface

  // Candidate cut-points: every unique score (so `≥` toggles at it) plus +∞ (surface none).
  const uniq = Array.from(new Set(data.map((d) => d.score))).sort((a, b) => a - b);
  const candidates = [...uniq, Number.POSITIVE_INFINITY];

  let best = -1;
  let bestThr = Number.NEGATIVE_INFINITY;
  for (const thr of candidates) {
    const ba = balancedAccuracy((s) => s >= thr, data);
    // Ascending iteration ⇒ later thr is larger ⇒ `>=` here keeps the larger thr on ties.
    if (ba > best || (ba === best && thr > bestThr)) {
      best = ba;
      bestThr = thr;
    }
  }
  return bestThr;
}

/** Assemble a MethodDecision from a score and the fitted threshold. */
function decideByThreshold(caseId: number, score: number, threshold: number): MethodDecision {
  const surface: SurfaceDecision = score >= threshold ? 1 : 0;
  return { caseId, surface, score };
}

// ─────────────────────────────────────────────────────────────────────────────
// (i) Silent Route-2 — never surfaces (§3.1). The floor / null initiator.
// ─────────────────────────────────────────────────────────────────────────────
class SilentRoute2 implements Baseline {
  readonly id = "silent-route2" as const;
  fit(): void {
    /* nothing to fit — it never asks (perfect abstention on negative controls). */
  }
  decide(_cfg: LockedConfig, _user: SyntheticUser, cases: readonly ConsequenceCase[]): readonly MethodDecision[] {
    return cases.map((c) => ({ caseId: c.caseId, surface: 0 as SurfaceDecision, score: 0 }));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// (ii) Generic linter — best FIXED user-independent family rule (§3.2).
// Score(case) = TRAIN-estimated P(worth | family); unseen (held-out) families fall back to the
// global TRAIN base rate (the linter's predicted blind spot — it ignores context entirely).
// ─────────────────────────────────────────────────────────────────────────────
class GenericLinter implements Baseline {
  readonly id = "generic-linter" as const;
  private readonly familyRate = new Map<FamilyId, number>();
  private baseRate = 0;
  private threshold = Number.POSITIVE_INFINITY;

  fit(_cfg: LockedConfig, trainCases: readonly ConsequenceCase[], _users: readonly SyntheticUser[]): void {
    const agg = new Map<FamilyId, { pos: number; n: number }>();
    let pos = 0;
    for (const c of trainCases) {
      const a = agg.get(c.family) ?? { pos: 0, n: 0 };
      a.n += 1;
      if (c.oracle.worthSurfacing === 1) {
        a.pos += 1;
        pos += 1;
      }
      agg.set(c.family, a);
    }
    this.baseRate = trainCases.length > 0 ? pos / trainCases.length : 0;
    this.familyRate.clear();
    for (const [f, a] of agg) this.familyRate.set(f, a.n > 0 ? a.pos / a.n : this.baseRate);

    const data: Scored[] = trainCases.map((c) => ({ score: this.scoreFor(c.family), label: c.oracle.worthSurfacing }));
    this.threshold = tuneThreshold(data);
  }

  private scoreFor(family: FamilyId): number {
    return this.familyRate.get(family) ?? this.baseRate;
  }

  decide(_cfg: LockedConfig, _user: SyntheticUser, cases: readonly ConsequenceCase[]): readonly MethodDecision[] {
    return cases.map((c) => decideByThreshold(c.caseId, this.scoreFor(c.family), this.threshold));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// (iii) User-aware heuristic — the serious competitor (§3.3).
// Strong, NOT strawman: profile (coarse fossil means) + coarse-context (per-subdomain offset
// learned on TRAIN) → tuned threshold. Denied ONLY the calibrated posterior + EIG/VoI.
// score = mean_{touched axes}|profileMean − NEUTRAL|  +  offset[subdomain]    (NOTES B3/B4)
// ─────────────────────────────────────────────────────────────────────────────
class UserHeuristic implements Baseline {
  readonly id = "user-heuristic" as const;
  private readonly offset = new Map<SubdomainLevel, number>();
  private threshold = Number.POSITIVE_INFINITY;

  fit(cfg: LockedConfig, trainCases: readonly ConsequenceCase[], users: readonly SyntheticUser[]): void {
    const byId = userMap(users);

    let pos = 0;
    for (const c of trainCases) if (c.oracle.worthSurfacing === 1) pos += 1;
    const globalMean = trainCases.length > 0 ? pos / trainCases.length : 0;

    // Coarse-context offset: deviation of each subdomain's worth-rate from the global base rate.
    const agg = new Map<SubdomainLevel, { pos: number; n: number }>();
    for (const c of trainCases) {
      const a = agg.get(c.context.subdomain) ?? { pos: 0, n: 0 };
      a.n += 1;
      if (c.oracle.worthSurfacing === 1) a.pos += 1;
      agg.set(c.context.subdomain, a);
    }
    this.offset.clear();
    for (const [sd, a] of agg) this.offset.set(sd, (a.n > 0 ? a.pos / a.n : globalMean) - globalMean);

    const data: Scored[] = trainCases.map((c) => {
      const u = byId.get(c.userId);
      if (u === undefined) throw new Error(`[baselines] user ${c.userId} missing for TRAIN case ${c.caseId}`);
      return { score: this.scoreFor(cfg, u, c.context, c.family), label: c.oracle.worthSurfacing };
    });
    this.threshold = tuneThreshold(data);
  }

  private scoreFor(cfg: LockedConfig, user: SyntheticUser, ctx: Context, family: FamilyId): number {
    const tas = touchedAxes(cfg, family);
    let mis = 0;
    for (const ax of tas) mis += Math.abs(profileMean(user, ax) - NEUTRAL);
    const profileMis = tas.length > 0 ? mis / tas.length : 0;
    return profileMis + (this.offset.get(ctx.subdomain) ?? 0);
  }

  decide(cfg: LockedConfig, user: SyntheticUser, cases: readonly ConsequenceCase[]): readonly MethodDecision[] {
    return cases.map((c) => decideByThreshold(c.caseId, this.scoreFor(cfg, user, c.context, c.family), this.threshold));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// (iv) Leave-one-consequence-out classifier on fossils (§3.4).
// A logistic-regression classifier over fossil-derived + coarse-context features. Its operating
// threshold is selected by honest leave-one-(TRAIN-family)-out CV (NOTES B5); the final
// predictive model is refit on all TRAIN cases. The only randomness is the injected `looRng`.
// ─────────────────────────────────────────────────────────────────────────────
const LOGREG_EPOCHS = 200; // SGD passes — structural training budget, not a registered parameter
const LOGREG_LR = 0.2; //   learning rate — structural optimizer setting, not a registered parameter

function sigmoid(z: number): number {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}
function dot(w: readonly number[], x: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < w.length; i++) s += w[i] * x[i];
  return s;
}

/** Deterministic SGD logistic regression. Epoch order is shuffled with the injected `rng`. */
function trainLogReg(X: readonly number[][], y: readonly number[], rng: Rng): number[] {
  if (X.length === 0) return [];
  const d = X[0].length;
  const w = new Array<number>(d).fill(0);
  const idx = X.map((_, i) => i);
  for (let e = 0; e < LOGREG_EPOCHS; e++) {
    // Fisher–Yates shuffle via the injected stream (no Math.random).
    for (let i = idx.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1);
      const tmp = idx[i];
      idx[i] = idx[j];
      idx[j] = tmp;
    }
    for (const i of idx) {
      const g = sigmoid(dot(w, X[i])) - y[i];
      const xi = X[i];
      for (let k = 0; k < d; k++) w[k] -= LOGREG_LR * g * xi[k];
    }
  }
  return w;
}

class LooClassifier implements Baseline {
  readonly id = "loo-classifier" as const;
  private weights: number[] = [];
  private threshold = 0.5;
  // NOTE B-RUN1: explicit field + assignment instead of a TS parameter property so the module
  // loads under Node native type-stripping (`--experimental-strip-types`) without a transform
  // step (HARNESS-SPEC §0). Semantically identical to `constructor(private readonly looRng)`.
  private readonly looRng: Rng;
  constructor(looRng: Rng) {
    this.looRng = looRng;
  }

  /** Fossil-derived + coarse-context feature vector for a case (no oracle, no posterior). */
  private features(cfg: LockedConfig, user: SyntheticUser, ctx: Context, family: FamilyId): number[] {
    const v: number[] = [];
    const tset = new Set<AxisId>(touchedAxes(cfg, family));
    for (const a of cfg.axes) v.push(profileMean(user, a.id) / 2); // coarse profile, scaled to [0,1]
    for (const a of cfg.axes) v.push(tset.has(a.id) ? 1 : 0); // which axes this family touches
    v.push(familyClassOf(cfg, family) === "safety" ? 1 : 0); // safety-class indicator
    v.push(subdomainOrd(ctx.subdomain) / 2); // coarse context
    v.push(genreOrd(ctx.genre) / 2);
    v.push(ctx.flow === "focused" ? 1 : 0);
    v.push(1); // bias
    return v;
  }

  fit(cfg: LockedConfig, trainCases: readonly ConsequenceCase[], users: readonly SyntheticUser[]): void {
    const byId = userMap(users);
    const all = trainCases.map((c) => {
      const u = byId.get(c.userId);
      if (u === undefined) throw new Error(`[baselines] user ${c.userId} missing for TRAIN case ${c.caseId}`);
      return { x: this.features(cfg, u, c.context, c.family), y: c.oracle.worthSurfacing as number, fam: c.family };
    });

    // Honest leave-one-(TRAIN-family)-out CV → pooled out-of-fold probs for threshold selection.
    const families = Array.from(new Set(all.map((s) => s.fam)));
    const oof: Scored[] = [];
    for (const f of families) {
      const trainSub = all.filter((s) => s.fam !== f);
      const testSub = all.filter((s) => s.fam === f);
      if (trainSub.length === 0 || testSub.length === 0) continue;
      const w = trainLogReg(trainSub.map((s) => s.x), trainSub.map((s) => s.y), this.looRng.fork(`loo:${f}`));
      for (const s of testSub) {
        const p = sigmoid(dot(w, s.x));
        oof.push({ score: p, label: (s.y === 1 ? 1 : 0) });
      }
    }
    this.threshold = oof.length > 0 ? tuneThreshold(oof) : 0.5;

    // Final predictive model: refit on ALL TRAIN cases.
    this.weights = all.length > 0 ? trainLogReg(all.map((s) => s.x), all.map((s) => s.y), this.looRng.fork("final")) : [];
  }

  decide(cfg: LockedConfig, user: SyntheticUser, cases: readonly ConsequenceCase[]): readonly MethodDecision[] {
    return cases.map((c) => {
      if (this.weights.length === 0) return { caseId: c.caseId, surface: 0 as SurfaceDecision, score: 0 };
      const p = sigmoid(dot(this.weights, this.features(cfg, user, c.context, c.family)));
      return decideByThreshold(c.caseId, p, this.threshold);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// (v) Factored model WITHOUT EIG/VoI — the ablation, the load-bearing falsifier (§3.5).
// SSI's IDENTICAL posterior (posterior.ts) + a Bayesian-surprise threshold tuned on TRAIN.
// NO EVSI gate, NO EIG ranking, NO turn budget, NO `EVSI=0 ⇒ abstain`. (NOTES B6)
// ─────────────────────────────────────────────────────────────────────────────
class FactoredAblation implements Baseline {
  readonly id = "factored-ablation" as const;
  private threshold = Number.POSITIVE_INFINITY;

  /** SSI's S1 surprise: KL( P(Intent|C,c) ‖ P(Intent|c) ), via posterior.ts ONLY (§4.3). */
  private surprise(cfg: LockedConfig, user: SyntheticUser, ctx: Context, family: FamilyId): number {
    const base = factoredPosterior(cfg, user, ctx);
    const cond = consequenceConditioned(cfg, base, family, ctx);
    return klFactored(cond, base);
  }

  fit(cfg: LockedConfig, trainCases: readonly ConsequenceCase[], users: readonly SyntheticUser[]): void {
    const byId = userMap(users);
    const data: Scored[] = trainCases.map((c) => {
      const u = byId.get(c.userId);
      if (u === undefined) throw new Error(`[baselines] user ${c.userId} missing for TRAIN case ${c.caseId}`);
      return { score: this.surprise(cfg, u, c.context, c.family), label: c.oracle.worthSurfacing };
    });
    this.threshold = tuneThreshold(data);
  }

  decide(cfg: LockedConfig, user: SyntheticUser, cases: readonly ConsequenceCase[]): readonly MethodDecision[] {
    return cases.map((c) => decideByThreshold(c.caseId, this.surprise(cfg, user, c.context, c.family), this.threshold));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factories + the full ladder (HARNESS-SPEC §9)
// ─────────────────────────────────────────────────────────────────────────────

/** §3.1 (i) silent Route-2 — never surfaces. */
export function makeSilentRoute2(): Baseline {
  return new SilentRoute2();
}
/** §3.2 (ii) generic linter — best fixed user-independent family rule, tuned on TRAIN. */
export function makeGenericLinter(): Baseline {
  return new GenericLinter();
}
/** §3.3 (iii) user-aware heuristic — strong profile + coarse-context, tuned threshold. */
export function makeUserHeuristic(): Baseline {
  return new UserHeuristic();
}
/** §3.4 (iv) leave-one-consequence-out classifier on fossils (LOO nested inside the §5.2 wall). */
export function makeLooClassifier(looRng: Rng): Baseline {
  return new LooClassifier(looRng);
}
/** §3.5 (v) factored model WITHOUT EIG/VoI — SSI's posterior + surprise threshold (the falsifier). */
export function makeFactoredAblation(): Baseline {
  return new FactoredAblation();
}

/** The full five-baseline ladder, in registered order (§3.1→§3.5). */
export function allBaselines(_cfg: LockedConfig, looRng: Rng): readonly Baseline[] {
  return [
    makeSilentRoute2(),
    makeGenericLinter(),
    makeUserHeuristic(),
    makeLooClassifier(looRng),
    makeFactoredAblation(),
  ];
}
