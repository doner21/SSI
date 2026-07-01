// src/config.ts — G1B Falsifier: the single deeply-frozen locked-parameter object.
//
// Maps to HARNESS-SPEC.md §3 and PRE-REGISTRATION.md §2–§9 (the §9.4 lock list).
// This is the ONLY source of registered parameters; no other module may define a
// threshold, weight, seed, rate, partition, or signature (HARNESS-SPEC §3).
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules ("type":"module"), no `any`
// in public signatures, all probabilities/info quantities are IEEE-754 `number`,
// natural-log nats throughout. This module consumes NO randomness.
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — registered concrete values, no new
//        parameters beyond the PRE-REGISTRATION §9.4 lock list):
//
//   C1. Several constants are given as EXPLICIT registered values in §9.4 and are
//       copied verbatim here: seedMaster 0x5551B_0001, N=12, NFloor=8,
//       alphaBase=1.0, B=3, weights (w_AQ,w_VoI,w_US)=(0.40,0.40,0.20),
//       deltaComposite=0.05, alphaFWER=0.05, permExactMaxN=20,
//       permMonteCarloDraws=100000, bootstrapDraws=10000, ncSpecificityBar=0.80,
//       ppcReplications=2000, ppcAdequateBand=[0.05,0.95], tauMV=0.02,
//       mvReliabilitySE=4.
//
//   C2. The PRE-REGISTRATION repeatedly states that certain CONCRETE NUMERIC
//       values are "part of the locked spec carried into the harness" and are
//       fixed at pre-registration but not spelled out as digits in §1–§9 prose
//       (e.g. §2.3 "the concrete coupling matrices/values are part of the locked
//       spec carried into §4–§6"; §4.3 "θ_surprise is a registered fixed constant
//       (locked numeric value carried into the harness)"; §4.5 "κ … locked numeric
//       value into the harness"; §5.3 "registered rates … carried into the
//       harness"; §6.5 "registered binning … locked into the harness"; §2.4 "the
//       exact family↔axis signatures are part of the locked spec carried into the
//       harness"). These digits are registered HERE, at harness build, as the
//       authoritative locked values, consistent with every qualitative constraint
//       the pre-registration places on them. They introduce no parameter NAME not
//       already in §9.4 / the LockedConfig interface.
//
//   C3. thetaSurprise = 0.05 nats. §4.3 fixes it "conservatively (toward silence)"
//       and marks it [THIN] (calibrated against humans only at G5). S1 is only a
//       SCREEN; the EVSI gate (§4.5) carries the abstention load, so a modest
//       positive surprise floor is the conservative registered choice: it admits
//       genuinely belief-shifting consequences to the EVSI gate while rejecting
//       near-zero shifts. Units: nats; per-axis KL ∈ [0, ln3≈1.0986], summed over
//       touched axes (§4.3 factor-additivity).
//
//   C4. kappa = 0.0 (cost-of-interruption). §4.5: "κ = 0 admits any strictly
//       answer-changing question". The load-bearing distinction SSI vs baseline-v
//       is the `EVSI = 0 ⇒ abstain` rule (§4.5/§4.7), NOT a magnitude threshold;
//       κ = 0 gives the cleanest isolation of the EVSI machinery (a strictly
//       positive EVSI is required to surface; same-IR cases give EVSI = 0 and are
//       abstained unconditionally). κ ≥ 0 is honored exactly.
//
//   C5. calibrationBins = 10 — "a fixed number of equal-width bins" (§6.5),
//       diagnostic/reported only, never part of the gate composite.
//
//   C6. evalRates (§5.3): registered category RATES (not a partition; they may
//       overlap, so they need not sum to 1) plus a fixed per-user case count:
//         negativeControlFrac 0.30, pivotalFrac 0.30, safetyFrac 0.10,
//         casesPerUser 20. Chosen so each metric (AQ negative-controls, VoI
//         pivotals, S6 safety) is estimable per user (§5.3 "well-defined per-user
//         means") while keeping safety a "registered small fraction" (§4.4).
//
//   C7. contextSkews (§2.3): registered axis×context PRIOR skews, expressed as
//       ADDITIVE pseudo-count adjustments to the symmetric Dirichlet prior
//       (resulting α = alphaBase + skew, kept strictly positive). These encode the
//       §2.3 context-conditioning (e.g. P(A_interrupt|X_flow=focused) shifts toward
//       `low`; grit shifts gritty in lofi / clean in clean-pop; expertise toward
//       expert in mastering). The factored posterior (§4.1) reuses the
//       (subdomain,genre)-bucketed entries; the flow-conditioned interrupt skew is
//       part of the §2.3 generative coupling (NOTES N4 of types.ts).
//
//   C8. correlatedPairs (§2.3): the three registered couplings with fixed sign and
//       a registered magnitude `strength` ∈ (0,1): grit×routing (+), 
//       artifact×expertise (+), interrupt×flow (−, axis×context). `strength` is the
//       coupling magnitude consumed by generative.ts to build the NON-product joint
//       prior (the mis-specification G1B-MV §8 tests). Posterior.ts never reads it.
//
//   C9. families (§2.4): six LikelihoodSignatures. L[axis] = per-level likelihood
//       weight L(C | axis=k, context); touched axes are non-flat, untouched axes
//       are flat [1,1,1] (contribute nothing to the posterior, §4.2). bucketMod is
//       the §2.4 context-modulation multiplier keyed by `${subdomain}|${genre}`.
//       Held-out families (§5.1) still carry a fully-defined generic signature
//       (§2.4) so a context-conditioned posterior can score them unseen.
//
//  C10. ESM import discipline: HARNESS-SPEC §0 mandates NodeNext ES modules, so the
//       type-only import uses the `.js` specifier (`./types.js`) per TS NodeNext.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AxisSpec,
  ContextSkewTable,
  CorrelatedPair,
  FamilyId,
  HeldOutContextCombo,
  LikelihoodSignature,
  LockedConfig,
} from "./types.js";

