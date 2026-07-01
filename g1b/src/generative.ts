// src/generative.ts — G1B Falsifier synthetic ground-truth + oracle (HARNESS-SPEC §5; PRE-REG §2 all, §5.3).
//
// This module IS the synthetic universe SSI and the five baselines are scored against.
// Every quantity a method is measured on (the two oracle labels, the IR-selection oracle,
// the consequence cases) is DEFINED HERE from the generative truth (θ_u and context) — never
// from any method's output (§2.6 integrity). The module sits at the same dependency level as
// holdout.ts in the locked DAG (types → config → prng → {generative, holdout} → …), so it
// imports ONLY types.ts, config.ts and prng.ts. It does NOT import posterior.ts / ssi.ts /
// holdout.ts (HARNESS-SPEC §1 dependency direction; `generateCases` receives the already-built
// `HoldoutPartition` as a parameter rather than importing the wall).
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules (NodeNext → `.js` import specifiers),
// no `any` in public signatures, all randomness routed through the seeded `Rng` streams of
// §7.3 (NO `Math.random`), natural-log nats for any information quantity. Numbers are IEEE-754
// doubles. SSI's own decisions are seed-free; the seeds threaded here drive ONLY data
// generation (the `users`, `fitting-data`, `evaluation` streams of §7.3).
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no parameter NAME outside PRE-REG §9.4 /
//        the LockedConfig interface is introduced; the items below are generative
//        DETAILS the lock list does not enumerate, fixed here deterministically and
//        documented for the record):
//
//   G1. FOSSIL SAMPLE SIZE. §2.3 says each user has "a set of past episodes" and that
//       "fossil sampling has sampling noise so that fossils under-determine θ_u", but
//       §9.4 does not register a fossil count. We fix the per-user episode count
//       STRUCTURALLY as `EPISODES_PER_USER = 4 · |axes| = 24` so that, spread over 6
//       axes × (subdomain,genre) buckets, each (axis,bucket) receives only ~1–2 counts
//       — a genuinely finite-evidence regime where a Bayesian posterior and a point
//       heuristic can diverge (§2.3). It is NOT a tunable decision/test parameter; it is
//       tied to the locked axis set and is independent of every §9.4 threshold/weight.
//
//   G2. IR-SELECTION ORACLE (selectIR). §2.5/§4.5 register a "deterministic IR-selection
//       oracle: a fixed map from (constraint filter + convention ranking over the
//       candidate IRs, given the user's true tolerance) to a chosen IR". We operationalize
//       the candidate-IR space as the tuple of QUANTIZED effective tolerance levels on the
//       axes the family's signature touches (the axes "the IR-selection oracle actually
//       reads", §4.4): each touched axis contributes its effective level (0/1/2). The
//       constraint filter + convention ranking is the deterministic quantizer
//       (posterior/continuous tolerance → its nearest level; an explicit AxisLevel answer
//       is used verbatim). The IRId string encodes (family, touched-axis levels) so the
//       SAME oracle is shared by the §2.5 ground-truth label and by SSI/baseline-v EVSI
//       (§4.5) — exactly as the spec requires ("used by oracle labels AND by SSI/baseline-v").
//
//   G3. Value(IR) (irValue). §4.5 defines Value(IR) as "the registered task-value of
//       choosing IR measured under SSI's posterior". We score an IR against a belief by
//       expected match between the IR's chosen level and the belief over each touched
//       axis: Value = Σ_axis Σ_k belief(axis=k) · matchUtil(chosenLevel, k), with
//       matchUtil ordinal = 1 − |c−k|/2 (categorical = 1 if equal else 0). This is maximal
//       when the IR's choices match the belief's mode, and — crucially — depends on the IR
//       ONLY through its chosen levels, so when the answer cannot move the chosen IR the
//       EVSI difference is EXACTLY 0 (the §4.5 "EVSI = 0 ⇒ abstain" property), with no
//       floating-point slack.
//
//   G4. THE TWO ORACLE LABELS are computed by GENUINELY DIFFERENT operationalizations so
//       they are independent and CAN disagree in both directions (§2.5 integrity (b)):
//         • answer_changes_IR (the VoI label) = 1 iff IR*(true-θ tolerance) ≠
//           IR*(context-prior silent tolerance) — i.e. the QUANTIZED chosen IR flips
//           (§2.5 "the answer changes the IR iff the silent default and the user-informed
//           choice differ"). The "silent" tolerance is the context-conditioned PRIOR mean
//           (a function of context + CONFIG only — no method output), the "answered"
//           tolerance is the user's true θ_u.
//         • worth_surfacing = 1 iff the consequence (a) materially changes affordances
//           (`affordsChange`, §4.4 — its signature is non-flat on an axis the IR oracle
//           reads) AND (b) the user's true tolerance is UNCERTAIN/PIVOTAL: there is a
//           meaningful continuous mismatch (≥ 0.5 summed over touched axes) between true
//           θ_u and the context-prior default, AND the case is not in a "clearly tolerated"
//           corner (touched-axis true level at the tolerant extreme). Because one label is
//           a quantized-IR FLIP and the other is a continuous-mismatch-with-tolerance gate,
//           a consequence can be worth surfacing yet not change the IR (mismatch absorbed by
//           quantization) and can change the IR yet not be worth surfacing (clearly
//           tolerated corner) — the §2.5 distinctness the composite (§6) relies on.
//
//   G5. NEGATIVE-CONTROL cases (§2.5) are exactly those with worth_surfacing = 0 despite a
//       detected consequence; we set `oracle.negativeControl = (worthSurfacing === 0)`.
//
//   G6. NON-PRODUCT PRIOR (§2.3 / integrity (c)). θ_u is sampled with the three registered
//       couplings of §2.3 wired in: A_grit×A_routing (+: gritty → serial/send-return),
//       A_artifact×A_expertise (+: experts more artifact-tolerant). A_interrupt×X_flow is an
//       axis×CONTEXT coupling (§2.3 / types.ts N4) and so shapes the context-conditioned
//       fossil emission / prior, not the user-level θ vector. The qualitative directions are
//       the registered ones; the magnitude is read from `cfg.correlatedPairs[*].strength`.
//       The resulting joint is NOT a product of independent marginals — exactly the
//       mis-specification G1B-MV (§8) is built to detect.
//
//   G7. EVAL-SET COMPOSITION (§5.3). Registered category RATES (cfg.evalRates: not a
//       partition — they may overlap, NOTES C6 of config.ts) are realized as MINIMUM
//       guaranteed counts per user: nSafety = round(safetyFrac·casesPerUser), nNeg =
//       round(negativeControlFrac·casesPerUser), nPiv = round(pivotalFrac·casesPerUser),
//       and the remaining slots are balanced filler over held-out families/contexts. Each
//       slot draws (family, context) from the EVAL-eligible cells (held-out family OR
//       held-out context, §5.1) and re-draws until its predicate holds (bounded attempts,
//       then accepts the last draw so the exact `casesPerUser` count and determinism are
//       guaranteed). Categories may be additionally satisfied incidentally by filler.
//
//   G8. TRAIN cells are restricted to TRAIN families AND non-held-out context cells so the
//       §5.2 wall holds by construction (`assertWall` in holdout.ts re-checks). The per-user
//       TRAIN case count reuses the registered `casesPerUser` (§5.3 "a registered number of
//       consequence cases"); the lock list registers a single per-user case count and we
//       apply it to both splits.
// ─────────────────────────────────────────────────────────────────────────────

