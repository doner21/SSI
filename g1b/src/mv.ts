// src/mv.ts — G1B-MV model-validity sub-gate (HARNESS-SPEC §12 / PRE-REGISTRATION §8).
//
// G1B-MV tests whether SSI's FACTORED independence assumption (§4.1) is adequate against the
// deliberately-correlated, context-conditioned generative truth (§2.3). It is a HYPOTHESIS the
// build can be forced to abandon, NOT an assumption — so this gate runs REGARDLESS of the H1
// outcome (§8.3) and, if it fires, forces a coupled re-run or a claim reduction before any PASS.
//
// Two locked components, combined by one locked verdict:
//   §8.1  PPC      — posterior-predictive check of an interaction-sensitive discrepancy
//                    (`T_assoc`) drawn off the registered `"ppc"` sub-stream (independent of the
//                    `"evaluation"` stream). Factored model is PPC-adequate iff p_PPC ∈ [0.05,0.95].
//   §8.2  ELPD     — leave-one-fossil-out predictive comparison of three belief models
//                    (factored / sparse-pairwise / hierarchical) off the registered `"loo"`
//                    sub-stream. Interactions are MATERIAL iff max(ΔELPD) ≥ τ_MV=0.02 nats/obs
//                    AND ΔELPD_best / SE_best ≥ 4.
//   §8.3  verdict  — MV-FORCE-COUPLE iff material OR PPC inadequate, else MV-ADEQUATE.
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules (NodeNext `.js` import specifiers), no
// `any` in public signatures, IEEE-754 `number`, NATURAL-LOG NATS for every log-density. The
// ONLY randomness permitted is the INJECTED `ppcRng` / `looRng` streams — there is NO
// `Math.random`. Every registered constant arrives through the injected `LockedConfig`; no new
// parameter beyond PRE-REGISTRATION §9.4 is introduced.
//
// All comparisons use the SAME fossils SSI consumes (§8 preamble); no held-out *consequence*
// labels are ever touched — this is purely a model-of-the-fossils comparison inside the §5.2 wall.
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no new §9.4 parameters introduced):
//
//   MV1. T_assoc estimator (§8.1 is "e.g. mean abs Cramér's-V / NMI"). A G1B fossil records ONE
//        axis per episode, so two axes are never co-observed in a single fossil; the only honest
//        within-set co-occurrence is to PAIR, inside each context bucket (§4.7 c = subdomain|genre),
//        the ordered sequence of axis-A observations with the ordered sequence of axis-B
//        observations (truncated to the common length, in fossil order) into a 3×K contingency
//        table, then take **Cramér's V** of that table. `T_assoc` = Σ over the three registered
//        §2.3 pairs of |V|. For the axis×context pair (A_interrupt × X_flow) the partner column is
//        the fossil's own `context.flow` (a 2-level variable), giving a 3×2 table. Cramér's V ∈
//        [0,1] is deterministic, scale-free, and defined for these small tables. The pairing
//        STRUCTURE (which contexts/axes, and the index order) is identical for observed and
//        replicated sets (only `observedLevel` is re-drawn under replication), so the PPC
//        comparison is fair: independence-drawn replicas can only LOWER residual association.
//
//   MV2. PPC replication (§8.1 "draw replicated fossil sets from the fitted factored posterior").
//        For each user we keep the observed (context, axis) skeleton and RE-DRAW each fossil's
//        `observedLevel` from the user's FITTED factored posterior marginal P(axis | context)
//        (§4.1, via `factoredPosterior`) — i.e. exactly the model whose adequacy is under test.
//        `T_assoc` is computed per user and POOLED (summed) across users (§8.1 "pooled"); the
//        gate uses the pooled p-value `p_PPC = Pr(T_assoc(rep) ≥ T_assoc(obs))` over B_ppc=2000
//        replications. Per-replication draws pull sequentially (fixed user→fossil order) off a
//        per-replication fork of `ppcRng`, so the result is reproducible and order-stable.
//
//   MV3. Three belief models for §8.2 ELPD (all on the SAME fossils, leave-one-fossil-out):
//        • M-fac  — the §4.1 factored, context-conditioned product of per-axis Dirichlets
//                   (SSI's model); predictive = `factoredPosterior(reducedUser, ctx)[axis][level]`.
//        • M-pair — M-fac TILTED by a log-linear coupled term on EXACTLY the registered §2.3
//                   pairs (§8.2 "a log-linear / coupled-Dirichlet term per registered pair").
//                   For a fossil on axis A whose registered partner has estimated level t (the
//                   partner axis' factored mean on the reduced user, or `context.flow` for the
//                   axis×context pair), q_k ∝ p_k · exp(strength · affinity_sign(k,t)). For sign
//                   +1 affinity favours co-levels (−|k−t|); for sign −1 it favours mirrored
//                   levels (−|k−(2−t)|). `strength` is the registered coupling magnitude — NO new
//                   parameter. When the truth couples the pair this strictly improves held-out
//                   prediction ⇒ positive ΔELPD_pair.
//        • M-hier — partial pooling: the per-axis prior is replaced by the POPULATION marginal
//                   (pooled across all users, leave-the-one-fossil-out) at total concentration
//                   3·alphaBase (so its prior mass equals M-fac's symmetric [1,1,1] total — the
//                   ONLY constant reused is the registered `alphaBase`; no new parameter). This
//                   shrinks sparse per-user buckets toward the population ⇒ modest positive ΔELPD.
//
//   MV4. SE_best (§8.2 "registered paired standard error of ΔELPD_best across the pooled held-out
//        fossils") = sd(d_i)/√n where d_i = logPred_best,i − logPred_fac,i over the pooled
//        leave-one-fossil-out fossils (n−1 denominator, the standard paired SE of a mean). If
//        SE_best = 0 the reliability ratio is +∞ when ΔELPD_best > 0 and 0 otherwise — but the
//        size AND-clause still governs materiality.
//
//   MV5. Leave-one-fossil-out is EXHAUSTIVE (every fossil omitted exactly once) and therefore
//        deterministic; `looRng` is accepted for interface compliance and reproducible threading
//        (forked per model) but no result depends on a stochastic draw — there is nothing to
//        sample in the closed-form predictive densities. This keeps §8.2 "deterministic, seeded".
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AxisId,
  AxisLevel,
  AxisPosterior,
  Context,
  ContextBucketKey,
  CorrelatedPair,
  DirichletParams,
  Fossil,
  LockedConfig,
  SyntheticUser,
} from "./types.js";
import type { Rng } from "./prng.js";
import {
  bucketOf,
  countFossils,
  dirichletPosterior,
  factoredPosterior,
  normalize,
} from "./posterior.js";

