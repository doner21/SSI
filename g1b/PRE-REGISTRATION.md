# G1B Falsifier — PRE-REGISTRATION (LOCKED)

**Track:** SSI DAW — Track 1B salience-discrimination spike (Wizard-of-Oz, NO DSP engine).
**Phase:** PRE-REGISTRATION LOCK. This document is written **before any result exists**. No experiment is run, no code is shipped, no numbers are reported in this document.
**Source of truth:** `C:/Users/doner/ssi/orchestration-artifacts/SSI-DAW-BUILD-PLAN.md` — §5.3 (factored, context-conditioned distribution; Beta/Dirichlet posteriors; closed-form KL/entropy/EIG), §5.6 (salience principle, narrowed linter-proof claim, 5-baseline ladder, held-out design, metrics, pass condition), §9 Track 1B (Wizard-of-Oz scope, the binary numeric G1B gate, the G1B-MV sub-gate), and Open Decision #5 (descope if EIG/VoI machinery is not load-bearing).

**Claim labels used throughout:**
- **[ARCH]** — an architectural commitment of this plan (how the system is built / what is computed).
- **[PAPER]** — a claim whose ultimate evidentiary standard is a real-musician study (here: G5, N≥24); G1B provides only *pilot-grade synthetic* evidence for it.
- **[GATE]** — a binary, decision-forcing pass/fail criterion that this pre-registration locks.

**Integrity crux (non-negotiable, applies to every section):** The synthetic generative model and oracle defined here **must not rig the outcome in favour of SSI.** It must be structurally possible for SSI to *lose* — i.e. for a baseline (especially the user-aware heuristic linter or the EIG/VoI-ablation) to tie or beat SSI on the locked metrics. A model under which SSI cannot lose is a falsifier-defeating fraud and is explicitly out of bounds. See §1.3 and §3.6.

---

## 1. Hypotheses

### 1.1 Primary hypothesis H1 (the SSI salience claim) [GATE][PAPER]

