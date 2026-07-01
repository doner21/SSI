# S2 Synthesis — Bold Candidate Plan for Building the SSI DAW

**Role:** SYNTHESIZER S2 (GPT-5.5 Codex)  
**Mode:** Planning only; no code written  
**Input basis:** Handoff + R1/R2/R3/R4 dossiers in `RUN_20260629-214123`  
**Thesis:** Build the SSI DAW as a **piNen-centered, regenerate-and-reload, Cmajor-targeted DAW ecology**: four signal primitives, three substrate clamps, a piNen-owned arrangement/fossil/intention layer, and a toggleable spec-driven-ecological shape whose Route 1 asks only salience-worthy questions and whose Route 2 lets artifacts lead.

---

## 0. Executive Position

The plan should proceed, but only under a very specific interpretation of SSI:

1. **The primitive set is sufficient:** `{buffer, transform(polymorphic over buffer and schedule), schedule, routing}` is complete for the known DAW/signal domain. The un-run arrangement attack does not force a fifth primitive. Comping, takes, non-destructive editing, undo trees, linked regions, automation, freeze/bounce, patching UI, polyphony, agent-authored modules, and the fossil record reduce to harness-layer structures over the four primitives.
2. **Strict primitive closure is the wrong demand:** The primitives are closed under **expression**, not under **coherence**. SSI should require complete primitives plus substrate-enforced directional invariants. Coherence is guaranteed by clamped construction, not by making every raw primitive composition valid.
3. **Cmajor is the right engine if topology changes are edits, not performance gestures:** Cmajor’s static topology is not a compromise; it is the mechanism that preserves by-construction coherence. piNen must regenerate Cmajor source, compile/JIT it, verify it, and reload it.
4. **Reload is audible unless we engineer around it:** R2 establishes processor DSP state is not preserved across rebuild. Therefore the DAW must own a double-buffer/crossfade/tail-bridge reload host. Parameter values and stored key-value state survive; reverb tails, delay buffers, filter histories, LFO phase, and other DSP internals do not.
5. **The central product risk is not DSP. It is salience:** Detecting consequences is tractable. Deciding which consequences deserve a question is the SSI-defining problem. Route 1 must be conservative and salience-aware, or it becomes a linter/Clippy. Route 2 must remain first-class because the artifact itself is often the best salience filter.
6. **piNen must be the permanent center:** Cmajor should never be asked to remember intent, explain itself, or mutate topology live. piNen owns source, IR, arrangement, dialogue, fossil record, salience, generation, verification, and reload orchestration. Cmajor owns real-time DSP execution and compiler-enforced safety.

---

## 1. Resolved Stances on §6.1–§6.8

### §6.1 — Arrangement-as-shape vs arrangement-as-primitive

**Stance:** Arrangement is a **shape on the signal primitives**, not a fifth primitive.

**Verdict on the un-run attack:** Closure holds for the known DAW domain. No breaking artifact was found.

**Proof sketch:**

- **Comping/takes:** Takes are immutable buffers; a comp is a schedule selecting subranges; crossfades are transforms; track output is routing.
- **Non-destructive editing:** Original recordings remain buffers; edits are schedule mutations and transform applications; undo restores schedule/routing snapshots.
- **Region aliasing / linked regions:** Multiple schedule entries point to one buffer; unlinking creates a new buffer reference.
- **Automation:** Recorded gestures are buffers/control streams routed to transform parameters.
- **Tempo maps / warping:** These require the handoff’s crucial amendment: transforms must operate over schedules as well as buffers.
- **Markers, groups, loop points, edit histories:** Harness metadata over schedules and snapshots, not signal primitives.
- **Freeze/bounce:** Apply routing/transforms to buffers and emit a derived buffer.
- **Patching UI:** A projection of transforms, endpoints, and routing held by piNen.
- **Fossil record:** Records user intent and construction history about primitive combinations. It is not audio itself; it is harness memory about how the four primitives are used.

**Rationale:** R1 directly stress-tested comping, non-destructive editing, linked regions, undo trees, and the fossil record. R4 stress-tested high-level patching, polyphony, module state, timers/LFOs, and agent-authored modules. Both dossiers found reduction to the four primitives.

**Caveat:** This is an inductive proof over known DAW concepts, not a proof over all possible future music systems. A future artifact that cannot be reduced must reopen the primitive set.

---

### §6.2 — Closure vs directional invariant

**Stance:** SSI requires **primitive completeness for the domain under expression**, plus **directional/coherence invariants enforced by the substrate**. It does not require that every unconstrained primitive composition be coherent.

**Official formulation:**

> The primitive set must be demonstrably complete for the known domain. Coherence is guaranteed by substrate clamps enforced at every harness construction step. The harness may only construct the coherent refinement of the raw primitive algebra.

**Why:** The routing-cycle attack from the handoff is real: raw routing allows `A → B → A`; this can be musical feedback or catastrophic zero-delay feedback. That is not a missing primitive. It is a coherence predicate. The substrate’s job is to make incoherent configurations unconstructable.

**Analogy:** The chromatic scale does not make every chord consonant. Harmony/instrument constraints decide which note combinations are coherent for a purpose. Likewise, the DAW primitives should remain expressive; the substrate clamps provide playable coherence.