export type MVVerdict = "MV-ADEQUATE" | "MV-FORCE-COUPLE";
export type BeliefModelId = "factored" | "sparse-pairwise" | "hierarchical";

export interface MVComparison {
  readonly dElpdPair: number; // ΔELPD_pair = (ELPD/obs)_pair − (ELPD/obs)_fac  (nats/fossil)
  readonly dElpdHier: number; // ΔELPD_hier = (ELPD/obs)_hier − (ELPD/obs)_fac (nats/fossil)
  readonly seBest: number; // registered paired SE of ΔELPD_best across pooled held-out fossils
  readonly material: boolean; // §8.2 size-AND-reliability materiality verdict
}

const K = 3 as const; // every axis is K_a = 3 levels (§2.1)
const LOG_FLOOR = 1e-12; // guards ln(0) in predictive densities (proper posteriors keep p>0)

// ─────────────────────────────────────────────────────────────────────────────
// §8.1 — interaction-sensitive discrepancy statistic T_assoc
// ─────────────────────────────────────────────────────────────────────────────

/** Map a context variable's level to a small-cardinality index for the contingency column. */
function flowIndex(ctx: Context): number {
  return ctx.flow === "focused" ? 1 : 0; // 2-level partner column for the axis×context pair (MV1)
}

/** Cramér's V of an r×c contingency table (counts). Returns 0 for degenerate (≤1 non-empty
 *  row/col or empty) tables. V ∈ [0,1]; deterministic. */
