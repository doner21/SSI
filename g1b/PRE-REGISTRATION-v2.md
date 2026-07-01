# G1B Falsifier — PRE-REGISTRATION v2 (RE-PRE-REGISTRATION LOCK)

**Track:** SSI DAW — Track 1B salience-discrimination spike (Wizard-of-Oz, NO DSP engine).
**Phase:** RE-PRE-REGISTRATION LOCK (attempt 2). This document is written **before any v2 result exists**. No experiment is run, no code is shipped, no numbers are reported in this document. This is the **ONE** authorized disciplined redesign (DECISION-BRIEF-D5 **Option B**) after G1B-v1 fired its falsifier.
**Status of attempt 1:** v1 is the **permanent, locked record of attempt 1** and is **not modified by this document**. v1 verdict was **FAIL-MV + SSI lost 4/5 baselines** (incl. its own EIG/VoI-ablation); cross-lab witness confirmed **GENUINE-FALSIFICATION (conf 0.95)**. v2 is a *fresh* pre-registration with its own seed and its own lock; it does **not** retune v1.

**Source of truth (carried verbatim from v1 unless a change below is mandated):**
- `C:/Users/doner/ssi/g1b/PRE-REGISTRATION.md` — the v1 locked design (its §1–§9 generative model, oracle, 5 baselines, metrics, stats are reused **verbatim** here unless an explicit v2 change overrides them).
- `C:/Users/doner/ssi/g1b/artifacts/ROOT-CAUSE-V4PRO.md` — the cross-lab diagnosis of *why* v1 failed (the three structural causes v2 must address fairly).
- `C:/Users/doner/ssi/g1b/DECISION-BRIEF-D5.md` — the authorized redesign scope (Option B).
- `C:/Users/doner/ssi/orchestration-artifacts/SSI-DAW-BUILD-PLAN.md` — §5.3, §5.6, §9 Track 1B, Open Decision #5 (the same plan provenance as v1).

**Permitted v2 changes (exactly four, enumerated in full in the appended "CHANGES FROM v1" section):**
1. **[v2 CHANGE (1)] COUPLING** — SSI's posterior changes from fully-factored to **minimal sparse-pairwise coupled** over the §2.3 registered correlated axis pairs; the **same** coupling is applied to **baseline (v), the EIG/VoI-ablation**, so the SSI−ablation delta isolates **only** EIG/VoI (this section: §3.0, §3.5, §4.1–§4.3, §4.6, §4.7, §8).
2. **[v2 CHANGE (2)] ALIGNED EVSI** — SSI's EVSI/VoI is aligned to measure value against the **same silent baseline the oracle uses for pivotality (the context-prior, not the consequence-conditioned posterior)**, without ever accessing oracle labels (this section: §4.5, §4.7).
3. **[v2 CHANGE (3)] CALIBRATION SYMMETRY** — SSI's `θ_surprise` and `κ` are calibrated **mechanically (non-post-hoc) on the TRAIN split only**, by the SAME TRAIN-only discipline baseline (iii) fits under; the held-out families/contexts wall on calibration is **ABSOLUTE** (this section: §4.3, §4.5, **§5.2 / §5.2.1**).
4. **[v2 CHANGE (4)] S6/AQ HANDLING** — S6-forced **mandatory-safety** surfacings are **excluded from the AQ/US/VoI composite** and scored in a **separate mandatory-safety bucket**, applied **IDENTICALLY** to every method with forced surfacings, so a mandated safety surfacing is never an abstention false-positive (this section: §4.4, **§6.1 / §6.1.1**).

> **This document (task-1) registers changes (1) and (2) only.** Changes (3) and (4) and the appended "CHANGES FROM v1" / "ANTI-RIGGING INVARIANTS" sections are added by subsequent edits. All other text is carried **verbatim** from v1.

**Claim labels used throughout:**
- **[ARCH]** — an architectural commitment of this plan (how the system is built / what is computed).
- **[PAPER]** — a claim whose ultimate evidentiary standard is a real-musician study (here: G5, N≥24); G1B provides only *pilot-grade synthetic* evidence for it.
- **[GATE]** — a binary, decision-forcing pass/fail criterion that this pre-registration locks.

**Integrity crux (non-negotiable, applies to every section):** The synthetic generative model and oracle defined here **must not rig the outcome in favour of SSI.** It must be structurally possible for SSI to *lose* — i.e. for a baseline (especially the user-aware heuristic linter or the EIG/VoI-ablation) to tie or beat SSI on the locked metrics. A model under which SSI cannot lose is a falsifier-defeating fraud and is explicitly out of bounds. See §1.3 and §3.6. **The four v2 changes are principled corrections of genuine mis-specifications/unfairness diagnosed in `ROOT-CAUSE-V4PRO.md`; none is SSI-favouring, and after each it remains structurally possible for SSI to lose** (the ablation and the user-aware linter can still tie or beat SSI — §3.6, and the appended ANTI-RIGGING INVARIANTS).

---

## 1. Hypotheses

### 1.1 Primary hypothesis H1 (the SSI salience claim) [GATE][PAPER]

