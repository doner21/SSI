// src-v2/ssi.ts — G1B Falsifier v2 method under test (HARNESS-SPEC-v2 §8 / PRE-REGISTRATION-v2 §3.0, §4.3–§4.7, §5.2.1).
//
// SSI = the §4.1 sparse-pairwise-COUPLED, context-conditioned posterior (src-v2/posterior.ts) PLUS
// the §4.3–§4.7 S1–S6 salience math: Bayesian-surprise screen (S1), affordance/safety predicates
// (S2/S6), the ALIGNED EVSI value-of-information gate (S4 — the load-bearing mechanism), and EIG
// ranking under a hard turn budget (S5). SSI is the claimant H1 must defend; baseline (v) is the
// SAME coupled posterior with S4/S5 removed, so this module is the EXACT locus of the EIG/VoI
// contribution. All coupling lives in posterior.ts (the single shared belief module) so SSI and the
// ablation read the IDENTICAL upstream beliefs (§3.5/§9 isolation). [ARCH][GATE]
//
// ── The two v2 deltas that surface HERE (PRE-REG-v2 §A; everything else carried from v1 ssi.ts) ──
//   [v2 CHANGE (2)] ALIGNED EVSI (§4.5). v1's EVSI used the *consequence-conditioned* posterior to
//       choose the silent baseline IR; the §2.5 oracle's `answer_changes_IR` uses the *context-prior
//       default IR*. v2 aligns SSI's silent baseline to the SAME context-prior anchor the oracle uses
//       (`irSilentAligned` selects IR* from the CONTEXT-PRIOR coupled posterior `base`, NOT the
//       cc-posterior), so EVSI measures pivotality against the oracle's reference — WITHOUT ever
//       reading θ_u or any oracle label (the context-prior is SSI's OWN pre-consequence belief).
//   [v2 CHANGE (3)] TRAIN-only CALIBRATION of (θ_surprise, κ) (§5.2.1). v1 hand-fixed these blind;
//       v2 selects them by a deterministic argmax of SSI's OWN §6.4 composite over the registered
//       grid G_θ × G_κ, on the `"fitting-data"` (TRAIN) stream EXCLUSIVELY — consuming NO randomness,
//       NO oracle/held-out labels beyond the TRAIN oracle labels every method's TRAIN fit may use,
//       and NEVER touching a held-out family/context/label (asserted held-out-free by run.ts).
//
// Discipline (HARNESS-SPEC-v2 §0): strict TS, ES modules (NodeNext `.js` import specifiers), no
// `any` in public signatures, IEEE-754 `number`, NATURAL-LOG NATS for every information quantity.
// This module consumes NO randomness — neither `ssiDecide`'s decisions nor `calibrateOnTrain`'s
// argmax read any RNG or global state (§4.7, §5.2.1). [ARCH][GATE]
//
// Integrity (§2.6 / §4.7) [GATE]: SSI NEVER reads ground-truth θ_u. Belief is formed only from the
// user's observable fossils (posterior.ts) and the registered IR oracle (generative.ts). The `user`
// parameter is used only for its fossils via the coupled posterior; θ is never inspected here.
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no new parameters; every constant comes from CONFIG):
//
//   S1. ALIGNED EVSI formulation (§4.5, [v2 CHANGE (2)]). The locked invariants (§16) require:
//       (a) EVSI_aligned ≥ 0 always, and (b) EVSI_aligned = 0 EXACTLY when every positive-probability
//       answer yields the IR equal to the CONTEXT-PRIOR default IR. The formulation satisfying BOTH
//       with the FIXED (non-argmax) §2.5 IR oracle is the decision-theoretic VoI form where each
//       candidate IR is valued under the SAME post-answer state belief_r, then differenced against
//       the FIXED context-prior silent baseline:
//
//         EVSI_aligned(C,c) = Σ_r P(answer=r | C,c) · [ Value(IR_answered(r) | belief_r)
//                                                       − Value(IR_silent_aligned | belief_r) ]
//
//       where IR_silent_aligned = IR*( t_prior(c) ) is selected from the CONTEXT-PRIOR coupled
//       posterior `base` (the §4.5 alignment — NOT the cc-posterior), belief_r is `cc` with the
//       touched axes collapsed to the answered (one-hot) levels r, and P(answer=r|C,c) is SSI's own
//       coupled-posterior predictive (the per-axis marginal of `cc`).
//         • If IR_answered(r) == IR_silent_aligned for every positive-probability r, each bracket is
//           Value(IR | belief_r) − Value(IR | belief_r) = 0 ⇒ EVSI_aligned = 0 EXACTLY (b). ✓
//         • Otherwise IR_answered(r) places its quantized levels exactly at the answered (one-hot)
//           levels, MAXIMIZING irValue under belief_r, so every bracket ≥ 0 ⇒ EVSI_aligned ≥ 0 (a). ✓
//       This introduces no new parameter — Value and IR* are the registered §2.5 oracle.
//
//   S2. The question q(C) queries ALL of C's touched axes JOINTLY (the axes the IR oracle reads,
//       §4.4). The predictive answer distribution is the product of the per-axis marginals of the
//       COUPLED cc (no registered family touches two members of one pair, §config — so the touched
//       axes are in distinct components and their marginals multiply): P(r) = Π_{a∈touched} cc̄[a][r_a],
//       where cc̄[a] = the per-axis marginal of `cc` (a singleton's own AxisPosterior, or a pair
//       member's marginal of the 9-cell joint). `evsiAligned` enumerates this FULL joint (3^|touched|
//       answers). `answerDist`'s locked flat return type `{level,p}[]` cannot encode a multi-axis
//       tuple, so it exposes the predictive over the PRIMARY touched axis (first in canonical CONFIG
//       order); it never drives the gate — the gate uses `evsiAligned`'s joint computation.
//
//   S3. belief_r (the post-answer state, S1). For a touched SINGLETON axis, its AxisPosterior is set
//       to the one-hot answered level. For a touched member of a PAIR (no family touches both members,
//       §config), the joint is collapsed so the touched member's marginal is one-hot at the answered
//       level while the untouched partner keeps its coupled conditional P(partner | touched=r) — the
//       partner is NOT read by the oracle for this family, so this choice is value-neutral; it is the
//       principled "coupled partner updates through the joint" reading (§4.6). An untouched component
//       is copied by reference. irValue marginalizes each touched axis from belief_r, so only the
//       touched-axis one-hot marginals affect the value (the exact EVSI=0 property, S1).
//
//   S4. EIG (§4.6, component-additive). EIG = H(belief|c) − E_r[H(belief|answer r,c)] summed over the
//       touched COMPONENTS, exact under the product-over-components model. A fully-revealed touched
//       axis collapses its own entropy; the coupled partner updates through the joint:
//         • touched SINGLETON axis a ⇒ contributes H(cc̄[a]) (revealed ⇒ post-entropy 0).
//         • PAIR with ONE member touched ⇒ reduction = H(joint) − H(partner | touched) = H(touched
//           marginal) = entropyAxis(marginal of the touched member). (The partner's residual entropy
//           H(partner|touched) is what REMAINS, so it is NOT part of the gain.)
//         • PAIR with BOTH members touched ⇒ reduction = entropyJoint (post-entropy 0). (No registered
//           family touches both members, so this branch is correct-but-unreached; §config.)
//       At λ_couple = 0 the joint factorizes (H(partner|touched)=H(partner)) so the component EIG
//       reduces EXACTLY to the v1 per-axis EIG sum (§4.6). ≥ 0 always.
//
//   S5. Ranking key (§4.6, locked): S6-forced cases first; then descending EIG; ties broken by
//       descending EVSI_aligned; then ascending fixed family ordinal (the family's index in
//       CONFIG.families — a registered, deterministic ordering). The top ≤ B (= turnBudget = 3)
//       survive the budget; the rest abstain. No randomness anywhere.
//
//   S6. `score` for calibration/reliability (§6.5). `ssiDecide` reports EVSI_aligned for EVERY case
//       (surfaced or not) as MethodDecision.score (HARNESS-SPEC-v2 §8: "score = EVSI_aligned").
//
//   S7. CALIBRATION composite (§5.2.1, [v2 CHANGE (3)]). The objective is SSI's OWN §6.4 locked-weight
//       composite (0.40·AQ + 0.20·US + 0.40·VoI, the SAME weights the gate uses) over each user's
//       TRAIN cases, restricted to the DISCRETIONARY bucket D_disc (the [v2 CHANGE (4)] §6.1.1 S6/AQ
//       exclusion: safety-class cases are dropped identically for every method). To respect the
//       acyclic dependency direction (ssi.ts is UPSTREAM of metrics.ts), the AQ/US/VoI/composite
//       estimators are re-implemented here BYTE-IDENTICALLY to metrics.ts §6.1–§6.4 (balanced
//       accuracy with the 0.5 empty-class fallback; precision with the registered null = 0). They use
//       only TRAIN oracle labels — never θ_u, never a held-out label, never randomness.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AxisId,
  AxisLevel,
  AxisPosterior,
  CalibratedConstants,
  ConsequenceCase,
  Context,
  CoupledPosterior,
  FamilyId,
  IRId,
  IRSelectionInput,
  JointPosterior,
  LockedConfig,
  MethodDecision,
  PairId,
  SyntheticUser,
} from "./types.js";
import {
  consequenceConditioned,
  coupledPosterior,
  entropyAxis,
  entropyJoint,
  klCoupled,
  marginalizeJoint,
} from "./posterior.js";
import { irValue, selectIR } from "./generative.js";

