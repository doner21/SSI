// src-v2/posterior.ts — G1B Falsifier v2 shared belief core
// [v2 CHANGE (1)] sparse-pairwise-COUPLED, context-conditioned posterior
// (HARNESS-SPEC-v2 §7 / PRE-REGISTRATION-v2 §4.0, §4.1, §4.2, §4.3, §4.6).
//
// The closed-form Bayesian belief math shared by BOTH the method under test (SSI, src-v2/ssi.ts)
// and the EIG/VoI-ablation baseline (baseline v, src-v2/baselines.ts). All coupling lives HERE so
// that both consumers read the SAME upstream belief module — this is what preserves the clean
// EIG/VoI isolation of the SSI−ablation delta (§3.5, §9). [ARCH][GATE]
//
// [v2 CHANGE (1)] vs v1 (g1b/src/posterior.ts, carried verbatim except for this delta): v1's fully
// factored product of six per-axis Dirichlets is replaced by a PRODUCT OVER THE §4.0 COMPONENTS —
// a forest of disjoint components: two registered latent pairs as JOINT Dirichlets
//   P1 = {grit, routing},  P2 = {artifact, expertise}
// plus two singletons kept fully factored
//   {bright}      on the plain bucket key  c  = (subdomain | genre)          (§4.7)
//   {interrupt}   on the flow-extended key c⁺ = (subdomain | genre | flow)   (§4.0/§4.1)
// realizing the §2.3 A_interrupt × X_flow coupling as a conditioning key (not a latent edge).
// At lambdaCouple → 0 with empty co-counts each joint factorizes and the whole model recovers the
// v1 factored posterior exactly — coupling is a strict generalization, not a different world (§4.0).
//
// Discipline (HARNESS-SPEC-v2 §0): strict TS, ES modules (NodeNext `.js` import specifiers),
// no `any` in public signatures, IEEE-754 `number`, NATURAL-LOG NATS for every information
// quantity (KL and entropy). This module consumes NO randomness and reads NO global state — every
// registered constant arrives through the injected `LockedConfig`.
//
// Invariants honored (HARNESS-SPEC-v2 §7 [GATE], PRE-REGISTRATION-v2 §4):
//   • klAxis(p,q) ≥ 0, klJoint(p,q) ≥ 0, and kl*(p,p) = 0 exactly (untouched components return 0).
//   • 0 ≤ entropyAxis(p) ≤ ln 3 (3-level singleton); 0 ≤ entropyJoint(p) ≤ ln 9 (9-cell pair).
//   • Posteriors are always proper: alphaBase = 1.0 and bBase = 1.0 keep every Dirichlet / joint
//     Dirichlet parameter strictly positive, so no normalizer ever divides by zero (§4.1).
//   • Component-additivity of KL / entropy is exact under the product-over-components model
//     (§4.3 / §4.6): a component untouched by a consequence (P(·|C,c) === P(·|c)) contributes
//     EXACTLY 0 to klCoupled (it is copied by reference, so each cell ratio is the literal 1.0).
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no new parameters; every constant comes from CONFIG):
//
//   P1. Prior skews are ADDITIVE pseudo-counts (config NOTES C-series): the §4.1 per-axis prior
//       is the symmetric Dirichlet α^0 = alphaBase, plus the registered §2.3 axis×context skew for
//       every contextSkews entry whose `axis` matches and whose `conditionedOn` context level
//       equals the given context's level (this is also how the A_interrupt × X_flow skew enters
//       the {interrupt} singleton prior). A tiny floor MIN_ALPHA documents "keeps every posterior
//       proper" without altering any registered value (registered skews keep the min ≈ 0.7).
//
//   P2. Context-conditioning key c = (subdomain | genre) per §4.7 (`bucketOf`) for components
//       P1, P2, {bright}. The {interrupt} singleton uses the flow-extended key c⁺ =
//       (subdomain | genre | flow) (`flowBucketOf`), realizing the A_interrupt × X_flow coupling.
//       `countFossils` matches a fossil's bucket using the SAME keying as the requested bucket
//       (2 segments ⇒ plain c, 3 segments ⇒ flow-extended c⁺), so the v1 2-segment call is byte-
//       identical to v1 while the v2 3-segment call buckets {interrupt} fossils by flow too.
//
//   P3. Joint co-counts m_{p,c,(j,l)} (§4.1(b)) are read off the SAME fossils v1 consumed: a fossil
//       contributes to pair p's joint cell ONLY when it JOINTLY exercises both pair axes in one
//       episode (its `jointPartner` carries the partner axis level — the [v2 reading] of §2.3). A
//       single-axis fossil (no `jointPartner`, or a partner outside the pair) co-counts nothing.
//       With the v1-verbatim generative emitting single-axis episodes, m is empty and the joint is
//       prior-driven — exactly the registered design; countJoint implements the contract faithfully.
//
//   P4. Context-modulation of the consequence likelihood (§2.4/§4.2) is EXPONENTIATION by the
//       registered per-bucket multiplier m = bucketMod[c] (default 1.0): L_mod(C|·) = L(C|·)^m
//       (identical to v1; a uniform multiplicative scalar would cancel in the normalizer Z and have
//       no effect, so exponentiation is the only interpretation under which a per-bucket SCALAR is
//       meaningful). Flat axes (L = [1,1,1]) are fixed points (1^m = 1), so untouched axes — and
//       untouched pair dimensions — stay untouched.
//
//   P5. consequenceConditioned updates ONLY axes in the family's `touchedAxes` set. A SINGLETON not
//       touched re-uses the SAME AxisPosterior reference (KL factor = p_k·ln(p_k/p_k) = 0 exactly,
//       §4.2). A PAIR with NEITHER member touched re-uses the SAME JointPosterior reference (KL = 0
//       exactly). A pair with ONE member touched updates over all 9 joint cells using that member's
//       likelihood (the untouched member's L is flat ⇒ no direct effect), and the update correctly
//       PROPAGATES to the coupled partner through the joint normalizer (§4.2(b)).
//
//   P6. KL and entropy use the standard limit convention 0·ln(·) = 0. Every q-cell is > 0 (proper
//       posteriors, P1 + bBase=1), so KL never sees ln(p/0). KL is returned as computed
//       (mathematically ≥ 0); it is NOT clamped, to stay honest — kl*(p,p) is already 0 exactly (P5).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AxisId,
  AxisPosterior,
  Context,
  ContextBucketKey,
  CoupledPosterior,
  DirichletParams,
  FamilyId,
  FlowBucketKey,
  Fossil,
  JointDirichletParams,
  JointPosterior,
  LockedConfig,
  PairId,
  SyntheticUser,
} from "./types.js";

