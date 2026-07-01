# C3 Final Red-Team Critique — Attack on S3 Merged Plan

**Role:** FINAL RED-TEAM critic C3 (GPT-5.5 Codex)  
**Target:** `syntheses/S3-merged.md`  
**Posture:** last adversarial pass before lock. S3 is much stronger than S1/S2, but several “resolved” fixes either created new back doors or made success too easy to declare. I do not grant closure because the resolution table says “incorporated.”

**Overall verdict:** **S3 is not yet a robust plan of record.** It is close, but it still has open blockers in exactly the dangerous places: the “by construction” IR still has cross-rate/runtime-parameter escape hatches; the intent domain knowingly carries an `authority` breaker while claiming closure-hypothesis sufficiency; and the salience falsifier can be passed by a two-feature user-aware linter. The final planner must close these before freezing the build plan.

---

## Finding 1 — The Coherent Patch IR’s causality constructor does not close cross-rate sidechain/control feedback

**Target:** S3 §4.1 Clamp 1, §4.2 guard placement, §5.6 consequence mapping, §10 falsifier #3.

**Concrete failure artifact/scenario:**

Build a primitive-legal patch:

```text
Oscillator.audio -> Distortion.audioIn -> MainBus.audio
MainBus.audio -> EnvelopeFollower.streamIn -> Distortion.driveValue
```

This is a feedback cycle through a sidechain/control path: `Distortion -> Bus -> EnvelopeFollower -> Distortion parameter`. S3 says signal and control are the same primitive distinguished only by rate (§10b inherited from handoff; S3 §3/§7), but its causality smart constructor is described as `connect(src,dst)` for forward edges and `closeFeedbackLoop(path, delay: PositiveNat)` only for explicit graph back-edges. It never states that **value/event/control edges, stream→value conversions, sidechains, and parameter modulation edges participate in the same incremental cycle detector with declared effective latency**.

S3 mentions sidechain/control-rate conversion taps only under the amplitude/NaN net (§4.2), not under causality. That leaves a back door: the UI/harness can construct what looks like forward audio routing plus a forward sidechain, while the full dependency graph has a zero-latency loop. Cmajor may or may not reject a particular emitted form, but then the compiler is the primary catch; the IR was not “coherent by construction.”

**Severity:** **BLOCKER** for the “zero-delay cycles are unrepresentable” claim.

**Required fix:**

- Define the IR dependency graph over **all endpoint classes**: audio streams, value/control endpoints, event endpoints, sidechains, buses, rate converters, and schedule/control edges.
- Require every transform and rate-converter manifest to declare **effective latency** and whether an output depends on the current-frame value of each input.
- Make `connect()` total only if adding the edge preserves acyclicity in this full dependency graph, unless the cycle contains an explicitly typed `Delay >= 1 sample` on the dependency path.
- Add a G2 adversarial test specifically for audio→control→audio feedback and sidechain self-modulation, not only obvious audio-edge cycles.

---

## Finding 2 — Runtime parameter changes can violate constructor-time invariants after the IR is built

**Target:** S3 §4.1 `PositiveNat`, §4.2 amplitude residual, §6.1 Tier 0 live parameters, §9 Phase 1A/2.

**Concrete failure artifact/scenario:**

A feedback-delay transform is admitted with a legal static graph delay, but exposes live parameters:

```text
delaySamples: 0..48000
feedbackGain: 0..1.25
```

At construction time the patch is accepted. At runtime, Tier 0 parameter updates (`setInputValue`/ramps) set `delaySamples = 0` or `feedbackGain >= 1`. The patch crosses from coherent to incoherent **without any IR constructor running**. S3’s `PositiveNat` only protects the explicit graph-cycle delay argument; it does not protect module-internal effective delay or feedback parameters. The amplitude net may contain NaN/runaway after the fact, but that is containment, not construction.

This is not hypothetical. R2 confirms live endpoint values and ramps are normal runtime operations. S3 relies heavily on parameter-class edits to avoid reload (§6.1 Tier 0). If parameter setters are not themselves refinement constructors, Tier 0 becomes a raw escape hatch around the Coherent Patch IR.

**Severity:** **BLOCKER** for implementation non-bypass and “incoherent is unrepresentable.”

**Required fix:**

