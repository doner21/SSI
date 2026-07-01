# G1B Falsifier — HARNESS SPECIFICATION v2 (implementation blueprint)

**Track:** SSI DAW — Track 1B salience-discrimination spike (Wizard-of-Oz, NO DSP engine).
**Phase:** RE-PRE-REGISTRATION LOCK (attempt 2). This is the **implementation blueprint** an executor will implement *exactly* in a later phase. It contains **NO implementation code** (no function bodies, no algorithms expressed as statements) — only module layout, type/data-structure declarations, function **signatures**, the mapping from each module to the locked `PRE-REGISTRATION-v2.md` sections, the deterministic seeding scheme, and the exact output artifacts. **No experiment is run and no results/JSON/REPORT files are produced in this phase.**
**Companion (source of truth for all parameters):** `C:/Users/doner/ssi/g1b/PRE-REGISTRATION-v2.md` (LOCKED, attempt 2). Every threshold, margin, weight, seed, and test referenced here is defined and frozen there; this file must not introduce, change, or re-tune any of them.

**Relationship to v1 (`HARNESS-SPEC.md`, sha256 `6dfd501e…`):** v1 is the **permanent, locked record of attempt 1** and is **not modified** by this document. This v2 blueprint **reuses v1's module/file layout, dependency direction, and stream scheme verbatim** and specifies **only the four permitted v2 deltas** (PRE-REG-v2 §A): `posterior.ts` gains sparse-pairwise coupling; `ssi.ts` gains aligned-EVSI + a TRAIN-only calibration procedure; `baselines.ts` ablation (v) gains the same coupling (still importing no EVSI/EIG symbol); `metrics.ts` gains the S6/AQ mandatory-safety fix. Plus the mandated new `SEED_MASTER = 0x5551B_0002`. **Everything not listed as a v2 delta is carried verbatim from v1.**

**Claim labels (identical to PRE-REGISTRATION-v2.md):**
- **[ARCH]** — an architectural commitment (how the harness is built / what it computes).
- **[PAPER]** — a claim whose ultimate evidentiary standard is a real-musician study (G5, N≥24); the harness produces only *pilot-grade synthetic* evidence for it.
- **[GATE]** — implements a binary, decision-forcing pass/fail criterion locked in PRE-REGISTRATION-v2.md.

**Implementation integrity rule [ARCH]:** the harness implements §1–§9 of PRE-REGISTRATION-v2.md **and only those**. It must not add a tunable parameter beyond the two registered TRAIN-calibrated constants (`θ_surprise`, `κ`, selected by the registered §5.2.1 grid argmax), must not let any method or the calibration step touch a held-out label during fitting (§5.2 wall), must not let SSI's decisions consume randomness (§4.7), and must compute every oracle label from the generative truth alone (§2.5), never from a method's output.

---

## 0. Target runtime, language, and constraints

