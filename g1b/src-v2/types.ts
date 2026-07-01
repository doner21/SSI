// src-v2/types.ts — G1B Falsifier v2 shared data structures (DECLARATIONS ONLY, no logic).
//
// Maps directly to HARNESS-SPEC-v2.md §2 (and the declared shapes referenced by §3).
// Every threshold/weight/seed/partition VALUE lives in src-v2/config.ts; this file only
// locks the *data contract* between modules. No runtime logic appears here.
//
// Relationship to v1 (g1b/src/types.ts): the v1 types are carried VERBATIM; the v2 additions
// are flagged `[v2]` per HARNESS-SPEC-v2 §2 and the four permitted deltas of PRE-REG-v2 §A.
// v1 (`g1b/src/`) is the permanent locked record of attempt 1 and is NOT modified by this file.
//
// The four v2 deltas that surface in THIS file's data contract:
//   [v2 CHANGE (1)] sparse-pairwise COUPLING — new joint-pair posterior types
//       (PairId, JointDirichletParams, JointPosterior, CoupledPosterior) and the
//       CoupledComponentSpec config shape (§4.0/§4.1); the v1 fully-factored type
//       FactoredPosterior is RETAINED only as the mv.ts M-fac reference / λ→0 limit.
//   [v2 CHANGE (2)] aligned EVSI — no new TYPE here (it is a reasoning change in ssi.ts);
//       the IRSelectionInput contract is unchanged.
//   [v2 CHANGE (3)] TRAIN-only calibration — CalibratedConstants (the TRAIN-fit operating
//       point) replaces the v1 hand-fixed thetaSurprise/kappa scalars on LockedConfig with
//       the registered grids thetaSurpriseGrid / kappaGrid (§5.2.1).
//   [v2 CHANGE (4)] S6/AQ mandatory-safety split — ConsequenceCase.safetyClass scoping flag
//       and PerUserMetrics.ms (the separate, REPORTED-not-gated mandatory-safety bucket; §6.1.1).
//   [v2 §A.0] the new SEED_MASTER = 0x5551B_0002n is registered on LockedConfig.seedMaster.
//
// Discipline (HARNESS-SPEC-v2 §0): strict TS, ES modules, no `any` in public signatures,
// `number` is IEEE-754 double, natural-log nats are the unit for all info quantities.
//
// NOTES (spec-ambiguity interpretations — declarations only, no new parameters introduced):
//   N1. As in v1, the FULL §3 `LockedConfig` interface is declared HERE (config.ts imports
//       the type and exports the frozen const + assertConfigInvariants). Import-compatible;
//       introduces no parameter not frozen in PRE-REG-v2 §9.4.
//   N2. `HoldoutPartition` is the shared data shape (built in holdout.ts); declared here so
//       every module imports one contract. Shape preserved exactly (§6, UNCHANGED from v1).
//   N3. `ContextSkewTable`, `CorrelatedPair`, `HeldOutContextCombo`, and `CoupledComponentSpec`
//       are declared per HARNESS-SPEC-v2 §3 ("Supporting declared shapes ... live in types.ts").
//       Numeric values are NOT placed here — only the shapes; values are frozen in config.ts.
//   N4. §2.3 registered correlated pairs include one axis×CONTEXT coupling (interrupt×flow);
//       `CorrelatedPair.b` is therefore typed `AxisId | keyof Context` to admit both the
//       axis×axis pairs (P1 grit×routing, P2 artifact×expertise) and the axis×context pair.
//   N5. [v2] The joint-pair posterior over a registered pair is stored ROW-MAJOR over the
//       K_a·K_b = 9 cells, index = j*3 + l (axis a = first member at level j, axis b = second
//       member at level l). This row-major convention is the shared contract consumed identically
//       by posterior.ts, ssi.ts, baselines.ts (the single shared coupling) and mv.ts (§4.0/§4.1).

// ---- §2.1 latent style axes (UNCHANGED from v1) ----
export type AxisId =
  | "grit" | "bright" | "interrupt" | "artifact" | "expertise" | "routing";
export type AxisLevel = 0 | 1 | 2;            // every locked axis has K_a = 3 levels (§2.1)
export interface AxisSpec {
  readonly id: AxisId;
  readonly kind: "ordinal" | "categorical";
  readonly levels: readonly [string, string, string];   // human labels per level
}