// Strictly-positive floor that guards per-axis normalization (P1). Registered §2.3 skews never push
// a Dirichlet parameter this low (min observed ≈ 0.7), so this only documents the invariant.
const MIN_ALPHA = 1e-12;
const K = 3 as const; // every axis is K_a = 3 levels (§2.1)
const KK = 9 as const; // K_a · K_b = 9 joint cells per registered pair (§4.0)
// The registered pair ids (§4.0). config.assertConfigInvariants asserts the component set is
// EXACTLY {P1, P2} + singletons{bright, interrupt}, so this fixed order is safe and deterministic.
const PAIR_IDS: readonly PairId[] = ["P1", "P2"];
// Flat per-axis likelihood: an untouched pair dimension contributes a factor of 1 to every cell.
const FLAT3: readonly [number, number, number] = [1.0, 1.0, 1.0];

// ── §4.7 context-conditioning key c = (X_subdomain, X_genre) for P1, P2, {bright}. ──
export function bucketOf(ctx: Context): ContextBucketKey {
  return `${ctx.subdomain}|${ctx.genre}`;
}

// ── [v2] §4.0/§4.1 flow-extended key c⁺ = (X_subdomain, X_genre, X_flow) for {interrupt}. ──
export function flowBucketOf(ctx: Context): FlowBucketKey {
  return `${ctx.subdomain}|${ctx.genre}|${ctx.flow}`;
}

// Does fossil `ctx` fall in `bucket`? Keying is inferred from the requested bucket so the v1 2-part
// call stays byte-identical while the v2 3-part call buckets {interrupt} fossils by flow too (P2).
function fossilInBucket(ctx: Context, bucket: string): boolean {
  // A 3-segment key is the flow-extended c⁺; a 2-segment key is the plain c.
  return bucket.indexOf("|") !== bucket.lastIndexOf("|")
    ? flowBucketOf(ctx) === bucket
    : bucketOf(ctx) === bucket;
}