- **Runtime:** Node 24 (LTS line), TypeScript, ES modules (`"type": "module"`). [ARCH]
- **No external statistics / probability library.** All distributions (Beta/Dirichlet, **and the new joint Dirichlet over pair cells**), all information quantities (KL, entropy, EIG, EVSI), and the entire test machinery (paired sign-flip permutation, Holm step-down, percentile bootstrap) are implemented from closed-form arithmetic in-repo (§4, §7). Only the Node standard library and a small in-repo deterministic PRNG are permitted. [ARCH][GATE]
- **Determinism:** the whole run is bit-reproducible from **`SEED_MASTER = 0x5551B_0002`** (§7.3, **NEW for v2**, distinct from v1's `0x5551B_0001`). The only randomness is data generation, the PPC replications, the LOO/bootstrap, and the (unused at N=12) permutation stream; **SSI's decisions and the TRAIN calibration argmax are analytic and seed-free** (§4.7, §5.2.1). [ARCH][GATE]
- **No DSP engine.** Consequence detectors are mocked; fossils are synthetic; there is no audio (§9 Track 1B, Wizard-of-Oz). [ARCH]
- **TypeScript discipline:** `strict: true`, no `any` in public signatures, all randomness routed through the seeded streams of §7.3 (no `Math.random`). Numeric type for all probabilities/info quantities is `number` (IEEE-754 double); natural-log nats throughout (§4). [ARCH]

---

## 1. Module / file layout under `g1b/src/`

All paths relative to `C:/Users/doner/ssi/g1b/`. **The module/file layout is identical to v1**; the four v2 deltas are confined to `posterior.ts`, `ssi.ts`, `baselines.ts`, `metrics.ts` (and the seed constant in `config.ts`). Each module maps to locked PRE-REGISTRATION-v2.md sections. [ARCH]

| File | Responsibility | v2 delta? | Implements PRE-REG-v2 §§ |
|---|---|---|---|
| `src/types.ts` | All shared data structures, enums, branded IDs, the locked-config type. No logic. | **+ coupled-posterior, MS-bucket, calibration types** | §2–§8 (declarations only) |
| `src/config.ts` | The single **locked-parameter object** (all registered constants, thresholds, seeds, weights, partitions, rates, signatures). Frozen. | **new `SEED_MASTER`, `λ_couple`, `Concord_p`, component set, `G_θ`/`G_κ` grids, MS scoping** | §2–§9 (the §9.4 lock list) |
| `src/prng.ts` | Deterministic `SplitMix64`-style splittable PRNG; stream derivation by `hash(SEED_MASTER, label, …)`. | unchanged (now seeded by v2 master) | §7.3 |
| `src/generative.ts` | Synthetic ground-truth + oracle: latent users, correlated/context-conditioned prior, fossils, families & likelihoods, the two oracle labels, IR-selection oracle. | **VERBATIM from v1** (§2 anti-rigging banner) | §2 (all), §5.3 rates |
| `src/holdout.ts` | Builds the TRAIN/HELD-OUT family partition + held-out context combos **first** (no-peeking wall); tags every case train/eval and single/double-held-out. | unchanged | §5.1, §5.2 |
| `src/posterior.ts` | **[v2 CHANGE (1)]** sparse-pairwise-**coupled**, context-conditioned belief core: per-axis Dirichlet **and joint-pair Dirichlet**; consequence update inside components; closed-form component-additive KL/entropy. Shared by SSI **and** ablation (v). | **CHANGED** | §4.0, §4.1, §4.2, §4.3, §4.6 |
| `src/ssi.ts` | The method under test: S1 surprise, S2/S3/S6 predicates, **[v2 CHANGE (2)] aligned-EVSI** gate, S5 EIG ranking + budget, **[v2 CHANGE (3)] TRAIN-only calibration of `θ_surprise`/`κ`**, full locked pipeline. | **CHANGED** | §3.0, §4.3–§4.7, §5.2.1 |
| `src/baselines.ts` | The five baselines; **[v2 CHANGE (1)]** ablation (v) uses the **same** coupled posterior as SSI but imports **no** EVSI/EIG symbol. Each fit only on TRAIN split. | **CHANGED (baseline v only)** | §3.1–§3.6 |
| `src/metrics.ts` | Exact per-user estimators: AQ/US/VoI, composite, calibration/ECE; **[v2 CHANGE (4)]** S6/AQ mandatory-safety split (`D_disc` vs `D_safety`, separate `MS` bucket), applied identically to all methods. | **CHANGED** | §6 (all, incl. §6.1.1) |
| `src/stats.ts` | Paired sign-flip permutation test (exact at N=12), Holm step-down, percentile bootstrap (reporting-only). No external lib. | unchanged | §7.1–§7.6 |
| `src/mv.ts` | G1B-MV sub-gate: PPC (`T_assoc`), **coupled vs hierarchical vs factored** ELPD comparison, materiality, verdict. | **model-under-test is now M-cpl** (§8 note) | §8 (all) |
| `src/decision.ts` | Ordered decision rule → PASS / FAIL-descope(#5) / FAIL-MV / FAIL; consumes stats + mv + H-NC. | unchanged | §9 (all) |
| `src/report.ts` | Renders results JSON and human-readable REPORT.md from the verdict + intermediates (**+ `MS` per method, calibrated `(θ*,κ*)`**). | **+ MS, calibrated constants** | §6.5, §7.5, §9.3 outputs |
| `src/run.ts` | Top-level orchestrator: consumes streams in locked order, **runs TRAIN calibration before evaluation**, wires modules, writes outputs. Entry point. | **+ calibration step in fitting phase** | §7.3 ordering, §5.2.1, §9 |
| `test/` | Unit/property tests for the math (KL≥0, entropy bounds, **coupling→factored limit at `λ=0`**, permutation monotonicity, seed reproducibility, **ablation imports no EVSI/EIG**). Implementation-phase only. | **+ coupling/limit/isolation tests** | verification of §4, §5.2.1, §7 |

**Dependency direction (acyclic, identical to v1) [ARCH]:** `types → config → prng → {generative, holdout} → posterior → {ssi, baselines} → metrics → {stats, mv} → decision → report → run`. No module imports a module to its right. **[v2] The coupling lives entirely in `posterior.ts`** so both `ssi.ts` and `baselines.ts` consume it from the *same* upstream module — this is what preserves the clean EIG/VoI isolation (§3.5, §9 below).

---

## 2. `src/types.ts` — shared data structures (declarations only)

These are **type declarations** (no logic). They lock the data contract between modules and map directly to §2–§8. The v1 types are carried verbatim; the v2 additions are flagged `[v2]`. [ARCH]

```ts
// ---- §2.1 latent style axes (UNCHANGED from v1) ----
export type AxisId =
  | "grit" | "bright" | "interrupt" | "artifact" | "expertise" | "routing";
export type AxisLevel = 0 | 1 | 2;            // every locked axis has K_a = 3 levels (§2.1)
export interface AxisSpec {
  readonly id: AxisId;
  readonly kind: "ordinal" | "categorical";
  readonly levels: readonly [string, string, string];
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
// §4.7 bucket key c = (subdomain, genre) for components P1,P2,{bright}; flow-extended key c⁺ for {interrupt}.
export type ContextBucketKey = string;        // canonical `${subdomain}|${genre}`
export type FlowBucketKey = string;           // [v2] canonical `${subdomain}|${genre}|${flow}` (§4.0/§4.1 c⁺)

// ---- §2.3 latent user + fossils (UNCHANGED) ----
export type ThetaState = Readonly<Record<AxisId, AxisLevel>>;   // hidden true θ_u — never shown to any method
export interface Fossil {                       // one past episode's observable style signal
  readonly context: Context;
  readonly axis: AxisId;
  readonly observedLevel: AxisLevel;            // sampled from θ_u | context (§2.3)
  // [v2 reading, NOT a generative change]: episodes that jointly exercise a registered §2.3 pair
  // carry the partner axis level so co-occurrence co-counts m_{p,c,(j,l)} can be read off the SAME fossils.
  readonly jointPartner?: { readonly axis: AxisId; readonly level: AxisLevel };
}
export interface SyntheticUser {
  readonly id: number;
  readonly theta: ThetaState;                   // ground truth — never shown to any method
  readonly fossils: readonly Fossil[];          // the ONLY user-specific evidence (§2.3)
}

// ---- §2.4 consequence families & likelihood signatures (UNCHANGED — likelihood stays per-axis/generic) ----
export type FamilyId =
  | "headroom-clip-risk" | "brightness-shift" | "routing-idiom-change"   // TRAIN (§5.1)
  | "inharmonic-artifact" | "added-latency"                              // HELD-OUT
  | "feedback-safety";                                                   // HELD-OUT safety-class (§4.4/§5.1)
export type FamilyClass = "ordinary" | "safety";
export interface LikelihoodSignature {
  readonly family: FamilyId;
  readonly familyClass: FamilyClass;
  readonly touchedAxes: readonly AxisId[];      // axes whose L is non-flat (only these update, §4.2)
  readonly L: Readonly<Record<AxisId, readonly [number, number, number]>>;
  readonly bucketMod?: Readonly<Record<ContextBucketKey, number>>;
}

// ---- a detected consequence instance (UNCHANGED) ----
export interface ConsequenceCase {
  readonly caseId: number;
  readonly userId: number;
  readonly context: Context;
  readonly family: FamilyId;
  readonly split: "train" | "eval";            // §5.2 wall tag
  readonly heldOut: { family: boolean; context: boolean };  // §5.1 single/double held-out tags
  readonly oracle: { worthSurfacing: 0 | 1; answerChangesIR: 0 | 1; negativeControl: boolean };
  // [v2 CHANGE (4)] derived, method-independent scoping flag (§6.1.1): safety-class ⇒ mandatory-safety bucket.
  readonly safetyClass: boolean;               // == (signature.familyClass === "safety"); excluded from composite
}

// ---- a method's decision on a case (UNCHANGED) ----
export type SurfaceDecision = 0 | 1;           // 1 = surface a question, 0 = abstain
export interface MethodDecision {
  readonly caseId: number;
  readonly surface: SurfaceDecision;
  readonly score: number;                      // EVSI_aligned for SSI; rule score for baselines (§6.5)
}

// ---- posteriors ----
export type DirichletParams = Readonly<[number, number, number]>;        // α over 3 levels (per-axis)
export type AxisPosterior = Readonly<[number, number, number]>;          // normalized P(axis=k|·)

// [v2 CHANGE (1)] joint-pair posterior over K_a·K_b = 9 cells, row-major (j*3 + l) ----
export type PairId = "P1" | "P2";                                        // §4.0 {grit×routing},{artifact×expertise}
export type JointDirichletParams = Readonly<number[]>;                   // length 9, β over joint cells
export type JointPosterior = Readonly<number[]>;                         // length 9, normalized P(a=j,b=l|·)

// [v2] the coupled belief state = product over §4.0 components (forest of disjoint components)
export interface CoupledPosterior {
  readonly pairs: Readonly<Record<PairId, JointPosterior>>;              // P1, P2 joints (9 cells each)
  readonly interrupt: AxisPosterior;                                     // singleton on flow-extended key c⁺
  readonly bright: AxisPosterior;                                        // singleton on c
}
// the v1 fully-factored type is retained ONLY for mv.ts M-fac reference and the λ→0 limit test:
export type FactoredPosterior = Readonly<Record<AxisId, AxisPosterior>>;

// ---- IR selection (§2.5 / §4.5) ----
export type IRId = string;
export interface IRSelectionInput {            // tolerance-over-candidate-IRs view of a belief state
  readonly effectiveTolerance: Readonly<Record<AxisId, AxisPosterior | AxisLevel>>;
  readonly context: Context;
  readonly family: FamilyId;
}

// ---- [v2 CHANGE (3)] calibration result (the TRAIN-fit operating point) ----
export interface CalibratedConstants {
  readonly thetaSurprise: number;              // θ*_surprise selected on TRAIN (§5.2.1)
  readonly kappa: number;                      // κ* selected on TRAIN (§5.2.1)
  readonly trainComposite: number;             // argmax objective value (diagnostic, reported)
}

// ---- [v2 CHANGE (4)] per-user metrics now carry the separate mandatory-safety bucket ----
export interface PerUserMetrics {
  readonly aq: number; readonly us: number; readonly voi: number;   // over D_disc only (§6.1.1)
  readonly composite: number;                                       // §6.4 over D_disc only
  readonly ms: number;                                              // mandatory-safety compliance over D_safety (REPORTED, not gated)
}

// ---- locked configuration (frozen object lives in config.ts) ----
export interface LockedConfig { /* declared in §3 below */ }
```

---

## 3. `src/config.ts` — the single locked-parameter object

One **deeply-frozen** object holding **every** registered constant from PRE-REGISTRATION-v2.md §9.4. No other module may define a parameter; all read from here. The v1 fields are carried verbatim; v2 additions are flagged. [ARCH][GATE]

```ts
export interface LockedConfig {
  readonly seedMaster: bigint;                 // [v2] 0x5551B_0002n (§7.3, §A.0) — DISTINCT from v1 0x5551B_0001n
  readonly N: number;                          // 12 target (§7.2)
  readonly NFloor: number;                     // 8 pilot floor (§7.2)

  readonly axes: readonly AxisSpec[];          // §2.1 (6 axes, K=3) — UNCHANGED
  readonly alphaBase: number;                  // 1.0 symmetric Dirichlet prior (§4.1) — UNCHANGED
  readonly contextSkews: ContextSkewTable;     // §2.3 registered axis×context prior skews — UNCHANGED
  readonly correlatedPairs: readonly CorrelatedPair[]; // §2.3 generative pairs — UNCHANGED

  // ---- [v2 CHANGE (1)] coupling spec (the §4.0 minimal sparse-pairwise graph) ----
  readonly coupledComponents: CoupledComponentSpec;  // §4.0: P1={grit,routing}, P2={artifact,expertise},
                                                     //        singletons {interrupt(flow-extended), bright}
  readonly bBase: number;                      // 1.0 uniform pseudo-count per joint cell (§4.1)
  readonly lambdaCouple: number;              // 2.0 registered concordance strength (§4.1); λ=0 ⇒ v1 factored
  readonly concord: Readonly<Record<PairId, readonly (readonly [AxisLevel, AxisLevel])[]>>; // §4.1 Concord_p cells

  readonly families: readonly LikelihoodSignature[];   // §2.4 — UNCHANGED
  readonly trainFamilies: readonly FamilyId[];         // §5.1 {headroom-clip-risk,brightness-shift,routing-idiom-change}
  readonly heldOutFamilies: readonly FamilyId[];       // §5.1 {inharmonic-artifact,added-latency,feedback-safety}
  readonly heldOutContextCombos: readonly HeldOutContextCombo[]; // §5.1 grit×clean-mastering, clean×lofi

  readonly evalRates: {                        // §5.3 — UNCHANGED
    negativeControlFrac: number;
    pivotalFrac: number;
    safetyFrac: number;
    casesPerUser: number;
  };

  // ---- §4 SSI constants ----
  // [v2 CHANGE (3)] θ_surprise and κ are NO LONGER hand-fixed scalars; they are SELECTED on TRAIN (§5.2.1).
  readonly thetaSurpriseGrid: readonly number[]; // G_θ = {0.00,0.02,0.05,0.10,0.15,0.20,0.30,0.50} (nats)
  readonly kappaGrid: readonly number[];         // G_κ = {0.00,0.01,0.02,0.05,0.10} (value units)
  readonly turnBudget: number;                   // B = 3 (§4.6) — UNCHANGED

  // §6.4 / §7.1 composite weights (sum = 1) — UNCHANGED
  readonly weights: { wAQ: 0.40; wVoI: 0.40; wUS: 0.20 };

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

  readonly calibrationBins: number;            // ECE bin count (§6.5) — UNCHANGED
}

export declare const CONFIG: Readonly<LockedConfig>;     // deeply frozen; the only parameter source
export declare function assertConfigInvariants(c: LockedConfig): void;
// asserts: weights sum=1; rates in [0,1]; N≥NFloor; seedMaster === 0x5551B_0002n;
//   [v2] lambdaCouple ≥ 0; bBase > 0; Concord_p cells valid (j,l) in 0..2; coupledComponents == {P1,P2}+singletons;
//   G_θ,G_κ nonempty & sorted; turnBudget === 3.
```

Supporting declared shapes (`ContextSkewTable`, `CorrelatedPair`, `HeldOutContextCombo`, **`CoupledComponentSpec`**) live in `types.ts`; their concrete numeric values are the registered skews/couplings of §2.3/§4.0 and the partitions of §5.1, frozen at load. `assertConfigInvariants` enforces the §9.4 lock at startup and **fails the run** (an invalid run, not a FAIL verdict) if any invariant is violated. **[v2] It additionally asserts `seedMaster === 0x5551B_0002n` so a v1-seeded run cannot masquerade as v2.**

---

## 4. `src/prng.ts` — deterministic seeding (§7.3)

A splittable, stateless-derivation PRNG so every sub-stream is reproducible and order-independent across modules. **Identical to v1; only the master constant differs (§7.3 below).** [ARCH][GATE]

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

export declare function deriveStream(seedMaster: bigint, label: StreamLabel, ...salt: (string | number)[]): Rng;
export declare function splitmix64(state: bigint): { value: bigint; next: bigint };
export declare function hashLabel(seedMaster: bigint, label: string, salt: (string | number)[]): bigint;
```

**Locked stream consumption order (§7.3), enforced by `run.ts` — [v2] calibration consumes ONLY `"fitting-data"`:**
`holdout-partition` → `users` (per-user fork `users/u`) → `fitting-data` (baselines (ii)–(v) fit **and** SSI's [v2 CHANGE (3)] TRAIN calibration) → `evaluation` → (`permutation` only if N>20, else recorded unused) → `bootstrap`; plus `ppc` and `loo` sub-streams consumed by `mv.ts`, both derived independently of `evaluation` (§8.1). **No module — and no calibration step — may consume the `evaluation` stream before fitting/calibration completes.** No `Math.random`. [GATE]

---

## 5. `src/generative.ts` — synthetic ground-truth + oracle (§2) — VERBATIM FROM v1

> **[v2 ANTI-RIGGING — §2 / this module is CARRIED VERBATIM from v1.]** The generative world, latent axes, context variables, correlated-axis structure, consequence→likelihood mapping, and the two oracle labels are **identical to v1**. No v2 change touches the generative truth or oracle. The v2 deltas live only in how SSI/ablation *reason* (`posterior.ts`, `ssi.ts`, `baselines.ts`) and how mandatory-safety is *scored* (`metrics.ts`).

```ts
export declare function sampleUser(cfg: LockedConfig, usersRng: Rng, userId: number): SyntheticUser;
export declare function sampleFossils(cfg: LockedConfig, userRng: Rng, theta: ThetaState): readonly Fossil[];
export declare function likelihood(cfg: LockedConfig, family: FamilyId, axis: AxisId, level: AxisLevel, ctx: Context): number;
export declare function oracleWorthSurfacing(cfg: LockedConfig, theta: ThetaState, ctx: Context, family: FamilyId): 0 | 1;
export declare function oracleAnswerChangesIR(cfg: LockedConfig, theta: ThetaState, ctx: Context, family: FamilyId): 0 | 1;
// §2.5 registered deterministic IR-selection oracle (used by oracle labels AND by SSI/baseline-v EVSI).
// [v2 CHANGE (2)] the SAME selectIR is reused for SSI's aligned context-prior baseline (§4.5) — no oracle label is read.
export declare function selectIR(cfg: LockedConfig, input: IRSelectionInput): IRId;
export declare function irValue(cfg: LockedConfig, ir: IRId, belief: CoupledPosterior, ctx: Context): number; // Value(IR) under a belief (§4.5)
export declare function generateCases(
  cfg: LockedConfig, partition: HoldoutPartition, evalRng: Rng, fitRng: Rng, user: SyntheticUser
): { train: readonly ConsequenceCase[]; eval: readonly ConsequenceCase[] };
```

**Integrity checks (§2.6, asserted in tests, UNCHANGED) [ARCH][GATE]:** (a) no oracle function reads any method's output or score; (b) `worthSurfacing` and `answerChangesIR` computed independently and may disagree; (c) the prior is a non-product correlated joint (§2.3) so even the **coupled** model can be mis-specified (§8); (d) held-out families still receive a defined likelihood via their generic signature (§2.4). **[v2] `irValue` now reads a `CoupledPosterior` (the only signature change here) but its registered value map is the v1 map; the oracle labels are unchanged.**

---

## 6. `src/holdout.ts` — the no-peeking wall (§5.1, §5.2) — UNCHANGED

```ts
export interface HoldoutPartition {
  readonly trainFamilies: ReadonlySet<FamilyId>;
  readonly heldOutFamilies: ReadonlySet<FamilyId>;
  readonly heldOutContextCombos: readonly HeldOutContextCombo[];
}
export declare function buildPartition(cfg: LockedConfig, partitionRng: Rng): HoldoutPartition;
export declare function tagHeldOut(p: HoldoutPartition, family: FamilyId, ctx: Context): { family: boolean; context: boolean };
export declare function assertWall(train: readonly ConsequenceCase[], p: HoldoutPartition): void;
```

`buildPartition` **must** be the first consumer of randomness (§7.3 ordering). `assertWall` is called by `run.ts` after fitting-data generation and **fails the run** if any held-out cell leaked into the train split. **[v2 CHANGE (3)] The same `assertWall` discipline now also covers the SSI calibration step**: `run.ts` asserts the calibration consumed only `"fitting-data"` cells before the `"evaluation"` stream is opened (§5.2.1 absolute wall — see §15). [GATE]

---

## 7. `src/posterior.ts` — **[v2 CHANGE (1)]** sparse-pairwise-coupled belief core (§4.0–§4.3, §4.6)

The closed-form belief math shared by **SSI and baseline (v)** (so the ablation differs only by EIG/VoI, §3.5). **v2 replaces v1's fully-factored product with a product over the §4.0 components** (two joint-Dirichlet pairs + two singletons). [ARCH][GATE]

```ts
// ---- per-axis pieces (UNCHANGED from v1; used for singletons {interrupt}, {bright} and the M-fac reference) ----
export declare function countFossils(cfg: LockedConfig, fossils: readonly Fossil[], axis: AxisId, bucket: ContextBucketKey): DirichletParams;
export declare function dirichletPosterior(prior: DirichletParams, counts: DirichletParams): DirichletParams;   // α0 + n
export declare function normalize(alpha: DirichletParams): AxisPosterior;                                       // mean of Dirichlet
export declare function bucketOf(ctx: Context): ContextBucketKey;                                               // §4.7 (subdomain|genre)
export declare function flowBucketOf(ctx: Context): FlowBucketKey;                                              // [v2] §4.0 c⁺ (subdomain|genre|flow) for {interrupt}

// ---- [v2 CHANGE (1)] joint-pair pieces (the new coupling math) ----
// §4.1(b): joint co-counts m_{p,c,(j,l)} from fossils that jointly exercise pair p in bucket c
export declare function countJoint(cfg: LockedConfig, fossils: readonly Fossil[], pair: PairId, bucket: ContextBucketKey): JointDirichletParams; // length 9
// §4.1(b): registered pairwise prior β^0_{p,c,(j,l)} = bBase + λ_couple·𝟙[(j,l)∈Concord_p]; at λ=0 ⇒ exchangeable (v1)
export declare function jointPrior(cfg: LockedConfig, pair: PairId): JointDirichletParams;                      // length 9
export declare function jointPosterior(prior: JointDirichletParams, counts: JointDirichletParams): JointDirichletParams; // β0 + m
export declare function normalizeJoint(beta: JointDirichletParams): JointPosterior;                             // mean over 9 cells

// §4.1(c): assemble the coupled posterior = product over §4.0 components
export declare function coupledPosterior(cfg: LockedConfig, user: SyntheticUser, ctx: Context): CoupledPosterior;

// §4.2 consequence-conditioned update applied PER-AXIS INSIDE each component (joint normalizes over 9 cells)
export declare function consequenceConditioned(cfg: LockedConfig, base: CoupledPosterior, family: FamilyId, ctx: Context): CoupledPosterior;

// §4.3 closed-form KL between two coupled posteriors — COMPONENT-additive, nats
export declare function klCoupled(p: CoupledPosterior, q: CoupledPosterior): number;     // Σ_components KL(component)
export declare function klAxis(p: AxisPosterior, q: AxisPosterior): number;              // Σ_k p_k ln(p_k/q_k)
export declare function klJoint(p: JointPosterior, q: JointPosterior): number;           // [v2] Σ_{9 cells} p ln(p/q)

// §4.6 closed-form Shannon entropy, nats — COMPONENT-additive
export declare function entropyAxis(p: AxisPosterior): number;                           // −Σ_k p_k ln p_k
export declare function entropyJoint(p: JointPosterior): number;                         // [v2] −Σ_{9 cells} p ln p
export declare function entropyCoupled(p: CoupledPosterior): number;                     // Σ_components entropy(component)

// helper: marginalize a joint to a single axis (for IR-tolerance views and the λ→0 limit test)
export declare function marginalizeJoint(joint: JointPosterior, which: 0 | 1): AxisPosterior; // [v2]
```

**Invariants tested (§4, §4.0) [GATE]:** `klAxis ≥ 0`, `klJoint ≥ 0`, `kl*(p,p)=0`; `0 ≤ entropyAxis ≤ ln 3`, `0 ≤ entropyJoint ≤ ln 9`; joint posteriors proper (all `β>0` since `bBase=1`); components untouched by a consequence contribute exactly 0 to `klCoupled` (§4.2). **[v2 critical limit test] at `lambdaCouple = 0` with empty co-counts, each joint factorizes and `klCoupled`/`entropyCoupled` reduce exactly to the v1 per-axis sums** — i.e. the v1 factored model is the `λ→0` special case (§4.0). [GATE]

---

## 8. `src/ssi.ts` — **[v2 CHANGE (2)]+[v2 CHANGE (3)]** the method under test (§3.0, §4.3–§4.7, §5.2.1)

The full locked SSI pipeline on the **coupled** posterior, with the **aligned EVSI** gate and the **TRAIN-only calibration** of `θ_surprise`/`κ`. Uses `posterior.ts`; **consumes no randomness** for its decisions or its calibration argmax (§4.7, §5.2.1). [ARCH][GATE]

```ts
// §4.3 S1 Bayesian-surprise screen — now component-additive over the coupled posterior
export declare function s1Surprise(cfg: LockedConfig, base: CoupledPosterior, cc: CoupledPosterior): number; // = klCoupled
export declare function s1Pass(theta: number, surprise: number): boolean;                                    // surprise > θ_surprise (θ from calibration)

// §4.4 S2 affordance predicate, S6 safety predicate (S3 collapsed to identity gate)
export declare function s2AffordsChange(cfg: LockedConfig, family: FamilyId, ctx: Context): boolean;
export declare function s6Safety(cfg: LockedConfig, family: FamilyId): boolean;                              // forced-surface class

// §4.5 [v2 CHANGE (2)] ALIGNED EVSI — silent baseline is the CONTEXT-PRIOR default IR, not the cc-posterior.
// answerDist uses SSI's OWN coupled posterior to predict answers (no oracle label).
export declare function answerDist(cfg: LockedConfig, cc: CoupledPosterior, family: FamilyId): readonly { level: AxisLevel; p: number }[];
// IR_silent_aligned(C,c) = selectIR( tolerance implied by the CONTEXT-PRIOR coupledPosterior(base) ) — §4.5
export declare function irSilentAligned(cfg: LockedConfig, base: CoupledPosterior, family: FamilyId, ctx: Context): IRId;
// EVSI_aligned = Σ_r P(r|C,c)·Value(IR_answered(r)) − Value(IR_silent_aligned);  = 0 if every answer keeps the prior-default IR
export declare function evsiAligned(cfg: LockedConfig, user: SyntheticUser, base: CoupledPosterior, cc: CoupledPosterior, family: FamilyId, ctx: Context): number;
export declare function s4Eligible(kappa: number, evsiValue: number): boolean;                               // evsi > κ (κ from calibration)

// §4.6 S5 expected information gain (component-additive) + turn budget
export declare function eig(cfg: LockedConfig, base: CoupledPosterior, cc: CoupledPosterior, family: FamilyId, ctx: Context): number;
export declare function rankAndBudget(cfg: LockedConfig, eligible: readonly EligibleCase[]): readonly number[]; // caseIds to surface, ≤ B, S6 first, deterministic tie-break

// §4.7 the locked decision pipeline over all of a user's eval cases, given the CALIBRATED operating point
export declare function ssiDecide(cfg: LockedConfig, cal: CalibratedConstants, user: SyntheticUser, cases: readonly ConsequenceCase[]): readonly MethodDecision[];

interface EligibleCase { readonly caseId: number; readonly eig: number; readonly evsi: number; readonly forcedS6: boolean; readonly familyOrdinal: number; }

// ---- [v2 CHANGE (3)] CALIBRATION SYMMETRY — mechanical TRAIN-split argmax of (θ_surprise, κ) (§5.2.1) ----
// Runs in the FITTING phase on TRAIN cases ONLY (never held-out). Deterministic (no randomness).
// Objective: maximize mean TRAIN composite (§6.4 weights) over the registered grid G_θ × G_κ.
// Tie-break (locked): largest θ first, then largest κ (most conservative / toward silence, §5.2.1/§5.7).
export declare function calibrateOnTrain(
  cfg: LockedConfig,
  users: readonly SyntheticUser[],
  trainCases: readonly ConsequenceCase[]            // §7.3 "fitting-data" stream ONLY — asserted held-out-free
): CalibratedConstants;
```

**Pipeline order (locked §4.7) [GATE]:** S6 force → S1 screen (`θ*_surprise`) → **aligned**-EVSI gate (`κ*`) → S5 EIG rank within budget `B=3`. Tie-break: descending `EVSI_aligned` then fixed family ordinal (§4.6). `ssiDecide` returns one `MethodDecision` per case with `score = EVSI_aligned` for calibration/reliability (§6.5). **[v2] `calibrateOnTrain` is the ONLY new fitting step for SSI; it touches `trainCases` exclusively and is asserted held-out-free by `run.ts` before `"evaluation"` opens (§5.2.1, §15).** [GATE]

---

## 9. `src/baselines.ts` — the five baselines (§3.1–§3.6); **[v2 CHANGE (1)]** ablation (v) shares the coupled posterior

Each baseline is fit **only** on the TRAIN split (§5.2). All consume the **same** fossils SSI sees; only their surface/abstain logic differs. **The only v2 delta is baseline (v):** it now uses the **same `coupledPosterior` from `posterior.ts`** as SSI, with the EIG/VoI machinery removed. [ARCH][GATE]

```ts
export type BaselineId = "silent-route2" | "generic-linter" | "user-heuristic" | "loo-classifier" | "coupled-ablation";

export interface Baseline {
  readonly id: BaselineId;
  fit(cfg: LockedConfig, trainCases: readonly ConsequenceCase[], users: readonly SyntheticUser[]): void; // TRAIN-only (§5.2)
  decide(cfg: LockedConfig, user: SyntheticUser, cases: readonly ConsequenceCase[]): readonly MethodDecision[];
}

// §3.1 (i) silent Route-2 — never surfaces (UNCHANGED)
export declare function makeSilentRoute2(): Baseline;
// §3.2 (ii) generic linter — best fixed user-independent family rule, tuned on TRAIN only (UNCHANGED)
export declare function makeGenericLinter(): Baseline;
// §3.3 (iii) user-aware heuristic — strong, NOT strawman; profile+coarse-context features, tuned threshold (UNCHANGED)
export declare function makeUserHeuristic(): Baseline;
// §3.4 (iv) leave-one-consequence-out classifier on fossils; LOO nested inside the §5.2 wall (UNCHANGED)
export declare function makeLooClassifier(looRng: Rng): Baseline;
// §3.5 (v) [v2 CHANGE (1)] COUPLED model WITHOUT EIG/VoI — SSI's coupledPosterior + a surprise threshold tuned on
//          TRAIN only, NO EVSI/EIG. The falsifier. (renamed factored-ablation → coupled-ablation)
export declare function makeCoupledAblation(): Baseline;

export declare function allBaselines(cfg: LockedConfig, looRng: Rng): readonly Baseline[];
```

**Ablation-isolation invariant (§3.5/§4.5) [GATE] — TIGHTENED in v2:** `makeCoupledAblation` must call the **identical** `posterior.ts` belief functions SSI uses (`coupledPosterior`, `consequenceConditioned`, `s1Surprise`/`klCoupled`) and decide via a **surprise threshold tuned on TRAIN only**, with **no** call into any EVSI/EIG function (`evsiAligned`, `irSilentAligned`, `eig`). **A test asserts `baselines.ts` imports no symbol from `ssi.ts`'s EVSI/EIG surface** (static import-graph check — see §16). Because the coupling now lives in the shared `posterior.ts` and is given equally to SSI and (v), the **SSI−(v) delta isolates ONLY EIG/VoI** on a common, MV-remedied belief model. The ablation's own surprise threshold is tuned by the same TRAIN discipline (it may use a separate single-parameter TRAIN sweep, NOT SSI's `calibrateOnTrain`, to avoid importing SSI internals). [GATE]

---

## 10. `src/metrics.ts` — exact estimators (§6); **[v2 CHANGE (4)]** S6/AQ mandatory-safety split

Per-user deterministic estimators from `{MethodDecision}` + oracle labels. **v2 splits each user's cases into discretionary `D_disc` and mandatory-safety `D_safety`, computes AQ/US/VoI/composite over `D_disc` ONLY, and scores safety compliance in the separate `MS` bucket — applied IDENTICALLY to every method.** [ARCH][GATE]

```ts
// [v2 CHANGE (4)] the oracle/signature-defined, method-independent partition (§6.1.1)
export declare function partitionCases(cases: readonly ConsequenceCase[]): { disc: readonly ConsequenceCase[]; safety: readonly ConsequenceCase[] };
// safety = cases with case.safetyClass === true (signature.familyClass === "safety"); SAME for all methods.

// §6.1 balanced-accuracy abstention quality — over D_disc ONLY
export declare function abstentionQuality(decisions: readonly MethodDecision[], disc: readonly ConsequenceCase[]): number;
// §6.2 usefulness = precision of surfaced vs worthSurfacing (null=0) — over D_disc ONLY
export declare function usefulness(decisions: readonly MethodDecision[], disc: readonly ConsequenceCase[]): number;
// §6.3 answer-changing VoI = precision of surfaced vs answerChangesIR (null=0) — over D_disc ONLY
export declare function answerChangingVoI(decisions: readonly MethodDecision[], disc: readonly ConsequenceCase[]): number;
// §6.4 locked-weight composite per user (over D_disc)
export declare function composite(cfg: LockedConfig, m: { aq: number; us: number; voi: number }): number;
// [v2 CHANGE (4)] §6.1.1 mandatory-safety compliance = fraction of D_safety surfaced (REPORTED, NOT gated)
export declare function mandatorySafety(decisions: readonly MethodDecision[], safety: readonly ConsequenceCase[]): number;
// assembles PerUserMetrics: aq/us/voi/composite over D_disc + ms over D_safety
export declare function perUserMetrics(cfg: LockedConfig, decisions: readonly MethodDecision[], cases: readonly ConsequenceCase[]): PerUserMetrics;

// §6.5 calibration / reliability curves + ECE (diagnostic, NOT gated) — computed over D_disc
export interface ReliabilityBin { readonly meanPred: number; readonly empirical: number; readonly count: number; }
export declare function surfacingReliability(cfg: LockedConfig, decisions: readonly MethodDecision[], disc: readonly ConsequenceCase[]): { bins: readonly ReliabilityBin[]; ece: number };
export declare function abstentionReliability(cfg: LockedConfig, decisions: readonly MethodDecision[], disc: readonly ConsequenceCase[]): { bins: readonly ReliabilityBin[]; ece: number };

// §7.6 H-NC negative-control specificity (per user) — over D_disc (negative controls are discretionary by construction)
export declare function negControlSpecificity(decisions: readonly MethodDecision[], disc: readonly ConsequenceCase[]): number;
```

**Locked conventions (§6) [GATE]:** balanced accuracy (so always-ask/always-abstain cannot game AQ); precision-null = 0 for empty surfacing (US, VoI); composite weights `(0.40,0.40,0.20)` read from `CONFIG`; calibration **reported, never gated** (§6.5). **[v2 CHANGE (4)] crux:** `partitionCases` uses only `case.safetyClass` (oracle/signature-defined), so `D_safety` is **identical across SSI and all five baselines** — a mandated safety surfacing is **never** charged as an abstention FP, and `MS` is **reported, not folded into the composite** (weights and the §9 rule unchanged). [GATE]

---

## 11. `src/stats.ts` — the exact test (§7) — UNCHANGED

No external stats library. Paired sign-flip permutation, exact at N=12. The per-user statistic is `Composite_u` over `D_disc` (§10). [ARCH][GATE]

```ts
export interface PairedTestResult {
  readonly baseline: BaselineId;
  readonly meanDiff: number;            // D̄^{(b)} (§7.1)
  readonly pValueRaw: number;           // one-sided permutation p (§7.4)
  readonly marginPass: boolean;         // D̄^{(b)} ≥ deltaComposite (§7.4)
  readonly exact: boolean;              // true when 2^N enumerated, false if Monte-Carlo (§7.4)
}
export declare function pairedDiffs(ssi: readonly number[], base: readonly number[]): readonly number[];
export declare function permutationTest(cfg: LockedConfig, diffs: readonly number[], permRng: Rng): { p: number; meanDiff: number; exact: boolean };
export interface HolmResult { readonly perBaseline: readonly { baseline: BaselineId; pRaw: number; pAdjThreshold: number; reject: boolean }[]; readonly allReject: boolean; }
export declare function holmStepDown(cfg: LockedConfig, raw: readonly { baseline: BaselineId; p: number }[]): HolmResult;
export declare function bootstrapCI(cfg: LockedConfig, diffs: readonly number[], bootRng: Rng): { lo: number; hi: number };
```

**Locked test semantics (§7.4) [GATE]:** at `N=12`, enumerate all `2^12=4096` sign-vectors exactly; `p = #{D̄(s) ≥ D̄_obs}/2^N`. H1 requires **all five** Holm-rejected at FWER `0.05` **and** every `meanDiff ≥ 0.05`. Bootstrap CI is descriptive only. **All identical to v1.**

---

## 12. `src/mv.ts` — G1B-MV sub-gate (§8); model-under-test is now **M-cpl**

```ts
export type MVVerdict = "MV-ADEQUATE" | "MV-FORCE-COUPLE";

// §8.1 PPC on interaction-sensitive discrepancy T_assoc — replicated from the FITTED COUPLED model M-cpl
export declare function tAssoc(cfg: LockedConfig, fossils: readonly Fossil[]): number;               // summed |pairwise association| over §2.3 registered pairs
export declare function ppcCheck(cfg: LockedConfig, users: readonly SyntheticUser[], ppcRng: Rng): { pPPC: number; adequate: boolean };

// §8.2 fit three belief models; compare held-out (leave-one-fossil-out) ELPD per fossil
export type BeliefModelId = "coupled" | "hierarchical" | "factored";   // [v2] M-cpl (under test), M-hier (richer), M-fac (reference)
export declare function elpdPerFossil(cfg: LockedConfig, model: BeliefModelId, users: readonly SyntheticUser[], looRng: Rng): number;
export interface MVComparison { readonly dElpdHier: number; readonly dElpdFac: number; readonly seHier: number; readonly material: boolean; }
export declare function compareModels(cfg: LockedConfig, users: readonly SyntheticUser[], looRng: Rng): MVComparison;

// §8.3 combine PPC + materiality -> verdict
export declare function mvVerdict(cfg: LockedConfig, ppc: { adequate: boolean }, cmp: MVComparison): MVVerdict;
```

**Locked thresholds (§8) [GATE]:** PPC adequate iff `pPPC ∈ [0.05,0.95]`; residual interactions material iff **the hierarchical** alternative satisfies `ΔELPD_hier ≥ τ_MV=0.02` **AND** `ΔELPD_hier/SE_hier ≥ 4`; `MV-FORCE-COUPLE` iff material **or** PPC inadequate. **[v2 CHANGE (1)]** the model under test is **M-cpl** (sparse-pairwise coupled); `M-hier` is the **richer** alternative (so the coupled model **can still FAIL MV**), and `M-fac` (v1 factored) is now a reported coupling-ablation reference (`ΔELPD_fac` shows whether the coupling was load-bearing). MV runs **regardless** of H1 outcome (§8.3). PPC and LOO streams are independent of `evaluation` (§8.1). [GATE]

---

## 13. `src/decision.ts` — the ordered decision rule (§9) — UNCHANGED

```ts
export type Verdict = "PASS" | "FAIL-descope-D5" | "FAIL-MV" | "FAIL";

export interface DecisionInputs {
  readonly holm: HolmResult;                          // §7.4
  readonly perBaseline: readonly PairedTestResult[];  // includes baseline-(v) coupled-ablation for ablation_tie
  readonly h1Pass: boolean;                           // all 5: margin ∧ Holm-significant (§9.1)
  readonly ablationTie: boolean;                      // (D̄^(v) < δ) OR (Holm-adj p^(v) ≥ 0.05) (§9.1)
  readonly ncPass: boolean;                           // SSI neg-control specificity ≥ 0.80 (§7.6)
  readonly mv: MVVerdict;                             // §8.3
  readonly mvRemedyApplied: boolean;                  // richer-model re-run or claim-reduction completed (§9.1)
}
export declare function decideVerdict(cfg: LockedConfig, inp: DecisionInputs): { verdict: Verdict; rationale: string; action: string };
```

**Locked branch order (§9.2) [GATE]:** (1) `FAIL-MV` if `MV-FORCE-COUPLE` and remedy not applied; (2) `FAIL-descope-D5` if `ablationTie`; (3) `FAIL` if `!h1Pass` (on baselines i–iv) or `!ncPass`; (4) `PASS` otherwise. **[v2]** when `MV-FORCE-COUPLE` with remedy applied, the inputs are read from the re-run on the **richer (hierarchical/extra-coupling)** remedied model (§9.1). Structurally identical to v1 (verdict labels, order, actions). [GATE]

---

## 14. `src/report.ts` + outputs

Renders exactly two artifacts (in a **later** execution phase — **not this phase**). [ARCH][GATE]

### 14.1 Results JSON — `g1b/artifacts/results-v2.json`
A single machine-readable object capturing the full v2 run. **[v2] written to a distinct `results-v2.json` so the v1 `artifacts/results.json` is never overwritten.** Declared shape:

```ts
export interface ResultsJSON {
  readonly meta: { seedMaster: string; N: number; nValid: number; node: string; timestampISO: string; configHash: string;
                   calibrated: CalibratedConstants };           // [v2] the TRAIN-selected (θ*, κ*) + train composite
  readonly holdout: { trainFamilies: FamilyId[]; heldOutFamilies: FamilyId[]; heldOutContextCombos: HeldOutContextCombo[] };
  readonly perUser: readonly {
    userId: number;
    ssi: PerUserMetrics;                                        // [v2] includes ms
    baselines: Readonly<Record<BaselineId, PerUserMetrics>>;    // [v2] each includes ms
    ssiNegControlSpecificity: number;
  }[];
  readonly tests: {
    perBaseline: readonly PairedTestResult[];                   // baseline ids include "coupled-ablation"
    holm: HolmResult;
    bootstrap: Readonly<Record<BaselineId, { lo: number; hi: number }>>;
  };
  readonly calibration: { ssi: { surfacingECE: number; abstentionECE: number } } & Record<BaselineId, { surfacingECE: number; abstentionECE: number }>;
  readonly mv: { pPPC: number; ppcAdequate: boolean; dElpdHier: number; dElpdFac: number; seHier: number; material: boolean; verdict: MVVerdict };
  readonly decision: { verdict: Verdict; rationale: string; action: string };
}
export declare function buildResultsJSON(/* all computed inputs */): ResultsJSON;
export declare function writeResults(path: string, r: ResultsJSON): void;       // execution phase only
```

### 14.2 Human-readable `g1b/artifacts/REPORT-v2.md`
Rendered from `ResultsJSON`. Required sections (in order): run metadata + `configHash` + **the calibrated `(θ*, κ*)` and their TRAIN composite [v2]**; holdout partition; per-baseline composite means + paired diffs + permutation p + margin pass; Holm step-down table; the three sub-metrics shown **separately** (§6.4) with bootstrap CIs; **the `MS` mandatory-safety bucket per method (reported, not gated) [v2 CHANGE (4)]**; calibration/reliability curves + ECE per method (§6.5); G1B-MV block (PPC p, `ΔELPD_hier`, `ΔELPD_fac`, materiality) on **the coupled model [v2]**; the **final verdict** mapped to the §9.3 table with its action. The report must **state explicitly** that the result is **pilot-grade synthetic evidence only**, with the human claim owed at **G5 (N≥24)** (§1.5, §6.6). [PAPER]

```ts
export declare function renderReportMarkdown(r: ResultsJSON): string;
export declare function writeReport(path: string, md: string): void;            // execution phase only
```

**Output integrity [GATE]:** the two artifacts are written **only** in the execution phase; this pre-registration phase produces **no** `results-v2.json` and **no** `REPORT-v2.md`. **The harness must refuse to overwrite `PRE-REGISTRATION.md`, `HARNESS-SPEC.md`, `PRE-REGISTRATION-v2.md`, `HARNESS-SPEC-v2.md`, or the v1 `artifacts/results.json`/`REPORT.md`** (v1 is the permanent record of attempt 1).

---

## 15. `src/run.ts` — top-level orchestration (§7.3 order, §5.2.1, §9)

The entry point wiring everything in the **locked stream order**, with the **[v2 CHANGE (3)] TRAIN calibration inserted in the fitting phase, before the `"evaluation"` stream opens.** [ARCH][GATE]

```ts
export declare function main(): Promise<void>;     // node --experimental-strip-types src/run.ts (or compiled)
// Locked sequence (asserted):
//   assertConfigInvariants  (incl. seedMaster === 0x5551B_0002n)
//   -> buildPartition("holdout-partition")
//   -> sampleUser×N ("users/u")
//   -> generateCases train ("fitting-data")              [TRAIN cases only]
//   -> assertWall(train, partition)                      [§5.2 wall BEFORE any fit/calibration]
//   -> fit baselines (ii)–(v) on TRAIN
//   -> calibrateOnTrain(SSI) on TRAIN  ([v2 CHANGE (3)]; deterministic; asserted held-out-free)
//   -> assertCalibrationWall(trainUsed, partition)       [§5.2.1: calibration touched NO held-out cell]
//   -> generateCases eval ("evaluation")                 [held-out families/contexts ONLY enter here]
//   -> assertWall(... ) re-check eval split tags
//   -> ssiDecide(cal) + baseline.decide per user
//   -> partitionCases -> perUserMetrics (D_disc composite + D_safety MS)   ([v2 CHANGE (4)])
//   -> permutationTest×5 + holmStepDown + bootstrapCI
//   -> mv (ppcCheck + compareModels(M-cpl,M-hier,M-fac) + mvVerdict)
//   -> decideVerdict
//   -> buildResultsJSON -> writeResults(results-v2.json) + renderReportMarkdown + writeReport(REPORT-v2.md).
export declare function assertCalibrationWall(trainUsed: readonly ConsequenceCase[], p: HoldoutPartition): void; // [v2] §5.2.1 ABSOLUTE wall
```

**Run-level guards (§7.3, §5.2, §5.2.1, §9) [GATE]:** (a) streams consumed in the locked order; (b) `assertWall` **and** `assertCalibrationWall` pass **before** any decision and before `"evaluation"` opens — **calibration touching a held-out cell INVALIDATES the run** (not a FAIL verdict); (c) if fewer than `NFloor=8` valid users, the run is **invalid** (regenerate under the seed), not a FAIL; (d) `SEED_MASTER = 0x5551B_0002` is read from `CONFIG` and never overridden by results; **no seed-shopping** — one run, robustness sweeps are descriptive-only and cannot change the verdict (§7.3); (e) SSI consumes **no oracle labels** in `ssiDecide` and **no held-out labels** in `calibrateOnTrain` (it optimizes its own §6 composite on TRAIN). [GATE]

---

## 16. Test plan (`test/`, implementation phase only) [ARCH]

Property/unit tests that verify the math and the integrity invariants — *not* the experiment. v1 tests are kept; v2 tests are flagged:
- **Math (UNCHANGED + v2):** `klAxis ≥ 0`, `kl*(p,p)=0`, `0 ≤ entropyAxis ≤ ln 3`; **[v2] `klJoint ≥ 0`, `0 ≤ entropyJoint ≤ ln 9`, component-additivity of `klCoupled`/`entropyCoupled` (§4.3/§4.6)**; `EVSI_aligned ≥ 0` and `EVSI_aligned = 0` exactly when every answer yields the IR equal to the **context-prior default** IR (§4.5, [v2 CHANGE (2)]).
- **[v2] Coupling→factored limit:** at `lambdaCouple = 0` with empty co-counts, `coupledPosterior`/`klCoupled`/`entropyCoupled` reduce **exactly** to the v1 per-axis sums (§4.0) — proves coupling is a strict generalization, not a different world.
- **Determinism:** two runs at `SEED_MASTER = 0x5551B_0002` produce byte-identical `results-v2.json` (§7.3); **[v2] `calibrateOnTrain` is a deterministic function of the TRAIN split (no randomness).**
- **Permutation:** exact enumeration count `=2^N`; monotonicity of p in `D̄_obs`; p-granularity `1/4096` (§7.4).
- **Wall (UNCHANGED + v2):** `assertWall` throws if any held-out cell appears in train; **[v2] `assertCalibrationWall` throws if `calibrateOnTrain` consumed any held-out family/context/label (§5.2.1 ABSOLUTE).**
- **[v2 CHANGE (1)] Ablation isolation (TIGHTENED):** static import-graph test asserts `baselines.ts` references **no** EVSI/EIG symbol (`evsiAligned`, `irSilentAligned`, `eig`) from `ssi.ts`; `coupled-ablation` calls **only** the shared `posterior.ts` coupling functions — so SSI−(v) isolates ONLY EIG/VoI.
- **[v2 CHANGE (4)] S6/AQ symmetry:** `partitionCases` yields the **same** `D_safety` for SSI and all baselines (method-independent); AQ/US/VoI/composite ignore `D_safety`; `MS` is computed but never enters the composite or the §9 rule.
- **Oracle integrity (UNCHANGED):** oracle labels invariant to any method's decisions (§2.6); SSI/ablation never read `θ_u` or oracle labels.

---

## 17. Consistency map — HARNESS-SPEC-v2 ↔ PRE-REGISTRATION-v2

| Locked PRE-REG-v2 item | Where the harness binds it | v2 delta |
|---|---|---|
| §2.1 axes / §2.2 context / §2.3 correlated prior | `types.ts`, `config.ts`, `generative.ts` | verbatim |
| §2.4 family likelihood signatures | `config.ts` (values), `generative.ts` (`likelihood`) | verbatim |
| §2.5 two oracle labels + IR oracle | `generative.ts` | verbatim (`irValue` takes coupled belief) |
| §3 five baselines | `baselines.ts` | **(v) shares coupled posterior, CHANGE (1)** |
| §4.0–§4.3/§4.6 coupled posterior, KL, entropy | `posterior.ts` | **CHANGE (1)** |
| §4.4 S2/S3/S6 predicates | `ssi.ts` | S6 override verbatim (scoring → §6.1.1) |
| §4.5 aligned EVSI | `ssi.ts` (`evsiAligned`, `irSilentAligned`) | **CHANGE (2)** |
| §4.7 SSI pipeline (S1–S6) | `ssi.ts` (`ssiDecide`) | coupled + aligned |
| §5.1–§5.3 holdout + rates | `holdout.ts`, `config.ts`, `generative.ts` | verbatim |
| §5.2.1 TRAIN-only θ/κ calibration | `ssi.ts` (`calibrateOnTrain`), `run.ts` (`assertCalibrationWall`) | **CHANGE (3)** |
| §6 metrics + calibration | `metrics.ts` | core verbatim |
| §6.1.1 S6/AQ mandatory-safety split | `metrics.ts` (`partitionCases`, `mandatorySafety`) | **CHANGE (4)** |
| §7 permutation + Holm + bootstrap + N + seeds | `stats.ts`, `prng.ts`, `config.ts` | **new `SEED_MASTER` only** |
| §7.6 H-NC guard | `metrics.ts` (`negControlSpecificity`), `decision.ts` | verbatim |
| §8 G1B-MV | `mv.ts` | **model-under-test = M-cpl** |
| §9 decision rule + outputs | `decision.ts`, `report.ts`, `run.ts` | verbatim (richer remedy) |

**Final lock statement [GATE]:** this blueprint introduces **no** parameter not already frozen in `PRE-REGISTRATION-v2.md` §9.4 — the only new degrees of freedom are the **two registered TRAIN-calibrated constants** `θ_surprise`/`κ` (selected mechanically on TRAIN by the registered §5.2.1 grid argmax, never on held-out) and the registered coupling constants `λ_couple=2.0`, `b_base=1.0`, `Concord_p`, all fixed at pre-registration. The executor implements §1–§17 **and only those**, producing the two artifacts (`artifacts/results-v2.json`, `artifacts/REPORT-v2.md`) **only** in the execution phase. **The held-out wall (incl. on calibration) remains enforced, SSI/ablation consume no oracle labels, and it remains structurally possible for SSI to LOSE (PRE-REG-v2 §B.10). No code, no experiment, and no results are produced in this pre-registration phase.**