**Rationale:** R1 classifies the feedback leak as closure-under-coherence, not incompleteness. R2/R4 show Cmajor itself follows the same architecture: the language can express feedback, but the compiler rejects zero-delay feedback.

---

### §6.3 — State preservation across reload

**Stance:** State is **not preserved** across Cmajor rebuilds. The reload boundary is audible by default. The architecture must treat seamless reload as a host-level feature, not a Cmajor feature.

**Established by R2:**

- `Patch::rebuild()` preserves current parameter values.
- `Patch::storedState` key-value data survives because it lives on the patch object.
- Rebuild creates a new engine/renderer/performer.
- Old performer state is destroyed.
- Delay buffers, reverb tails, filter histories, parameter ramps, LFO phase, accumulators, and internal counters are reset.
- The default patch swap includes stop/start playback and therefore an audio gap.

**Design answer:** Build a **dual-renderer reload bridge** in the SSI host:

1. Keep performer A active while compiling performer B.
2. Never destroy A until B is compiled, linked, endpoint-verified, parameter-restored, timeline-aligned, and pre-rolled if possible.
3. Start B muted/silent at the same transport position.
4. Crossfade A→B over a short window for ordinary edits.
5. For long tails, optionally keep A’s wet/tail bus alive as a **tail bridge** while B handles new input.
6. Record reload events as fossils: what changed, gap duration, crossfade duration, whether tails were bridged, and whether the user noticed.

**Strong position:** Do not chase general DSP state migration in v1. Cmajor does not expose arbitrary processor internals. General migration would require every generated module to implement a custom state serialization contract, and third-party modules will not comply. The correct v1 answer is double-buffering, tail bridging, and harness-owned state for things that can be externalized.

---

### §6.4 — Continuous topology morphing

**Stance:** Continuous topology morphing is **not part of the v1 SSI DAW vision**. Topology change is an edit-time operation, not a performance gesture.

**Rationale:** R2/R4 establish Cmajor topology is compile-time static: node arrays, endpoint counts, and conditional connections are fixed at compile time; dynamic graph routing is explicitly future roadmap, not current capability. Static topology is also what gives the compiler its safety leverage.

**Decision:** Proceed with Cmajor. Do not wait for dynamic routing. Do not switch to a fully dynamic engine unless Donald explicitly decides that live rewiring while audio flows is core to SSI. That decision would be a different product.

---

### §6.5 — Reflexivity at the seam

**Stance:** Cmajor’s host API is sufficient for runtime endpoint reflexivity, but **piNen must own structural reflexivity** by maintaining the source/IR graph itself.

**Established by R2/R4:** Cmajor exposes endpoint IDs, types, directions, data types, annotations, suggested purposes, handles, program details, generated code, and JS patch status callbacks. This is enough to render controls, drive parameters, and verify runtime endpoints.

**Important caveat:** The Cmajor API does not expose the internal connection graph. That is acceptable because piNen generates the source and owns the graph IR. The seam must be two-source:

- **piNen IR/source model:** authoritative for topology, intent, consequences, and regeneration.
- **Cmajor compiled endpoint view:** authoritative for what actually compiled and can run.

Mismatch between them is a generator bug and should block reload.

---

### §6.6 — Arrangement/fossil store implementation

**Stance:** The arrangement/fossil store is piNen-owned and must be read at plan time for three purposes: regeneration biasing, salience calibration, and dialogue enrichment.

**Architecture:** Implement three layers:

1. **Raw Memory:** Engram observations, session summaries, Graphify artifacts, source files, Cmajor manifests, generated patch snapshots.
2. **Fossil Record:** Domain-specific structured records of user choices, arrangements, module graphs, dialogue turns, surfaced/unsurfaced consequences, decisions, revisions, and outcomes.
3. **Intent Model:** A runtime belief model derived from the fossil record at session start and updated during the session. This is what the agent computes over when deciding what to build and what to ask.

**Initial schema stance:** Start with a transparent **rule/weight/evidence** model, not opaque embeddings and not a full Bayesian network. Use embeddings/RAG for retrieval, but keep plan-time decisions explainable. Migrate to Bayesian/PGM only when contradictions and context-dependence exceed what weighted rules can represent.

---

### §6.7 — Dependency risk on Cmajor

**Stance:** Proceed with Cmajor, but require early legal and export gates.

**Grounded claims from R2/R4:**

- Cmajor is dual GPLv3/commercial.
- Cmajor has an Indie tier and Pro tier; Pro pricing is unknown.
- SOUL precedent is real: same authors had a previous DSP language that halted.
- Generated C++ is yours to use and is the strongest lock-in mitigation.
- C++ export preserves DSP algorithms, not the SSI harness/regenerate-reload experience.

**Decision:** Cmajor is acceptable for research/prototype immediately. Before heavy product investment, obtain written clarity on commercial license terms, termination, Pro pricing, and contractor/seat implications. Test C++ export early and repeatedly.

---

### §6.8 — What makes a consequence salient?

**Stance:** Adopt R3’s principle: **Salience-as-Belief-Shift Conditioned on Intent**, but implement it conservatively.

A consequence is worth surfacing in Route 1 when it passes these gates:

1. **Safety override:** It violates or approaches substrate safety/coherence boundaries. Always block or surface.
2. **Belief shift:** It materially changes the system’s belief about what the user is trying to make.
3. **Affordance impact:** It changes what the artifact lets the user do musically or structurally.
4. **Relevance:** The expected cognitive benefit of asking exceeds the processing/interruption cost.
5. **Value of information:** The user’s answer would change what the harness builds.
6. **Informativeness:** Among askable consequences, this one most efficiently sharpens the intent model.