- Treat every live parameter write as a **typed constructor transaction**, not a raw Cmajor endpoint write.
- Module manifests must specify refined parameter domains: `DelaySamples >= 1` when participating in a feedback path; feedback-gain stability ranges; oversampling/rate constraints; invalid combinations.
- Parameter ramps must be checked over the whole path, not just endpoint values, so a ramp cannot pass through zero delay or unsafe ranges.
- G2/G1A must test runtime attempts to drive parameters across invariant boundaries and verify they are clamped/refused before reaching the Performer.

---

## Finding 3 — `transform: schedule -> schedule` is closure-critical, but S3 gives no by-construction monotonicity contract for dynamic schedule transforms

**Target:** S3 §1.1 signal closure, §4.1 Clamp 3, §4.4 constraint-precedence solver.

**Concrete failure artifact/scenario:**

A schedule transform represents tempo/warp/section movement. It is parameterized by automation or an LFO-like control source:

```text
warp(t_project) = anchor + stretchRatio(t) * (t_project - anchor)
stretchRatio is live-controllable and can become <= 0
```

The original schedule placement may be well-formed, but at runtime the transform can produce a non-monotone or zero-duration mapping: later project time maps before earlier project time, warp anchors cross, or section windows invert. S3 says “project time is a monotone non-decreasing function” (§4.1), but does not specify a smart constructor/refinement type for schedule transforms themselves. Because R1’s signal closure depends on **transform polymorphic over schedule**, this is not peripheral; it is the exact amendment that saved closure.

The mandatory summing bus resolves audio-output overlap. The constraint-precedence solver resolves normative conflicts. Neither makes an arbitrary `schedule -> schedule` transform monotone by construction.

**Severity:** **MAJOR/BLOCKER** depending on whether schedule transforms are v1-editable. It is a blocker for the formal closure/coherence claim.

**Required fix:**

- Define schedule-transform contracts: monotone mapping, positive duration, anchor preservation, invertibility where required, sample-time vs musical-time semantics.
- Require schedule-transform constructors to prove/check these contracts over the full parameter domain, or restrict v1 to a small certified family of monotone transforms.
- Add adversarial tests for tempo=0, negative stretch, crossing warp markers, conflicting anchors, and runtime parameter ramps through invalid schedule states.

---

## Finding 4 — Nested modules remain a raw escape hatch unless “experimental” modules are excluded from coherence claims

**Target:** S3 §5.5 module manifests/admission, §9 Phase 3, §2 non-bypass invariant.

**Concrete failure artifact/scenario:**

User asks for “a chaotic shimmer reverb with self-modulating diffusion.” The agent authors a Cmajor processor. It compiles, has endpoint annotations, and is admitted as **experimental**. Internally it contains undocumented current-frame dependencies, unstable allpass feedback for some parameter ranges, misleading latency metadata, or aliases heavily despite a manifest claiming otherwise.

S3 says only manifest-bearing transforms are referenceable in the IR, but an experimental module with an unverified or wrong manifest is still a manifest-bearing transform. The Coherent Patch IR then treats it as an atom. This creates a raw semantic escape hatch: the IR is coherent only if module manifests are true, but S3 allows user-audible experimental modules before that truth is established.

Cmajor’s compiler helps with stack safety and graph-level zero-delay cycles (R2), but R2 explicitly does not establish finite amplitude, truthful spectral behavior, or semantic “can answer why” properties.

**Severity:** **MAJOR**; **BLOCKER** if experimental modules can participate in patches claimed coherent-by-construction.

**Required fix:**

- Separate **compile-admitted** from **coherence-admitted**. Experimental modules may run only in a sandbox/disclosed preview mode and must not be counted in the “by construction” invariant.
- Require at least “guarded” admission before a transform can be used in normal coherent IR generation.
- Make manifest truth part of verification: generated tests must falsify latency, dependency, parameter range, NaN, denormal, rate, and aliasing claims.
- G3 must include a malicious/incorrect-manifest module and prove the system refuses to certify it.

---

## Finding 5 — Naming `authority` as an open breaker does not rescue intent closure; the breaker is already inside v1 constraints

**Target:** S3 §1.3 authority residual, §1.5 intent verdict, §4.4 constraint-precedence solver, §10 falsifiers #1–2.

**Concrete failure artifact/scenario:**