// ── deep-freeze helper (recursive Object.freeze; the only "logic" beyond asserts) ──
function deepFreeze<T>(o: T): T {
  // Freeze nested plain objects/arrays so no registered value can be mutated at
  // runtime. Primitives and already-frozen objects are returned unchanged.
  if (o !== null && (typeof o === "object" || typeof o === "function")) {
    for (const key of Object.getOwnPropertyNames(o)) {
      const value: unknown = (o as Record<string, unknown>)[key];
      if (
        value !== null &&
        (typeof value === "object" || typeof value === "function") &&
        !Object.isFrozen(value)
      ) {
        deepFreeze(value);
      }
    }
    Object.freeze(o);
  }
  return o;
}

// ── §2.1 axes (6 axes, K=3 levels each) ──
const AXES: readonly AxisSpec[] = [
  { id: "grit", kind: "ordinal", levels: ["clean", "neutral", "gritty"] },
  { id: "bright", kind: "ordinal", levels: ["dark", "neutral", "bright"] },
  { id: "interrupt", kind: "ordinal", levels: ["low", "medium", "high"] },
  { id: "artifact", kind: "ordinal", levels: ["intolerant", "mixed", "tolerant"] },
  { id: "expertise", kind: "ordinal", levels: ["novice", "intermediate", "expert"] },
  { id: "routing", kind: "categorical", levels: ["serial", "parallel", "send-return"] },
];

// ── §2.3 registered axis×context prior skews (additive α adjustments; NOTES C7) ──
const CONTEXT_SKEWS: ContextSkewTable = [
  // interruption-tolerance drops toward `low` in focused flow (§2.3)
  { axis: "interrupt", conditionedOn: "flow", level: "focused", skew: [0.6, 0.0, -0.3] },
  // grit-tolerance leans `gritty` in lofi, `clean` in clean-pop (§2.2/§2.3)
  { axis: "grit", conditionedOn: "genre", level: "lofi", skew: [-0.3, 0.0, 0.6] },
  { axis: "grit", conditionedOn: "genre", level: "clean-pop", skew: [0.6, 0.0, -0.3] },
  // expertise leans `expert` in mastering sub-domain (§2.3)
  { axis: "expertise", conditionedOn: "subdomain", level: "mastering", skew: [-0.3, 0.0, 0.6] },
  // brightness leans `bright` in experimental genre (registered, §2.2/§2.3)
  { axis: "bright", conditionedOn: "genre", level: "experimental", skew: [-0.3, 0.0, 0.6] },
];