**Thin evidence warning:** The theory is grounded in R3’s synthesis of Bayesian surprise, relevance theory, affordance theory, value of information, active learning, and mixed-initiative interaction. But it is not empirically validated for a DAW. Calibration is a research/product risk.

**Product stance:** Route 1 must have a high threshold. False-positive questions are more damaging than false negatives because Route 2 remains available: the user can hear the artifact and ask backward from the result.

---

## 2. Primitive Set Verdict

### Final verdict

The primitive set is:

1. **Buffer** — finite values over time, including audio, control streams, automation, MIDI-as-values, derived renders.
2. **Transform** — functions over buffers and schedules; includes instruments, effects, samplers, LFOs, envelopes, warp maps, tempo transforms, and generated modules.
3. **Schedule** — placement/activation over a coherent timeline; includes clips, takes, comp selections, automation lanes, loop regions, and tempo maps.
4. **Routing** — directed connections between transforms and endpoints; includes sends, returns, sidechains, modulation, signal-as-control, buses, and patch cords.

**No fifth primitive is needed for the known DAW domain.**

### Closure type

- **Closed under expression:** yes, relative to known DAW/signal/arrangement features tested in R1/R4.
- **Closed under coherence without clamps:** no, and it should not be.
- **Coherent-by-construction through SSI:** yes, if and only if piNen generation uses clamped smart constructors and Cmajor compilation is a final gate.

### What would count as a breaking artifact?

A breaking artifact would be a musically/workstation-relevant operation that cannot be represented as buffer data, transform behavior, schedule placement/warping, routing topology, or harness metadata over those. Examples to watch:

- A collaborative/social authorship relation that affects sound but is not reducible to arrangement metadata.
- A generative system whose identity is neither buffer, transform, schedule, routing, nor a harness policy over them.
- A future spatial/immersive audio construct whose location/field relation cannot be treated as buffer channels + transforms + routing + schedule metadata.

No current dossier found such an artifact.

---

## 3. Substrate-Clamp Enforcement in the piNen → Cmajor Path

### 3.1 Core design: never generate Cmajor directly from user intent

The generation path must be:

```text
User intent / patching gesture
  → piNen shape route
  → Intent + fossil retrieval
  → SSI DAW IR transaction
  → Clamp verifier + salience scanner
  → Cmajor source emitter
  → Cmajor compiler/JIT
  → Runtime endpoint verification
  → Double-buffer reload bridge
  → Fossil commit
```

The **SSI DAW IR** is mandatory. It is the smart-constructor layer. User intent, UI gestures, and agent plans modify the IR; only verified IR emits Cmajor.

### 3.2 The IR objects

Minimum IR entities:

- `BufferRef`: immutable source or derived buffer, with provenance.
- `TransformSpec`: module/processor template, parameters, endpoint declarations, rate contracts, statefulness, gain bounds if known.
- `ModuleInstance`: an instantiated transform with stable ID and endpoint bindings.
- `Endpoint`: direction, kind (`stream`, `value`, `event`), type, units, range, semantic role.
- `ScheduleEntry`: timeline placement, buffer subrange, activation window, clip metadata.
- `ScheduleTransform`: tempo/warp/reverse/local-time mapping; must prove project-time monotonicity.
- `RouteEdge`: source endpoint → destination endpoint, rate conversion/oversampling policy, intentionality label.
- `Bus`: explicit summing point with gain law and saturation/limiter policy.
- `PatchGraph`: current coherent arrangement of modules, routes, schedules, buses.
- `GenerationCertificate`: proof artifact listing clamp checks, compiler diagnostics, endpoint diff, and salience decisions.

### 3.3 Clamp 1 — Causality

**Invariant:** Every directed cycle in the routing graph must include at least one delay of ≥1 sample or a transform with declared causal latency.

**piNen enforcement:**

1. Run cycle detection on the IR before emission.
2. For each cycle, compute accumulated sample delay.
3. If delay is zero, do not emit the graph.
4. If the user clearly asked for feedback, surface a salience-aware question: insert a 1-sample delay, use a named feedback-delay module, or cancel.
5. If the user did not ask for feedback, reject/repair silently depending on route and salience.
6. Record all feedback cycles in the generation certificate.

**Cmajor belt:** R2 confirms Cmajor rejects zero-delay feedback at compile time and allows feedback with `[N]` delay. If Cmajor catches a cycle piNen missed, treat it as a clamp verifier bug.

### 3.4 Clamp 2 — Boundedness

**Invariant:** Generated patches must be real-time bounded and must not emit unbounded/NaN/inf audio to render outputs.

**Grounded Cmajor support:** R2 establishes no recursion and compile-time stack boundedness. Cmajor’s stated design goal is real-time safety; no dynamic runtime topology; fixed arrays. This grounds execution boundedness.

**Thin evidence warning:** Cmajor does not magically prove musical amplitude boundedness. Floating-point DSP can still produce NaN/inf or extreme values. Therefore amplitude boundedness must be a piNen/host responsibility.

**piNen enforcement:**

