// src/types.ts — G1B Falsifier shared data structures (DECLARATIONS ONLY, no logic).
//
// Maps directly to HARNESS-SPEC.md §2 (and the declared shapes referenced by §3).
// Every threshold/weight/seed/partition VALUE lives in src/config.ts; this file only
// locks the *data contract* between modules. No runtime logic appears here.
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules, no `any` in public signatures,
// `number` is IEEE-754 double, natural-log nats are the unit for all info quantities.
//
// NOTES (spec-ambiguity interpretations — declarations only, no new parameters introduced):
//   N1. HARNESS-SPEC §2 declares `LockedConfig` as an empty placeholder ("declared in §3
//       below; frozen object lives in config.ts"). task-1 explicitly requires the
//       `LockedConfig` *interface* to live in types.ts. We therefore declare the FULL §3
//       interface here; config.ts will `import type { LockedConfig }` and export the frozen
//       const + `assertConfigInvariants`. This is import-compatible and introduces no
//       parameter not frozen in PRE-REGISTRATION §9.4.
//   N2. HARNESS-SPEC §6 sketches `HoldoutPartition` inside holdout.ts. task-1 requires it as
//       a declared shape in types.ts. We declare the data shape here (shared contract);
//       holdout.ts will import it rather than redeclare it. Shape preserved exactly (§6).
//   N3. `ContextSkewTable`, `CorrelatedPair`, `HeldOutContextCombo` are declared per
//       HARNESS-SPEC §3 ("Supporting declared shapes ... live in types.ts; their concrete
//       numeric values are the registered skews/couplings of §2.3 and the partitions of
//       §5.1, frozen at load"). Numeric values are NOT placed here — only the shapes.
//   N4. §2.3 registered correlated pairs include one axis×CONTEXT coupling (interrupt×flow);
//       `CorrelatedPair.b` is therefore typed `AxisId | keyof Context` to admit both the
//       axis×axis pairs (grit×routing, artifact×expertise) and the axis×context pair.

// ---- §2.1 latent style axes (low-cardinality ordinal/categorical) ----
export type AxisId =
  | "grit" | "bright" | "interrupt" | "artifact" | "expertise" | "routing";
export type AxisLevel = 0 | 1 | 2;            // every locked axis has K_a = 3 levels (§2.1)
export interface AxisSpec {
  readonly id: AxisId;
  readonly kind: "ordinal" | "categorical";
  readonly levels: readonly [string, string, string];   // human labels per level
}

// ---- §2.2 context variables ----
export type SubdomainLevel = "synthesis" | "mixing" | "mastering";
export type FlowLevel = "exploring" | "focused";
export type GenreLevel = "lofi" | "clean-pop" | "experimental";
export interface Context {
  readonly subdomain: SubdomainLevel;
  readonly flow: FlowLevel;
  readonly genre: GenreLevel;
}
// bucket key c = (subdomain, genre) per §4.7; flow enters only the A_interrupt×flow coupling.
export type ContextBucketKey = string;        // canonical `${subdomain}|${genre}`

// ---- §2.3 latent user ----
export type ThetaState = Readonly<Record<AxisId, AxisLevel>>;   // the hidden true state θ_u
export interface Fossil {                       // one past episode's observable style signal
  readonly context: Context;
  readonly axis: AxisId;
  readonly observedLevel: AxisLevel;            // sampled from θ_u | context (§2.3)
}
export interface SyntheticUser {
  readonly id: number;                          // 0..N-1
  readonly theta: ThetaState;                   // ground truth — never shown to any method
  readonly fossils: readonly Fossil[];          // the ONLY user-specific evidence (§2.3)
}

// ---- §2.4 consequence families & likelihood signatures ----
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
}

// ---- a method's decision on a case ----
export type SurfaceDecision = 0 | 1;           // 1 = surface a question, 0 = abstain
export interface MethodDecision {
  readonly caseId: number;
  readonly surface: SurfaceDecision;
  readonly score: number;                      // method's surfacing score (EVSI for SSI; rule score for baselines) — for calibration §6.5
}

// ---- posteriors (§4.1) ----
export type DirichletParams = Readonly<[number, number, number]>;        // α over 3 levels
export type AxisPosterior = Readonly<[number, number, number]>;          // normalized P(axis=k|·)
export type FactoredPosterior = Readonly<Record<AxisId, AxisPosterior>>; // product-of-axes belief

