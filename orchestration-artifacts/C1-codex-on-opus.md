# C1 Critique — Adversarial attack on S1-opus

**Role:** ADVERSARIAL CRITIC C1 (GPT-5.5 Codex)  
**Target:** `syntheses/S1-opus.md`  
**Posture:** S1 is ambitious and often honest about thin spots, but it repeatedly converts thin hypotheses into constitutional commitments. The plan is strongest where it admits Cmajor state loss and salience risk; it is weakest where it declares a new intent scale closed without the adversarial pass the handoff explicitly demanded.

---

## Attack 1 — Intent scale closure is asserted, not earned

**Target:** S1 §1.2, §1.5, §7 Phase 0, §8 falsifier #1.

**Concrete failure artifact/scenario:**

User creates a project-local commitment:

> “For this song, preserve the accidental aliasing in the intro even if later mastering choices are clean; keep the chorus pad phase-locked to the sidechain pump whenever sections move; never quantize the vocal breaths.”

This is not a **reference**: it is not merely a pointer to a buffer/transform/schedule/routing snapshot.  
It is not a **revision**: it is not a reversible delta between configurations.  
It is not a **convention** as S1 defines it: it is not a weighted tendency under repeated evidence. It is a normative, project-scoped constraint/commitment over future revisions.

If S1 stores this as a convention, one of two bad things happens:

1. It is underweighted because it is one-off, so future regeneration violates an explicit user constraint.
2. It is overweighted as a personal dialect, so a local song decision pollutes global user preference.

The missing primitive is likely **constraint / commitment / design intent**: a durable, scoped rule that future revisions must respect unless explicitly revoked. This is exactly what “spec-driven ecological design intent” produces, yet S1’s intent scale has no primitive for it.

**Severity:** **BLOCKER**

**What S1 must add/change to survive:**

- Do not ratify `{reference, revision, convention}` in Phase 0. Insert an adversarial **Phase -1 / G-1** specifically attacking the intent scale.
- Either add a fourth intent primitive, e.g. `{reference, revision, convention, constraint}` / `{..., commitment}`, or redefine “convention” so it can represent hard, scoped, revocable commitments without collapsing into long-term preference.
- Add explicit tests: local exception vs global preference; hard constraint vs weighted tendency; project-scoped commitment vs personal convention; revocation semantics.

---

## Attack 2 — Stable identity is missing, and this breaks state migration, dialogue, and references

**Target:** S1 §1.2 “Reference,” §6.4 state migration, §7 Phase 4, §8 falsifier #5.

**Concrete failure artifact/scenario:**

The user asks:

> “Move the chorus later, keep the same delay module ringing, and explain why the chorus pad is routed through that compressor.”

S1 defines **reference** as “an immutable pointer into the signal layer: a buffer-ref, transform-ref, schedule-entry, or routing snapshot.” But regenerate-and-reload creates a new Cmajor source version. Concrete Cmajor nodes/endpoints may be destroyed and recreated. A pointer into the old signal layer is not enough to establish that `Delay_A` before reload and `Delay_A'` after reload are “the same musical object.”

Without a stable semantic identity layer:

- state migration cannot know which module identity survived;
- dialogue can describe a patch model that no longer corresponds to the compiled artifact;
- revisions cannot reliably target “the chorus pad” across regenerated source versions;
- references become either stale pointers or mutable aliases, violating S1’s own immutability definition.

**Severity:** **BLOCKER**

**What S1 must add/change to survive:**

- Add **identity** as either an explicit intent primitive or a required field inside `reference`: stable logical IDs with versioned bindings to concrete signal objects.
- Define identity preservation rules across regeneration: split, merge, replacement, deletion, clone/unlink, bounce/freeze.
- Require compiler/runtime endpoint verification to check that generated concrete endpoints still bind to expected logical identities.
- State migration must be keyed on stable logical identity plus explicit module state contract, not source-name coincidence.

---

## Attack 3 — §6.2 closure is overclaimed by changing the meaning of “closure” midstream

**Target:** S1 §2.1–§2.2.

**Concrete failure artifact/scenario:**

S1 says SSI should “promise closure outright,” then concedes completeness is relative to known operations and coherence is supplied by directional construction clamps. That is not “closure outright”; it is **known-domain expressibility + clamped construction path + amendment process**.

