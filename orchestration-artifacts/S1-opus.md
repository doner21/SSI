# S1 — Synthesis (Opus 4.8): The Two-Scale SSI DAW

**Role:** Synthesizer S1, creative pole of an adversarial planning loop.
**Status:** Planning only. No code written. This is the best end-to-end PLAN I can defend.
**Inputs:** Handoff (§§1–11), R1 (primitives/closure), R2 (Cmajor mechanics), R3 (intent/salience), R4 (interaction/derisk).
**Posture:** I take strong positions, re-plan §7 from scratch, and make the harness-at-the-center / regenerate-and-reload / salience-aware-dialogue story concrete. Where evidence is thin I flag it in **[THIN]** tags. A competing plan exists; we will both be cross-critiqued. I am writing to win on coherence and nerve, not on caution.

---

## 0. The one-sentence thesis

**SSI for a DAW is not one chromatic scale but two — a closed *signal scale* {buffer, transform, schedule, routing} enforced by Cmajor's compiler, and a closed *intent scale* {reference, revision, convention} enforced by the harness — and the entire ambition of the project lives in the harness's ability to play the second scale *about* the first: to know, for THIS user, which consequence on the signal is worth a sentence.**

Everything below is the argument for that sentence, and the build plan that follows from taking it seriously.

---

## 1. The primitive-set verdict — engaging §6.1 (the un-run attack) head-on

### 1.1 What R1, R4 establish, and where I go further

R1 ran the un-run attack and found **no irreducible arrangement feature**: comping, takes, non-destructive edit history, region aliasing, undo trees, automation, freeze/bounce, tempo maps, the fossil record itself — all reduce to compositions of {buffer, transform(polymorphic over buffer AND schedule), schedule, routing} plus *harness-layer operations*. R4 independently ran the interaction-model attack (high-level patching, signal-as-control, agent-authored modules, polyphony) and also found no fifth signal primitive. Two independent attacks, plus Cmajor's twenty-years-of-Storer corroboration, all converge. **The signal scale is closed and complete for the known DAW domain.** I accept this fully and do not relitigate it.

But R1's verdict contains an unexploded shell, and I am going to detonate it deliberately rather than smooth it over. R1 repeatedly discharges arrangement features into the phrase **"plus harness-layer operations."** Every reduction succeeds *only* by appealing to "the harness maintains a schedule-revision tree," "the harness stores intent→configuration mappings," "the harness manages linked vs unlinked references." R1 even names the cost (Open Risk #2): **"Harness complexity is under-specified … philosophically sound but operationally vague."**

The handoff's §6.1 anticipated exactly this and asked the sharper question: *"is there a fifth primitive that is about the user's working history, not about sound — which would be a very SSI-shaped discovery (intent becoming primitive)?"*

**My verdict — the strong creative position:**

> The un-run attack does **not** break signal-domain closure. There is no fifth *signal* primitive. But the prize the attack hands us is bigger than a fifth member: **the arrangement/intent domain is its own closed domain with its own closed primitive set.** SSI's load-bearing condition (§1: "the invariant holds by construction only if the primitive set is genuinely closed and complete") cannot be satisfied by hand-waving the intent layer as "harness operations." If the intent layer is genuinely SSI, it too must stand on a closed scale. **It does. The intent scale is {reference, revision, convention}.**

This is the discovery §6.1 was hunting for — *intent becoming primitive* — and it lands without disturbing the signal closure. It is the most SSI-shaped possible outcome: doing SSI for the DAW means doing SSI **twice**, at two levels, with two enforcement mechanisms.

### 1.2 The intent scale — three primitives, defined

The intent scale primitives are NOT about sound. They are the irreducible carriers of *working history*. Each is the generalization of a cluster R1 reduced to "harness operations":

1. **Reference** — an immutable pointer into the signal layer: a buffer-ref, a transform-ref, a schedule-entry, or a routing snapshot. *Immutability is the primitive's defining property* (it is why non-destructive editing is non-destructive). Carries: comping/takes (a comp is a schedule of references over take-buffers), region aliasing (N references to one buffer), freeze/bounce (replace a chain-reference with a buffer-reference), ARA exposure (references handed to an external tool).

2. **Revision** — a typed, reversible delta between two configurations, and the tree they form. *Branching is the primitive's defining property* (linear undo is the degenerate single-branch case). Carries: undo/redo, undo trees, project alternatives, the entire non-destructive edit history. A revision references the references it changed; the tree is the song's lived time.

3. **Convention** — a *weighted relation* over signal-scale constructs expressing "this user tends to combine X with Y in context C." *Weight-under-evidence is the primitive's defining property* (a convention strengthens with confirmation, decays with disuse, can be contradicted). Carries: the personal dialect, module-choice affinities, routing habits, deliberate "wrong" choices kept (the grit-lover's aliasing), naming habits. This is the fossil record's atomic unit.

**Closure claim for the intent scale:** Every arrangement-layer feature R1 reduced to "harness operations" is expressible as composition of {reference, revision, convention}. Comping = revisions over schedules-of-references. Edit history = a revision tree. Region aliasing = shared references. Fossil record = an accumulating set of conventions. Group editing = a revision applied across references. Automation capture = a buffer-reference wired as control (one foot in each scale — the *coupling point*, see §1.4).

