// src-v2/config.ts — G1B Falsifier v2: the single deeply-frozen locked-parameter object.
//
// Maps to HARNESS-SPEC-v2.md §3 and PRE-REGISTRATION-v2.md §2–§9 (the §9.4 lock list).
// This is the ONLY source of registered parameters; no other module may define a
// threshold, weight, seed, rate, partition, or signature (HARNESS-SPEC-v2 §3).
//
// Relationship to v1 (g1b/src/config.ts): every v1 registered value is carried VERBATIM;
// the v2 additions are flagged `[v2]` and are EXACTLY the four permitted deltas of PRE-REG-v2
// §A plus the mandated new SEED_MASTER. v1 (`g1b/src/`) is NOT modified by this file.
//
// The v2 deltas registered here:
//   [v2 §A.0]       seedMaster 0x5551B_0001n → 0x5551B_0002n (a fresh single v2 run seed).
//   [v2 CHANGE (1)] coupledComponents (the §4.0 minimal sparse-pairwise graph), bBase, lambdaCouple,
//                   and the registered Concord_p concordant-cell lists (§4.1).
//   [v2 CHANGE (3)] the hand-fixed scalars thetaSurprise/kappa are REPLACED by the registered
//                   grids thetaSurpriseGrid (G_θ) and kappaGrid (G_κ) selected on TRAIN (§5.2.1).
//   [v2 CHANGE (2)] / (4) are reasoning/metric deltas — no NEW config value is introduced here
//                   (the aligned-EVSI baseline and the S6/AQ mandatory-safety scoping use only
//                   already-registered structure; see ssi.ts / metrics.ts).
//
// Discipline (HARNESS-SPEC-v2 §0): strict TS, ES modules ("type":"module"), no `any`
// in public signatures, all probabilities/info quantities are IEEE-754 `number`,
// natural-log nats throughout. This module consumes NO randomness.
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — registered concrete values, no new
//        parameters beyond the PRE-REGISTRATION-v2 §9.4 lock list):
//
//   C1. Constants given as EXPLICIT registered values in §9.4 are copied verbatim:
//       N=12, NFloor=8, alphaBase=1.0, B=3, weights (0.40,0.40,0.20),
//       deltaComposite=0.05, alphaFWER=0.05, permExactMaxN=20,
//       permMonteCarloDraws=100000, bootstrapDraws=10000, ncSpecificityBar=0.80,
//       ppcReplications=2000, ppcAdequateBand=[0.05,0.95], tauMV=0.02,
//       mvReliabilitySE=4. [v2] seedMaster=0x5551B_0002, bBase=1.0,
//       lambdaCouple=2.0, G_θ={0.00,0.02,0.05,0.10,0.15,0.20,0.30,0.50},
//       G_κ={0.00,0.01,0.02,0.05,0.10} (PRE-REG-v2 §4.1, §5.2.1).
//
//   C2. As in v1, several CONCRETE NUMERIC values the pre-registration declares
//       "part of the locked spec carried into the harness" (the §2.3 skews/couplings,
//       the §2.4 family signatures, the §5.3 rates, the §6.5 binning) are the v1
//       registered digits, carried VERBATIM (the §2 world + oracle is UNCHANGED in v2,
//       PRE-REG-v2 §B.1). They introduce no parameter NAME not already in §9.4.
//
//   C3. [v2 CHANGE (3)] thetaSurprise/kappa are no longer hand-fixed scalars. They are
//       SELECTED on the TRAIN split (§5.2.1) by a deterministic argmax over the registered
//       grids G_θ × G_κ with a conservative toward-silence tie-break. Only the GRIDS are
//       registered here; the selected operating point is produced by ssi.ts at run time.
//       The v1 single values (θ=0.05, κ=0.0) are members of G_θ / G_κ respectively, so the
//       v1 operating point remains reachable (λ→0 / blind-fixed continuity).
//
//   C4. calibrationBins = 10 — "a fixed number of equal-width bins" (§6.5),
//       diagnostic/reported only, never part of the gate composite. (UNCHANGED.)
//
//   C5. evalRates (§5.3, UNCHANGED): registered category RATES (may overlap; need not
//       sum to 1) plus a fixed per-user case count: negativeControlFrac 0.30,
//       pivotalFrac 0.30, safetyFrac 0.10, casesPerUser 20.
//
//   C6. contextSkews / correlatedPairs / families (§2.3/§2.4, UNCHANGED): carried
//       VERBATIM from v1 (the generative world is identical in v2, PRE-REG-v2 §B.1).
//       `correlatedPairs[].strength` is consumed by generative.ts to build the NON-product
//       joint truth; posterior.ts never reads it (it reads `concord`/`lambdaCouple` instead).
//
//   C7. [v2 CHANGE (1)] coupledComponents (§4.0): the MINIMAL coupling — exactly the §2.3
//       registered latent pairs. P1 = (grit, routing), P2 = (artifact, expertise); singletons
//       {bright}, {interrupt}; interrupt uses the flow-extended key c⁺ (realizing interrupt×flow
//       as a conditioning key, not a latent edge). All other axes stay factored. At λ_couple → 0
//       the coupled prior recovers the v1 factored model exactly (§4.0/§4.1).
//
//   C8. [v2 CHANGE (1)] concord (Concord_p, §4.1): the registered set of concordant (j,l) joint
//       cells expressing §2.3's FIXED SIGN of association (the cells that receive the +λ_couple
//       prior boost in β^0 = b_base + λ_couple·𝟙[(j,l)∈Concord_p]). The pair order is the
//       `coupledComponents.pairs` order: P1 cell = (grit level j, routing level l); P2 cell =
//       (artifact level j, expertise level l). Both §2.3 registered pairs have sign +1 (v1
//       correlatedPairs: grit×routing +, artifact×expertise +), so the concordant cells are the
//       agreement pattern of each pair:
//         • P1 (grit × routing, +): gritty grit ↔ the serial/send-return routing idioms
//           (PRE-REG-v2 §4.1 example "gritty ↔ {serial, send-return}"). Routing is CATEGORICAL,
//           so the agreement is expressed exactly as the two listed (gritty,·) cells:
//           (grit=2 "gritty", routing=0 "serial") and (grit=2 "gritty", routing=2 "send-return").
//         • P2 (artifact × expertise, +): both ORDINAL, so the agreement is the monotone diagonal
//           (PRE-REG-v2 §4.1 example "expert ↔ tolerant"): (0,0) intolerant↔novice,
//           (1,1) mixed↔intermediate, (2,2) tolerant↔expert.
//       These are the registered §2.3 sign patterns carried into the harness (PRE-REG-v2 §4.1:
//       "the concrete Concord_p cell lists ... are part of the locked spec carried into the
//       harness"). No new parameter NAME is introduced; only the registered concordant cells.
//
//   C9. ESM import discipline: HARNESS-SPEC-v2 §0 mandates NodeNext ES modules, so the
//       type-only import uses the `.js` specifier (`./types.js`) per TS NodeNext. (UNCHANGED.)
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AxisSpec,
  ContextSkewTable,
  CorrelatedPair,
  CoupledComponentSpec,
  FamilyId,
  HeldOutContextCombo,
  LikelihoodSignature,
  LockedConfig,
  PairId,
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

