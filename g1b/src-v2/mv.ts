// src-v2/mv.ts — G1B-MV model-validity sub-gate (HARNESS-SPEC-v2 §12 / PRE-REGISTRATION-v2 §8).
//
// [v2 CHANGE (1)] MODEL-UNDER-TEST IS NOW M-cpl (the sparse-pairwise-coupled, context-conditioned
// posterior of §4.1 — SSI's v2 belief model). G1B-MV asks whether *that coupled model* is adequate
// against the deliberately-correlated, context-conditioned generative truth (§2.3). The coupled
// model is a HYPOTHESIS the build can be forced to abandon/extend, NOT an assumption — so this gate
// runs REGARDLESS of the H1 outcome (§8.3) and, if it fires, forces a richer-model re-run or a claim
// reduction before any PASS. The coupled model can STILL FAIL MV (anti-rigging): PPC can reject it,
// and a RICHER hierarchical model (M-hier) can be materially better.
//
// Two locked components, combined by one locked verdict:
//   §8.1  PPC      — posterior-predictive check of an interaction-sensitive discrepancy (`T_assoc`)
//                    drawn off the registered `"ppc"` sub-stream (independent of `"evaluation"`).
//                    [v2] replicas are drawn from the FITTED COUPLED model M-cpl. PPC-adequate iff
//                    p_PPC ∈ [0.05, 0.95].
//   §8.2  ELPD     — leave-one-fossil-out predictive comparison of three belief models off the
//                    registered `"loo"` sub-stream. [v2] the baseline is M-cpl; the alternatives are
//                    M-hier (richer — partial pooling) and M-fac (the v1 factored REFERENCE — a
//                    coupling-ablation showing whether the coupling was load-bearing):
//                       ΔELPD_hier = (ELPD/obs)_hier − (ELPD/obs)_cpl   ← richer than coupled?
//                       ΔELPD_fac  = (ELPD/obs)_fac  − (ELPD/obs)_cpl   ← coupling unnecessary? (reported)
//                    Interactions are MATERIAL iff ΔELPD_hier ≥ τ_MV = 0.02 nats/obs AND
//                    ΔELPD_hier / SE_hier ≥ 4.
//   §8.3  verdict  — MV-FORCE-COUPLE iff material (M-hier wins) OR PPC inadequate, else MV-ADEQUATE.
//
// Discipline (HARNESS-SPEC-v2 §0): strict TS, ES modules (NodeNext `.js` import specifiers), no
// `any` in public signatures, IEEE-754 `number`, NATURAL-LOG NATS for every log-density. The ONLY
// randomness permitted is the INJECTED `ppcRng` / `looRng` streams — there is NO `Math.random`.
// Every registered constant arrives through the injected `LockedConfig`; no new parameter beyond
// PRE-REGISTRATION-v2 §9.4 is introduced.
//
// All comparisons use the SAME fossils SSI consumes (§8 preamble); no held-out *consequence* labels
// are ever touched — this is purely a model-of-the-fossils comparison inside the §5.2 wall.
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no new §9.4 parameters introduced):
//
//   MV1. T_assoc estimator (§8.1 is "e.g. mean abs Cramér's-V / NMI"), CARRIED VERBATIM from v1.
//        A G1B fossil records ONE axis per episode, so two axes are never co-observed in a single
//        fossil; the only honest within-set co-occurrence is to PAIR, inside each context bucket
//        (§4.7 c = subdomain|genre), the ordered sequence of axis-A observations with the ordered
//        sequence of axis-B observations (truncated to common length, in fossil order) into a 3×K
//        contingency table, then take **Cramér's V**. `T_assoc` = Σ over the three registered §2.3
//        pairs of |V|. For the axis×context pair (A_interrupt × X_flow) the partner column is the
//        fossil's own `context.flow` (a 2-level variable), giving a 3×2 table. The pairing STRUCTURE
//        is identical for observed and replicated sets (only `observedLevel` is re-drawn under
//        replication), so the PPC comparison is fair.
//
//   MV2. [v2] PPC replication (§8.1 "draw replicated fossil sets from the fitted COUPLED posterior").
//        For each user we keep the observed (context, axis) skeleton and RE-DRAW each fossil's
//        `observedLevel` from the user's FITTED COUPLED posterior MARGINAL of that axis given context
//        (`coupledPosterior` → `coupledMarginal`) — i.e. exactly the model M-cpl whose adequacy is
//        under test. (For a paired axis the marginal is the axis-marginal of the 9-cell joint; for a
//        singleton it is the per-axis posterior.) `T_assoc` is computed per user and POOLED (summed)
//        across users; the gate uses the pooled p-value `p_PPC = Pr(T_assoc(rep) ≥ T_assoc(obs))`
//        over `B_ppc = 2000` replications. Per-replication draws pull sequentially (fixed
//        user→fossil order) off a per-replication fork of `ppcRng`, so the result is reproducible and
//        order-stable.
//
//   MV3. [v2] Three belief models for §8.2 ELPD (all on the SAME fossils, leave-one-fossil-out):
//        • M-cpl  — the §4.1 sparse-pairwise-coupled, context-conditioned model (SSI's v2 model;
//                   the BASELINE the deltas are measured against). Predictive of a single-axis fossil
//                   = the axis-marginal of `coupledPosterior(reducedUser, ctx)` (`coupledMarginal`).
//        • M-hier — partial pooling (the RICHER alternative that lets the coupled model still LOSE
//                   MV): the per-axis prior is replaced by the POPULATION marginal (pooled across all
//                   users, leave-the-one-fossil-out) at total concentration 3·alphaBase (so its prior
//                   mass equals a symmetric [1,1,1] total — the ONLY constant reused is the registered
//                   `alphaBase`; no new parameter). Shrinks sparse per-user buckets toward the
//                   population ⇒ can beat a model whose paired axes are prior-driven.
//        • M-fac  — the v1 fully-factored product of per-axis Dirichlets (now the coupling-ABLATION
//                   REFERENCE): predictive = `factoredAxisPosterior(reducedUser, ctx)[axis][level]`.
//                   ΔELPD_fac shows whether the coupling was load-bearing (M-cpl should beat M-fac if
//                   the coupling helps; otherwise the coupling itself is unnecessary). REPORTED, not
//                   gated. `factoredAxisPosterior` reproduces v1's `factoredPosterior` locally
//                   (v2 `posterior.ts` no longer exports it; it survives ONLY as this MV reference).
//
//   MV4. [v2] SE_hier (§8.2 "registered paired standard error of ΔELPD_hier across the pooled
//        held-out fossils") = sd(d_i)/√n where d_i = logPred_hier,i − logPred_cpl,i over the pooled
//        leave-one-fossil-out fossils (n−1 denominator, the standard paired SE of a mean). If
//        SE_hier = 0 the reliability ratio is +∞ when ΔELPD_hier > 0 and 0 otherwise — but the size
//        AND-clause still governs materiality. Materiality is judged on the HIERARCHICAL alternative
//        specifically (§8.2), so the coupled model can be forced to a RICHER model, never relaxed.
//
//   MV5. Leave-one-fossil-out is EXHAUSTIVE (every fossil omitted exactly once) and therefore
//        deterministic; `looRng` is accepted for interface compliance and reproducible threading
//        (forked per model) but no result depends on a stochastic draw — there is nothing to sample
//        in the closed-form predictive densities. This keeps §8.2 "deterministic, seeded".
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AxisId,
  AxisLevel,
  AxisPosterior,
  Context,
  ContextBucketKey,
  CorrelatedPair,
  CoupledPosterior,
  DirichletParams,
  Fossil,
  JointPosterior,
  LockedConfig,
  PairId,
  SyntheticUser,
} from "./types.js";
import type { Rng } from "./prng.js";
import {
  bucketOf,
  countFossils,
  coupledPosterior,
  dirichletPosterior,
  marginalizeJoint,
  normalize,
} from "./posterior.js";

