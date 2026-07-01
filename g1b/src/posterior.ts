// src/posterior.ts — G1B Falsifier shared belief core (HARNESS-SPEC §7 / PRE-REGISTRATION §4.1–§4.3, §4.6, §4.7).
//
// The closed-form Bayesian belief math shared by BOTH the method under test (SSI, src/ssi.ts)
// and the value-ablation baseline (baseline v, src/baselines.ts), so the §3.5 ablation differs
// ONLY in the EIG/VoI machinery layered on top of this identical posterior core. [ARCH][GATE]
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules (NodeNext `.js` import specifiers),
// no `any` in public signatures, IEEE-754 `number`, and NATURAL-LOG NATS for every
// information quantity (KL and entropy). This module consumes NO randomness and reads NO
// global state — every registered constant arrives through the injected `LockedConfig`.
//
// Invariants honored (HARNESS-SPEC §7 [GATE], PRE-REGISTRATION §4):
//   • klAxis(p,q) ≥ 0 and klAxis(p,p) = 0 exactly (untouched/identical factors return 0).
//   • 0 ≤ entropyAxis(p) ≤ ln 3 (3-level distribution).
//   • Posteriors are always proper: alphaBase = 1.0 (§4.1) and registered skews keep every
//     Dirichlet parameter strictly positive, so normalization never divides by zero.
//   • Factor-additivity of KL / entropy is exact under the factored model (§4.3/§4.6):
//     untouched axes (P(·|C,c) === P(·|c)) contribute EXACTLY 0 to klFactored (§4.2).
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no new parameters; every constant comes from CONFIG):
//
//   P1. Prior skews are ADDITIVE pseudo-counts (config.ts NOTES C7): the §4.1 prior is the
//       symmetric Dirichlet α^0_{a,c,k} = alphaBase, plus the registered §2.3 axis×context
//       skew vector for every contextSkews entry whose `axis` matches and whose
//       `conditionedOn` context variable equals the given context's level. Resulting α is kept
//       strictly positive (registered skews keep the minimum ≥ 0.7; a tiny floor MIN_ALPHA
//       guards the literal §4.1 "keeps every posterior proper" requirement without altering any
//       registered value).
//
//   P2. Posterior conditioning bucket is c = (subdomain | genre) per §4.7 (`bucketOf`). Fossil
//       COUNTS are bucketed by (subdomain, genre); the PRIOR may still be conditioned on
//       X_flow, but ONLY through the registered A_interrupt × X_flow skew (§2.3/§4.7 "X_flow
//       enters only the A_interrupt × X_flow coupling"). `factoredPosterior` therefore applies
//       any flow-conditioned skew to the interrupt axis' prior while still counting fossils in
//       the (subdomain, genre) bucket — exactly the §4.7 split.
//
//   P3. Context-modulation of the consequence likelihood (§2.4/§4.2) is implemented as
//       EXPONENTIATION by the registered per-bucket multiplier m = bucketMod[bucket] (default
//       1.0): L_mod(C|a=k,x) = L(C|a=k)^m. This is the only interpretation under which a
//       per-bucket SCALAR is meaningful for a posterior update — a uniform multiplicative
//       scalar cancels in the normalizer Z and would have NO effect. Exponentiation gives the
//       registered semantics directly: m = 1 leaves L unchanged; m < 1 FLATTENS L toward
//       uniform (a "benign / less-informative" consequence, e.g. inharmonic-artifact in
//       synthesis|lofi at 0.5); m > 1 SHARPENS L (a "harsh / more-informative" consequence,
//       e.g. inharmonic-artifact in mastering|clean-pop at 1.8). Flat axes (L = [1,1,1]) are
//       fixed points of exponentiation (1^m = 1), so untouched axes stay untouched.
//
//   P4. consequenceConditioned updates ONLY axes in the family's `touchedAxes` set; every
//       other axis re-uses the SAME AxisPosterior reference from `base`, so the KL term for
//       that factor is p_k·ln(p_k/p_k) = 0 EXACTLY (the ratio is the literal 1.0), satisfying
//       the §4.2 "untouched axes contribute zero to the surprise" invariant bit-exactly.
//
//   P5. KL and entropy use the standard limit convention 0·ln(·) = 0 (a zero-probability
//       level contributes nothing). q_k > 0 is guaranteed by P1 (proper posteriors), so KL
//       never sees ln(p/0). KL is returned as computed (mathematically ≥ 0); it is NOT clamped,
//       to stay honest — klAxis(p,p) is already 0 exactly by P4.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AxisId,
  AxisPosterior,
  Context,
  ContextBucketKey,
  DirichletParams,
  FactoredPosterior,
  FamilyId,
  Fossil,
  LockedConfig,
  SyntheticUser,
} from "./types.js";

// Strictly-positive floor that guards normalization (P1). Registered §2.3 skews never push a
// Dirichlet parameter this low (min observed ≈ 0.7), so this only documents the invariant.
const MIN_ALPHA = 1e-12;
const K = 3 as const; // every axis is K_a = 3 levels (§2.1)