// ── §4.1(a) fossil counts → per-axis Dirichlet evidence counts for one (axis, bucket). ──
// UNCHANGED from v1 except `fossilInBucket` admits the flow-extended key for {interrupt} (P2).
// `_cfg` is part of the locked signature (HARNESS-SPEC-v2 §7) but counting needs no registered
// constant; it is accepted for shape-compatibility and intentionally unread.
export function countFossils(
  _cfg: LockedConfig,
  fossils: readonly Fossil[],
  axis: AxisId,
  bucket: ContextBucketKey,
): DirichletParams {
  const n: [number, number, number] = [0, 0, 0];
  for (const f of fossils) {
    if (f.axis !== axis) continue;
    if (!fossilInBucket(f.context, bucket)) continue;
    n[f.observedLevel] += 1;
  }
  return n;
}

// ── §4.1(a) registered, context-conditioned symmetric per-axis Dirichlet prior α^0_{a,c} (P1). ──
function buildPrior(cfg: LockedConfig, axis: AxisId, ctx: Context): DirichletParams {
  const a: [number, number, number] = [cfg.alphaBase, cfg.alphaBase, cfg.alphaBase];
  for (const s of cfg.contextSkews) {
    if (s.axis !== axis) continue;
    // s.conditionedOn ∈ keyof Context; apply the skew only when this context's level matches.
    if (ctx[s.conditionedOn] !== s.level) continue;
    a[0] += s.skew[0];
    a[1] += s.skew[1];
    a[2] += s.skew[2];
  }
  return [Math.max(a[0], MIN_ALPHA), Math.max(a[1], MIN_ALPHA), Math.max(a[2], MIN_ALPHA)];
}

// ── §4.1(a) conjugate per-axis Dirichlet posterior parameters: α = α^0 + n. ──
export function dirichletPosterior(prior: DirichletParams, counts: DirichletParams): DirichletParams {
  return [prior[0] + counts[0], prior[1] + counts[1], prior[2] + counts[2]];
}

// ── §4.1(a) per-axis Dirichlet posterior MEAN P(axis = k | ·) = α_k / Σ_j α_j. ──
export function normalize(alpha: DirichletParams): AxisPosterior {
  const s = alpha[0] + alpha[1] + alpha[2];
  // s > 0 since every α_k ≥ MIN_ALPHA > 0 (P1).
  return [alpha[0] / s, alpha[1] / s, alpha[2] / s];
}

// ── [v2 CHANGE (1)] §4.1(b) joint co-counts m_{p,c,(j,l)} for one registered pair in one bucket. ──
// A fossil contributes ONLY if it jointly exercises BOTH pair axes in one episode (P3); the cell is
// row-major index = j*3 + l with j = level of the pair's FIRST member, l = level of the SECOND.
export function countJoint(
  cfg: LockedConfig,
  fossils: readonly Fossil[],
  pair: PairId,
  bucket: ContextBucketKey,
): JointDirichletParams {
  const [a, b] = cfg.coupledComponents.pairs[pair];
  const m = new Array<number>(KK).fill(0);
  for (const f of fossils) {
    const jp = f.jointPartner;
    if (jp === undefined) continue; // single-axis episode: co-counts nothing (P3)
    if (!fossilInBucket(f.context, bucket)) continue;
    let j: number;
    let l: number;
    if (f.axis === a && jp.axis === b) {
      j = f.observedLevel;
      l = jp.level;
    } else if (f.axis === b && jp.axis === a) {
      j = jp.level;
      l = f.observedLevel;
    } else {
      continue; // this episode does not exercise THIS registered pair
    }
    m[j * 3 + l] += 1;
  }
  return m;
}

// ── [v2 CHANGE (1)] §4.1(b) registered pairwise prior β^0_{p,(j,l)} = bBase + λ_couple·𝟙[(j,l)∈Concord_p]. ──
// At λ_couple = 0 the prior is exchangeable/uniform ⇒ marginals uniform ⇒ recovers the v1 factored
// prior exactly. With λ_couple = 2.0 it leans toward the §2.3-signed concordant cells.
export function jointPrior(cfg: LockedConfig, pair: PairId): JointDirichletParams {
  const concord = new Set<number>();
  for (const [j, l] of cfg.concord[pair]) concord.add(j * 3 + l);
  const beta = new Array<number>(KK);
  for (let idx = 0; idx < KK; idx++) {
    beta[idx] = cfg.bBase + (concord.has(idx) ? cfg.lambdaCouple : 0);
  }
  return beta;
}