const LEVELS: readonly AxisLevel[] = [0, 1, 2]; // K_a = 3 (§2.1)
// The registered pair ids (§4.0). config.assertConfigInvariants asserts the component set is EXACTLY
// {P1, P2} + singletons{bright, interrupt}, so this fixed order is safe and deterministic.
const PAIR_IDS: readonly PairId[] = ["P1", "P2"];

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

/** One-hot AxisPosterior placing all mass on a single answered level (the post-answer belief, S3). */
function oneHot(level: AxisLevel): AxisPosterior {
  return [level === 0 ? 1 : 0, level === 1 ? 1 : 0, level === 2 ? 1 : 0];
}

/** The per-axis posterior of a coupled SINGLETON component (the only two singletons are §4.0-locked). */
function singletonOf(belief: CoupledPosterior, axis: AxisId): AxisPosterior {
  if (axis === "interrupt") return belief.interrupt;
  if (axis === "bright") return belief.bright;
  throw new Error(`[ssi] axis ${axis} is not a registered §4.0 singleton`);
}

/**
 * Reduce a §4.0 CoupledPosterior to the per-axis marginal P(axis = k | ·) — the SAME marginalization
 * generative.irValue uses. A paired axis is marginalized from its 9-cell joint (first member sums
 * over the partner's level, second over the first's); a singleton returns its stored AxisPosterior.
 */