import type { Rng } from "./prng.js";
import type {
  AxisId,
  AxisLevel,
  AxisPosterior,
  AxisSpec,
  ConsequenceCase,
  Context,
  FactoredPosterior,
  FamilyId,
  Fossil,
  GenreLevel,
  HeldOutContextCombo,
  HoldoutPartition,
  IRId,
  IRSelectionInput,
  LikelihoodSignature,
  LockedConfig,
  SubdomainLevel,
  SyntheticUser,
  ThetaState,
} from "./types.js";

// ── small numeric guards ──────────────────────────────────────────────────────
const EPS = 1e-12; // floor for Dirichlet pseudo-counts so every prior stays proper (§4.1)

/** Clamp an arbitrary real to a valid {0,1,2} axis level. */
function asLevel(x: number): AxisLevel {
  const r = Math.round(x);
  return (r < 0 ? 0 : r > 2 ? 2 : r) as AxisLevel;
}

// ── context enumeration (the §2.2 product space; used for sampling cells) ──────
const SUBDOMAINS: readonly SubdomainLevel[] = ["synthesis", "mixing", "mastering"];
const FLOWS: readonly ("exploring" | "focused")[] = ["exploring", "focused"];
const GENRES: readonly GenreLevel[] = ["lofi", "clean-pop", "experimental"];