// ── §2.3 registered correlated pairs (fixed sign + magnitude; NOTES C8) ──
const CORRELATED_PAIRS: readonly CorrelatedPair[] = [
  { a: "grit", b: "routing", sign: 1, strength: 0.5 },     // gritty → serial/send-return
  { a: "artifact", b: "expertise", sign: 1, strength: 0.5 }, // experts more artifact-tolerant
  { a: "interrupt", b: "flow", sign: -1, strength: 0.5 },   // axis×context coupling
];

// ── §2.4 family likelihood signatures (NOTES C9) ──
// Flat per-axis likelihood (untouched axes contribute nothing to the posterior, §4.2).
const FLAT3: readonly [number, number, number] = [1.0, 1.0, 1.0];

const FAMILIES: readonly LikelihoodSignature[] = [
  // ── TRAIN families (§5.1) ──
  {
    family: "headroom-clip-risk",
    familyClass: "ordinary",
    touchedAxes: ["artifact", "bright"],
    L: {
      grit: FLAT3,
      bright: [0.6, 1.0, 1.8],      // clip-risk likelier when the user pushes brightness
      interrupt: FLAT3,
      artifact: [0.5, 1.0, 2.0],    // ... and tolerates artifacts
      expertise: FLAT3,
      routing: FLAT3,
    },
    bucketMod: { "mastering|clean-pop": 1.5, "synthesis|lofi": 0.6 },
  },
  {
    family: "brightness-shift",
    familyClass: "ordinary",
    touchedAxes: ["bright"],
    L: {
      grit: FLAT3,
      bright: [0.5, 1.0, 2.0],      // brightness-shift favours higher A_bright
      interrupt: FLAT3,
      artifact: FLAT3,
      expertise: FLAT3,
      routing: FLAT3,
    },
    bucketMod: { "mastering|clean-pop": 1.4 },
  },
  {
    family: "routing-idiom-change",
    familyClass: "ordinary",
    touchedAxes: ["routing"],
    L: {
      grit: FLAT3,
      bright: FLAT3,
      interrupt: FLAT3,
      artifact: FLAT3,
      expertise: FLAT3,
      routing: [1.6, 0.8, 1.6],     // serial / send-return idioms over parallel
    },
  },

  // ── HELD-OUT families (§5.1) — generic signatures still fully defined (§2.4) ──
  {
    family: "inharmonic-artifact",
    familyClass: "ordinary",
    touchedAxes: ["grit", "artifact"],
    L: {
      grit: [0.5, 1.0, 2.0],        // inharmonic artifact favours higher A_grit (§2.4 example)
      bright: FLAT3,
      interrupt: FLAT3,
      artifact: [0.5, 1.0, 2.0],    // ... and higher A_artifact
      expertise: FLAT3,
      routing: FLAT3,
    },
    bucketMod: { "synthesis|lofi": 0.5, "mastering|clean-pop": 1.8 }, // aliasing benign in lofi, harsh in mastering
  },
  {
    family: "added-latency",
    familyClass: "ordinary",
    touchedAxes: ["interrupt", "artifact"],
    L: {
      grit: FLAT3,
      bright: FLAT3,
      interrupt: [0.5, 1.0, 2.0],   // latency tolerated by interruption-tolerant users
      artifact: [0.6, 1.0, 1.8],
      expertise: FLAT3,
      routing: FLAT3,
    },
  },
  {
    family: "feedback-safety",
    familyClass: "safety",          // §4.4 forced-surface (S6) safety class
    touchedAxes: ["artifact"],
    L: {
      grit: FLAT3,
      bright: FLAT3,
      interrupt: FLAT3,
      artifact: [0.4, 1.0, 2.2],    // zero-delay feedback class; still has a generic signature
      expertise: FLAT3,
      routing: FLAT3,
    },
  },
];

// ── §5.1 family partition ──
const TRAIN_FAMILIES: readonly FamilyId[] = [
  "headroom-clip-risk",
  "brightness-shift",
  "routing-idiom-change",
];
const HELD_OUT_FAMILIES: readonly FamilyId[] = [
  "inharmonic-artifact",
  "added-latency",
  "feedback-safety",
];

// ── §5.1 held-out (axis-profile × context) combinations ──
const HELD_OUT_CONTEXT_COMBOS: readonly HeldOutContextCombo[] = [
  // canonical: grit-leaning user in a clean-mastering context (§5.1/§5.6)
  { axis: "grit", level: 2, context: { subdomain: "mastering", genre: "clean-pop" } },
  // its mirror: clean-leaning user in a lo-fi context (§5.1)
  { axis: "grit", level: 0, context: { genre: "lofi" } },
];