function cramersV(table: number[][]): number {
  const r = table.length;
  const c = r > 0 ? table[0].length : 0;
  if (r === 0 || c === 0) return 0;
  const rowSums = table.map((row) => row.reduce((a, b) => a + b, 0));
  const colSums: number[] = new Array(c).fill(0);
  let n = 0;
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      colSums[j] += table[i][j];
      n += table[i][j];
    }
  }
  if (n === 0) return 0;
  const nzRows = rowSums.filter((s) => s > 0).length;
  const nzCols = colSums.filter((s) => s > 0).length;
  const minDim = Math.min(nzRows, nzCols);
  if (minDim <= 1) return 0; // no association is defined with a single effective row or column
  let chi2 = 0;
  for (let i = 0; i < r; i++) {
    if (rowSums[i] === 0) continue;
    for (let j = 0; j < c; j++) {
      if (colSums[j] === 0) continue;
      const expected = (rowSums[i] * colSums[j]) / n;
      const diff = table[i][j] - expected;
      chi2 += (diff * diff) / expected;
    }
  }
  const v = Math.sqrt(chi2 / n / (minDim - 1));
  return v > 1 ? 1 : v; // numerical guard; Cramér's V is bounded by 1
}

/** Ordered observed-level sequences for an axis, grouped by context bucket (fossil order). */
function axisSeqByBucket(fossils: readonly Fossil[], axis: AxisId): Map<ContextBucketKey, AxisLevel[]> {
  const m = new Map<ContextBucketKey, AxisLevel[]>();
  for (const f of fossils) {
    if (f.axis !== axis) continue;
    const b = bucketOf(f.context);
    const arr = m.get(b);
    if (arr === undefined) m.set(b, [f.observedLevel]);
    else arr.push(f.observedLevel);
  }
  return m;
}