This matters because S1 adds a thin, un-attacked intent scale and then treats it as constitutionally equivalent to the signal scale. The signal scale had R1/R4 attacks plus Cmajor corroboration. The intent scale has one synthesis pass and a table.

The plan risks shipping a philosophical slogan where the handoff asked for a falsifiable stance. Directional invariants are not “the same wall from two sides” unless the only constructors available to the harness are the clamped constructors and every escape hatch is closed. S1 has not shown that for agent-authored modules, raw Cmajor generation, imported patches, Engram writes, or Graphify-derived conventions.

**Severity:** **MAJOR**

**What S1 must add/change to survive:**

- Replace “promise closure outright” with precise language: **closure hypothesis relative to a named domain corpus, enforced through clamped constructors, falsifiable by irreducible operation or unclamped emission path**.
- Separate three proofs: expressibility, coherence, and implementation non-bypass.
- Add a “no raw escape hatch” invariant: all signal artifacts must enter through IR constructors; all intent artifacts through intent-scale constructors/validators.

---

## Attack 4 — The §3c coherence leak is not closed by construction for boundedness

**Target:** S1 §3.2 Clamp 2, §7 Phase 2, §8 falsifier #6.

**Concrete failure artifact/scenario:**

A legal Cmajor transform contains an unstable IIR or high-gain feedback path with a one-sample delay. The topology is causal, stack-bounded, and compile-legal. Internally it produces NaN/inf, writes that into its state, emits it into sidechains/sends, and only then reaches S1’s mandatory endpoint guard at the DAC.

S1’s “runtime amplitude/NaN net” at every signal-output endpoint protects speakers, but it does not make the patch coherent by construction. It can silently turn an unstable intended sound into silence while internal state remains poisoned. That is not an SSI invariant; it is a crash mat.

Also, “vetted module library” is named but not specified. Agent-authored modules are allowed later, yet the boundedness gate is unspecified beyond “boundedness check.” R2 only confirms no recursion / bounded stack. It explicitly does **not** confirm finite amplitude.

**Severity:** **BLOCKER**

**What S1 must add/change to survive:**

- Guard not only final DAC outputs but also feedback-loop boundaries, sends, sidechain/control conversions, freeze/bounce writes, and any stateful module boundary where NaN can persist.
- Define a module contract schema: gain bounds, state bounds, latency, rate behavior, parameter ranges, NaN policy, denormal policy, oversampling/anti-aliasing policy.
- Treat arbitrary agent-authored Cmajor as untrusted until it passes contract generation + adversarial test vectors + runtime instrumentation.
- Stop calling the amplitude net “by construction” unless the only constructible transforms are contract-bearing transforms and guard insertion is unbypassable.

---

## Attack 5 — Time-monotonicity is reduced to summing buses, which does not cover arrangement-time conflicts

**Target:** S1 §3.2 Clamp 3.

**Concrete failure artifact/scenario:**

Two schedule transforms conflict:

- a tempo map says bar 17 begins at 43.2s;
- a warp marker says the vocal transient must remain at 42.9s;
- a section move says the chorus starts at bar 17;
- a project constraint says the sidechain pump must remain phase-aligned with the kick.

S1’s answer for schedule collisions is “mandatorily inserts a summing bus.” That only resolves simultaneous audio outputs. It does not resolve conflicting timebases, warp constraints, tempo maps, bar/beat vs sample-time anchoring, or semantic alignment constraints.

This is a direct recurrence of the missing **constraint/commitment** primitive and an underpowered time model. “Single coherent timeline” is asserted, not constructed.

**Severity:** **MAJOR**

**What S1 must add/change to survive:**

- Define schedule semantics: sample time, musical time, tempo maps, warp maps, precedence rules, anchoring modes, and conflict resolution.
- Add hard constraints to the intent/arrangement model or show how current primitives express them.
- Add falsifiers for conflicting schedule transforms, not only audio-output collisions.

---

## Attack 6 — Cmajor stored-state API is overclaimed as DSP state migration

**Target:** S1 §6.4.

**Concrete failure artifact/scenario:**

S1 says to “snapshot and re-inject state for modules whose endpoint identity is preserved” using Cmajor’s `requestFullStoredState` / `sendFullStoredState` / `setStoredStateValue` API.