// ---- IR selection (§2.5 / §4.5) ----
export type IRId = string;                     // identifier of a chosen intermediate representation
export interface IRSelectionInput {            // tolerance-over-candidate-IRs view of a belief state
  readonly effectiveTolerance: Readonly<Record<AxisId, AxisPosterior | AxisLevel>>;
  readonly context: Context;
  readonly family: FamilyId;
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

// One held-out (axis-profile × context) combination (§5.1), e.g.
// grit-leaning user (axis=grit, level=2/"gritty") × clean-mastering (subdomain=mastering, genre=clean-pop).
export interface HeldOutContextCombo {
  readonly axis: AxisId;
  readonly level: AxisLevel;                              // the held-out axis-profile level
  readonly context: Partial<Context>;                    // the held-out context cell (subdomain/genre)
}

// ---- §5.1/§6 held-out partition (shared data shape; built in holdout.ts) (NOTES N2) ----
export interface HoldoutPartition {
  readonly trainFamilies: ReadonlySet<FamilyId>;
  readonly heldOutFamilies: ReadonlySet<FamilyId>;
  readonly heldOutContextCombos: readonly HeldOutContextCombo[];
}

// ---- locked configuration (the frozen registered parameters) (§3; NOTES N1) ----
// The single deeply-frozen CONFIG object (and assertConfigInvariants) live in config.ts and
// implement this interface. Every field is a parameter already frozen in PRE-REGISTRATION §9.4.
export interface LockedConfig {
  readonly seedMaster: bigint;                 // 0x5551B_0001n (§7.3)
  readonly N: number;                          // 12 target (§7.2)
  readonly NFloor: number;                     // 8 pilot floor (§7.2)

  readonly axes: readonly AxisSpec[];          // §2.1 (6 axes, K=3 each)
  readonly alphaBase: number;                  // 1.0 symmetric Dirichlet prior (§4.1)
  readonly contextSkews: ContextSkewTable;     // §2.3 registered axis×context prior skews (numeric)
  readonly correlatedPairs: readonly CorrelatedPair[]; // §2.3 (grit×routing, artifact×expertise, interrupt×flow)

  readonly families: readonly LikelihoodSignature[];   // §2.4 (all families + signatures + class)
  readonly trainFamilies: readonly FamilyId[];         // §5.1 {headroom-clip-risk,brightness-shift,routing-idiom-change}
  readonly heldOutFamilies: readonly FamilyId[];       // §5.1 {inharmonic-artifact,added-latency,feedback-safety}
  readonly heldOutContextCombos: readonly HeldOutContextCombo[]; // §5.1 grit×clean-mastering, clean×lofi

  // §5.3 registered evaluation-set composition (proportions sum-checked at load)
  readonly evalRates: {
    readonly negativeControlFrac: number;      // detected but worthSurfacing=0
    readonly pivotalFrac: number;              // answerChangesIR=1
    readonly safetyFrac: number;               // safety-class
    readonly casesPerUser: number;             // fixed per-user case count
  };

  // §4 SSI locked constants
  readonly thetaSurprise: number;              // S1 KL threshold (registered, conservative §5.7)
  readonly kappa: number;                      // S4 cost-of-interruption κ ≥ 0
  readonly turnBudget: number;                 // B = 3 (§4.6)

  // §6.4 / §7.1 composite weights (sum = 1)
  readonly weights: { readonly wAQ: 0.40; readonly wVoI: 0.40; readonly wUS: 0.20 };

  // §7 test machinery
  readonly deltaComposite: number;             // 0.05 margin (§7.4)
  readonly alphaFWER: number;                  // 0.05 Holm (§7.4)
  readonly permExactMaxN: number;              // 20 -> exact enumeration when N ≤ 20 (§7.4)
  readonly permMonteCarloDraws: number;        // 100000 fallback (§7.4)
  readonly bootstrapDraws: number;             // 10000 reporting-only (§7.5)
  readonly ncSpecificityBar: number;           // 0.80 H-NC (§7.6)

  // §8 G1B-MV
  readonly ppcReplications: number;            // 2000 (§8.1)
  readonly ppcAdequateBand: readonly [number, number]; // [0.05, 0.95] (§8.1)
  readonly tauMV: number;                      // 0.02 nats/obs (§8.2)
  readonly mvReliabilitySE: number;            // 4 (·SE) (§8.2)

  readonly calibrationBins: number;            // fixed equal-width bin count for ECE (§6.5)
}