function coupledAxisMarginal(cfg: LockedConfig, belief: CoupledPosterior, axis: AxisId): AxisPosterior {
  for (const pid of PAIR_IDS) {
    const [a, b] = cfg.coupledComponents.pairs[pid];
    if (axis === a) return marginalizeJoint(belief.pairs[pid], 0);
    if (axis === b) return marginalizeJoint(belief.pairs[pid], 1);
  }
  return singletonOf(belief, axis);
}

/** Full per-axis effective-tolerance record (every axis' marginal) for the §2.5 selectIR oracle. */
function coupledToleranceRecord(
  cfg: LockedConfig,
  belief: CoupledPosterior,
): Record<AxisId, AxisPosterior | AxisLevel> {
  const rec = {} as Record<AxisId, AxisPosterior | AxisLevel>;
  for (const a of cfg.axes) rec[a.id] = coupledAxisMarginal(cfg, belief, a.id);
  return rec;
}

// ─────────────────────────────────────────────────────────────────────────────
// §4.3 — S1 Bayesian-surprise screen (component-additive over the coupled posterior)
// ─────────────────────────────────────────────────────────────────────────────

/** §4.3 S1(C,c) = KL( P(Intent | C,c) ‖ P(Intent | c) ) = klCoupled(cc, base), nats, ≥ 0. */
export function s1Surprise(_cfg: LockedConfig, base: CoupledPosterior, cc: CoupledPosterior): number {
  return klCoupled(cc, base);
}