// ── §2.1 axes (6 axes, K=3 levels each) — UNCHANGED from v1 ──
const AXES: readonly AxisSpec[] = [
  { id: "grit", kind: "ordinal", levels: ["clean", "neutral", "gritty"] },
  { id: "bright", kind: "ordinal", levels: ["dark", "neutral", "bright"] },
  { id: "interrupt", kind: "ordinal", levels: ["low", "medium", "high"] },
  { id: "artifact", kind: "ordinal", levels: ["intolerant", "mixed", "tolerant"] },
  { id: "expertise", kind: "ordinal", levels: ["novice", "intermediate", "expert"] },
  { id: "routing", kind: "categorical", levels: ["serial", "parallel", "send-return"] },
];

// ── §2.3 registered axis×context prior skews (additive α adjustments) — UNCHANGED from v1 ──
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

// ── §2.3 registered correlated pairs (fixed sign + magnitude) — UNCHANGED from v1 ──
const CORRELATED_PAIRS: readonly CorrelatedPair[] = [
  { a: "grit", b: "routing", sign: 1, strength: 0.5 },      // P1: gritty → serial/send-return
  { a: "artifact", b: "expertise", sign: 1, strength: 0.5 }, // P2: experts more artifact-tolerant
  { a: "interrupt", b: "flow", sign: -1, strength: 0.5 },    // axis×context coupling (flow-extended key)
];