> **H1.** On **context-conditioned held-out consequence FAMILIES** (consequence families × context combinations that were never used to add any rule or tune any threshold), SSI salience **beats ALL FIVE baselines** (§3) on the **pre-registered composite** of:
> 1. **abstention quality** (does it abstain exactly when the ground-truth oracle says the consequence is *not* worth surfacing, and surface when it is?),
> 2. **usefulness** (does a surfaced question target a consequence the oracle labels worth-surfacing?), and
> 3. **answer-changing VoI** (would the synthetic user's answer to the surfaced question *actually change the chosen IR* per the oracle?),
>
> by a **pre-registered margin** at **p < 0.05**, with **pre-registered unit of analysis, randomization, and N (pilot N ≥ 8)**, **AND** negative controls abstain, **AND** the model-validity sub-gate **G1B-MV** holds (the chosen **sparse-pairwise-coupled** model is adequate, or further coupling / claim-reduction is forced — §8). *[v2 CHANGE (1)]: "the chosen factorization is adequate, or coupling is forced" is replaced by "the chosen sparse-pairwise-coupled model is adequate, or further coupling/claim-reduction is forced", because v2 already adopts the coupling remedy as SSI's registered belief model.*

- **[ARCH]** The differentiator H1 isolates is *not* "has a user model." A user-aware heuristic linter (baseline iii) also has a coarse prior. Per §5.6 the honest, narrowed claim is: **SSI is differentiated by computing Expected Information Gain (EIG) and Value of Information (VoI) against a calibrated, context-conditioned posterior, and thereby (a) abstaining where a fixed threshold over-asks and (b) asking where a coarse rule under-asks — especially on consequences touching *correlated* axes or *context-conditioned* tolerances.**
- **[GATE]** H1 is the binary G1B product gate (§9 Track 1B). "Beats all five" means strictly beats each of the five baselines on the locked composite by the locked margin (margins, test, and multiple-comparison handling are locked in §7).
- **[PAPER]** H1's plan-lock evidentiary standard is **G5** (real engine, real fossils, N≥24, adequately powered). G1B is **pilot-grade synthetic** evidence only; passing G1B does not establish the human claim, it only clears the cheap synthetic falsifier so heavier build phases may proceed.

### 1.2 Direction and what would count as confirmation

H1 is **directional and one-sided per baseline**: for each of the five baselines, the registered prediction is `composite(SSI) − composite(baseline) ≥ margin` with the paired test rejecting the null of "no SSI advantage" (§7). Confirmation of H1 requires *all five* one-sided comparisons to clear the locked margin and significance threshold simultaneously (multiple-comparison handling locked in §7).

### 1.3 Explicit falsification hypothesis H0-ablation (the load-bearing test → Decision #5) [GATE]

> **H0-ablation (genuine falsifier).** If the **EIG/VoI-ablation baseline** (baseline v in §3 — the full **sparse-pairwise-coupled**, context-conditioned model **without** the EIG/VoI machinery) **ties or beats** SSI on the locked composite — i.e. SSI does **not** clear the pre-registered margin over the ablation — then the **EIG/VoI machinery is NOT load-bearing**. This is a **real, accepted falsification of the SSI-distinctive claim**, not a defeat to argue around. Per **Decision #5** it forces **descope**: ship the user-aware heuristic Route 1, or Route-2-only, and **retract the "computed belief shift" claim**.

- **[ARCH] [v2 CHANGE (1)]** Baseline (v) now uses the **identical sparse-pairwise-coupled posterior** as SSI (§4.1–§4.2), not the v1 factored posterior. The ablation therefore shares SSI's *entire* coupled belief machinery and differs **only** by removing EIG/VoI. This **tightens** the isolation: the SSI−ablation delta is now a pure EIG/VoI contrast on a common, MV-remedied belief model. The ablation imports **no** EIG/VoI symbols (clean isolation preserved — §3.5, and the harness assertion in `HARNESS-SPEC-v2.md`).
- **[ARCH]** "Ties" is given an explicit operational definition at pre-registration (§7): SSI fails to exceed the ablation by the registered margin at the registered significance level. A statistical non-rejection in favour of SSI over the ablation **is** the tie condition; it is not re-interpreted post hoc.
- **[GATE]** H0-ablation is the falsifier that makes G1B honest: the ablation shares SSI's entire posterior machinery and differs **only** by removing EIG/VoI. If removing EIG/VoI costs nothing on the locked composite, the expensive machinery buys nothing measurable, and the spike has done its job by telling us so **cheaply**.
- This hypothesis is *symmetric in dignity* with H1: a result that confirms H0-ablation is a **successful** G1B outcome (it prevents months of building on a non-load-bearing mechanism), recorded as **FAIL-descope(Decision #5)** in the decision rule (§9), not as a project failure.

### 1.4 Secondary / guard hypotheses [GATE]

- **H-NC (negative controls).** On registered negative-control cases (a detected consequence that the oracle labels *not* worth surfacing in that context — e.g. grit-user + aliasing in a lo-fi context), SSI **abstains**. Failure of H-NC is an independent fail condition (§9), because over-surfacing on negative controls is the clippy failure §5.7 is designed to prevent.
- **H-MV (model validity).** **[v2 CHANGE (1)]** The chosen model is now the **sparse-pairwise-coupled, context-conditioned** posterior (§4.1). H-MV asks whether *this coupled model* is adequate under posterior-predictive checks and the **coupled-vs-hierarchical-vs-factored** comparison, **or** whether the build is forced to add **richer** coupling / reduce its KL/EIG claims. H-MV is operationalized as the **G1B-MV** sub-gate (§8). *The coupled model must still be able to **fail** MV* (e.g. if PPC rejects it, or a hierarchical model is materially better) — see §8 and the appended ANTI-RIGGING INVARIANTS.

### 1.5 What is explicitly NOT claimed by G1B [PAPER]

- G1B does **not** claim real musicians experience Route 1 as discovery (that is **G5**, §9 Phase 5, N≥24).
- G1B does **not** validate θ_surprise against human data (θ_surprise is calibrated *mechanically on the TRAIN split only* in v2 per [v2 CHANGE (3)], never on held-out data; §5.8 still flags the human-anchored value as a [THIN] spot tuned at G5).
- G1B does **not** establish any DSP / engine claim (that is **G1A**, the concurrency spike). G1B runs **with NO DSP engine** (Wizard-of-Oz, mocked consequence detectors, synthetic fossil histories) per §9 Track 1B.

---

## 2. Synthetic ground-truth generative model

> **[v2 ANTI-RIGGING — §2 IS CARRIED VERBATIM FROM v1.]** The synthetic generative world, the latent axes, the context variables, the correlated-axis structure, the consequence→likelihood mapping, and the ground-truth oracle (`worth_surfacing`, `answer_changes_IR`) are **identical to v1**. No v2 change touches the generative truth or the oracle labels. SSI **never** accesses `θ_u` or any oracle label. The four v2 changes are confined to **how SSI reasons** (its posterior, its EVSI baseline, its TRAIN-split calibration) and to **how a mandatory-safety surfacing is scored** — never to the world being measured. This guarantees the v2 redesign is not rigging the world toward SSI.

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
2. **Context-conditioning of the prior.** The marginal over an axis depends on context for the registered axis×context couplings above (e.g. `P(A_interrupt | X_flow=focused)` shifts toward `low`). This is fixed numerically at pre-registration (the concrete coupling matrices/values are part of the locked spec carried into §4–§6 and the harness blueprint).
3. **Sample fossils.** Each user's **fossil record** is a set of past episodes; in each, an observable style signal is **sampled from `θ_u` conditioned on that episode's context**. Fossils are the *only* user-specific evidence any method (SSI or baseline) may consume. Fossil sampling has sampling noise so that fossils under-determine `θ_u` (a finite-evidence regime where Bayesian posteriors and point heuristics can genuinely diverge).

- **[ARCH] Integrity note:** the correlated/context-conditioned structure is included **specifically so the factored independence assumption can fail** (this is what G1B-MV in §8 tests). The model is therefore *adversarial to SSI's own factorization*, not tuned to flatter it.
- **[ARCH] [v2 reading, not a change to §2]** Each fossil episode emits an **observable style-signal vector** over the axes its context exercises (this is the existing "observable style signal sampled from `θ_u`" of point 3, read as a per-episode vector). This is the same fossil record v1 used; v2 merely *also reads the jointly-observed co-occurrences* of the §2.3 registered pairs from these same fossils to form the coupled posterior (§4.1). No new fossil data is generated and the generative model is unchanged.

### 2.4 Consequence → likelihood mapping [ARCH]

A generation episode statically detects **consequences** (mocked detectors; no DSP). Each consequence `C` belongs to a **consequence family** (e.g. `inharmonic-artifact`, `headroom-clip-risk`, `added-latency`, `brightness-shift`, `routing-idiom-change`). Per §5.6, "consequence→likelihood mapping is generic over style axes":

- Each consequence family carries a **registered likelihood signature**: a mapping from axis level to the likelihood it contributes, `L(C | axis-level, context)`. Example (§5.6): "introduces inharmonic artifact" → likelihood favouring higher `A_grit` / `A_artifact`.
- The mapping is **generic** (defined per family over axes), **not** per-named-consequence — so a held-out family that was never observed still has a well-defined likelihood via its signature. This is what allows a *context-conditioned posterior* to generalize where a profile-only linter cannot.
- The likelihood is **context-modulated**: `L(C | axis-level, x)` depends on `x` for families whose meaning changes by sub-domain/genre (e.g. aliasing in `lofi` vs `mastering`).
- **[ARCH] [v2 note]** The likelihood signature stays **per-axis and generic** (unchanged). [v2 CHANGE (1)] couples only the **belief/posterior**, not the likelihood: the consequence update is applied per-axis *inside* the coupled joint (§4.2), so held-out families retain a defined signature exactly as in v1.

### 2.5 Ground-truth oracle [ARCH]

For every (user `u`, context `x`, detected consequence `C`) the model defines **two latent ground-truth labels**, computed from `θ_u` and `x` (never from any method's output):

1. **`worth_surfacing(u, x, C) ∈ {0,1}`** — whether this consequence is genuinely worth raising as a question, defined by a registered oracle function of (a) the **belief mismatch** between what `C` implies about the user and the user's true tolerance in context `x`, and (b) whether `C` **materially changes affordances** (the S2 sense). Operationally: a consequence is worth surfacing iff, under the *true* `θ_u` and context `x`, the user would prefer to be asked rather than have the system silently choose — i.e. the consequence sits where the user's true tolerance is *uncertain or pivotal*, not where it is clearly tolerated or clearly forbidden.
2. **`answer_changes_IR(u, x, C) ∈ {0,1}`** — whether, if the user were asked about `C` and answered per their true `θ_u`, the **chosen IR would actually change** versus the silently-chosen IR. This is the ground-truth VoI label. **Operationally it is computed from a registered, deterministic IR-selection oracle: a fixed map from (constraint filter + convention ranking over the candidate IRs, given the user's true tolerance) to a chosen IR; the answer changes the IR iff the *context-prior default IR* (the IR chosen under the context-prior belief, absent any question) and the user-informed choice differ.** (Per §5.6 S4: "if both answers yield the same chosen IR under the constraint filter + convention ranking, EVSI = 0.")

- **[ARCH] [v2 CHANGE (2) alignment anchor]** The oracle's silent baseline for pivotality is the **context-prior default IR** — i.e. the IR the system would choose from the context-prior belief, *not* from a consequence-conditioned posterior. v1's diagnosis (`ROOT-CAUSE-V4PRO.md` §2 Constraint 3) found SSI's EVSI mis-aligned because SSI used the *consequence-conditioned* posterior as its silent baseline while the oracle uses the *context-prior*. [v2 CHANGE (2)] aligns SSI's EVSI silent baseline to this same **context-prior** anchor (§4.5). This is a faithful reading of the v1 oracle (made explicit here), **not** a change to the oracle's labels: `answer_changes_IR` retains its v1 definition.
- **[ARCH]** The two labels are **distinct and can disagree**: a consequence can be worth surfacing for affordance reasons yet not change the IR (and vice versa). The composite metric (defined in §6) rewards a method only when its surfacing decisions align with *both* labels appropriately, so a method cannot win by tracking only one.
- **[ARCH] Negative-control cases** are exactly those where `worth_surfacing = 0` despite a consequence being *detected* (e.g. grit-user + aliasing in lofi). These are sampled into the evaluation set at a registered rate (§5) so abstention quality is actually testable.

### 2.6 Why this model can let SSI lose (integrity) [ARCH]

The model is built to make an SSI *loss* possible and meaningful:
- **Correlated / context-conditioned truth (§2.3)** means SSI's posterior can still be *mis-specified*; **[v2 CHANGE (1)]** SSI now adopts sparse-pairwise coupling on the registered pairs, but G1B-MV (§8) **still tests the coupled model** — if even the coupled model is inadequate (PPC rejects it) or a hierarchical model is materially better, MV forces a *further* remedy or claim reduction. SSI does not get a pass on its own modelling assumption.
- **The EIG/VoI-ablation (baseline v)** shares SSI's *entire* (now coupled) posterior and removes *only* EIG/VoI. If the coupled posterior alone (thresholded) already tracks both oracle labels, SSI cannot beat the ablation and H0-ablation fires (§1.3). Nothing in the oracle privileges EIG/VoI over a good threshold rule.
- **The oracle labels are defined from `θ_u` and `x` alone**, with no term that references SSI's internal scores. There is no path by which "being SSI" raises a method's score except via better-aligned surfacing decisions. **[v2 CHANGE (2)] does not change this:** the context-prior SSI uses for its aligned EVSI silent baseline is SSI's *own* prior belief (computable from `α^0` and counts), not an oracle label.

---

## 3. The five baselines (the ladder)

Per §5.6 the falsifier is a **baseline ladder**. Each method below is scored by the **identical** metrics (§6) on the **identical** held-out evaluation set (§5). Detection (the arithmetic, linter-like consequence detector) is shared by all; what differs is **which detections become questions** (§5.6: "Detection is separated from initiation"). All five are **strong, not strawman** — the test must be hard for SSI.

### 3.0 The method under test — SSI [ARCH]
SSI = the §5.3 **sparse-pairwise-coupled**, context-conditioned posterior **[v2 CHANGE (1)]** **plus** the §5.6 S1–S6 salience math (Bayesian surprise S1; affordance S2; relevance S3; **EIG/VoI** S4/S5 with the **aligned EVSI** silent baseline **[v2 CHANGE (2)]**; safety/constraint override S6), surfacing highest-EIG-first under a hard turn budget and **abstaining where EVSI = 0**. (Exact SSI formulas are locked in §4.) SSI is *not* one of the five baselines; it is the claimant H1 must defend.

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
- **[ARCH] Strong form (explicitly NOT a strawman):** its features and thresholds are fit on the **training** split (including the same fossils SSI sees) to the *best achievable* heuristic, and it is allowed coarse context features. It is denied only the **calibrated posterior + EIG/VoI** machinery. The held-out design (§5) — consequence *families* × *context combinations* — is precisely where a profile-only/coarse-context heuristic is predicted to break and a context-conditioned posterior is predicted to generalize. **If it ties SSI, that too is informative** (it weakens the distinctive claim toward Decision #5 territory, though the load-bearing falsifier is specifically baseline v). *[v2 note: under [v2 CHANGE (3)] SSI receives the **same** TRAIN-split calibration discipline this baseline already enjoys — fairness symmetry, registered in §5.2 by task-2 — so a baseline-(iii) win remains fully possible.]*

### 3.4 Baseline (iv) — Leave-one-consequence-out classifier on fossils [GATE]
- **Definition:** a discriminative classifier trained to predict `worth_surfacing` from fossil-derived features, evaluated **leave-one-consequence-(family)-out** so it must generalize to a held-out family from the others.
- **Role:** the "just train a model on the fossils" competitor — tests whether plain supervised generalization from fossils already matches SSI without any explicit posterior/VoI structure.
- **[ARCH]** Strong form: it is trained on the **same** fossil evidence SSI consumes, with a fair feature set, and evaluated under honest LOO so it cannot memorize the held-out family. It is a genuine ML competitor, not a degenerate one.

### 3.5 Baseline (v) — Coupled model WITHOUT EIG/VoI (the ablation) [GATE]
- **Definition:** **[v2 CHANGE (1)]** the **full §4.1 sparse-pairwise-coupled, context-conditioned posterior** — *identical* to SSI's belief model — but initiation is decided by a **threshold on the (coupled) posterior / Bayesian surprise alone**, with the **EIG/VoI machinery removed** (no EVSI gate, no EIG ranking, no "EVSI = 0 ⇒ abstain").
- **Role:** **the load-bearing falsifier.** This baseline differs from SSI **only** by the presence/absence of EIG/VoI. Per §1.3 and Decision #5: **if this ties or beats SSI, the EIG/VoI machinery is not load-bearing → descope.**
- **[ARCH]** Strong form: it gets SSI's *entire* coupled posterior advantage for free; its surprise threshold is tuned on the **training** split to its best. The *only* thing it lacks is the mechanism whose value G1B exists to measure. This is the cleanest possible isolation of the EIG/VoI contribution.
- **[ARCH] [v2 CHANGE (1)] clean-isolation requirement (locked):** baseline (v) consumes the **same coupled posterior functions** as SSI (the §4.1 coupling lives in the shared belief module) but **imports no EVSI/EIG symbol** from SSI's salience module. The harness (`HARNESS-SPEC-v2.md`) must **assert** this import-cleanliness so the SSI−ablation delta isolates **only** EIG/VoI and never leaks a shared SSI-only code path. With the coupling now shared, the v2 ablation delta is a *pure* EIG/VoI contrast on the MV-remedied model.

### 3.6 Ladder integrity summary [ARCH]
- All five baselines are tuned/fit on the **training** split only; none sees the held-out families/contexts during fitting (no rule added on holdouts — §5.6). **[v2 CHANGE (3)]** SSI's `θ_surprise`/`κ` are *also* calibrated on the TRAIN split only (registered in §5.2 by task-2) — fairness symmetry, never touching held-out.
- Baselines iii, iv, v are **deliberately strong** (best heuristic, fair ML, full coupled posterior) so that an SSI win is meaningful and an SSI loss is possible.
- The decisive isolation is **SSI vs baseline (v)**: same coupled posterior, EIG/VoI the only difference. The decisive "is it just a user model?" check is **SSI vs baseline (iii)**. H1 requires beating **all five** simultaneously by the locked margin (§7).
- **[v2 ANTI-RIGGING]** It remains structurally possible for SSI to LOSE: baseline (v) (now equally coupled) can still tie/beat SSI if EIG/VoI is non-load-bearing, and baseline (iii) (now on equal calibration footing) can still tie/beat SSI. None of the four v2 changes removes a path to SSI losing.

---

## 4. SSI salience — exact formulas

This section locks the **closed-form mathematics** SSI computes. It targets **TypeScript (Node 24)** closed-form arithmetic (no external probabilistic library; no sampling for SSI's own decisions — all SSI quantities below are analytic). **No implementation code appears in this phase**; these are the equations the harness (`HARNESS-SPEC-v2.md`) will implement *exactly*. All logarithms are natural (base *e*); information quantities are in **nats**. Notation: an axis `a ∈ A` (the §2.1 axis set) has levels `k ∈ {1..K_a}` (here `K_a = 3` for every locked axis).

### 4.0 [v2 CHANGE (1)] Coupling structure — the minimal sparse-pairwise graph [ARCH]

The registered correlated structure of §2.3 induces exactly three couplings:
`A_grit × A_routing`, `A_artifact × A_expertise` (axis×axis), and `A_interrupt × X_flow` (axis×context).
Because `X_flow` is an **observed** context variable, the `A_interrupt × X_flow` coupling is realized as a **flow-extended conditioning key** on `A_interrupt` (a node potential indexed by flow), not a latent edge. The remaining latent coupling graph is therefore **two disjoint edges over latent axes**:

```
Component P1 = { A_grit , A_routing }          (edge: A_grit — A_routing)
Component P2 = { A_artifact , A_expertise }     (edge: A_artifact — A_expertise)
Singletons   = { A_bright } , { A_interrupt }   (A_interrupt conditioned on flow-extended key)
```

- **[ARCH]** This is the **minimal** coupling: exactly the §2.3 registered pairs, nothing more (`A_bright` and all non-registered pairs stay independent). The graph is a **forest of disjoint components**, so the joint posterior factorizes over components and every normalizer is computable in closed form by enumerating a component's ≤ `K_a·K_b = 9` joint cells. **The v1 fully-factored model is the exact special case** obtained when the coupling strength `λ_couple → 0` (§4.1), so coupling is a strict, principled generalization, not a different world.
- **[GATE]** The set of coupled components `{P1, P2}`, the flow-extended key for `A_interrupt`, and the fact that all other axes remain factored are **registered and fixed** at this pre-registration. No coupling may be added or removed after a result exists.

### 4.1 Sparse-pairwise-coupled, context-conditioned posterior from fossil counts [ARCH]

**[v2 CHANGE (1)]** Per §5.3, the user model is a **product over connected components** (§4.0): each **registered pair** is a **joint Dirichlet** over its `K_a·K_b` cells, and each **uncoupled axis** is the v1 per-axis Dirichlet. For user `u` in context bucket `c` (see §4.7):

**(a) Uncoupled axes** (`A_bright`, and `A_interrupt` on its flow-extended key `c⁺`) — **identical to v1**:

```
P(axis a = k | context c)  =  α_{a,c,k} / Σ_j α_{a,c,j}
where  α_{a,c,k} = α^0_{a,c,k} + n_{a,c,k}        (Dirichlet posterior parameters)
```

with the locked weakly-informative prior `α^0_{a,c,k} = α_base = 1.0` (uniform), except the registered context-conditioned skews of §2.3; `n_{a,c,k}` = fossil counts. `A_interrupt` uses the **flow-extended key** `c⁺ = (X_subdomain, X_genre, X_flow)` so the `A_interrupt × X_flow` coupling is captured exactly.

**(b) Registered pairs** `p = (a,b) ∈ {P1, P2}` — a **joint Dirichlet** over the `K_a·K_b = 9` joint cells:

```
P(a = j , b = l | context c)  =  β_{p,c,(j,l)} / Σ_{(j',l')} β_{p,c,(j',l')}
where  β_{p,c,(j,l)} = β^0_{p,c,(j,l)} + m_{p,c,(j,l)}        (joint Dirichlet posterior parameters)
```

- **Joint co-counts** `m_{p,c,(j,l)}` = number of fossil episodes for user `u` in bucket `c` whose observed style-signal vector (§2.3) has axis `a` at level `j` **and** axis `b` at level `l` **jointly** in the same episode. (Same fossils v1 consumed, read for co-occurrence; §2.3 [v2 reading].)
- **Registered pairwise prior (locked form):** a weakly-informative joint prior that **encodes the §2.3 registered sign of association** via a single registered coupling strength `λ_couple`:

  ```
  β^0_{p,c,(j,l)} = b_base + λ_couple · 𝟙[(j,l) ∈ Concord_p]
  with   b_base = 1.0   (uniform pseudo-count per joint cell)
         λ_couple = 2.0  (registered concordance strength, fixed at pre-registration)
         Concord_p = the registered set of concordant (j,l) cells expressing §2.3's fixed sign
                     (e.g. for P1: gritty↔{serial, send-return}; for P2: expert↔tolerant, etc.)
  ```

  **At `λ_couple = 0` the joint prior is exchangeable and its marginals are uniform — recovering the v1 factored prior exactly.** With `λ_couple = 2.0` the prior leans toward the registered concordant cells; the concrete `Concord_p` cell lists (the registered sign pattern from §2.3) are part of the locked spec carried into the harness.

**(c) Joint over the full axis vector** (the coupled "Intent" posterior) is the **product over components**:

```
P(Intent = (k_a)_{a∈A} | context c)
   =  P(A_grit = k_grit , A_routing = k_routing | c)            (component P1, joint)
    · P(A_artifact = k_art , A_expertise = k_exp | c)           (component P2, joint)
    · P(A_interrupt = k_int | c⁺)                               (singleton, flow-extended)
    · P(A_bright = k_bri | c)                                   (singleton)
```

- **[ARCH]** This replaces v1 §4.1's full product of per-axis posteriors with a **product over the §4.0 components**. It is the **MV-FORCE-COUPLE remedy** (v1 §8.3, fired in attempt 1) adopted as SSI's registered belief model. The "rules/weights" survive *only* as `(α^0, β^0)` and the counts `(n, m)` (§5.3: "rules survive only as sufficient statistics").
- **[GATE]** The **same** coupled posterior (a)–(c) is the belief model for **both SSI and baseline (v)** (§3.5), so the SSI−ablation delta isolates **only** EIG/VoI. G1B-MV (§8) still tests this coupled model's adequacy against hierarchical and (factored-as-ablation) alternatives; the coupled model **can still fail MV**.

### 4.2 Consequence likelihood and the consequence-conditioned posterior [ARCH]

A detected consequence `C` carries the **registered generic per-axis likelihood signature** `L(C | axis a = k, x)` of §2.4 (unchanged by v2). SSI forms the **consequence-conditioned posterior** by a Bayesian update applied **per-axis inside each component**:

**(a) Uncoupled axis** — identical to v1:

```
P(a = k | C, context c)  =  L(C | a=k, x) · P(a = k | context c)  /  Z_{a,c}
where  Z_{a,c} = Σ_j  L(C | a=j, x) · P(a = j | context c)
```

**(b) Registered pair** `p=(a,b)` — the per-axis likelihoods multiply into the **joint cell** (the consequence touches each axis through its own generic signature; the coupling lives in the prior/posterior, not the likelihood):

```
P(a=j , b=l | C, context c)
   =  L(C | a=j, x) · L(C | b=l, x) · P(a=j , b=l | context c)  /  Z_{p,c}
where  Z_{p,c} = Σ_{(j',l')}  L(C | a=j', x) · L(C | b=l', x) · P(a=j' , b=l' | context c)
```

Only components an axis-touching signature actually reaches are updated; components untouched by `C` have `P(·|C,context) = P(·|context)` and contribute zero to the surprise below.

- **[ARCH]** Because the likelihood stays **per-axis and generic** (§2.4), a **held-out family** still has a defined signature and the coupled update remains well-defined — the v1 generalization argument is preserved. The only change is that, for a coupled pair, the update normalizes over the **joint** 9-cell distribution rather than two independent 3-cell marginals, so an update on one axis correctly **propagates to its coupled partner** through the joint posterior.

### 4.3 S1 — Bayesian surprise (closed-form KL, component-additive) [ARCH][GATE]

Per §5.6 S1: a consequence is *surprising* iff observing it shifts the context-conditioned belief by more than `θ_surprise`:

```
S1(C, c)  =  KL( P(Intent | C, context c) ‖ P(Intent | context c) )
          =  Σ_{g ∈ Components}  KL( P(g | C, c) ‖ P(g | c) )            [v2 CHANGE (1)]: additive over COMPONENTS, not single axes
```

where the **components** are `{P1, P2, {A_interrupt}, {A_bright}}` (§4.0), and each component KL is a finite sum over that component's cells:

```
KL( P(g|C,c) ‖ P(g|c) )  =  Σ_{cells ω of g}  P(ω | C, c) · ln[ P(ω | C, c) / P(ω | c) ]
```

(for a pair `g=p`, `ω = (j,l)` ranges over `K_a·K_b = 9` joint cells; for a singleton, over `K_a = 3` levels).

- **[ARCH]** The factor-additivity of KL holds for a **product over components** (the coupled joint is a product over the disjoint components of §4.0), so S1 remains **exact and closed-form** — this is *why* §4.0 chose a forest of disjoint components. **At `λ_couple = 0` and empty co-counts, each pair KL decomposes back into two per-axis KLs and S1 reduces to the v1 sum over axes.**
- **S1 gate ([v2 CHANGE (3)] — `θ_surprise` calibrated mechanically on the TRAIN split only; §5.2.1):** `C` passes the surprise screen iff `S1(C, c) > θ_surprise`. In v2, `θ_surprise = θ*_surprise` is **not** hand-fixed: it is selected by the §5.2.1 **TRAIN-split argmax** over the registered grid `G_θ` (deterministic, conservative tie-break **toward silence** per §5.7), using the SAME TRAIN cases baseline (iii)/(v) fit on and **never** touching held-out families/contexts. The selected constant is then carried into the harness. *(This replaces v1's blind-fixed `θ_surprise`; see §5.2.1 / [v2 CHANGE (3)].)*
- **[ARCH]** S1 is a *screen*, not the surfacing decision. A large belief shift that does not change the chosen IR (S4 below) is still suppressed — this is the abstention SSI claims over a surprise-threshold rule (and is exactly what baseline v keeps vs SSI removes).

### 4.4 S2 affordance / S3 relevance / S6 safety (bounded, registered) [ARCH]

> *[v2 note: §4.4 retains v1's S6 **override mechanism** verbatim. [v2 CHANGE (4)] adds only how S6-forced surfacings are **scored** — see the S6 bullet below and §6.1.1. The override rule itself (always surface a safety/constraint violation, first) is unchanged.]*

Per §5.6, S2 (affordance materiality) and S3 (relevance) are **honestly LLM-qualitative and [THIN]**; in the **synthetic** G1B they are *not* free parameters. They are bound to the oracle structure so SSI gets no hidden tuning knob:

- **S2 (affordance materiality):** operationalized in G1B as a **registered deterministic predicate** `affordsChange(C, x)` derived from the same §2.4 family signature (a consequence "materially changes affordances" iff its signature has non-flat `L` on an axis the IR-selection oracle of §2.5 actually reads). No learned/tunable S2 in G1B.
- **S3 (relevance):** **not modelled as a tunable score** in G1B (it would be an unconstrained knob). Per §5.6 S3 is *bounded by S1/S4*; in G1B it is treated as the identity gate (relevance ≡ "passed S1 and has positive VoI"), so SSI cannot win via an opaque relevance term. This is recorded as a **registered simplification** (honest limitation, §6.6).
- **S6 (safety/constraint override):** registered hard rule — any consequence flagged by the §2.4 signature as a **constraint/safety violation** (e.g. zero-delay feedback class) is **always surfaced**, bypassing S1/S4. S6 is evaluated **first** (per §9 build order). In G1B, safety-class consequences are a registered, small fraction of the evaluation set so S6 behaviour is observable but does not dominate the composite.
- **[v2 CHANGE (4)] S6/AQ scoring (locked):** because S6 surfacing is **mandatory** (not a discretionary salience decision), every safety-class case is **excluded from the AQ/US/VoI composite** and scored in a **separate mandatory-safety compliance bucket `MS`** (§6.1.1). This exclusion is applied **IDENTICALLY to every method** (the safety-class case set is oracle-defined and method-independent), so a method that obeys the S6 rule is **never** charged an abstention false-positive for a mandated surfacing. `MS` is **reported** per method and is **not** folded into the gated composite (§6.4 weights unchanged) and **not** a new §9 branch (decision rule unchanged).

### 4.5 S4 — Value of Information / EVSI gate, ALIGNED to the oracle's pivotality baseline (the load-bearing mechanism) [ARCH][GATE]

**[v2 CHANGE (2)]** Per §5.6 S4: **EVSI(C) > cost-of-interruption**, and the decisive rule "**if both answers yield the same chosen IR under the constraint filter + convention ranking, EVSI = 0 → no question.**" v1's EVSI used the *consequence-conditioned* posterior to choose the silent IR; the oracle's `answer_changes_IR` (§2.5) uses the **context-prior default IR**. `ROOT-CAUSE-V4PRO.md` §2 (Constraint 3) showed this mismatch made SSI abstain on genuinely pivotal cases (false negatives) whenever the consequence update was already definitive. **v2 aligns SSI's EVSI silent baseline to the same context-prior anchor the oracle uses**, without ever accessing oracle labels.

Let `q(C)` be the **question** SSI would ask about `C` (a query over the axis/axes `C`'s signature touches). The user's answer `r` takes values in the axis levels with **predictive probability** equal to SSI's current **coupled** posterior `P(answer = r | C, context c)` (SSI's best calibrated guess at how the user will answer — unchanged; SSI keeps its own calibrated belief for *predicting answers*). Let `IR*(·)` be the **registered IR-selection oracle** (§2.5): a deterministic map from (effective tolerance over candidate IRs, given a belief state) to a chosen IR under the constraint filter + convention ranking.

**The aligned silent baseline (the one v2 change):**

```
t_prior(c)               =  tolerance implied by the CONTEXT-PRIOR  P(axis | context c)      [v2 CHANGE (2)]
                            (the belief BEFORE the consequence update and BEFORE any answer)
IR_silent_aligned(C, c)  =  IR*( t_prior(c) )      ← uses the context-PRIOR, NOT the cc-posterior
IR_answered(C, c, r)     =  IR*( tolerance implied by answer r )     (unchanged from v1)
```

**The aligned EVSI:**

```
EVSI_aligned(C, c)  =  Σ_r  P(answer = r | C, c) · Value( IR_answered(C,c,r) )
                          −  Value( IR_silent_aligned(C, c) )                        [v2 CHANGE (2)]
```

where `Value(IR)` is the registered task-value of choosing `IR` measured under SSI's current posterior (unchanged from v1). **The decisive simplification, now aligned to the oracle's context-prior pivotality (locked):**

```
If  IR_answered(C, c, r) == IR_silent_aligned(C, c)  for every answer r with P(answer=r|C,c) > 0,
then EVSI_aligned(C, c) = 0     (the answer cannot move the chosen IR off the context-prior default ⇒ no question).
```

- **VoI/EVSI gate:** `C` is **VoI-eligible** iff `EVSI_aligned(C, c) > κ`, where `κ ≥ 0` is the **registered cost-of-interruption** constant carried into the harness (`κ = 0` admits any strictly answer-changing question, `κ > 0` demands a minimum value). `EVSI_aligned = 0` ⇒ **abstain**, unconditionally. *([v2 CHANGE (3)]: in v2 `κ = κ*` is **not** hand-fixed — it is selected jointly with `θ_surprise` by the §5.2.1 TRAIN-split argmax over the registered grid `G_κ`, never on held-out data.)*
- **[ARCH] Why this alignment is principled, not SSI-favouring:** the **silent default both the oracle and SSI compare against is now the context-prior IR**, so SSI's EVSI measures pivotality against the *same* reference the oracle uses to define `answer_changes_IR`. This removes the v1 false-negative mechanism (definitive-posterior cases erroneously scoring EVSI=0). It does **not** hand SSI the answer: SSI still predicts answers with its **own** posterior and never reads `θ_u` or any oracle label; the context-prior is SSI's own pre-consequence belief (computable from `α^0, β^0` and counts). It is equally possible for the aligned gate to make SSI surface a *non-pivotal* case (a new false-positive route), so the change can hurt as well as help — it is a fairness/spec correction, not a thumb on the scale.
- **[ARCH] Why this is the falsifier's fulcrum:** baseline v (§3.5) has the *same* coupled posterior and the *same* `IR*` oracle but **omits this EVSI computation**, initiating on the S1 surprise threshold alone. SSI's claimed edge is precisely the cases where **S1 is large but EVSI_aligned = 0** (surprising but non-pivotal vs the prior default ⇒ SSI abstains, baseline v over-asks) and where **S1 is modest but EVSI_aligned > κ** (unsurprising but pivotal vs the prior default ⇒ SSI asks, a surprise-threshold rule under-asks). If those cases are rare or the oracle does not reward them, **H0-ablation fires** (§1.3) — and nothing here prevents that.

### 4.6 S5 — EIG ranking and the turn budget (component-additive) [ARCH][GATE]

Per §5.6 S5: among the consequences that survive S1 ∧ S4 (∪ forced S6), **surface highest Expected Information Gain first, hard-stop at the turn budget.** EIG of asking `q(C)` is the expected reduction in posterior entropy over the touched components:

```
EIG(C, c)  =  H( P(Intent | context c) )  −  E_r[ H( P(Intent | answer r, C, context c) ) ]
           =  Σ_{g ∈ Components} [ H(P(g|c))  −  Σ_r P(answer=r|C,c) · H(P(g | answer r, c)) ]   [v2 CHANGE (1)]: additive over COMPONENTS
where  H(P) = − Σ_{cells ω} P(ω) · ln P(ω)         (Shannon entropy, nats; closed-form per component)
```

Entropy is computed **per component** (closed-form over a component's cells: 9 for a pair, 3 for a singleton) and summed — exact under the **product-over-components** model, mirroring §4.3. (For an answered axis fully revealed by its answer, the relevant component's inner `H` collapses on that axis; partial-information answers use the registered answer-likelihood; the coupled partner's entropy updates through the joint.)

- **Ranking & budget:** order all VoI-eligible (∪ S6-forced) consequences by **descending EIG**; surface the top ones up to the **hard turn budget B** (locked `B = 3` per §5.7's "≤ 3 questions per generation transaction"). S6-forced safety questions are surfaced **first** and count against `B`; ties in EIG are broken by a **registered deterministic key** (descending `EVSI_aligned`, then a fixed family ordinal) so the procedure is fully reproducible under a seed.
- **[ARCH]** EIG decides *order and which of the eligible survive the budget*; aligned EVSI (§4.5) decides *eligibility/abstention*. Both are removed in baseline v. **At `λ_couple = 0` the component EIG reduces to the v1 per-axis EIG sum.**

### 4.7 The SSI decision procedure (locked pipeline) [ARCH][GATE]

For each (user `u`, context `x`, detected consequence `C`), with context bucket `c = bucket(x)`:

1. **S6 first:** if `C` is safety/constraint-class → **surface** (forced), bypassing 2–4. (§4.4)
2. **S1 screen:** compute `S1(C,c)` (§4.3, component-additive). If `S1 ≤ θ_surprise` → **abstain** (not surprising enough). *(Forced S6 already exited at step 1.)*
3. **S4 aligned-EVSI gate:** compute `EVSI_aligned(C,c)` (§4.5). If `EVSI_aligned ≤ κ` (incl. the `EVSI_aligned = 0` same-IR-vs-context-prior case) → **abstain** (no answer-changing value relative to the context-prior default). **[v2 CHANGE (2)]**
4. **S5 rank + budget:** among all survivors (∪ forced S6) for this transaction, rank by `EIG` (§4.6, component-additive) and **surface the top ≤ B**; the rest **abstain** (budget exhaustion).

- **Abstention rule (locked):** SSI **abstains** on `C` iff `C` is *not* surfaced by the pipeline above — i.e. fails S1, or fails the aligned-EVSI gate, or is crowded out of the turn budget. **Negative controls (§2.5)** must abstain via step 2 or 3. H-NC (§1.4) tests exactly this.
- **`bucket(x)` (context-conditioning key):** the registered map from raw context `x` (§2.2) to the conditioning key. Locked form: `c = (X_subdomain, X_genre)` for the joint/likelihood conditioning of components `P1, P2, {A_bright}`, **and** the flow-extended key `c⁺ = (X_subdomain, X_genre, X_flow)` for the `{A_interrupt}` singleton (realizing the §2.3 `A_interrupt × X_flow` coupling — §4.0/§4.1). The bucket map is fixed at pre-registration; it is *not* re-chosen after results.
- **Determinism:** every SSI quantity above is analytic given (counts `n` and joint co-counts `m`, registered constants `α^0, β^0(λ_couple), θ_surprise, κ, B`, signatures, `IR*`). SSI uses **no randomness**; the only seeds in G1B drive *data generation* and the *permutation test* (§7), never SSI's decisions.

---

## 5. Held-out design (what is hidden, and the train/test discipline)

> *[v2 note: §5.1 and §5.3 are carried **verbatim** from v1. §5.2 is the home of [v2 CHANGE (3)] CALIBRATION SYMMETRY (TRAIN-split θ_surprise/κ calibration), registered by task-2; until then §5.2 reads as v1.]*

Per §5.6 the discrimination test is on **context-conditioned held-out consequence FAMILIES with no rule added**. This section locks **what is held out** and the **train/test wall**, so no method (SSI or baseline) can be tuned on the evaluation distribution.

### 5.1 The two-axis holdout: families × context combinations [ARCH][GATE]

The evaluation generalization demand is **two-dimensional** (matching §5.6 "consequence *families* × *context combinations*"):

- **Held-out consequence FAMILIES.** The §2.4 family set is partitioned into **TRAIN families** and **HELD-OUT families**. Every method may fit/tune only on TRAIN families; HELD-OUT families appear **only** at evaluation. Because likelihoods are **generic per family over axes** (§2.4), a held-out family still has a defined signature, so a *context-conditioned posterior* can score it without ever having seen it — whereas a rule/threshold fit to specific TRAIN families must generalize. Locked partition (registered): TRAIN families `{headroom-clip-risk, brightness-shift, routing-idiom-change}`; HELD-OUT families `{inharmonic-artifact, added-latency}` plus at least one **safety-class** held-out family for S6 observation. (The exact family↔axis signatures are part of the locked spec carried into the harness.)
- **Held-out CONTEXT combinations.** Independently, specific **(axis-profile × context) combinations** are held out — the canonical §5.6 case **grit-leaning user in a clean-mastering context** (`A_grit=gritty` × `X_subdomain=mastering, X_genre=clean-pop`), and its mirror **clean-leaning user in a lo-fi context**. These context combinations are **excluded from every method's fitting data** and appear only at test, so the **context-conditioned** advantage (or its absence) is what is measured. This is the §5.6 holdout where a profile-only or coarse-context heuristic (baseline iii) is predicted to break.

A test case is **fully held out** if it draws a HELD-OUT family **or** a held-out context combination (the evaluation set deliberately includes both single-held-out and doubly-held-out cells so the two generalization demands are separable in analysis).

### 5.2 Train/test discipline (the wall) [ARCH][GATE]

> *[v2 note: the v1 train/test **wall** is carried **verbatim** below. [v2 CHANGE (3)] CALIBRATION SYMMETRY — the mechanical TRAIN-split calibration of SSI's `θ_surprise`/`κ` — is registered in **§5.2.1** within this absolute wall. The wall itself is unchanged and the held-out families/contexts remain untouchable by any fitting or calibration step.]*

- **Fitting data (TRAIN split):** all baseline thresholds/features/classifiers (§3) **and** any quantity that could be tuned are fit **only** on TRAIN families and non-held-out context combinations. *(v1 fixed SSI's `θ_surprise`/`κ` blind; [v2 CHANGE (3)] instead calibrates them mechanically on the TRAIN split only — registered by task-2 — so SSI and the baselines share the same TRAIN-only fitting discipline. The held-out wall is unchanged and ABSOLUTE.)*
- **Fossils vs evaluation.** Every method consumes the **same** per-user fossils (§2.3) for belief/feature formation. Fossils are sampled from the user's `θ_u` but the **evaluation consequences/contexts** for held-out cells are generated from cells the fitting never touched. A method may use fossils freely; it may **not** use any held-out-cell label during fitting.
- **No-peeking guarantee (locked):** the harness must **construct the held-out partition before generating any fitting data**, fit all baselines (and run any SSI TRAIN-split calibration), and *then* reveal evaluation cells — enforced by the seeding scheme (§7, `HARNESS-SPEC-v2.md`). Any method (or calibration step) touching a held-out label pre-evaluation is a harness bug, not a result.
- **Leave-one-consequence-out (baseline iv):** baseline iv's LOO is **nested inside** this wall — it leaves out one family *among the TRAIN families* for its own internal generalization, and is then scored on the global HELD-OUT families like everyone else, so it gets no special access.

### 5.2.1 [v2 CHANGE (3)] CALIBRATION SYMMETRY — mechanical TRAIN-split tuning of SSI's `θ_surprise` and `κ` [ARCH][GATE]

**Why this change (principled correction, not SSI-favouring).** `ROOT-CAUSE-V4PRO.md` diagnosed a **fairness asymmetry** in v1: baseline (iii) (user-aware linter) and baseline (v) (ablation surprise threshold) were **fit on the TRAIN split** to their best, while SSI's `θ_surprise`/`κ` were **hand-fixed blind** — SSI competed with un-tuned operating points against tuned competitors. [v2 CHANGE (3)] removes the asymmetry by giving SSI the **same** TRAIN-only fitting discipline its competitors already enjoy. It does **not** loosen the held-out wall: calibration may **never** touch held-out families/contexts.

**What is calibrated.** Exactly two registered SSI constants: `θ_surprise` (the S1 surprise screen, §4.3) and `κ` (the aligned-EVSI cost-of-interruption, §4.5). **Nothing else** about SSI is fit — `α^0, β^0(λ_couple=2.0)`, the §4.0 component set, the signatures, `IR*`, and `B = 3` remain fixed at pre-registration exactly as in §4/§9.4.

**On what data (the same TRAIN data baseline (iii) fits).** Calibration consumes **only** the `"fitting-data"` stream (§7.3) — TRAIN families × non-held-out context combinations — the **identical** TRAIN cases baseline (iii)/(v) are fit on. The `"evaluation"` stream (held-out families/contexts) is **never** read during calibration.

**The exact calibration objective (locked).** Select `(θ*_surprise, κ*)` that **maximizes SSI's mean TRAIN composite**:

```
(θ*_surprise , κ*)  =  argmax_{(θ,κ) ∈ G_θ × G_κ}   (1/N) Σ_u  Composite^TRAIN_u( SSI[θ, κ] )
```

where `SSI[θ,κ]` is the §4.7 pipeline run with those two constants, and `Composite^TRAIN_u(·)` is the **§6.4 locked-weight composite** (`0.40·AQ + 0.20·US + 0.40·VoI`, the SAME weights as the gate — §7.1) evaluated over user `u`'s **TRAIN-split** cases only (the [v2 CHANGE (4)] S6/AQ exclusion of §6.1.1 applies here identically). The objective is the gate's own composite, so calibration optimizes the quantity the gate measures — with **no** access to the held-out distribution it will be judged on.

**The registered search grids (fixed before any data).**

```
G_θ = { 0.00, 0.02, 0.05, 0.10, 0.15, 0.20, 0.30, 0.50 }   (nats; S1 surprise threshold)
G_κ = { 0.00, 0.01, 0.02, 0.05, 0.10 }                       (value units; EVSI cost-of-interruption)
```

**Deterministic tie-break (locked).** Among `(θ,κ)` cells tied at the argmax TRAIN composite, pick the **most conservative** operating point — **largest `θ` first, then largest `κ`** — biasing toward **silence** per §5.7. The argmax over a finite registered grid on fixed TRAIN data is fully reproducible under `SEED_MASTER` (§7.3).

- **[ARCH] Mechanical / non-post-hoc.** The grid `G_θ × G_κ`, the objective (maximize TRAIN composite), and the tie-break are **fixed at this pre-registration, before any data exists**. No human selects `θ`/`κ` after seeing any result; the procedure is a deterministic function of the TRAIN split. This is the antithesis of post-hoc tuning.
- **[GATE] The held-out wall on calibration is ABSOLUTE.** Calibration runs entirely in the **fitting phase** (stream `"fitting-data"`, consumed *before* `"evaluation"` per §7.3 ordering). It **may never** read a held-out family, a held-out context combination, or any oracle label from the `"evaluation"` stream. Any calibration step that touches a held-out cell is a **harness bug that invalidates the run**, not a result (§5.2 no-peeking guarantee).
- **[ARCH] Symmetry (the point of the change).** After [v2 CHANGE (3)], **all** tunable methods — baseline (ii) fixed-rule, baseline (iii) user-aware heuristic, baseline (iv) classifier, baseline (v) ablation threshold, **and** SSI — are fit on the **same** TRAIN split under the **same** wall. SSI no longer carries an un-tuned handicap, and none of them sees held-out data.
- **[ARCH] Anti-rigging — SSI can still LOSE.** TRAIN-optimal `(θ*,κ*)` carries **no guarantee** of a held-out win: the two-axis held-out design (§5.1) is precisely where TRAIN-fit operating points may **fail to generalize**. Baseline (iii) and (v), tuned by the same discipline, can still tie or beat SSI on held-out. Calibration corrects a fairness asymmetry; it does **not** hand SSI the evaluation, and SSI **never** accesses `θ_u` or any oracle label during calibration (it optimizes its own §6 composite on TRAIN, computed from the same oracle labels every method's TRAIN fit may use).

### 5.3 Evaluation-set composition (registered rates) [ARCH]

So that each metric is actually estimable, the evaluation set is generated at **registered rates** (locked proportions carried into the harness):

- a registered fraction of **negative-control** cases (`worth_surfacing = 0` with a *detected* consequence) — required so abstention quality is testable and clippy-failure is penalized (§2.5);
- a registered fraction of **answer-changing-pivotal** cases (`answer_changes_IR = 1`) — required so VoI is estimable and not degenerate;
- a registered small fraction of **safety-class** cases — so S6 is observable;
- balanced coverage of held-out families and held-out context combinations across users.

Per-user the evaluation draws a **registered number of consequence cases** so the per-user metric means (the unit of analysis, §7) are well-defined. **All rates and counts are fixed before any data is generated.**

---

## 6. Metrics — exact computable estimators against the synthetic oracle

> *[v2 note: §6 retains v1's metric **estimators verbatim** (AQ balanced accuracy, US precision, VoI precision, the §6.4 composite and its locked weights). [v2 CHANGE (4)] S6/AQ HANDLING adds only §6.1.1 — the principled exclusion of mandatory-safety (S6-forced) cases from the AQ/US/VoI composite and their scoring in a separate `MS` bucket, applied identically to every method. The composite weights and the §9 decision rule are unchanged.]*

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
- **[v2 CHANGE (4)] S6/AQ scoping (see §6.1.1):** the `AQ`, `US`, and `VoI` estimators above are computed over the **discretionary** evaluation cases `D_u^{disc}` only; **S6-forced safety-class cases are excluded** and scored separately in the mandatory-safety bucket `MS` (§6.1.1), identically for every method.

### 6.1.1 [v2 CHANGE (4)] Mandatory-safety (S6) handling — the AQ false-positive fix [ARCH][GATE]

**The v1 mis-specification.** S6 (§4.4) is a **mandatory** override: a safety/constraint-class consequence is **always surfaced**, regardless of S1/S4. But v1's `AQ` (balanced accuracy of `surface` vs `ws`) scored a safety-class case whose **discretionary** `ws = 0` as an **abstention false-positive (`FP`)**, penalizing **any** method that obeys the safety rule. `ROOT-CAUSE-V4PRO.md` flagged this as a metric mis-specification: a **mandated** surfacing is not a discretionary salience error and must not be charged against abstention quality.

**The registered choice (locked).** Partition each user's evaluation cases

```
D_u  =  D_u^{disc}  ∪  D_u^{safety}
```

where `D_u^{safety}` = the **safety-class** cases (those whose §2.4/§4.4 signature flags a constraint/safety violation, i.e. the S6-forced set) and `D_u^{disc}` = all remaining **discretionary** cases. Then:

1. **Exclude `D_u^{safety}` from the composite.** `AQ_u`, `US_u`, `VoI_u` (§6.1–§6.3) — and therefore the §6.4 composite — are computed over `D_u^{disc}` **only**. A mandated safety surfacing is thus **never** an abstention `FP`.
2. **Score safety compliance in a separate bucket `MS`** (mandatory-safety compliance), the fraction of safety-class cases a method surfaces:

   ```
   MS_u(M)  =  ( Σ_{i ∈ D_u^{safety}} surface_M(i) )  /  |D_u^{safety}|        ∈ [0,1]
   ```

**Applied IDENTICALLY to every method (the integrity crux of this change).** `D_u^{safety}` is **oracle/signature-defined and method-independent** — the *same* cases are excluded for SSI and for all five baselines. No method gets a tailored exclusion: SSI's S6-forced surfacings and any baseline's forced/incidental surfacings on the safety family are treated by the **one** rule. Methods that ignore safety (e.g. silent Route-2, which never surfaces) simply score `MS = 0`; methods that obey S6 score `MS = 1`.

- **[ARCH] Why principled, not SSI-favouring.** The excluded penalty applied to **any** safety-obeying method, not uniquely to SSI; removing it from the composite for **everyone** corrects a shared mis-charge. SSI gains no relative edge: a baseline (e.g. the generic linter) that also surfaces the safety family benefits identically, and the composite — where SSI's EIG/VoI claim actually lives — keeps its weights (§6.4) and judges **discretionary** salience exactly as before.
- **[GATE] `MS` is reported, not gated.** `MS` is reported per method as a **diagnostic** (so S6 behaviour stays observable, §4.4) but is **not** folded into the §6.4 composite (weights unchanged: `(w_AQ, w_VoI, w_US) = (0.40, 0.40, 0.20)`) and adds **no** new branch to the §9 decision rule. The two-axis held-out design (§5.1), `N = 12`, the paired sign-flip permutation + Holm FWER test (§7), the G1B-MV sub-gate (§8), and the §9 ordered decision rule are **identical to v1**.
- **[ARCH] Registered safety fraction unchanged.** Per §5.3, safety-class cases are a registered small fraction of the evaluation set, so excluding them leaves `D_u^{disc}` well-populated for the §6.4 composite and the §7 per-user statistic; the §5.3 rates are unchanged by this metric refinement.

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
- **[ARCH] This is where EVSI earns or fails to earn its keep.** SSI's **aligned** EVSI gate (§4.5, [v2 CHANGE (2)]) is *designed* to raise `VoI` precision by abstaining on `EVSI_aligned = 0` (non-pivotal-vs-context-prior) cases while **no longer** abstaining on definitive-posterior-but-pivotal cases (the v1 false-negative). Baseline v lacks the gate, so it should surface more non-pivotal cases and score lower `VoI` — **unless** the coupled posterior/surprise alone already separates pivotal from non-pivotal, in which case `VoI(SSI) ≈ VoI(baseline v)` and **H0-ablation fires** (§1.3). The metric is constructed so this falsification is *visible*, not hidden.

### 6.4 The pre-registered composite [ARCH][GATE]

The G1B gate (§9) is on a **single composite per user**, a **registered fixed-weight** combination of the three locked metrics:

```
Composite_u(M) = w_AQ · AQ_u(M) + w_US · US_u(M) + w_VoI · VoI_u(M)
with registered weights  w_AQ, w_US, w_VoI ≥ 0,  w_AQ + w_US + w_VoI = 1
```

- **The weight vector `(w_AQ, w_US, w_VoI)` is fixed at pre-registration** (locked numeric value in §7) and is **never** re-chosen after results. To respect §5.6's emphasis on answer-changing VoI and abstention as the decisive, anti-clippy quantities, the registered weighting places primary mass on `AQ` and `VoI` with `US` as the secondary, exact values locked in §7. Reporting will *also* show the three metrics **separately**, but the **gate is on the composite** with the locked weights so there is no post-hoc metric-shopping.
- **Unit of analysis:** the per-user scalar `Composite_u(M)`. The across-user aggregation, paired test, and margins are locked in **§7**.

### 6.5 Calibration / reliability-curve definitions [ARCH]

Per §5.6 the report must include **calibration/reliability curves**. Defined as exact estimators (computed at evaluation, **not** used to tune anything — §5.2):

- **Surfacing-reliability curve.** Bin cases by a method's **surfacing score** (for SSI: `EVSI_aligned`, or the EIG-rank-normalized score; for baselines: their decision score). In each bin `b`, plot **empirical pivotality** `mean(vc | bin b)` vs **mean predicted** score. A well-calibrated SSI has monotone increasing empirical `VoI` with `EVSI_aligned`. **Expected Calibration Error** `ECE = Σ_b (|b|/N) · |mean_pred_b − mean_vc_b|` is reported per method (registered binning: a fixed number of equal-width bins, locked into the harness).
- **Abstention-reliability curve.** Same construction against `ws` (worth-surfacing), measuring whether higher surfacing scores coincide with truly worth-surfacing cases.
- **[ARCH]** Calibration is **diagnostic/reported**, explicitly **not** part of the gate composite (to avoid adding a tunable surface). It exists so a tie/near-tie in §6.4 can be *interpreted* but does **not** rescue a failed gate — the gate is §6.4 + §7.

### 6.6 Honest limitations of the metrics (locked) [PAPER]

- **The oracle is synthetic.** Every label (`worth_surfacing`, `answer_changes_IR`) and therefore every metric here is defined by the §2 generative model, **not** by humans. `US` is a *proxy* for "user-rated usefulness"; `VoI` is computed against a *registered* IR-selection oracle, not observed user behaviour. A G1B pass is **pilot-grade synthetic evidence** only (§1.5).
- **Real evidence is G5, not G1B.** The human-grounded version — **N ≥ 24 musicians**, adequately powered, real fossils, real engine, real usefulness ratings and real answer-changing observations — is **G5** (§9 Phase 5), not this spike. G1B's N ≥ 8 is explicitly **pilot-grade** (§5.6, §9 Track 1B). No metric in §6 should be read as establishing the human claim; it clears (or fails) the cheap synthetic falsifier so heavier build phases are gated honestly.
- **S3 is collapsed (§4.4).** The relevance term is bound to S1/S4 rather than modelled, a registered simplification that *removes* a degree of freedom from SSI (conservative for the claim, not flattering to it).

---

---

## 7. Pre-registered margins, unit of analysis, randomization, N, and the exact statistical test

> *[v2 note: §7 is carried **verbatim** from v1 EXCEPT the single mandated change of `SEED_MASTER` (§7.3) to the new v2 value. Composite weights, N=12, the exact paired sign-flip permutation test, Holm FWER, the margin, and the H-NC bar are all **identical to v1**.]*

This section **locks every quantity that converts per-user metric values (§6) into a binary G1B verdict** — margins, N, seeds, and the exact test — **before any data exists.** Nothing here may be re-chosen after a result. The test uses **no external statistics library**: it is a deterministic, fully-seeded paired permutation procedure (exact enumeration where feasible) with a deterministic bootstrap for reported confidence intervals only.

### 7.1 Unit of analysis [ARCH][GATE]

- **The unit of analysis is the synthetic user `u`.** For a method `M`, the per-user scalar is `Composite_u(M)` (§6.4): a single number per user, computed as the mean over that user's evaluation cases `D_u` of the locked composite.
- **Locked composite weights** (identical to v1; primary mass on abstention quality and answer-changing VoI, usefulness secondary, per §5.6/§5.7 anti-clippy emphasis):

  ```
  w_AQ = 0.40 ,  w_VoI = 0.40 ,  w_US = 0.20      ( sum = 1, all ≥ 0 )
  ```

- **Across-user statistic.** For each baseline `b`, the paired per-user difference is

  ```
  d_u^{(b)} = Composite_u(SSI) − Composite_u(b)
  ```

  and the **per-baseline effect** is the **mean paired difference** `D̄^{(b)} = (1/N) Σ_u d_u^{(b)}`. Users are the exchangeable replicates; per-user case counts are fixed by §5.3 so each user contributes one `Composite_u`. This is the single registered statistic the test below operates on.

### 7.2 Sample size N [ARCH][GATE]

- **N is the number of synthetic users.** Locked: **target `N = 12`**, with **`N ≥ 8` as the pilot floor** required by §9 Track 1B (identical to v1). The run generates `N = 12` users; if fewer than 8 valid users are produced, the run is **invalid** (not a FAIL) and must be regenerated under the registered seed scheme.
- **N is pilot-grade by construction** (§1.5, §6.6): `N = 12` synthetic users is **not** the plan-lock evidentiary standard. The powered, human standard is **G5 with N ≥ 24 real musicians** (§9 Phase 5).
- **Why N is adequate for a paired test at this margin:** the test (§7.4) is a **paired** permutation test on per-user differences; with `N = 12` the exact sign-flip permutation null has `2^12 = 4096` equally-likely points, giving an exact achievable one-sided p-value granularity of `1/4096 ≈ 2.4×10⁻⁴`, far finer than `α = 0.05`. No asymptotic/normal approximation is used.

### 7.3 Randomization and the deterministic seed scheme [ARCH][GATE]

All randomness in G1B is **data generation and the permutation/bootstrap nulls only** — SSI's decisions are analytic and seed-free (§4.7). The scheme is a single master seed expanded by a deterministic splittable PRNG so the entire run is **bit-reproducible**.

- **Master seed (locked — NEW for v2):** **[v2 CHANGE — new SEED_MASTER]** `SEED_MASTER = 0x5551B_0002` (hex; a fixed registered constant, **distinct from the v1 seed `0x5551B_0001`**). This is the **one** v2 run seed: **no seed-shopping** — re-running with this seed must reproduce every number, and a robustness sweep over other seeds (if reported) is secondary/descriptive only and **cannot** change the gate verdict.
- **Deterministic stream derivation:** a `SplitMix64`-style deterministic generator derives independent sub-streams by hashing `(SEED_MASTER, stream-label)`. Locked stream labels and their order of consumption (identical structure to v1, now seeded by the v2 master):
  1. `"holdout-partition"` — chooses the TRAIN/HELD-OUT family partition and the held-out context combinations **first** (the §5.2 no-peeking wall: the partition is fixed before any fitting data is drawn).
  2. `"users"` — for each user `u ∈ {0..N−1}`, a per-user sub-stream `hash(SEED_MASTER, "users", u)` samples `θ_u` (§2.3 correlated/context-conditioned prior) and that user's fossils.
  3. `"fitting-data"` — generates the TRAIN-split cases used to fit baselines (ii)–(v) **and** to run SSI's [v2 CHANGE (3)] TRAIN-split calibration (never held-out cells).
  4. `"evaluation"` — generates each user's evaluation cases `D_u` at the registered §5.3 rates (held-out families/contexts only enter here).
  5. `"permutation"` — drives the permutation test **only if** Monte-Carlo sampling is needed (§7.4); for `N = 12` the test is **exact** and this stream is unused except to record that it was not needed.
  6. `"bootstrap"` — drives the reported confidence-interval bootstrap (§7.5), reporting-only.
- **Ordering guarantee:** streams are consumed in the order above; the holdout partition is committed before fitting data exists, enforcing §5.2. Changing `SEED_MASTER` after seeing results is forbidden.

### 7.4 The exact statistical test — paired permutation, one-sided, FWER-controlled [ARCH][GATE]

*(Identical to v1.)* The G1B product gate (§9) requires SSI to **beat all five baselines** on the composite. The locked test is a **paired sign-flip permutation test** per baseline, combined across the five baselines with **deterministic multiple-comparison control**. No external stats library; no normal/t approximation.

**Per-baseline null and statistic.** For baseline `b`, the null `H0^{(b)}` is "no SSI advantage": the paired differences `{d_u^{(b)}}` are symmetric about ≤ 0. The **observed statistic** is the mean paired difference `D̄^{(b)}` (§7.1). The exchangeable permutation operation is **independent sign-flips** of each user's difference `d_u^{(b)} → s_u · d_u^{(b)}`, `s_u ∈ {+1,−1}`.

**Exact enumeration (locked for N = 12).** Enumerate all `2^N` sign-vectors `s ∈ {−1,+1}^N`. For each, compute the permuted mean `D̄^{(b)}(s) = (1/N) Σ_u s_u d_u^{(b)}`. The **one-sided permutation p-value** (alternative: SSI > baseline) is

```
p^{(b)} = ( #{ s : D̄^{(b)}(s) ≥ D̄^{(b)}_observed } ) / 2^N
```

For `N = 12`, `2^N = 4096` — enumerated exactly and deterministically (no sampling). **Monte-Carlo fallback (locked, only if `N > 20`, which does not occur):** draw `B_perm = 100000` sign-vectors from the `"permutation"` stream and use `p^{(b)} = (1 + #{≥ obs}) / (1 + B_perm)`. At `N = 12` the exact branch is used.

**Two locked requirements per baseline (both must hold):**

1. **Margin requirement (effect size):** the observed mean paired advantage clears the **pre-registered margin**

   ```
   D̄^{(b)}_observed  ≥  δ_composite = 0.05         (absolute, on the [0,1] composite scale)
   ```

   `δ_composite = 0.05` is locked for **every** baseline (identical to v1).
2. **Significance requirement:** the multiple-comparison-adjusted p-value (below) is `< 0.05`.

**Multiple-comparison handling across the five baselines (locked).** Family-wise error is controlled by **Holm–Bonferroni step-down** on the five exact permutation p-values:

```
Sort the five p-values ascending:  p_(1) ≤ p_(2) ≤ … ≤ p_(5).
Holm rejects p_(j) iff  p_(k) ≤ 0.05 / (5 − k + 1)  for all k ≤ j   (step-down).
```

H1's significance requirement is met **iff all five** null hypotheses are rejected by Holm at FWER `α = 0.05`.

**Combined H1 decision (locked):** H1 (§1.1) is **confirmed** iff, for **every** baseline `b ∈ {i,ii,iii,iv,v}`, **both** the margin requirement (`D̄^{(b)} ≥ 0.05`) **and** the Holm-adjusted significance requirement (`< 0.05`) hold simultaneously. Failure on **any** baseline means H1 is not confirmed; failure specifically against **baseline (v)** triggers the Decision-#5 descope branch (§1.3, §9.2).

### 7.5 Deterministic bootstrap for reported confidence intervals (reporting-only) [ARCH]

*(Identical to v1.)* For each baseline `b`, a **percentile bootstrap** over users gives a reported CI on `D̄^{(b)}` (and on each sub-metric mean): resample `N` users with replacement `B_boot = 10000` times from the `"bootstrap"` stream, recompute `D̄^{(b)}*`, and report the `[2.5%, 97.5%]` percentile interval. **This is descriptive only**: the gate verdict is the §7.4 permutation test + margin, never the bootstrap CI.

### 7.6 Negative-control guard test H-NC (locked) [ARCH][GATE]

*(Identical to v1.)* Independently of the composite (§1.4, §2.5), the registered negative-control cases (`worth_surfacing = 0` with a detected consequence) must be **abstained on by SSI** at a pre-registered rate: SSI's **specificity on negative controls** (per-user, averaged across users) must be `≥ 0.80` (equivalently a **false-positive interruption rate ≤ 0.20**, the §6.1 named guard, §5.7). This is a **necessary** condition checked at the decision rule (§9); SSI can win the composite yet still fail H-NC, in which case the run is **FAIL** (over-surfacing / clippy failure), not PASS.

---

## 8. G1B-MV — the model-validity sub-gate (factorization adequacy)

> *[v2 CHANGE (1) — §8 now tests the COUPLED model. The structure, the PPC discrepancy, the three-way model comparison, `τ_MV`, and the `4·SE` reliability bar are carried from v1; the only change is that **SSI's model under test is now the sparse-pairwise-coupled model M-cpl**, and the comparison includes a **richer** alternative so the coupled model can STILL FAIL MV (anti-rigging).]*

Per §5.3 and §9 Track 1B, SSI's belief model is a **hypothesis the build can be forced to abandon/extend**, not an assumption. **G1B-MV** tests whether the **sparse-pairwise-coupled** posterior (§4.1) is adequate against the deliberately-correlated, context-conditioned generative truth (§2.3). It has two locked components and a pre-registered effect-size threshold for "residual interactions materially matter." All comparisons use the **same fossils** SSI consumes; all thresholds are fixed here.

### 8.1 Posterior-predictive checks (PPC) [ARCH][GATE]

For each user, draw **replicated fossil sets** from the **fitted coupled posterior** (§4.1) and compare an **interaction-sensitive discrepancy statistic** between observed and replicated fossils:

- **Discrepancy statistic `T_assoc` (locked):** the summed absolute **pairwise association** (mean absolute Cramér's-V / normalized mutual information) across the registered correlated axis pairs of §2.3 (`A_grit×A_routing`, `A_artifact×A_expertise`, `A_interrupt×X_flow`). **[v2 CHANGE (1)]** Because the **coupled** model now reproduces the §2.3-pair association, replicated fossils from M-cpl *should* match observed association on those pairs; a residual mismatch (or association on a **non-registered** pair that the sparse coupling omits) indicates the coupled model is still misfit.
- **Posterior-predictive p-value (locked):** `p_PPC = Pr( T_assoc(replicated) ≥ T_assoc(observed) )` estimated from `B_ppc = 2000` replications drawn off the `"evaluation"`-independent PPC sub-stream (registered). The coupled model is **PPC-adequate** iff `p_PPC ∈ [0.05, 0.95]`. `p_PPC` is **reported per registered pair and pooled**; the gate uses the **pooled** value. **The coupled model can still fail PPC** (e.g. if higher-order or non-registered-pair interactions remain) — see §8.3.

### 8.2 Model comparison: coupled vs hierarchical vs factored [ARCH][GATE]

Fit **three** belief models to the **same** fossils and compare their **held-out fossil predictive accuracy** (no held-out *consequence* labels are touched — purely a model-of-the-fossils comparison, inside the §5.2 wall):

- **M-cpl** — **[v2 CHANGE (1)]** the §4.1 **sparse-pairwise-coupled**, context-conditioned model (**SSI's v2 model**).
- **M-hier** — a **hierarchical** model with a population-level hyper-prior over axis distributions and per-user partial pooling (the §5.3 "hierarchical" alternative, and the **richer** alternative that lets the coupled model still lose MV).
- **M-fac** — the v1 **fully factored** product of per-axis Dirichlets (now a **coupling-ablation** reference: M-cpl should beat M-fac if the coupling is load-bearing, otherwise the coupling itself is unnecessary).

**Comparison metric (locked):** **expected held-out log predictive density per fossil**, `ELPD/obs`, estimated by leave-one-fossil-out (deterministic, seeded) within each user, pooled across users. Define improvements over the coupled model:

```
ΔELPD_hier  =  (ELPD/obs)_hier  −  (ELPD/obs)_cpl        (nats per fossil)   ← richer than coupled?
ΔELPD_fac   =  (ELPD/obs)_fac   −  (ELPD/obs)_cpl        (nats per fossil)   ← coupling unnecessary? (reported)
SE_m         =  registered paired standard error across the pooled held-out fossils.
```

**Pre-registered effect-size threshold for "residual interactions materially matter" (locked):** residual interactions beyond the sparse coupling are deemed **material** iff the **hierarchical** alternative satisfies **both**

```
ΔELPD_hier  ≥  τ_MV = 0.02  nats per fossil     (size)
        AND   ΔELPD_hier / SE_hier  ≥  4          (reliability)
```

The **AND** prevents declaring materiality from a sizable-but-noisy or tiny-but-precise improvement. `τ_MV = 0.02` nats/obs and the `4·SE` reliability bar are **identical to v1**.

### 8.3 G1B-MV verdict (locked) [GATE]

- **MV-ADEQUATE** iff the **coupled** model is **PPC-adequate** (§8.1) **AND** residual interactions are **not material** (§8.2 threshold not met). SSI's coupled KL/EIG/VoI claims stand as-is.
- **MV-FORCE-COUPLE** iff residual interactions **are material** (§8.2 met) **or** PPC is inadequate (`p_PPC < 0.05`). **[v2 CHANGE (1)]** Because v2 already adopts sparse-pairwise coupling, the forced remedy here is a **further** step: either (a) **add the hierarchical / additional coupling** to SSI's posterior and **re-run the entire §7 test** with the richer model **before** any PASS may be claimed, **or** (b) **reduce its KL/EIG claims** accordingly. Option (a) is the registered default; (b) is a fallback if the richer model is intractable.
- **[ARCH] Integrity / anti-rigging:** G1B-MV is run **regardless of the H1 outcome**, and **the coupled model can still FAIL it** (PPC rejection or a materially-better hierarchical model). A composite win achieved with a **mis-specified** coupled model does **not** earn PASS until the model is fixed. This keeps the §2.6 promise operational *even after* the coupling change: SSI does not get to keep an advantage resting on an invalid modelling assumption.

---

## 9. Decision rule — PASS / FAIL-descope(Decision #5) / FAIL-MV (locked)

> *[v2 note: the §9 ordered decision rule is **structurally identical to v1**. The only substantive shift is that "MV-FORCE-COUPLE remedy" now means a **further** (hierarchical/extra-coupling) remedy because sparse-pairwise coupling is already SSI's registered model. The branch logic, order, and verdict labels are unchanged.]*

The G1B verdict is a **deterministic function** of the locked tests above, fixed before any result exists. The branches are **mutually exclusive and evaluated in the locked order** below; the **first** matching branch is the verdict.

### 9.1 Inputs to the rule (all defined in §7–§8)

- `H1_pass` — every baseline `b` clears **both** the margin (`D̄^{(b)} ≥ δ_composite = 0.05`) **and** Holm-adjusted significance (`< 0.05`) (§7.4).
- `ablation_tie` — SSI fails to clear the margin **or** significance specifically against **baseline (v)**, the (now coupled) EIG/VoI-ablation (§3.5, §1.3) — i.e. `(D̄^{(v)} < 0.05) OR (Holm-adjusted p^{(v)} ≥ 0.05)`. This is the locked operational definition of "ties" from §1.3.
- `NC_pass` — SSI's negative-control specificity `≥ 0.80` / FP-interruption `≤ 0.20` (§7.6, H-NC).
- `MV` ∈ {`MV-ADEQUATE`, `MV-FORCE-COUPLE`} (§8.3). When `MV-FORCE-COUPLE` fires, **the §7 test is re-run on the remedied (hierarchical/extra-coupling) model first**, and `H1_pass`, `ablation_tie`, `NC_pass` are read from that **re-run** (option (a)); if option (b) is taken, the reduced-claim model is tested instead.

### 9.2 The decision branches (evaluated top-down; first match wins) [GATE]

1. **FAIL-MV** — *if* `MV-FORCE-COUPLE` fires **and** the forced remedy is **not** applied (neither the richer-model re-run nor claim reduction completed), the verdict is **FAIL-MV**: even the sparse-pairwise-coupled model is rejected by G1B-MV and SSI's KL/EIG claims are invalid as stated. **Investment rule:** freeze Phase-2+ Route-1 work; SSI must add the richer model or reduce claims and re-enter G1B. *(If the remedy **is** applied, evaluation proceeds with the remedied model through the branches below.)*

2. **FAIL-descope (Decision #5)** — *else if* `ablation_tie` is true (SSI does **not** beat baseline (v) by the registered margin at significance): the **EIG/VoI machinery is NOT load-bearing.** This is the **accepted falsification H0-ablation** (§1.3), recorded as a **successful, honest** G1B outcome. **Action (Decision #5):** **descope** — ship the **user-aware heuristic Route-1** (baseline iii) **or Route-2-only**, **retract the "computed belief shift" claim**, and **freeze** EIG/VoI-dependent Phase-2+ work. *(Checked before the generic H1 fail so an ablation tie always routes to descope.)* **[v2 note:** because the ablation now shares SSI's coupled posterior and the calibration/EVSI-alignment unfairnesses are corrected, an ablation tie under v2 is a **far stronger, harder-to-argue** descope signal than v1 — exactly the Option-B rationale: if SSI still loses to the ablation under a *fair, MV-remedied* test, **accept the falsification, no further retries** (DECISION-BRIEF-D5 §3, Option B).**]**

3. **FAIL (general)** — *else if* `H1_pass` is false for some reason **other** than the ablation tie (SSI fails to beat one of baselines i–iv by the margin/significance), **or** `NC_pass` is false (SSI over-surfaces on negative controls, clippy failure): the verdict is **FAIL**. **Investment rule:** freeze Phase-2+ Route-1-specific work until a redesigned salience model passes the strong-baseline test. A failure against **baseline (iii)** specifically weakens the "has a user model isn't the differentiator" story; a failure against **baselines i/ii** means SSI is not even beating trivial initiators.

4. **PASS** — *else* (reached only if `MV` is adequate-or-remedied, `ablation_tie` is false, `H1_pass` is true for **all five** baselines, **and** `NC_pass` holds): the verdict is **PASS [GATE]**. SSI **beats all five baselines** on the locked composite by `δ_composite = 0.05` at Holm-FWER `< 0.05`, **negative controls abstain**, **and** G1B-MV validates (or the remedy was applied and still passes). Per §9 Track 1B this clears the **pilot-grade** G1B gate so Phases 4–6 Route-1 work may proceed. **PASS is explicitly pilot-grade synthetic evidence only** (§1.5, §6.6): it does **not** establish the human claim, which remains **G5 (N ≥ 24)**.

### 9.3 Summary verdict table [GATE]

| Order | Condition (first match wins) | Verdict | Action |
|---|---|---|---|
| 1 | `MV-FORCE-COUPLE` fired **and** remedy not applied | **FAIL-MV** | Add richer model / reduce KL-EIG claims; re-enter G1B; freeze Phase-2+ Route-1 |
| 2 | `ablation_tie` (SSI ⊀ baseline v by margin@sig) | **FAIL-descope (Decision #5)** | EIG/VoI not load-bearing → ship heuristic Route-1 or Route-2-only; retract belief-shift claim; freeze EIG/VoI work; **no further retries (Option B one-shot)** |
| 3 | `H1_pass` false on baselines i–iv, **or** `NC_pass` false | **FAIL** | Freeze Phase-2+ Route-1; redesign salience model; re-enter G1B |
| 4 | `MV` ok **and** not ablation-tie **and** all 5 beaten @ margin&sig **and** `NC_pass` | **PASS** (pilot-grade) | Clear G1B; Phases 4–6 Route-1 may proceed; human claim still owed at G5 |

### 9.4 Lock statement [GATE]

Every parameter, threshold, margin, weight, N, seed, and test specified in §1–§9 is **fixed at this v2 pre-registration and may not be changed after any result exists.** Specifically locked: the §2 axis/context/oracle structure (**verbatim from v1**); the five baselines (§3, with baseline (v) now sharing SSI's coupled posterior — [v2 CHANGE (1)]); SSI's constants `α_base = 1.0`, the registered pairwise prior `β^0` with coupling strength `λ_couple = 2.0` and the §4.0 component set `{P1, P2, {A_interrupt}(flow-extended), {A_bright}}` ([v2 CHANGE (1)]), the **aligned** EVSI context-prior silent baseline ([v2 CHANGE (2)]), `θ_surprise`, `κ` (calibrated TRAIN-split-only per [v2 CHANGE (3)], registered by task-2), `B = 3`, signatures, `IR*` (§4); the holdout partition and rates (§5); the composite weights `(w_AQ, w_VoI, w_US) = (0.40, 0.40, 0.20)` and all metric estimators (§6, with the [v2 CHANGE (4)] S6/AQ mandatory-safety handling registered by task-2); `N = 12` (floor 8); **`SEED_MASTER = 0x5551B_0002` (NEW for v2, one run, no seed-shopping)**; the exact paired sign-flip permutation test with Holm FWER `α = 0.05`; the margin `δ_composite = 0.05`; the H-NC specificity bar `≥ 0.80` (§7); the G1B-MV `τ_MV = 0.02` nats/obs and `4·SE` reliability bar applied to the **coupled** model (§8); and the ordered decision branches (§9). Any deviation observed during execution invalidates the run under that seed; it does not license post-hoc re-tuning. The companion file `HARNESS-SPEC-v2.md` (implementation blueprint, **no code this phase**) must implement these and only these. **No experiment is run and no results are produced in this phase.**

> **[Task-1 boundary]** This document, at the close of task-1, registers the **generative model/oracle/baselines/metrics/stats verbatim from v1** plus **exactly two** of the four permitted v2 changes: **(1) sparse-pairwise COUPLING** (SSI + baseline (v); §3.0/§3.5/§4.0–§4.3/§4.6/§4.7/§8) and **(2) ALIGNED EVSI** (§4.5/§4.7), plus the **new `SEED_MASTER = 0x5551B_0002`**. The remaining two permitted changes — **(3) CALIBRATION SYMMETRY** (§4.3/§4.5/§5.2/§5.2.1) and **(4) S6/AQ HANDLING** (§4.4/§6.1/§6.1.1) — and the appended **"CHANGES FROM v1"** and **"ANTI-RIGGING INVARIANTS"** sections are added by the subsequent edits (tasks 2–3). No results are produced in this or any phase task.

> **[Task-2 boundary]** This edit registers the remaining **two** permitted v2 changes with exact specifications: **(3) CALIBRATION SYMMETRY** — mechanical, non-post-hoc TRAIN-split argmax of `θ_surprise`/`κ` (objective = maximize TRAIN composite over the registered grid `G_θ × G_κ`, conservative tie-break), on the SAME TRAIN data baseline (iii) fits, with an **ABSOLUTE** held-out wall on calibration (§4.3, §4.5, §5.2, **§5.2.1**); and **(4) S6/AQ HANDLING** — S6-forced safety-class cases **excluded** from the AQ/US/VoI composite and scored in a **separate mandatory-safety bucket `MS`**, applied **IDENTICALLY** to every method (§4.4, **§6.1.1**). **Composite weights `(0.40, 0.40, 0.20)`, the held-out two-axis design, `N = 12`, the paired sign-flip permutation + Holm FWER test, the `δ_composite = 0.05` margin, the G1B-MV sub-gate, and the §9 ordered decision rule are UNCHANGED.** No results are produced. The appended **"CHANGES FROM v1"** and **"ANTI-RIGGING INVARIANTS"** sections remain for task-3.

---

## A. CHANGES FROM v1 (the complete, exhaustive, closed list)

> *[v2 note: this section enumerates **exactly** the permitted v2 changes — the **four** principled corrections plus the **one** mandated new `SEED_MASTER`. **Nothing else** about the v1 design is altered (everything not listed here is carried verbatim — see §B). Each change is justified as a **principled correction of a genuine unfairness or mis-specification** diagnosed in `ROOT-CAUSE-V4PRO.md`, and each is shown to be **NOT SSI-favouring** — after every change it remains structurally possible for SSI to LOSE. This list is **closed**: any change not appearing here is out of bounds for v2.]*

The v1 design (`PRE-REGISTRATION.md`, sha256 `afa823bc…`) fired its falsifier: **FAIL-MV** + SSI lost **4/5** baselines including its own EIG/VoI-ablation; cross-lab witness confirmed **GENUINE-FALSIFICATION (conf 0.95)**. Per **DECISION-BRIEF-D5 Option B**, v2 is the **ONE** authorized disciplined redesign. `ROOT-CAUSE-V4PRO.md` diagnosed **three structural causes** (model mis-specification, EVSI mis-alignment, calibration asymmetry) plus a metric mis-charge (S6/AQ). The permitted v2 changes address **exactly** those, and nothing more.

### A.0 The new run seed (mandated, one run, no seed-shopping) [GATE]

- **`SEED_MASTER = 0x5551B_0002`** (was `0x5551B_0001` in v1). **[v2 — new SEED_MASTER]** A *fresh* v2 pre-registration must commit to its own single run seed so v2 is not a re-tune of the exact v1 sample. This is the **one** v2 run (§7.3): **no seed-shopping** — the gate verdict is read off this seed; any robustness sweep over other seeds is descriptive-only and **cannot** change the verdict.
- **Why principled, not SSI-favouring:** a new seed draws a **fresh** synthetic world from the **same** generative distribution (§2, verbatim). It does **not** select a world favourable to SSI (the seed is fixed *before* any v2 result exists, and only one is used). A different sample is equally able to make SSI lose; indeed the design (§2.6, §3.6) guarantees SSI *can* lose under any seed.

### A.1 [v2 CHANGE (1)] COUPLING — SSI's posterior fully-factored → minimal sparse-pairwise coupled, applied IDENTICALLY to SSI and to baseline (v) [ARCH][GATE]

- **What changed:** SSI's belief model moves from the v1 **fully-factored** product of per-axis Dirichlets to a **minimal sparse-pairwise-coupled** model over **exactly** the §2.3 registered correlated pairs — `A_grit×A_routing` (P1) and `A_artifact×A_expertise` (P2) as joint Dirichlets, with `A_interrupt×X_flow` realized as a flow-extended conditioning key; all other axes stay factored (§4.0–§4.3, §4.6, §4.7). The **SAME** coupled posterior is the belief model for **baseline (v), the EIG/VoI-ablation** (§3.5), so the SSI−ablation delta still isolates **ONLY** EIG/VoI.
- **The genuine mis-specification it corrects (`ROOT-CAUSE-V4PRO.md`, cause 1 / v1 FAIL-MV):** v1's G1B-MV sub-gate **rejected** the factored model against the deliberately-correlated truth (§2.3) — `MV-FORCE-COUPLE` fired. v1 lost partly because SSI reasoned with a model the validity gate itself declared inadequate. Coupling is the **registered remedy v1 already named** (`MV-FORCE-COUPLE`), adopted up-front. It is a **strict generalization**: at `λ_couple → 0` the coupled prior recovers the v1 factored model exactly (§4.0, §4.1), so it is the same world reasoned about more faithfully, not a new world.
- **Why NOT SSI-favouring (and applied to the ablation too):** the coupling is given **equally** to baseline (v), so SSI gains **no** isolation advantage — the ablation shares SSI's *entire* coupled machinery and differs only by EIG/VoI. The coupled model is **still tested by G1B-MV** (§8), now against a **richer hierarchical** alternative, and **can still FAIL MV** (PPC rejection or a materially-better hierarchical model → FAIL-MV, §9.2). Fairer to SSI's *posterior*, but SSI's *distinctive mechanism* (EIG/VoI) is no better isolated and the ablation can still tie/beat it.

### A.2 [v2 CHANGE (2)] ALIGNED EVSI — SSI's EVSI silent baseline aligned to the oracle's context-prior pivotality reference [ARCH][GATE]

- **What changed:** SSI's EVSI/VoI now measures value against the **same silent baseline the oracle uses for pivotality** — the **context-prior default IR** `IR*(t_prior(c))` — instead of v1's **consequence-conditioned** posterior baseline (§4.5, §4.7). SSI still predicts answers with its **own** coupled posterior; only the *reference IR* it compares against is aligned to the oracle's `answer_changes_IR` definition (§2.5).
- **The genuine mis-specification it corrects (`ROOT-CAUSE-V4PRO.md`, cause 2 — EVSI mis-alignment / Constraint 3):** the v1 oracle defines `answer_changes_IR` relative to the **context-prior** default IR, but v1 SSI computed EVSI relative to its **consequence-conditioned** posterior. On cases where the consequence update was already definitive, v1 SSI scored `EVSI = 0` and **abstained on genuinely pivotal cases** (systematic false-negatives) — measuring value against a *different* baseline than the one it was graded on. Alignment makes SSI's EVSI measure pivotality against the **same** reference the oracle grades it on.
- **Why NOT SSI-favouring (it cuts both ways):** the alignment does **not** read `θ_u` or any oracle label — the context-prior is SSI's **own** pre-consequence belief, computable from `(α^0, β^0, counts)`. It is a spec-faithfulness fix, not a thumb on the scale: by switching the reference it can equally make SSI **surface a non-pivotal case** it previously suppressed (a new false-positive route, hurting `VoI`/`AQ`). It removes a v1 false-negative mechanism **and** opens a new false-positive mechanism, so it can help *or* hurt; the ablation (which lacks EVSI entirely) can still win.

### A.3 [v2 CHANGE (3)] CALIBRATION SYMMETRY — SSI's `θ_surprise`/`κ` calibrated mechanically on the TRAIN split only [ARCH][GATE]

- **What changed:** SSI's two operating-point constants `θ_surprise` (S1) and `κ` (aligned-EVSI) are no longer **hand-fixed blind**; they are selected by a **mechanical, non-post-hoc TRAIN-split argmax** that maximizes SSI's **mean TRAIN composite** over the registered grid `G_θ × G_κ`, with a conservative (toward-silence) deterministic tie-break (§5.2.1). Calibration uses **only** the `"fitting-data"` stream (the SAME TRAIN cases baseline (iii)/(v) are fit on); the held-out wall on calibration is **ABSOLUTE** (§5.2).
- **The genuine unfairness it corrects (`ROOT-CAUSE-V4PRO.md`, cause 3 — calibration asymmetry):** in v1, baselines (iii) and (v) were **TRAIN-fit to their best operating points**, while SSI's `θ_surprise`/`κ` were **hand-fixed blind** — SSI competed un-tuned against tuned competitors. v2 gives SSI the **same** TRAIN-only fitting discipline its competitors already enjoy. This **equalizes** footing; it does not privilege SSI.
- **Why NOT SSI-favouring (TRAIN-optimal ≠ held-out win):** calibration touches **only** TRAIN; the two-axis held-out design (§5.1) is exactly where TRAIN-fit operating points may **fail to generalize**. Baselines (iii) and (v) — calibrated under the identical discipline — can still tie or beat SSI on held-out. SSI **never** accesses `θ_u` or any held-out label during calibration; it optimizes its own §6 composite on TRAIN, the same oracle labels every method's TRAIN fit may use. Mechanical and pre-registered (grid + objective + tie-break fixed before any data), so it is the **antithesis** of post-hoc tuning.

### A.4 [v2 CHANGE (4)] S6/AQ HANDLING — mandatory-safety surfacings excluded from the composite, scored in a separate `MS` bucket, identically for all methods [ARCH][GATE]

- **What changed:** S6-forced **safety-class** cases (`D_u^{safety}`) are **excluded** from the AQ/US/VoI composite and scored in a **separate mandatory-safety compliance bucket `MS`** (§4.4, §6.1.1). The partition `D_u = D_u^{disc} ∪ D_u^{safety}` is **oracle/signature-defined and method-independent**, applied **IDENTICALLY** to SSI and all five baselines.
- **The genuine mis-specification it corrects (`ROOT-CAUSE-V4PRO.md`, metric mis-charge):** v1's `AQ` (balanced accuracy of `surface` vs `ws`) charged a **mandated** safety surfacing whose discretionary `ws = 0` as an **abstention false-positive**, penalizing **any** method that obeys the safety rule. A mandatory surfacing is **not** a discretionary salience error and must not count against abstention quality.
- **Why NOT SSI-favouring (applies to every safety-obeying method):** the mis-charge applied to **any** method that surfaces the safety family, not uniquely to SSI; removing it for **everyone** corrects a *shared* error. A baseline (e.g. the generic linter) that also surfaces the safety family benefits **identically**. `MS` is **reported, not gated** (it adds **no** §9 branch and does **not** enter the §6.4 composite), so the composite — where SSI's EIG/VoI claim actually lives — judges discretionary salience exactly as in v1, with **unchanged weights**.

### A.5 What did NOT change (pointer) [GATE]

Everything else is **carried verbatim from v1** — the generative world + oracle (§2), the five-baseline ladder roles (§3), the composite weights, the held-out two-axis design, `N = 12`, the exact statistical test, the G1B-MV structure, and the §9 decision rule. The exhaustive list of preserved invariants is **§B (ANTI-RIGGING INVARIANTS)**. **No fifth change exists**; this list (A.0–A.4) is closed.

---

## B. ANTI-RIGGING INVARIANTS (what stayed identical — the audit the verifier checks)

> *[v2 note: this section enumerates the v1 properties that v2 **preserves unchanged**, so an independent verifier can confirm the four permitted changes (§A) did **not** silently weaken the falsifier, ease SSI's bar, or remove a path to SSI losing. The load-bearing invariant is **B.10**: it must remain structurally POSSIBLE for SSI to LOSE. Every item below is a falsifiable audit point.]*

### B.1 Same synthetic generative world + ground-truth oracle/labels [GATE]

- §2 (latent axes, context variables, correlated-axis structure, consequence→likelihood mapping, the oracle `worth_surfacing` and `answer_changes_IR`) is **carried VERBATIM from v1** (§2 [v2 ANTI-RIGGING banner]). **No v2 change touches the generative truth or the oracle labels.** The four changes are confined to **how SSI reasons** (its posterior, its EVSI reference, its TRAIN-split calibration) and to **how a mandatory-safety case is scored** — never to the world being measured. A new seed (§A.0) draws a fresh sample from the **same** distribution, not a different distribution.

### B.2 SSI never accesses oracle labels or `θ_u` [GATE]

- SSI consumes **only** fossils (§2.3) and its registered constants. It **never** reads `θ_u`, `worth_surfacing`, or `answer_changes_IR`. **[v2 CHANGE (2)]** the aligned-EVSI context-prior is SSI's **own** pre-consequence belief (from `α^0, β^0, counts`), not an oracle label. **[v2 CHANGE (3)]** TRAIN calibration optimizes SSI's own §6 composite on the TRAIN split — the same oracle labels every method's TRAIN fit may use — and **never** touches held-out labels. This invariant is unchanged and is asserted in the harness (`HARNESS-SPEC-v2.md`).

### B.3 All five baselines retained, with the user-aware linter as a genuine strong train-fit competitor [GATE]

- The §3 ladder is intact: (i) silent Route-2, (ii) generic linter, (iii) **user-aware heuristic linter**, (iv) LOO classifier, (v) EIG/VoI-ablation. **Baseline (iii) remains a deliberately STRONG competitor** — best-achievable heuristic fit on the TRAIN split, allowed coarse context features, denied only the calibrated-posterior+EIG/VoI machinery (§3.3). Under [v2 CHANGE (3)] SSI now shares (iii)'s TRAIN-calibration discipline, so a **baseline-(iii) win remains fully possible** (§3.3, §3.6). No baseline was weakened.

### B.4 Composite weights identical [GATE]

- `(w_AQ, w_VoI, w_US) = (0.40, 0.40, 0.20)` — **unchanged from v1** (§6.4, §7.1). Primary mass on abstention quality and answer-changing VoI; usefulness secondary. **[v2 CHANGE (4)]** does **not** alter the weights — it only scopes which cases enter the composite (discretionary only), with safety compliance in the separate, **non-gated** `MS` bucket.

### B.5 Held-out two-axis design + train/test wall identical [GATE]

- §5.1's two-dimensional holdout — **HELD-OUT consequence FAMILIES** × **held-out CONTEXT combinations** (incl. the canonical grit-user-in-clean-mastering cell) — is **unchanged**. The §5.2 train/test **wall is ABSOLUTE and unchanged**: the holdout partition is committed first (`"holdout-partition"` stream), all fitting/calibration runs before evaluation, and **no method or calibration step may read a held-out label** (§5.2 no-peeking, §5.2.1 [GATE]). **[v2 CHANGE (3)]** calibration lives **entirely inside** this wall (TRAIN-only) and may **never** touch held-out — any violation **invalidates the run**.

### B.6 Metric core definitions identical (modulo the principled S6 fix) [GATE]

- `AQ` (balanced accuracy vs `ws`), `US` (precision vs `ws`), `VoI` (precision vs `vc`), and the §6.4 composite are the **v1 estimators verbatim** (§6 [v2 banner]). The **only** metric change is [v2 CHANGE (4)]: S6-forced safety cases are computed over `D_u^{disc}` and scored separately in `MS` — applied **identically to every method**, leaving the discretionary-salience measurement exactly as in v1.

### B.7 N, the exact test, and FWER control identical [GATE]

- `N = 12` synthetic users (pilot floor `≥ 8`); the **paired sign-flip permutation test** (exact `2^12 = 4096` enumeration, one-sided, SSI > baseline); the `δ_composite = 0.05` margin; and **Holm–Bonferroni step-down FWER at α = 0.05** over the five baselines — **all unchanged from v1** (§7). H1 requires beating **all five** simultaneously by the margin at Holm-adjusted significance. The H-NC negative-control guard (specificity `≥ 0.80` / FP-interruption `≤ 0.20`) is also **unchanged** (§7.6).

### B.8 G1B-MV sub-gate applied to the coupled model — coupled model can STILL FAIL MV [GATE]

- The G1B-MV structure (PPC discrepancy `T_assoc`, three-way model comparison, `τ_MV = 0.02` nats/obs, `4·SE` reliability bar) is **carried from v1** (§8). **[v2 CHANGE (1)]** the model **under test** is now the sparse-pairwise-**coupled** model `M-cpl`, compared against a **richer hierarchical** `M-hier` and the factored `M-fac` reference. **The coupled model can still FAIL MV** (PPC rejection, or a materially-better hierarchical model) → `MV-FORCE-COUPLE` → **FAIL-MV** if the remedy is not applied (§8.3, §9.2). SSI gets **no pass** on its own (now coupled) modelling assumption.

### B.9 §9 ordered decision rule identical [GATE]

- The §9 branches are **structurally identical to v1**, evaluated top-down, first-match-wins: **(1) FAIL-MV → (2) FAIL-descope(Decision #5) → (3) FAIL(general) → (4) PASS**. The ablation-tie (SSI ⊀ baseline (v) by margin@significance) still routes to **FAIL-descope** *before* the generic H1 fail. Verdict labels, order, and actions are unchanged. The only shift is that an `MV-FORCE-COUPLE` remedy now means a **further** (hierarchical/extra-coupling) step, because coupling is already SSI's registered model.

### B.10 It must remain POSSIBLE for SSI to LOSE (the load-bearing anti-rigging invariant) [GATE]

- **None of the four changes removes a path to SSI losing.** Concretely, after all four changes:
  - **Baseline (v) (now equally coupled)** can still **tie or beat** SSI if EIG/VoI is non-load-bearing — that fires **H0-ablation → FAIL-descope(Decision #5)** (§1.3, §3.6, §9.2). Indeed, sharing the coupled posterior makes an ablation tie a *stronger, harder-to-argue* descope signal than v1.
  - **Baseline (iii) (now on equal TRAIN-calibration footing)** can still **tie or beat** SSI — that defeats H1 (§3.3, §3.6).
  - **The coupled model can still FAIL G1B-MV** → FAIL-MV (§B.8).
  - **The aligned EVSI (§A.2) can hurt** (new false-positive route) as well as help, and **TRAIN-optimal calibration (§A.3) carries no held-out guarantee**.
- Per **DECISION-BRIEF-D5 Option B**: this is the **ONE** disciplined retry. If SSI still loses to the ablation under this *fair, MV-remedied* test, the falsification is **accepted — no further retries**. The world (§2) and oracle are unchanged; the §2.6 / §3.6 promise that *a model under which SSI cannot lose is a falsifier-defeating fraud* remains operational after every v2 change.

### B.11 No results in this phase [GATE]

- This document is a **pre-registration LOCK**: it computes **no** metric, runs **no** experiment, and reports **no** number. Every threshold, weight, seed, and rule is fixed **before** any v2 result exists (§9.4). The companion `HARNESS-SPEC-v2.md` is an implementation **blueprint** (declare-only, no code, no run).

---

> **[Task-3 boundary]** This edit appends the two required closing sections: **§A CHANGES FROM v1** — the **closed** list of exactly the four permitted principled changes (§A.1 sparse-pairwise coupling on SSI **and** the ablation; §A.2 aligned EVSI context-prior baseline; §A.3 TRAIN-split `θ`/`κ` calibration symmetry; §A.4 S6/AQ mandatory-safety fix) plus the **new** `SEED_MASTER = 0x5551B_0002` (§A.0), each justified as a principled correction of a genuine unfairness/mis-specification from `ROOT-CAUSE-V4PRO.md` and shown **NOT SSI-favouring**; and **§B ANTI-RIGGING INVARIANTS** — the audit of what stayed identical (same world+oracle B.1, SSI never reads labels B.2, all five baselines retained with the strong user-aware linter B.3, composite weights B.4, held-out two-axis design+wall B.5, metric cores modulo the S6 fix B.6, `N = 12`+permutation+Holm B.7, G1B-MV on the coupled model which can still fail B.8, §9 decision rule B.9, the load-bearing **SSI-can-still-LOSE** invariant B.10, and no-results B.11). **`PRE-REGISTRATION-v2.md` is now complete.** The companion `HARNESS-SPEC-v2.md` (declare-only blueprint) is produced by task-4. **No results are produced in this or any phase task.**
