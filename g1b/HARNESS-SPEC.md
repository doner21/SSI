# G1B Falsifier — HARNESS SPECIFICATION (implementation blueprint)

**Track:** SSI DAW — Track 1B salience-discrimination spike (Wizard-of-Oz, NO DSP engine).
**Phase:** PRE-REGISTRATION LOCK. This is the **implementation blueprint** an executor will implement *exactly* in a later phase. It contains **NO implementation code** (no function bodies, no algorithms expressed as statements) — only module layout, type/data-structure declarations, function **signatures**, the mapping from each module to the locked `PRE-REGISTRATION.md` sections, the deterministic seeding scheme, and the exact output artifacts. **No experiment is run and no results/JSON/REPORT files are produced in this phase.**
**Companion (source of truth for all parameters):** `C:/Users/doner/ssi/g1b/PRE-REGISTRATION.md` (LOCKED). Every threshold, margin, weight, seed, and test referenced here is defined and frozen there; this file must not introduce, change, or re-tune any of them.

**Claim labels (identical to PRE-REGISTRATION.md):**
- **[ARCH]** — an architectural commitment (how the harness is built / what it computes).
- **[PAPER]** — a claim whose ultimate evidentiary standard is a real-musician study (G5, N≥24); the harness produces only *pilot-grade synthetic* evidence for it.
- **[GATE]** — implements a binary, decision-forcing pass/fail criterion locked in PRE-REGISTRATION.md.

**Implementation integrity rule [ARCH]:** the harness implements §1–§9 of PRE-REGISTRATION.md **and only those**. It must not add a tunable parameter, must not let any method touch a held-out label during fitting (§5.2 wall), must not let SSI's decisions consume randomness (§4.7), and must compute every oracle label from the generative truth alone (§2.5), never from a method's output.

---

## 0. Target runtime, language, and constraints

- **Runtime:** Node 24 (LTS line), TypeScript, ES modules (`"type": "module"`). [ARCH]
- **No external statistics / probability library.** All distributions (Beta/Dirichlet), all information quantities (KL, entropy, EIG, EVSI), and the entire test machinery (paired sign-flip permutation, Holm step-down, percentile bootstrap) are implemented from closed-form arithmetic in-repo (§4, §7). Only the Node standard library and a small in-repo deterministic PRNG are permitted. [ARCH][GATE]
- **Determinism:** the whole run is bit-reproducible from `SEED_MASTER = 0x5551B_0001` (§7.3). The only randomness is data generation, the PPC replications, and the bootstrap; SSI's decisions are analytic and seed-free (§4.7). [ARCH][GATE]
- **No DSP engine.** Consequence detectors are mocked; fossils are synthetic; there is no audio (§9 Track 1B, Wizard-of-Oz). [ARCH]
- **TypeScript discipline:** `strict: true`, no `any` in public signatures, all randomness routed through the seeded streams of §7.3 (no `Math.random`). Numeric type for all probabilities/info quantities is `number` (IEEE-754 double); natural-log nats throughout (§4). [ARCH]

---

## 1. Module / file layout under `g1b/src/`

All paths relative to `C:/Users/doner/ssi/g1b/`. Each module maps to locked PRE-REGISTRATION.md sections. [ARCH]