// ── [v2 CHANGE (1)] §4.0 minimal sparse-pairwise coupling graph (NOTES C7) ──
// Exactly the §2.3 registered LATENT pairs become joint Dirichlets; interrupt×flow is realized
// as the flow-extended conditioning key on the {interrupt} singleton; everything else factored.
const COUPLED_COMPONENTS: CoupledComponentSpec = {
  pairs: {
    P1: ["grit", "routing"],        // edge A_grit — A_routing
    P2: ["artifact", "expertise"],  // edge A_artifact — A_expertise
  },
  singletons: ["bright", "interrupt"],
  flowExtendedAxis: "interrupt",    // {interrupt} conditioned on c⁺ = (subdomain, genre, flow)
};

// ── [v2 CHANGE (1)] §4.1 registered concordant cells Concord_p (NOTES C8) ──
// Cells (j = first-member level, l = second-member level) that receive the +λ_couple prior boost,
// expressing each pair's §2.3 fixed sign (both registered pairs are sign +1).
const CONCORD: Readonly<Record<PairId, readonly (readonly [0 | 1 | 2, 0 | 1 | 2])[]>> = {
  // P1 grit×routing (+): gritty ↔ {serial, send-return} (PRE-REG-v2 §4.1 example; routing categorical)
  P1: [
    [2, 0], // gritty grit ↔ serial routing
    [2, 2], // gritty grit ↔ send-return routing
  ],
  // P2 artifact×expertise (+): monotone agreement diagonal, "expert ↔ tolerant" (PRE-REG-v2 §4.1)
  P2: [
    [0, 0], // intolerant ↔ novice
    [1, 1], // mixed ↔ intermediate
    [2, 2], // tolerant ↔ expert
  ],
};

// ── §2.4 family likelihood signatures — UNCHANGED from v1 ──
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

// ── §5.1 family partition — UNCHANGED from v1 ──
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

// ── §5.1 held-out (axis-profile × context) combinations — UNCHANGED from v1 ──
const HELD_OUT_CONTEXT_COMBOS: readonly HeldOutContextCombo[] = [
  // canonical: grit-leaning user in a clean-mastering context (§5.1/§5.6)
  { axis: "grit", level: 2, context: { subdomain: "mastering", genre: "clean-pop" } },
  // its mirror: clean-leaning user in a lo-fi context (§5.1)
  { axis: "grit", level: 0, context: { genre: "lofi" } },
];

// ── [v2 CHANGE (3)] §5.2.1 registered calibration grids (NOTES C3) ──
const THETA_SURPRISE_GRID: readonly number[] = [0.0, 0.02, 0.05, 0.1, 0.15, 0.2, 0.3, 0.5];
const KAPPA_GRID: readonly number[] = [0.0, 0.01, 0.02, 0.05, 0.1];