// ── [v2 CHANGE (1)] §4.1(b) conjugate joint Dirichlet posterior parameters: β = β^0 + m. ──
export function jointPosterior(
  prior: JointDirichletParams,
  counts: JointDirichletParams,
): JointDirichletParams {
  const beta = new Array<number>(KK);
  for (let idx = 0; idx < KK; idx++) beta[idx] = prior[idx] + counts[idx];
  return beta;
}

// ── [v2 CHANGE (1)] §4.1(b) joint Dirichlet posterior MEAN over the 9 cells: β_ω / Σ β. ──
export function normalizeJoint(beta: JointDirichletParams): JointPosterior {
  let s = 0;
  for (let idx = 0; idx < KK; idx++) s += beta[idx];
  // s > 0 since every β_ω ≥ bBase > 0 (§4.1).
  const out = new Array<number>(KK);
  for (let idx = 0; idx < KK; idx++) out[idx] = beta[idx] / s;
  return out;
}

// ── [v2 CHANGE (1)] §4.1(c) assemble the coupled posterior = product over the §4.0 components. ──
// Pairs P1, P2 use the plain bucket key c; the flow-extended singleton ({interrupt}) uses c⁺ and the
// other singleton ({bright}) uses c. The named CoupledPosterior fields are filled by axis id.
export function coupledPosterior(
  cfg: LockedConfig,
  user: SyntheticUser,
  ctx: Context,
): CoupledPosterior {
  const cBucket = bucketOf(ctx);
  // (b) registered pairs → joint Dirichlet posteriors over 9 cells each.
  const pairs = {} as Record<PairId, JointPosterior>;
  for (const pid of PAIR_IDS) {
    const counts = countJoint(cfg, user.fossils, pid, cBucket);
    pairs[pid] = normalizeJoint(jointPosterior(jointPrior(cfg, pid), counts));
  }
  // (a) singletons → per-axis Dirichlet posteriors; flow-extended axis is keyed on c⁺ (P2).
  const cc = cfg.coupledComponents;
  const singleton = (axis: AxisId): AxisPosterior => {
    const bucket = axis === cc.flowExtendedAxis ? flowBucketOf(ctx) : cBucket;
    return normalize(dirichletPosterior(buildPrior(cfg, axis, ctx), countFossils(cfg, user.fossils, axis, bucket)));
  };
  return { pairs, interrupt: singleton("interrupt"), bright: singleton("bright") };
}

// ── §4.2 consequence-conditioned coupled posterior: a Bayesian update applied PER-AXIS INSIDE each
//    component. Singletons update like v1 (§4.2(a)); pairs update over the joint 9 cells so a touched
//    axis propagates to its coupled partner (§4.2(b)). Untouched components are copied by reference so
//    they contribute EXACTLY 0 to klCoupled (P5). ──
export function consequenceConditioned(
  cfg: LockedConfig,
  base: CoupledPosterior,
  family: FamilyId,
  ctx: Context,
): CoupledPosterior {
  const sig = cfg.families.find((f) => f.family === family);
  if (sig === undefined) {
    throw new Error(`[posterior] no registered likelihood signature for family '${family}' (§2.4)`);
  }
  const mod = sig.bucketMod?.[bucketOf(ctx)] ?? 1.0; // §2.4 context-modulation exponent (P4)
  const touched = new Set<AxisId>(sig.touchedAxes);
  const cc = cfg.coupledComponents;

  // (b) registered pairs: 9-cell update; neither member touched ⇒ copy by reference (KL = 0 exactly).
  const outPairs = {} as Record<PairId, JointPosterior>;
  for (const pid of PAIR_IDS) {
    const [a, b] = cc.pairs[pid];
    const joint = base.pairs[pid];
    if (!touched.has(a) && !touched.has(b)) {
      outPairs[pid] = joint; // untouched component ⇒ identical reference (P5)
      continue;
    }
    const La = touched.has(a) ? sig.L[a] : FLAT3; // untouched dimension ⇒ flat (factor 1)
    const Lb = touched.has(b) ? sig.L[b] : FLAT3;
    const u = new Array<number>(KK);
    let Z = 0;
    for (let j = 0; j < K; j++) {
      const wa = Math.pow(La[j], mod);
      for (let l = 0; l < K; l++) {
        const idx = j * 3 + l;
        const val = wa * Math.pow(Lb[l], mod) * joint[idx];
        u[idx] = val;
        Z += val;
      }
    }
    // Z > 0: every L_k > 0 (registered weights ∈ [0.4, 2.2]) and every joint cell > 0 (§4.1).
    if (Z > 0) {
      for (let idx = 0; idx < KK; idx++) u[idx] /= Z;
      outPairs[pid] = u;
    } else {
      outPairs[pid] = joint;
    }
  }

  // (a) singletons: per-axis update; untouched ⇒ identical reference (KL factor 0 exactly, P5).
  const singleton = (axis: AxisId, prior: AxisPosterior): AxisPosterior => {
    if (!touched.has(axis)) return prior;
    const L = sig.L[axis];
    const u0 = Math.pow(L[0], mod) * prior[0];
    const u1 = Math.pow(L[1], mod) * prior[1];
    const u2 = Math.pow(L[2], mod) * prior[2];
    const Z = u0 + u1 + u2;
    return Z > 0 ? [u0 / Z, u1 / Z, u2 / Z] : prior;
  };

  return {
    pairs: outPairs,
    interrupt: singleton("interrupt", base.interrupt),
    bright: singleton("bright", base.bright),
  };
}