// ---- §2.2 context variables (UNCHANGED) ----
export type SubdomainLevel = "synthesis" | "mixing" | "mastering";
export type FlowLevel = "exploring" | "focused";
export type GenreLevel = "lofi" | "clean-pop" | "experimental";
export interface Context {
  readonly subdomain: SubdomainLevel;
  readonly flow: FlowLevel;
  readonly genre: GenreLevel;
}
// §4.7 bucket key c = (subdomain, genre) for components P1, P2, {bright}; flow enters only the
// {interrupt} singleton via the flow-extended key c⁺ (§4.0/§4.1).
export type ContextBucketKey = string;        // canonical `${subdomain}|${genre}`
export type FlowBucketKey = string;           // [v2] canonical `${subdomain}|${genre}|${flow}` (§4.0/§4.1 c⁺)

// ---- §2.3 latent user + fossils (UNCHANGED) ----
export type ThetaState = Readonly<Record<AxisId, AxisLevel>>;   // the hidden true state θ_u — never shown
export interface Fossil {                       // one past episode's observable style signal
  readonly context: Context;
  readonly axis: AxisId;
  readonly observedLevel: AxisLevel;            // sampled from θ_u | context (§2.3)
  // [v2 reading, NOT a generative change]: episodes that jointly exercise a registered §2.3 pair
  // carry the partner axis level so co-occurrence co-counts m_{p,c,(j,l)} can be read off the SAME
  // fossils v1 consumed (§4.1). Absent when the episode does not exercise a registered pair.
  readonly jointPartner?: { readonly axis: AxisId; readonly level: AxisLevel };
}
export interface SyntheticUser {
  readonly id: number;                          // 0..N-1
  readonly theta: ThetaState;                   // ground truth — never shown to any method
  readonly fossils: readonly Fossil[];          // the ONLY user-specific evidence (§2.3)
}

// ---- §2.4 consequence families & likelihood signatures (UNCHANGED — likelihood stays per-axis/generic) ----
export type FamilyId =
  | "headroom-clip-risk" | "brightness-shift" | "routing-idiom-change"   // TRAIN (§5.1)
  | "inharmonic-artifact" | "added-latency"                              // HELD-OUT
  | "feedback-safety";                                                   // HELD-OUT safety-class (§4.4/§5.1)
export type FamilyClass = "ordinary" | "safety";
// Generic per-family likelihood signature L(C | axis=k, context) (§2.4), context-modulated.
export interface LikelihoodSignature {
  readonly family: FamilyId;
  readonly familyClass: FamilyClass;
  // touchedAxes: axes whose L is non-flat (only these update the posterior, §4.2)
  readonly touchedAxes: readonly AxisId[];
  // L[axis][level][bucket] -> non-negative likelihood weight (declared shape; values in config.ts)
  readonly L: Readonly<Record<AxisId, readonly [number, number, number]>>;
  // optional per-bucket modulation multipliers (§2.4 context-modulation)
  readonly bucketMod?: Readonly<Record<ContextBucketKey, number>>;
}

// ---- a detected consequence instance (a single evaluation/fitting case) ----
export interface ConsequenceCase {
  readonly caseId: number;
  readonly userId: number;
  readonly context: Context;
  readonly family: FamilyId;
  readonly split: "train" | "eval";            // §5.2 wall tag
  readonly heldOut: { family: boolean; context: boolean };  // §5.1 single/double held-out tags
  // oracle labels — computed in generative.ts from θ_u and context ONLY (§2.5)
  readonly oracle: { worthSurfacing: 0 | 1; answerChangesIR: 0 | 1; negativeControl: boolean };
  // [v2 CHANGE (4)] derived, method-independent scoping flag (§6.1.1): safety-class ⇒ mandatory-safety
  // bucket. == (signature.familyClass === "safety"). Excluded IDENTICALLY from the composite for ALL methods.
  readonly safetyClass: boolean;
}

// ---- a method's decision on a case (UNCHANGED) ----
export type SurfaceDecision = 0 | 1;           // 1 = surface a question, 0 = abstain
export interface MethodDecision {
  readonly caseId: number;
  readonly surface: SurfaceDecision;
  readonly score: number;                      // EVSI_aligned for SSI; rule score for baselines (§6.5)
}

// ---- per-axis posteriors (§4.1) ----
export type DirichletParams = Readonly<[number, number, number]>;        // α over 3 levels (per-axis)
export type AxisPosterior = Readonly<[number, number, number]>;          // normalized P(axis=k|·)

// ---- [v2 CHANGE (1)] joint-pair posterior over K_a·K_b = 9 cells, row-major (j*3 + l) (NOTES N5) ----
export type PairId = "P1" | "P2";                                        // §4.0 {grit×routing},{artifact×expertise}
export type JointDirichletParams = Readonly<number[]>;                   // length 9, β over joint cells
export type JointPosterior = Readonly<number[]>;                         // length 9, normalized P(a=j,b=l|·)