/** All 3·2·3 = 18 contexts of §2.2, in a fixed deterministic order. */
const ALL_CONTEXTS: readonly Context[] = SUBDOMAINS.flatMap((subdomain) =>
  FLOWS.flatMap((flow) => GENRES.map((genre): Context => ({ subdomain, flow, genre }))),
);

// ── config lookup helpers (no parameters defined here; all read from CONFIG) ───
function axisSpec(cfg: LockedConfig, axis: AxisId): AxisSpec {
  const spec = cfg.axes.find((a) => a.id === axis);
  if (spec === undefined) throw new Error(`[generative] unknown axis ${axis} (not in CONFIG §2.1)`);
  return spec;
}

function familySig(cfg: LockedConfig, family: FamilyId): LikelihoodSignature {
  const sig = cfg.families.find((f) => f.family === family);
  if (sig === undefined) throw new Error(`[generative] unknown family ${family} (not in CONFIG §2.4)`);
  return sig;
}

/** Touched axes of a family, in canonical CONFIG axis order (deterministic IR key order, §4.6). */
function touchedAxesOrdered(cfg: LockedConfig, family: FamilyId): readonly AxisId[] {
  const touched = new Set<AxisId>(familySig(cfg, family).touchedAxes);
  return cfg.axes.map((a) => a.id).filter((id) => touched.has(id));
}

/** §4.7 context bucket key c = `${subdomain}|${genre}` (X_flow enters only the interrupt×flow coupling). */
function bucketKey(ctx: Context): string {
  return `${ctx.subdomain}|${ctx.genre}`;
}

/** Coupling magnitude registered for a pair whose first member is `axis` (§2.3); 0 if none. */
function couplingStrength(cfg: LockedConfig, a: AxisId, b: AxisId | keyof Context): number {
  const p = cfg.correlatedPairs.find((cp) => cp.a === a && cp.b === b);
  return p === undefined ? 0 : p.strength * p.sign;
}

// ── §4.1 context-conditioned PRIOR marginal over an axis (Dirichlet mean) ──────
// α = alphaBase + registered skew (where ctx matches a §2.3 axis×context skew entry),
// floored strictly positive, then normalized to the Dirichlet mean. This is the
// "silent default" belief the oracle uses (function of context + CONFIG only).
function priorMarginal(cfg: LockedConfig, axis: AxisId, ctx: Context): AxisPosterior {
  const alpha: [number, number, number] = [cfg.alphaBase, cfg.alphaBase, cfg.alphaBase];
  for (const skew of cfg.contextSkews) {
    if (skew.axis !== axis) continue;
    const ctxLevel = ctx[skew.conditionedOn] as unknown as string;
    if (ctxLevel !== skew.level) continue;
    for (let k = 0; k < 3; k++) alpha[k] += skew.skew[k];
  }
  for (let k = 0; k < 3; k++) if (alpha[k] < EPS) alpha[k] = EPS;
  const s = alpha[0] + alpha[1] + alpha[2];
  return [alpha[0] / s, alpha[1] / s, alpha[2] / s] as AxisPosterior;
}

/** Continuous expected level Σ k·p_k of an axis posterior (used for mismatch + quantization). */
function meanLevel(p: AxisPosterior): number {
  return 0 * p[0] + 1 * p[1] + 2 * p[2];
}

// ─────────────────────────────────────────────────────────────────────────────
// §2.3 — latent user sampling (correlated, context-conditioned, NON-product prior)
// ─────────────────────────────────────────────────────────────────────────────