> **H1.** On **context-conditioned held-out consequence FAMILIES** (consequence families × context combinations that were never used to add any rule or tune any threshold), SSI salience **beats ALL FIVE baselines** (§3) on the **pre-registered composite** of:
> 1. **abstention quality** (does it abstain exactly when the ground-truth oracle says the consequence is *not* worth surfacing, and surface when it is?),
> 2. **usefulness** (does a surfaced question target a consequence the oracle labels worth-surfacing?), and
> 3. **answer-changing VoI** (would the synthetic user's answer to the surfaced question *actually change the chosen IR* per the oracle?),
>
> by a **pre-registered margin** at **p < 0.05**, with **pre-registered unit of analysis, randomization, and N (pilot N ≥ 8)**, **AND** negative controls abstain, **AND** the model-validity sub-gate **G1B-MV** holds (the chosen factorization is adequate, or coupling is forced — §8, task-3).

- **[ARCH]** The differentiator H1 isolates is *not* "has a user model." A user-aware heuristic linter (baseline iii) also has a coarse prior. Per §5.6 the honest, narrowed claim is: **SSI is differentiated by computing Expected Information Gain (EIG) and Value of Information (VoI) against a calibrated, context-conditioned posterior, and thereby (a) abstaining where a fixed threshold over-asks and (b) asking where a coarse rule under-asks — especially on consequences touching *correlated* axes or *context-conditioned* tolerances.**
- **[GATE]** H1 is the binary G1B product gate (§9 Track 1B). "Beats all five" means strictly beats each of the five baselines on the locked composite by the locked margin (margins, test, and multiple-comparison handling are locked in §7, task-3).
- **[PAPER]** H1's plan-lock evidentiary standard is **G5** (real engine, real fossils, N≥24, adequately powered). G1B is **pilot-grade synthetic** evidence only; passing G1B does not establish the human claim, it only clears the cheap synthetic falsifier so heavier build phases may proceed.

### 1.2 Direction and what would count as confirmation

H1 is **directional and one-sided per baseline**: for each of the five baselines, the registered prediction is `composite(SSI) − composite(baseline) ≥ margin` with the paired test rejecting the null of "no SSI advantage" (§7). Confirmation of H1 requires *all five* one-sided comparisons to clear the locked margin and significance threshold simultaneously (multiple-comparison handling locked in §7).

### 1.3 Explicit falsification hypothesis H0-ablation (the load-bearing test → Decision #5) [GATE]

> **H0-ablation (genuine falsifier).** If the **EIG/VoI-ablation baseline** (baseline v in §3 — the full factored, context-conditioned model **without** the EIG/VoI machinery) **ties or beats** SSI on the locked composite — i.e. SSI does **not** clear the pre-registered margin over the ablation — then the **EIG/VoI machinery is NOT load-bearing**. This is a **real, accepted falsification of the SSI-distinctive claim**, not a defeat to argue around. Per **Decision #5** it forces **descope**: ship the user-aware heuristic Route 1, or Route-2-only, and **retract the "computed belief shift" claim**.

- **[ARCH]** "Ties" is given an explicit operational definition at pre-registration (§7, task-3): SSI fails to exceed the ablation by the registered margin at the registered significance level. A statistical non-rejection in favour of SSI over the ablation **is** the tie condition; it is not re-interpreted post hoc.
- **[GATE]** H0-ablation is the falsifier that makes G1B honest: the ablation shares SSI's entire posterior machinery and differs **only** by removing EIG/VoI. If removing EIG/VoI costs nothing on the locked composite, the expensive machinery buys nothing measurable, and the spike has done its job by telling us so **cheaply**.
- This hypothesis is *symmetric in dignity* with H1: a result that confirms H0-ablation is a **successful** G1B outcome (it prevents months of building on a non-load-bearing mechanism), recorded as **FAIL-descope(Decision #5)** in the decision rule (§9, task-3), not as a project failure.

### 1.4 Secondary / guard hypotheses [GATE]

- **H-NC (negative controls).** On registered negative-control cases (a detected consequence that the oracle labels *not* worth surfacing in that context — e.g. grit-user + aliasing in a lo-fi context), SSI **abstains**. Failure of H-NC is an independent fail condition (§9, task-3), because over-surfacing on negative controls is the clippy failure §5.7 is designed to prevent.
- **H-MV (model validity).** The chosen factorization (factored, with sparse pairwise coupling allowed per §5.3) is adequate under posterior-predictive checks and the factored-vs-sparse-pairwise-vs-hierarchical ablation, **or** the build is forced to add coupling / reduce its KL/EIG claims. H-MV is operationalized as the **G1B-MV** sub-gate (§8, task-3).

### 1.5 What is explicitly NOT claimed by G1B [PAPER]

- G1B does **not** claim real musicians experience Route 1 as discovery (that is **G5**, §9 Phase 5, N≥24).
- G1B does **not** validate θ_surprise against human data (θ_surprise is a registered, fixed value here; §5.8 flags it as a [THIN] spot tuned later by musician studies).
- G1B does **not** establish any DSP / engine claim (that is **G1A**, the concurrency spike). G1B runs **with NO DSP engine** (Wizard-of-Oz, mocked consequence detectors, synthetic fossil histories) per §9 Track 1B.

---

## 2. Synthetic ground-truth generative model

Because no humans are available for this pilot, the held-out evaluation is driven by a **synthetic ground-truth generative model** with an explicit oracle. Every quantity SSI and the baselines are scored against is **defined by this model, not by SSI.** The model is specified here in full so it is locked before any code or result exists.

### 2.1 Latent style axes (low-cardinality, ordinal/categorical) [ARCH]

Each synthetic user `u` has a **latent true preference state** `θ_u` over a small set of style axes. Each axis is **low-cardinality ordinal or categorical** (per §5.3: "a Beta/Dirichlet posterior over a low-cardinality categorical/ordinal"). The locked axis set for G1B (a load-bearing subset of the §5.3 ~9 axes, chosen because they participate in the held-out families):

| Axis | Symbol | Type | Levels (ordinal unless noted) |
|---|---|---|---|
| Grit-tolerance (cleanliness↔grit) | `A_grit` | ordinal | `{clean, neutral, gritty}` |
| Brightness-preference | `A_bright` | ordinal | `{dark, neutral, bright}` |
| Interruption-tolerance | `A_interrupt` | ordinal | `{low, medium, high}` |
| Artifact-tolerance (aliasing/clipping/feedback/latency) | `A_artifact` | ordinal | `{intolerant, mixed, tolerant}` |
| Expertise (vocabulary / sub-domain depth) | `A_expertise` | ordinal | `{novice, intermediate, expert}` |
| Routing-idiom affinity | `A_routing` | categorical | `{serial, parallel, send-return}` |

- **[ARCH]** All axes are low-cardinality (3 levels) so that **Beta/Dirichlet posteriors over them are closed-form** and KL / entropy / EIG are computable in closed form (§5.3). Ordinal axes are treated as ordered categoricals for likelihood shaping; SSI does not get to see `θ_u` — it sees only sampled fossils (§2.3).
- The axis set is **fixed** at pre-registration. Adding an axis after a result exists is forbidden (it would be a post-hoc rule, which §5.6 prohibits — "with no rule added").

### 2.2 Context variables [ARCH]

A generation episode carries a **context** `x` drawn from a small set of context tags (per §5.3 the unit of belief is `P(axis | context)`, not `P(axis)`):

| Context variable | Symbol | Levels |
|---|---|---|
| Sub-domain | `X_subdomain` | `{synthesis, mixing, mastering}` |
| Flow-state | `X_flow` | `{exploring, focused}` |
| Genre register | `X_genre` | `{lofi, clean-pop, experimental}` |

- **[ARCH]** Context **modulates tolerances**: the same axis level implies a different worth-surfacing label in different contexts (this is the whole point of "context-conditioned" — §5.3/§5.6). Concretely, the oracle's tolerance for a given consequence is a function of *both* `θ_u` and `x` (§2.5). Example: a `gritty` user is *tolerant* of aliasing in `(X_genre=lofi)` but a *clean-mastering* context `(X_subdomain=mastering, X_genre=clean-pop)` raises intolerance even for an otherwise grit-leaning user — this is the context-conditioned structure where a profile-only linter is predicted to fail (§5.6 holdout rationale).

### 2.3 Latent user sampling and correlated-axis structure [ARCH]

1. **Sample the latent state** `θ_u` for each synthetic user `u` from a **prior with deliberate correlation between axes** (per §5.3 "a user's grit-tolerance may be conditional on lo-fi context, interruption-tolerance conditional on flow, expertise conditional on sub-domain"). The correlation is encoded as a fixed, registered joint prior — *not* a product of independent marginals — so that the generative truth contains exactly the inter-axis coupling that the factored model risks under-fitting. Registered correlated pairs (sign of association fixed at pre-registration):
   - `A_grit × A_routing` (gritty users lean `serial`/`send-return`),
   - `A_artifact × A_expertise` (experts are more artifact-tolerant *and* more discriminating about *which* artifacts),
   - `A_interrupt × X_flow` (interruption-tolerance drops in `focused` flow — an axis×context coupling).
2. **Context-conditioning of the prior.** The marginal over an axis depends on context for the registered axis×context couplings above (e.g. `P(A_interrupt | X_flow=focused)` shifts toward `low`). This is fixed numerically at pre-registration (the concrete coupling matrices/values are part of the locked spec carried into §4–§6, tasks 2–3, and the harness blueprint).
3. **Sample fossils.** Each user's **fossil record** is a set of past episodes; in each, an observable style signal is **sampled from `θ_u` conditioned on that episode's context**. Fossils are the *only* user-specific evidence any method (SSI or baseline) may consume. Fossil sampling has sampling noise so that fossils under-determine `θ_u` (a finite-evidence regime where Bayesian posteriors and point heuristics can genuinely diverge).

- **[ARCH] Integrity note:** the correlated/context-conditioned structure is included **specifically so the factored independence assumption can fail** (this is what G1B-MV in §8/task-3 tests). The model is therefore *adversarial to SSI's own factorization*, not tuned to flatter it.

### 2.4 Consequence → likelihood mapping [ARCH]

A generation episode statically detects **consequences** (mocked detectors; no DSP). Each consequence `C` belongs to a **consequence family** (e.g. `inharmonic-artifact`, `headroom-clip-risk`, `added-latency`, `brightness-shift`, `routing-idiom-change`). Per §5.6, "consequence→likelihood mapping is generic over style axes":

- Each consequence family carries a **registered likelihood signature**: a mapping from axis level to the likelihood it contributes, `L(C | axis-level, context)`. Example (§5.6): "introduces inharmonic artifact" → likelihood favouring higher `A_grit` / `A_artifact`.
- The mapping is **generic** (defined per family over axes), **not** per-named-consequence — so a held-out family that was never observed still has a well-defined likelihood via its signature. This is what allows a *context-conditioned posterior* to generalize where a profile-only linter cannot.
- The likelihood is **context-modulated**: `L(C | axis-level, x)` depends on `x` for families whose meaning changes by sub-domain/genre (e.g. aliasing in `lofi` vs `mastering`).

### 2.5 Ground-truth oracle [ARCH]

For every (user `u`, context `x`, detected consequence `C`) the model defines **two latent ground-truth labels**, computed from `θ_u` and `x` (never from any method's output):

1. **`worth_surfacing(u, x, C) ∈ {0,1}`** — whether this consequence is genuinely worth raising as a question, defined by a registered oracle function of (a) the **belief mismatch** between what `C` implies about the user and the user's true tolerance in context `x`, and (b) whether `C` **materially changes affordances** (the S2 sense). Operationally: a consequence is worth surfacing iff, under the *true* `θ_u` and context `x`, the user would prefer to be asked rather than have the system silently choose — i.e. the consequence sits where the user's true tolerance is *uncertain or pivotal*, not where it is clearly tolerated or clearly forbidden.
2. **`answer_changes_IR(u, x, C) ∈ {0,1}`** — whether, if the user were asked about `C` and answered per their true `θ_u`, the **chosen IR would actually change** versus the silently-chosen IR. This is the ground-truth VoI label. Operationally it is computed from a registered, deterministic **IR-selection oracle**: a fixed map from (constraint filter + convention ranking over the candidate IRs, given the user's true tolerance) to a chosen IR; the answer changes the IR iff the silent default and the user-informed choice differ. (Per §5.6 S4: "if both answers yield the same chosen IR under the constraint filter + convention ranking, EVSI = 0.")

- **[ARCH]** The two labels are **distinct and can disagree**: a consequence can be worth surfacing for affordance reasons yet not change the IR (and vice versa). The composite metric (defined in §6, task-2) rewards a method only when its surfacing decisions align with *both* labels appropriately, so a method cannot win by tracking only one.
- **[ARCH] Negative-control cases** are exactly those where `worth_surfacing = 0` despite a consequence being *detected* (e.g. grit-user + aliasing in lofi). These are sampled into the evaluation set at a registered rate (§5, task-2) so abstention quality is actually testable.

### 2.6 Why this model can let SSI lose (integrity) [ARCH]

The model is built to make an SSI *loss* possible and meaningful:
- **Correlated / context-conditioned truth (§2.3)** means SSI's factored posterior can be *mis-specified*; if coupling matters more than the registered effect-size threshold, G1B-MV forces SSI to add coupling or reduce claims (§8, task-3) — SSI does not get a pass on its own modelling assumption.
- **The EIG/VoI-ablation (baseline v)** shares SSI's *entire* posterior and removes *only* EIG/VoI. If the closed-form posterior alone (thresholded) already tracks both oracle labels, SSI cannot beat the ablation and H0-ablation fires (§1.3). Nothing in the oracle privileges EIG/VoI over a good threshold rule.
- **The oracle labels are defined from `θ_u` and `x` alone**, with no term that references SSI's internal scores. There is no path by which "being SSI" raises a method's score except via better-aligned surfacing decisions.

---

## 3. The five baselines (the ladder)

Per §5.6 the falsifier is a **baseline ladder**. Each method below is scored by the **identical** metrics (§6, task-2) on the **identical** held-out evaluation set (§5, task-2). Detection (the arithmetic, linter-like consequence detector) is shared by all; what differs is **which detections become questions** (§5.6: "Detection is separated from initiation"). All five are **strong, not strawman** — the test must be hard for SSI.

### 3.0 The method under test — SSI [ARCH]
SSI = the §5.3 factored, context-conditioned posterior **plus** the §5.6 S1–S6 salience math (Bayesian surprise S1; affordance S2; relevance S3; **EIG/VoI** S4/S5; safety/constraint override S6), surfacing highest-EIG-first under a hard turn budget and **abstaining where EVSI = 0**. (Exact SSI formulas are locked in §4, task-2.) SSI is *not* one of the five baselines; it is the claimant H1 must defend.

### 3.1 Baseline (i) — Silent Route-2 [GATE]
- **Definition:** never surfaces a question; always silently picks the default IR.
- **Role:** the floor / null initiator. Establishes the cost of *never* asking. A method that cannot beat silent Route-2 on usefulness + VoI is surfacing nothing of value.
- **[ARCH]** Strong form: silent Route-2 has *perfect* abstention on negative controls (it never over-asks), so SSI must beat it on **usefulness + answer-changing VoI** without losing abstention quality — i.e. SSI must show that asking *the right* questions nets positive value over silence.

### 3.2 Baseline (ii) — Generic linter, no user model [GATE]
- **Definition:** surfaces a question whenever a consequence of a "concerning" family is detected, using a **fixed, user-independent** rule over consequence families (no `θ`, no fossils, no context conditioning of the user).
- **Role:** the classic linter. Predicted to over-ask (poor abstention) and to ignore context.
- **[ARCH]** Strong form: its concerning-family rule is the *best fixed rule* (tuned on the **training** split only, never on held-out families), so it is the strongest possible user-blind linter, not a strawman.

### 3.3 Baseline (iii) — User-aware heuristic linter (the serious competitor) [GATE]
- **Definition:** a **strong** heuristic that *does* use the user — a small set of features `{profile_artifact_tolerance, profile_grit, consequence_family, context_subdomain, …}` → ask/suppress via a tuned threshold/decision rule. This is the C3-named competitor that *will* produce a ≥40pp surfacing-rate difference on any single artifact holdout (§5.6).
- **Role:** the baseline H1's *narrowed* claim is really about. If SSI cannot beat **this**, the "has a user model" story is not the differentiator.
- **[ARCH] Strong form (explicitly NOT a strawman):** its features and thresholds are fit on the **training** split (including the same fossils SSI sees) to the *best achievable* heuristic, and it is allowed coarse context features. It is denied only the **calibrated posterior + EIG/VoI** machinery. The held-out design (§5, task-2) — consequence *families* × *context combinations* — is precisely where a profile-only/coarse-context heuristic is predicted to break and a context-conditioned posterior is predicted to generalize. **If it ties SSI, that too is informative** (it weakens the distinctive claim toward Decision #5 territory, though the load-bearing falsifier is specifically baseline v).

### 3.4 Baseline (iv) — Leave-one-consequence-out classifier on fossils [GATE]
- **Definition:** a discriminative classifier trained to predict `worth_surfacing` from fossil-derived features, evaluated **leave-one-consequence-(family)-out** so it must generalize to a held-out family from the others.
- **Role:** the "just train a model on the fossils" competitor — tests whether plain supervised generalization from fossils already matches SSI without any explicit posterior/VoI structure.
- **[ARCH]** Strong form: it is trained on the **same** fossil evidence SSI consumes, with a fair feature set, and evaluated under honest LOO so it cannot memorize the held-out family. It is a genuine ML competitor, not a degenerate one.

### 3.5 Baseline (v) — Factored model WITHOUT EIG/VoI (the ablation) [GATE]
- **Definition:** the **full §5.3 factored, context-conditioned posterior** — *identical* to SSI's belief model — but initiation is decided by a **threshold on the posterior / Bayesian surprise alone**, with the **EIG/VoI machinery removed** (no EVSI gate, no EIG ranking, no "EVSI = 0 ⇒ abstain").
- **Role:** **the load-bearing falsifier.** This baseline differs from SSI **only** by the presence/absence of EIG/VoI. Per §1.3 and Decision #5: **if this ties or beats SSI, the EIG/VoI machinery is not load-bearing → descope.**
- **[ARCH]** Strong form: it gets SSI's *entire* posterior advantage for free; its surprise threshold is tuned on the **training** split to its best. The *only* thing it lacks is the mechanism whose value G1B exists to measure. This is the cleanest possible isolation of the EIG/VoI contribution.

### 3.6 Ladder integrity summary [ARCH]
- All five baselines are tuned/fit on the **training** split only; none sees the held-out families/contexts during fitting (no rule added on holdouts — §5.6).
- Baselines iii, iv, v are **deliberately strong** (best heuristic, fair ML, full posterior) so that an SSI win is meaningful and an SSI loss is possible.
- The decisive isolation is **SSI vs baseline (v)**: same posterior, EIG/VoI the only difference. The decisive "is it just a user model?" check is **SSI vs baseline (iii)**. H1 requires beating **all five** simultaneously by the locked margin (§7, task-3).

---

## 4. SSI salience — exact formulas

This section locks the **closed-form mathematics** SSI computes. It targets **TypeScript (Node 24)** closed-form arithmetic (no external probabilistic library; no sampling for SSI's own decisions — all SSI quantities below are analytic). **No implementation code appears in this phase**; these are the equations the harness (`HARNESS-SPEC.md`) will implement *exactly*. All logarithms are natural (base *e*); information quantities are in **nats**. Notation: an axis `a ∈ A` (the §2.1 axis set) has levels `k ∈ {1..K_a}` (here `K_a = 3` for every locked axis).

### 4.1 Factored, context-conditioned posterior from fossil counts [ARCH]

Per §5.3, the user model is a **product of independent per-axis Dirichlet posteriors, each conditioned on context** (the factored assumption whose adequacy G1B-MV tests in §8/task-3). For user `u`, axis `a`, in context bucket `c` (a context-conditioning key derived from `x`; see §4.7):

- **Prior:** a registered Dirichlet `Dir(α^0_{a,c})` with `α^0_{a,c} = (α^0_{a,c,1}, …, α^0_{a,c,K_a})`. The locked prior is **weakly informative and symmetric** unless §2.3 registers a context-conditioned skew: `α^0_{a,c,k} = α_base` for all `k` (locked value `α_base = 1.0`, i.e. uniform), except for the registered axis×context couplings of §2.3 where a registered skew vector is used (the concrete numeric skews are part of the locked spec carried into the harness). Using `α_base = 1` makes the prior a proper, exchangeable Laplace prior and keeps every posterior proper.
- **Evidence:** fossils contribute **counts**. Let `n_{a,c,k}` = number of fossils for user `u` whose context maps to bucket `c` and whose observed style signal on axis `a` is level `k`. (Fossils are the only user-specific evidence; §2.3.)
- **Posterior (closed-form, conjugate):**

  ```
  P(axis a = k | C-absent, context c)  =  α_{a,c,k} / Σ_j α_{a,c,j}
  where  α_{a,c,k} = α^0_{a,c,k} + n_{a,c,k}        (Dirichlet posterior parameters)
  ```

  For a **binary** axis this reduces to a **Beta** posterior `Beta(α_{a,c,1}, α_{a,c,2})` with mean `α_{a,c,1}/(α_{a,c,1}+α_{a,c,2})`. The "rules/weights" of the prior survive *only* as `α^0` and the counts `n` (§5.3: "rules survive only as sufficient statistics").

- **Joint over the axis vector** (the "Intent" posterior) is the **product of per-axis posteriors** under the factored assumption:

  ```
  P(Intent = (k_a)_{a∈A} | context c)  =  Π_{a∈A}  P(axis a = k_a | context c)
  ```

  **[ARCH]** This product form is exactly the independence hypothesis §5.3 says the build can be *forced to abandon*. G1B-MV (§8) compares it to sparse-pairwise and hierarchical alternatives; if interactions matter beyond the registered effect size, SSI must couple or reduce its KL/EIG claims.

### 4.2 Consequence likelihood and the consequence-conditioned posterior [ARCH]

A detected consequence `C` carries the **registered generic likelihood signature** `L(C | axis a = k, x)` of §2.4 (per-family, context-modulated, defined even for held-out families). SSI forms the **consequence-conditioned posterior** by one Bayesian update per axis:

```
P(axis a = k | C, context c)  =  L(C | a=k, x) · P(axis a = k | context c)  /  Z_{a,c}
where  Z_{a,c} = Σ_j  L(C | a=j, x) · P(axis a = j | context c)
```

The joint consequence-conditioned posterior is again the product over axes. Only axes that `C`'s signature actually touches (non-flat `L`) are updated; untouched axes have `P(·|C,context) = P(·|context)` and contribute zero to the surprise below.

### 4.3 S1 — Bayesian surprise (closed-form KL) [ARCH][GATE]

Per §5.6 S1: a consequence is *surprising* iff observing it shifts the context-conditioned belief by more than `θ_surprise`:

```
S1(C, c)  =  KL( P(Intent | C, context c) ‖ P(Intent | context c) )
          =  Σ_{a∈A}  KL( P(a | C, c) ‖ P(a | c) )           (additive over factors)
          =  Σ_{a∈A}  Σ_{k=1}^{K_a}  P(a=k | C, c) · ln[ P(a=k | C, c) / P(a=k | c) ]
```

- The factor-additivity of KL for a product distribution is **exact** under the factored model — this is *why* §5.3 chose a factored representation (closed-form, cheap, per-user). Each per-axis KL is a finite sum over `K_a = 3` terms.
- **S1 gate:** `C` passes the surprise screen iff `S1(C, c) > θ_surprise`. **`θ_surprise` is a registered fixed constant** (locked numeric value carried into the harness; §5.8 flags it [THIN] — calibrated against humans only at G5, not tunable on G1B held-out data). Per §5.7 it is set **conservatively** (toward silence).
- **[ARCH]** S1 is a *screen*, not the surfacing decision. A large belief shift that does not change the chosen IR (S4 below) is still suppressed — this is the abstention SSI claims over a surprise-threshold rule (and is exactly what baseline v keeps vs SSI removes).

### 4.4 S2 affordance / S3 relevance / S6 safety (bounded, registered) [ARCH]

Per §5.6, S2 (affordance materiality) and S3 (relevance) are **honestly LLM-qualitative and [THIN]**; in the **synthetic** G1B they are *not* free parameters. They are bound to the oracle structure so SSI gets no hidden tuning knob:

- **S2 (affordance materiality):** operationalized in G1B as a **registered deterministic predicate** `affordsChange(C, x)` derived from the same §2.4 family signature (a consequence "materially changes affordances" iff its signature has non-flat `L` on an axis the IR-selection oracle of §2.5 actually reads). No learned/tunable S2 in G1B.
- **S3 (relevance):** **not modelled as a tunable score** in G1B (it would be an unconstrained knob). Per §5.6 S3 is *bounded by S1/S4*; in G1B it is treated as the identity gate (relevance ≡ "passed S1 and has positive VoI"), so SSI cannot win via an opaque relevance term. This is recorded as a **registered simplification** (honest limitation, §6.6).
- **S6 (safety/constraint override):** registered hard rule — any consequence flagged by the §2.4 signature as a **constraint/safety violation** (e.g. zero-delay feedback class) is **always surfaced**, bypassing S1/S4. S6 is evaluated **first** (per §9 build order). In G1B, safety-class consequences are a registered, small fraction of the evaluation set so S6 behaviour is observable but does not dominate the composite.

### 4.5 S4 — Value of Information / EVSI gate (the load-bearing mechanism) [ARCH][GATE]

Per §5.6 S4: **EVSI(C) > cost-of-interruption**, and the decisive rule "**if both answers yield the same chosen IR under the constraint filter + convention ranking, EVSI = 0 → no question.**" Closed-form against the posterior:

Let `q(C)` be the **question** SSI would ask about `C` (a query over the axis/axes `C`'s signature touches). The user's answer `r` takes values in the axis levels with **predictive probability** equal to SSI's current posterior `P(answer = r | C, context c)` (SSI's best calibrated guess at how the user will answer). Let `IR*(·)` be the **registered IR-selection oracle** (§2.5): a deterministic map from (effective tolerance over candidate IRs, given a belief state) to a chosen IR under the constraint filter + convention ranking.

```
IR_silent(C, c)        =  IR*( using posterior mean tolerance, no question )
IR_answered(C, c, r)   =  IR*( using the tolerance implied by answer r )

EVSI(C, c)  =  Σ_r  P(answer = r | C, c) · Value( IR_answered(C,c,r) )  −  Value( IR_silent(C,c) )
```

where `Value(IR)` is the registered task-value of choosing `IR` **measured under SSI's posterior** (expected utility of that IR against the current belief). The **decisive simplification matching §5.6 S4** (locked):

```
If  IR_answered(C, c, r) == IR_silent(C, c)  for every answer r with P(answer=r|C,c) > 0,
then EVSI(C, c) = 0     (the answer cannot change the chosen IR ⇒ no question).
```

- **VoI/EVSI gate:** `C` is **VoI-eligible** iff `EVSI(C, c) > κ`, where `κ ≥ 0` is the **registered cost-of-interruption** constant (locked numeric value into the harness; `κ = 0` admits any strictly answer-changing question, `κ > 0` demands a minimum value — the locked value is registered conservatively per §5.7). `EVSI = 0` ⇒ **abstain**, unconditionally.
- **[ARCH] Why this is the falsifier's fulcrum:** baseline v (§3.5) has the *same* posterior and the *same* `IR*` oracle but **omits this EVSI computation**, initiating on the S1 surprise threshold alone. SSI's claimed edge is precisely the cases where **S1 is large but EVSI = 0** (surprising but non-pivotal ⇒ SSI abstains, baseline v over-asks) and where **S1 is modest but EVSI > κ** (unsurprising but pivotal ⇒ SSI asks, a surprise-threshold rule under-asks). If those cases are rare or the oracle does not reward them, **H0-ablation fires** (§1.3) — and nothing here prevents that.

### 4.6 S5 — EIG ranking and the turn budget [ARCH][GATE]

Per §5.6 S5: among the consequences that survive S1 ∧ S4 (∪ forced S6), **surface highest Expected Information Gain first, hard-stop at the turn budget.** EIG of asking `q(C)` is the expected reduction in posterior entropy over the touched axes:

```
EIG(C, c)  =  H( P(Intent | context c) )  −  E_r[ H( P(Intent | answer r, C, context c) ) ]
           =  Σ_{a∈A}  [ H(P(a|c))  −  Σ_r P(answer=r|C,c) · H(P(a | answer r, c)) ]      (factor-additive)
where  H(P) = − Σ_k P(k) · ln P(k)         (Shannon entropy, nats; closed-form, K_a terms)
```

Entropy is computed **per axis** (closed-form over `K_a = 3` levels) and summed — exact under the factored model, mirroring §4.3. (For an answered axis that is fully revealed by its answer, the inner `H` collapses to 0; partial-information answers use the registered answer-likelihood.)

- **Ranking & budget:** order all VoI-eligible (∪ S6-forced) consequences by **descending EIG**; surface the top ones up to the **hard turn budget B** (locked `B = 3` per §5.7's "≤ 3 questions per generation transaction"). S6-forced safety questions are surfaced **first** and count against `B`; ties in EIG are broken by a **registered deterministic key** (descending EVSI, then a fixed family ordinal) so the procedure is fully reproducible under a seed.
- **[ARCH]** EIG decides *order and which of the eligible survive the budget*; EVSI (§4.5) decides *eligibility/abstention*. Both are removed in baseline v.

### 4.7 The SSI decision procedure (locked pipeline) [ARCH][GATE]

For each (user `u`, context `x`, detected consequence `C`), with context bucket `c = bucket(x)`:

1. **S6 first:** if `C` is safety/constraint-class → **surface** (forced), bypassing 2–4. (§4.4)
2. **S1 screen:** compute `S1(C,c)` (§4.3). If `S1 ≤ θ_surprise` → **abstain** (not surprising enough). *(Forced S6 already exited at step 1.)*
3. **S4 EVSI gate:** compute `EVSI(C,c)` (§4.5). If `EVSI ≤ κ` (incl. the `EVSI = 0` same-IR case) → **abstain** (no answer-changing value).
4. **S5 rank + budget:** among all survivors (∪ forced S6) for this transaction, rank by `EIG` (§4.6) and **surface the top ≤ B**; the rest **abstain** (budget exhaustion).

- **Abstention rule (locked):** SSI **abstains** on `C` iff `C` is *not* surfaced by the pipeline above — i.e. fails S1, or fails the EVSI gate, or is crowded out of the turn budget. **Negative controls (§2.5)** must abstain via step 2 or 3 (their `worth_surfacing = 0` should coincide with low S1 *or* `EVSI = 0` under a faithful posterior). H-NC (§1.4) tests exactly this.
- **`bucket(x)` (context-conditioning key):** the registered map from raw context `x` (§2.2) to the conditioning key `c`. Locked form: `c = (X_subdomain, X_genre)` for likelihood/posterior conditioning, with `X_flow` entering only the registered `A_interrupt × X_flow` coupling (§2.3). The bucket map is fixed at pre-registration; it is *not* re-chosen after results.
- **Determinism:** every SSI quantity above is analytic given (counts, registered constants `α^0, θ_surprise, κ, B`, signatures, `IR*`). SSI uses **no randomness**; the only seeds in G1B drive *data generation* and the *permutation test* (§7/task-3), never SSI's decisions.

---

## 5. Held-out design (what is hidden, and the train/test discipline)

Per §5.6 the discrimination test is on **context-conditioned held-out consequence FAMILIES with no rule added**. This section locks **what is held out** and the **train/test wall**, so no method (SSI or baseline) can be tuned on the evaluation distribution.

### 5.1 The two-axis holdout: families × context combinations [ARCH][GATE]

The evaluation generalization demand is **two-dimensional** (matching §5.6 "consequence *families* × *context combinations*"):

- **Held-out consequence FAMILIES.** The §2.4 family set is partitioned into **TRAIN families** and **HELD-OUT families**. Every method may fit/tune only on TRAIN families; HELD-OUT families appear **only** at evaluation. Because likelihoods are **generic per family over axes** (§2.4), a held-out family still has a defined signature, so a *context-conditioned posterior* can score it without ever having seen it — whereas a rule/threshold fit to specific TRAIN families must generalize. Locked partition (registered): TRAIN families `{headroom-clip-risk, brightness-shift, routing-idiom-change}`; HELD-OUT families `{inharmonic-artifact, added-latency}` plus at least one **safety-class** held-out family for S6 observation. (The exact family↔axis signatures are part of the locked spec carried into the harness.)
- **Held-out CONTEXT combinations.** Independently, specific **(axis-profile × context) combinations** are held out — the canonical §5.6 case **grit-leaning user in a clean-mastering context** (`A_grit=gritty` × `X_subdomain=mastering, X_genre=clean-pop`), and its mirror **clean-leaning user in a lo-fi context**. These context combinations are **excluded from every method's fitting data** and appear only at test, so the **context-conditioned** advantage (or its absence) is what is measured. This is the §5.6 holdout where a profile-only or coarse-context heuristic (baseline iii) is predicted to break.

A test case is **fully held out** if it draws a HELD-OUT family **or** a held-out context combination (the evaluation set deliberately includes both single-held-out and doubly-held-out cells so the two generalization demands are separable in analysis).

### 5.2 Train/test discipline (the wall) [ARCH][GATE]

- **Fitting data (TRAIN split):** all baseline thresholds/features/classifiers (§3) **and** any quantity that could be tuned are fit **only** on TRAIN families and non-held-out context combinations. SSI's registered constants (`α^0, θ_surprise, κ, B`, signatures, `IR*`) are **fixed at pre-registration** and are *not* fit on either split — SSI has **no** post-hoc tunable parameter (this is what makes "no rule added" enforceable for SSI).
- **Fossils vs evaluation.** Every method consumes the **same** per-user fossils (§2.3) for belief/feature formation. Fossils are sampled from the user's `θ_u` but the **evaluation consequences/contexts** for held-out cells are generated from cells the fitting never touched. A method may use fossils freely; it may **not** use any held-out-cell label during fitting.
- **No-peeking guarantee (locked):** the harness must **construct the held-out partition before generating any fitting data**, fit all baselines, and *then* reveal evaluation cells — enforced by the seeding scheme (§7/task-3, `HARNESS-SPEC.md`). Any method touching a held-out label pre-evaluation is a harness bug, not a result.
- **Leave-one-consequence-out (baseline iv):** baseline iv's LOO is **nested inside** this wall — it leaves out one family *among the TRAIN families* for its own internal generalization, and is then scored on the global HELD-OUT families like everyone else, so it gets no special access.

### 5.3 Evaluation-set composition (registered rates) [ARCH]

So that each metric is actually estimable, the evaluation set is generated at **registered rates** (locked proportions carried into the harness):

- a registered fraction of **negative-control** cases (`worth_surfacing = 0` with a *detected* consequence) — required so abstention quality is testable and clippy-failure is penalized (§2.5);
- a registered fraction of **answer-changing-pivotal** cases (`answer_changes_IR = 1`) — required so VoI is estimable and not degenerate;
- a registered small fraction of **safety-class** cases — so S6 is observable;
- balanced coverage of held-out families and held-out context combinations across users.

Per-user the evaluation draws a **registered number of consequence cases** so the per-user metric means (the unit of analysis, §7/task-3) are well-defined. **All rates and counts are fixed before any data is generated.**

---

## 6. Metrics — exact computable estimators against the synthetic oracle

Every metric below is an **exact, deterministic estimator** computed from a method's surface/abstain decisions and the §2.5 oracle labels (`worth_surfacing`, `answer_changes_IR`). They target **TypeScript (Node 24)** arithmetic; **no implementation code in this phase.** For a method `M` and user `u`, let the evaluation cases for `u` be `D_u` (each case `i` = a detected consequence in a context). Let `surface_M(i) ∈ {0,1}` be whether `M` surfaces a question on case `i`; `ws(i) = worth_surfacing` and `vc(i) = answer_changes_IR` are the oracle labels (§2.5).

### 6.1 Abstention quality `AQ` [ARCH][GATE]

Abstention quality rewards **surfacing exactly the worth-surfacing cases and abstaining on the rest** (§5.6). Defined per user as the **balanced accuracy of the surface decision against `ws`** (balanced so the registered negative-control rate cannot be gamed by always-abstain or always-ask):

```
TP_u = Σ_{i∈D_u} surface_M(i)·ws(i)        FN_u = Σ_{i∈D_u} (1−surface_M(i))·ws(i)
TN_u = Σ_{i∈D_u} (1−surface_M(i))·(1−ws(i)) FP_u = Σ_{i∈D_u} surface_M(i)·(1−ws(i))

sensitivity_u = TP_u / (TP_u + FN_u)        specificity_u = TN_u / (TN_u + FP_u)
AQ_u(M) = ½ · ( sensitivity_u + specificity_u )         ∈ [0,1]
```

- **[ARCH]** Balanced accuracy makes silent Route-2 (baseline i, never surfaces) score `specificity = 1, sensitivity = 0 ⇒ AQ = 0.5` — a real floor SSI must clear on the *useful* side, while a generic over-asking linter (baseline ii) is penalized on specificity. Per §5.7 the design favours silence; the **registered FP-interruption target (≤ 20%)** is reported alongside `AQ` as a named secondary (it is not the composite, but a registered guard).
- Edge cases (empty denominator for a user with no positive or no negative cases) are resolved by the registered evaluation-set composition (§5.3 guarantees both classes per user); any residual empty class uses the registered convention (that half-term set to the registered prior rate), fixed pre-results.

### 6.2 Usefulness proxy `US` [ARCH][GATE]

Per §5.6, usefulness = **a surfaced question targets a consequence the oracle labels worth-surfacing** (the synthetic stand-in for "user-rated usefulness"; the honest [PAPER] version is human ratings at G5, §6.6). Defined as the **precision of surfaced questions against `ws`**:

```
US_u(M) = ( Σ_{i∈D_u} surface_M(i)·ws(i) )  /  ( Σ_{i∈D_u} surface_M(i) )      ∈ [0,1]
```

- If `M` surfaces nothing for `u` (denominator 0 — e.g. silent Route-2), `US_u` is set to the **registered null value 0** (surfacing nothing yields zero usefulness), fixed pre-results. This is the term on which silent Route-2 necessarily loses, so SSI's *useful asking* is rewarded.
- **[ARCH]** `US` (precision) and `AQ`-sensitivity (recall) trade off; the composite (§6.4) combines them so a method cannot win by pure over- or under-asking.

### 6.3 Answer-changing VoI `VoI` [ARCH][GATE]

Per §5.6 the decisive metric: **did the user's answer actually change the chosen IR?** Among surfaced questions, the fraction whose oracle VoI label is positive — i.e. surfacing **caught a genuinely pivotal** consequence:

```
VoI_u(M) = ( Σ_{i∈D_u} surface_M(i)·vc(i) )  /  ( Σ_{i∈D_u} surface_M(i) )      ∈ [0,1]
```

- Denominator-0 (no surfacing) → **registered null value 0** (you cannot change an IR by a question you never asked), fixed pre-results.
- **[ARCH] This is where EVSI earns or fails to earn its keep.** SSI's EVSI gate (§4.5) is *designed* to raise `VoI` precision by abstaining on `EVSI = 0` (non-pivotal) cases. Baseline v lacks the gate, so it should surface more non-pivotal cases and score lower `VoI` — **unless** the posterior/surprise alone already separates pivotal from non-pivotal, in which case `VoI(SSI) ≈ VoI(baseline v)` and **H0-ablation fires** (§1.3). The metric is constructed so this falsification is *visible*, not hidden.

### 6.4 The pre-registered composite [ARCH][GATE]

The G1B gate (§9/task-3) is on a **single composite per user**, a **registered fixed-weight** combination of the three locked metrics:

```
Composite_u(M) = w_AQ · AQ_u(M) + w_US · US_u(M) + w_VoI · VoI_u(M)
with registered weights  w_AQ, w_US, w_VoI ≥ 0,  w_AQ + w_US + w_VoI = 1
```

- **The weight vector `(w_AQ, w_US, w_VoI)` is fixed at pre-registration** (locked numeric value carried into §7/task-3 and the harness) and is **never** re-chosen after results. To respect §5.6's emphasis on answer-changing VoI and abstention as the decisive, anti-clippy quantities, the registered weighting places primary mass on `AQ` and `VoI` with `US` as the secondary, exact values locked in §7. Reporting will *also* show the three metrics **separately** (per §5.6 "with calibration/reliability curves"), but the **gate is on the composite** with the locked weights so there is no post-hoc metric-shopping.
- **Unit of analysis:** the per-user scalar `Composite_u(M)`. The across-user aggregation, paired test, and margins are locked in **§7 (task-3)**.

### 6.5 Calibration / reliability-curve definitions [ARCH]

Per §5.6 the report must include **calibration/reliability curves**. Defined as exact estimators (computed at evaluation, **not** used to tune anything — §5.2):

- **Surfacing-reliability curve.** Bin cases by a method's **surfacing score** (for SSI: `EVSI`, or the EIG-rank-normalized score; for baselines: their decision score). In each bin `b`, plot **empirical pivotality** `mean(vc | bin b)` vs **mean predicted** score. A well-calibrated SSI has monotone increasing empirical `VoI` with `EVSI`. **Expected Calibration Error** `ECE = Σ_b (|b|/N) · |mean_pred_b − mean_vc_b|` is reported per method (registered binning: a fixed number of equal-width bins, locked into the harness).
- **Abstention-reliability curve.** Same construction against `ws` (worth-surfacing), measuring whether higher surfacing scores coincide with truly worth-surfacing cases.
- **[ARCH]** Calibration is **diagnostic/reported**, explicitly **not** part of the gate composite (to avoid adding a tunable surface). It exists so a tie/near-tie in §6.4 can be *interpreted* (e.g. SSI better-calibrated even at equal composite is reported but does **not** rescue a failed gate — the gate is §6.4 + §7).

### 6.6 Honest limitations of the metrics (locked) [PAPER]

- **The oracle is synthetic.** Every label (`worth_surfacing`, `answer_changes_IR`) and therefore every metric here is defined by the §2 generative model, **not** by humans. `US` is a *proxy* for "user-rated usefulness"; `VoI` is computed against a *registered* IR-selection oracle, not observed user behaviour. A G1B pass is **pilot-grade synthetic evidence** only (§1.5).
- **Real evidence is G5, not G1B.** The human-grounded version — **N ≥ 24 musicians**, adequately powered, real fossils, real engine, real usefulness ratings and real answer-changing observations — is **G5** (§9 Phase 5), not this spike. G1B's N ≥ 8 is explicitly **pilot-grade** (§5.6, §9 Track 1B). No metric in §6 should be read as establishing the human claim; it clears (or fails) the cheap synthetic falsifier so heavier build phases are gated honestly.
- **S3 is collapsed (§4.4).** The relevance term is bound to S1/S4 rather than modelled, a registered simplification that *removes* a degree of freedom from SSI (conservative for the claim, not flattering to it).

---

---

## 7. Pre-registered margins, unit of analysis, randomization, N, and the exact statistical test

This section **locks every quantity that converts per-user metric values (§6) into a binary G1B verdict** — margins, N, seeds, and the exact test — **before any data exists.** Nothing here may be re-chosen after a result. The test uses **no external statistics library**: it is a deterministic, fully-seeded paired permutation procedure (exact enumeration where feasible) with a deterministic bootstrap for reported confidence intervals only.

### 7.1 Unit of analysis [ARCH][GATE]

- **The unit of analysis is the synthetic user `u`.** For a method `M`, the per-user scalar is `Composite_u(M)` (§6.4): a single number per user, computed as the mean over that user's evaluation cases `D_u` of the locked composite.
- **Locked composite weights** (fixing the §6.4 placeholder; primary mass on abstention quality and answer-changing VoI, usefulness secondary, per §5.6/§5.7 anti-clippy emphasis):

  ```
  w_AQ = 0.40 ,  w_VoI = 0.40 ,  w_US = 0.20      ( sum = 1, all ≥ 0 )
  ```

- **Across-user statistic.** For each baseline `b`, the paired per-user difference is

  ```
  d_u^{(b)} = Composite_u(SSI) − Composite_u(b)
  ```

  and the **per-baseline effect** is the **mean paired difference** `D̄^{(b)} = (1/N) Σ_u d_u^{(b)}`. The unit-of-analysis mean is taken **across users** (not across cases): users are the exchangeable replicates; per-user case counts are fixed by §5.3 so each user contributes one `Composite_u`. This is the single registered statistic the test below operates on.

### 7.2 Sample size N [ARCH][GATE]

- **N is the number of synthetic users.** Locked: **target `N = 12`**, with **`N ≥ 8` as the pilot floor** required by §9 Track 1B. The run generates `N = 12` users; if (for any harness reason) fewer than 8 valid users are produced, the run is **invalid** (not a FAIL) and must be regenerated under the registered seed scheme — a result below the pilot floor is not interpretable.
- **N is pilot-grade by construction** (§1.5, §6.6): `N = 12` synthetic users is **not** the plan-lock evidentiary standard. The powered, human standard is **G5 with N ≥ 24 real musicians** (§9 Phase 5). G1B's N is fixed here only to make the cheap synthetic falsifier decidable.
- **Why N is adequate for a paired test at this margin:** the test (§7.4) is a **paired** permutation test on per-user differences; with `N = 12` the exact sign-flip permutation null has `2^12 = 4096` equally-likely points, giving an exact achievable one-sided p-value granularity of `1/4096 ≈ 2.4×10⁻⁴`, far finer than `α = 0.05`. No asymptotic/normal approximation is used.

### 7.3 Randomization and the deterministic seed scheme [ARCH][GATE]

All randomness in G1B is **data generation and the permutation/bootstrap nulls only** — SSI's decisions are analytic and seed-free (§4.7). The scheme is a single master seed expanded by a deterministic splittable PRNG so the entire run is **bit-reproducible**.

- **Master seed (locked):** `SEED_MASTER = 0x5551B_0001` (hex; a fixed registered constant). Re-running with this seed must reproduce every number.
- **Deterministic stream derivation:** a `SplitMix64`-style deterministic generator derives independent sub-streams by hashing `(SEED_MASTER, stream-label)`. Locked stream labels and their order of consumption:
  1. `"holdout-partition"` — chooses the TRAIN/HELD-OUT family partition and the held-out context combinations **first** (the §5.2 no-peeking wall: the partition is fixed before any fitting data is drawn).
  2. `"users"` — for each user `u ∈ {0..N−1}`, a per-user sub-stream `hash(SEED_MASTER, "users", u)` samples `θ_u` (§2.3 correlated/context-conditioned prior) and that user's fossils.
  3. `"fitting-data"` — generates the TRAIN-split cases used to fit baselines (ii)–(v) (never held-out cells).
  4. `"evaluation"` — generates each user's evaluation cases `D_u` at the registered §5.3 rates (held-out families/contexts only enter here).
  5. `"permutation"` — drives the permutation test **only if** Monte-Carlo sampling is needed (§7.4); for `N = 12` the test is **exact** and this stream is unused except to record that it was not needed.
  6. `"bootstrap"` — drives the reported confidence-interval bootstrap (§7.5), reporting-only.
- **Ordering guarantee:** streams are consumed in the order above; the holdout partition is committed before fitting data exists, enforcing §5.2. Changing `SEED_MASTER` after seeing results is forbidden; a robustness sweep over additional seeds, **if reported**, is registered here as **secondary/descriptive only** and **cannot** change the gate verdict, which is fixed to `SEED_MASTER`.

### 7.4 The exact statistical test — paired permutation, one-sided, FWER-controlled [ARCH][GATE]

The G1B product gate (§9) requires SSI to **beat all five baselines** on the composite. The locked test is a **paired sign-flip permutation test** per baseline, combined across the five baselines with **deterministic multiple-comparison control**. No external stats library; no normal/t approximation.

**Per-baseline null and statistic.** For baseline `b`, the null `H0^{(b)}` is "no SSI advantage": the paired differences `{d_u^{(b)}}` are symmetric about ≤ 0. The **observed statistic** is the mean paired difference `D̄^{(b)}` (§7.1). Because the test is paired, the exchangeable permutation operation is **independent sign-flips** of each user's difference `d_u^{(b)} → s_u · d_u^{(b)}`, `s_u ∈ {+1,−1}` (the standard paired-permutation / randomization null: under H0 the sign of each user's difference is exchangeable).

**Exact enumeration (locked for N = 12).** Enumerate all `2^N` sign-vectors `s ∈ {−1,+1}^N`. For each, compute the permuted mean `D̄^{(b)}(s) = (1/N) Σ_u s_u d_u^{(b)}`. The **one-sided permutation p-value** (alternative: SSI > baseline) is

```
p^{(b)} = ( #{ s : D̄^{(b)}(s) ≥ D̄^{(b)}_observed } ) / 2^N
```

For `N = 12`, `2^N = 4096` — enumerated exactly and deterministically (no sampling). **Monte-Carlo fallback (locked, only if `2^N > 2^20`, i.e. `N > 20`, which does not occur at the registered N):** draw `B_perm = 100000` sign-vectors from the `"permutation"` stream and use the add-one-smoothed estimate `p^{(b)} = (1 + #{≥ obs}) / (1 + B_perm)`. At `N = 12` the exact branch is used.

**Two locked requirements per baseline (both must hold):**

1. **Margin requirement (effect size):** the observed mean paired advantage clears the **pre-registered margin**

   ```
   D̄^{(b)}_observed  ≥  δ_composite = 0.05         (absolute, on the [0,1] composite scale)
   ```

   `δ_composite = 0.05` is locked for **every** baseline. (Rationale: a 5-point composite gap is the smallest difference deemed practically meaningful for a pilot; it is fixed now, not fit to data.)
2. **Significance requirement:** the multiple-comparison-adjusted p-value (below) is `< 0.05`.

**Multiple-comparison handling across the five baselines (locked).** There are **five** one-sided comparisons (SSI vs each baseline i–v). Family-wise error is controlled by **Holm–Bonferroni step-down** on the five exact permutation p-values:

```
Sort the five p-values ascending:  p_(1) ≤ p_(2) ≤ … ≤ p_(5)  (baselines relabelled by rank).
Holm rejects p_(j) iff  p_(k) ≤ 0.05 / (5 − k + 1)  for all k ≤ j   (step-down).
```

H1's significance requirement is met **iff all five** null hypotheses are rejected by Holm at FWER `α = 0.05` (equivalently, the largest "must-pass" threshold: every `p_(k) ≤ 0.05/(6−k)`). Holm is chosen (over plain Bonferroni) as a deterministic, library-free, uniformly-more-powerful step-down that still controls FWER at 0.05 — appropriate because **all five** comparisons must pass, so any FWER-valid procedure that rejects all five suffices.

**Combined H1 decision (locked):** H1 (§1.1) is **confirmed** iff, for **every** baseline `b ∈ {i,ii,iii,iv,v}`, **both** the margin requirement (`D̄^{(b)} ≥ 0.05`) **and** the Holm-adjusted significance requirement (`< 0.05`) hold simultaneously. Failure on **any** baseline means H1 is not confirmed; the *identity* of the failing baseline routes the decision (§9) — failure specifically against **baseline (v)** triggers the Decision-#5 descope branch (§1.3, §9.2).

### 7.5 Deterministic bootstrap for reported confidence intervals (reporting-only) [ARCH]

For each baseline `b`, a **percentile bootstrap** over users gives a reported CI on `D̄^{(b)}` (and on each sub-metric mean): resample `N` users with replacement `B_boot = 10000` times from the `"bootstrap"` stream, recompute `D̄^{(b)}*`, and report the `[2.5%, 97.5%]` percentile interval. **This is descriptive only**: the gate verdict is the §7.4 permutation test + margin, never the bootstrap CI. The bootstrap is fixed here so the report cannot shop intervals post hoc.

### 7.6 Negative-control guard test H-NC (locked) [ARCH][GATE]

Independently of the composite (§1.4, §2.5), the registered negative-control cases (`worth_surfacing = 0` with a detected consequence) must be **abstained on by SSI** at a pre-registered rate: SSI's **specificity on negative controls** (per-user, averaged across users) must be `≥ 0.80` (equivalently a **false-positive interruption rate ≤ 0.20**, the §6.1 named guard, §5.7). This is a **necessary** condition checked at the decision rule (§9); SSI can win the composite yet still fail H-NC, in which case the run is **FAIL** (over-surfacing / clippy failure), not PASS.

---

## 8. G1B-MV — the model-validity sub-gate (factorization adequacy)

Per §5.3 and §9 Track 1B, SSI's **factored** posterior (§4.1) is a **hypothesis the build can be forced to abandon**, not an assumption. **G1B-MV** tests whether the factored independence assumption is adequate against the deliberately-correlated, context-conditioned generative truth (§2.3). It has two locked components and a pre-registered effect-size threshold for "interactions materially matter." All comparisons use the **same fossils** SSI consumes; all thresholds are fixed here.

### 8.1 Posterior-predictive checks (PPC) [ARCH][GATE]

For each user, draw **replicated fossil sets** from the **fitted factored posterior** (§4.1) and compare an **interaction-sensitive discrepancy statistic** between observed and replicated fossils:

- **Discrepancy statistic `T_assoc` (locked):** the summed absolute **pairwise association** (e.g. mean absolute Cramér's-V / normalized mutual information) across the registered correlated axis pairs of §2.3 (`A_grit×A_routing`, `A_artifact×A_expertise`, `A_interrupt×X_flow`). Because the factored model assumes independence, replicated fossils should show **lower** pairwise association than observed if coupling is real.
- **Posterior-predictive p-value (locked):** `p_PPC = Pr( T_assoc(replicated) ≥ T_assoc(observed) )` estimated from `B_ppc = 2000` replications drawn off the `"evaluation"`-independent PPC sub-stream (registered). The factored model is **PPC-adequate** iff `p_PPC ∈ [0.05, 0.95]` (an extreme `p_PPC < 0.05` means observed association is unreproducible by the factored model ⇒ misfit; the symmetric upper bound guards against degenerate over-dispersion). `p_PPC` is **reported per registered pair and pooled**; the gate uses the **pooled** value.

### 8.2 Model comparison: factored vs sparse-pairwise vs hierarchical [ARCH][GATE]

Fit **three** belief models to the **same** fossils and compare their **held-out fossil predictive accuracy** (no held-out *consequence* labels are touched — this is purely a model-of-the-fossils comparison, inside the §5.2 wall):

- **M-fac** — the §4.1 fully factored, context-conditioned product of per-axis Dirichlets (SSI's model).
- **M-pair** — adds **sparse pairwise coupling** on exactly the registered §2.3 pairs (a log-linear / coupled-Dirichlet term per registered pair; all other axes remain factored). This is the §5.3 "sparse-pairwise" alternative.
- **M-hier** — a **hierarchical** model with a population-level hyper-prior over axis distributions and per-user partial pooling (the §5.3 "hierarchical" alternative).

**Comparison metric (locked):** **expected held-out log predictive density per fossil**, `ELPD/obs`, estimated by leave-one-fossil-out (deterministic, seeded) within each user, pooled across users. For each alternative `m ∈ {pair, hier}` define the improvement over factored

```
ΔELPD_m   =  (ELPD/obs)_m  −  (ELPD/obs)_fac        (nats per fossil)
SE_m       =  registered paired standard error of ΔELPD_m across the pooled held-out fossils.
```

**Pre-registered effect-size threshold for "interactions materially matter" (locked):** interactions are deemed **material** iff the **best** alternative satisfies **both**

```
max( ΔELPD_pair , ΔELPD_hier )  ≥  τ_MV = 0.02  nats per fossil     (size)
                AND   ΔELPD_best / SE_best  ≥  4                      (reliability)
```

The **AND** prevents declaring materiality from a sizable-but-noisy or tiny-but-precise improvement. `τ_MV = 0.02` nats/obs and the `4·SE` reliability bar are fixed now.

### 8.3 G1B-MV verdict (locked) [GATE]

- **MV-ADEQUATE** iff the factored model is **PPC-adequate** (§8.1) **AND** interactions are **not material** (§8.2 threshold not met). SSI's factored KL/EIG/VoI claims stand as-is.
- **MV-FORCE-COUPLE** iff interactions **are material** (§8.2 met) **or** PPC is inadequate (`p_PPC < 0.05`). Per §5.3 the build is then **forced** to either (a) **add the sparse-pairwise coupling** to SSI's posterior and **re-run the entire §7 test** with the coupled model **before** any PASS may be claimed, **or** (b) **reduce its KL/EIG claims** accordingly (retract the closed-form factor-additive guarantees of §4.3/§4.6 for the coupled axes). Option (a) is the registered default; (b) is a fallback if coupling is intractable in the harness.
- **[ARCH] Integrity:** G1B-MV is run **regardless of the H1 outcome**. A composite win achieved with a **mis-specified** factored model does **not** earn PASS until the model is fixed (MV-FORCE-COUPLE re-runs §7) — SSI does not get to keep an advantage that rests on an invalid modelling assumption. This is the §2.6 promise made operational.

---

## 9. Decision rule — PASS / FAIL-descope(Decision #5) / FAIL-MV (locked)

The G1B verdict is a **deterministic function** of the locked tests above, fixed before any result exists. The branches are **mutually exclusive and evaluated in the locked order** below; the **first** matching branch is the verdict.

### 9.1 Inputs to the rule (all defined in §7–§8)

- `H1_pass` — every baseline `b` clears **both** the margin (`D̄^{(b)} ≥ δ_composite = 0.05`) **and** Holm-adjusted significance (`< 0.05`) (§7.4).
- `ablation_tie` — SSI fails to clear the margin **or** significance specifically against **baseline (v)**, the EIG/VoI-ablation (§3.5, §1.3) — i.e. `(D̄^{(v)} < 0.05) OR (Holm-adjusted p^{(v)} ≥ 0.05)`. This is the locked operational definition of "ties" from §1.3.
- `NC_pass` — SSI's negative-control specificity `≥ 0.80` / FP-interruption `≤ 0.20` (§7.6, H-NC).
- `MV` ∈ {`MV-ADEQUATE`, `MV-FORCE-COUPLE`} (§8.3). When `MV-FORCE-COUPLE` fires, **the §7 test is re-run on the coupled model first**, and `H1_pass`, `ablation_tie`, `NC_pass` are read from that **re-run** (option (a)); if option (b) is taken, the reduced-claim model is tested instead.

### 9.2 The decision branches (evaluated top-down; first match wins) [GATE]

1. **FAIL-MV** — *if* `MV-FORCE-COUPLE` fires **and** the forced remedy is **not** applied (neither coupling re-run nor claim reduction completed), the verdict is **FAIL-MV**: the factored independence assumption is rejected by G1B-MV and SSI's KL/EIG claims are invalid as stated. **Investment rule (§9 Track 1B):** freeze Phase-2+ Route-1 work; SSI must add coupling or reduce claims and re-enter G1B. *(If the remedy **is** applied, evaluation proceeds with the remedied model through the branches below — MV-FORCE-COUPLE with a completed remedy is not itself a terminal FAIL.)*

2. **FAIL-descope (Decision #5)** — *else if* `ablation_tie` is true (SSI does **not** beat baseline (v) by the registered margin at significance): the **EIG/VoI machinery is NOT load-bearing.** This is the **accepted falsification H0-ablation** (§1.3), recorded as a **successful, honest** G1B outcome. **Action (Decision #5, §9 Track 1B fail-rule):** **descope** — ship the **user-aware heuristic Route-1** (baseline iii) **or Route-2-only**, **retract the "computed belief shift" claim**, and **freeze** EIG/VoI-dependent Phase-2+ work. *(This branch is checked before the generic H1 fail so that an ablation tie is always routed to descope, even if SSI also happened to beat some other baselines.)*

3. **FAIL (general)** — *else if* `H1_pass` is false for some reason **other** than the ablation tie (SSI fails to beat one of baselines i–iv by the margin/significance), **or** `NC_pass` is false (SSI over-surfaces on negative controls, clippy failure): the verdict is **FAIL**. **Investment rule:** freeze Phase-2+ Route-1-specific work until a redesigned salience model passes the strong-baseline test (§9 Track 1B). A failure against **baseline (iii)** specifically weakens the "has a user model isn't the differentiator" story; a failure against **baselines i/ii** means SSI is not even beating trivial initiators and the spike has found a deeper problem.

4. **PASS** — *else* (reached only if `MV` is adequate-or-remedied, `ablation_tie` is false, `H1_pass` is true for **all five** baselines, **and** `NC_pass` holds): the verdict is **PASS [GATE]**. SSI **beats all five baselines** on the locked composite by `δ_composite = 0.05` at Holm-FWER `< 0.05`, **negative controls abstain**, **and** G1B-MV validates (or the coupled remedy was applied and still passes). Per §9 Track 1B this clears the **pilot-grade** G1B gate so Phases 4–6 Route-1 work may proceed. **PASS is explicitly pilot-grade synthetic evidence only** (§1.5, §6.6): it does **not** establish the human claim, which remains **G5 (N ≥ 24)**.

### 9.3 Summary verdict table [GATE]

| Order | Condition (first match wins) | Verdict | Action |
|---|---|---|---|
| 1 | `MV-FORCE-COUPLE` fired **and** remedy not applied | **FAIL-MV** | Add coupling / reduce KL-EIG claims; re-enter G1B; freeze Phase-2+ Route-1 |
| 2 | `ablation_tie` (SSI ⊀ baseline v by margin@sig) | **FAIL-descope (Decision #5)** | EIG/VoI not load-bearing → ship heuristic Route-1 or Route-2-only; retract belief-shift claim; freeze EIG/VoI work |
| 3 | `H1_pass` false on baselines i–iv, **or** `NC_pass` false | **FAIL** | Freeze Phase-2+ Route-1; redesign salience model; re-enter G1B |
| 4 | `MV` ok **and** not ablation-tie **and** all 5 beaten @ margin&sig **and** `NC_pass` | **PASS** (pilot-grade) | Clear G1B; Phases 4–6 Route-1 may proceed; human claim still owed at G5 |

### 9.4 Lock statement [GATE]

Every parameter, threshold, margin, weight, N, seed, and test specified in §1–§9 is **fixed at this pre-registration and may not be changed after any result exists.** Specifically locked: axis/context/oracle structure (§2), the five baselines (§3), SSI's constants `α_base = 1.0`, `θ_surprise`, `κ`, `B = 3`, signatures, `IR*` (§4), the holdout partition and rates (§5), the composite weights `(w_AQ, w_VoI, w_US) = (0.40, 0.40, 0.20)` and all metric estimators (§6), `N = 12` (floor 8), `SEED_MASTER = 0x5551B_0001`, the exact paired sign-flip permutation test with Holm FWER `α = 0.05`, the margin `δ_composite = 0.05`, the H-NC specificity bar `≥ 0.80` (§7), the G1B-MV `τ_MV = 0.02` nats/obs and `4·SE` reliability bar (§8), and the ordered decision branches (§9). Any deviation observed during execution invalidates the run under that seed; it does not license post-hoc re-tuning. The companion file `HARNESS-SPEC.md` (implementation blueprint, **no code this phase**) must implement these and only these. **No experiment is run and no results are produced in this phase.**