**[THIN — flag]** This intent-scale closure is a *reasoned-inference* claim of the same kind R1 made for the signal scale, and it has had exactly *one* pass (this one). It has NOT been adversarially attacked the way R1 attacked the signal scale. The competing plan or a red-team should attack it: **find an arrangement feature that is neither a reference, a revision, nor a convention, nor a composition of them.** My best adversarial candidate is *real-time collaborative editing* (two users' intent streams merging) — but I believe it reduces to concurrent revision trees with a merge function (CRDT-shaped), i.e. revision + reference, no new primitive. I flag it as the place to push.

### 1.3 The derived layer is NOT a fourth intent primitive

R3 names three layers (raw memory → fossil record → intent model). I map them onto the intent scale precisely so the architecture stays honest:

- **Layer 1 (raw memory, Engram observations + Graphify)** is the *substrate storage* for references, revisions, conventions. Not a primitive — the disk.
- **Layer 2 (fossil record)** IS the set of conventions (plus the reference/revision history they're abstracted from). It is primitive-level.
- **Layer 3 (intent model)** is the *derived runtime distribution* P(Intent) computed over conventions + the current session. **It is not a primitive.** It is to conventions what a chord-progression-in-progress is to the chromatic scale: a transient structure played *from* the primitives, not a new note. This matters: keeping Layer 3 derived (not stored) is what keeps the intent scale closed at three. If we let the intent model be a primitive we'd lose closure (it would be an unbounded learned blob). Salience is computed, not stored.

### 1.4 The coupling point — why two scales, not one merged set

The two scales touch at exactly one structural seam, and naming it is load-bearing:

> A **convention** (intent scale) biases the generation of a **routing/transform configuration** (signal scale); and a signal-scale output can be captured as a **buffer-reference** (intent scale) and wired back as control. Intent shapes signal; signal sediments into intent.

This is the §11a claim ("intent is co-formed in the loop") given a mechanical location. The harness lives *at this seam* and nowhere else. Cmajor lives entirely on the signal side and is forbidden the intent side (§11d: Cmajor lacks reflexivity, correctly). Engram/Graphify live entirely on the intent side. The harness is the only thing that touches both — which is exactly why "the harness at the center" is not a slogan but a structural necessity: **it is the only inhabitant of the coupling seam.**

### 1.5 Verdict summary

| Domain | Scale | Members | Closure | Enforced by |
|---|---|---|---|---|
| Signal | chromatic scale of sound | buffer, transform, schedule, routing | closed + complete (R1, R4, Cmajor) | **Cmajor compiler** |
| Intent | chromatic scale of working-history | reference, revision, convention | closed (this synthesis; **[THIN]** — one pass) | **piNen harness** |

The un-run attack is answered: **closure holds, and the price of holding it is the discovery of the second scale.** This is a stronger result than "four primitives are complete" because it explains *where the harness complexity that R1 hand-waved actually lives* — it lives on a second closed scale, which means it is boundable, which means SSI's by-construction promise survives into the arrangement layer instead of dissolving into "the harness does it somehow."

---

## 2. Stance on §6.2 — closure vs directional invariant

### 2.1 I adopt R1's pragmatic stance, then sharpen it with the two-scale result

R1's official stance: *the primitive set must be demonstrably complete for the known domain; coherence is guaranteed by directional invariants (substrate clamps); closure-under-coherence is provided by the substrate, not the primitives.* I adopt this. It is right, it is consistent with `SpawnGuard`, it is consistent with Cmajor (language permits cycles; compiler rejects zero-delay ones), and it is the smart-constructor / refinement-type pattern (Pierce).

The handoff worried (§6.2) that "an honest SSI may have to say 'the invariant is as strong as your primitive analysis' rather than promising closure outright." **I take the strong position: SSI should promise closure outright, but at TWO levels with TWO proofs, and be explicit about the residue.** Precisely:

**SSI's official stance (sharpened):**

1. **Completeness is a per-scale proof obligation.** Each closed scale must be shown complete for its known domain (signal: R1/R4; intent: §1.2, **[THIN]**, needs an adversarial pass). Completeness is *expressibility*: every known domain operation is a composition of primitives.

2. **Coherence is a directional invariant, enforced at the construction path, never baked into the primitives.** On the signal scale the directional invariant is the three substrate clamps (causality, boundedness, time-monotonicity). On the intent scale the directional invariant is a *consistency clamp* (see §1.3 and §4.4): the harness may only emit conventions/revisions that keep the revision tree acyclic and the convention set contradiction-resolvable — the intent-scale analogue of "no zero-delay cycle."

3. **The residue is named, not hidden.** R1's Leak C (unknown-unknowns: future DAW paradigms that need a new primitive) is real and SSI does not promise future-proofness. SSI promises: *closure relative to the known domain + a documented, gated process for extending a scale when a genuinely irreducible operation is discovered* (the same lifecycle as shape-builder: proposed → verified → reload → usable). Adding a primitive is a constitutional amendment, not a patch.

### 2.2 Why this is "closure," not merely "direction"

The handoff framed these as alternatives. They are not. The honest formulation is: **the primitives are closed under *expression*; the construction path is closed under *coherence*; together they deliver closure-by-construction.** "Directional invariant" is the *mechanism* by which the construction path achieves its closure — it is not a weaker substitute for closure, it is *how closure is implemented for the coherence subtype* (T_coherent ⊂ T, Pierce). I therefore reject the framing that SSI must "settle for" direction. SSI gets closure; it gets it by direction; the two words name the same wall from two sides.

The one concession to honesty, which I will not let the competing plan out-honest me on: **the completeness half of the proof is inductive, not exhaustive** (R1 Open Risk #1). We have enumerated and reduced every *known* feature; we cannot quantify over the unknown. So the precise, defensible promise is: **"For every DAW operation we or twenty years of Storer's experience have named, the result is coherent by construction. New named operations are tested against the scales; the gate decides reduce-or-amend."** That is closure with an audit trail, which is the most a real framework can offer and more than any shipping DAW offers today.

---

## 3. Substrate-clamp enforcement design — belt, braces, and a runtime net

### 3.1 The architecture: a Coherent Patch IR between intent and Cmajor source

The handoff (§4, Phase 3) and R1 both demand that piNen "cannot emit an incoherent patch," belt-and-braces with Cmajor's compiler. I make this concrete with an intermediate representation:

```
intent ──▶ [Convention-biased planner] ──▶ Coherent Patch IR ──▶ [Clamped Emitter] ──▶ Cmajor source ──▶ [Cmajor compiler] ──▶ Performer
                                              (smart constructor)        (belt)                (braces)
                                                                                                              │
                                                                                          [Runtime amplitude/NaN net] (net)
```

**The IR is the smart constructor.** It is a typed graph where the three clamps are *type-level invariants that cannot be constructed false* — the Pierce refinement-type pattern made operational. The planner cannot hand the emitter an IR that violates a clamp because the IR's constructors refuse it. This is the `SpawnGuard` move lifted to the audio domain: not "validate then emit" but "unconstructable."

### 3.2 The three clamps, three layers each (belt + braces + net)

**Clamp 1 — Causality (no zero-delay feedback).**
- *IR (belt):* A routing edge has a static type `Edge<delay: Nat>`. A cycle in the IR graph is only constructible if the sum of `delay` around the loop is ≥ 1. The IR's `connect` constructor runs a cycle check on every edge addition and refuses a zero-delay closure. Karplus-Strong: constructible (delay present). Screaming loop: *unconstructable* — there is no IR value that represents it.
- *Source (braces):* The emitter writes Cmajor `connection a -> [n] -> b` only when the IR carries the delay. Cmajor's compiler independently rejects any zero-delay cycle (R2: confirmed, `connection p1->p2->p3->p1` is a compile error). Two independent gates; either alone suffices.
- *Net:* none needed — causality is fully static.

**Clamp 2 — Boundedness (terminate; finite amplitude).**
- *IR (belt):* Transforms may only be drawn from a *vetted module library* whose members each carry a proof obligation: bounded output for bounded input, no unbounded recursion. Agent-authored modules (§10d) enter the library only through a gate (§5.5) that includes a boundedness check. The IR cannot reference an unvetted transform.
- *Source (braces):* Cmajor disallows runtime recursion by design (R2: confirmed — "the compiler can determine the maximum stack size") and bounds all allocation (compile-time-constant arrays). Termination and bounded stack are compiler-guaranteed.
- *Net (this is where belt-and-braces is genuinely insufficient and a NET is required):* **Boundedness of *amplitude* is NOT statically provable for arbitrary linear systems** — a numerically unstable IIR filter, a resonant feedback path at high Q, or a pathological parameter automation can still produce inf/NaN at runtime even with a legal topology. Cmajor does not guarantee finite amplitude, only finite stack. **Therefore the design mandates a runtime net:** every signal-output endpoint passes through a harness-inserted *guard transform* (a `std::levels`-style saturator + NaN/inf flush-to-silence + DC blocker) before the DAC. This is itself a transform on the signal scale — it costs nothing in the primitive count — but it is *mandatory and non-removable* by intent. It is the audio analogue of "the spawn cap you cannot raise." The handoff's "NaN/inf guard" (§4.2) is thereby relocated from a hope to an always-present node.

**Clamp 3 — Time-monotonicity (single coherent timeline).**
- *IR (belt):* Schedules compile to a single resolved timeline. When two schedule entries collide on the same output at the same time, the IR's schedule-resolver *mandatorily inserts a summing bus* (the handoff's §4.3 rule). There is no IR value representing an unresolved collision — collisions are resolved at construction, not deferred.
- *Source (braces):* The emitter writes the summing bus as an explicit Cmajor mixing node. Cmajor's deterministic single-rate execution model gives one coherent frame clock.
- *Net:* the amplitude net (Clamp 2) also catches a summing bus that sums to clipping.

### 3.3 The intent-scale consistency clamp (the fourth, often-forgotten clamp)

Because §1 elevates intent to a closed scale, it needs its own directional invariant. The **consistency clamp** governs the harness's emissions on the intent scale:
- A *revision* may only be appended if it keeps the revision tree acyclic (no revision is its own ancestor) and reversible (carries its inverse).
- A *convention* may only be written through the contradiction-resolver: if a new convention contradicts an existing one (saturation→filter in session 3, filter→saturation in session 7), the resolver does not overwrite — it *contextualizes* (both conventions retained, conditioned on context C; R3's exponential-decay/sliding-window weighting applies). This is the intent-scale analogue of the summing bus: collisions are resolved by composition, not by clobber.

This clamp is enforced by piNen alone (Cmajor has no view of intent). It is the reason the intent scale stays closed and the fossil record stays queryable rather than becoming a contradictory blob.

### 3.4 Why three layers and not just trust Cmajor

Cmajor's compiler is strong but it guards *its* concerns (real-time safety), not *ours* (coherent musical artifacts). The IR belt exists so that **piNen never even forms an incoherent intent** — failures surface as "I can't build that, here's why" at plan time (which feeds the dialogue, §5), not as a compile error the user has to interpret. The compiler braces exist as an independent witness (defense in depth; catches emitter bugs). The runtime net exists because amplitude is the one coherence property neither the IR nor the compiler can fully prove statically. Remove any layer and a real failure class leaks. This is the honest, complete enforcement story.

---

## 4. The arrangement/fossil store + intent model + the salience principle (the heart)

This is where the project is won or lost (handoff §11e, §6.8; R3). I make it concrete.

### 4.1 Storage: three layers on the intent scale

| Layer | Content (in intent-scale terms) | Backing store | Read at |
|---|---|---|---|
| **L1 Raw** | every reference and revision, verbatim | Engram observations (typed: pattern/preference/decision) + Graphify (structural relations between patches) | recall, audit |
| **L2 Fossil** | the **conventions** — de-duplicated, contradiction-resolved, context-tagged, evidence-weighted | Engram topic-keyed records + Graphify community structure organizing them | regeneration biasing; dialogue enrichment |
| **L3 Intent model** | derived P(Intent) distribution — NOT stored | computed at session start from L2, updated incrementally | regeneration biasing; **salience calibration** |

R3's three-layer decomposition is adopted wholesale because it maps exactly onto §1's intent scale (L2 = conventions; L3 = derived; L1 = the disk). The crucial discipline: **L3 is recomputed, never persisted** (§1.3). Persisting it would break intent-scale closure and let stale opaque state accumulate.

### 4.2 Plan-time biasing — the personal-dialect mechanism, made mechanical

The handoff's central SSI claim (§6.6) is that the store is read *at plan time to bias regeneration*, not merely for recall. Mechanically:

When intent arrives, the convention-biased planner (§3.1) queries L2 for conventions matching the current context, and uses them to choose among coherent IR candidates: module choice ("this user prefers 4-pole LPF"), routing order ("saturation before filter"), parameter defaults, naming. **The biasing only ever selects among already-coherent IRs** — it cannot bias toward an incoherent patch because the IR constructors forbid those. So the personal dialect operates *inside* the coherence envelope. This is the precise unification the handoff wanted: the same directional-invariant machinery that enforces signal coherence also bounds where intent can push.

### 4.3 The salience principle — adopting and committing to R3's S1–S6

R3 produced a defensible, five-framework-grounded principle. I **adopt it as the project's official salience principle** and commit the architecture to it. Restated as the design contract for Route 1:

> A detected consequence C earns a question **iff** it passes a two-stage filter:
> **Stage A — Surprise×Affordance (is it worth noticing?):** S1 Bayesian surprise KL(P(Intent|C) ‖ P(Intent)) > θ_surprise, computed against *this user's* L3 prior; AND S2 the consequence materially changes the user's action possibilities (Gibsonian affordance).
> **Stage B — Relevance×Value (is it worth *saying*?):** S3 expected cognitive benefit > processing effort (Sperber–Wilson); AND S4 EVSI(C) > cost-of-interruption (value-of-information).
> **Ranking:** S5 among survivors, surface highest Expected-Information-Gain first, stop at a turn budget.
> **Override:** S6 any substrate-clamp safety violation is surfaced *always*, regardless of salience — but note §3 means most clamp violations are *unconstructable*, so S6 mostly fires on "you asked for the unbuildable; here's the nearest buildable thing."

The thing that makes this SSI and not a linter, in one line: **the prior in S1 is the fossil record in distributional form (L3).** A linter has no user; it cannot compute S1; it surfaces everything. SSI computes surprise *against THIS user's accumulated conventions*, so the grit-lover and the mastering engineer get *different questions about the identical aliasing event* (R3's worked example, which I adopt as a canonical acceptance test — §7 Phase 5).

### 4.4 How Route 1 avoids becoming a clippy — the four structural guarantees

The handoff's deepest fear (§11e) is Route 1 degrading into a form-to-fill-out. Four structural defenses, in priority order:

1. **Route 2 is the default, not Route 1 (R3's inversion, adopted).** The system *builds and lets you hear* by default. Route 1 (spec-first interrogation) is the *premium, opt-in* layer. This single inversion does most of the work: a system that mostly stays quiet cannot be a clippy. The handoff implied Route 1 was primary; R3 and I invert that, and I commit to it.

2. **Conservative threshold + asymmetric costs.** Route 1 surfaces only Stage-A∧Stage-B survivors with θ_surprise set *high*. False positives (trivial interruptions) destroy Route 1; false negatives (a missed consequence) are *caught for free by Route 2* (the user hears it and asks). So the calibration is deliberately biased toward silence. Missing things is cheap; nagging is fatal.

3. **The turn budget (S5).** Even when many consequences survive, only the top-EIG few per interaction are surfaced. Interrogation floods are structurally impossible — there is a hard cap on questions per intent, the dialogue analogue of the spawn cap.

4. **The cold-start guard.** A new user has no L2, so L3 is a generic prior and S1 is uncalibrated — the single most likely clippy trigger (R3 Risk #2). Defense: for users below a fossil-evidence threshold, Route 1 is *disabled by default* and replaced with one opening framing question ("what kind of sound are you after?") that seeds a genre prior; Route 1 unlocks only once L2 has enough conventions to make S1 meaningful. **The system earns the right to interrogate by first learning the dialect.**

### 4.5 The honest thin spots in the salience design

**[THIN — flag, do not smooth]** Three things in §4 are reasoned-from-theory but *empirically unvalidated*, and the plan must treat them as research, not implementation:
- **θ_surprise** has no theoretical value (R3 Risk #1). It must be tuned by musician studies. Until then Route 1 is conservative-by-fiat.
- **The relevance estimate (S3)** requires the agent to predict what a user will *learn* — LLMs do this qualitatively, not quantifiably (R3 Risk #4). This is a genuine ceiling, mitigated only by Route 2 as the safety net.
- **"Does it feel like discovery?"** is answerable only by user studies (R3 Risk #6). The plan bakes in an A/B acceptance gate (§7 Phase 5): surfaced-consequences vs the musician's own post-hoc list of "things I wish I'd been warned about." If that gate fails after calibration, the *dialogic claim* is falsified (§8) even though the rest of the system still ships as a fine Route-2 DAW.

---

## 5. The spec-driven-ecological workflow as a piNen SHAPE

### 5.1 It is a sibling shape on the substrate, toggled by slash command

Per handoff §11c and the existing `spec-driven-ecology` skill (15-phase ecological intake), the workflow is **a toggleable orchestration shape** in piNen's exact sense: it stands on the substrate, is a sibling to plan-execute-verify et al., never imports another shape, and is registered in the registry. A slash command (`/spec-driven-ecological-design-intent`) toggles it. **ON → Route 1 (spec-first interrogation gated by §4.3 salience). OFF → Route 2 (predict-and-build).** This requires no new core machinery (§11c is correct — the substrate already hosts toggleable shapes); what is unproven is the *judgment inside it* (§4.3 salience), not the plumbing.

### 5.2 The shape's internal loop (one diagram)

```
intent intake
   │
   ├─ (consult L2 conventions: bias)
   ▼
candidate Coherent-Patch-IRs  ◀── [IR constructors: clamps unconstructable-false]
   │
   ├─ static consequence detection (aliasing, clipping headroom, latency, CPU) — arithmetic, cheap
   ▼
   ROUTE SWITCH (shape ON/OFF?)
   │
   ON  ─▶ salience filter S1–S6 (against L3 prior) ─▶ surface top-EIG question(s) ─▶ user answers / asks "what is X?" ─▶ intent sharpens ─▶ loop
   │                                                                                          (the enactive learning mechanism)
   OFF ─▶ pick convention-best IR ─▶ build
   │
   ▼ (both routes converge)
emit Cmajor source ─▶ compile ─▶ RELOAD BRIDGE (§6) ─▶ play
   │
   ▼
sediment: write references + revision + (if confirmed) conventions to L1/L2  ── the fossil grows
```

The two routes are the **same loop entered from opposite ends** (handoff §11b): Route 1 sharpens intent *before* the build via the salience-gated question; Route 2 sharpens it *after* via the heard artifact and the user-initiated "what's causing this?". The "what is aliasing?" question is not a detour — it is the mechanism (§11b); it routes into a teaching sub-dialogue and *then back into the loop with sharpened intent*, and that sharpening writes a convention.

### 5.3 The 15-phase ecological skill maps onto Route 1 — but compressed by the closed scales

The existing `spec-driven-ecology` skill's heavy phases (invariants, constraints mapping, affordance analysis, attractor/failure-mode analysis, perturbation tests) are *exactly* the salience machinery, and they become **cheap** here because the scales are closed and small. R3's key structural insight (Flash Fill / PbD): intent inference is tractable *because the program space is tiny*. The four signal primitives + three intent primitives ARE that tiny DSL. So the ecological intake does not have to reason over open-ended software — it reasons over a 7-primitive space with statically computable consequences. The skill's "affordance analysis" = S2; its "failure-mode analysis" = consequence detection + S6; its "perturbation tests" = the adversarial closure passes. The shape *is* the ecological skill, instantiated on closed scales, gated by salience.

---

## 6. §6.3 — state across reload: R2 says state is NOT preserved. Designing around the audible gap.

### 6.1 The finding, accepted without flinching

R2 read the Cmajor `Patch` source and confirmed: `rebuild()` saves parameter values and re-applies them, but `setNewRenderer()` **destroys the old Performer entirely** before the new one runs. **Processor DSP state — delay-line buffers, reverb tails, filter state, LFO phase — is zero-initialized in the new Performer. The reload boundary IS audible: a gap (single-digit ms for trivial patches; 50–500ms for complex ones, unmeasured) plus truncated tails and silent-until-refilled delays.** Parameter values survive; *sound state does not*. This is real and I do not pretend otherwise.

This is the single biggest threat to the "malleable instrument" image, because a click/pop/silence on every topology edit makes regenerate-and-reload feel like a compromise rather than the correct topology the handoff (§5d) claims. So the plan must *convert the gap into a morph*. Three mechanisms, in order of leverage:

### 6.2 Mechanism 1 (highest leverage) — don't reload at all when you don't have to

The decisive move is **edit classification**, made possible by the §1 two-scale split and R2's "what CAN change live" table:

- **Parameter-class intents** ("make the cutoff brighter," "more reverb," "slower LFO") → realized as live `setInputValue`/`addInputEvent` writes with `rampFrames`. **No reload, no gap, sample-accurate.** R2 confirms these are fully live.
- **Topology-class intents** ("add saturation before the filter," "insert a new module," "rewire") → require regenerate-and-reload.

The planner *always prefers the parameter-class realization when one exists.* Many intents the user *thinks* are structural are realizable as parameter moves on a slightly more general pre-built graph (e.g., a saturation module already in the chain at `drive=0`, brought up live, rather than inserted). **The harness's job is to keep the standing graph general enough that as many future intents as possible are parameter-class.** This is a generation-time strategy: emit graphs with dormant, zero-contribution stages that intent can *activate* live. Reload becomes the exception, not the rule. This alone removes the gap from the majority of editing gestures.

### 6.3 Mechanism 2 — the Reload Bridge (parallel-Performer equal-power crossfade)

When a topology reload is genuinely required, do **not** use Cmajor's native `rebuild()` (which stops-then-swaps). Instead, piNen runs a **Reload Bridge** at the host level:

1. Build and compile the new Performer on a background thread (R2: `Build` runs on a background thread already) **while the old Performer keeps playing.**
2. When the new Performer is ready, run **both Performers in parallel** for a short window (~20–50ms).
3. Equal-power crossfade old→new at the host mixer.
4. Drop the old Performer.

R2 explicitly notes the hooks exist (`stopPlayback`/`startPlayback`) and that "save the old Performer's output for a crossfade … run both old and new Performers briefly in parallel for a seamless crossfade" is achievable — **but that "The Patch class does NOT do this natively."** So this is *piNen engineering on top of the Patch API*, not a Cmajor feature. **[THIN — flag]** The Bridge is a *design proposal*, unbuilt and unmeasured. Its viability is the single most important empirical unknown in the engine layer and is the headline objective of Phase 1.

The Bridge's beautiful property: **the old Performer is still running during the crossfade, so the old reverb tail and delay feedback keep ringing through the fade.** The crossfade *is* the tail preservation. We don't migrate the reverb state — we let the old instrument finish its sentence while the new one starts speaking. This reframes R2's "tails are truncated" from a defect into a non-issue *for the crossfade window*, at the cost of brief double-CPU.

### 6.4 Mechanism 3 — explicit state migration where identity survives

For state that *should* persist across a topology change (a delay line whose module is unchanged but whose neighbors changed), use Cmajor's stored-state key-value API (R2: `requestFullStoredState`/`sendFullStoredState`, `setStoredStateValue`) to snapshot and re-inject state for modules whose endpoint identity is preserved across the regeneration. Where identity is preserved, migrate; where topology genuinely replaces a module, the Bridge (§6.3) covers the seam. The planner knows which is which because *it generated both source versions* and can diff them (this is the §6.5 reflexivity the seam needs — R2 confirms the introspection surface is sufficient).

### 6.5 The honest verdict on §6.3

The reload boundary is **audible by default but designable to inaudible** through: (1) avoiding reload for parameter-class intents [free, high-coverage], (2) the Reload Bridge crossfade [engineering, **[THIN]** unproven], (3) state migration for identity-preserved modules [API-supported]. **The handoff's §5d claim that regenerate-and-reload is "the correct topology, not a compromise" survives — but only conditionally on the Bridge working.** If the Bridge proves infeasible or the crossfade audibly artifacts on sustained material, then regenerate-and-reload is a compromise that bites exactly the use case the handoff said it wouldn't ("mid-note") — and that is a falsifier (§8). I rate the Bridge *likely* to work (the hooks exist, the technique is standard in plugin hosts) but *unproven*, and I refuse to plan as if it were proven.

---

## 7. The re-planned roadmap (§7 rebuilt from scratch)

The handoff's §7 is explicitly disposable. I discard it and re-plan around the two-scale architecture, with the Reload Bridge and salience calibration as the two highest-risk empirical unknowns pulled as early as possible. **Principle: front-load the things that can falsify the plan.**

Each phase states: objective, dependencies, milestones, decision gate, evidence standard, primary risk.

### Phase 0 — Constitution & Go/No-Go (no code)
- **Objective:** Ratify the architecture's constitutional commitments before any build.
- **Work:** Sign off the two-scale primitive verdict (§1). Adopt the §2 closure stance, §3 clamp architecture, §4.3 salience principle, R3's Route-2-default inversion. Resolve the two *non-technical* blockers R4 surfaced: (a) **Donald confirms the regenerate-and-reload vision** — topology change is an *edit*, not a *performance gesture* (§6.4); if he wants continuous mid-note morphing, Cmajor is wrong and we stop here. (b) **Legal review of Cmajor's at-will EULA termination clause (§7.1)** and Pro-tier pricing — get clarity before heavy investment; confirm GPLv3 fallback acceptable for the prototype.
- **Dependencies:** none.
- **Milestone:** a signed one-page constitution + a Go/No-Go on Cmajor.
- **Decision gate G0:** *Is the vision regenerate-and-reload, and is the Cmajor dependency acceptable for the prototype?* No → re-scope engine before spending. Yes → proceed.
- **Evidence standard:** architect sign-off; a lawyer's read of the EULA; a written quote or confirmed-irrelevant Pro tier.
- **Primary risk:** the vision secretly requires continuous morphing → whole engine bet is wrong. Mitigated by making this question explicit and first.

### Phase 1 — The Seam Spike + Reload-Bridge measurement (smallest real code)
- **Objective:** De-risk the two engine unknowns empirically before building anything on them.
- **Work:** piNen generates a trivial Cmajor patch; loads it via the C++/JS API (R2 confirms the surface); drives a parameter live (prove parameter-class no-reload path, §6.2); then regenerates a *topology* change and measures the reload. **Build the Reload Bridge prototype (§6.3): parallel Performers + equal-power crossfade.** Measure: native gap duration vs bridged-crossfade artifact, on (a) a percussive patch and (b) a *sustained pad with a long reverb tail* (the worst case).
- **Dependencies:** G0 pass.
- **Milestones:** M1.1 round-trip generate→load→param-change works; M1.2 native reload gap measured (fills R2's unmeasured number); M1.3 Bridge crossfade implemented and A/B-listened on sustained material.
- **Decision gate G1:** *Is the reload boundary made inaudible (or acceptably musical) by the Bridge on sustained material?* No → escalate: either accept reload only at silence boundaries (degrades the malleability image) or reconsider engine. Yes → the §5d "not a compromise" claim is empirically earned.
- **Evidence standard:** measured millisecond numbers; blind A/B listening notes from at least one trained ear; recorded audio artifacts of the crossfade on the pad case.
- **Primary risk:** Bridge artifacts on sustained material **[THIN]** — this is the plan's biggest unproven engineering claim, deliberately tested in Phase 1.

### Phase 2 — Coherent Patch IR + Clamped Emitter (the signal substrate)
- **Objective:** Make incoherent signal patches *unconstructable* by piNen, belt-and-braces with Cmajor.
- **Work:** Implement the IR (§3.1) with clamp-as-type-invariant constructors (causality, time-monotonicity static; boundedness via vetted-library + mandatory runtime amplitude/NaN net §3.2). Implement the emitter IR→Cmajor source. Adversarially fuzz: attempt to drive the planner into emitting a zero-delay cycle, an unresolved schedule collision, an unbounded output — the IR must refuse, and if a bug slips, Cmajor's compiler must catch it.
- **Dependencies:** Phase 1 (need the working generate→compile path).
- **Milestone:** M2 — a fuzzing harness that cannot produce an incoherent patch through the emitter; the mandatory amplitude net verified to flush a deliberately-unstable IIR to silence rather than inf.
- **Decision gate G2:** *Can any adversarial intent produce an incoherent compiled patch?* If yes → the by-construction promise is broken; fix before proceeding (this gate is the §3 claim under test).
- **Evidence standard:** a passing adversarial fuzz suite; a documented attempt-and-failure log for each clamp.
- **Primary risk:** amplitude unboundedness leaks past both belt and braces (R2: Cmajor doesn't guarantee finite amplitude) → the runtime net is load-bearing and must be proven, not assumed.

### Phase 3 — Module Palette + High-Level Patching Shape (the signal interaction model)
- **Objective:** Deliver the §10 interaction model: four-port modules, signal-as-control unification, three-control-sources-one-mechanism, agent-authored modules, rate-as-enacted-constraint.
- **Work:** Build the module palette over Cmajor's standard library (R4: oscillators, filters, envelopes, `std::voices::VoiceAllocator` for polyphony — *not a primitive*). Implement the patching UI as a *piNen arrangement-layer projection* (R4: not a primitive; lives in the harness). Implement agent-authoring of new modules (§10d) as the regenerate-and-reload loop at module grain, with the new module entering the vetted library only via the boundedness gate (§3.2). Implement static rate-mismatch detection (§10e) as a consequence feeding Phase 5's salience.
- **Dependencies:** Phase 2 (modules are IR transforms; authoring uses the emitter).
- **Milestone:** M3 — a user can wire a small patch (osc→filter→reverb), wire an LFO and a signal-as-control modulation, and ask the agent to author one novel module that appears as a wireable node.
- **Decision gate G3:** *Does agent-authoring of a module reduce cleanly to the existing emit→gate→reload path with no special-case machinery?* (R4 predicts yes.) If it needs bespoke machinery → the "open-ended palette via harness" justification weakens.
- **Evidence standard:** a working patch session; a demonstrated agent-authored module passing the boundedness gate.
- **Primary risk:** the introspection needed to *talk about* a patch (not just build it) is thinner than R2 claims for complex multi-node graphs — piNen must maintain its own graph model (R2 Risk #3: API can't read internal connection graph; piNen knows it because it generated the source). Consistency between piNen's model and the compiled program is the watch item.

### Phase 4 — The Intent Scale: Arrangement / Fossil Store (the second substrate)
- **Objective:** Build the intent scale {reference, revision, convention} and its three storage layers — the SSI-defining, non-DSP engineering that R1 named "the hardest part that isn't about signal."
- **Work:** Implement immutable **references** (carrying comping, aliasing, non-destructive editing, freeze/bounce). Implement the **revision** tree (undo/redo, branches, project alternatives) with the consistency clamp (§3.3: acyclic, reversible). Implement **conventions** in L2 (Engram topic-keyed + Graphify-organized) with the contradiction-resolver (context-tagged, evidence-weighted, time-decayed). Implement L3 as a *derived, recomputed-each-session* intent model. Choose the L3 schema: **start rule-based+weights** (R3's MVP recommendation — tractable because the 7-primitive space is tiny), with a documented migration path to a Bayesian representation once preference dimensions exceed ~10 or contradictions become common.
- **Dependencies:** Phase 3 (conventions are *about* signal-scale constructs, so the signal scale must exist to reference).
- **Milestone:** M4 — across a session: non-destructive edits with branching undo; a region-alias edit propagating to linked copies; at least three confirmed user choices sedimenting into conventions that *measurably bias the next regeneration* (the personal-dialect mechanism demonstrated, §4.2).
- **Decision gate G4:** *Does a convention learned in session N demonstrably change the patch generated in session N+1, transparently (user can ask "why did you put saturation there?" and get the convention back)?* This is the make-or-break test for "plan-time biasing, not just recall" (§6.6). No → the personal-dialect claim is unrealized.
- **Evidence standard:** a reproducible two-session demo where the same intent yields different (dialect-shaped) patches for two different fossil records; the transparency query answered from L2.
- **Primary risk:** harness complexity (R1 Open Risk #2) — this is the largest engineering surface and the easiest to under-build into "we store some preferences." The intent-scale closure discipline (§1) is the guard: every feature must be a reference, revision, or convention, or it doesn't ship.

### Phase 5 — The Salience Engine + Spec-Driven-Ecological Shape (the heart, and the gauntlet)
- **Objective:** Make Route 1 *discovery, not interrogation* — implement and *calibrate* the §4.3 salience principle inside the toggleable shape.
- **Work:** Implement the shape (§5) as a substrate sibling with `/spec-driven-ecological-design-intent` toggle, Route 2 default. Implement salience in stages (R3's MVP path): **S6 first** (safety overrides — mostly "nearest buildable thing" since §3 makes most violations unconstructable), **then rule-based S1–S5** for the known high-stakes consequences (aliasing, clipping headroom, feedback, latency), **then** Bayesian-surprise S1 once L3 is rich enough. Implement the cold-start guard (§4.4). Run the **calibration gauntlet** with musician testers.
- **Dependencies:** Phase 4 (S1 needs the L3 prior; no fossil → no personal salience).
- **Milestones:** M5.1 the canonical R3 acceptance test passes — *identical aliasing event, grit-lover gets silence (Route 2), mastering-engineer gets a question* (the personal-dialect salience property, §4.3); M5.2 turn-budget caps interrogation; M5.3 the A/B "discovery vs interrogation" study.
- **Decision gate G5 (the project's central gate):** *In blind testing, do musicians experience Route 1 as discovery rather than a form to fill out, AND does the surfaced set correlate with their own post-hoc "wish I'd been warned" list better than a generic linter does?* No → **the dialogic claim is falsified (§8); ship the Route-2 DAW (still valuable) and demote Route 1 to an experimental feature.** Yes → SSI's defining ambition is empirically realized.
- **Evidence standard:** the R3 worked-example test automated as a regression; ≥ a handful of musician sessions with both quantitative (precision/recall vs their list) and qualitative (felt-sense) measures; θ_surprise tuned from real data, not chosen by fiat.
- **Primary risk:** **[THIN]** salience calibration (R3 Risk #1,2,4,6) — theoretically grounded, empirically unproven; θ_surprise has no analytic value; "feels like discovery" is only answerable by studies. This is where the project most likely fails *quietly*, so the gate is made loud and binary.

### Phase 6 — First Real Instrument, end-to-end
- **Objective:** The handoff's original Phase 4 milestone, now properly supported: the harness builds one non-trivial, user-shaped DAW configuration (a small tracker-style OR modular-style layout) end-to-end, driven purely by intent, with the fossil accumulating across a multi-session arc and biasing regeneration.
- **Dependencies:** Phases 1–5.
- **Milestone:** M6 — a recorded multi-session build of a real instrument where (a) coherence never breaks, (b) reloads are inaudible via the Bridge/parameter-class strategy, (c) the dialect visibly shapes generation, (d) Route 1 and Route 2 both demonstrably sharpen intent.
- **Decision gate G6:** *Is this recognizably SSI — a malleable instrument grown around a permanent harness — and not just a scriptable DSP host?* The integrative judgment.
- **Evidence standard:** the full session recording + a narrated walkthrough mapping each moment to the architecture.
- **Primary risk:** integration surprises; the parts working separately but the *felt* experience not cohering.

### Phase 7 — Hardening, Export Insurance, Dependency De-risk
- **Objective:** Convert the prototype into something durable against the engine bet.
- **Work:** Exercise Cmajor's C++ export path early and repeatedly (R2/R4: generated C++ is yours, dependency-free — the strongest mitigation) so the DSP investment is always recoverable. Resolve the commercial-license decision if commercializing. Document the constitutional amendment process for adding a primitive to either scale.
- **Dependencies:** an instrument worth hardening (Phase 6).
- **Decision gate G7:** *If Cmajor died tomorrow, what survives?* The answer must be "all the DSP algorithms (as exported C++) and the entire intent scale; we lose only the JIT malleable loop until re-hosted." If the answer is worse, the export path isn't being exercised enough.
- **Primary risk:** the export path preserves *algorithms* but not the *malleable loop* (R4 limitation) — the harness's generate→compile→reload depends on a live JIT; export gives a frozen instrument. Lock-in of the *malleability*, not the DSP, is the residual risk. Named, not solved.

### Dependency graph (summary)
```
Phase 0 (constitution, Go/No-Go)
   └─▶ Phase 1 (seam spike + Reload Bridge)        ◀── falsifier-first: engine unknowns
          └─▶ Phase 2 (Coherent IR + clamps)        ◀── signal substrate
                 └─▶ Phase 3 (palette + patching)   ◀── signal interaction
                        └─▶ Phase 4 (intent scale + fossil)  ◀── second substrate
                               └─▶ Phase 5 (salience + spec shape)  ◀── the heart, central gate G5
                                      └─▶ Phase 6 (first instrument)
                                             └─▶ Phase 7 (hardening + export)
```
Note the deliberate ordering: the **two empirically-thin, plan-falsifying unknowns (Reload Bridge in P1, salience calibration in P5)** are positioned as early as their dependencies allow, each behind a loud binary gate. We learn whether the plan is wrong before we have built everything on top of it.

---

## 8. What would falsify this plan

Stated as concrete, checkable failure conditions. Any one firing forces re-architecture, not a patch.

1. **A genuinely irreducible arrangement feature.** Someone exhibits a DAW operation that is neither a reference, a revision, nor a convention, nor a composition of the seven primitives across both scales. → The two-scale verdict (§1) is false; either a primitive is missing or the closure claim collapses. *(My adversarial nominee to test first: real-time multi-user collaborative editing. I believe it reduces; prove me wrong.)* **[Intent-scale closure has had only one pass — this is the most under-tested claim in the plan.]**

2. **The Reload Bridge can't hide the seam on sustained material.** Phase 1 measures the crossfade on a long-reverb pad and a trained ear hears an unacceptable artifact, and parameter-class avoidance (§6.2) can't cover the structural edit. → Regenerate-and-reload IS a compromise that bites the use case §5d claimed it wouldn't; the malleable-instrument image is downgraded to "malleable only at silence boundaries." **[This is the plan's thinnest engineering claim; R2 confirms the Patch class doesn't crossfade natively.]**

3. **Salience can't be calibrated into discovery.** After Phase 5 calibration, blind musician testing (G5) still experiences Route 1 as a clippy regardless of θ_surprise, OR the surfaced set is no better correlated with users' real wishes than a generic linter. → SSI's *central ambition* (§11e) is falsified. The system still ships as a competent Route-2 DAW, but the dialogic-coupling claim — the thing that made it SSI rather than a scriptable host — is dead. **[Empirically unproven; R3 flags θ_surprise, the relevance estimate, and "feels like discovery" as study-only.]**

4. **The convention store can't bias regeneration transparently.** Phase 4's G4 fails: a learned convention either doesn't change next-session generation (it's recall, not plan-time biasing — §6.6 claim false) or it changes it opaquely (user can't get the "why"). → The personal-dialect mechanism, SSI's accumulation claim, is unrealized.

5. **piNen's graph model diverges from the compiled program.** The API can't introspect internal connections (R2 Risk #3); piNen relies on its own model of what it generated; a class of emitter bugs makes the two disagree and the harness "talks about" a patch that isn't the one playing. → The reflexivity-at-the-seam premise (§6.5/§11d) is unsafe; the dialogue is built on a model that can lie.

6. **Amplitude unboundedness leaks past belt, braces, AND net.** A pathological-but-clamp-legal patch produces audible inf/NaN/runaway that the mandatory runtime guard (§3.2) fails to catch. → The by-construction coherence promise (§2, §3) is broken at exactly the property neither IR nor compiler can prove statically.

7. **The vision was continuous morphing all along.** If Donald, in use, finds he wants to reshape the *running* graph as a continuous performance gesture (not between edits), Cmajor-as-it-stands cannot do it (R2/R4: dynamic routing is roadmap-only, no timeline) and the whole engine bet is wrong. → G0 was answered incorrectly; restart engine selection. *(Cheap to avoid: G0 asks this explicitly and first.)*

8. **Cmajor dies and export can't preserve malleability.** The SOUL pattern repeats (R4: same authors abandoned SOUL in 2021; at-will EULA termination clause), and the C++ export — which preserves DSP algorithms but NOT the JIT-driven generate→reload loop (R4 limitation) — leaves no path to keep the instrument *malleable*. → The malleability (the whole point) is lost even though the algorithms survive. Mitigated, not eliminated; named as residual.

---

## 9. Where my evidence is thin (consolidated honesty ledger)

| Claim | Strength | Why |
|---|---|---|
| Signal scale closed/complete | **Strong** | R1 + R4 independent adversarial passes; Cmajor corroboration |
| Intent scale {reference, revision, convention} closed | **[THIN]** | One pass (this synthesis); not adversarially attacked; #1 falsifier target |
| Clamps unconstructable via IR + compiler | **Strong (design), unbuilt** | Pierce pattern + Cmajor confirmed (R1, R2); not yet implemented (Phase 2) |
| Runtime amplitude net necessary & sufficient | **Medium** | Necessity strong (Cmajor doesn't bound amplitude, R2); sufficiency unproven (Phase 2) |
| Parameter-class no-reload covers most edits | **Medium** | R2 confirms live param writes; the *coverage fraction* is an unproven generation-strategy bet (§6.2) |
| Reload Bridge crossfade makes the seam inaudible | **[THIN]** | Hooks exist (R2) but Patch doesn't do it natively; unbuilt, unmeasured; Phase 1 headline |
| Reflexivity sufficient for build + dialogue | **Strong-ish** | R2 confirms rich endpoint introspection; internal-graph gap closed by piNen-owns-source, with a consistency caveat |
| Salience principle S1–S6 is the right design | **Medium (theory), [THIN] (calibration)** | Five peer-reviewed frameworks (R3); θ_surprise & "feels like discovery" are study-only |
| Route-2-default prevents clippy | **Medium** | Strong structural argument (R3) but the felt outcome is empirical (G5) |
| Cmajor dependency manageable | **Medium** | C++ export is real (R4); at-will EULA termination & Pro pricing unresolved → G0 legal gate |

---

## 10. The plan in one breath

Build SSI for the DAW as **two closed chromatic scales**: the signal scale {buffer, transform, schedule, routing}, kept coherent by a clamped IR belt, Cmajor's compiler braces, and a mandatory runtime amplitude net; and the intent scale {reference, revision, convention}, kept coherent by a consistency clamp and stored in three layers (Engram raw → fossil conventions → derived intent model). The harness lives at the single seam where conventions bias signal generation and signal sediments into conventions. Malleability is **regenerate-and-reload**, made inaudible by *not reloading when a live parameter write will do* and, when reload is unavoidable, by a parallel-Performer crossfade Bridge that lets the old instrument finish its sentence. The dialogic heart is a **toggleable spec-driven-ecological shape**, Route-2-by-default, whose Route-1 questions are gated by a five-framework salience principle computing surprise *against this user's fossil record* — which is the one thing that makes it SSI and not a linter. Front-load the two unknowns that can kill it (the Bridge in Phase 1, salience calibration in Phase 5), each behind a loud binary gate, and you have either built the instrument the handoff imagined or learned exactly why it can't be built — which is the only honest definition of success for a project this ambitious.

---

*End of S1 synthesis.*