S3 says cross-user normative authority is an open attack surface but “for single-user v1 it does not bite” (§1.3). That is too narrow. Authority appears in single-user v1 immediately:

- The same user has multiple roles/personas: “artist me wants the clipping; mastering me wants clean -14 LUFS.”
- A project template or imported reference imposes constraints that conflict with the current prompt.
- A safety/substrate rule overrides a user constraint (“never clamp my feedback”).
- A prior explicit project constraint conflicts with a later ambiguous prompt.
- A constraint has a “precedence rank” (§4.4), but **who or what authorizes that rank?**

The precedence solver smuggles authority in as a field. If `constraint` requires source/actor/role/ownership/trust/authority to determine precedence and revocation, then either authority is a fifth primitive or a required field as load-bearing as identity is for reference. S3 gave identity this treatment; it refuses to give authority the same treatment.

This matters because the intent domain is now the product center. If the plan knowingly carries an unhandled primitive breaker in the product-center domain, it cannot honestly claim even provisional closure without sharply scoping the claim.

**Severity:** **BLOCKER** for SSI framework honesty and the intent-domain closure claim.

**Required fix:**

Choose one:

1. Add **authority/source/actor** as a fifth intent primitive, or as an explicit required field folded into `constraint` with the same status identity has inside `reference`; define preservation, precedence, revocation, delegation, and conflict rules; **or**
2. Narrow v1 and the plan language: “intent closure is not claimed; v1 supports only single-actor, single-authority constraints,” and remove “closed hypothesis” rhetoric from the product-center domain.

G0 must fail if authority is required for any v1 artifact, not merely if cross-user collaboration appears.

---

## Finding 6 — The factored Beta/Dirichlet intent model assumes independence exactly where salience needs coupling

**Target:** S3 §5.3, §5.6, §5.8, G1B/G5.

**Concrete failure artifact/scenario:**

A user’s fossil history shows:

- high grit tolerance **only** when working in lo-fi contexts;
- low interruption tolerance when flow is high;
- high expertise vocabulary for synthesis but low for mastering;
- clean-mastering constraints overriding normal artifact tolerance;
- feedback tolerance correlated with genre, routing idiom, and safety risk.

A factored per-axis model treats these as mostly independent. Consequences that touch multiple correlated axes are double-counted or miscounted. Example: latency-induced phase smear maps to artifact tolerance, routing idiom, expertise vocabulary, and temporal style. If these axes are correlated, closed-form per-axis KL can report high “surprise” because the same evidence is counted several times. The system asks when it should abstain, or abstains when a coupled constraint should dominate.

S3 says “independence across axes (or a sparse pairwise coupling) is assumed for v1,” but never makes that assumption a gate. The factorization is not an implementation detail; it is load-bearing for S1/S4/S5 computations and the anti-linter claim.

**Severity:** **BLOCKER** for the salience claim as currently stated.

**Required fix:**

- Add a model-validity gate: posterior predictive checks, calibration curves, and ablation tests that compare factored axes vs sparse pairwise/hierarchical alternatives.
- Make axis independence falsifiable: if interaction terms explain salience decisions materially better, the v1 model must add them or reduce claims.
- Report not just ≥40pp surfacing difference, but calibration/reliability of predicted usefulness and abstention across contexts.
- Include context-conditioned holdouts, not only consequence-type holdouts.

---

## Finding 7 — The ≥40pp held-out salience falsifier can be passed by a two-feature user-aware linter

**Target:** S3 §5.6 linter-proof falsifier, §9 G1B, §10 falsifier #7.

**Concrete failure artifact/scenario:**

A trivial baseline passes S3’s gate:

```text
features: user_profile_artifact_tolerance {clean, grit}, consequence_is_artifact {yes/no}
rule: if clean && artifact -> ask; if grit && artifact -> suppress/reframe
```

This model has no Bayesian intent distribution, no KL, no EIG, no dialogue, and no consequence-specific rule for the held-out type. It will still produce ≥40pp surfacing-rate difference for aliasing, clipping, feedback, DC offset, intermodulation distortion, and latency-induced phase smear, because all are just “artifact.”

S3 tries to avoid this by saying the generic-linter baseline has “no prior” and “structurally cannot” pass. That is a straw baseline. The serious competitor is not a generic linter with no user data; it is a **user-aware heuristic/linter** trained on the same fossil histories but without SSI’s claimed distributional machinery. If that baseline can match the held-out discrimination, S3 has not proven salience-as-belief-shift; it has proven only coarse personalization.