R2’s evidence says the opposite for DSP internals:

- processor DSP state is **not** preserved across rebuild;
- delay buffers, reverb tails, filter state, LFO phase, ramps, counters are **not** preserved;
- stored state is a key-value map on `Patch`, not automatic access to internal processor variables.

Unless every generated module explicitly serializes its internal state to the Patch stored-state map, S1 cannot migrate delay lines/reverb tails/filter state. Cmajor’s API does not magically expose arbitrary processor state.

**Severity:** **BLOCKER**

**What S1 must add/change to survive:**

- Remove the state-migration claim as grounded Cmajor capability.
- Replace it with a design requirement: generated modules that need migration must implement explicit serializable state endpoints or host-managed state mirrors.
- Phase 1 must test one real stateful module: delay buffer, filter state, LFO phase. Passing parameter preservation is not enough.
- If explicit state serialization is impractical, admit the Reload Bridge is the only tail-preservation mechanism and state continuity is not guaranteed.

---

## Attack 7 — Reload Bridge viability is thinner than S1’s rhetoric admits

**Target:** S1 §6.3, §7 Phase 1.

**Concrete failure artifact/scenario:**

A sustained pad with tempo-synced delay, LFO-modulated filter, host transport, MIDI note state, and sidechain input undergoes topology reload. The new Performer starts with fresh phase/state. During the crossfade:

- old and new oscillators are phase-incoherent;
- MIDI note state may not match unless replayed;
- transport/timeline state must be synchronized;
- latency may differ between graphs;
- automation ramps in progress must be duplicated or transformed;
- CPU doubles during compile + dual render;
- crossfading old wet tail with new dry path may produce a perceptible image shift.

R2 says the Patch class does **not** do this natively. S1 acknowledges this, but still leans on “standard host technique” and “old instrument finish its sentence” as if the hard synchronization problem is solved.

**Severity:** **MAJOR**

**What S1 must add/change to survive:**

- Define Bridge requirements: dual engine ownership, input duplication, MIDI/transport replay, latency compensation, parameter snapshot/ramp continuation, CPU ceiling, thread safety, failure fallback.
- Make G1 an ABX-style test with recorded artifacts, not “one trained ear.”
- Include worst cases: long feedback delay, tempo-synced modulation, held MIDI notes, sidechain input, high CPU graph.
- Define acceptable thresholds for click energy, dropout length, loudness discontinuity, latency shift, and CPU headroom.

---

## Attack 8 — “Avoid reload by dormant general graphs” smuggles dynamic topology back in through bloat

**Target:** S1 §6.2.

**Concrete failure artifact/scenario:**

To avoid reloads, S1 proposes emitting standing graphs with dormant zero-contribution stages, so future “insert saturation” becomes a parameter change. This only works if the graph already contains enough possible future modules/routes. In an open-ended, agent-authored modular DAW, that becomes either:

- too small to cover meaningful edits, so reloads remain common; or
- too large/general, causing CPU/memory/latency bloat and hidden interactions even when modules are “off.”

Cmajor topology is static. Pre-instantiating latent possibilities is not free; it is a finite static graph pretending to be dynamic.

**Severity:** **MAJOR**

**What S1 must add/change to survive:**

- Treat dormant-stage coverage as an optimization with measured coverage/cost, not a core seam-hiding strategy.
- Define a bounded “anticipatory graph” policy: maximum dormant modules, allowed bypass semantics, CPU budget, latency budget, denormal/noise behavior.
- Require telemetry: percentage of user edits handled as parameter-class vs topology-class in real sessions.

---

## Attack 9 — Reflexivity is overgeneralized from endpoint introspection

**Target:** S1 §6.4, §7 Phase 3, §8 falsifier #5.

**Concrete failure artifact/scenario:**

The agent says:

> “This aliases because the oscillator is driving a control-rate distortion input.”

Endpoint introspection can reveal endpoint names/types/annotations. It cannot, by itself, reveal internal processor logic, actual spectral content, nonlinear harmonic generation, oversampling choices, anti-alias filters, or the internal connection graph. R2 explicitly says the API cannot learn internal connections except by parsing/owning source.

S1 often writes as if source ownership + endpoints = sufficient reflexivity for dialogue. That is only true if every generated module carries machine-readable semantic contracts. Otherwise the agent can talk confidently about a patch it does not actually understand.