// ─────────────────────────────────────────────────────────────────────────────
// The single deeply-frozen CONFIG object — the only parameter source (§3).
// ─────────────────────────────────────────────────────────────────────────────
export const CONFIG: Readonly<LockedConfig> = deepFreeze<LockedConfig>({
  // ── identity / sample (§7.2, §7.3) ──
  seedMaster: 0x5551b_0001n, // SEED_MASTER (§7.3)
  N: 12, // target (§7.2)
  NFloor: 8, // pilot floor (§7.2)

  // ── generative structure (§2) ──
  axes: AXES,
  alphaBase: 1.0, // symmetric Laplace Dirichlet prior (§4.1)
  contextSkews: CONTEXT_SKEWS,
  correlatedPairs: CORRELATED_PAIRS,

  families: FAMILIES,
  trainFamilies: TRAIN_FAMILIES,
  heldOutFamilies: HELD_OUT_FAMILIES,
  heldOutContextCombos: HELD_OUT_CONTEXT_COMBOS,

  // ── §5.3 evaluation-set composition (NOTES C6) ──
  evalRates: {
    negativeControlFrac: 0.3,
    pivotalFrac: 0.3,
    safetyFrac: 0.1,
    casesPerUser: 20,
  },

  // ── §4 SSI locked constants ──
  thetaSurprise: 0.05, // nats, conservative S1 screen (NOTES C3)
  kappa: 0.0, // cost-of-interruption; EVSI=0 ⇒ abstain is the operative gate (NOTES C4)
  turnBudget: 3, // B = 3 (§4.6)

  // ── §6.4 / §7.1 composite weights (sum = 1; §9.4) ──
  weights: { wAQ: 0.4, wVoI: 0.4, wUS: 0.2 },

  // ── §7 test machinery ──
  deltaComposite: 0.05, // margin δ_composite (§7.4)
  alphaFWER: 0.05, // Holm FWER α (§7.4)
  permExactMaxN: 20, // exact enumeration when N ≤ 20 (§7.4)
  permMonteCarloDraws: 100_000, // MC fallback (§7.4)
  bootstrapDraws: 10_000, // reporting-only percentile bootstrap (§7.5)
  ncSpecificityBar: 0.8, // H-NC specificity bar (§7.6)

  // ── §8 G1B-MV ──
  ppcReplications: 2_000, // posterior-predictive replications (§8.1)
  ppcAdequateBand: [0.05, 0.95], // adequate PPC tail band (§8.1)
  tauMV: 0.02, // model-validity materiality τ_MV, nats/obs (§8.2)
  mvReliabilitySE: 4, // 4·SE reliability bar (§8.2)

  // ── §6.5 calibration ──
  calibrationBins: 10, // fixed equal-width bins for ECE (NOTES C5)
});