The gate also has an underpowered-study smell: N≥8 musicians and p<0.05 with a 40pp threshold can be made to pass/fail on fragile design choices unless the unit of analysis, randomization, and baseline are pre-registered.

**Severity:** **BLOCKER** for “not a linter.”

**Required fix:**

- Replace “generic linter” with a ladder of strong baselines:
  - silent Route 2;
  - generic linter;
  - user-aware heuristic linter with artifact-tolerance/profile features;
  - leave-one-consequence-out classifier trained on fossils;
  - ablated factored model without EIG/VoI.
- Require S3’s salience model to beat these baselines on **abstention quality, user-rated usefulness, and answer-changing VoI**, not only surfacing-rate difference.
- Hold out consequence families and context combinations, not just one named consequence type.
- Pre-register unit of analysis and statistical test; N≥8 is pilot-grade, not plan-lock evidence.

---

## Finding 8 — Cold-start is not solved; it is disabled, which punts the product-center claim

**Target:** S3 §5.7 cold-start guard, §9 G1B, §5.8 thin spots.

**Concrete failure artifact/scenario:**

A new user installs the DAW. They have no L2 fossil record. S3 disables Route 1 until “≥ ~12 evidence observations across ≥ 3 style axes,” replacing it with one opening genre-prior question. For the user’s first meaningful sessions, the product’s defining SSI dialogue loop is absent or generic. The system is effectively Route 2 plus a profiling question.

This may be a reasonable product choice, but it means the central claim is not validated for new users, where first impressions and intent formation are most fragile. G1B uses synthetic fossil histories; it does not test fossil acquisition, onboarding, evidence quality, bias from early system prompts, or how users reach the threshold.

**Severity:** **MAJOR**; could become **BLOCKER** if Route 1 is marketed as core v1 behavior.

**Required fix:**

- Add a cold-start/onboarding gate with real new users, not synthetic fossils.
- Define how evidence observations are collected, consented to, weighted, corrected, and revoked.
- Test whether the “one opening genre-prior question” improves or biases later salience.
- State explicitly whether v1’s SSI-dialogic claim applies only after a learning period.

---

## Finding 9 — The Engine/Performer reload bridge assumes host capabilities R2 did not establish

**Target:** S3 §6.1 Tier 1, §6.2, §9 G1A.

**Concrete failure artifact/scenario:**

S3 correctly abandons `Patch::rebuild()` for dual rendering, because R2 shows `setNewRenderer()` destroys A before B exists. But S3 then states an Engine/Performer-level bridge as if it is mechanically available: compile B while A plays; own A+B; duplicate inputs/MIDI/transport; advance both; host-mix outputs; handle latency/ramp continuation.

R2 establishes `Performer::setInputFrames()` and `copyOutputFrames()` exist, and that `Engine::createPerformer()` exists. It does **not** establish:

- two live Performers from two Engines can be advanced concurrently in the same real-time host path;
- background compile/link is thread-safe while A is rendering;
- endpoint handles/events/transport can be replayed deterministically across A/B;
- host-side mixing at the needed point is available in the target integration;
- mismatched graph latency can be compensated without new artifacts.

S3 lists these as implementation costs, but the executive thesis says the three-tier strategy is “specified at the correct API level.” It is not yet specified; it is a spike hypothesis.

**Severity:** **MAJOR**; **BLOCKER** if the plan markets reload masking as a committed v1 capability.

**Required fix:**

- Change G1A’s first pass condition to: “prove two live Engine/Performer instances can be owned, advanced, fed, and mixed concurrently in the target host without undefined/thread-unsafe behavior.”
- Include deterministic event replay, transport sync, ramp continuation, and latency compensation as separate pass/fail items, not a generic implementation list.
- Add failure-mode fallback per patch class: if only offline/preview dual rendering works, say so.

---

## Finding 10 — The parallel-send-only tail bridge is not implementable unless the IR pre-generates tail-isolation endpoints

**Target:** S3 §6.1 Tier 2, §6.3 honest verdict, §10 falsifier #5.

**Concrete failure artifact/scenario:**

Old graph A contains:

```text
Dry -> Send(Reverb) -> Return -> MixBus
Dry -> MixBus
Sidechain from Kick -> Reverb ducking
```