1. Transform templates include contracts:
   - endpoint ranges;
   - expected gain range;
   - whether output may exceed input;
   - whether it can self-oscillate;
   - whether it can generate NaN/inf under invalid parameters.
2. Parameter smart constructors clamp values to declared safe ranges unless user explicitly chooses an unsafe/experimental mode.
3. Insert sanitizers at bus and master boundaries:
   - finite checks;
   - denormal handling if needed;
   - configurable limiter/soft clipper at monitor output;
   - panic/silence fallback if NaN/inf is detected.
4. Property-test generated modules offline with representative parameter sweeps before admitting them to the palette.
5. Record transform contracts and sanitizer placement in the generation certificate.

**Cmajor belt:** Compiler guarantees bounded stack/no recursion; static arrays; feedback delay requirement. piNen supplies amplitude and finite-value guardrails.

### 3.5 Clamp 3 — Time-monotonicity

**Invariant:** The project timeline must resolve to one coherent, monotonically advancing render timeline. Local buffer reads may reverse or warp, but project time must not become ambiguous.

**piNen enforcement:**

1. Schedule entries live in project time.
2. Tempo maps and warp maps are represented as schedule transforms.
3. Project-time transforms must be monotone non-decreasing. Reverse playback is represented as a buffer-read transform inside a forward schedule window, not as negative project time.
4. Colliding schedules require explicit bus/summing rules. There is no implicit ambiguous overlap.
5. Every schedule-to-render query resolves deterministically to a set of active buffer/transform/routing operations at time `t`.
6. Offline bounces are reproducible from the arrangement snapshot and fossilized generation certificate.

**Cmajor belt:** Cmajor runs a sample frame loop with fixed topology. It does not know the full arrangement layer, so time-monotonicity is mostly piNen’s responsibility.

### 3.6 Rate/aliasing constraint — not a hard clamp, but salience-aware

Rate mismatch is not always an error. Audio-rate modulation into a control-rate path may create aliasing; that can be unwanted or musically desired.

**piNen enforcement:**

1. IR routes carry source and destination rate contracts.
2. Static analyzer detects possible aliasing using endpoint rates, source frequency bounds, modulation content if known, and oversampling policies.
3. If aliasing is safety-neutral, do not block. Classify as a consequence.
4. Route 1 may surface it if salience passes threshold.
5. Available fixes are generated operations: run target at stream rate, insert smoothing/anti-alias filter, oversample node, or keep grit.

This is the canonical example of substrate vs salience: zero-delay feedback is a hard clamp; aliasing is usually a dialogic consequence.

---

## 4. Arrangement Store, Fossil Store, and Intent Model

### 4.1 The arrangement store

The arrangement store is the source of truth for the workstation layer. It should be an append-friendly, snapshot-capable graph/event store, not merely a flat project file.

Minimum entities:

- `Project`
- `BufferAsset` and `DerivedBufferAsset`
- `TakeGroup`
- `ClipRegion`
- `ScheduleEntry`
- `ScheduleSnapshot`
- `RoutingSnapshot`
- `ModuleTemplate`
- `ModuleInstance`
- `PatchSnapshot`
- `AutomationLane`
- `Bus`
- `RenderArtifact`
- `DialogueTurn`
- `IntentEpisode`
- `ConsequenceEvent`
- `DecisionRecord`
- `GenerationCertificate`

Important properties:

- Source buffers immutable.
- Derived buffers carry provenance: source buffers + transforms + parameters + schedule range.
- Every edit is a transaction over schedule/routing/module state.
- Undo/redo is restoration or branching of snapshots.
- Linked regions are multiple schedule entries pointing to the same buffer/provenance node.
- The store is meaningful when audio is not playing.

### 4.2 The fossil store

The fossil store is not just history. It is the user’s accumulating construction dialect.

Each fossil should record:

- What the user asked or did.
- What the system inferred.
- Which arrangement/patch graph existed before.
- What consequences were detected.
- Which consequences were surfaced, suppressed, or blocked.
- Why they were surfaced/suppressed according to salience scores.
- What the user chose.
- What the generated artifact became.
- Whether the user kept, reverted, modified, praised, or complained about the result.
- What durable preference/rule was inferred, with confidence and context.

This is the minimum data needed to learn salience. A fossil record that only stores final patches cannot tell whether a consequence was intended, surprising, ignored, or loved.

### 4.3 The intent model

The intent model is runtime, not just storage.

At session start:

1. Retrieve relevant fossils and raw memories.
2. Derive weighted rules/preferences.
3. Build a current belief state over user goals and style.
4. Initialize a cold-start prior if history is thin.

During session:

1. Update beliefs after each prompt, gesture, listen/reaction, and decision.
2. Use beliefs to bias generation.
3. Use beliefs to score consequence salience.
4. Emit new fossils when decisions stabilize.

Initial model dimensions:

- Desired cleanliness vs grit/noise.
- Tolerance for artifacts: aliasing, clipping, feedback, latency, instability.
- Preferred module families: subtractive synth, sample-based, granular, modular, tracker-like, tape/lo-fi, mastering-clean.
- Routing idioms: saturation-before-filter, parallel compression, sidechain style, send-heavy vs insert-heavy.
- Rate preferences: prefers transparent audio-rate modulation vs accepts control-rate grit.
- Dialogue preference: wants questions up front vs wants artifacts first.
- Expertise vocabulary: when to explain terms, when to be terse.
- Risk appetite: experimental vs conservative.
- Temporal style: loop-based, linear arrangement, generative, performance capture.