export type MVVerdict = "MV-ADEQUATE" | "MV-FORCE-COUPLE";
// [v2] M-cpl (under test), M-hier (richer alternative), M-fac (factored reference / coupling ablation).
export type BeliefModelId = "coupled" | "hierarchical" | "factored";

export interface MVComparison {
  readonly dElpdHier: number; // ΔELPD_hier = (ELPD/obs)_hier − (ELPD/obs)_cpl (nats/fossil) — richer?
  readonly dElpdFac: number; // ΔELPD_fac  = (ELPD/obs)_fac  − (ELPD/obs)_cpl (nats/fossil) — coupling needed? (reported)
  readonly seHier: number; // registered paired SE of ΔELPD_hier across pooled held-out fossils (§8.2)
  readonly material: boolean; // §8.2 size-AND-reliability materiality verdict (on M-hier)
}

const K = 3 as const; // every axis is K_a = 3 levels (§2.1)
const LOG_FLOOR = 1e-12; // guards ln(0) in predictive densities (proper posteriors keep p>0)
// Strictly-positive floor mirroring posterior.ts MIN_ALPHA; registered §2.3 skews never approach it.
const MIN_ALPHA = 1e-12;

// ─────────────────────────────────────────────────────────────────────────────
// §8.1 — interaction-sensitive discrepancy statistic T_assoc (CARRIED VERBATIM from v1, MV1)
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
// [v2] coupled-posterior axis marginal — the M-cpl predictive of a single-axis fossil
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Axis-marginal P(axis = k | ·) of the FITTED COUPLED posterior (§4.1). Paired axes read the
 * axis-marginal of their 9-cell joint (`marginalizeJoint`); the two singletons read their per-axis
 * posterior directly. The pair member positions come from the registered `coupledComponents.pairs`
 * (P1 = [grit, routing], P2 = [artifact, expertise]) — no axis identity is hard-coded here. (MV2/MV3)
 */