A topology edit occurs elsewhere. S3 says A’s send keeps rendering its tail while B takes the dry path, then the host sums the fading tail with B. But a Cmajor Performer runs the **whole compiled old graph**, not an isolated return tail. Unless the old graph was generated with explicit stem/tail output endpoints, the host cannot copy “only the reverb return tail.” Feeding zero input to A may still output old dry-path remnants, sidechain-dependent behavior, feedback, or silence depending on graph design. Feeding new input to A double-processes through the old topology.

R2 does not establish internal bus tapping. S3’s Tier 2 is only implementable if the IR deliberately emits separate tail buses/return endpoints or sidecar processors for every tail-eligible parallel effect.

**Severity:** **MAJOR**.

**Required fix:**

- Make tail-bridge eligibility a compile-time IR property: a parallel effect must expose an isolated wet/tail endpoint and a defined “no new input, drain state” mode.
- Generate sidecar tail processors or explicit return taps for eligible effects.
- Add G1A cases where the host proves it can capture only the wet tail, not the full old performer output.
- If this is too expensive, remove Tier 2 from v1 and say all stateful tails truncate except module-explicit serialized state.

---

## Finding 11 — In-series tail truncation is labeled honestly but not gated against user rejection

**Target:** S3 §6.1 residual, §6.3 verdict, §10 falsifier #5.

**Concrete failure artifact/scenario:**

A user holds a sustained pad through an in-series reverb/delay/filter chain and asks for a topology edit: “add saturation before the filter.” S3 says the in-series tail truncates in v1. That is honest. But the roadmap does not make this a first-class product gate. G1A tests dry-path crossfade ABX and CPU/xrun. Falsifier #5 says in-series-tail truncation may prove artistically unacceptable, but no method, user threshold, or target workload is defined.

This is exactly the kind of “v1 limitation” that can silently become a quality regression users reject, especially in a DAW where edits often happen during playback.

**Severity:** **MAJOR**.

**Required fix:**

- Add an early user-facing reload-UX gate: representative musicians compare silence-boundary reload, dry-path crossfade with in-series truncation, and no-edit baseline on sustained/ambient/delay-heavy material.
- Define acceptability thresholds: percentage rating acceptable, “would break flow,” tail-cut audibility, opt-out preference.
- If it fails, reposition v1 as edit-at-stop/silence-boundary or require explicit state-serializing modules before claiming malleable playback.

---

## Finding 12 — G1A measures the wrong latency if B compiles in the background

**Target:** S3 §6.1 Tier 1, §9 G1A, R2 reload gap evidence.

**Concrete failure artifact/scenario:**

S3’s G1A threshold is “compile+swap gap ≤ 30 ms.” If the Engine-level bridge works, A continues playing while B compiles, so compile time is not an audio gap. But it is still **edit-response latency**: the user asks for a change, and the old graph continues for 50–500 ms or more before the new graph appears. R2 explicitly flags compile duration as unknown. A long compile may be click-free but still feel non-malleable.

Conversely, if the implementation cannot compile B while A plays, the compile time really is an audio gap. S3 conflates these two cases.

**Severity:** **MAJOR** for product feel.

**Required fix:**

- Split G1A into separate metrics:
  - audio dropout/swap gap;
  - edit-to-audible-change latency;
  - CPU during compile and overlap;
  - jitter/transport continuity.
- Define acceptable thresholds for both “no click” and “feels responsive.”

---

## Finding 13 — The roadmap gates are not fully decision-forcing; motivated teams can rationalize past failures

**Target:** S3 §9 gates, §10 falsifiers.

**Concrete failure artifacts/scenarios:**

- **G0:** requires no unhandled breaking artifact, but `authority` is already a named breaker. The plan can pass by saying “single-user v1,” even though authority appears in single-user constraints (Finding 5).
- **G1A:** if reload masking fails, the stated fallback is “accept reload only at silence boundaries or reconsider engine.” That is a major product pivot, not a pass condition. The gate does not say whether Phase 2 proceeds under the new scope.
- **G1B:** if salience fails, the plan says redesign the intent representation or descope to Route 2. “Redesign” can become an indefinite extension while the rest of the stack proceeds.
- **G5:** the central salience gate with real fossils occurs after Phases 2–4 investment. G1B helps, but because G1B is vulnerable to the user-aware linter baseline, the project can still arrive at G5 with the core claim unproven.