### 4.4 Salience scoring made concrete

For each detected consequence `C`, compute a structured salience record:

```text
Consequence C:
  type: aliasing | clipping | feedback | latency | state-reset | destructive-edit-risk | schedule-collision | CPU-risk | etc.
  safety_class: hard_block | must_surface | askable | note | ignore
  surprise_score: estimated belief shift under current intent model
  affordance_impact: what musical action possibilities change
  relevance_score: expected cognitive benefit / processing effort
  voi_score: would the answer change generation?
  eig_score: how much would this answer improve the intent model?
  interruption_cost: current flow cost, adjusted by recent question count
  final_decision: block | ask | quiet_note | suppress
  rationale: human-readable
```

**Ask rule:**

```text
Ask if safety_class requires it
OR if (surprise + affordance + relevance + VOI + EIG) exceeds threshold
AND the per-transaction question budget is not exhausted.
```

**Question budget:** Route 1 should initially ask at most 1–3 questions per generation transaction. If more consequences are above threshold, batch them as ranked options or defer to a quiet note. This is how Route 1 avoids becoming a form.

### 4.5 Route 1 avoiding Clippy

Route 1 must obey these product rules:

1. **Ask only when the answer changes the build.** If both answers lead to the same patch, do not ask.
2. **Prefer reversible action over interruption.** If a consequence is cheap to hear and undo, Route 2 is often better.
3. **Explain on demand.** The default question should be short; “what is aliasing?” opens the teaching loop.
4. **Use the user’s own fossils.** “You kept this kind of grit last time” is SSI; generic warnings are linting.
5. **Batch and rank.** Never make the user clear a checklist of low-salience warnings.
6. **Keep Route 2 alive.** The user can always say “just build it.”
7. **Measure regret.** If users repeatedly say surfaced questions were unnecessary, thresholds are too low. If users repeatedly wish they had been warned, thresholds are too high.

---

## 5. Spec-Driven-Ecological Workflow as a piNen Shape

### 5.1 Shape identity

Working name: `spec-driven-ecological-design-intent`  
Short command: `/sde` or `/spec-ecology`  
Placement: piNen shape registry, sibling to existing shapes, standing on substrate only.  
Toggle: per project, per session, and per transaction.

This shape must not import or call other shapes. It uses substrate primitives: bounded subagent calls, capped dialogue loops, filesystem/memory tools, and generation/reload actions.

### 5.2 Shape modes

The shape has two routes.

#### Route 1 — Spec-first / ecological ON

```text
Prompt or patching gesture
  → ecological intake
  → retrieve fossils + derive intent model
  → propose IR transaction
  → scan consequences
  → salience rank
  → ask only high-salience questions
  → revise intent/model/IR
  → clamp verification
  → generate Cmajor
  → compile + endpoint verify
  → double-buffer reload
  → fossilize decisions and outcome
```

Ecological intake adapts the 15-phase spec-driven-ecology skill into DAW terms:

- Perturbation: what is the user reaching toward?
- Invariants: what must remain true? tempo, key, latency, no clipping, gritty accepted, etc.
- Affordances: what actions should the artifact enable?
- Constraints: signal, schedule, rate, routing, CPU, reload, licensing.
- Attractors: likely solution families.
- Failure modes: aliasing, feedback, silence, gap, incoherent timeline, clippy dialogue.
- Perturbation tests: adversarial consequence checks.
- Handoff contract: precise IR transaction + surfaced decisions.

#### Route 2 — Artifact-first / ecological OFF

```text
Prompt or patching gesture
  → retrieve fossils lightly
  → infer likely intent
  → propose IR transaction without pre-build questions except hard safety
  → clamp verification
  → generate Cmajor
  → compile + endpoint verify
  → double-buffer reload
  → user hears/reacts
  → if user asks, explain backward from artifact
  → update fossils and intent model
```

Route 2 is not “dumb mode.” It still uses the intent model for generation. It simply defers most consequence dialogue until the user has an artifact to react to.

### 5.3 Safety in both routes

Hard substrate violations are never allowed in either route:

- Zero-delay feedback.
- Non-terminating/unbounded generated code.
- Invalid schedule timeline.
- NaN/inf at monitored output.
- Invalid endpoint/rate connection with no defined conversion.

Route 2 may skip aliasing questions; it may not skip hard clamps.

### 5.4 Shape lifecycle

When implemented later, this shape should follow piNen’s existing shape-builder lifecycle:

```text
proposed → implemented_verified → reload_required → discovered → canary_passed → usable
```

Canary examples:

1. Clean mastering user + aliasing route: Route 1 asks.
2. Lo-fi user + same aliasing route: Route 1 suppresses or frames as optional grit.
3. Zero-delay feedback: both routes block/repair.
4. Simple module insertion: regenerate/reload with crossfade and no irrelevant questions.

---

## 6. Concrete State-Across-Reload Design

### 6.1 Reload bridge layers

The reload system has four layers:

1. **Parameter/state preservation:** Restore endpoint values and stored key-values that Cmajor preserves or piNen stores externally.
2. **Transport alignment:** New performer starts at the same project transport state, tempo, sample rate, block size, and schedule position.
3. **Crossfade:** Old and new performers run concurrently for a bounded overlap; output ramps old down/new up.
4. **Tail bridge:** For stateful effects with audible tails, old performer can continue rendering tail-only for a longer decay window while new performer receives new input.

