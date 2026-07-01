# C2 — Adversarial Critique of S2-codex.md

**Critic:** C2 (Opus 4.8), adversarial critic
**Target:** `syntheses/S2-codex.md` (GPT-5.5 Codex candidate plan)
**Basis:** Handoff + R1/R2/R3/R4 dossiers, `RUN_20260629-214123`
**Stance:** Attack-only. The plan gets stronger from a successful attack. I do not default to agreement.

**One-line verdict:** S2 is a competent, well-structured plan that is *honest about its thin-evidence items* — but it commits two architecture-level errors that strike the SSI claim at its root (the §3c "by construction" gap and the salience-MVP-cannot-compute-its-own-schema gap), and it *imports* the §6.1 un-run attack from the dossiers and declares it run. Those three are the load-bearing failures. Several sequencing and reload-mechanics errors compound them.

---

## ATTACK 1 — The §3c coherence leak is closed by VALIDATION, not by CONSTRUCTION. This breaks the central SSI claim.

**Target:** §0.2, §3.1, §3.3–§3.5, §6.2 official formulation.

**The claim S2 makes:** "Coherence is guaranteed by clamped construction, not by making every raw primitive composition valid" (§0.2). "The harness may only construct the coherent refinement of the raw primitive algebra" (§6.2). S2 calls the IR layer "the smart-constructor layer" (§3.1).

**The mechanism S2 actually specifies:** A pipeline — `SSI DAW IR transaction → Clamp verifier + salience scanner → Cmajor source emitter` (§3.1). Clamp 1 (Causality) is implemented as: "Run cycle detection on the IR before emission. … If delay is zero, do not emit the graph" (§3.3). That is a **gate between the IR and emission**: the IR can hold a zero-delay cycle; a verifier pass catches it; emission is refused.

**Why this is fatal, not cosmetic.** The handoff is emphatic and explicit (§1): SSI's teleological invariant "is *not* a check a run is measured against after the fact. It is a constraint structure the user builds *within* — enforced by construction, the same way piNen's `SpawnGuard` makes unbounded spawns unconstructable. An instrument that violates the scale isn't a bad instrument; it's not buildable on those primitives at all." `SpawnGuard` does not let you *express* an unbounded spawn and then reject it — the API clamps the value so the unbounded spawn is **unrepresentable**. S2's clamp verifier is the opposite pattern: construct-freely, validate, reject. That is precisely the "post-hoc predicate over a free type" architecture, and the handoff named that architecture as *not* SSI. R1 even named the correct pattern — "smart constructors … guarantee membership in T_coherent" — but S2 implements a validation function, not smart constructors, and conflates the two under one label.

**Concrete failure artifact:** A patching-UI session. The user drags a wire output(B)→input(A) where A→B already exists, zero delay. In the SSI-by-construction design, the `addRouteEdge` constructor refuses the edge (or demands a delay argument) at the moment of the gesture — the cycle is never representable in the IR. In S2's design, the IR accepts the edge, the transaction completes, and only at the `Clamp verifier` stage before emission is it rejected. Between gesture and emission the system holds an incoherent IR state — and any feature that reads the IR before the verifier runs (salience scanner, dialogue, UI rendering, fossil commit) is reading an incoherent graph. The §3c leak is open inside the IR; it is merely papered over at the emission boundary.