**Severity:** **MAJOR**.

**Required fix:**

- Each gate needs an investment rule: what work stops, what scope changes, and what must be rewritten before proceeding.
- G1B failure should freeze Phase 2+ Route-1-specific work until a redesigned model passes the strong-baseline test.
- G1A failure should force a written rescope: silence-boundary DAW, different engine, or state-serializing module subset. No “proceed and see.”
- G0 cannot pass with an acknowledged breaker unless the v1 scope excludes every scenario requiring it and the plan language is narrowed accordingly.

---

## Finding 14 — The plan still occasionally smuggles conclusions into a planning deliverable

**Target:** S3 §1.1–§1.3, §5.6, §11 resolution table.

**Concrete failure artifact/scenario:**

S3 repeatedly writes as if conceptual reductions in the synthesis are completed attacks:

- “Fresh artifact run here” (§1.1) is a reasoning pass, not an executed red-team corpus.
- “A linter that passed would falsify our claim; it can’t, which is the point” (§5.6) defines the baseline so it cannot pass, then treats that as structural proof.
- The resolution table says prior must-fixes are “incorporated,” but several incorporations are labels plus future gates, not actual closure.

This is planning-only; it should not claim the same epistemic status as executed empirical gates or implemented constructors.

**Severity:** **MINOR/MAJOR**: minor wording issue in isolation, major because it weakens gate discipline.

**Required fix:**

- Rename “run here” to “paper reduction/hypothesis.”
- Remove “a linter cannot pass” and replace with “must beat strong user-aware linter baselines.”
- In the resolution table, distinguish “architectural change made” from “future gate scheduled.”

---

# Prioritized MUST-FIX list

## True blockers before S3 can be the plan of record

1. **Close the cross-rate/control-sidechain causality back door.** Cycle detection and latency contracts must cover audio, value/control, event, sidechain, bus, and rate-conversion dependencies.
2. **Make runtime parameter writes refinement-checked constructor transactions.** Static `PositiveNat` on graph feedback is insufficient if live parameters can set effective delay to 0 or unsafe feedback ranges.
3. **Resolve `authority` in the intent domain.** Add it/fold it explicitly into `constraint`, or narrow v1 and remove intent-closure rhetoric. Naming the breaker is not closure.
4. **Replace the salience falsifier with one that a user-aware two-feature linter cannot pass.** Strong baselines are mandatory; ≥40pp against a straw generic linter is not enough.
5. **Validate or relax the factorized independence assumption.** Add posterior predictive/model-comparison gates or reduce claims about KL/EIG salience.
6. **Make G0/G1A/G1B decision-forcing.** Define investment freezes and mandatory rescopes after failure; no rationalized “proceed while redesigning.”

## Major fixes needed early, but not necessarily plan-lock blockers if explicitly scoped

7. Define monotone/refined contracts for dynamic `schedule -> schedule` transforms.
8. Prove two live Engine/Performer instances plus host mixing are actually viable in the target integration.
9. Re-specify the parallel-send tail bridge around explicit wet/tail endpoints or remove it from v1.
10. Add a user-facing gate for in-series tail truncation acceptability.
11. Split reload metrics into audio gap vs edit-response latency.
12. Add real cold-start/onboarding validation; do not let synthetic fossils stand in for new users.

## Polish / wording discipline

13. Stop saying “run here” for paper reductions; reserve “run” for executed corpora/gates.
14. In the critique resolution table, distinguish “fixed by architecture now” from “future gate scheduled.”
15. Remove claims that a linter “structurally cannot” pass until tested against strong user-aware baselines.

---

# Final verdict

**S3 is strong but not lockable.** It correctly absorbed much of C1/C2, but its most important claims still fail under adversarial pressure:

- “By construction” is still vulnerable through cross-rate dependencies and runtime parameters.
- Intent closure is knowingly incomplete around authority, and that incompleteness is not confined to future collaboration.
- The salience gate can be beaten by a simple personalized linter, so it does not protect the project’s central SSI/dialogue claim.
- Reload masking and tail bridging are hypotheses over R2’s API evidence, not established capabilities.

The final planner should not ship S3 as the plan of record until the blocker list above is closed in the text with concrete gate changes and narrowed claims.