/** §4.3 S1 gate: C passes the surprise screen iff S1(C,c) > θ_surprise (θ from §5.2.1 calibration). */
export function s1Pass(theta: number, surprise: number): boolean {
  return surprise > theta;
}

// ─────────────────────────────────────────────────────────────────────────────
// §4.4 — S2 affordance predicate / S6 safety override (S3 collapsed to identity gate)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * §4.4 S2 affordance predicate: C "materially changes affordances" iff its registered signature is
 * non-flat on at least one axis the IR oracle reads — i.e. it has touched axes. Deterministic, from
 * CONFIG + family only (no tunable S2 in G1B). `ctx` is part of the locked signature.
 */
export function s2AffordsChange(cfg: LockedConfig, family: FamilyId, _ctx: Context): boolean {
  return touchedAxes(cfg, family).length > 0;
}

/** §4.4 S6 safety/constraint override: families registered as safety-class are forced-surfaced. */
export function s6Safety(cfg: LockedConfig, family: FamilyId): boolean {
  return familySig(cfg, family).familyClass === "safety";
}

// ─────────────────────────────────────────────────────────────────────────────
// §4.5 — S4 ALIGNED EVSI gate (the load-bearing value-of-information mechanism) [v2 CHANGE (2)]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * §4.5 predictive answer distribution over the PRIMARY touched axis (NOTES S2), from SSI's OWN coupled
 * posterior `cc` (no oracle label read). For single-axis families this is the exact predictive
 * `evsiAligned` integrates over; for multi-axis families it is an inspection view of the first touched
 * axis. Returns [] if the family touches no axis.
 */
export function answerDist(
  cfg: LockedConfig,
  cc: CoupledPosterior,
  family: FamilyId,
): readonly { level: AxisLevel; p: number }[] {
  const touched = touchedAxes(cfg, family);
  if (touched.length === 0) return [];
  const primary = touched[0]!;
  const p = coupledAxisMarginal(cfg, cc, primary);
  return LEVELS.map((level) => ({ level, p: p[level] }));
}

/**
 * §4.5 [v2 CHANGE (2)] the ALIGNED silent-baseline IR: IR_silent_aligned(C,c) = IR*( t_prior(c) ),
 * selected from the CONTEXT-PRIOR coupled posterior `base` (NOT the consequence-conditioned `cc`).
 * This is SSI's OWN pre-consequence belief — never an oracle label, never θ_u — quantized to its
 * per-axis posterior-mean tolerance and mapped through the registered §2.5 IR oracle.
 */
export function irSilentAligned(
  cfg: LockedConfig,
  base: CoupledPosterior,
  family: FamilyId,
  ctx: Context,
): IRId {
  const tol: IRSelectionInput["effectiveTolerance"] = coupledToleranceRecord(cfg, base);
  return selectIR(cfg, { effectiveTolerance: tol, context: ctx, family });
}

/**
 * §4.5 build belief_r (S3): `cc` with every touched axis collapsed to its answered (one-hot) level.
 * Touched singletons become one-hot; a pair's touched member becomes one-hot in its marginal while
 * the untouched partner keeps its coupled conditional P(partner | touched = r) (value-neutral, S3).
 */