**Severity: BLOCKER** (for the SSI claim's integrity; MAJOR for the build). This is the exact crux the handoff flagged and the exact thing the brief asked to be tested against "by construction, not by runtime check."

**Fix the plan must adopt:** Commit, in writing, that the IR's constructors are **total over coherent states only** — i.e., `RouteEdge`/`addRouteEdge` cannot be called in a way that closes a zero-delay cycle (the constructor takes a delay or refuses); `ScheduleEntry` cannot be placed into an ambiguous overlap without a summing bus; etc. The clamp *verifier* is then belt-and-braces (catching generator bugs), not the primary coherence mechanism. Incremental cycle-checking at edge-construction time is implementable (one edge at a time in a UI), so this fix is concrete, not aspirational. Phase 2's deliverable must be re-specified from "clamp verifier" to "clamped IR constructors + verifier as cross-check," and the milestone M1 must read "zero-delay cycle is **unrepresentable** in the IR," not "caught by piNen before Cmajor."

---

## ATTACK 2 — The salience MVP cannot compute the salience schema it specifies. Route 1 ships as a linter-with-a-preference-flag, and the falsifier is too weak to notice.

**Target:** §4.3 (intent model = "rule/weight/evidence"), §4.4 (salience record with `surprise_score`, `voi_score`, `eig_score`), §6.6 (start rule-based), §10.7 (falsifier), §11e of the handoff.

**The contradiction.** §4.4's salience record requires `surprise_score: estimated belief shift under current intent model` and `eig_score: how much would this answer improve the intent model`. Per R3, surprise is **KL(P(Intent|C) ‖ P(Intent))** and EIG is **H(θ) − E[H(θ|x)]** — both are operations over a *probability distribution* `P(Intent)`. But S2's chosen MVP intent model (§4.3, §6.6) is a **rule/weight/evidence** structure ("user prefers saturation before filter (3 confirmations)"). You cannot take a KL divergence or an entropy reduction of a rule list. R3 said this explicitly: "Computing KL divergence over a distribution of DAW-intent models in real-time requires efficient representation. A full Bayesian network over 100+ preference dimensions is expensive. The MVP must use a simpler representation and accept approximation error."

**What that means in practice.** With a rule-weight model, the salience scores collapse to thresholded heuristics on (consequence-type, preference-flag): "if consequence ∈ {aliasing, clipping} and `user_grit_weight` < 0.5 → ask." **That is a linter with a personalization flag.** It is exactly the handoff's named failure mode (§11e): "shipping a linter and calling it dialogue." S2 dresses the linter in Bayesian-surprise vocabulary (§4.4) that its own MVP substrate cannot evaluate. The gap is never acknowledged — S2 treats the schema and the MVP representation as compatible when they are not.

**The falsifier is unfalsifiable as written.** §10.7: "Route 1 remains a linter/checklist even after calibration." There is no operational definition of "is a linter" vs "is salience." Worse, S2's chosen metric is **regret** (§4.5.7): "If users repeatedly say surfaced questions were unnecessary, thresholds are too low." A *well-tuned linter with good default thresholds* passes a low-regret test. Regret measures annoyance, not intent-coupling. So the only safeguard against the project's single most-likely-to-fail-quietly risk cannot detect the failure.

**Concrete failure artifact:** Ship Phase 6 with the rule-weight model. Hand-code two persona fixtures (grit-user suppresses aliasing, clean-user asks). Phase 6 M2 passes. Phase 9 regret metric is low because thresholds were tuned. Everyone declares salience works. But the mechanism is `if grit_weight high: suppress(aliasing)` — a hand-coded rule per consequence type. It has zero generalization to a consequence type nobody hand-coded a rule for. The product is a linter and the falsifier never fired.

**Severity: BLOCKER** for the central product risk (MAJOR at minimum).

**Fix the plan must adopt — two parts:**
1. **Resolve the representation/schema mismatch.** Either (a) commit to a probabilistic intent representation from the start so surprise/EIG are genuinely computable (and pay the cost R3 priced), or (b) honestly relabel the MVP salience as *heuristic* and stop using KL/EIG vocabulary that the substrate can't evaluate. No middle ground that lets a rule-weight model masquerade as Bayesian salience.
2. **Add a discriminating falsifier that a linter cannot pass.** R3 gave it: the SAME mechanism, with NO consequence-type-specific rule added, must produce different salience for a consequence type it was *not* hand-tuned for, across two fossil histories. The two-persona test must use a *held-out* consequence type (one never used in calibration) — otherwise it tests hand-coding, not salience. Make this the gate, not a milestone, and make it run BEFORE committing to the Phase 4–6 build (see Attack 5).

---

## ATTACK 3 — The §6.1 un-run attack was not run. S2 imports R1/R4's reductions and declares closure, and it never analyzes closure for the intent/arrangement domain it makes the product center.

**Target:** §1 §6.1 ("Verdict on the un-run attack: Closure holds. No breaking artifact was found"), §2, §10.1.

**Two distinct attacks here.**

**3a — The "attack" is a citation, not a run.** The handoff §6.1/§8 was explicit: "Do not let §6.1 be skipped. It is the most load-bearing unresolved question and the most likely to be glossed," and "The right output is either 'closure holds, here's the proof sketch' or 'here's the artifact that breaks it.'" S2's "proof sketch" (§1 §6.1) is a near-verbatim restatement of R1's reductions plus R4's interaction-model reductions. S2 adds no new adversarial probe. The phrasing "No breaking artifact *was found*" smuggles a completed search (research execution) into the plan as settled — when the planning brief's job was to keep attacking. Phase 0 "ratifies" the stance; no phase actively tries to break closure with an artifact *not already in R1/R4*. The most load-bearing question is closed by import.

**3b — The deeper, genuinely un-run attack: the intent/arrangement domain has zero closure analysis.** The handoff anticipated the most dangerous outcome precisely (§6.1): "a fifth primitive that is about the user's working history, not about sound — which would be a very SSI-shaped discovery (intent becoming primitive)." Both R1 and S2 wave this away with the same move: "the fossil record is harness metadata, it reduces away" (S2 §1 §6.1 bullet "Fossil record"; §2 closure type). **But S2 then makes the intent model the literal center of the product** — everything in §4 and §5 computes over it; salience (the SSI-defining feature) is *defined as* a function of it (§4.4). You cannot have it both ways:

- If the fossil/intent layer is "mere harness metadata that reduces to the four primitives," then it is not load-bearing and salience has nothing rich to compute over (contradicting Attack 2's requirement).
- If the intent model is rich enough to drive salience (S2's whole §4), then it is a first-class structure with its own ontology — and S2 provides **no primitive set, no closure claim, and no completeness analysis for it**. The SSI load-bearing condition (handoff §1: "the invariant holds by construction only if the domain's primitive set is genuinely closed and complete") is satisfied for the *signal* domain and silently abandoned for the *intent* domain that the product is actually built around.

S2's "domain" quietly shrank from "the DAW" to "the signal domain," excluding the very layer where the product lives. That is the un-run attack, still un-run, relocated.

**Concrete failure artifact:** Ask S2's framework "what are the closed, complete primitives of the fossil/intent layer, and what is the breaking artifact for *that* set?" There is no answer in the plan. `DialogueTurn`, `IntentEpisode`, `ConsequenceEvent`, `DecisionRecord` (§4.1) are listed as store entities but never argued to be closed or complete. A future intent feature (e.g., cross-user collaborative dialect, or an intent that contradicts itself context-dependently — R3's contradiction case) has no closure home.

**Severity: MAJOR** (arguably BLOCKER given the handoff's instruction not to skip §6.1).

**Fix the plan must adopt:** (1) Add a Phase 0 deliverable that runs a *fresh* §6.1 attack with at least one artifact not in R1/R4 (candidates: a stem-mastering/loudness-normalization graph whose target is relational across tracks; a spatial/ambisonic field; a collaborative authorship relation — S2 even lists these as "examples to watch" in §2 but never tests them). (2) Either explicitly state that the intent/fossil layer is a *second domain requiring its own primitive-closure analysis* (and schedule it), or prove it reduces — but you cannot make it the product center AND dismiss it as metadata. Resolve the contradiction on the page.

---

## ATTACK 4 — The reload bridge is mechanically under-specified and internally inconsistent with R2's actual API. Crossfade and tail-bridge fight each other; the design cites Patch features it must bypass.

**Target:** §0.4, §6.1 reload bridge layers, §6.2, §6.3, Phase 1 M4.

**4a — API-layer inconsistency.** S2 simultaneously (i) relies on Patch-level state preservation — "Parameter values and stored key-value state survive" (§0.4), "Restore endpoint values and stored key-values that Cmajor preserves" (§6.2 Migrate) — and (ii) requires running performers A and B **concurrently** (§6.1 layer 3: "Old and new performers run concurrently for a bounded overlap"). Per R2, the parameter-preservation and `storedState` survival are features *of the `Patch::rebuild()` → `setNewRenderer()` path*, and that path does `stopPlayback → renderer.reset()` (destroys A) → install B → `startPlayback`. **It destroys A before B exists.** You cannot run A and B concurrently *and* use the Patch helper that gives you free parameter preservation — they are mutually exclusive. A dual-Performer host must operate at the `Engine`/`Performer` level (R2: `copyOutputFrames`/`setInputFrames` exist there), which means **reimplementing parameter preservation, stored-state, manifest handling, and status callbacks yourself**. S2 never states this; it cites the free Patch benefits while requiring the path that forecloses them.

**4b — Crossfade vs tail-bridge are in direct tension and S2 conflates them.** A "short crossfade window" (§6.1 layer 3) masks the swap. A "longer decay window" tail bridge (§6.1 layer 4, §6.2) preserves a reverb tail. These pull opposite directions: the window that masks a click is short; the tail that must decay is long. Worse, the "tail bridge" runs the **whole old instrument A** (Cmajor has no "tail-only" execution mode — A is one compiled performer with fixed topology), so feeding new input into both A and B double-processes the input path, and A is the *old topology* (it lacks whatever the edit added). The "tail" you bridge is actually "the entire old instrument continuing to play the old graph." For anything but a pure parallel reverb send this is not a tail — it's a ghost of the previous instrument. S2's §6.2 "mask with crossfade/tail bridge: reverb tails, delay buffers, filter histories" promises a capability the mechanism doesn't deliver: a short crossfade truncates the tail (B starts with zero state per R2), and the long tail-bridge runs a stale full instrument.

**4c — CPU xrun risk unflagged.** Running two full graphs concurrently transiently *doubles* DSP load. For a heavy patch near the CPU budget, the reload overlap can cause an xrun (audio dropout) — the exact artifact crossfade was meant to prevent. S2 lists "tail bridge CPU cost" as a thing to *measure* (§6.3) but never names xrun-under-overlap as a failure mode or falsifier.

**Concrete failure artifact:** Edit a patch with a 4-second reverb during playback. S2's "short crossfade" fades old→new over, say, 30ms: the 4s tail is gone (B has empty reverb state). Switch to "tail bridge": A keeps running 4s — but A is the pre-edit instrument, so for 4s the user hears the *old* instrument layered under the new one, and CPU is doubled for 4s, risking dropout on a busy project. Neither path delivers "seamless reload with preserved tail."

**Severity: MAJOR.**

**Fix the plan must adopt:** (1) Specify the reload host explicitly at the `Engine`/`Performer` level and enumerate every Patch-level feature (parameter save/restore, storedState, manifest, status callbacks) that must be reimplemented; stop citing `Patch::rebuild` parameter preservation as a free benefit. (2) Separate the two mechanisms and state their distinct, limited guarantees: crossfade masks the *compile gap* for edits to the *dry/input* path; a *parallel-send tail bridge* only works when the stateful effect is on a parallel bus that the edit does not touch (so A's send can keep rendering its tail while B takes the dry path) — and say plainly that in-line stateful effects (in-series reverb/delay/filter on the main path) **will** truncate on reload in v1. (3) Add an explicit falsifier with numbers: "If concurrent dual-graph overlap causes xruns on a representative heavy patch at target buffer size, dual-buffering is impractical." Make Phase 1 M4 measure CPU-under-overlap, not just click masking.

---

## ATTACK 5 — Sequencing errors: the plan freezes the Cmajor commitment before measuring the things its own falsifiers depend on, and back-loads the highest risk (salience) to the very end.

**Target:** Phase 0 (deliverable "Cmajor commitment memo," decision gate), Phase 1, Phases 5–6, Phase 9, §10 falsifiers #3/#4/#7.

**5a — Premature commitment.** Phase 0 "Ratify the architecture contract" produces a "Cmajor commitment memo" and freezes the stance *before* Phase 1 measures reload/compile times, tests C++ export, and resolves licensing. But S2's own falsifiers #3 ("Reload cannot be masked"), #4 ("Cmajor licensing is unacceptable"), and #5 ("Cmajor's API/compiler reality diverges") depend on Phase 1 data. You cannot ratify a *commitment* in Phase 0 and then have Phase 1 potentially fire a kill-criterion against it. The executive position even asserts JIT is "fast" (§0.3) as fact — R2 explicitly flags compile time as UNKNOWN (50–500ms possible for complex patches, "Risk: MEDIUM — needs empirical measurement"). The maskable-reload thesis rests on an unmeasured premise, ratified before measurement.

**5b — The highest, most SSI-defining risk is validated last.** R3 and R4 both name salience as THE central risk (R4: "where SSI's ambition concentrates and where it's most likely to fail quietly"). S2 defers *all* salience validation to Phase 9 (musician beta), after Phases 0–8 are built. Consequence detection (the easy arithmetic part) lands in Phase 2, but the hard part — *which consequences earn a question* — gets no early de-risk. If falsifier #7 (salience fails with users) fires, it fires after the entire stack is built. There is no cheap, early salience probe, even though R3's discriminating test (two fossil histories, held-out consequence) and a Wizard-of-Oz study need *no* working DSP engine at all and could run in parallel with Phase 1.

**Concrete failure artifact:** The team executes Phases 0–8 (months of work). Phase 9 beta reveals Route 1 is perceived as a checklist (the Attack 2 linter). Falsifier #7 fires. The decision gate (§ Phase 9) says "ship Route 2 as default, Route 1 experimental" — i.e., the project's central ambition is abandoned *after* the whole build, when a paper study in week 2 would have surfaced it.

**Severity: MAJOR.**

**Fix the plan must adopt:** (1) Downgrade Phase 0's "Cmajor commitment memo" to a "Cmajor candidate decision with explicit kill criteria," and make the *commitment* conditional on Phase 1 passing reload/compile/export/license gates. Move the "JIT is fast" claim out of the executive position; mark it measured-in-Phase-1. (2) Add an early salience de-risk track, parallel to Phase 1: a Wizard-of-Oz / paper study running R3's *held-out-consequence, two-fossil-history* discriminating test with real musicians, BEFORE committing to the Phase 4–6 build. Gate the Phase 4–6 investment on that study showing intent-coupled (not type-keyed) discrimination.

---

## ATTACK 6 — Ungrounded / over-stated Cmajor capability claims presented as fact.

**Target:** §0.3, §6.2 "Migrate," §6.5.

**6a — "JIT-compile it (fast — that's what the JIT is for)" (§0.3).** Stated as fact in the executive position. R2: compile time is unmeasured, possibly 50–500ms for complex patches, flagged MEDIUM risk needing a spike. S2 *does* hedge it later (§6.3 "Evidence is currently thin on actual Cmajor compile times") — which makes the executive-position assertion an internal contradiction. **Severity: MINOR-to-MAJOR** (MAJOR because the maskable-reload thesis depends on it). Fix: strike "fast" from §0.3; state it as a Phase-1 measurement with a numeric gate.

**6b — "Migrate … LFO phase if generated modules expose it as endpoint/state" (§6.2).** R2 is explicit: LFO phase, oscillator phase, filter histories, accumulators are internal Performer state, **zero-initialized on rebuild, not preserved**. The only survivors are parameter values and `storedState` key-value pairs on the Patch object. "Expose LFO phase as endpoint/state and round-trip it across reload" is **not a demonstrated Cmajor capability** — it would require reading phase out of Performer A before destroying it and writing it into B's externals, with per-frame DSP state that R2 did not establish is round-trippable. S2 presents this as a conditional ("if … exposes") that smuggles an undemonstrated capability into the "Migrate" column. **Severity: MAJOR** (it's listed under "Migrate," implying solved, when it's unestablished). Fix: move LFO/oscillator phase to the "Mask, cannot migrate in v1" column, consistent with R2; remove the "if exposed as endpoint/state" hedge unless a spike demonstrates it.

**6c — Reflexivity (§6.5) is, to S2's credit, correctly grounded** in R2 (endpoint introspection sufficient; internal connection graph owned by piNen because it generates source). No attack here — noted so the must-fix list stays honest.

---

## ATTACK 7 — Falsifiers and gates lack numeric thresholds; several are reactive, not procedural.

**Target:** §10.1, §10.3, §10.7; Phase decision gates.

- §10.3 "Reload cannot be masked" — no number for "masked." Acceptable gap? Acceptable CPU overlap? S2 §6.3 targets are qualitative ("perceived as seamless"). A falsifier without a threshold cannot fire. **MINOR-MAJOR.** Fix: state numeric gates (e.g., "compile+swap > X ms for a Y-processor graph, or dual-graph overlap causes xruns at buffer size Z → fail").
- §10.1 "A fifth primitive is discovered" — passive; no active search procedure (see Attack 3). **MAJOR.**
- §10.7 salience falsifier — no operational definition; regret metric can't detect a linter (see Attack 2). **BLOCKER-feeding.**

**Fix:** Every falsifier gets either a number or a named test procedure. A falsifier you cannot operationalize is decoration.

---

## ATTACK 8 — "Route 1 avoiding Clippy" (§4.5) is a list of aspirations, not enforced mechanisms.

**Target:** §4.5 rules 1–7.

Rules like "Ask only when the answer changes the build" (rule 1) and "Measure regret" (rule 7) are good *principles* — but they are restatements of VoI and active-learning, and **computing them requires the very intent model that Attack 2 shows the MVP can't evaluate.** A linter could also claim "I only warn when it matters." Nothing in the architecture *enforces* rule 1; it's a hope. The handoff's whole point (§11e) is that the *mechanism* must distinguish discovery from interrogation — a list of product rules is not a mechanism.

**Severity: MAJOR** (compounds Attack 2). **Fix:** Tie each §4.5 rule to an enforceable computation in the intent model, or relabel them as design heuristics and stop presenting them as the anti-Clippy guarantee.

---

## What S2 gets RIGHT (so the must-fix list stays calibrated)

- §6.4 (topology morphing = edit-time) and §6.7 (Cmajor dependency, C++ export, EULA §7.1 termination, legal gate) are correctly grounded in R2/R4 and honestly stated.
- §6.3's *diagnosis* (state not preserved, reload audible by default) is correct and well-sourced. The *solution* is where it breaks (Attack 4).
- §6.5 reflexivity stance is sound.
- The two-source seam (piNen IR authoritative for topology, Cmajor compiled view authoritative for what ran; mismatch blocks reload) is a genuinely good, grounded design.
- The plan is honest about thin-evidence items and does not (in the deliverable itself) smuggle execution — it is a planning artifact throughout. The smuggling that exists is epistemic (importing R1/R4's §6.1 search as a "run," Attack 3), not procedural.

---

## PRIORITIZED MUST-FIX LIST

1. **[BLOCKER] Close §3c by construction, not by validation (Attack 1).** Re-specify the IR so incoherent states (zero-delay cycles, ambiguous schedule overlaps) are *unrepresentable* via total smart constructors; demote the clamp verifier to belt-and-braces. Rewrite Phase 2 M1 to "zero-delay cycle is unrepresentable in the IR." Without this, the "coherent by construction" SSI claim is false and the plan is a generate-validate-reject pipeline the handoff explicitly rejected.

2. **[BLOCKER] Resolve the salience schema/representation mismatch and add a linter-proof falsifier (Attack 2).** Either commit to a probabilistic intent representation (so KL-surprise/EIG are computable) or stop using that vocabulary. Replace the regret-only falsifier with R3's held-out-consequence, two-fossil-history discrimination test, run as a *gate before* Phase 4–6. This is the project's defining risk; its only current safeguard cannot detect failure.

3. **[MAJOR/BLOCKER] Actually run the §6.1 attack and analyze closure for the intent/arrangement domain (Attack 3).** Add a Phase 0 fresh attack with an artifact not in R1/R4 (mastering/loudness-relational, spatial field, collaborative authorship). Resolve the contradiction: the intent model cannot be both "mere metadata that reduces away" and "the structure the entire product computes over." If it's the product center, it needs its own primitive-closure analysis or an explicit "second domain, scheduled" admission.

4. **[MAJOR] Re-specify the reload bridge against R2's real API (Attack 4).** Locate it at Engine/Performer level; enumerate the Patch features being reimplemented; separate crossfade (masks compile gap on the dry path) from a parallel-send-only tail bridge; state plainly that in-series stateful effects truncate in v1; add a CPU-xrun-under-overlap falsifier with numbers (Phase 1 M4).

5. **[MAJOR] Fix sequencing: conditional Cmajor commitment + early salience de-risk (Attack 5).** Downgrade Phase 0's "commitment memo" to "candidate + kill criteria," contingent on Phase 1 gates; move the "JIT is fast" claim to a measured Phase-1 result. Add a Wizard-of-Oz salience study parallel to Phase 1, gating the Phase 4–6 build.

6. **[MAJOR] Correct ungrounded capability claims (Attack 6).** Strike "fast" from §0.3 (mark measured-in-Phase-1). Move LFO/oscillator phase from "Migrate" to "cannot migrate in v1," consistent with R2.

7. **[MAJOR] Make anti-Clippy rules enforceable (Attack 8).** Bind each §4.5 rule to an intent-model computation or relabel them as heuristics; they are not the guarantee they're presented as.

8. **[MINOR-MAJOR] Put numbers/procedures on all falsifiers and gates (Attack 7).** Especially "reload masked" (numeric) and "fifth primitive discovered" (active procedure, folded into fix #3).

**Bottom line:** S2's diagnosis layer is strong and honest; its *resolution* layer fails at the two points where SSI actually lives — coherence-by-construction (#1) and salience-as-genuine-intent-coupling (#2) — and it declares the most load-bearing open question (#3) closed by citing prior research rather than attacking it. Fix 1, 2, and 3 are non-negotiable before this plan can claim to be an SSI plan rather than a well-engineered generate-validate DAW with a personalized linter.