### 6.2 What to migrate vs mask

**Migrate:**

- Parameter values.
- User-facing stored state.
- Timeline position.
- Harness-owned state such as LFO phase if generated modules expose it as endpoint/state.
- Arrangement and automation state.

**Mask with crossfade/tail bridge:**

- Delay buffers.
- Reverb tails.
- Filter histories.
- Internal oscillator phase not externalized.
- Granular windows and sampler internals.

**Do not promise:** general arbitrary processor state migration.

### 6.3 Decision thresholds

The implementation phases must measure:

- Compile/JIT time by patch size.
- Endpoint verification time.
- Crossfade minimum length that avoids clicks.
- Tail bridge CPU cost.
- Maximum acceptable edit-to-audio latency.

Initial targets for decision gates, subject to measurement:

- Simple patch reload perceived as seamless with crossfade.
- Medium patch edit-to-audio under a human-tolerable threshold.
- No stop/start silence gap exposed to the monitor path in normal reload.
- Tail truncation either masked or explicitly surfaced when it matters.

Evidence is currently thin on actual Cmajor compile times for SSI-sized graphs; this must be measured early.

---

## 7. Replanned Roadmap

### Phase 0 — Ratify the architecture contract

**Goal:** Freeze the philosophical/architectural stance before implementation.

**Dependencies:** Handoff + R1/R2/R3/R4.

**Deliverables:**

- Primitive contract document.
- Closure stance document.
- Cmajor commitment memo.
- Explicit Donald decision: topology morphing is edit-time, not performance-time.
- Salience principle accepted as hypothesis, not proven fact.

**Milestone:** “SSI DAW Architecture Contract v0.1” signed off.

**Decision gate:** Do not proceed if Donald wants continuous topology morphing as a core performance gesture.

**Risks:** Philosophical ambiguity leaks into code.

**Verification standard:** All claims trace to dossiers; open thin-evidence items flagged.

---

### Phase 1 — Cmajor engine/legal/reload spike

**Goal:** Empirically test the riskiest engine assumptions before building the DAW layer.

**Dependencies:** Phase 0.

**Deliverables:**

- Minimal host that loads a generated patch.
- Parameter write/ramp test.
- Topology regeneration test.
- Reload duration measurements across trivial/small/medium graphs.
- Confirmation of state reset behavior in practice.
- Prototype double-buffer crossfade.
- C++ export proof.
- License/legal findings: Indie/Pro pricing, termination terms, GPL/commercial path.

**Milestones:**

- M1: patch compiles, runs, parameters update.
- M2: topology edit regenerates and reloads.
- M3: reload gap measured.
- M4: crossfade masks ordinary reload click/gap.
- M5: exported C++ builds outside Cmajor runtime.

**Decision gate:** Stop or re-evaluate engine if reload times are too long to mask, double-buffering is impractical, or licensing is unacceptable.

**Risks:** JIT slower than assumed; API harder than docs imply; license unacceptable.

**Verification standard:** Direct measurements and source/API tests, not doc inference.

---

### Phase 2 — SSI DAW IR and clamp verifier

**Goal:** Build the smart-constructor layer before any rich feature work.

**Dependencies:** Phase 1 engine feasibility.

**Deliverables:**

- IR schema for buffers, transforms, schedules, routing, endpoints, buses, modules.
- Cycle/delay causality verifier.
- Schedule monotonicity verifier.
- Rate compatibility analyzer.
- Boundedness contract schema.
- Generation certificate format.
- Fixture suite of valid/invalid graphs.

**Milestones:**

- M1: zero-delay feedback caught by piNen before Cmajor.
- M2: legal feedback with 1-sample delay emits valid Cmajor.
- M3: schedule collisions always resolve through explicit bus/summing rule.
- M4: aliasing consequence is detected but not hard-blocked.

**Decision gate:** Do not build UI or intent features until the clamp verifier is trusted.

**Risks:** Boundedness too hard to prove; schedule transforms underspecified.

**Verification standard:** Property tests, adversarial fixtures, and compiler cross-check. Any Cmajor compile error due to a missed clamp becomes a verifier bug.

---

### Phase 3 — Cmajor emitter and module palette MVP

**Goal:** Generate useful sound from verified IR.

**Dependencies:** Phase 2 IR/clamps.

**Deliverables:**

- Cmajor source emitter.
- Module templates: oscillator, sampler/player, gain, filter, envelope, LFO, distortion, delay, reverb, mixer/bus, output.
- Endpoint annotation conventions.
- Transform contract conventions.
- Generated module testing harness.
- Runtime endpoint verification against IR.

**Milestones:**

- M1: subtractive synth patch generated end-to-end.
- M2: audio + control ports render correctly.
- M3: signal-as-control route works.
- M4: agent-authored small module can be compiled and added on regeneration.

**Decision gate:** If source/endpoint mismatch is common, pause and improve emitter/IR before expanding palette.

**Risks:** Generated Cmajor is brittle; annotations insufficiently standardized; module contracts inaccurate.

**Verification standard:** Golden patches, endpoint diffing, audio smoke tests, NaN/inf sweeps.

---

### Phase 4 — Arrangement store and non-destructive workstation layer