function collapseBelief(
  cfg: LockedConfig,
  cc: CoupledPosterior,
  answered: ReadonlyMap<AxisId, AxisLevel>,
): CoupledPosterior {
  const outPairs = {} as Record<PairId, JointPosterior>;
  for (const pid of PAIR_IDS) {
    const [a, b] = cfg.coupledComponents.pairs[pid];
    const aLevel = answered.get(a);
    const bLevel = answered.get(b);
    const joint = cc.pairs[pid];
    if (aLevel === undefined && bLevel === undefined) {
      outPairs[pid] = joint; // untouched component ⇒ identical reference
      continue;
    }
    const out = new Array<number>(9).fill(0);
    if (aLevel !== undefined && bLevel !== undefined) {
      // both members answered ⇒ delta at the answered cell (post-entropy 0).
      out[aLevel * 3 + bLevel] = 1;
    } else if (aLevel !== undefined) {
      // first member revealed ⇒ marginal_a = one-hot(aLevel); partner keeps P(b | a=aLevel).
      let mass = 0;
      for (let l = 0; l < 3; l++) mass += joint[aLevel * 3 + l]!;
      for (let l = 0; l < 3; l++) out[aLevel * 3 + l] = mass > 0 ? joint[aLevel * 3 + l]! / mass : 0;
    } else {
      // second member revealed ⇒ marginal_b = one-hot(bLevel); partner keeps P(a | b=bLevel).
      const bl = bLevel!;
      let mass = 0;
      for (let j = 0; j < 3; j++) mass += joint[j * 3 + bl]!;
      for (let j = 0; j < 3; j++) out[j * 3 + bl] = mass > 0 ? joint[j * 3 + bl]! / mass : 0;
    }
    outPairs[pid] = out;
  }
  const single = (axis: AxisId): AxisPosterior => {
    const lvl = answered.get(axis);
    return lvl === undefined ? singletonOf(cc, axis) : oneHot(lvl);
  };
  return { pairs: outPairs, interrupt: single("interrupt"), bright: single("bright") };
}

/**
 * §4.5 [v2 CHANGE (2)] EVSI_aligned(C,c) — value of asking about C, in registered IR-value units,
 * measured against the CONTEXT-PRIOR silent default (NOTES S1). Joint over the touched axes' answers
 * (predictive = `cc`'s per-axis marginals), each post-answer state valuing IR_answered(r) minus the
 * FIXED context-prior IR_silent_aligned — so EVSI_aligned ≥ 0 and = 0 EXACTLY when every answer keeps
 * the context-prior default IR (§16).
 *
 * `_user` is part of the locked signature but is NEVER read (integrity §2.6/§4.7: SSI must not touch
 * θ; belief already arrives pre-computed in `base`/`cc`).
 */
export function evsiAligned(
  cfg: LockedConfig,
  _user: SyntheticUser,
  base: CoupledPosterior,
  cc: CoupledPosterior,
  family: FamilyId,
  ctx: Context,
): number {
  const touched = touchedAxes(cfg, family);
  if (touched.length === 0) return 0; // nothing the IR oracle reads ⇒ no answer can move the IR

  // [v2 CHANGE (2)] the FIXED context-prior silent baseline (computed from `base`, not `cc`).
  const irSilent: IRId = irSilentAligned(cfg, base, family, ctx);
  // Predictive answer marginals from SSI's OWN coupled posterior `cc` (NOTES S2).
  const margins = touched.map((ax) => coupledAxisMarginal(cfg, cc, ax));

  let total = 0;
  const combo: AxisLevel[] = touched.map(() => 0);
  const enumerate = (i: number, prob: number): void => {
    if (i === touched.length) {
      const answered = new Map<AxisId, AxisLevel>();
      for (let t = 0; t < touched.length; t++) answered.set(touched[t]!, combo[t]!);
      const beliefR = collapseBelief(cfg, cc, answered);
      // IR_answered(r): the §2.5 oracle reading the answered (one-hot) levels verbatim.
      const answeredTol = coupledToleranceRecord(cfg, cc);
      for (const [ax, lvl] of answered) answeredTol[ax] = lvl;
      const irAnswered: IRId = selectIR(cfg, { effectiveTolerance: answeredTol, context: ctx, family });
      // Value both IRs under the SAME post-answer state belief_r (NOTES S1).
      const gain = irValue(cfg, irAnswered, beliefR, ctx) - irValue(cfg, irSilent, beliefR, ctx);
      total += prob * gain;
      return;
    }
    const m = margins[i]!;
    for (const level of LEVELS) {
      const pk = m[level];
      if (pk <= 0) continue; // zero-probability answers contribute nothing
      combo[i] = level;
      enumerate(i + 1, prob * pk);
    }
  };
  enumerate(0, 1);
  return total;
}