// ── §4.7 context-conditioning key: c = (X_subdomain, X_genre). X_flow is excluded here and
//    enters only the registered A_interrupt × X_flow skew (P2). ──
export function bucketOf(ctx: Context): ContextBucketKey {
  return `${ctx.subdomain}|${ctx.genre}`;
}

// ── §4.1 fossil counts → Dirichlet evidence counts for one (axis, context bucket). ──
// `_cfg` is part of the locked signature (HARNESS-SPEC §7) but counting needs no registered
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
    if (bucketOf(f.context) !== bucket) continue;
    n[f.observedLevel] += 1;
  }
  return n;
}

// ── §4.1 registered, context-conditioned symmetric Dirichlet prior α^0_{a,c} (P1/P2). ──
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

// ── §4.1 conjugate Dirichlet posterior parameters: α = α^0 + n. ──
export function dirichletPosterior(prior: DirichletParams, counts: DirichletParams): DirichletParams {
  return [prior[0] + counts[0], prior[1] + counts[1], prior[2] + counts[2]];
}

// ── §4.1 Dirichlet posterior MEAN P(axis = k | ·) = α_k / Σ_j α_j. ──
export function normalize(alpha: DirichletParams): AxisPosterior {
  const s = alpha[0] + alpha[1] + alpha[2];
  // s > 0 since every α_k ≥ MIN_ALPHA > 0 (P1).
  return [alpha[0] / s, alpha[1] / s, alpha[2] / s];
}

// ── §4.1 the factored, context-conditioned posterior P(Intent | context c) — the per-axis
//    product belief. Each axis: registered prior (P1/P2) + bucketed fossil counts, normalized. ──
export function factoredPosterior(
  cfg: LockedConfig,
  user: SyntheticUser,
  ctx: Context,
): FactoredPosterior {
  const bucket = bucketOf(ctx);
  const out = {} as Record<AxisId, AxisPosterior>;
  for (const ax of cfg.axes) {
    const prior = buildPrior(cfg, ax.id, ctx);
    const counts = countFossils(cfg, user.fossils, ax.id, bucket);
    out[ax.id] = normalize(dirichletPosterior(prior, counts));
  }
  return out;
}

// ── §4.2 consequence-conditioned posterior P(axis | C, context c) by one Bayesian update per
//    TOUCHED axis: P(a=k|C,c) ∝ L_mod(C|a=k,x) · P(a=k|c). Untouched axes are copied by
//    reference so they contribute EXACTLY 0 to klFactored (P3/P4). ──
export function consequenceConditioned(
  cfg: LockedConfig,
  base: FactoredPosterior,
  family: FamilyId,
  ctx: Context,
): FactoredPosterior {
  const sig = cfg.families.find((f) => f.family === family);
  if (sig === undefined) {
    throw new Error(`[posterior] no registered likelihood signature for family '${family}' (§2.4)`);
  }
  const mod = sig.bucketMod?.[bucketOf(ctx)] ?? 1.0; // §2.4 context-modulation exponent (P3)
  const touched = new Set<AxisId>(sig.touchedAxes);
  const out = {} as Record<AxisId, AxisPosterior>;
  for (const ax of cfg.axes) {
    const id = ax.id;
    const prior = base[id];
    if (!touched.has(id)) {
      out[id] = prior; // untouched ⇒ identical reference ⇒ KL factor is 0 exactly (P4)
      continue;
    }
    const L = sig.L[id];
    const u0 = Math.pow(L[0], mod) * prior[0];
    const u1 = Math.pow(L[1], mod) * prior[1];
    const u2 = Math.pow(L[2], mod) * prior[2];
    const Z = u0 + u1 + u2;
    // Z > 0: every L_k > 0 (registered weights ∈ [0.4, 2.2]) and every prior_k > 0 (P1).
    out[id] = Z > 0 ? [u0 / Z, u1 / Z, u2 / Z] : prior;
  }
  return out;
}

// ── §4.3 per-axis KL divergence KL(p ‖ q) = Σ_k p_k ln(p_k / q_k), nats. ──
// 0·ln(·) = 0 convention (P5); q_k > 0 guaranteed by proper posteriors.
export function klAxis(p: AxisPosterior, q: AxisPosterior): number {
  let s = 0;
  for (let k = 0; k < K; k++) {
    const pk = p[k];
    if (pk > 0) s += pk * Math.log(pk / q[k]);
  }
  return s;
}

// ── §4.3 factor-additive KL over the product posterior: Σ_axis klAxis. Untouched axes give
//    p[id] === q[id] ⇒ klAxis = 0 exactly, so they drop out of the sum bit-exactly (P4). ──
export function klFactored(p: FactoredPosterior, q: FactoredPosterior): number {
  let s = 0;
  for (const id of Object.keys(p) as AxisId[]) {
    s += klAxis(p[id], q[id]);
  }
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

// ── §4.6 factor-additive entropy over the product posterior: Σ_axis entropyAxis. ──
export function entropyFactored(p: FactoredPosterior): number {
  let h = 0;
  for (const id of Object.keys(p) as AxisId[]) {
    h += entropyAxis(p[id]);
  }
  return h;
}