/** Sample a categorical level in {0,1,2} from non-negative weights, via the stream. */
function sampleCategorical(rng: Rng, weights: readonly [number, number, number]): AxisLevel {
  const total = weights[0] + weights[1] + weights[2];
  const u = rng.nextUnit() * total;
  if (u < weights[0]) return 0;
  if (u < weights[0] + weights[1]) return 1;
  return 2;
}

/** Tilt a 3-weight vector toward `towardLevel` by a non-negative amount (keeps weights ≥ 0). */
function tiltToward(
  base: readonly [number, number, number],
  towardLevel: AxisLevel,
  amount: number,
): [number, number, number] {
  const w: [number, number, number] = [base[0], base[1], base[2]];
  w[towardLevel] += Math.max(0, amount);
  return w;
}

/**
 * §2.3 sample one latent user `θ_u` (correlated joint prior) and its fossils.
 *
 * The user's own stream is forked from `usersRng` by `userId` so users are mutually
 * independent AND order-independent (NOTES N5 of prng.ts): the same user is identical
 * regardless of how many other users were drawn first.
 *
 * The joint is NON-product (§2.3 / G6): routing depends on grit (A_grit×A_routing +),
 * artifact depends on expertise (A_artifact×A_expertise +). A_interrupt×X_flow is an
 * axis×context coupling and shapes fossil emission, not the θ vector.
 */
export function sampleUser(cfg: LockedConfig, usersRng: Rng, userId: number): SyntheticUser {
  const r = usersRng.fork(userId);
  const flat: readonly [number, number, number] = [1, 1, 1];

  // Independent base draws for the "root" axes.
  const grit = sampleCategorical(r, flat);
  const bright = sampleCategorical(r, flat);
  const interrupt = sampleCategorical(r, flat);
  const expertise = sampleCategorical(r, flat);

  // A_grit × A_routing (+): gritty users lean serial(0)/send-return(2), clean users lean parallel(1).
  const gritRoutingMag = couplingStrength(cfg, "grit", "routing"); // +strength
  let routingW: [number, number, number] = [1, 1, 1];
  if (grit === 2) {
    routingW = tiltToward(tiltToward(routingW, 0, gritRoutingMag), 2, gritRoutingMag);
  } else if (grit === 0) {
    routingW = tiltToward(routingW, 1, gritRoutingMag);
  }
  const routing = sampleCategorical(r, routingW);

  // A_artifact × A_expertise (+): higher expertise → higher artifact tolerance.
  const artExpMag = couplingStrength(cfg, "artifact", "expertise"); // +strength
  // tolerant amount scales with how far above the middle the expertise sits.
  const artifactW = tiltToward([1, 1, 1], expertise, artExpMag * Math.abs(expertise - 1));
  const artifact = sampleCategorical(r, artifactW);

  const theta: ThetaState = { grit, bright, interrupt, artifact, expertise, routing };
  const fossils = sampleFossils(cfg, r.fork("fossils"), theta);
  return { id: userId, theta, fossils };
}

// ─────────────────────────────────────────────────────────────────────────────
// §2.3 — fossil emission (noisy, context-conditioned style signals)
// ─────────────────────────────────────────────────────────────────────────────

const EPISODES_PER_USER = 4 * 6; // = 4·|axes| = 24 (NOTES G1; structural, not a §9.4 parameter)

/**
 * Emission distribution for one observed style signal on `axis` given the user's true level
 * and the episode context (§2.3). A noise kernel peaked at the true level (ordinal: decaying
 * with ordinal distance; categorical: a fixed off-peak floor) is multiplied by the
 * context-conditioned prior marginal so emission is genuinely context-modulated.
 */
function emissionDist(
  cfg: LockedConfig,
  axis: AxisId,
  trueLevel: AxisLevel,
  ctx: Context,
): [number, number, number] {
  const ordinal = axisSpec(cfg, axis).kind === "ordinal";
  const prior = priorMarginal(cfg, axis, ctx);
  const w: [number, number, number] = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const kernel = ordinal
      ? Math.exp(-Math.abs(k - trueLevel)) // 1, e^-1, e^-2 by ordinal distance
      : k === trueLevel
        ? 1.0
        : 0.35; // categorical: peak at true, fixed off-peak floor
    w[k] = kernel * prior[k];
  }
  return w;
}