function coupledMarginal(cfg: LockedConfig, post: CoupledPosterior, axis: AxisId): AxisPosterior {
  const cc = cfg.coupledComponents;
  for (const pid of Object.keys(cc.pairs) as PairId[]) {
    const [a, b] = cc.pairs[pid];
    if (axis === a) return marginalizeJoint(post.pairs[pid] as JointPosterior, 0);
    if (axis === b) return marginalizeJoint(post.pairs[pid] as JointPosterior, 1);
  }
  if (axis === "interrupt") return post.interrupt;
  if (axis === "bright") return post.bright;
  // Unreachable: assertConfigInvariants partitions all 6 axes across {P1,P2}+{bright,interrupt}.
  throw new Error(`[mv] axis '${axis}' is not covered by the registered coupled components (§4.0)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// §8.1 — posterior-predictive check (PPC) off the injected "ppc" stream
// ─────────────────────────────────────────────────────────────────────────────

/** Cache the user's fitted coupled posterior per distinct context (the {interrupt} singleton is
 *  flow-keyed, so we key on the full context). Keyed by `subdomain|genre|flow`. */
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
 * [v2] Replicas keep each user's (context, axis) skeleton and re-draw observed levels from the
 * fitted COUPLED posterior marginal M-cpl (MV2). PPC-adequate iff `p_PPC ∈ ppcAdequateBand`
 * ([0.05, 0.95]).
 */
export function ppcCheck(
  cfg: LockedConfig,
  users: readonly SyntheticUser[],
  ppcRng: Rng,
): { pPPC: number; adequate: boolean } {
  // Observed pooled T_assoc and per-user fitted COUPLED-posterior caches.
  let tObs = 0;
  const caches: Array<Map<string, CoupledPosterior>> = [];
  for (const user of users) {
    tObs += tAssoc(cfg, user.fossils);
    const cache = new Map<string, CoupledPosterior>();
    for (const f of user.fossils) {
      const key = postCacheKey(f.context);
      if (!cache.has(key)) cache.set(key, coupledPosterior(cfg, user, f.context));
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
        const post = cache.get(postCacheKey(f.context))!;
        const marg = coupledMarginal(cfg, post, f.axis); // M-cpl marginal of this fossil's axis
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

/** [v2] local v1-factored prior (registered symmetric α^0 + context skews), reproducing
 *  posterior.ts `buildPrior` — kept here because v2 `posterior.ts` no longer exports the v1 factored
 *  model; M-fac survives ONLY as this MV reference (MV3). */
function buildFactoredPrior(cfg: LockedConfig, axis: AxisId, ctx: Context): DirichletParams {
  const a: [number, number, number] = [cfg.alphaBase, cfg.alphaBase, cfg.alphaBase];
  for (const s of cfg.contextSkews) {
    if (s.axis !== axis) continue;
    if (ctx[s.conditionedOn] !== s.level) continue;
    a[0] += s.skew[0];
    a[1] += s.skew[1];
    a[2] += s.skew[2];
  }
  return [Math.max(a[0], MIN_ALPHA), Math.max(a[1], MIN_ALPHA), Math.max(a[2], MIN_ALPHA)];
}

/** [v2] one axis's v1-factored posterior marginal P(axis = k | ctx) on `user` (M-fac, MV3). Uses
 *  the plain bucket key for ALL axes, identical to v1 `factoredPosterior`. */
function factoredAxisPosterior(
  cfg: LockedConfig,
  user: SyntheticUser,
  ctx: Context,
  axis: AxisId,
): AxisPosterior {
  const prior = buildFactoredPrior(cfg, axis, ctx);
  const counts = countFossils(cfg, user.fossils, axis, bucketOf(ctx));
  return normalize(dirichletPosterior(prior, counts));
}

/** Population (pooled-across-users) Dirichlet-mean marginal at (axis, bucket), leaving out one
 *  fossil's contribution (MV3, M-hier). Symmetric alphaBase prior, total mass 3·alphaBase. */
function populationMarginal(
  cfg: LockedConfig,
  users: readonly SyntheticUser[],
  axis: AxisId,
  bucket: ContextBucketKey,
  omit: { level: AxisLevel } | null,
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
    const pop = populationMarginal(cfg, users, f.axis, bucket, { level: f.observedLevel });
    const mass = K * cfg.alphaBase;
    const prior: DirichletParams = [mass * pop[0], mass * pop[1], mass * pop[2]];
    const counts = countFossils(cfg, reduced.fossils, f.axis, bucket);
    const post = normalize(dirichletPosterior(prior, counts));
    return clampProb(post[f.observedLevel]);
  }

  if (model === "factored") {
    // M-fac reference: v1 per-axis factored marginal on the reduced user.
    return clampProb(factoredAxisPosterior(cfg, reduced, ctx, f.axis)[f.observedLevel]);
  }

  // M-cpl (model under test): the §4.1 coupled posterior's axis-marginal on the reduced user.
  const post = coupledPosterior(cfg, reduced, ctx);
  return clampProb(coupledMarginal(cfg, post, f.axis)[f.observedLevel]);
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
 * §8.2 model comparison: [v2] coupled (M-cpl, under test) vs hierarchical (M-hier, richer) vs
 * factored (M-fac, reference) via leave-one-fossil-out ELPD. Returns ΔELPD over the COUPLED model
 * for both alternatives, the registered paired SE of the HIERARCHICAL improvement, and the locked
 * size-AND-reliability materiality verdict (MV4):
 *   material ⇔ ΔELPD_hier ≥ τ_MV (0.02) AND ΔELPD_hier / SE_hier ≥ mvReliabilitySE (4).
 * Materiality is judged on M-hier specifically, so the coupled model can be forced to a RICHER
 * model (never relaxed). ΔELPD_fac is REPORTED (coupling load-bearing?), not gated.
 */
export function compareModels(
  cfg: LockedConfig,
  users: readonly SyntheticUser[],
  looRng: Rng,
): MVComparison {
  const lpCpl = looLogPredPerFossil(cfg, "coupled", users, looRng);
  const lpHier = looLogPredPerFossil(cfg, "hierarchical", users, looRng);
  const lpFac = looLogPredPerFossil(cfg, "factored", users, looRng);
  const n = lpCpl.length;

  const mean = (xs: number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
  const elpdCpl = mean(lpCpl);
  const dElpdHier = mean(lpHier) - elpdCpl;
  const dElpdFac = mean(lpFac) - elpdCpl;

  // Paired SE of ΔELPD_hier across the pooled held-out fossils: sd(d_i)/√n (MV4).
  let seHier = 0;
  if (n > 1) {
    const diffs = lpHier.map((v, i) => v - lpCpl[i]);
    const dMean = mean(diffs);
    let ss = 0;
    for (const d of diffs) ss += (d - dMean) * (d - dMean);
    const variance = ss / (n - 1);
    seHier = Math.sqrt(variance / n);
  }

  const size = dElpdHier >= cfg.tauMV;
  const ratio = seHier > 0 ? dElpdHier / seHier : dElpdHier > 0 ? Number.POSITIVE_INFINITY : 0;
  const reliable = ratio >= cfg.mvReliabilitySE;
  const material = size && reliable;

  return { dElpdHier, dElpdFac, seHier, material };
}

// ─────────────────────────────────────────────────────────────────────────────
// §8.3 — G1B-MV verdict
// ─────────────────────────────────────────────────────────────────────────────

/**
 * §8.3 verdict (locked): MV-FORCE-COUPLE iff residual interactions are MATERIAL (§8.2 — the richer
 * hierarchical model wins) OR the coupled model is PPC-inadequate (§8.1); otherwise MV-ADEQUATE.
 * `_cfg` is part of the locked signature and accepted for shape-compatibility (the decision reads
 * only the two locked sub-results).
 */
export function mvVerdict(
  _cfg: LockedConfig,
  ppc: { adequate: boolean },
  cmp: MVComparison,
): MVVerdict {
  return cmp.material || !ppc.adequate ? "MV-FORCE-COUPLE" : "MV-ADEQUATE";
}