/** §4.5 VoI/EVSI gate: C is VoI-eligible iff EVSI_aligned(C,c) > κ (κ ≥ 0, from §5.2.1 calibration). */
export function s4Eligible(kappa: number, evsiValue: number): boolean {
  return evsiValue > kappa;
}

// ─────────────────────────────────────────────────────────────────────────────
// §4.6 — S5 EIG ranking + turn budget (component-additive)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * §4.6 EIG(C,c): component-additive expected entropy reduction over the touched components (NOTES S4),
 * nats, ≥ 0. A fully-revealed touched axis collapses its own entropy; a coupled partner's residual
 * entropy is what REMAINS (not part of the gain). At λ_couple = 0 this reduces to the v1 per-axis sum.
 * `_base` is part of the locked signature; the gain is computed against the conditioned posterior `cc`.
 */
export function eig(
  cfg: LockedConfig,
  _base: CoupledPosterior,
  cc: CoupledPosterior,
  family: FamilyId,
  _ctx: Context,
): number {
  const touched = new Set<AxisId>(touchedAxes(cfg, family));
  let h = 0;
  // pairs: one member touched ⇒ H(touched marginal); both ⇒ entropyJoint (unreached, §config).
  for (const pid of PAIR_IDS) {
    const [a, b] = cfg.coupledComponents.pairs[pid];
    const at = touched.has(a);
    const bt = touched.has(b);
    if (at && bt) h += entropyJoint(cc.pairs[pid]);
    else if (at) h += entropyAxis(marginalizeJoint(cc.pairs[pid], 0));
    else if (bt) h += entropyAxis(marginalizeJoint(cc.pairs[pid], 1));
  }
  // singletons: revealed ⇒ post-entropy 0 ⇒ contributes its full per-axis entropy.
  for (const ax of cfg.coupledComponents.singletons) {
    if (touched.has(ax)) h += entropyAxis(singletonOf(cc, ax));
  }
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
 * Order (locked, NOTES S5): S6-forced first; then descending EIG; ties → descending EVSI_aligned;
 * then ascending fixed family ordinal. Returns the caseIds to surface (≤ B), in surfacing order.
 */
export function rankAndBudget(cfg: LockedConfig, eligible: readonly EligibleCase[]): readonly number[] {
  const ordered = [...eligible].sort((a, b) => {
    if (a.forcedS6 !== b.forcedS6) return a.forcedS6 ? -1 : 1; // S6 forced first
    if (b.eig !== a.eig) return b.eig - a.eig; // descending EIG
    if (b.evsi !== a.evsi) return b.evsi - a.evsi; // tie-break: descending EVSI_aligned
    return a.familyOrdinal - b.familyOrdinal; // final tie-break: ascending family ordinal
  });
  return ordered.slice(0, cfg.turnBudget).map((e) => e.caseId);
}

// ─────────────────────────────────────────────────────────────────────────────
// §4.7 — the locked SSI decision pipeline (one transaction over a user's cases), given (θ*, κ*)
// ─────────────────────────────────────────────────────────────────────────────

/** Per-case intermediate quantities computed once and reused for eligibility, ranking, and score. */
interface CaseQuantities {
  readonly caseId: number;
  readonly family: FamilyId;
  readonly forcedS6: boolean;
  readonly eligible: boolean; // forced S6 OR (S1 pass ∧ S4 aligned-EVSI gate pass)
  readonly eig: number;
  readonly evsi: number; // EVSI_aligned
}

/** §4.7 compute every per-case salience quantity for a user's `cases` at a given operating point. */
function computeQuantities(
  cfg: LockedConfig,
  theta: number,
  kappa: number,
  user: SyntheticUser,
  cases: readonly ConsequenceCase[],
): readonly CaseQuantities[] {
  return cases.map((c) => {
    const base = coupledPosterior(cfg, user, c.context);
    const cc = consequenceConditioned(cfg, base, c.family, c.context);

    const forcedS6 = s6Safety(cfg, c.family);
    const surprise = s1Surprise(cfg, base, cc);
    const evsiVal = evsiAligned(cfg, user, base, cc, c.family, c.context);
    const eigVal = eig(cfg, base, cc, c.family, c.context);

    // §4.7 eligibility: S6 forced bypasses S1/S4; otherwise require S1 screen AND S4 aligned-EVSI gate.
    const eligible = forcedS6 || (s1Pass(theta, surprise) && s4Eligible(kappa, evsiVal));
    return { caseId: c.caseId, family: c.family, forcedS6, eligible, eig: eigVal, evsi: evsiVal };
  });
}

/** §4.7 turn the per-case quantities into one MethodDecision per case (score = EVSI_aligned, S6). */
function decideFromQuantities(
  cfg: LockedConfig,
  quantities: readonly CaseQuantities[],
): readonly MethodDecision[] {
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
  return quantities.map((q) => ({
    caseId: q.caseId,
    surface: surfaced.has(q.caseId) ? 1 : 0,
    score: q.evsi, // §6.5 score = EVSI_aligned for calibration/reliability (NOTES S6)
  }));
}

/**
 * §4.7 the locked SSI pipeline run over all of a user's `cases` as ONE transaction at the CALIBRATED
 * operating point (θ*, κ*) (§5.2.1):
 *   1. S6 first  — safety/constraint-class ⇒ forced-surface (bypass S1/S4).
 *   2. S1 screen — non-forced cases abstain unless surprise > θ*_surprise.
 *   3. S4 gate   — survivors abstain unless EVSI_aligned > κ* (EVSI_aligned = 0 ⇒ abstain).
 *   4. S5 budget — rank survivors (∪ forced) by EIG and surface the top ≤ B; the rest abstain.
 * Returns exactly one MethodDecision per case, with score = EVSI_aligned (§6.5). Consumes NO
 * randomness and never reads θ_u (§4.7 / §2.6) [GATE].
 */
export function ssiDecide(
  cfg: LockedConfig,
  cal: CalibratedConstants,
  user: SyntheticUser,
  cases: readonly ConsequenceCase[],
): readonly MethodDecision[] {
  const quantities = computeQuantities(cfg, cal.thetaSurprise, cal.kappa, user, cases);
  return decideFromQuantities(cfg, quantities);
}

// ─────────────────────────────────────────────────────────────────────────────
// §5.2.1 — [v2 CHANGE (3)] CALIBRATION SYMMETRY: deterministic TRAIN-split argmax of (θ_surprise, κ)
// ─────────────────────────────────────────────────────────────────────────────
//
// Runs in the FITTING phase on TRAIN cases ONLY (asserted held-out-free by run.ts before the
// "evaluation" stream opens). Deterministic — consumes NO randomness, NO θ_u, NO held-out label.
// Objective: maximize SSI's mean TRAIN composite (§6.4 weights) over the registered grid G_θ × G_κ;
// tie-break (locked): largest θ first, then largest κ (most conservative / toward silence, §5.7).

// ── §6.1 AQ = balanced accuracy of surface vs worth_surfacing (re-implemented from metrics.ts, S7). ──
function trainAQ(joined: readonly { surface: 0 | 1; ws: 0 | 1 }[]): number {
  let TP = 0;
  let FN = 0;
  let TN = 0;
  let FP = 0;
  for (const x of joined) {
    if (x.ws === 1) {
      if (x.surface === 1) TP++;
      else FN++;
    } else if (x.surface === 1) FP++;
    else TN++;
  }
  const posDenom = TP + FN;
  const negDenom = TN + FP;
  const sensitivity = posDenom > 0 ? TP / posDenom : 0.5; // registered empty-class fallback (§6.1)
  const specificity = negDenom > 0 ? TN / negDenom : 0.5;
  return 0.5 * (sensitivity + specificity);
}

// ── §6.2/§6.3 precision of surfaced vs a label; registered null = 0 if nothing surfaced. ──
function trainPrecision(joined: readonly { surface: 0 | 1; label: 0 | 1 }[]): number {
  let surfaced = 0;
  let hits = 0;
  for (const x of joined) {
    if (x.surface === 1) {
      surfaced++;
      if (x.label === 1) hits++;
    }
  }
  return surfaced > 0 ? hits / surfaced : 0;
}

/**
 * §6.4 mean TRAIN composite over D_disc for a candidate (θ, κ). Discretionary-only ([v2 CHANGE (4)]
 * §6.1.1: safety-class cases excluded identically for every method). Composite per user is the §6.4
 * locked-weight blend; the objective is the mean over users that have ≥ 1 discretionary TRAIN case.
 */
function meanTrainComposite(
  cfg: LockedConfig,
  theta: number,
  kappa: number,
  users: readonly SyntheticUser[],
  trainByUser: ReadonlyMap<number, readonly ConsequenceCase[]>,
): number {
  const { wAQ, wUS, wVoI } = cfg.weights;
  const cal: CalibratedConstants = { thetaSurprise: theta, kappa, trainComposite: 0 };
  let sum = 0;
  let count = 0;
  for (const user of users) {
    const userCases = trainByUser.get(user.id);
    if (userCases === undefined || userCases.length === 0) continue;
    const disc = userCases.filter((c) => !c.safetyClass); // §6.1.1 D_disc
    if (disc.length === 0) continue;
    const decisions = ssiDecide(cfg, cal, user, disc);
    const byId = new Map<number, MethodDecision>();
    for (const d of decisions) byId.set(d.caseId, d);
    const joinedWs = disc.map((c) => ({
      surface: (byId.get(c.caseId)?.surface ?? 0) as 0 | 1,
      ws: c.oracle.worthSurfacing,
    }));
    const joinedVc = disc.map((c) => ({
      surface: (byId.get(c.caseId)?.surface ?? 0) as 0 | 1,
      label: c.oracle.answerChangesIR,
    }));
    const aq = trainAQ(joinedWs);
    const us = trainPrecision(joinedWs.map((x) => ({ surface: x.surface, label: x.ws })));
    const voi = trainPrecision(joinedVc);
    sum += wAQ * aq + wUS * us + wVoI * voi; // §6.4 composite
    count++;
  }
  return count > 0 ? sum / count : 0;
}

/**
 * §5.2.1 [v2 CHANGE (3)] select (θ*_surprise, κ*) maximizing SSI's mean TRAIN composite over the
 * registered grid G_θ × G_κ. Deterministic; touches `trainCases` EXCLUSIVELY (held-out-free, asserted
 * by run.ts); consumes NO randomness and NO θ_u. Tie-break (locked §5.2.1/§5.7): largest θ first,
 * then largest κ (most conservative, toward silence).
 */
export function calibrateOnTrain(
  cfg: LockedConfig,
  users: readonly SyntheticUser[],
  trainCases: readonly ConsequenceCase[],
): CalibratedConstants {
  // Index the TRAIN cases per user once (the §4.7 pipeline is a per-user transaction).
  const trainByUser = new Map<number, ConsequenceCase[]>();
  for (const c of trainCases) {
    const arr = trainByUser.get(c.userId);
    if (arr === undefined) trainByUser.set(c.userId, [c]);
    else arr.push(c);
  }

  // Evaluate the full registered grid; record every (θ, κ, composite) for a deterministic argmax.
  const points: { theta: number; kappa: number; composite: number }[] = [];
  for (const theta of cfg.thetaSurpriseGrid) {
    for (const kappa of cfg.kappaGrid) {
      const composite = meanTrainComposite(cfg, theta, kappa, users, trainByUser);
      points.push({ theta, kappa, composite });
    }
  }

  // Deterministic argmax: max composite, tie-break largest θ then largest κ (§5.2.1/§5.7).
  let best = points[0]!;
  for (const p of points) {
    const eqComposite = Math.abs(p.composite - best.composite) <= 1e-12;
    if (p.composite > best.composite + 1e-12) {
      best = p;
    } else if (eqComposite) {
      if (p.theta > best.theta || (p.theta === best.theta && p.kappa > best.kappa)) best = p;
    }
  }
  return { thetaSurprise: best.theta, kappa: best.kappa, trainComposite: best.composite };
}