// ─────────────────────────────────────────────────────────────────────────────
// The single deeply-frozen CONFIG object — the only parameter source (§3).
// ─────────────────────────────────────────────────────────────────────────────
export const CONFIG: Readonly<LockedConfig> = deepFreeze<LockedConfig>({
  // ── identity / sample (§7.2, §7.3) ──
  seedMaster: 0x5551b_0002n, // [v2 §A.0] SEED_MASTER (DISTINCT from v1 0x5551B_0001n)
  N: 12, // target (§7.2)
  NFloor: 8, // pilot floor (§7.2)

  // ── generative structure (§2) — UNCHANGED ──
  axes: AXES,
  alphaBase: 1.0, // symmetric Laplace Dirichlet prior (§4.1)
  contextSkews: CONTEXT_SKEWS,
  correlatedPairs: CORRELATED_PAIRS,

  // ── [v2 CHANGE (1)] coupling spec (§4.0/§4.1) ──
  coupledComponents: COUPLED_COMPONENTS,
  bBase: 1.0, // uniform pseudo-count per joint cell (§4.1)
  lambdaCouple: 2.0, // registered concordance strength (§4.1); λ=0 ⇒ v1 factored
  concord: CONCORD,

  families: FAMILIES,
  trainFamilies: TRAIN_FAMILIES,
  heldOutFamilies: HELD_OUT_FAMILIES,
  heldOutContextCombos: HELD_OUT_CONTEXT_COMBOS,

  // ── §5.3 evaluation-set composition (NOTES C5) — UNCHANGED ──
  evalRates: {
    negativeControlFrac: 0.3,
    pivotalFrac: 0.3,
    safetyFrac: 0.1,
    casesPerUser: 20,
  },

  // ── §4 SSI constants ── [v2 CHANGE (3)] grids replace hand-fixed scalars (NOTES C3) ──
  thetaSurpriseGrid: THETA_SURPRISE_GRID, // G_θ (nats), TRAIN-selected (§5.2.1)
  kappaGrid: KAPPA_GRID, // G_κ (value units), TRAIN-selected (§5.2.1)
  turnBudget: 3, // B = 3 (§4.6)

  // ── §6.4 / §7.1 composite weights (sum = 1; §9.4) — UNCHANGED ──
  weights: { wAQ: 0.4, wVoI: 0.4, wUS: 0.2 },

  // ── §7 test machinery — UNCHANGED ──
  deltaComposite: 0.05, // margin δ_composite (§7.4)
  alphaFWER: 0.05, // Holm FWER α (§7.4)
  permExactMaxN: 20, // exact enumeration when N ≤ 20 (§7.4)
  permMonteCarloDraws: 100_000, // MC fallback (§7.4)
  bootstrapDraws: 10_000, // reporting-only percentile bootstrap (§7.5)
  ncSpecificityBar: 0.8, // H-NC specificity bar (§7.6)

  // ── §8 G1B-MV — UNCHANGED thresholds (model-under-test is now M-cpl) ──
  ppcReplications: 2_000, // posterior-predictive replications (§8.1)
  ppcAdequateBand: [0.05, 0.95], // adequate PPC tail band (§8.1)
  tauMV: 0.02, // model-validity materiality τ_MV, nats/obs (§8.2)
  mvReliabilitySE: 4, // 4·SE reliability bar (§8.2)

  // ── §6.5 calibration — UNCHANGED ──
  calibrationBins: 10, // fixed equal-width bins for ECE (NOTES C4)
});