/**
 * §2.3 sample a user's fossil record: `EPISODES_PER_USER` episodes, each a random context
 * (uniform over the §2.2 space) and a random axis, with an observed level emitted from
 * `θ_u | context`. Sampling noise makes fossils under-determine `θ_u` (NOTES G1).
 */
export function sampleFossils(cfg: LockedConfig, userRng: Rng, theta: ThetaState): readonly Fossil[] {
  const fossils: Fossil[] = [];
  const axisIds = cfg.axes.map((a) => a.id);
  for (let e = 0; e < EPISODES_PER_USER; e++) {
    const ctx = ALL_CONTEXTS[userRng.nextInt(ALL_CONTEXTS.length)] as Context;
    const axis = axisIds[userRng.nextInt(axisIds.length)] as AxisId;
    const observedLevel = sampleCategorical(userRng, emissionDist(cfg, axis, theta[axis], ctx));
    fossils.push({ context: ctx, axis, observedLevel });
  }
  return fossils;
}

// ─────────────────────────────────────────────────────────────────────────────
// §2.4 — generic per-family likelihood (context-modulated; defined for held-out families)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * §2.4 registered generic likelihood `L(C | axis = level, context)`. Reads the family's
 * registered per-axis signature and applies the per-bucket context-modulation multiplier.
 * Untouched axes carry the flat `[1,1,1]` signature (contribute nothing to the posterior,
 * §4.2). Held-out families still return a fully-defined value (integrity (d)).
 */
export function likelihood(
  cfg: LockedConfig,
  family: FamilyId,
  axis: AxisId,
  level: AxisLevel,
  ctx: Context,
): number {
  const sig = familySig(cfg, family);
  const base = sig.L[axis][level];
  const mod = sig.bucketMod?.[bucketKey(ctx)] ?? 1.0;
  return base * mod;
}

// ─────────────────────────────────────────────────────────────────────────────
// §2.5 — the registered deterministic IR-selection oracle (shared by labels AND EVSI)
// ─────────────────────────────────────────────────────────────────────────────

/** Reduce one axis's effective tolerance (a posterior OR an explicit answered level) to a level. */
function effectiveLevel(tol: AxisPosterior | AxisLevel): AxisLevel {
  if (typeof tol === "number") return tol; // an explicit answer is used verbatim
  return asLevel(meanLevel(tol)); // a belief is quantized at its (rounded) posterior mean
}

/**
 * §2.5 / §4.5 IR-selection oracle: a deterministic map from effective tolerance to a chosen
 * IR. The candidate-IR space is the tuple of quantized effective levels on the axes the
 * family touches (the axes the oracle "reads", §4.4); the IRId encodes (family, levels) so the
 * same oracle backs the ground-truth label and SSI/baseline-v EVSI (NOTES G2).
 */
export function selectIR(cfg: LockedConfig, input: IRSelectionInput): IRId {
  const touched = touchedAxesOrdered(cfg, input.family);
  const parts = touched.map((axis) => `${axis}=${effectiveLevel(input.effectiveTolerance[axis])}`);
  return `${input.family}#${parts.join(";")}`;
}

/** Per-axis match utility between a chosen level and a true/believed level. */
function matchUtil(ordinal: boolean, chosen: AxisLevel, k: number): number {
  if (ordinal) return 1 - Math.abs(chosen - k) / 2; // 1 / 0.5 / 0 by ordinal distance
  return chosen === k ? 1 : 0; // categorical: exact-match only
}

/**
 * §4.5 Value(IR) under a belief: expected match between the IR's chosen levels and the
 * belief over each touched axis. Depends on the IR ONLY through its chosen levels, so two
 * IRs that are byte-equal give byte-equal value (the exact `EVSI = 0` property, NOTES G3).
 */