**Severity:** **MAJOR**

**What S1 must add/change to survive:**

- Require a semantic module manifest for every transform: rate behavior, spectral assumptions, latency, nonlinearities, parameter meanings, oversampling policy, safety bounds.
- Add source/IR/compiled-endpoint consistency checks.
- Make “can answer why?” part of the module gate, not an emergent property of endpoint names.

---

## Attack 10 — Salience still degrades into a linter in the planned MVP

**Target:** S1 §4.3–§4.5, §5.2, §7 Phase 5.

**Concrete failure artifact/scenario:**

S1 says implement salience as:

1. S6 safety first;
2. rule-based S1–S5 for known high-stakes consequences;
3. Bayesian surprise later once L3 is rich enough.

That means the first Route 1 is a rule-based warning system over aliasing/clipping/feedback/latency. That is exactly the linter failure mode unless the system proves it can abstain for user-specific reasons. The canonical “grit-lover gets silence, mastering engineer gets a question” can be hard-coded with two toy priors and still not demonstrate dialogue.

Also, S3/S4 are hand-waved as if “expected cognitive benefit” and “interruption cost” are computable. R3 explicitly flags these as empirically unvalidated. S1’s acceptance gate says “a handful of musician sessions” and “better than a generic linter,” which is too weak for the project’s central risk.

**Severity:** **BLOCKER**

**What S1 must add/change to survive:**

- Separate **consequence detection** from **dialogue initiation**. Detection can be linter-like; initiation must be audited for abstention quality.
- Add negative-control tests: cases where aliasing/clipping/latency are detected but should not be surfaced.
- Require longitudinal tests, not only toy two-profile tests.
- Pre-register salience metrics: false-positive interruption rate, user-rated usefulness, post-hoc “wish warned” precision/recall, time-to-flow-disruption, opt-out rate, and comparison against both generic linter and silent Route 2.
- Do not call Route 1 SSI until user-specific abstention is demonstrated.

---

## Attack 11 — Salience is sequenced too late despite being the “central, most-likely-to-fail-quietly” risk

**Target:** S1 §7 dependency graph.

**Concrete failure artifact/scenario:**

S1 claims salience is pulled “as early as dependencies allow,” but Phase 5 waits until after:

- Reload Bridge;
- Coherent IR;
- module palette;
- patching UI;
- intent/fossil store.

This is unnecessary. The salience risk can be tested with mocked graphs, synthetic fossil records, Wizard-of-Oz dialogue, and recorded audio examples before building the engine stack. If salience fails, months of DSP/infrastructure work may still produce a useful Route-2 DAW, but it will not validate SSI’s central dialogic claim.

**Severity:** **BLOCKER**

**What S1 must add/change to survive:**

- Add an early parallel **Salience Spike** in Phase 0/1 using mocked consequence detectors and synthetic user histories.
- Test “discovery vs interrogation” before engine investment, then repeat with real artifacts later.
- Make salience research a continuous track, not a Phase 5 feature.

---

## Attack 12 — Falsifiers are too weak or too late

**Target:** S1 §8 and phase gates.

**Concrete failure artifact/scenario:**

- Intent-scale falsifier says “someone exhibits irreducible feature,” but the plan does not assign a red-team corpus or attack protocol before ratification.
- Reload falsifier depends on “a trained ear hears unacceptable artifact,” undefined.
- Salience falsifier accepts “a handful” of sessions and a generic linter baseline, too easy to beat.
- Coherence falsifier asks “can any adversarial intent produce incoherent compiled patch?” which is impossible to prove exhaustively and invites overclaiming from finite fuzzing.
- Cmajor export insurance is delayed to Phase 7 even though R4 says it is the strongest dependency mitigation.

**Severity:** **MAJOR**

**What S1 must add/change to survive:**

- Predefine adversarial corpora and success metrics per gate.
- Replace impossible universal claims with bounded evidence standards and residual-risk ledgers.
- Move C++ export-path exercise to Phase 1/2, not Phase 7.
- Require independent verifier review of each gate artifact.

---

## Attack 13 — Phase 0 smuggles unresolved research into governance decisions

**Target:** S1 §7 Phase 0.

**Concrete failure artifact/scenario:**