// ── §4.3 per-axis KL divergence KL(p ‖ q) = Σ_k p_k ln(p_k / q_k), nats. 0·ln(·)=0 (P6). ──
export function klAxis(p: AxisPosterior, q: AxisPosterior): number {
  let s = 0;
  for (let k = 0; k < K; k++) {
    const pk = p[k];
    if (pk > 0) s += pk * Math.log(pk / q[k]);
  }
  return s;
}

// ── [v2 CHANGE (1)] §4.3 joint KL over a pair's 9 cells: Σ_ω p_ω ln(p_ω / q_ω), nats (P6). ──
export function klJoint(p: JointPosterior, q: JointPosterior): number {
  let s = 0;
  for (let idx = 0; idx < KK; idx++) {
    const pk = p[idx];
    if (pk > 0) s += pk * Math.log(pk / q[idx]);
  }
  return s;
}

// ── [v2 CHANGE (1)] §4.3 component-additive KL over the coupled posterior: Σ_components KL(component).
//    Untouched components have p === q (copied by reference, P5) ⇒ their KL is 0 exactly. ──
export function klCoupled(p: CoupledPosterior, q: CoupledPosterior): number {
  let s = 0;
  for (const pid of PAIR_IDS) s += klJoint(p.pairs[pid], q.pairs[pid]);
  s += klAxis(p.interrupt, q.interrupt);
  s += klAxis(p.bright, q.bright);
  return s;
}

// ── §4.6 per-axis Shannon entropy H(p) = −Σ_k p_k ln p_k, nats; range [0, ln 3]. ──
export function entropyAxis(p: AxisPosterior): number {
  let h = 0;
  for (let k = 0; k < K; k++) {
    const pk = p[k];
    if (pk > 0) h -= pk * Math.log(pk);
  }
  return h;
}

// ── [v2 CHANGE (1)] §4.6 joint Shannon entropy over a pair's 9 cells; range [0, ln 9]. ──
export function entropyJoint(p: JointPosterior): number {
  let h = 0;
  for (let idx = 0; idx < KK; idx++) {
    const pk = p[idx];
    if (pk > 0) h -= pk * Math.log(pk);
  }
  return h;
}

// ── [v2 CHANGE (1)] §4.6 component-additive entropy over the coupled posterior: Σ_components H. ──
export function entropyCoupled(p: CoupledPosterior): number {
  let h = 0;
  for (const pid of PAIR_IDS) h += entropyJoint(p.pairs[pid]);
  h += entropyAxis(p.interrupt);
  h += entropyAxis(p.bright);
  return h;
}

// ── [v2] marginalize a 9-cell joint to one of its two axes (for IR-tolerance views and the λ→0
//    limit test). which = 0 ⇒ the pair's FIRST member (sum over l); which = 1 ⇒ SECOND (sum over j). ──
export function marginalizeJoint(joint: JointPosterior, which: 0 | 1): AxisPosterior {
  const out: [number, number, number] = [0, 0, 0];
  for (let j = 0; j < K; j++) {
    for (let l = 0; l < K; l++) {
      const p = joint[j * 3 + l];
      if (which === 0) out[j] += p;
      else out[l] += p;
    }
  }
  return out;
}