**Goal:** Make it a DAW, not just a patch compiler.

**Dependencies:** Phase 2 IR; Phase 3 module emitter.

**Deliverables:**

- Project store schema.
- Immutable buffer asset model.
- Schedule/clip/take/comp model.
- Routing and patch snapshots.
- Undo/redo branching snapshots.
- Freeze/bounce provenance.
- Basic timeline render path.

**Milestones:**

- M1: record/import buffer and place clip on schedule.
- M2: comp/take selection represented as schedule over buffers.
- M3: non-destructive trim/move/fade.
- M4: undo tree restores arrangement snapshots.
- M5: bounce creates derived buffer with provenance.

**Decision gate:** If arrangement concepts require ad hoc structures not reducible to the four primitives + metadata, reopen §6.1.

**Risks:** Harness-layer complexity explodes; project store becomes opaque.

**Verification standard:** Round-trip project snapshots; provenance checks; adversarial comp/edit fixtures.

---

### Phase 5 — Fossil store and intent model MVP

**Goal:** Make personal dialect real enough to affect planning.

**Dependencies:** Phase 4 arrangement events; Engram/Graphify availability.

**Deliverables:**

- Fossil event schema.
- Preference/rule/weight runtime intent model.
- Session-start fossil retrieval.
- Plan-time generation bias hooks.
- User-inspectable “why did you choose that?” explanations.
- Recency weighting and contradiction handling.

**Milestones:**

- M1: repeated user choices become weighted preferences.
- M2: generation changes based on fossilized preference.
- M3: same prompt yields different default patch for two different fossil histories.
- M4: user can correct a preference and confidence updates.

**Decision gate:** If fossil-informed generation is not measurably different from stateless generation, the SSI claim is not yet realized.

**Risks:** Fossils become logs, not model input; preferences overfit; explanations hallucinate.

**Verification standard:** A/B tests with fossil on/off; deterministic fixtures for two persona histories; explanation traces tied to records.

---

### Phase 6 — Salience engine and spec-driven-ecological shape

**Goal:** Implement Route 1/Route 2 and prevent Clippy.

**Dependencies:** Phase 5 intent model; Phase 2 consequence detection.

**Deliverables:**

- Salience record schema.
- Consequence taxonomy.
- Safety override policy.
- Question budget and interruption cost model.
- Route 1 ecological intake loop.
- Route 2 artifact-first loop.
- Toggle command and shape lifecycle.
- Fossilization of surfaced/suppressed consequences.

**Milestones:**

- M1: zero-delay feedback blocks in both routes.
- M2: aliasing asks for clean-user fossil, suppresses or reframes for grit-user fossil.
- M3: Route 1 asks at most bounded high-value questions.
- M4: Route 2 builds without low-stakes interrogation and supports backward explanation.

**Decision gate:** If musicians perceive Route 1 as a checklist/linter, raise thresholds or keep Route 1 experimental.

**Risks:** Salience theory fails in practice; cold-start is bad; LLM judgment unstable.

**Verification standard:** User study, question-regret metric, missed-warning metric, transcript review, fossil trace audit.

---

### Phase 7 — High-level patching interface

**Goal:** Give users a concrete instrument surface without exposing raw DSP programming.

**Dependencies:** Phase 3 modules; Phase 4 arrangement; Phase 6 routes.

**Deliverables:**

- Module-level patching UI.
- Four port classes: signal in/out, control in/out.
- Signal-as-control wiring.
- Visual indication of rate/consequence when salient.
- Agent-authored module insertion flow.
- Arrangement/timeline view linked to patch view.

**Milestones:**

- M1: user can wire oscillator→filter→output.
- M2: user can wire LFO/control output to parameter input.
- M3: user can route audio into control and encounter aliasing consequence.
- M4: user can ask agent for a new module and see it appear after reload.

**Decision gate:** If users must understand Cmajor/low-level DSP to operate it, the grain is wrong.

**Risks:** UI too close to Max; too many port/rate concepts leak; agent-generated modules feel magical/untrustworthy.

**Verification standard:** Task-based usability with musicians; no-code patch construction; explanation quality tests.

---

### Phase 8 — End-to-end alpha: one real musical workflow

**Goal:** Prove the whole loop on one complete workflow.

**Dependencies:** Phases 1–7.

**Candidate alpha workflow:** Build a lo-fi modular loop instrument from prompt, record takes, comp a phrase, add signal-as-control modulation, regenerate a custom pressure-to-frequency module, reload with crossfade, and fossilize the user’s grit preference.

**Deliverables:**

- Full session script.
- Repeatable demo project.
- Metrics dashboard.
- Failure log.
- Exported audio and project snapshot.

**Milestones:**

- M1: prompt-to-patch.
- M2: patch-to-arrangement.
- M3: arrangement-to-fossil.
- M4: fossil-to-next-generation bias.
- M5: Route 1/Route 2 both exercised.

**Decision gate:** If the harness is not visibly “at the center” — if it feels like a code generator that exits — redesign before beta.

**Risks:** Integration brittleness; reload artifacts; dialogue feels bolted on.

**Verification standard:** End-to-end replay from snapshots; independent verifier can trace every audio result to primitives/clamps/fossils.

---

### Phase 9 — Musician beta and salience calibration

**Goal:** Validate that the system feels like discovery, not interrogation.