/** Pairwise association (Cramér's V) for one registered pair on a single fossil set (MV1). */
function pairAssociation(pair: CorrelatedPair, fossils: readonly Fossil[]): number {
  const a = pair.a;
  // axis×context pair (A_interrupt × X_flow): partner column is the fossil's own context.flow.
  if (pair.b === "flow") {
    const table: number[][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    for (const f of fossils) {
      if (f.axis !== a) continue;
      table[f.observedLevel][flowIndex(f.context)] += 1;
    }
    return cramersV(table);
  }
  // axis×axis pair: pair A-observations with B-observations inside each shared context bucket,
  // by index (fossil order), into a 3×3 co-occurrence table (MV1).
  const b = pair.b as AxisId;
  const seqA = axisSeqByBucket(fossils, a);
  const seqB = axisSeqByBucket(fossils, b);
  const table: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (const [bucket, listA] of seqA) {
    const listB = seqB.get(bucket);
    if (listB === undefined) continue;
    const m = Math.min(listA.length, listB.length);
    for (let i = 0; i < m; i++) table[listA[i]][listB[i]] += 1;
  }
  return cramersV(table);
}

/** §8.1 T_assoc(cfg, fossils): summed |pairwise association| over the registered §2.3 pairs. */
export function tAssoc(cfg: LockedConfig, fossils: readonly Fossil[]): number {
  let s = 0;
  for (const pair of cfg.correlatedPairs) s += Math.abs(pairAssociation(pair, fossils));
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// §8.1 — posterior-predictive check (PPC) off the injected "ppc" stream
// ─────────────────────────────────────────────────────────────────────────────

/** Cache the user's fitted factored posterior marginals per distinct context (skews depend on
 *  the full context, not only the bucket). Keyed by `subdomain|genre|flow`. */
function postCacheKey(ctx: Context): string {
  return `${ctx.subdomain}|${ctx.genre}|${ctx.flow}`;
}

/** Draw a level in {0,1,2} from a posterior vector via the injected stream (inverse-CDF). */
function drawLevel(rng: Rng, p: AxisPosterior): AxisLevel {
  const u = rng.nextUnit();
  let acc = 0;
  for (let k = 0; k < K; k++) {
    acc += p[k];
    if (u < acc) return k as AxisLevel;
  }
  return 2;
}

/**
 * §8.1 PPC on T_assoc: pooled posterior-predictive p-value `p_PPC = Pr(T_rep ≥ T_obs)` over
 * `ppcReplications` replications drawn off the injected `ppcRng` (independent of `"evaluation"`).
 * Replicas keep each user's (context, axis) skeleton and re-draw observed levels from the fitted
 * factored posterior (MV2). PPC-adequate iff `p_PPC ∈ ppcAdequateBand` ([0.05, 0.95]).
 */
export function ppcCheck(
  cfg: LockedConfig,
  users: readonly SyntheticUser[],
  ppcRng: Rng,
): { pPPC: number; adequate: boolean } {
  // Observed pooled T_assoc and per-user fitted posterior caches.
  let tObs = 0;
  const caches: Array<Map<string, Record<AxisId, AxisPosterior>>> = [];
  for (const user of users) {
    tObs += tAssoc(cfg, user.fossils);
    const cache = new Map<string, Record<AxisId, AxisPosterior>>();
    for (const f of user.fossils) {
      const key = postCacheKey(f.context);
      if (!cache.has(key)) cache.set(key, factoredPosterior(cfg, user, f.context));
    }
    caches.push(cache);
  }

  const B = cfg.ppcReplications;
  let geCount = 0;
  for (let rep = 0; rep < B; rep++) {
    const repRng = ppcRng.fork(rep); // per-replication stream; sequential pulls below (MV2)
    let tRep = 0;
    for (let u = 0; u < users.length; u++) {
      const user = users[u];
      const cache = caches[u];
      const replicated: Fossil[] = user.fossils.map((f) => {
        const marg = cache.get(postCacheKey(f.context))![f.axis];
        return { context: f.context, axis: f.axis, observedLevel: drawLevel(repRng, marg) };
      });
      tRep += tAssoc(cfg, replicated);
    }
    if (tRep >= tObs) geCount += 1;
  }
  const pPPC = B > 0 ? geCount / B : 1;
  const [lo, hi] = cfg.ppcAdequateBand;
  const adequate = pPPC >= lo && pPPC <= hi;
  return { pPPC, adequate };
}

// ─────────────────────────────────────────────────────────────────────────────
// §8.2 — three belief models + leave-one-fossil-out ELPD comparison
// ─────────────────────────────────────────────────────────────────────────────

/** Σ_k k·p_k → nearest level (quantized partner estimate for the coupled term, MV3). */
function quantMean(p: AxisPosterior): AxisLevel {
  const m = p[0] * 0 + p[1] * 1 + p[2] * 2;
  const r = Math.round(m);
  return (r < 0 ? 0 : r > 2 ? 2 : r) as AxisLevel;
}

/** Population (pooled-across-users) Dirichlet-mean marginal at (axis, bucket), leaving out one
 *  fossil's contribution (MV3, M-hier). Symmetric alphaBase prior, total mass 3·alphaBase. */
function populationMarginal(
  cfg: LockedConfig,
  users: readonly SyntheticUser[],
  axis: AxisId,
  bucket: ContextBucketKey,
  omit: { userId: number; level: AxisLevel } | null,
): AxisPosterior {
  const n: [number, number, number] = [0, 0, 0];
  for (const user of users) {
    const c = countFossils(cfg, user.fossils, axis, bucket);
    n[0] += c[0];
    n[1] += c[1];
    n[2] += c[2];
  }
  if (omit !== null) n[omit.level] -= 1; // leave-the-one-fossil-out at the population level
  const a: DirichletParams = [cfg.alphaBase + n[0], cfg.alphaBase + n[1], cfg.alphaBase + n[2]];
  return normalize(a);
}

/** A copy of `user` with fossil at `idx` removed (leave-one-fossil-out reduced evidence). */
function withoutFossil(user: SyntheticUser, idx: number): SyntheticUser {
  return { id: user.id, theta: user.theta, fossils: user.fossils.filter((_, i) => i !== idx) };
}

/** The registered partner of `axis` (if any) and the association sign, from §2.3 pairs. */
function partnerOf(
  cfg: LockedConfig,
  axis: AxisId,
): { partner: AxisId | "flow"; sign: -1 | 1; strength: number } | null {
  for (const p of cfg.correlatedPairs) {
    if (p.a === axis) return { partner: p.b as AxisId | "flow", sign: p.sign, strength: p.strength };
    if (p.b === axis) return { partner: p.a, sign: p.sign, strength: p.strength };
  }
  return null;
}

/** Coupled (M-pair) predictive vector: tilt the factored marginal `p` toward partner level `t`
 *  with a log-linear term of registered `strength` and `sign` (MV3). */
function coupledVector(p: AxisPosterior, sign: -1 | 1, strength: number, t: AxisLevel): AxisPosterior {
  const target = sign === 1 ? t : (2 - t); // +1 favours co-levels; −1 favours mirrored levels
  const w: [number, number, number] = [0, 0, 0];
  let z = 0;
  for (let k = 0; k < K; k++) {
    const affinity = -Math.abs(k - target); // log-linear coupling kernel (0 at target, −1, −2)
    w[k] = p[k] * Math.exp(strength * affinity);
    z += w[k];
  }
  if (!(z > 0)) return p;
  return [w[0] / z, w[1] / z, w[2] / z];
}

/** Predictive probability of one held-out fossil under a given belief model (MV3). */
function predictiveProb(
  cfg: LockedConfig,
  model: BeliefModelId,
  users: readonly SyntheticUser[],
  userIdx: number,
  fossilIdx: number,
): number {
  const user = users[userIdx];
  const f = user.fossils[fossilIdx];
  const ctx: Context = f.context;
  const bucket = bucketOf(ctx);
  const reduced = withoutFossil(user, fossilIdx);

  if (model === "hierarchical") {
    // Partial pooling: per-axis prior = population marginal (LOO) at total mass 3·alphaBase.
    const pop = populationMarginal(cfg, users, f.axis, bucket, { userId: user.id, level: f.observedLevel });
    const mass = K * cfg.alphaBase;
    const prior: DirichletParams = [mass * pop[0], mass * pop[1], mass * pop[2]];
    const counts = countFossils(cfg, reduced.fossils, f.axis, bucket);
    const post = normalize(dirichletPosterior(prior, counts));
    return clampProb(post[f.observedLevel]);
  }

  // M-fac and M-pair share the §4.1 factored marginal on the reduced user.
  const factored = factoredPosterior(cfg, reduced, ctx);
  if (model === "factored") return clampProb(factored[f.axis][f.observedLevel]);

  // M-pair: tilt by the registered coupled partner (if `f.axis` participates in a pair).
  const link = partnerOf(cfg, f.axis);
  let pred: AxisPosterior = factored[f.axis];
  if (link !== null) {
    const t: AxisLevel = link.partner === "flow" ? (flowIndex(ctx) as AxisLevel) : quantMean(factored[link.partner]);
    pred = coupledVector(pred, link.sign, link.strength, t);
  }
  return clampProb(pred[f.observedLevel]);
}

function clampProb(p: number): number {
  return p < LOG_FLOOR ? LOG_FLOOR : p;
}

/** Per-fossil leave-one-fossil-out log predictive densities (nats) for a model, pooled across
 *  users in fixed (user → fossil) order so the three models align fossil-for-fossil (MV4). */
function looLogPredPerFossil(
  cfg: LockedConfig,
  model: BeliefModelId,
  users: readonly SyntheticUser[],
  looRng: Rng,
): number[] {
  void looRng.fork(model); // thread the seeded stream for reproducibility; LOO is exhaustive (MV5)
  const out: number[] = [];
  for (let u = 0; u < users.length; u++) {
    const user = users[u];
    for (let i = 0; i < user.fossils.length; i++) {
      out.push(Math.log(predictiveProb(cfg, model, users, u, i)));
    }
  }
  return out;
}

/** §8.2 ELPD per fossil for one belief model: mean held-out log predictive density (nats/obs). */
export function elpdPerFossil(
  cfg: LockedConfig,
  model: BeliefModelId,
  users: readonly SyntheticUser[],
  looRng: Rng,
): number {
  const lp = looLogPredPerFossil(cfg, model, users, looRng);
  if (lp.length === 0) return 0;
  return lp.reduce((a, b) => a + b, 0) / lp.length;
}

/**
 * §8.2 model comparison: factored vs sparse-pairwise vs hierarchical via leave-one-fossil-out
 * ELPD. Returns ΔELPD over factored for both alternatives, the registered paired SE of the BEST
 * alternative, and the locked size-AND-reliability materiality verdict (MV4):
 *   material ⇔ max(ΔELPD) ≥ τ_MV (0.02) AND ΔELPD_best / SE_best ≥ mvReliabilitySE (4).
 */
export function compareModels(
  cfg: LockedConfig,
  users: readonly SyntheticUser[],
  looRng: Rng,
): MVComparison {
  const lpFac = looLogPredPerFossil(cfg, "factored", users, looRng);
  const lpPair = looLogPredPerFossil(cfg, "sparse-pairwise", users, looRng);
  const lpHier = looLogPredPerFossil(cfg, "hierarchical", users, looRng);
  const n = lpFac.length;

  const mean = (xs: number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
  const elpdFac = mean(lpFac);
  const dElpdPair = mean(lpPair) - elpdFac;
  const dElpdHier = mean(lpHier) - elpdFac;

  // Best alternative by ΔELPD; tie → pairwise (the registered default coupling, §5.3/§8.3a).
  const bestIsPair = dElpdPair >= dElpdHier;
  const lpBest = bestIsPair ? lpPair : lpHier;
  const dBest = bestIsPair ? dElpdPair : dElpdHier;

  // Paired SE of ΔELPD_best across the pooled held-out fossils: sd(d_i)/√n (MV4).
  let seBest = 0;
  if (n > 1) {
    const diffs = lpBest.map((v, i) => v - lpFac[i]);
    const dMean = mean(diffs);
    let ss = 0;
    for (const d of diffs) ss += (d - dMean) * (d - dMean);
    const variance = ss / (n - 1);
    seBest = Math.sqrt(variance / n);
  }

  const size = Math.max(dElpdPair, dElpdHier) >= cfg.tauMV;
  const ratio = seBest > 0 ? dBest / seBest : dBest > 0 ? Number.POSITIVE_INFINITY : 0;
  const reliable = ratio >= cfg.mvReliabilitySE;
  const material = size && reliable;

  return { dElpdPair, dElpdHier, seBest, material };
}

// ─────────────────────────────────────────────────────────────────────────────
// §8.3 — G1B-MV verdict
// ─────────────────────────────────────────────────────────────────────────────

/**
 * §8.3 verdict (locked): MV-FORCE-COUPLE iff interactions are MATERIAL (§8.2) OR the factored
 * model is PPC-inadequate (§8.1); otherwise MV-ADEQUATE. `cfg` is part of the locked signature
 * and accepted for shape-compatibility (the decision reads only the two locked sub-results).
 */
export function mvVerdict(
  _cfg: LockedConfig,
  ppc: { adequate: boolean },
  cmp: MVComparison,
): MVVerdict {
  return cmp.material || !ppc.adequate ? "MV-FORCE-COUPLE" : "MV-ADEQUATE";
}