Phase 0 says to “sign off the two-scale primitive verdict” before the intent scale has had the adversarial pass S1 itself admits it lacks. That is not constitution-making; it is laundering a hypothesis into a constitution.

Similarly, S1 “adopts as the project’s official salience principle” before calibration. R3 provides a candidate principle; it does not validate it for this DAW.

**Severity:** **MAJOR**

**What S1 must add/change to survive:**

- Phase 0 should ratify only provisional hypotheses and attack plans.
- Constitution language must include “hypothesis,” “evidence required,” and “amendment/failure procedure.”
- Official adoption of the salience principle should occur only after the early salience spike demonstrates non-linter behavior.

---

## Attack 14 — Agent-authored modules are treated as if a gate is enough, but the gate is undefined

**Target:** S1 §3.2, §7 Phase 3.

**Concrete failure artifact/scenario:**

User asks for “a chaotic shimmer reverb with self-modulating diffusion.” The agent writes Cmajor that compiles, has no recursion, and passes endpoint checks. It is still numerically unstable for certain parameter ranges, aliases heavily, and has misleading annotations.

S1 says it enters the vetted library only through a boundedness gate. But no gate design exists. A linter/static compile check will not prove musical/numerical boundedness.

**Severity:** **MAJOR**

**What S1 must add/change to survive:**

- Define module admission levels: experimental, guarded, certified.
- Require parameter-range contracts, randomized stress tests, impulse/sweep tests, denormal/NaN tests, latency declaration, and semantic annotation review.
- Route uncertified modules through heavier runtime guards and UI disclosure.

---

## Attack 15 — The plan under-specifies Engram/Graphify as an operational substrate

**Target:** S1 §4.1, §7 Phase 4.

**Concrete failure artifact/scenario:**

S1 says L1 raw memory = Engram observations + Graphify, L2 conventions = Engram topic-keyed + Graphify-organized. But Engram stores text observations; Graphify builds project graphs. Neither is automatically a low-latency, transactional, typed arrangement database.

A DAW arrangement needs atomic revisions, branching undo, references, stable IDs, conflict resolution, and queryable constraints. If these are stored as loose memories, undo/history/fossil reasoning becomes eventually-consistent narrative, not substrate.

**Severity:** **MAJOR**

**What S1 must add/change to survive:**

- Introduce a dedicated typed arrangement store as source of truth.
- Use Engram/Graphify for summaries, retrieval, and semantic indexing, not as the transactional revision database.
- Define serialization, schema migration, referential integrity, and corruption recovery.

---

# Prioritized MUST-FIX list

1. **Run an adversarial intent-scale closure pass before ratification.** Test hard constraints, stable identity, provenance/rationale, collaboration, scoped exceptions, and semantic arrangement labels. Do not constitutionalize `{reference, revision, convention}` yet.
2. **Add or redefine primitives for project-scoped constraints/commitments and stable identity.** Current intent scale cannot preserve explicit design intent or state continuity across regeneration.
3. **Correct the Cmajor stored-state overclaim.** Stored state is not automatic DSP state migration. Require explicit serializable state contracts or remove the migration promise.
4. **Move salience validation to Phase 0/1 in parallel with engine spikes.** The central risk can be tested with mocked artifacts; waiting until Phase 5 is a sequencing failure.
5. **Make salience prove abstention, not just detection.** Add negative controls, longitudinal musician studies, pre-registered metrics, and a serious baseline beyond a straw linter.
6. **Strengthen boundedness/coherence enforcement.** Define transform contracts, guard placement beyond DAC outputs, and no-bypass IR/module gates. Stop calling runtime crash mats “by construction.”
7. **Define Reload Bridge engineering requirements and hard metrics.** Include dual Performer synchronization, MIDI/transport replay, latency compensation, CPU headroom, ABX tests, and worst-case sustained material.
8. **Replace closure rhetoric with precise proof obligations.** Known-domain expressibility, clamped construction, implementation non-bypass, and amendment process are not the same as unconditional closure.
9. **Introduce a typed transactional arrangement store.** Engram/Graphify can index and summarize; they should not be the source of truth for revisions/references/constraints.
10. **Exercise the C++ export path early, not in Phase 7.** R4 identifies it as the strongest Cmajor dependency mitigation; late insurance is not insurance.