// ─────────────────────────────────────────────────────────────────────────────
// assertConfigInvariants — enforces the §9.4 lock at startup. A violation makes
// the run INVALID (it throws); this is NOT a FAIL verdict, it is an invalid run
// (HARNESS-SPEC §3). Call once before any data is generated (run.ts).
// ─────────────────────────────────────────────────────────────────────────────
export function assertConfigInvariants(c: LockedConfig): void {
  const fail = (msg: string): never => {
    throw new Error(`[config] invalid run — invariant violated: ${msg}`);
  };
  const inUnit = (x: number): boolean => Number.isFinite(x) && x >= 0 && x <= 1;

  // weights: non-negative and sum to exactly 1 (§6.4 / §9.4)
  const { wAQ, wVoI, wUS } = c.weights;
  for (const [name, w] of [["wAQ", wAQ], ["wVoI", wVoI], ["wUS", wUS]] as const) {
    if (!inUnit(w)) fail(`weight ${name}=${w} not in [0,1]`);
  }
  if (Math.abs(wAQ + wVoI + wUS - 1) > 1e-12) {
    fail(`weights sum=${wAQ + wVoI + wUS} ≠ 1`);
  }

  // sample size floor (§7.2)
  if (!Number.isInteger(c.N) || !Number.isInteger(c.NFloor)) fail("N / NFloor must be integers");
  if (c.N < c.NFloor) fail(`N=${c.N} < NFloor=${c.NFloor}`);
  if (c.NFloor < 1) fail(`NFloor=${c.NFloor} < 1`);

  // every registered rate / fraction / bar in [0,1] (§5.3, §7.4, §7.6, §8.1)
  const rateChecks: ReadonlyArray<readonly [string, number]> = [
    ["evalRates.negativeControlFrac", c.evalRates.negativeControlFrac],
    ["evalRates.pivotalFrac", c.evalRates.pivotalFrac],
    ["evalRates.safetyFrac", c.evalRates.safetyFrac],
    ["alphaFWER", c.alphaFWER],
    ["ncSpecificityBar", c.ncSpecificityBar],
    ["ppcAdequateBand[0]", c.ppcAdequateBand[0]],
    ["ppcAdequateBand[1]", c.ppcAdequateBand[1]],
    ["deltaComposite", c.deltaComposite],
  ];
  for (const [name, r] of rateChecks) {
    if (!inUnit(r)) fail(`rate ${name}=${r} not in [0,1]`);
  }
  if (c.ppcAdequateBand[0] >= c.ppcAdequateBand[1]) {
    fail(`ppcAdequateBand lo ${c.ppcAdequateBand[0]} ≥ hi ${c.ppcAdequateBand[1]}`);
  }

  // per-user case count and bins are positive integers
  if (!Number.isInteger(c.evalRates.casesPerUser) || c.evalRates.casesPerUser < 1) {
    fail(`evalRates.casesPerUser=${c.evalRates.casesPerUser} must be a positive integer`);
  }
  if (!Number.isInteger(c.calibrationBins) || c.calibrationBins < 1) {
    fail(`calibrationBins=${c.calibrationBins} must be a positive integer`);
  }

  // SSI constants (§4): proper prior, non-negative thresholds, positive budget
  if (!(c.alphaBase > 0)) fail(`alphaBase=${c.alphaBase} must be > 0 (proper Dirichlet)`);
  if (!(c.thetaSurprise >= 0)) fail(`thetaSurprise=${c.thetaSurprise} must be ≥ 0`);
  if (!(c.kappa >= 0)) fail(`kappa=${c.kappa} must be ≥ 0`);
  if (!Number.isInteger(c.turnBudget) || c.turnBudget < 1) {
    fail(`turnBudget=${c.turnBudget} must be a positive integer`);
  }

  // structural locks (§2.1, §5.1)
  if (c.axes.length !== 6) fail(`axes.length=${c.axes.length} ≠ 6 (locked §2.1)`);
  for (const ax of c.axes) {
    if (ax.levels.length !== 3) fail(`axis ${ax.id} must have exactly 3 levels (K=3, §2.1)`);
  }
  if (c.trainFamilies.length < 1 || c.heldOutFamilies.length < 1) {
    fail("train and held-out family partitions must each be non-empty (§5.1)");
  }
  // no family may be both train and held-out (the §5.2 wall)
  const trainSet = new Set<FamilyId>(c.trainFamilies);
  for (const f of c.heldOutFamilies) {
    if (trainSet.has(f)) fail(`family ${f} is both train and held-out (§5.2 wall)`);
  }
  // at least one safety-class held-out family for S6 observation (§4.4/§5.1)
  const heldOutSet = new Set<FamilyId>(c.heldOutFamilies);
  const anySafetyHeldOut = c.families.some(
    (fam) => fam.familyClass === "safety" && heldOutSet.has(fam.family),
  );
  if (!anySafetyHeldOut) fail("no safety-class held-out family for S6 observation (§4.4/§5.1)");

  // test machinery sanity (§7.4/§7.5/§8.1)
  for (const [name, v] of [
    ["permExactMaxN", c.permExactMaxN],
    ["permMonteCarloDraws", c.permMonteCarloDraws],
    ["bootstrapDraws", c.bootstrapDraws],
    ["ppcReplications", c.ppcReplications],
    ["mvReliabilitySE", c.mvReliabilitySE],
  ] as const) {
    if (!Number.isInteger(v) || v < 1) fail(`${name}=${v} must be a positive integer`);
  }
  if (!(c.tauMV >= 0)) fail(`tauMV=${c.tauMV} must be ≥ 0`);

  // the registered seed is a bigint (§7.3)
  if (typeof c.seedMaster !== "bigint") fail("seedMaster must be a bigint (§7.3)");
}