// [v2] the coupled belief state = product over the §4.0 components (forest of disjoint components).
export interface CoupledPosterior {
  readonly pairs: Readonly<Record<PairId, JointPosterior>>;              // P1, P2 joints (9 cells each)
  readonly interrupt: AxisPosterior;                                     // singleton on flow-extended key c⁺
  readonly bright: AxisPosterior;                                        // singleton on c
}
// the v1 fully-factored type is retained ONLY for mv.ts M-fac reference and the λ→0 limit test:
export type FactoredPosterior = Readonly<Record<AxisId, AxisPosterior>>; // product-of-axes belief

// ---- IR selection (§2.5 / §4.5) ----
export type IRId = string;                     // identifier of a chosen intermediate representation
export interface IRSelectionInput {            // tolerance-over-candidate-IRs view of a belief state
  readonly effectiveTolerance: Readonly<Record<AxisId, AxisPosterior | AxisLevel>>;
  readonly context: Context;
  readonly family: FamilyId;
}

// ---- [v2 CHANGE (3)] calibration result (the TRAIN-fit operating point; §5.2.1) ----
export interface CalibratedConstants {
  readonly thetaSurprise: number;              // θ*_surprise selected on TRAIN (§4.3/§5.2.1)
  readonly kappa: number;                      // κ* selected on TRAIN (§4.5/§5.2.1)
  readonly trainComposite: number;             // argmax objective value (diagnostic, reported)
}

// ---- [v2 CHANGE (4)] per-user metrics now carry the separate mandatory-safety bucket (§6.1.1) ----
export interface PerUserMetrics {
  readonly aq: number;                         // answer-quality over D_disc only (§6.1.1)
  readonly us: number;                         // user-surfacing (silence-specificity) over D_disc only
  readonly voi: number;                        // value-of-information over D_disc only
  readonly composite: number;                  // §6.4 composite over D_disc only
  readonly ms: number;                         // mandatory-safety compliance over D_safety (REPORTED, not gated)
}

// ---- §2.3 declared shapes: registered prior skews & correlated structure ----
// Concrete numeric values are frozen in config.ts (§3); only the SHAPE is declared here (NOTES N3).

// One registered axis×context prior-skew entry: how a context variable's level reshapes the
// marginal prior over an axis's 3 levels (§2.3 "context-conditioning of the prior").
export interface ContextSkew {
  readonly axis: AxisId;
  readonly conditionedOn: keyof Context;                 // which context variable modulates the prior
  readonly level: SubdomainLevel | FlowLevel | GenreLevel; // the conditioning context level
  readonly skew: readonly [number, number, number];      // per-axis-level skew applied to the prior
}
export type ContextSkewTable = readonly ContextSkew[];

// One registered correlated pair (§2.3). The second member may be another axis (grit×routing,
// artifact×expertise) or a context variable (interrupt×flow — an axis×context coupling, NOTES N4).
export interface CorrelatedPair {
  readonly a: AxisId;
  readonly b: AxisId | keyof Context;
  readonly sign: -1 | 1;                                  // fixed sign of association (registered)
  readonly strength: number;                             // registered coupling magnitude
}

// One held-out (axis-profile × context) combination (§5.1).
export interface HeldOutContextCombo {
  readonly axis: AxisId;
  readonly level: AxisLevel;                              // the held-out axis-profile level
  readonly context: Partial<Context>;                    // the held-out context cell (subdomain/genre)
}

// ---- [v2 CHANGE (1)] coupling spec (the §4.0 minimal sparse-pairwise graph; NOTES N3/N5) ----
// The minimal coupling: exactly the §2.3 registered latent pairs, nothing more. The graph is a
// forest of disjoint components — two joint pairs + two singletons — so the joint posterior
// factorizes over components and every normalizer is a closed-form sum over ≤ K_a·K_b = 9 cells.
export interface CoupledComponentSpec {
  // The two registered latent edges, each an ordered [a, b] axis pair (a = first member at level
  // j, b = second member at level l) consumed row-major (j*3 + l) by posterior.ts (NOTES N5).
  readonly pairs: Readonly<Record<PairId, readonly [AxisId, AxisId]>>;
  // The two singletons kept fully factored (per-axis Dirichlet), identical to v1 (§4.1(a)).
  readonly singletons: readonly AxisId[];
  // Which singleton uses the flow-extended key c⁺ = (subdomain, genre, flow) — realizing the
  // §2.3 A_interrupt × X_flow coupling as a conditioning key (not a latent edge). Must be a member
  // of `singletons`. The other singleton ({bright}) uses the plain bucket key c.
  readonly flowExtendedAxis: AxisId;
}

// ---- §5.1/§6 held-out partition (shared data shape; built in holdout.ts) (NOTES N2; UNCHANGED) ----
export interface HoldoutPartition {
  readonly trainFamilies: ReadonlySet<FamilyId>;
  readonly heldOutFamilies: ReadonlySet<FamilyId>;
  readonly heldOutContextCombos: readonly HeldOutContextCombo[];
}