// ─────────────────────────────────────────────────────────────────────────────
// assertConfigInvariants — enforces the §9.4 lock at startup. A violation makes
// the run INVALID (it throws); this is NOT a FAIL verdict, it is an invalid run
// (HARNESS-SPEC-v2 §3). Call once before any data is generated (run.ts).
//
// [v2] additionally asserts seedMaster === 0x5551B_0002n (a v1-seeded run cannot masquerade as
// v2), the coupling invariants (lambdaCouple ≥ 0; bBase > 0; valid Concord_p cells; the §4.0
// component set == {P1,P2}+singletons{bright,interrupt}), and the non-empty, sorted G_θ/G_κ grids.
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

  // SSI constants (§4): proper prior, positive budget
  if (!(c.alphaBase > 0)) fail(`alphaBase=${c.alphaBase} must be > 0 (proper Dirichlet)`);
  if (!Number.isInteger(c.turnBudget) || c.turnBudget < 1) {
    fail(`turnBudget=${c.turnBudget} must be a positive integer`);
  }
  // [v2] B is locked to exactly 3 (§4.6 / §9.4)
  if (c.turnBudget !== 3) fail(`turnBudget=${c.turnBudget} ≠ 3 (locked §4.6)`);

  // ── [v2 CHANGE (3)] calibration grids: non-empty, finite, non-negative, strictly sorted (§5.2.1) ──
  const assertGrid = (name: string, g: readonly number[]): void => {
    if (g.length < 1) fail(`${name} must be non-empty`);
    for (let i = 0; i < g.length; i++) {
      if (!Number.isFinite(g[i]) || g[i] < 0) fail(`${name}[${i}]=${g[i]} must be finite and ≥ 0`);
      if (i > 0 && !(g[i] > g[i - 1])) {
        fail(`${name} must be strictly ascending (sorted) — ${g[i - 1]} !< ${g[i]}`);
      }
    }
  };
  assertGrid("thetaSurpriseGrid", c.thetaSurpriseGrid);
  assertGrid("kappaGrid", c.kappaGrid);

  // ── [v2 CHANGE (1)] coupling invariants (§4.0/§4.1) ──
  if (!(c.lambdaCouple >= 0)) fail(`lambdaCouple=${c.lambdaCouple} must be ≥ 0 (λ=0 ⇒ v1 factored)`);
  if (!(c.bBase > 0)) fail(`bBase=${c.bBase} must be > 0 (proper joint Dirichlet)`);

  // §4.0 component set must be EXACTLY {P1,P2} + singletons{bright,interrupt}, interrupt flow-extended.
  const cc = c.coupledComponents;
  const pairIds = Object.keys(cc.pairs).sort();
  if (pairIds.length !== 2 || pairIds[0] !== "P1" || pairIds[1] !== "P2") {
    fail(`coupledComponents.pairs must be exactly {P1,P2} (got ${pairIds.join(",")})`);
  }
  const axisIds = new Set<string>(c.axes.map((a) => a.id));
  const inAxes = (a: string): boolean => axisIds.has(a);
  // P1 = (grit,routing), P2 = (artifact,expertise) — the §2.3 registered latent pairs.
  const p1 = cc.pairs.P1;
  const p2 = cc.pairs.P2;
  if (p1.length !== 2 || p1[0] !== "grit" || p1[1] !== "routing") {
    fail(`coupledComponents.pairs.P1 must be (grit,routing) (got ${p1.join(",")})`);
  }
  if (p2.length !== 2 || p2[0] !== "artifact" || p2[1] !== "expertise") {
    fail(`coupledComponents.pairs.P2 must be (artifact,expertise) (got ${p2.join(",")})`);
  }
  // singletons must be exactly {bright, interrupt}, all real axes, disjoint from the paired axes.
  const singletons = [...cc.singletons].sort();
  if (singletons.length !== 2 || singletons[0] !== "bright" || singletons[1] !== "interrupt") {
    fail(`coupledComponents.singletons must be exactly {bright,interrupt} (got ${singletons.join(",")})`);
  }
  for (const a of cc.singletons) {
    if (!inAxes(a)) fail(`singleton axis ${a} is not a registered axis (§2.1)`);
  }
  // every axis appears in exactly one component (forest partition over the 6 axes, §4.0).
  const covered = [p1[0], p1[1], p2[0], p2[1], ...cc.singletons];
  if (covered.length !== 6 || new Set(covered).size !== 6) {
    fail(`coupledComponents must partition all 6 axes exactly once (§4.0); covered=${covered.join(",")}`);
  }
  // the flow-extended axis must be a singleton (it is the {interrupt} singleton, §4.0/§4.1).
  if (!cc.singletons.includes(cc.flowExtendedAxis)) {
    fail(`flowExtendedAxis=${cc.flowExtendedAxis} must be one of the singletons`);
  }
  if (cc.flowExtendedAxis !== "interrupt") {
    fail(`flowExtendedAxis=${cc.flowExtendedAxis} must be 'interrupt' (§4.0 realizes interrupt×flow)`);
  }

  // Concord_p: one entry per pair, each cell a valid (j,l) in 0..2, no duplicate cells (§4.1).
  for (const pid of ["P1", "P2"] as const) {
    const cells = c.concord[pid];
    if (!cells || cells.length < 1) fail(`concord.${pid} must have ≥ 1 concordant cell (§4.1)`);
    const seen = new Set<string>();
    for (const cell of cells) {
      if (cell.length !== 2) fail(`concord.${pid} cell must be a (j,l) pair`);
      for (const v of cell) {
        if (v !== 0 && v !== 1 && v !== 2) fail(`concord.${pid} cell level ${v} not in {0,1,2}`);
      }
      const key = `${cell[0]},${cell[1]}`;
      if (seen.has(key)) fail(`concord.${pid} has duplicate cell (${key})`);
      seen.add(key);
    }
    // a concordant set must not saturate all 9 cells (otherwise λ adds no sign structure).
    if (cells.length >= 9) fail(`concord.${pid} cannot include all 9 cells (§4.1: it encodes a sign)`);
  }

  // structural locks (§2.1, §5.1) — UNCHANGED
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

  // test machinery sanity (§7.4/§7.5/§8.1) — UNCHANGED
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

  // ── [v2 §A.0] the registered seed is a bigint AND is the v2 master (§7.3) ──
  if (typeof c.seedMaster !== "bigint") fail("seedMaster must be a bigint (§7.3)");
  if (c.seedMaster !== 0x5551b_0002n) {
    fail(`seedMaster=0x${c.seedMaster.toString(16)} ≠ 0x5551B_0002 (v2 master; a v1-seeded run cannot masquerade as v2)`);
  }
}