**Dependencies:** Phase 8 alpha.

**Deliverables:**

- Small musician cohort.
- Clean/mastering persona tests.
- Lo-fi/experimental persona tests.
- Cold-start onboarding tests.
- Route 1 vs Route 2 comparison.
- Calibrated salience thresholds.

**Milestones:**

- M1: users keep using Route 1 voluntarily for some tasks.
- M2: question-regret rate below target.
- M3: missed-warning regret rate below target.
- M4: fossil personalization measurably improves later generations.

**Decision gate:** If Route 1 cannot beat Route 2 + reactive dialogue, ship Route 2 as default and keep Route 1 behind an experimental toggle.

**Risks:** Salience remains subjective and inconsistent; musicians prefer artifact-first always.

**Verification standard:** Quantitative surveys + qualitative transcript analysis + artifact comparisons.

---

### Phase 10 — Hardening, export, and product boundary

**Goal:** Decide what can ship and what remains research.

**Dependencies:** Phase 9.

**Deliverables:**

- Robust project format.
- Crash/panic recovery.
- Export paths: audio, project, C++/plugin where feasible.
- Licensing decision finalized.
- Documentation of primitive/clamp model.
- Model/privacy policy for fossil memory.
- Red-team report.

**Milestones:**

- M1: generated DSP export path works for representative modules.
- M2: project can be reopened across versions.
- M3: clamp verifier has adversarial test suite.
- M4: salience thresholds documented and tunable.

**Decision gate:** If dependency/legal/export risk remains unresolved, do not commercialize.

**Risks:** Cmajor dependency; fossil privacy; versioning; generated-code auditability.

**Verification standard:** Release candidate audits, legal review, reproducible builds/exports, red-team falsification pass.

---

## 8. Evidence Standards Across the Program

Use these standards to keep the project honest:

1. **External capability claims:** must cite Cmajor docs/source or measured spikes. R2/R4 are acceptable starting evidence; implementation must remeasure.
2. **Clamp claims:** must have adversarial fixtures and generation certificates.
3. **Salience claims:** must be tested against user behavior, not just theory.
4. **Intent/fossil claims:** must show different outputs for different histories under the same prompt.
5. **Reload claims:** must include audio measurements and listening tests.
6. **Primitive claims:** any new feature must include a reduction note to the four primitives or explicitly reopen the primitive set.

---

## 9. Key Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---:|---|
| Salience becomes Clippy | High | Conservative thresholds, question budget, Route 2 default/safety net, user studies |
| Reload gap/tail truncation | High | Double-buffer, crossfade, tail bridge, measure early |
| Cmajor license/dependency | Medium | Legal gate, C++ export gate, GPL/commercial decision |
| Boundedness overclaimed | Medium | Do not rely solely on Cmajor; add host/module finite guards and limiters |
| Intent model too weak | High | Fossil schema records surfaced/suppressed consequences and outcomes; A/B fossil-on/off tests |
| Static topology later conflicts with vision | Medium | Phase 0 decision; falsification criterion if live morphing becomes core |
| Harness IR diverges from compiled patch | Medium | Runtime endpoint verification and generation certificates |
| Arrangement store complexity | High | Build non-destructive editing before salience/UI expansion; snapshot/transaction discipline |
| Cold-start salience poor | Medium | Route 2 default, lightweight opening style question, conservative Route 1 |

---

## 10. What Would Falsify This Plan

This plan should be abandoned or substantially revised if any of the following occur:

1. **A fifth primitive is discovered.** A core DAW/workstation feature cannot be reduced to buffer, transform, schedule, routing, or harness metadata over them.
2. **Donald decides topology morphing is a performance gesture.** If live continuous rewiring while audio flows is central to SSI, Cmajor’s static topology makes it the wrong core engine today.
3. **Reload cannot be masked.** Measured JIT/reload times or API constraints make double-buffer/crossfade/tail-bridge impractical for normal edit-time use.
4. **Cmajor licensing is unacceptable.** Commercial terms, termination risk, or GPL constraints block the intended product path.
5. **Cmajor’s API/compiler reality diverges from dossiers.** Endpoint introspection, JIT reload, generated code export, or compiler clamps fail in direct implementation.
6. **The clamp verifier cannot be made stronger than “compile and hope.”** If piNen cannot enforce causality/time/boundedness before Cmajor, the substrate-at-the-center claim weakens.
7. **Salience fails with real users.** Route 1 remains a linter/checklist even after calibration, or users consistently prefer artifact-first and do not value pre-build dialogue.
8. **Fossil memory does not improve generation.** Same-prompt outputs with and without fossil history are not meaningfully different, or differences are not appreciated by users.
9. **The harness does not remain central.** If the system devolves into one-shot code generation plus a DAW UI, it is not SSI in the handoff’s sense.
10. **Generated modules are untrustworthy.** If agent-authored Cmajor processors routinely fail contracts, produce unsafe audio, or cannot be explained, the open-ended palette must be constrained or abandoned.

---

## 11. Final Build Shape in One Sentence

Build a DAW where **piNen is the permanent collaborator and constructor**, the sound engine is **Cmajor-compiled coherent DSP**, malleability happens by **regenerate → verify → double-buffer reload**, arrangement and intent live in a **fossilizing graph store**, and dialogue is governed by **salience-aware ecological coupling** rather than generic warnings.