// ---- locked configuration (the frozen registered parameters) (§3; NOTES N1) ----
// The single deeply-frozen CONFIG object (and assertConfigInvariants) live in config.ts and
// implement this interface. Every field is a parameter already frozen in PRE-REGISTRATION-v2 §9.4.
export interface LockedConfig {
  readonly seedMaster: bigint;                 // [v2 §A.0] 0x5551B_0002n (§7.3) — DISTINCT from v1 0x5551B_0001n
  readonly N: number;                          // 12 target (§7.2)
  readonly NFloor: number;                     // 8 pilot floor (§7.2)

  readonly axes: readonly AxisSpec[];          // §2.1 (6 axes, K=3 each) — UNCHANGED
  readonly alphaBase: number;                  // 1.0 symmetric Dirichlet prior (§4.1) — UNCHANGED
  readonly contextSkews: ContextSkewTable;     // §2.3 registered axis×context prior skews — UNCHANGED
  readonly correlatedPairs: readonly CorrelatedPair[]; // §2.3 generative pairs — UNCHANGED

  // ---- [v2 CHANGE (1)] coupling spec (the §4.0 minimal sparse-pairwise graph) ----
  readonly coupledComponents: CoupledComponentSpec;  // §4.0: P1={grit,routing}, P2={artifact,expertise},
                                                     //        singletons {bright}, {interrupt}(flow-extended)
  readonly bBase: number;                      // 1.0 uniform pseudo-count per joint cell (§4.1)
  readonly lambdaCouple: number;               // 2.0 registered concordance strength (§4.1); λ=0 ⇒ v1 factored
  readonly concord: Readonly<Record<PairId, readonly (readonly [AxisLevel, AxisLevel])[]>>; // §4.1 Concord_p cells

  readonly families: readonly LikelihoodSignature[];   // §2.4 (all families + signatures + class) — UNCHANGED
  readonly trainFamilies: readonly FamilyId[];         // §5.1 {headroom-clip-risk,brightness-shift,routing-idiom-change}
  readonly heldOutFamilies: readonly FamilyId[];       // §5.1 {inharmonic-artifact,added-latency,feedback-safety}
  readonly heldOutContextCombos: readonly HeldOutContextCombo[]; // §5.1 grit×clean-mastering, clean×lofi

  // §5.3 registered evaluation-set composition (proportions sum-checked at load) — UNCHANGED
  readonly evalRates: {
    readonly negativeControlFrac: number;      // detected but worthSurfacing=0
    readonly pivotalFrac: number;              // answerChangesIR=1
    readonly safetyFrac: number;               // safety-class
    readonly casesPerUser: number;             // fixed per-user case count
  };

  // ---- §4 SSI constants ----
  // [v2 CHANGE (3)] θ_surprise and κ are NO LONGER hand-fixed scalars; they are SELECTED on TRAIN (§5.2.1)
  // by a deterministic argmax over these registered grids (conservative, toward-silence tie-break).
  readonly thetaSurpriseGrid: readonly number[]; // G_θ = {0.00,0.02,0.05,0.10,0.15,0.20,0.30,0.50} (nats)
  readonly kappaGrid: readonly number[];         // G_κ = {0.00,0.01,0.02,0.05,0.10} (value units)
  readonly turnBudget: number;                   // B = 3 (§4.6) — UNCHANGED

  // §6.4 / §7.1 composite weights (sum = 1) — UNCHANGED
  readonly weights: { readonly wAQ: 0.40; readonly wVoI: 0.40; readonly wUS: 0.20 };

  // §7 test machinery — UNCHANGED
  readonly deltaComposite: number;             // 0.05 margin (§7.4)
  readonly alphaFWER: number;                  // 0.05 Holm (§7.4)
  readonly permExactMaxN: number;              // 20 -> exact enumeration when N ≤ 20 (§7.4)
  readonly permMonteCarloDraws: number;        // 100000 fallback (§7.4)
  readonly bootstrapDraws: number;             // 10000 reporting-only (§7.5)
  readonly ncSpecificityBar: number;           // 0.80 H-NC (§7.6)

  // §8 G1B-MV — UNCHANGED thresholds; model-under-test is now M-cpl (§8 note)
  readonly ppcReplications: number;            // 2000 (§8.1)
  readonly ppcAdequateBand: readonly [number, number]; // [0.05, 0.95] (§8.1)
  readonly tauMV: number;                      // 0.02 nats/obs (§8.2)
  readonly mvReliabilitySE: number;            // 4 (·SE) (§8.2)

  readonly calibrationBins: number;            // fixed equal-width bin count for ECE (§6.5) — UNCHANGED
}