| File | Responsibility | Implements PRE-REG §§ |
|---|---|---|
| `src/types.ts` | All shared data structures, enums, branded IDs, and the locked-config type. No logic. | §2, §3, §4, §5, §6, §7, §8 (declarations only) |
| `src/config.ts` | The single **locked-parameter object** (all registered constants, thresholds, seeds, weights, partitions, rates, signatures). Frozen; the only source of parameters. | §2–§9 (the §9.4 lock list) |
| `src/prng.ts` | Deterministic `SplitMix64`-style splittable PRNG; stream derivation by `hash(SEED_MASTER, label, …)`. | §7.3 |
| `src/generative.ts` | The synthetic ground-truth generative model + oracle: latent users, correlated/context-conditioned prior, fossils, consequence families & likelihood signatures, the two oracle labels, IR-selection oracle. | §2 (all), §5.3 rates |
| `src/holdout.ts` | Builds the TRAIN/HELD-OUT family partition + held-out context combinations **first** (no-peeking wall); tags every generated case as train/eval and single/double-held-out. | §5.1, §5.2 |
| `src/posterior.ts` | Factored, context-conditioned Beta/Dirichlet posteriors from fossil counts; consequence-conditioned update; closed-form KL, entropy. Shared belief core used by SSI **and** baseline (v). | §4.1, §4.2, §4.3, §4.6 |
| `src/ssi.ts` | The method under test: S1 surprise screen, S2/S3/S6 predicates, S4 EVSI gate, S5 EIG ranking + turn budget, full locked decision pipeline. | §3.0, §4.3–§4.7 |
| `src/baselines.ts` | The five baselines (i silent Route-2, ii generic linter, iii user-aware heuristic, iv LOO classifier, v factored-without-EIG/VoI ablation), each fit only on TRAIN split. | §3.1–§3.6 |
| `src/metrics.ts` | Exact per-user estimators: abstention quality, usefulness, answer-changing VoI, the locked composite, calibration/reliability curves + ECE. | §6 (all) |
| `src/stats.ts` | Paired sign-flip permutation test (exact enumeration at N=12), Holm–Bonferroni step-down, percentile bootstrap (reporting-only). No external lib. | §7.1–§7.5 |
| `src/mv.ts` | G1B-MV sub-gate: posterior-predictive checks (T_assoc), factored vs sparse-pairwise vs hierarchical ELPD comparison, materiality threshold, MV verdict. | §8 (all) |
| `src/decision.ts` | The ordered decision rule producing PASS / FAIL-descope(#5) / FAIL-MV / FAIL; consumes stats + mv + H-NC. | §9 (all) |
| `src/report.ts` | Renders the results JSON and the human-readable REPORT.md from the computed verdict + all intermediate quantities. | §6.5, §7.5, §9.3 outputs |
| `src/run.ts` | Top-level orchestrator: consumes streams in locked order, wires modules, writes the two output artifacts. Entry point. | §7.3 ordering, §9 |
| `test/` | Unit/property tests for the math (KL≥0, entropy bounds, permutation p-value monotonicity, seed reproducibility). Implementation-phase only. | verification of §4, §7 |

**Dependency direction (acyclic) [ARCH]:** `types → config → prng → {generative, holdout} → posterior → {ssi, baselines} → metrics → {stats, mv} → decision → report → run`. No module imports a module to its right.

---

## 2. `src/types.ts` — shared data structures (declarations only)

These are **type declarations** (no logic). They lock the data contract between modules and map directly to §2–§8. [ARCH]

```ts
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

// ---- locked configuration (the frozen registered parameters) ----
export interface LockedConfig { /* declared in §3 below; frozen object lives in config.ts */ }
```

---

## 3. `src/config.ts` — the single locked-parameter object

One **deeply-frozen** object holding **every** registered constant from PRE-REGISTRATION.md §9.4. No other module may define a parameter; all read from here. [ARCH][GATE]

```ts
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
    negativeControlFrac: number;               // detected but worthSurfacing=0
    pivotalFrac: number;                       // answerChangesIR=1
    safetyFrac: number;                        // safety-class
    casesPerUser: number;                      // fixed per-user case count
  };

  // §4 SSI locked constants
  readonly thetaSurprise: number;              // S1 KL threshold (registered, conservative §5.7)
  readonly kappa: number;                      // S4 cost-of-interruption κ ≥ 0
  readonly turnBudget: number;                 // B = 3 (§4.6)

  // §6.4 / §7.1 composite weights (sum = 1)
  readonly weights: { wAQ: 0.40; wVoI: 0.40; wUS: 0.20 };

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

export declare const CONFIG: Readonly<LockedConfig>;     // deeply frozen; the only parameter source
export declare function assertConfigInvariants(c: LockedConfig): void; // weights sum=1, rates in [0,1], N≥NFloor, etc.
```

Supporting declared shapes (`ContextSkewTable`, `CorrelatedPair`, `HeldOutContextCombo`) live in `types.ts`; their concrete numeric values are the registered skews/couplings of §2.3 and the partitions of §5.1, frozen at load. `assertConfigInvariants` enforces the §9.4 lock at startup and **fails the run** (not a FAIL verdict — an invalid run) if any invariant is violated.

---

## 4. `src/prng.ts` — deterministic seeding (§7.3)

A splittable, stateless-derivation PRNG so every sub-stream is reproducible and order-independent across modules. [ARCH][GATE]

```ts
export type StreamLabel =
  | "holdout-partition" | "users" | "fitting-data"
  | "evaluation" | "permutation" | "bootstrap" | "ppc" | "loo";

export interface Rng {                          // a pull-based stream
  nextUint64(): bigint;
  nextUnit(): number;                           // uniform [0,1)
  nextInt(maxExclusive: number): number;
  fork(subLabel: string | number): Rng;         // deterministic child stream
}

// Derive a top-level stream by hashing (seedMaster, label) — SplitMix64 mixing.
export declare function deriveStream(seedMaster: bigint, label: StreamLabel, ...salt: (string | number)[]): Rng;
// Internal mixers (declared; pure):
export declare function splitmix64(state: bigint): { value: bigint; next: bigint };
export declare function hashLabel(seedMaster: bigint, label: string, salt: (string | number)[]): bigint;
```

**Locked stream consumption order (§7.3), enforced by `run.ts`:** `holdout-partition` → `users` (per-user fork `users/u`) → `fitting-data` → `evaluation` → (`permutation` only if N>20, else recorded unused) → `bootstrap`; plus `ppc` and `loo` sub-streams consumed by `mv.ts`, both derived independently of `evaluation` (§8.1). No module may call `Math.random`. [GATE]

---

## 5. `src/generative.ts` — synthetic ground-truth + oracle (§2)

Produces users, fossils, consequence cases, and the two oracle labels — all from the generative truth, never from a method. [ARCH]

```ts
// §2.3 sample one latent user (correlated, context-conditioned prior) and its fossils
export declare function sampleUser(cfg: LockedConfig, usersRng: Rng, userId: number): SyntheticUser;
export declare function sampleFossils(cfg: LockedConfig, userRng: Rng, theta: ThetaState): readonly Fossil[];

// §2.4 generic per-family likelihood (context-modulated), defined even for held-out families
export declare function likelihood(cfg: LockedConfig, family: FamilyId, axis: AxisId, level: AxisLevel, ctx: Context): number;

// §2.5 the two ground-truth oracle labels — computed from θ_u and ctx ONLY
export declare function oracleWorthSurfacing(cfg: LockedConfig, theta: ThetaState, ctx: Context, family: FamilyId): 0 | 1;
export declare function oracleAnswerChangesIR(cfg: LockedConfig, theta: ThetaState, ctx: Context, family: FamilyId): 0 | 1;

// §2.5 registered deterministic IR-selection oracle (used by oracle labels AND by SSI/baseline-v EVSI)
export declare function selectIR(cfg: LockedConfig, input: IRSelectionInput): IRId;
export declare function irValue(cfg: LockedConfig, ir: IRId, belief: FactoredPosterior, ctx: Context): number; // Value(IR) under a belief (§4.5)

// §5.3 generate a user's fitting (train) and evaluation case sets at registered rates
export declare function generateCases(
  cfg: LockedConfig, partition: HoldoutPartition, evalRng: Rng, fitRng: Rng, user: SyntheticUser
): { train: readonly ConsequenceCase[]; eval: readonly ConsequenceCase[] };
```

**Integrity checks the implementation must satisfy (§2.6, asserted in tests) [ARCH][GATE]:** (a) no oracle function reads any method's output or score; (b) `worthSurfacing` and `answerChangesIR` are computed independently and may disagree (§2.5); (c) the prior is a non-product correlated joint (§2.3) so the factored model can be mis-specified; (d) held-out families still receive a defined likelihood via their generic signature (§2.4).

---

## 6. `src/holdout.ts` — the no-peeking wall (§5.1, §5.2)

```ts
export interface HoldoutPartition {
  readonly trainFamilies: ReadonlySet<FamilyId>;
  readonly heldOutFamilies: ReadonlySet<FamilyId>;
  readonly heldOutContextCombos: readonly HeldOutContextCombo[];
}
// Built FIRST from the "holdout-partition" stream, BEFORE any fitting data is drawn (§5.2 wall).
export declare function buildPartition(cfg: LockedConfig, partitionRng: Rng): HoldoutPartition;
// Tag a case as single/double held-out (§5.1); used when labelling generated cases.
export declare function tagHeldOut(p: HoldoutPartition, family: FamilyId, ctx: Context): { family: boolean; context: boolean };
// Guard: assert no eval-only cell ever entered the fitting set (§5.2 no-peeking).
export declare function assertWall(train: readonly ConsequenceCase[], p: HoldoutPartition): void;
```

`buildPartition` **must** be the first consumer of randomness (§7.3 ordering). `assertWall` is called by `run.ts` after fitting-data generation and **fails the run** if any held-out cell leaked into the train split. [GATE]

---

## 7. `src/posterior.ts` — shared belief core (§4.1–§4.3, §4.6)

The closed-form belief math shared by **SSI and baseline (v)** (so the ablation differs only by EIG/VoI, §3.5). [ARCH][GATE]

```ts
// §4.1 fossil counts -> Dirichlet posterior parameters per (axis, context bucket)
export declare function countFossils(cfg: LockedConfig, fossils: readonly Fossil[], axis: AxisId, bucket: ContextBucketKey): DirichletParams;
export declare function dirichletPosterior(prior: DirichletParams, counts: DirichletParams): DirichletParams; // α0 + n
export declare function normalize(alpha: DirichletParams): AxisPosterior;                                     // mean of Dirichlet
export declare function bucketOf(ctx: Context): ContextBucketKey;                                             // §4.7 (subdomain|genre)

// §4.1 the factored, context-conditioned posterior P(Intent|context) as product of per-axis posteriors
export declare function factoredPosterior(cfg: LockedConfig, user: SyntheticUser, ctx: Context): FactoredPosterior;

// §4.2 consequence-conditioned update P(axis|C,context) (only touched axes change)
export declare function consequenceConditioned(cfg: LockedConfig, base: FactoredPosterior, family: FamilyId, ctx: Context): FactoredPosterior;

// §4.3 closed-form KL between two factored posteriors (factor-additive), nats
export declare function klFactored(p: FactoredPosterior, q: FactoredPosterior): number;
export declare function klAxis(p: AxisPosterior, q: AxisPosterior): number;     // Σ_k p_k ln(p_k/q_k)

// §4.6 closed-form Shannon entropy, nats
export declare function entropyAxis(p: AxisPosterior): number;                  // −Σ_k p_k ln p_k
export declare function entropyFactored(p: FactoredPosterior): number;          // Σ_axis entropyAxis (factor-additive)
```

**Invariants tested (§4) [GATE]:** `klAxis ≥ 0`, `klAxis(p,p)=0`; `0 ≤ entropyAxis ≤ ln 3`; posteriors always proper (α>0 since `alphaBase=1`); untouched axes contribute exactly 0 to `klFactored` (§4.2).

---

## 8. `src/ssi.ts` — the method under test (§3.0, §4.3–§4.7)

The full locked SSI pipeline. Uses `posterior.ts`; consumes **no randomness** (§4.7). [ARCH][GATE]

```ts
// §4.3 S1 Bayesian-surprise screen
export declare function s1Surprise(cfg: LockedConfig, base: FactoredPosterior, cc: FactoredPosterior): number; // = klFactored
export declare function s1Pass(cfg: LockedConfig, surprise: number): boolean;                                  // surprise > thetaSurprise

// §4.4 S2 affordance predicate, S6 safety predicate (S3 collapsed to identity gate §4.4)
export declare function s2AffordsChange(cfg: LockedConfig, family: FamilyId, ctx: Context): boolean;
export declare function s6Safety(cfg: LockedConfig, family: FamilyId): boolean;                                // forced-surface class

// §4.5 S4 EVSI (the load-bearing mechanism). EVSI=0 when answer cannot change the IR.
export declare function answerDist(cfg: LockedConfig, cc: FactoredPosterior, family: FamilyId): readonly { level: AxisLevel; p: number }[];
export declare function evsi(cfg: LockedConfig, user: SyntheticUser, base: FactoredPosterior, cc: FactoredPosterior, family: FamilyId, ctx: Context): number;
export declare function s4Eligible(cfg: LockedConfig, evsiValue: number): boolean;                             // evsi > kappa

// §4.6 S5 expected information gain + turn budget
export declare function eig(cfg: LockedConfig, base: FactoredPosterior, cc: FactoredPosterior, family: FamilyId, ctx: Context): number;
export declare function rankAndBudget(cfg: LockedConfig, eligible: readonly EligibleCase[]): readonly number[]; // caseIds to surface, ≤ B, S6 first, deterministic tie-break

// §4.7 the locked decision pipeline over all of a user's eval cases in one transaction
export declare function ssiDecide(cfg: LockedConfig, user: SyntheticUser, cases: readonly ConsequenceCase[]): readonly MethodDecision[];

interface EligibleCase { readonly caseId: number; readonly eig: number; readonly evsi: number; readonly forcedS6: boolean; readonly familyOrdinal: number; }
```

**Pipeline order (locked §4.7):** S6 force → S1 screen → S4 EVSI gate → S5 EIG rank within turn budget `B=3`. Tie-break: descending EVSI then fixed family ordinal (§4.6). `ssiDecide` returns one `MethodDecision` per case with `score = EVSI` for calibration (§6.5). [GATE]

---

## 9. `src/baselines.ts` — the five baselines (§3.1–§3.6)

Each baseline is fit **only** on the TRAIN split (§5.2). All consume the **same** fossils SSI sees; only their surface/abstain logic differs. [ARCH][GATE]

```ts
export type BaselineId = "silent-route2" | "generic-linter" | "user-heuristic" | "loo-classifier" | "factored-ablation";

export interface Baseline {
  readonly id: BaselineId;
  fit(cfg: LockedConfig, trainCases: readonly ConsequenceCase[], users: readonly SyntheticUser[]): void; // TRAIN-only (§5.2)
  decide(cfg: LockedConfig, user: SyntheticUser, cases: readonly ConsequenceCase[]): readonly MethodDecision[];
}

// §3.1 (i) silent Route-2 — never surfaces (perfect specificity, zero usefulness)
export declare function makeSilentRoute2(): Baseline;
// §3.2 (ii) generic linter — best fixed user-independent family rule, tuned on TRAIN only
export declare function makeGenericLinter(): Baseline;
// §3.3 (iii) user-aware heuristic — strong, NOT strawman; profile+coarse-context features, tuned threshold
export declare function makeUserHeuristic(): Baseline;
// §3.4 (iv) leave-one-consequence-out classifier on fossils; LOO nested inside the §5.2 wall
export declare function makeLooClassifier(looRng: Rng): Baseline;
// §3.5 (v) factored model WITHOUT EIG/VoI — SSI's posterior + surprise-threshold init, NO EVSI/EIG (the falsifier)
export declare function makeFactoredAblation(): Baseline;

export declare function allBaselines(cfg: LockedConfig, looRng: Rng): readonly Baseline[];
```

**Ablation-isolation invariant (§3.5/§4.5) [GATE]:** `makeFactoredAblation` must call the **identical** `posterior.ts` belief functions SSI uses and decide via a **surprise threshold tuned on TRAIN only**, with **no** call into any EVSI/EIG function. A test asserts the ablation never imports `evsi`/`eig`. This is what makes SSI-vs-(v) the clean load-bearing isolation of EIG/VoI.

---

## 10. `src/metrics.ts` — exact estimators (§6)

Per-user deterministic estimators from `{MethodDecision}` + oracle labels. [ARCH][GATE]

```ts
export interface PerUserMetrics { readonly aq: number; readonly us: number; readonly voi: number; readonly composite: number; }

// §6.1 balanced-accuracy abstention quality
export declare function abstentionQuality(decisions: readonly MethodDecision[], cases: readonly ConsequenceCase[]): number;
// §6.2 usefulness = precision of surfaced vs worthSurfacing (null=0 if nothing surfaced)
export declare function usefulness(decisions: readonly MethodDecision[], cases: readonly ConsequenceCase[]): number;
// §6.3 answer-changing VoI = precision of surfaced vs answerChangesIR (null=0)
export declare function answerChangingVoI(decisions: readonly MethodDecision[], cases: readonly ConsequenceCase[]): number;
// §6.4 locked-weight composite per user
export declare function composite(cfg: LockedConfig, m: { aq: number; us: number; voi: number }): number;
export declare function perUserMetrics(cfg: LockedConfig, decisions: readonly MethodDecision[], cases: readonly ConsequenceCase[]): PerUserMetrics;

// §6.5 calibration / reliability curves + ECE (diagnostic, NOT gated)
export interface ReliabilityBin { readonly meanPred: number; readonly empirical: number; readonly count: number; }
export declare function surfacingReliability(cfg: LockedConfig, decisions: readonly MethodDecision[], cases: readonly ConsequenceCase[]): { bins: readonly ReliabilityBin[]; ece: number };
export declare function abstentionReliability(cfg: LockedConfig, decisions: readonly MethodDecision[], cases: readonly ConsequenceCase[]): { bins: readonly ReliabilityBin[]; ece: number };

// §7.6 H-NC negative-control specificity (per user, for the guard)
export declare function negControlSpecificity(decisions: readonly MethodDecision[], cases: readonly ConsequenceCase[]): number;
```

**Locked conventions (§6) [GATE]:** balanced accuracy (so always-ask/always-abstain cannot game AQ); precision-null = 0 for empty surfacing (US, VoI); composite weights `(0.40,0.40,0.20)` read from `CONFIG`; calibration is **reported, never gated** (§6.5).

---

## 11. `src/stats.ts` — the exact test (§7)

No external stats library. Paired sign-flip permutation, exact at N=12. [ARCH][GATE]

```ts
export interface PairedTestResult {
  readonly baseline: BaselineId;
  readonly meanDiff: number;            // D̄^{(b)} (§7.1)
  readonly pValueRaw: number;           // one-sided permutation p (§7.4)
  readonly marginPass: boolean;         // D̄^{(b)} ≥ deltaComposite (§7.4)
  readonly exact: boolean;              // true when 2^N enumerated, false if Monte-Carlo (§7.4)
}

// §7.1 paired per-user differences SSI − baseline
export declare function pairedDiffs(ssi: readonly number[], base: readonly number[]): readonly number[]; // per-user composite arrays
// §7.4 exact paired sign-flip permutation (enumerate 2^N when N ≤ permExactMaxN, else Monte-Carlo via permRng)
export declare function permutationTest(cfg: LockedConfig, diffs: readonly number[], permRng: Rng): { p: number; meanDiff: number; exact: boolean };
// §7.4 Holm–Bonferroni step-down over the five raw p-values
export interface HolmResult { readonly perBaseline: readonly { baseline: BaselineId; pRaw: number; pAdjThreshold: number; reject: boolean }[]; readonly allReject: boolean; }
export declare function holmStepDown(cfg: LockedConfig, raw: readonly { baseline: BaselineId; p: number }[]): HolmResult;
// §7.5 percentile bootstrap CI (reporting-only; never gates)
export declare function bootstrapCI(cfg: LockedConfig, diffs: readonly number[], bootRng: Rng): { lo: number; hi: number };
```

**Locked test semantics (§7.4) [GATE]:** at `N=12`, enumerate all `2^12=4096` sign-vectors exactly; `p = #{D̄(s) ≥ D̄_obs}/2^N`. H1 significance requires **all five** Holm-rejected at FWER `0.05` **and** every `meanDiff ≥ 0.05`. Bootstrap CI is descriptive only.

---

## 12. `src/mv.ts` — G1B-MV sub-gate (§8)

```ts
export type MVVerdict = "MV-ADEQUATE" | "MV-FORCE-COUPLE";

// §8.1 posterior-predictive check on interaction-sensitive discrepancy T_assoc
export declare function tAssoc(cfg: LockedConfig, fossils: readonly Fossil[]): number;               // summed |pairwise association| over registered pairs
export declare function ppcCheck(cfg: LockedConfig, users: readonly SyntheticUser[], ppcRng: Rng): { pPPC: number; adequate: boolean };

// §8.2 fit three belief models; compare held-out (leave-one-fossil-out) ELPD per fossil
export type BeliefModelId = "factored" | "sparse-pairwise" | "hierarchical";
export declare function elpdPerFossil(cfg: LockedConfig, model: BeliefModelId, users: readonly SyntheticUser[], looRng: Rng): number;
export interface MVComparison { readonly dElpdPair: number; readonly dElpdHier: number; readonly seBest: number; readonly material: boolean; }
export declare function compareModels(cfg: LockedConfig, users: readonly SyntheticUser[], looRng: Rng): MVComparison;

// §8.3 combine PPC + materiality -> verdict
export declare function mvVerdict(cfg: LockedConfig, ppc: { adequate: boolean }, cmp: MVComparison): MVVerdict;
```

**Locked thresholds (§8) [GATE]:** PPC adequate iff `pPPC ∈ [0.05,0.95]`; interactions material iff `max(ΔELPD) ≥ τ_MV=0.02` **AND** `ΔELPD_best/SE_best ≥ 4`; `MV-FORCE-COUPLE` iff material **or** PPC inadequate. MV runs **regardless** of H1 outcome (§8.3). PPC and LOO streams are independent of `evaluation` (§8.1).

---

## 13. `src/decision.ts` — the ordered decision rule (§9)

```ts
export type Verdict = "PASS" | "FAIL-descope-D5" | "FAIL-MV" | "FAIL";

export interface DecisionInputs {
  readonly holm: HolmResult;                 // §7.4
  readonly perBaseline: readonly PairedTestResult[];  // includes baseline-(v) for ablation_tie
  readonly h1Pass: boolean;                  // all 5: margin ∧ Holm-significant (§9.1)
  readonly ablationTie: boolean;             // (D̄^(v) < δ) OR (Holm-adj p^(v) ≥ 0.05) (§9.1)
  readonly ncPass: boolean;                  // SSI neg-control specificity ≥ 0.80 (§7.6)
  readonly mv: MVVerdict;                    // §8.3
  readonly mvRemedyApplied: boolean;         // coupling re-run or claim-reduction completed (§9.1)
}

// §9.2 evaluate branches top-down; first match wins
export declare function decideVerdict(cfg: LockedConfig, inp: DecisionInputs): { verdict: Verdict; rationale: string; action: string };
```

**Locked branch order (§9.2) [GATE]:** (1) `FAIL-MV` if `MV-FORCE-COUPLE` and remedy not applied; (2) `FAIL-descope-D5` if `ablationTie`; (3) `FAIL` if `!h1Pass` (on baselines i–iv) or `!ncPass`; (4) `PASS` otherwise. When `MV-FORCE-COUPLE` with remedy applied, the inputs are read from the re-run on the remedied model (§9.1). The rationale/action strings mirror the §9.3 table.

---

## 14. `src/report.ts` + outputs

Renders exactly two artifacts (in a **later** execution phase — **not this phase**). [ARCH][GATE]

### 14.1 Results JSON — `g1b/artifacts/results.json`
A single machine-readable object capturing the full run. Declared shape:

```ts
export interface ResultsJSON {
  readonly meta: { seedMaster: string; N: number; nValid: number; node: string; timestampISO: string; configHash: string };
  readonly holdout: { trainFamilies: FamilyId[]; heldOutFamilies: FamilyId[]; heldOutContextCombos: HeldOutContextCombo[] };
  readonly perUser: readonly {
    userId: number;
    ssi: PerUserMetrics;
    baselines: Readonly<Record<BaselineId, PerUserMetrics>>;
    ssiNegControlSpecificity: number;
  }[];
  readonly tests: {
    perBaseline: readonly PairedTestResult[];
    holm: HolmResult;
    bootstrap: Readonly<Record<BaselineId, { lo: number; hi: number }>>;
  };
  readonly calibration: { ssi: { surfacingECE: number; abstentionECE: number } } & Record<BaselineId, { surfacingECE: number; abstentionECE: number }>;
  readonly mv: { pPPC: number; ppcAdequate: boolean; dElpdPair: number; dElpdHier: number; seBest: number; material: boolean; verdict: MVVerdict };
  readonly decision: { verdict: Verdict; rationale: string; action: string };
}
export declare function buildResultsJSON(/* all computed inputs */): ResultsJSON;
export declare function writeResults(path: string, r: ResultsJSON): void;       // execution phase only
```

### 14.2 Human-readable `g1b/artifacts/REPORT.md`
Rendered from `ResultsJSON`. Required sections (in order): run metadata + `configHash`; holdout partition; per-baseline composite means + paired diffs + permutation p + margin pass; Holm step-down table; the three sub-metrics shown **separately** (§6.4) with bootstrap CIs; calibration/reliability curves + ECE per method (§6.5); G1B-MV block (PPC p, ΔELPD, materiality); the **final verdict** mapped to the §9.3 table with its action. The report must **state explicitly** that the result is **pilot-grade synthetic evidence only**, with the human claim owed at **G5 (N≥24)** (§1.5, §6.6). [PAPER]

```ts
export declare function renderReportMarkdown(r: ResultsJSON): string;
export declare function writeReport(path: string, md: string): void;            // execution phase only
```

**Output integrity [GATE]:** the two artifacts are written **only** in the execution phase; this pre-registration phase produces **no** `results.json` and **no** `REPORT.md`. The harness must refuse to overwrite `PRE-REGISTRATION.md` or `HARNESS-SPEC.md`.

---

## 15. `src/run.ts` — top-level orchestration (§7.3 order, §9)

The entry point wiring everything in the **locked stream order**. [ARCH][GATE]

```ts
export declare function main(): Promise<void>;     // node --experimental-strip-types src/run.ts (or compiled)
// Locked sequence (asserted): assertConfigInvariants -> buildPartition("holdout-partition")
//   -> sampleUser×N ("users/u") -> generateCases train/eval ("fitting-data","evaluation")
//   -> assertWall -> fit baselines (TRAIN only) -> ssiDecide + baseline.decide per user
//   -> perUserMetrics -> permutationTest×5 + holmStepDown + bootstrapCI
//   -> mv (ppcCheck + compareModels + mvVerdict) -> decideVerdict
//   -> buildResultsJSON -> writeResults + renderReportMarkdown + writeReport.
```

**Run-level guards (§7.3, §5.2, §9) [GATE]:** (a) streams consumed in the locked order; (b) `assertWall` passes before any decision; (c) if fewer than `NFloor=8` valid users, the run is **invalid** (regenerate under the seed), not a FAIL; (d) `SEED_MASTER` is read from `CONFIG` and never overridden by results; (e) any robustness seed-sweep is **secondary/descriptive** and cannot change the `SEED_MASTER` verdict (§7.3).

---

## 16. Test plan (`test/`, implementation phase only) [ARCH]

Property/unit tests that verify the math and the integrity invariants — *not* the experiment:
- **Math:** `klAxis ≥ 0`, `klAxis(p,p)=0`, `0 ≤ entropyAxis ≤ ln 3`, factor-additivity of KL/entropy (§4.3/§4.6), `EVSI ≥ 0` and `EVSI=0` exactly when every answer yields the same IR (§4.5).
- **Determinism:** two runs at `SEED_MASTER` produce byte-identical `results.json` (§7.3).
- **Permutation:** exact enumeration count `=2^N`; monotonicity of p in `D̄_obs`; p-granularity `1/4096` (§7.4).
- **Wall:** `assertWall` throws if any held-out cell appears in train (§5.2).
- **Ablation isolation:** `factored-ablation` references no EVSI/EIG symbol (§3.5).
- **Oracle integrity:** oracle labels invariant to any method's decisions (§2.6).

---

## 17. Consistency map — HARNESS-SPEC ↔ PRE-REGISTRATION

| Locked PRE-REG item | Where the harness binds it |
|---|---|
| §2.1 axes / §2.2 context / §2.3 correlated prior | `types.ts`, `config.ts`, `generative.ts` |
| §2.4 family likelihood signatures | `config.ts` (values), `generative.ts` (`likelihood`) |
| §2.5 two oracle labels + IR oracle | `generative.ts` (`oracleWorthSurfacing`, `oracleAnswerChangesIR`, `selectIR`) |
| §3 five baselines | `baselines.ts` |
| §4.1–§4.3/§4.6 posterior, KL, entropy | `posterior.ts` |
| §4.4–§4.7 SSI S1–S6 pipeline | `ssi.ts` |
| §5.1–§5.3 holdout + rates | `holdout.ts`, `config.ts`, `generative.ts` |
| §6 metrics + calibration | `metrics.ts` |
| §7 permutation + Holm + bootstrap + N + seeds | `stats.ts`, `prng.ts`, `config.ts` |
| §7.6 H-NC guard | `metrics.ts` (`negControlSpecificity`), `decision.ts` |
| §8 G1B-MV | `mv.ts` |
| §9 decision rule + outputs | `decision.ts`, `report.ts`, `run.ts` |

**Final lock statement [GATE]:** this blueprint introduces **no** parameter not already frozen in `PRE-REGISTRATION.md` §9.4. The executor implements §1–§17 **and only those**, producing the two artifacts (`artifacts/results.json`, `artifacts/REPORT.md`) **only** in the execution phase. **No code, no experiment, and no results are produced in this pre-registration phase.**
```