export function irValue(cfg: LockedConfig, ir: IRId, belief: FactoredPosterior, _ctx: Context): number {
  const hashIdx = ir.indexOf("#");
  if (hashIdx < 0) throw new Error(`[generative] malformed IRId ${ir}`);
  const body = ir.slice(hashIdx + 1);
  if (body.length === 0) return 0;
  let value = 0;
  for (const pair of body.split(";")) {
    const eq = pair.indexOf("=");
    const axis = pair.slice(0, eq) as AxisId;
    const chosen = asLevel(Number(pair.slice(eq + 1)));
    const ordinal = axisSpec(cfg, axis).kind === "ordinal";
    const p = belief[axis];
    for (let k = 0; k < 3; k++) value += p[k] * matchUtil(ordinal, chosen, k);
  }
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// §2.5 — the two ground-truth oracle labels (from θ_u and context ONLY; integrity §2.6)
// ─────────────────────────────────────────────────────────────────────────────

/** Build a full per-axis effective-tolerance record from the context-conditioned prior. */
function priorTolerance(cfg: LockedConfig, ctx: Context): IRSelectionInput["effectiveTolerance"] {
  const rec: Record<AxisId, AxisPosterior> = {} as Record<AxisId, AxisPosterior>;
  for (const a of cfg.axes) rec[a.id] = priorMarginal(cfg, a.id, ctx);
  return rec;
}

/** Build a full per-axis effective-tolerance record from the user's true θ (answered levels). */
function thetaTolerance(cfg: LockedConfig, theta: ThetaState): IRSelectionInput["effectiveTolerance"] {
  const rec: Record<AxisId, AxisLevel> = {} as Record<AxisId, AxisLevel>;
  for (const a of cfg.axes) rec[a.id] = theta[a.id];
  return rec;
}

/**
 * §4.4 S2-style affordance predicate (oracle-side): the consequence materially changes
 * affordances iff its signature is non-flat on at least one axis the IR oracle reads
 * (i.e. it has touched axes). Computed from CONFIG + family only.
 */
function affordsChange(cfg: LockedConfig, family: FamilyId): boolean {
  return touchedAxesOrdered(cfg, family).length > 0;
}

/**
 * §2.5 `worth_surfacing(u, x, C) ∈ {0,1}` — computed from θ_u and ctx ONLY.
 *
 * 1 iff the consequence (a) materially changes affordances AND (b) the user's true tolerance
 * is uncertain/pivotal: a meaningful CONTINUOUS mismatch (≥ 0.5 summed over touched axes)
 * between true θ_u and the context-prior silent default, AND the case is not in a "clearly
 * tolerated" corner (every touched axis already at the tolerant extreme, level 2). This is a
 * DIFFERENT operationalization from `answer_changes_IR` (NOTES G4) so the two may disagree.
 */
export function oracleWorthSurfacing(
  cfg: LockedConfig,
  theta: ThetaState,
  ctx: Context,
  family: FamilyId,
): 0 | 1 {
  if (!affordsChange(cfg, family)) return 0;
  const touched = touchedAxesOrdered(cfg, family);

  let mismatch = 0;
  let allTolerant = true;
  for (const axis of touched) {
    const priorMean = meanLevel(priorMarginal(cfg, axis, ctx));
    mismatch += Math.abs(theta[axis] - priorMean);
    if (theta[axis] !== 2) allTolerant = false;
  }
  if (allTolerant) return 0; // clearly tolerated corner → not worth asking even if IR would move
  return mismatch >= 0.5 ? 1 : 0;
}

/**
 * §2.5 `answer_changes_IR(u, x, C) ∈ {0,1}` — the ground-truth VoI label, computed from θ_u
 * and ctx ONLY via the registered IR oracle: 1 iff the user-informed IR (true θ tolerance)
 * differs from the silently-chosen IR (context-prior tolerance). Quantized-IR flip (NOTES G4).
 */
export function oracleAnswerChangesIR(
  cfg: LockedConfig,
  theta: ThetaState,
  ctx: Context,
  family: FamilyId,
): 0 | 1 {
  const irSilent = selectIR(cfg, { effectiveTolerance: priorTolerance(cfg, ctx), context: ctx, family });
  const irAnswered = selectIR(cfg, { effectiveTolerance: thetaTolerance(cfg, theta), context: ctx, family });
  return irSilent === irAnswered ? 0 : 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// §5.1/§5.3 — case generation (train fitting set + held-out evaluation set)
// ─────────────────────────────────────────────────────────────────────────────

/** Does a context cell match a registered held-out combo's context (all specified fields equal)? */
function matchesComboContext(combo: HeldOutContextCombo, ctx: Context): boolean {
  const c = combo.context;
  if (c.subdomain !== undefined && c.subdomain !== ctx.subdomain) return false;
  if (c.flow !== undefined && c.flow !== ctx.flow) return false;
  if (c.genre !== undefined && c.genre !== ctx.genre) return false;
  return true;
}

/** §5.1 is this context a held-out CONTEXT cell? (tag is by context, independent of θ; cf. tagHeldOut). */
function contextHeldOut(p: HoldoutPartition, ctx: Context): boolean {
  return p.heldOutContextCombos.some((combo) => matchesComboContext(combo, ctx));
}

/** §5.1 single/double held-out tags for a generated case (mirrors holdout.tagHeldOut; not imported). */
function tagHeldOut(p: HoldoutPartition, family: FamilyId, ctx: Context): { family: boolean; context: boolean } {
  return { family: p.heldOutFamilies.has(family), context: contextHeldOut(p, ctx) };
}

/** Pick a uniformly random context satisfying a predicate (bounded rejection; deterministic). */
function drawContext(rng: Rng, ok: (ctx: Context) => boolean): Context {
  for (let attempt = 0; attempt < 256; attempt++) {
    const ctx = ALL_CONTEXTS[rng.nextInt(ALL_CONTEXTS.length)] as Context;
    if (ok(ctx)) return ctx;
  }
  // Fallback: linear scan guarantees termination if any context qualifies.
  const found = ALL_CONTEXTS.find(ok);
  if (found === undefined) throw new Error("[generative] no context satisfies the draw predicate");
  return found;
}

/** Pick a uniformly random family from a non-empty list. */
function drawFamily(rng: Rng, families: readonly FamilyId[]): FamilyId {
  return families[rng.nextInt(families.length)] as FamilyId;
}

/** The single registered safety-class family (for S6 observation, §4.4/§5.1). */
function safetyFamily(cfg: LockedConfig): FamilyId {
  const sig = cfg.families.find((f) => f.familyClass === "safety");
  if (sig === undefined) throw new Error("[generative] no safety-class family registered (§4.4/§5.1)");
  return sig.family;
}

/** Assemble a ConsequenceCase, computing both oracle labels + held-out tags + negative-control. */
function makeCase(
  cfg: LockedConfig,
  p: HoldoutPartition,
  caseId: number,
  user: SyntheticUser,
  ctx: Context,
  family: FamilyId,
  split: "train" | "eval",
): ConsequenceCase {
  const worthSurfacing = oracleWorthSurfacing(cfg, user.theta, ctx, family);
  const answerChangesIR = oracleAnswerChangesIR(cfg, user.theta, ctx, family);
  return {
    caseId,
    userId: user.id,
    context: ctx,
    family,
    split,
    heldOut: tagHeldOut(p, family, ctx),
    oracle: {
      worthSurfacing,
      answerChangesIR,
      negativeControl: worthSurfacing === 0, // §2.5 / NOTES G5
    },
  };
}

/**
 * Draw one EVAL-eligible (family, context) cell (§5.1: held-out family OR held-out context),
 * re-drawing until `predicate` holds or attempts are exhausted (then the last draw is kept so
 * the per-user count and determinism are guaranteed; NOTES G7). `forceFamily` pins the family
 * (used for safety slots).
 */
function drawEvalCell(
  cfg: LockedConfig,
  p: HoldoutPartition,
  rng: Rng,
  user: SyntheticUser,
  predicate: (family: FamilyId, ctx: Context) => boolean,
  forceFamily?: FamilyId,
): { family: FamilyId; ctx: Context } {
  const heldFams = cfg.heldOutFamilies;
  const trainFams = cfg.trainFamilies;
  let last: { family: FamilyId; ctx: Context } | undefined;
  for (let attempt = 0; attempt < 256; attempt++) {
    let family: FamilyId;
    let ctx: Context;
    if (forceFamily !== undefined) {
      family = forceFamily; // a held-out family by construction → eval-eligible in any context
      ctx = drawContext(rng, () => true);
    } else {
      // Three eval-eligible modes: held-family×any, train-family×held-context, held×held.
      const mode = rng.nextInt(3);
      if (mode === 0) {
        family = drawFamily(rng, heldFams);
        ctx = drawContext(rng, () => true);
      } else if (mode === 1) {
        family = drawFamily(rng, trainFams);
        ctx = drawContext(rng, (c) => contextHeldOut(p, c));
      } else {
        family = drawFamily(rng, heldFams);
        ctx = drawContext(rng, (c) => contextHeldOut(p, c));
      }
    }
    last = { family, ctx };
    if (predicate(family, ctx)) return last;
  }
  // last is always defined after at least one iteration.
  return last as { family: FamilyId; ctx: Context };
}

/**
 * §5.3 generate a user's TRAIN (fitting) and EVAL (held-out) consequence cases at the
 * registered rates. TRAIN cells use only TRAIN families and non-held-out contexts so the
 * §5.2 wall holds by construction (NOTES G8). EVAL cells are held-out by ≥1 dimension and
 * are composed to meet the registered minimum category counts (NOTES G7).
 *
 * All randomness flows through the injected `fitRng` ('fitting-data' stream) and `evalRng`
 * ('evaluation' stream) of §7.3 — no `Math.random`.
 */
export function generateCases(
  cfg: LockedConfig,
  partition: HoldoutPartition,
  evalRng: Rng,
  fitRng: Rng,
  user: SyntheticUser,
): { train: readonly ConsequenceCase[]; eval: readonly ConsequenceCase[] } {
  const n = cfg.evalRates.casesPerUser;

  // Per-user sub-streams so each user's cases are reproducible and order-independent.
  const fr = fitRng.fork(user.id);
  const er = evalRng.fork(user.id);

  // ── TRAIN split: TRAIN families × non-held-out contexts (§5.2 wall by construction) ──
  const train: ConsequenceCase[] = [];
  for (let i = 0; i < n; i++) {
    const family = drawFamily(fr, cfg.trainFamilies);
    const ctx = drawContext(fr, (c) => !contextHeldOut(partition, c));
    train.push(makeCase(cfg, partition, user.id * 10000 + i, user, ctx, family, "train"));
  }

  // ── EVAL split: registered category quotas, remainder = balanced held-out filler ──
  const nSafety = Math.round(cfg.evalRates.safetyFrac * n);
  const nNeg = Math.round(cfg.evalRates.negativeControlFrac * n);
  const nPiv = Math.round(cfg.evalRates.pivotalFrac * n);
  const nFiller = Math.max(0, n - nSafety - nNeg - nPiv);

  const safeFam = safetyFamily(cfg);
  const evalCases: ConsequenceCase[] = [];
  let idx = 0;
  const push = (cell: { family: FamilyId; ctx: Context }): void => {
    evalCases.push(makeCase(cfg, partition, user.id * 10000 + 5000 + idx, user, cell.ctx, cell.family, "eval"));
    idx++;
  };

  // Safety slots first (so S6 is observable, §4.4) — pinned to the safety-class held-out family.
  for (let i = 0; i < nSafety; i++) {
    push(drawEvalCell(cfg, partition, er, user, () => true, safeFam));
  }
  // Negative-control slots: worth_surfacing == 0 on a detected consequence (§2.5).
  for (let i = 0; i < nNeg; i++) {
    push(drawEvalCell(cfg, partition, er, user, (f, c) => oracleWorthSurfacing(cfg, user.theta, c, f) === 0));
  }
  // Pivotal slots: answer_changes_IR == 1 (§5.3) so VoI is estimable.
  for (let i = 0; i < nPiv; i++) {
    push(drawEvalCell(cfg, partition, er, user, (f, c) => oracleAnswerChangesIR(cfg, user.theta, c, f) === 1));
  }
  // Filler slots: any eval-eligible cell (balanced coverage of held-out families/contexts).
  for (let i = 0; i < nFiller; i++) {
    push(drawEvalCell(cfg, partition, er, user, () => true));
  }

  return { train, eval: evalCases };
}
