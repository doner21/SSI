# SSI DAW — Final Build Plan (Plan of Record)

**Role:** FINAL PLANNER F1 (Opus 4.8). Planning only; no code written.
**Base:** `syntheses/S3-merged.md`. **Adversary closed against:** `critiques/C3-redteam-merged.md` (14 findings, 6 plan-lock blockers) plus C1/C2 lineage. **Grounding:** `research/R1–R4`, `INPUT-SSI-DAW-handoff.md`, Cmajor source as cited in R2/R4.
**Mandate honored:** every C3 must-fix is either *closed in the text* or *named as an explicit open decision for Donald* with the exact tradeoff and the evidence that would resolve it. No silent passes. No false "by construction." Residual leaks are stated, because the handoff's own verification standard requires it: *"an honest SSI may have to say 'the invariant is as strong as your primitive analysis.'"* This plan says exactly that, in the one domain (intent) where it is true.

**Reading note on epistemic status (closes C3-Finding-14):** throughout, three labels are used and kept distinct.
- **[ARCH]** = an architectural decision made *now* in this plan (a constructor design, a scope cut, a field added). These are real and binding on the build.
- **[PAPER]** = a reasoning/reduction done on paper. It is a hypothesis, not an executed empirical result. Phase-0/1 gates promote or kill it.
- **[GATE]** = a numeric/procedural empirical test that has *not yet run*; passing it is the only thing that converts a [PAPER] claim into evidence.

Nothing in this plan claims the epistemic status of an executed gate before that gate runs.

---

## 1. Executive summary + core architectural thesis

### 1.1 Thesis

> **Building an SSI DAW is doing SSI twice, over two closed-by-different-means domains coupled at exactly one seam, with a permanent harness as the sole inhabitant of that seam.**

- **Signal domain** — primitives `{buffer, transform(polymorphic over buffer AND schedule), schedule, routing}`. Coherence is enforced **by construction** through *total smart constructors* in a **Coherent Patch IR**, with the **Cmajor compiler** as an independent belt-and-braces witness. This is the chromatic scale of the DAW: twelve notes (here, four primitives) that build a tracker, a modular patcher, or a session-view DAW — all on the same invariant set, none able to leave it. **Status: closed and complete for the named signal corpus** (R1 + R4 + Cmajor + fresh paper artifact).
- **Intent domain** — primitives `{reference(+identity), revision, convention, constraint(+actor/authority)}`. Coherence is enforced by a **typed transactional store with total constructors + a constraint-precedence solver over an actor lattice**. **Status: DIRECTIONAL, not closed** — it carries one genuinely open breaker (`authority` under multi-actor delegation) which v1 *scopes out*, and its invariant is therefore exactly "as strong as the primitive+field analysis." This honesty is required, not optional (§2, §3).
- **The seam** — the harness (piNen) is the only thing that can read a convention and emit a routing graph. Cmajor lives entirely signal-side and is forbidden the intent side; the typed store / Engram / Graphify live entirely intent-side. "Harness at the center" is a structural necessity, not a slogan.

### 1.2 The three load-bearing mechanisms

1. **Regenerate-and-reload, not live re-instrumentation.** Cmajor topology is fixed at compile time (R2, confirmed from source). Intent → new Cmajor source → JIT compile → hot-reload. This mirrors piNen's existing shape-builder pattern (generate → `reloadRequired` → reload → verify). It is the *only* malleability flavor Cmajor supports today, and it preserves by-construction coherence because every state the user *hears* is a fully compiled, coherence-checked instrument.

2. **Coherence by construction for the signal domain, containment for the one undecidable property.** Zero-delay feedback cycles and ambiguous schedule overlaps are made **unrepresentable** in the IR. Amplitude/NaN finiteness is *statically undecidable* for arbitrary feedback systems and is honestly handled by a **runtime containment net** — labeled containment, never construction (§4).

3. **Salience as a genuinely computed, per-user belief shift — not a linter.** The fossil record compiles into a small **factored, context-conditioned distribution** over style axes, so Bayesian surprise, Expected Information Gain (EIG), and Value of Information (VoI) are closed-form and personal. The discriminating claim is narrowed honestly (§5.6): the differentiator is not "has a user model" (a user-aware linter has one too) but "computes EIG/VoI against a *calibrated, context-conditioned posterior* and abstains where a threshold rule cannot" — and that, not "linter vs not," is what the falsifier must isolate.

### 1.3 What is being built first

The two unknowns that can *falsify the whole plan* are tested first, in parallel, on paper/mock, before the heavy build:
- **Reload-bridge viability** (engine) — and the first thing it must prove is the one R2 did *not* establish: that two live `Engine`/`Performer` instances can be owned, advanced, fed, and mixed concurrently in the target host at all (§6, §9 Track 1A, closes C3-Finding-9).
- **Salience discrimination** (product) — against a *ladder of strong baselines including a user-aware heuristic linter*, on context-conditioned held-out consequences, pre-registered (§5.6, §9 Track 1B, closes C3-Finding-7).

Each is behind a loud binary gate with numbers and an **investment-freeze rule** (closes C3-Finding-13).

---

## 2. §6.2 — Framework stance: closure vs directional invariant

SSI does **not** promise unconditional closure. It promises, **per domain**:

> **Closure relative to a named domain corpus, enforced through total constructors, falsifiable by (a) an irreducible operation [completeness leak] or (b) an unclamped emission path [coherence/non-bypass leak].**

This decomposes into **three separable proof obligations** (the language C1 demanded; kept):

1. **Expressibility / completeness** — every operation in the named corpus is a composition of the domain's primitives.
2. **Coherence by construction** — the harness can only *construct* the coherent refinement, because constructors are **total over coherent states only** (the incoherent state has no representation). Exception, stated honestly: amplitude/NaN (§4.2), enforced by runtime containment.
3. **Implementation non-bypass** — every signal artifact enters through the IR constructors; every intent artifact through the intent-scale constructors; **every live parameter write is itself a constructor transaction** (this third clause is new in F1 and closes C3-Finding-2). No path — agent-authored modules, raw Cmajor generation, imported patches, direct Engram writes, Tier-0 live parameter sets — may inject an artifact or a *runtime state transition* that skips its scale's constructors.

**"Directional invariant" and "closure" are the same wall seen from two sides — but only when all three obligations hold.** The framework's honest position, which the handoff explicitly anticipates:

- For the **signal domain**, all three hold for the named corpus → we say **closed (relative to corpus), by construction**, with amplitude as the one named containment carve-out.
- For the **intent domain**, obligation 3 (non-bypass) holds but obligation 1 (completeness) has a **named, un-eliminated breaker** (`authority` under multi-actor delegation, §3.3) that v1 scopes out rather than solves. Therefore the intent invariant is **directional**: it holds *in the direction of* every artifact a single-authority user can produce, and it is *exactly as strong as the actor-lattice analysis in §3.3* — no stronger. We say so in the product, in the docs, and to Donald.

This is the resolution of §6.2: **closure where earned (signal), directional where honest (intent), and the framework states which is which rather than promising closure outright.**

Completeness is **inductive, not exhaustive** (R1 Open Risk #1): every *named* operation reduces; we cannot quantify over the unknown. Adding a primitive is a **constitutional amendment** (proposed → verified → reload → usable), not a patch (§9 Phase 7).

---

## 3. Primitive-set verdict — both domains, with honest status

### 3.1 Signal domain — closure HOLDS

`{buffer, transform(polymorphic over buffer AND schedule), schedule, routing}` is **complete for the known signal domain** (R1 + R4 ran two independent adversarial passes; Cmajor corroborates twenty years of Storer's experience; R2 confirms the primitive-to-Cmajor mapping). Accepted, not relitigated.

**Fresh paper artifact [PAPER] (honoring "actually run, not import"):** *relational loudness normalization* — "make the master hit −14 LUFS integrated, keep the snare 6 dB below the kick across the whole song."
- **Signal half reduces:** integrated-loudness measurement is a `transform` on a `bus` emitting a control `buffer`; gain correction is a `transform` driven by that buffer. No fifth signal primitive. ✓
- **But the target is not in the signal domain.** "−14 LUFS integrated" and "snare 6 dB below kick across the whole song" are **normative, relational, project-scoped commitments** — intent-domain objects. This artifact does not break signal closure; it *proves the intent domain is load-bearing and needs its own primitives.* It is the bridge to §3.2.

**Signal verdict: CLOSED + COMPLETE (Strong).** Enforced by total IR constructors + Cmajor compiler, with amplitude as the named runtime-containment carve-out (§4.2).

> **Critical addition from C3 (Findings 1–3):** signal closure is only real if the constructors close over the *full dependency graph* (audio + control + event + sidechain + bus + rate-conversion edges), if *runtime parameter writes* are themselves refinement-checked, and if *dynamic schedule transforms* carry a monotonicity contract. S3 left all three as back doors. F1 closes them in §4.1–§4.4. Without those three closures the "Strong" verdict downgrades to "compiler-caught, not by-construction." They are therefore G2 pass conditions, not optional.

### 3.2 Intent domain — the merged scale and why S1's three-primitive set is broken

C1's breaking artifact (kept): *"for this song, preserve the accidental aliasing in the intro even if later mastering is clean; keep the chorus pad phase-locked to the sidechain pump whenever sections move; never quantize the vocal breaths."* This is not a reference (not a pointer), not a revision (not a reversible delta), not a convention as S1 defined it (not a weighted tendency — it is a one-shot normative prescription). The intent scale needs a primitive S1 lacked.

**The merged intent scale — four primitives, each with a required provenance field:**

| Primitive | Defining property | Required field(s) | Carries (reductions) | Distinct from |
|---|---|---|---|---|
| **reference** | immutable binding from a stable logical **identity** to a versioned signal-layer object | `identity` (logical_id) | comping/takes, region aliasing, freeze/bounce, non-destructive edit, ARA exposure, "same delay module before & after reload" | a raw pointer (goes stale on regeneration) |
| **revision** | typed, reversible delta + the tree it forms (branching is defining; linear undo is the degenerate case) | `actor` (who authored it) | undo/redo, undo trees, project alternatives, edit history, CRDT-shaped concurrent edits | a snapshot (a revision is the *transition* + inverse) |
| **convention** | descriptive, evidence-weighted, context-tagged tendency | `actor`, `context` | personal dialect, module affinities, routing habits, naming, kept "wrong" choices | a constraint (tends-to, not must-hold) |
| **constraint** | prescriptive, scoped, revocable normative commitment over future revisions | `actor/authority`, `scope`, `precedence`, `revocation-handle` | the §11 "spec," the loudness target, "preserve the intro aliasing," phase-lock, tempo/warp anchoring, "never quantize the breaths" | a convention (prescriptive vs descriptive) |

Two folds, both explicit and load-bearing:
- **Identity is folded into `reference`** as a required field (resolving C1-A2). A reference that does not survive regeneration is not a reference; identity is its defining attribute. Ships with preservation rules for split/merge/replace/delete/clone/unlink/bounce + runtime endpoint verification (§5.4).
- **`actor/authority` is folded into `constraint`** (and as provenance into `revision`/`convention`) as a required field — **this is F1's resolution of C3-Finding-5** (§3.3). Identity and authority get *the same treatment*; C3 correctly noted S1/S3 gave it to one and refused it to the other.

### 3.3 The `authority` breaker — DECIDED, with honest framework consequence (closes C3-Finding-5)

C3 is correct that `authority` bites inside single-user v1, not only in collaboration: multiple personas ("artist-me wants clipping; mastering-me wants clean −14 LUFS"), a project template vs the current prompt, a safety/substrate rule overriding a user constraint, a prior explicit constraint vs a later ambiguous prompt. The precedence solver was smuggling authority in as an unjustified field. F1 stops smuggling and does two things at once:

**(A) Fold `actor/authority` as a required field on `constraint` [ARCH], and define a v1 actor-precedence lattice.** Every constraint names its authoring actor. Precedence is resolved by a *fixed, declared lattice*, not an arbitrary rank:

```
  safety-substrate   (highest; the clamps and the amplitude net — never overridable)
        >  user-global-constraint        (the user's standing rules)
        >  project-template-constraint    (imported / template-imposed)
        >  session-prompt-constraint      (the current ambiguous prompt)
```
Personas are **sub-actor namespaces** under `user-global` with an explicit, user-set ordering ("when artist-me and mastering-me conflict, mastering-me wins in the master bus context; artist-me wins in the sound-design context"). Because the lattice is total over v1's actor set, **every single-user v1 constraint conflict has a deterministic resolution** — except the genuinely open case below.

**(B) Name the genuinely open breaker and scope it out of v1.** The open case is **multi-authority delegation / equal-authority cross-actor conflict with no lattice edge** — i.e., two *peer* authorities (true collaboration, or a delegated authority transfer) asserting contradictory constraints with no precedence rule deriving from the lattice. F1 does **not** claim to resolve this. v1 excludes it (single-authority only; collaboration is post-v1). When it *does* arise (e.g., a future shared project), the precedence solver **raises a salience event — a question to the human — never a silent pick.**

**Framework consequence, stated plainly (the handoff demands this):**
- **Intent-domain status is DIRECTIONAL, not closed.** The intent invariant is *exactly as strong as the actor-lattice analysis in (A)*. Where the lattice is total, the invariant holds by construction; where two peer authorities meet with no lattice edge, it does not, and v1 scopes that out rather than pretending to solve it.
- This is the SSI framework getting *stronger from a successful attack* (handoff §8): C3's authority attack forced a required field, a declared lattice, an honest "directional" label, and a v1 scope cut. That is the intended behavior of the loop.

**G0 consequence (closes C3-Finding-13's G0 objection):** G0 passes **only if** every artifact in the v1 corpus is resolvable by the actor lattice (A) *and* the plan language has been narrowed to "directional, single-authority." G0 **fails** if any v1 artifact requires a peer-authority resolution the lattice cannot provide. This is decision-forcing: the breaker is excluded by scope, not rationalized past.

### 3.4 Running the closure attack on the merged intent scale [PAPER]

Adversarial candidates and verdicts (this is paper reduction, gated in Phase 0/4 — not an executed corpus):
- **Project-scoped commitment** → `constraint`. ✓ (broke S1).
- **Stable identity across regeneration** → `reference.identity` + preservation rules. ✓ (C1-A2).
- **Conflicting timebases** (tempo map bar17@43.2s vs warp transient@42.9s; section-move; phase-lock) → a *set of constraints* resolved by the precedence solver with explicit anchoring modes (sample-time / musical-time / relational). Not a new primitive; a clamp (§4.4). ✓ (C1-A5).
- **Single-user authority** (persona / template / safety / prior-vs-later) → `constraint.actor` + the lattice (§3.3). ✓ **in v1 scope.**
- **Multi-authority delegation / peer conflict** → **NAMED OPEN BREAKER**, scoped out of v1, raises a question when encountered (§3.3). ✗ (honestly excluded.)
- **Collaborative multi-user editing** → concurrent `revision` trees over shared `reference`s + merge; conflicts resolved by lattice where it has edges, else question. Reduces *only under single-authority*; full peer collaboration is the open breaker. **[THIN — post-v1.]**
- **Provenance / rationale** ("why did I do this") → `revision` annotation referencing the motivating `convention`/`constraint`. Reduces to metadata-on-revision. ✓ **[THIN — thinnest reduction; flagged.]**
- **Contradiction between conventions** → `convention` is distributional + context-tagged (§5.3), not point-valued. Not a new primitive.

**Intent verdict: `{reference(+identity), revision, convention, constraint(+actor)}` is the best DIRECTIONAL hypothesis for the single-authority known domain, with multi-authority `authority` named as the un-eliminated breaker and scoped out of v1. [THIN relative to signal — two paper passes vs R1+R4+Cmajor for signal; the most under-tested claim in the plan; gated at G0/G4, never constitutionalized.]**

### 3.5 Verdict summary

| Domain | Members | Status | Enforced by | Strength |
|---|---|---|---|---|
| Signal | buffer, transform(poly), schedule, routing | **Closed + complete** (relative to corpus) | total IR constructors over *full dependency graph* + runtime-param-as-constructor + schedule-monotonicity contract + Cmajor compiler (+ amplitude containment net) | **Strong** — conditional on G2 closing Findings 1–3 |
| Intent | reference(+identity), revision, convention, constraint(+actor) | **Directional** (single-authority); multi-authority `authority` = open breaker, scoped out | typed transactional store + total constructors + constraint-precedence solver over actor lattice | **[THIN]** — gated G0/G4 |

---

## 4. Substrate-clamp enforcement — by construction, with one honestly-scoped runtime residual

Architecture: a **Coherent Patch IR** between intent and Cmajor source. The IR is the smart constructor (belt); the Cmajor compiler is an independent cross-check (braces); one property (amplitude) needs a runtime net.

```
intent ─▶ [Convention-biased planner] ─▶ Coherent Patch IR ─▶ [Emitter] ─▶ Cmajor src ─▶ [Cmajor compiler] ─▶ Performer
                                          (TOTAL CONSTRUCTORS over            (belt)         (braces)                  │
                                           the FULL dependency graph)                                  [multi-boundary amplitude/NaN net] (residual)
                                          incoherent = unrepresentable
                                          live param writes = constructor txns
```

### 4.1 Clamp 1 — Causality over the FULL dependency graph (closes C3-Finding-1)

S3's causality clamp only governed audio back-edges; C3's artifact (`Oscillator→Distortion→MainBus→EnvelopeFollower→Distortion.driveValue`) is a zero-latency loop through a *control/sidechain* path that S3's constructor never saw. F1 closes it:

**[ARCH] The IR dependency graph is defined over ALL endpoint classes** — audio streams, value/control endpoints, event endpoints, sidechains, buses, rate converters, and schedule/control edges. There is one cycle detector, and it runs over this whole graph.
- Every transform and rate-converter **manifest declares effective latency** and, per output, **whether that output depends on the current-frame value of each input** (a combinational vs delayed dependency bit).
- `connect(src,dst)` is **total only if** adding the edge preserves acyclicity in the full dependency graph, **unless** the cycle contains a typed `Delay ≥ 1 sample` on the dependency path. The *only* constructor that can close a cycle is `closeFeedbackLoop(path, delay: PositiveNat)`. A zero-latency loop — audio *or* control *or* sidechain — has **no representation**.
- Incremental cycle detection runs at each edge construction (concrete in a live patching UI).
- *Braces:* Cmajor independently rejects zero-delay cycles at compile time (R2: `connection p1->p2->p3->p1` is a compile error; `[1]` legalizes). The compiler is the witness, never the primary catch.
- **G2 adversarial test [GATE]:** explicit audio→control→audio feedback and sidechain self-modulation cases, not only obvious audio-edge cycles.

### 4.2 Clamp 2 — Boundedness: termination by construction, amplitude by containment (the one honest residual)

Two halves, sharply different enforceability:

- **Termination / stack-boundedness — by construction.** Transforms come only from the manifest-bearing library; Cmajor disallows runtime recursion and bounds stack/allocation at compile time (R2 confirmed). The IR cannot reference an unvetted transform (non-bypass).
- **Amplitude / NaN / inf finiteness — NOT by construction; runtime containment net. Exactly why:** whether a legal, causal, stack-bounded patch (high-Q resonant IIR, or a feedback path with a 1-sample delay) stays amplitude-bounded for all inputs is **statically undecidable** — a behavioral property of a dynamical system over unbounded input, not a syntactic property of the graph. R2 confirms Cmajor bounds the *stack* but makes **no finite-amplitude guarantee.** No constructor and no compiler can refuse "the unstable-for-some-input patch" without also refusing musically essential resonant/feedback structures. Therefore amplitude is enforced by a **runtime net** — and we do **not** dress it as "by construction."
- **Scope of the net (corrects C1-A4: not just the DAC).** A mandatory, non-removable **guard transform** (NaN/inf flush-to-defined, soft-saturator to renderable range, DC blocker, denormal flush) is inserted at **every state boundary where a poisoned value can persist or propagate**: feedback-loop boundaries, every `Bus` output, send/return taps, sidechain/control-rate conversion taps, freeze/bounce write points, and the DAC. It is a signal-scale `transform` (costs nothing in primitive count), unbypassable by intent.
- **Honest limitation:** the net is **containment, not coherence.** It prevents crash/propagation/speaker-damage and bounds output; it can turn an intended-unstable sound into clamped/defined output rather than the user's intended result. It does **not** make the patch coherent by construction. It surfaces a *consequence* ("this path is conditionally unstable; the guard is engaging") to the salience layer rather than silently swallowing it.

### 4.3 Clamp 2b — Runtime parameter writes are constructor transactions (closes C3-Finding-2)

S3's `PositiveNat` only protected the static graph-cycle delay argument. C3's artifact: a feedback-delay transform admitted with a legal static graph, exposing live `delaySamples: 0..48000` and `feedbackGain: 0..1.25`; Tier-0 sets `delaySamples=0` or `feedbackGain≥1` at runtime → coherent→incoherent with *no constructor running*. F1 closes it:

**[ARCH] Every live parameter write is a typed constructor transaction, not a raw Cmajor endpoint write.**
- Module manifests specify **refined parameter domains** that depend on graph role: `DelaySamples ≥ 1` *when the parameter participates in a feedback path*; declared feedback-gain stability ranges; oversampling/rate constraints; forbidden combinations.
- The Tier-0 parameter setter (§6.1) is a thin wrapper that **checks the write against the refined domain for that parameter in that patch's dependency context** before it reaches the Performer. A write that would cross an invariant boundary is **clamped or refused**, and the refusal becomes a salience event ("that would make this loop unstable; nearest legal value is X").
- **Ramps are path-checked, not just endpoint-checked:** a ramp from a legal start to a legal end may not pass *through* an illegal region (e.g., a delay ramp that crosses 0). The constructor checks the whole ramp trajectory.
- **G2/G1A test [GATE]:** runtime attempts to drive parameters across invariant boundaries are verified clamped/refused *before* reaching the Performer.

This is what makes Tier-0 a refinement path rather than "a raw escape hatch around the Coherent Patch IR" (C3's words). Non-bypass obligation 3 (§2) now explicitly covers runtime transitions.

### 4.4 Clamp 3 — Schedule monotonicity + collision, including dynamic schedule transforms (closes C3-Finding-3)

- **Audio-output collision — by construction.** A schedule placement's only target is a **summing `Bus`** (first-class IR object with a declared gain law). There is no constructor that places two entries on one output channel at one instant without a bus; "ambiguous overlap" has no representation. Reverse playback is a *buffer-read* `transform` inside a forward schedule window, never negative project time.
- **Dynamic `schedule → schedule` transforms — by construction, via a certified family.** C3 correctly noted that R1's closure *depended* on "transform polymorphic over schedule," yet S3 gave no monotonicity contract for a *parameterized* tempo/warp transform whose live `stretchRatio` could go ≤ 0, inverting time. F1 closes it: **[ARCH]** schedule-transform constructors are restricted in v1 to a **certified family of monotone maps** (positive-duration, anchor-preserving, invertible-where-required, with declared sample-time vs musical-time semantics). The constructor *checks the monotonicity/positive-duration contract over the full parameter domain* (including the live-controllable range) at construction time; a transform whose parameter domain admits a non-monotone or zero-duration mapping is **not constructible**. Non-monotone time is not "caught" — it is unrepresentable. Exotic non-monotone time effects are out of v1 scope (a named limitation, not a hidden one).
- **Timebase conflicts** (tempo vs warp vs section-move vs phase-lock) are *constraint-vs-constraint* conflicts on the intent scale, resolved by the **constraint-precedence solver over the actor lattice** (§3.3) with explicit anchoring modes. The summing bus resolves *audio-output* collisions; the precedence solver resolves *timebase* collisions; the certified-family constructor keeps each schedule transform itself monotone. Three distinct mechanisms, each by-construction in its scale.
- **G2 adversarial tests [GATE]:** tempo=0, negative stretch, crossing warp markers, conflicting anchors, runtime ramps through invalid schedule states.

### 4.5 The intent-scale consistency clamp + constraint-precedence solver

- **revision** appended only if it keeps the tree acyclic and reversible (carries its inverse). No constructor produces a self-ancestor revision.
- **convention** written only through the contradiction-resolver: a contradicting convention is **contextualized** (both retained, conditioned on context, evidence-weighted, time-decayed — R3 exponential-decay/sliding-window), never clobbered.
- **constraint** written with `actor`, `scope`, `precedence-from-lattice`, `revocation-handle`. The **constraint-precedence solver** resolves conflicts deterministically by (actor-lattice, scope-specificity, recency, anchoring-mode), and *refuses* to emit an IR that violates an un-revoked constraint. Equal-authority peer conflict with no lattice edge → **salience event (a question), never a silent pick** (= the `authority` open problem, §3.3).

### 4.6 Why three layers (and not just trust Cmajor)

Cmajor's compiler guards *its* concern (real-time safety), not *ours* (coherent musical artifacts). The IR belt exists so the harness *never forms an incoherent intent* — refusals surface as plan-time "I can't build that, here's the nearest buildable thing" (feeding the dialogue, §5.6/§7), not as a compile error the user must decode. The compiler braces are an independent witness (catches emitter bugs). The amplitude net exists because amplitude is the one coherence property neither IR nor compiler can prove statically. Remove any layer and a real failure class leaks.

---

## 5. Arrangement / fossil store + intent model + the computable salience principle

### 5.1 Storage of record — a dedicated typed transactional store (NOT Engram-as-database)

C1-A15 is correct: Engram stores text observations; Graphify builds project graphs; neither is a low-latency transactional, typed, referential-integrity arrangement DB. A DAW needs atomic revisions, branching undo, stable IDs, referential integrity, queryable constraints.

| Layer | Content (intent-scale terms) | Backing store | Read at |
|---|---|---|---|
| **L0 Store of record** | the actual `reference`/`revision`/`constraint` graph: event-sourced, snapshot-capable, ACID, referential integrity, schema-migratable, corruption-recoverable | **dedicated typed store** (embedded transactional DB / event log + snapshots) — the source of truth | every edit; undo; reload identity verification |
| **L1 Raw/semantic index** | session summaries, structural relations between patches, retrieval | **Engram** (type-tagged observations) + **Graphify** (community structure over patches) | recall, dialogue enrichment, retrieval |
| **L2 Fossil** | the **conventions** + (confirmed) **constraints**: de-duplicated, contradiction-resolved, context-tagged, evidence-weighted | L0 + Engram topic-keys + Graphify organization | regeneration biasing; salience prior |
| **L3 Intent model** | derived **factored, context-conditioned distribution** P(Intent) over style axes — **NOT persisted** | computed at session start from L2, updated incrementally | regeneration biasing; **salience math** |

**Discipline:** L3 is recomputed each session, never persisted (persisting it breaks intent-scale closure and lets stale opaque state accumulate). Engram/Graphify are demoted to index/summary; L0 is transactional truth.

### 5.2 Plan-time biasing — the personal-dialect mechanism, made mechanical

When intent arrives: clamps bound the constructible set (coherent); constraints prune it (legal-for-this-song, via the actor lattice); conventions rank the survivors (dialect). Biasing only ever selects among already-coherent, already-legal IRs — it cannot bias toward an incoherent or constraint-violating patch. Transparency requirement: any biased choice must be answerable from L2 ("why saturation there?" → the convention + evidence count that produced it) — gated at G4.

### 5.3 The intent-model representation — distribution, cheap, AND independence-gated (closes C2-A2 + C3-Finding-6)

C2-A2 was the decisive attack on a rule/weight model: **you cannot take a KL divergence of a rule list.** We choose the distributional horn and reject the premise that distributional means expensive:

- The intent model is a **factored distribution over ~9 style axes** (R3/S2): cleanliness↔grit; artifact-tolerance (aliasing/clipping/feedback/latency); module-family affinity; routing idioms; rate preference; dialogue preference; expertise vocabulary; risk appetite; temporal style.
- Each axis is a small parametric belief — a **Beta/Dirichlet** posterior over a low-cardinality categorical/ordinal — giving **closed-form KL** and **closed-form entropy/EIG**.
- **The "rules/weights" of S1/S2 survive only as the sufficient statistics** (evidence counts) that parameterize these posteriors. Transparency *and* computability: a Beta posterior reads as "saturation-before-filter: 3 confirmations" *and* gives closed-form surprise.
- Cheap **because the domain is tiny** (R3's Flash-Fill insight: inference is tractable when the program space is small; the four primitives ARE the tiny DSL). We **reject** the framing that probabilistic ⇒ a 100-dimension Bayesian network ⇒ expensive.

**But independence is not free — F1 makes it a gate (closes C3-Finding-6).** C3 is right that a user's grit-tolerance may be *conditional* on lo-fi context, interruption-tolerance conditional on flow, expertise conditional on sub-domain — and a fully factored model double-counts evidence when one consequence touches several correlated axes, producing spurious "surprise."

**[ARCH] The model is context-conditioned, and independence is falsifiable:**
- Axes are conditioned on a small set of **context tags** (sub-domain: synthesis/mixing/mastering; flow-state; genre). The unit of belief is `P(axis | context)`, not `P(axis)`.
- A **sparse pairwise coupling** layer is allowed for the empirically-coupled axis pairs (e.g., grit×routing-idiom, artifact-tolerance×expertise).
- **Model-validity gate G1B-MV / G5-MV [GATE]:** posterior-predictive checks, calibration curves, and an **ablation comparing factored vs sparse-pairwise vs hierarchical** on real salience decisions. If interaction terms explain salience materially better (pre-registered effect-size threshold), v1 *must* add them or *reduce its KL/EIG claims accordingly.* Independence is a hypothesis the build can be forced to abandon, not an assumption it rests on.

### 5.4 Identity, regeneration, and the reflexivity seam (closes C1-A2, C1-A9)

Because `reference` carries logical identity, state migration and dialogue key on **stable logical identity + an explicit per-module state contract**, never on source-name coincidence. On each regeneration, piNen diffs old and new IR (it generated both), computes the identity map (split/merge/replace/delete/clone/unlink/bounce), and after compile runs runtime endpoint verification (`getInputEndpoints`/`getOutputEndpoints`, R2) to confirm regenerated concrete endpoints bind to expected logical identities; a mismatch is a generator bug and **blocks reload** (two-source seam). Dialogue ("why is the chorus pad routed through that compressor?") resolves through logical identity, so it survives regeneration.

### 5.5 Module manifests and the admission gate — compile-admitted ≠ coherence-admitted (closes C3-Finding-4, C1-A9, C1-A14)

Reflexivity from endpoint names alone is insufficient to *talk about* a patch (C1-A9). Every transform carries a **semantic manifest**: rate behavior, **effective latency + per-output current-frame-dependency bits** (§4.1), gain bounds, state bounds, **refined parameter domains** (§4.3), nonlinearities/spectral assumptions, oversampling/anti-alias policy, parameter semantics, NaN/denormal policy. "Can answer *why*?" is part of the manifest, hence part of the gate.

**The decisive C3-Finding-4 fix — separate compile-admission from coherence-admission [ARCH]:**
- **experimental** — compiles, no recursion, endpoints verified. **May run only in a sandboxed/disclosed preview mode and is NOT counted in any "by-construction" coherence claim.** An experimental module's manifest is *unverified*, so the IR may not treat it as a coherent atom in normal generation.
- **guarded** — passes impulse/sweep tests, parameter-range stress, NaN/denormal sweeps, latency declaration, **manifest-truth tests** (generated tests that try to *falsify* the manifest's latency/dependency/parameter-range/NaN/denormal/rate/aliasing claims). Only **guarded or better** transforms may participate in coherent IR generation.
- **certified** — guarded + adversarial test vectors + reproducible amplitude bounds within declared parameter ranges.
- **G3 must include a malicious/incorrect-manifest module and prove the system refuses to certify it [GATE].**

This removes the "experimental module as raw semantic escape hatch": the IR is coherent-by-construction *only over guarded+ modules with manifest-truth established*; experimental modules are audible only under sandbox disclosure and are explicitly outside the invariant.

### 5.6 The salience principle — adopted, computed, and given an HONESTLY-narrowed, linter-proof falsifier (closes C3-Finding-7)

We adopt R3's principle (Salience-as-Belief-Shift conditioned on Intent), bind every criterion to the §5.3 distribution so it is genuinely evaluable, and — critically — *narrow the discriminating claim* so the falsifier isolates the right thing.

> A detected consequence **C** earns a question **iff**:
> **S1 — Surprise:** KL( P(Intent|C, context) ‖ P(Intent|context) ) > θ_surprise, on the factored, context-conditioned posteriors (closed-form). *Consequence→likelihood mapping is generic over style axes* (e.g., "introduces inharmonic artifact" → likelihood favoring grit-tolerance).
> **S2 — Affordance:** C materially changes the user's action possibilities (Gibson).
> **S3 — Relevance:** expected cognitive benefit > processing effort (Sperber–Wilson). *Honestly LLM-qualitative; bounded by S1/S4 (thin-spot §5.8).*
> **S4 — Value of Information:** EVSI(C) > cost-of-interruption. *Computed:* if both answers yield the same chosen IR under the constraint filter + convention ranking, EVSI = 0 → no question.
> **S5 — Informativeness:** among survivors, surface highest EIG first; hard stop at the turn budget.
> **S6 — Safety/Constraint override:** any substrate-clamp safety event OR any user-`constraint` violation is surfaced *always*. (Most clamp violations are unconstructable (§4), so S6 mostly fires as "you asked for the unbuildable — here's the nearest buildable thing" and "this would violate your own constraint X.")

**The narrowed claim (this is the F1 honesty move on C3-Finding-7).** S3 claimed the differentiator is "linter vs not — a linter has no prior, so it structurally cannot pass." C3 destroyed that: a *user-aware* two-feature linter (`{profile_artifact_tolerance, consequence_is_artifact}` → ask/suppress) *does* have a coarse prior and *will* produce a ≥40pp surfacing-rate difference on any "artifact" held-out type. So "not a linter" is the wrong claim. The honest claim is:

> **SSI salience is differentiated not by *having* a user model, but by computing *expected information gain and value-of-information against a calibrated, context-conditioned posterior*, and thereby (a) abstaining where a fixed threshold rule over-asks, and (b) asking where a coarse rule under-asks — especially on consequences that touch *correlated* axes or *context-conditioned* tolerances.** If a user-aware heuristic linter matches SSI on abstention quality, usefulness, AND answer-changing VoI, then the EIG/VoI machinery is *not load-bearing* and we descope to it — that outcome is a real, accepted falsification, not a defeat to argue around.

**The falsifier — a baseline ladder, context-conditioned holdouts, pre-registered (replaces S3's straw baseline):**
- **Baselines [GATE]:** (1) silent Route 2; (2) generic linter (no user); (3) **user-aware heuristic linter** with artifact-tolerance/profile features (the serious competitor C3 named); (4) leave-one-consequence-out classifier trained on fossils; (5) **ablated factored model without EIG/VoI** (tests whether the EIG/VoI machinery is the actual differentiator).
- **Holdouts:** consequence *families* AND *context combinations* (e.g., grit-user but in a *mastering* context), not one named type. This is where a profile-only linter fails and a context-conditioned posterior should win.
- **Metrics:** not surfacing-rate difference alone — **abstention quality, user-rated usefulness, and answer-changing VoI (did the user's answer actually change the chosen IR?)**, with calibration/reliability curves.
- **Pass condition:** SSI beats *all five baselines*, including the user-aware linter and the EIG/VoI-ablation, on abstention quality + usefulness + VoI, by a **pre-registered margin**, with **pre-registered unit of analysis, randomization, and N**. N≥8 is explicitly **pilot-grade for G1B**; the plan-lock evidence is **G5** with a pre-registered, adequately powered N (target N≥24, powered to the registered effect size — set at pre-registration).
- **Negative controls:** detected-but-should-not-surface cases (grit-user + aliasing in a lo-fi context) must abstain.
- Detection (arithmetic) is **separated from initiation** (audited for abstention quality): a linter-like detector is fine; what is audited is *which detections become questions.*

### 5.7 How Route 1 avoids becoming a clippy — structural, not aspirational (closes C2-A8)

1. **Route 2 is the default** (R3 inversion). A system that mostly stays silent cannot be a clippy. Route 1 is opt-in/premium.
2. **Conservative θ_surprise + asymmetric cost.** False positives kill Route 1; false negatives are caught free by Route 2. Calibrate toward silence: initial target Route-1 false-positive ("unnecessary") rate ≤ 20%.
3. **Turn budget (S5):** hard cap ≤ 3 questions per generation transaction — the dialogue analogue of the spawn cap. Interrogation floods are *structurally impossible.*
4. **Cold-start guard (but see §8/§11 — this is a named decision, not a solution).** Route 1 disabled until L2 has ≥ ~12 evidence observations across ≥ 3 style axes; replaced meanwhile by one opening genre-prior question. The system earns the right to interrogate by first learning the dialect. **Status: this *disables* the product-center claim for new users; C3-Finding-8 is correct that this is a punt, not a solution; it is named in §8 and §11.**
5. **Enforced VoI:** computed, not hoped — EVSI=0 ⇒ no question.

### 5.8 Honest thin spots (do not smooth)
- **[THIN]** θ_surprise has no analytic value (R3 Risk #1) — tuned by musician studies; Route 1 conservative-by-fiat until then.
- **[THIN]** S3 relevance is LLM-qualitative (R3 Risk #4) — bounded by S1/S4 and Route 2 as net.
- **[THIN]** "feels like discovery" is study-only (R3 Risk #6) — the §5.6 ladder gate is the operationalization; if it fails after calibration, the *dialogic claim* is falsified (§10) even though a fine Route-2 DAW still ships.
- **[THIN]** independence/factorization (C3-Finding-6) — gated at G1B-MV/G5-MV; the build can be forced to add coupling or reduce claims.

---

## 6. State across reload — §6.3, R2-grounded, three tiers, with the host-concurrency unknown named

R2 is decisive and accepted without flinching: `setNewRenderer()` **destroys Performer A before B exists**; DSP state (delay lines, reverb tails, filter state, LFO/oscillator phase, ramps, counters) is **zero-initialized** in B; only **parameter values** and **`storedState` key-value pairs on the `Patch` object** survive. The reload boundary is audible by default.

### 6.1 Three tiers with distinct, limited, stated guarantees (closes C2-A4)

**Tier 0 — Parameter-class avoidance (primary, free).**
- Classify intents: *parameter-class* ("brighter," "more reverb," "slower LFO") → live `setInputValue`/`addInputEvent` with `rampFrames` via the **constructor-checked setter (§4.3)**; no reload, no gap, sample-accurate. *Topology-class* → reload.
- Emit graphs with **dormant zero-contribution stages** so many "structural" intents become parameter moves. **Bounded, measured optimization, not a panacea** (closes C1-A8): max-dormant-modules policy, defined bypass semantics, CPU/latency/denormal budget. **Telemetry:** real-session fraction of edits handled as parameter-class vs topology-class. Low fraction ⇒ Tier-0 isn't carrying the load ⇒ engine bet weakens (falsifier §10).

**Tier 1 — Engine-level crossfade for the compile gap.**
- Operate at **`Engine`/`Performer` level** (`copyOutputFrames`/`setInputFrames`), **not** `Patch::rebuild` (which destroys A before B). We re-implement at Engine level: parameter save/restore, storedState round-trip, manifest handling, status callbacks, input duplication, MIDI/transport replay, latency compensation, parameter-ramp continuation.
- Compile B on a background thread while A plays; equal-power crossfade A→B over ~5–50ms (to be measured); drop A.
- **Stated guarantee and limit:** masks the *compile gap* for edits to the *dry/input* path. Does **NOT** preserve in-series DSP tails — B starts zero-state, so an in-series reverb/delay/filter **truncates** on reload in v1. Stated plainly.

**Tier 2 — Parallel-send-only tail bridge (narrow; re-specified per C3-Finding-10).**
- S3 assumed the host could copy "only the reverb return tail" from A. C3 is correct that a Performer runs the *whole* compiled old graph; without explicit isolation endpoints, the host cannot tap just the tail. **F1 makes tail-bridge eligibility a compile-time IR property [ARCH]:** a parallel effect is tail-bridge-eligible **only if the IR generated it with (a) an isolated wet/tail output endpoint and (b) a defined "no new input, drain state" mode** (a sidecar tail processor or explicit return tap). Only eligible effects can be bridged; everything else truncates.
- **If pre-generating tail-isolation endpoints proves too expensive (G1A finding), Tier 2 is removed from v1** and *all* stateful tails truncate except module-explicit serialized state. This is an accepted, pre-declared fallback, not a surprise.

**Residual, named:** in-series reverb/delay/filter state is **not** preserved across topology reload in v1. `storedState` is key-value on the Patch object, **not** general DSP-state migration (corrects C1-A6, C2-A6). Only modules that **explicitly serialize** state to stored-state endpoints can migrate; we require that contract for a *small* continuity-critical set and accept truncation elsewhere. **LFO/oscillator phase is in the "cannot migrate in v1" column.**

### 6.2 The host-concurrency unknown — named as a Phase-1 spike, not asserted (closes C3-Finding-9)

S3's executive prose said the bridge is "specified at the correct API level." C3 is correct: it is **a spike hypothesis, not an established capability.** R2 establishes that `Performer::setInputFrames()`, `copyOutputFrames()`, and `Engine::createPerformer()` *exist*. R2 does **not** establish that:
- two live Performers (from two Engines) can be advanced concurrently in the same real-time host path;
- background compile/link is thread-safe while A renders;
- endpoint handles/events/transport can be replayed deterministically across A/B;
- host-side mixing at the needed point is available in the target integration;
- mismatched graph latency can be compensated without new artifacts.

**[ARCH] G1A's FIRST pass condition is now:** *prove two live `Engine`/`Performer` instances can be owned, advanced, fed, and mixed concurrently in the target host without undefined or thread-unsafe behavior.* Deterministic event replay, transport sync, ramp continuation, and latency compensation are **separate pass/fail items**, not a generic implementation list. **If only offline/preview dual rendering works, that is a documented G1A outcome that forces the silence-boundary fallback** (§9 investment rule).

### 6.3 Reload metrics split (closes C3-Finding-12)

S3's single "≤30 ms gap" conflates two different things. **[ARCH] G1A measures four separate metrics:**
1. **Audio dropout / swap gap** (the click) — target ≤ 30 ms, ideally 0 if concurrency works.
2. **Edit-to-audible-change latency** (the "feels responsive") — target ≤ 200 ms for a ~20-processor graph; R2 flags compile duration as unknown, so this is a measurement, not an assumption.
3. **CPU during compile and during A+B overlap** — must not xrun on a representative heavy patch (≥40% single-core baseline) at 128-sample buffer @ 48 kHz.
4. **Jitter / transport continuity** across the swap.

### 6.4 Honest verdict on §6.3/§5d
The reload boundary is **audible by default, maskable for the dry/input path and parameter-class edits, and not fully solvable for in-series tails in v1.** "Regenerate-and-reload is the correct topology, not a compromise" survives **conditionally**: correct for parameter-class and dry-path edits; a *named compromise* for in-series-tail edits. If G1A shows dry-path crossfade artifacts unacceptably on sustained material, or xruns on representative patches, or that host-concurrency is not viable, that is a falsifier (§10) with a pre-declared fallback (§9).

---

## 7. The spec-driven-ecological workflow — a toggleable sibling shape, two routes

Per §11c and the `spec-driven-ecology` skill: a **sibling shape on the substrate**, toggled by `/spec-driven-ecological-design-intent` (short `/sde`), never importing another shape, registered in the registry, following the shape-builder lifecycle (proposed → implemented_verified → reload → discovered → canary_passed → usable). No new core machinery; what is unproven is the judgment inside it (§5.6).

```
intent intake ─▶ (consult L2: prune by constraint via actor lattice, bias by convention)
   ▼
candidate Coherent-Patch-IRs   ◀── TOTAL CONSTRUCTORS (incoherent unrepresentable; full dependency graph; param writes checked)
   ▼
static consequence detection (aliasing, clipping headroom, latency, CPU, constraint-violation, conditional-instability) — arithmetic, cheap, linter-like (fine)
   ▼
ROUTE SWITCH (shape ON/OFF?)
  ON  ─▶ salience S1–S6 over factored, context-conditioned P(Intent) ─▶ surface top-EIG question(s), ≤3 ─▶ user answers / asks "what is X?" ─▶ intent sharpens ─▶ loop
  OFF ─▶ pick constraint-legal, convention-best IR ─▶ build
   ▼ (both converge; HARD clamps + constraints inviolable in BOTH routes)
emit Cmajor ─▶ compile ─▶ RELOAD BRIDGE (§6) ─▶ play
   ▼
sediment: references + revision + (confirmed) conventions/constraints ─▶ L0/L2 (the fossil grows)
```

- **Route 1 (ON, premium):** spec-first; salience-gated pre-build questions; "what is aliasing?" routes into a teaching sub-dialogue and back into the loop with sharpened intent, writing a convention.
- **Route 2 (OFF, DEFAULT):** predict-and-build; the user hears the artifact and asks backward; the user is their own salience filter.
- **Safety in both routes:** hard clamps (zero-delay feedback over the full dependency graph; schedule ambiguity; non-terminating/unbounded code; invalid endpoint/rate with no conversion; non-monotone schedule transform) and **user-constraint violations** are never bypassable; Route 2 may skip *aliasing* questions, never hard clamps or constraint violations.
- **Canaries [GATE]:** (1) clean-mastering fossil + aliasing → Route 1 asks; (2) lo-fi fossil + same aliasing → suppresses/reframes as grit; (3) zero-delay feedback (audio OR control-sidechain) → both routes refuse-by-construction + offer nearest buildable; (4) simple insertion → reload with crossfade, no irrelevant questions; (5) **context-conditioned held-out family** + two fossils → different salience, beating the user-aware-linter baseline (the §5.6 gate); (6) runtime param drive toward `feedbackGain≥1` → clamped/refused with explanation.
- The 15-phase ecological skill maps onto Route 1 but is **cheap** because the scales are tiny: affordance-analysis = S2; failure-mode-analysis = consequence detection + S6; perturbation-tests = the closure attacks.

---

## 8. Resolution of every §6 open question (§6.1–§6.8)

- **§6.1 — arrangement-as-shape vs primitive:** **Resolved.** Signal arrangement features are *shapes on the signal scale* (R1/R4 — comping, takes, non-destructive edit, region aliasing, undo trees, freeze, fossil record all reduce). But the **intent/working-history domain is a genuine second domain with its own primitive scale** `{reference(+identity), revision, convention, constraint(+actor)}` (§3.2). This *is* the §6.1 discovery the handoff anticipated — "intent becoming primitive" — landed honestly: not a fifth *signal* primitive, but a second *domain*.
- **§6.2 — closure vs direction:** **Resolved.** Three proof obligations; closure relative to a named corpus; **signal = closed, intent = directional** (§2). The framework states which is which.
- **§6.3 — state across reload:** **Resolved + spike-gated.** State is not preserved (R2). Audible by default; partially maskable via the three-tier bridge (§6); in-series tails truncate in v1. The *mechanical viability* of the Engine-level bridge is a **named Phase-1 spike unknown** (§6.2), not an asserted capability.
- **§6.4 — continuous topology morphing:** **Resolved as a decision for Donald (NAMED OPEN DECISION #1, §11).** Not v1 vision per R4; topology change is an edit, not a performance gesture. Confirmed at G0 or the engine bet is wrong.
- **§6.5 — reflexivity:** **Resolved.** Cmajor host API gives sufficient *runtime endpoint* reflexivity (R2); piNen owns *structural* reflexivity (it generates the source) and carries a **semantic module manifest** per transform (incl. latency + current-frame-dependency bits) so it can *talk about* a patch, not just name endpoints (§5.5). Two-source seam: piNen IR authoritative for topology+intent; Cmajor compiled view authoritative for what ran; mismatch blocks reload.
- **§6.6 — intent store:** **Resolved.** Read at **three** moments (regeneration biasing, salience calibration, dialogue enrichment) — R3. Four layers; store of record is a **dedicated typed transactional DB** (L0); Engram/Graphify demoted to index/summary (§5.1).
- **§6.7 — Cmajor dependency:** **Resolved as candidate + NAMED OPEN DECISION #2 (§11).** Proceed as candidate; legal + export gates in Phase 1; C++ export exercised early (R2/R4). Indie tier £2,000 if org < $300K; Pro tier unknown; EULA §7.1 at-will termination needs legal read; GPLv3 fallback acceptable for prototype.
- **§6.8 — salience:** **Resolved with honest narrowing.** Adopt R3's Salience-as-Belief-Shift (S1–S6) on a **factored, context-conditioned** intent model that can actually compute it (§5.6). The *principle for what makes a consequence worth surfacing*: **a consequence earns a question iff it produces a context-conditioned belief shift large enough that the user's answer would change the chosen IR (positive VoI), the shift materially changes affordances, and the expected benefit beats the interruption — surfaced highest-EIG-first under a hard turn budget, with safety/constraint violations always surfaced.** Route 2 default; Route 1 conservative. The discriminating claim is narrowed from "not a linter" to "computes EIG/VoI against a calibrated context-conditioned posterior" (§5.6), and that, not the straw "linter," is what the falsifier isolates.

---

## 9. Phased roadmap — front-loading the plan-falsifiers behind numeric, decision-forcing gates

Principle: the two unknowns that can *falsify the plan* — the **reload bridge** (engine) and **salience calibration** (product) — are pulled as early as dependencies allow, in **parallel**, on **paper/mock before the heavy build**, each behind a **loud binary gate with numbers AND an investment-freeze rule** (closes C3-Finding-13). Phase 0 ratifies only *hypotheses + attack plans*, never constitutionalizes a thin claim.

**Investment-rule convention (applies to every gate):** each gate states (a) what work *stops* on failure, (b) what scope *changes*, (c) what must be *rewritten* before proceeding. No gate permits "proceed and see."

### Phase 0 — Provisional constitution, dual-domain closure ATTACK, Go/No-Go (no engine code)
- **Objective:** ratify *provisional hypotheses and attack plans* — not a constitution.
- **Work:**
  - **Run a fresh §6.1 attack on BOTH domains** [PAPER→corpus] with artifacts not in R1/R4: signal — relational LUFS (§3.1); intent — project-commitment + **single-user authority (persona/template/safety/prior-vs-later)** + provenance/rationale + collaborative-edit (§3.4). Output per artifact: *reduces (mapping)* or *breaks (named primitive)*.
  - Draft the constitution in **hypothesis** language: "signal closed relative to corpus X via total constructors over the full dependency graph; **intent directional, single-authority, multi-authority `authority` open and scoped out**" (§2, §3.3).
  - Narrow all plan language to "directional, single-authority" for the intent domain (closes C3-Finding-13 G0 objection).
  - Non-technical gates: Donald confirms regenerate-and-reload vision (NAMED DECISION #1); legal read of EULA §7.1 + Pro-tier pricing (NAMED DECISION #2).
- **Decision gate G0 (binary):** *Vision is regenerate-and-reload AND Cmajor acceptable for prototype AND the dual-domain attack produced no un-handled breaking artifact within v1 scope AND **every v1 intent artifact is resolvable by the actor lattice (no v1 artifact requires peer-authority resolution)**?*
  - **Fail → investment rule:** if any v1 artifact needs peer-authority, STOP; either add a delegation mechanism (re-open the intent primitive set, a major redesign) or cut the offending feature from v1. If vision needs continuous morphing, re-select engine before any spend.
  - **Pass →** proceed; intent scale carried as **directional hypothesis**, re-gated at G4/G5.

### Phase 1 — TWO PARALLEL DE-RISK TRACKS (the falsifier-first phase)

**Track 1A — Engine spike + Reload-Bridge measurement (riskiest engine unknown).**
- piNen generates a trivial Cmajor patch; loads via C++/JS API (R2); drives a parameter live through the **constructor-checked setter** (proves the no-reload path + §4.3 clamp); regenerates a topology change and measures.
- **FIRST, prove host concurrency (§6.2):** two live `Engine`/`Performer` instances owned, advanced, fed, mixed concurrently without undefined/thread-unsafe behavior. Then build the Engine-level bridge (Tier 1) and test on **(a) percussive, (b) sustained pad + long reverb tail, (c) one real stateful module** (delay buffer / filter / LFO phase).
- Exercise **C++ export** here (insurance): prove a generated module compiles dependency-free outside Cmajor.
- **Gate G1A (binary, numeric — split metrics, §6.3):**
  1. Two live Engine/Performer instances run concurrently in target host, no UB/thread-unsafety — **pass/fail**.
  2. Deterministic event replay + transport sync + ramp continuation + latency compensation across A/B — **each pass/fail**.
  3. Audio swap gap ≤ 30 ms (ideally 0 with concurrency); edit-to-audible-change ≤ 200 ms for ~20-processor graph; **no xrun** on ≥40%-single-core patch at 128-buf/48 kHz during overlap; crossfade passes ABX on sustained material (≥1 trained ear, recorded artifacts).
  4. C++ export builds standalone.
  - **Fail → investment rule (written rescope, no "proceed and see"):** if concurrency item (1) fails → **reposition v1 as silence-boundary reload**; Tier 1/2 are cut; the §5d "not a compromise" claim is *retracted in the docs*; Phase 2 proceeds under the narrowed scope. If only (3) fails on heavy patches → silence-boundary fallback *for that patch class only*, documented per class.
- **Strike "JIT is fast" as an assumption** — it is metric 3's measurement.

**Track 1B — Salience spike, Wizard-of-Oz, NO DSP engine (riskiest product unknown).**
- Mocked consequence detectors + synthetic fossil histories (grit-user, clean-user) + **context tags** + recorded audio examples + Wizard-of-Oz dialogue.
- Implement the §5.3 factored, context-conditioned distribution + §5.6 salience math on the mock. Run the **baseline-ladder, context-conditioned held-out discrimination test** (§5.6) — including the **user-aware heuristic linter** and the **EIG/VoI-ablation** baselines.
- Run the **model-validity sub-gate G1B-MV** (§5.3): posterior-predictive + factored-vs-pairwise-vs-hierarchical ablation.
- **Gate G1B (binary, numeric — gates Phases 4–6; pilot-grade evidence, N≥8):** *On context-conditioned held-out families with no rule added, does SSI beat ALL FIVE baselines (incl. user-aware linter and EIG/VoI-ablation) on abstention quality + user-rated usefulness + answer-changing VoI by the pre-registered margin (p<0.05), AND do negative controls abstain, AND does G1B-MV show the chosen factorization is adequate (or force coupling)?*
  - **Fail → investment rule:** **freeze all Phase-2+ Route-1-specific work** until a redesigned model passes the strong-baseline test. If the EIG/VoI-ablation matches SSI → the EIG/VoI machinery is *not* load-bearing → **descope to the user-aware-heuristic Route-1 or to Route-2-only**, and retract the "computed belief shift" claim. The signal/engine stack (Phases 2–3) may proceed *only* on the parts independent of Route 1.
- Rationale: the central, most-likely-to-fail-quietly risk needs no working DSP to test; testing it last would burn months. Salience is a **continuous track**, not a Phase-5 feature.

### Phase 2 — Coherent Patch IR + total constructors over the FULL dependency graph + multi-boundary amplitude net
- **Objective:** make incoherent signal patches *unrepresentable* (including cross-rate/control cycles and runtime-parameter excursions); make the amplitude residual unbypassable.
- **Work:** total constructors — causality via `closeFeedbackLoop(delay:PositiveNat)` over the **full dependency graph (audio+control+event+sidechain+bus+rate-conv)** with incremental cycle-checking (§4.1); **runtime parameter writes as constructor transactions with refined per-role domains + ramp-path checking** (§4.3); schedule-collision-via-mandatory-bus + **certified monotone schedule-transform family** (§4.4); reverse-as-forward-buffer-read. Emitter IR→Cmajor. **Multi-boundary** amplitude/NaN net at every state boundary. **Non-bypass invariant** (§2 obligation 3, incl. the runtime clause). Adversarial fuzz.
- **Gate G2 (binary):** *Is a zero-delay cycle — audio OR control-sidechain — unrepresentable (verified by finding no constructor exists)? Does a runtime parameter write toward `delaySamples=0`/`feedbackGain≥1` get clamped/refused before the Performer? Is a non-monotone schedule transform unconstructable? Does the amplitude net flush a deliberately-unstable IIR to defined output at every boundary (feedback, send, sidechain, bounce, DAC)? Is there no raw escape hatch?*
  - **Fail → investment rule:** if any cycle/param/schedule back door admits an incoherent state, the "by-construction" claim is false for the signal domain → **stop and redesign the constructor algebra** before Phase 3; do not proceed on a validate-reject substitute.

### Phase 3 — Cmajor emitter + module palette + manifests + admission gate (compile ≠ coherence)
- **Objective:** §10 interaction model — four-port modules, signal-as-control unification, agent-authored modules, rate-as-enacted-constraint.
- **Work:** palette over Cmajor std lib (oscillators, filters, envelopes, `std::voices::VoiceAllocator` for polyphony — not a primitive, R4). Patching UI as a piNen arrangement-layer projection. **Semantic manifests per module** incl. latency + current-frame-dependency bits + refined parameter domains (§5.5). **Agent-authoring** via emit→gate→reload, entering at **experimental (sandboxed, NOT coherence-counted)**, promoted to **guarded** only after **manifest-truth tests** (§5.5). Static rate-mismatch detection feeds salience.
- **Gate G3 (binary):** *Does agent-authoring reduce to the existing emit→gate→reload path with no special-case machinery (R4 predicts yes)? Does every palette module used in coherent generation carry a **manifest-truth-verified** manifest sufficient to answer "why"? **Does the system refuse to certify a deliberately-incorrect-manifest module (C3-Finding-4)?** Are experimental modules provably excluded from by-construction claims?*
  - **Fail → investment rule:** if experimental modules can enter coherent patches, or manifests can lie undetected, **stop**; the dialogue + coherence claims both rest on manifest truth.

### Phase 4 — Typed transactional arrangement store + intent scale + identity + actor lattice
- **Objective:** build the intent substrate `{reference(+identity), revision, convention, constraint(+actor)}` on a **real transactional store** (§5.1).
- **Work:** L0 typed event-sourced store (ACID, snapshots, referential integrity, migration, recovery). Immutable **references** w/ logical identity + preservation rules (§5.4). **Revision** tree + consistency clamp. **Convention** with contradiction-resolver (context-tagged, evidence-weighted, time-decayed). **Constraint** with `actor`/scope/precedence/revocation + the **constraint-precedence solver over the actor lattice** (§3.3, §4.5). Engram/Graphify demoted to index/summary. L3 derived **context-conditioned** distribution recomputed each session.
- **Gate G4 (binary):** *Does a convention learned in session N change session N+1's generated patch, transparently ("why saturation there?" → convention + evidence)? Does a user-`constraint` ("preserve the intro aliasing") survive regeneration and block a contradicting edit? Does identity survive regeneration so "the same delay" is addressable across reload? **Does the actor lattice deterministically resolve a persona/template/safety conflict, and raise a question (not silently pick) on an equal-authority conflict?***
  - **Fail → investment rule:** if biasing is recall-not-plan-time, or identity/constraint don't survive regeneration, the personal-dialect + directional-intent claims are unrealized → fix before Phase 5. Closure discipline: every feature must be a reference/revision/convention/constraint or it doesn't ship.

### Phase 5 — Salience engine (real) + spec-driven-ecological shape (the heart; central gate)
- **Objective:** make Route 1 *discovery, not interrogation*, on the real engine with real fossils.
- **Work:** implement the §7 shape (substrate sibling, `/sde` toggle, Route 2 default). Salience over the **factored, context-conditioned** distribution (§5.3/§5.6) — S6 first (safety + constraint overrides), then full S1–S5. Cold-start guard, turn budget, enforced VoI (§5.7). Re-run the §5.6 baseline-ladder gate with real artifacts; tune θ_surprise from real data.
- **Gate G5 (binary, the project's central gate; adequately powered, N≥24 pre-registered):** *On the real engine with real fossils, does the context-conditioned held-out-family discrimination hold AND beat all five baselines (incl. user-aware linter + EIG/VoI-ablation) on abstention quality + usefulness + VoI by the registered margin; do musicians experience Route 1 as discovery (pre-registered FP-interruption rate, post-hoc "wish warned" precision/recall, opt-out rate, time-to-flow-disruption); AND does it beat Route-2-plus-reactive-dialogue?*
  - **Fail → investment rule:** **the dialogic claim is falsified; ship the Route-2 DAW (still valuable) and demote Route 1 to experimental.** Do not extend Phase 5 indefinitely — the descope is the pre-declared outcome.
- **Risk [THIN]:** θ_surprise/relevance/"feels like discovery" are study-only — the gate is loud and binary precisely because this is where the project most likely fails quietly.

### Phase 5.5 — Reload-UX acceptability gate (new in F1, closes C3-Finding-11)
- **Objective:** make in-series tail truncation a first-class product gate, not a silent regression.
- **Work:** representative musicians compare silence-boundary reload vs dry-path crossfade-with-in-series-truncation vs no-edit baseline, on **sustained/ambient/delay-heavy material** during playback.
- **Gate G5.5 (binary, numeric):** *On the target workload, is the dry-path-crossfade-with-truncation experience rated acceptable by ≥70% of testers, with "would break flow" ≤ 20% and tail-cut audibility below the pre-registered threshold?*
  - **Fail → investment rule:** reposition v1 as **edit-at-stop / silence-boundary**, or require explicit state-serializing modules before claiming malleable-during-playback editing. Stated in product positioning, not hidden.

### Phase 6 — First real instrument, end-to-end
- **Objective:** harness builds one non-trivial user-shaped DAW config (tracker-style OR modular-style) end-to-end, fossil accumulating across a multi-session arc, biasing regeneration.
- **Gate G6 (integrative):** *Recognizably SSI — a malleable instrument grown around a permanent harness — not a scriptable DSP host? Coherence never breaks; reloads inaudible (covered classes) or honestly bounded; dialect visibly shapes generation; both routes sharpen intent; harness visibly at the center?*

### Phase 6.5 — Cold-start / onboarding validation (new in F1, closes C3-Finding-8)
- **Objective:** validate the product-center claim *for new users*, where S3 only disabled Route 1.
- **Work:** real new users (not synthetic fossils): test fossil acquisition, onboarding, evidence quality/consent/revocation, whether the opening genre-prior question biases later salience, and how users reach the ≥12-observation threshold.
- **Gate G6.5 (binary):** *For real new users, does the first-N-session experience (Route-2 + onboarding) meet a pre-registered satisfaction bar AND does the opening question demonstrably improve (not bias) later salience? Is v1's SSI-dialogic claim honestly scoped as "applies after a ~N-session learning period"?*
  - **Fail → investment rule:** if onboarding biases salience or new-user experience is poor, redesign onboarding before marketing Route 1 as core; **the v1 claim is explicitly scoped to post-learning** regardless.

### Phase 7 — Hardening, export insurance, dependency de-risk, amendment process
- **Work:** exercise C++ export continuously (already proven Phase 1). Resolve commercial license if commercializing. Crash/panic recovery, project-format versioning, fossil-memory privacy policy, red-team report. **Document the constitutional amendment process** for adding a primitive to either scale (proposed → verified → reload → usable).
- **Gate G7:** *If Cmajor died tomorrow, what survives?* Required: all DSP algorithms (exported C++) + the entire intent substrate; lost only the JIT malleable loop until re-hosted.
- **Named residual:** export preserves *algorithms*, not the *malleable loop*. Lock-in of malleability, not DSP, is the residual.

### Dependency graph
```
Phase 0 (provisional constitution + dual-domain attack + actor-lattice scope + G0)
   ├─▶ Phase 1A (engine + host-concurrency proof + reload bridge, G1A) ─┐  FALSIFIER-FIRST (engine)
   └─▶ Phase 1B (salience WoZ + baseline ladder + model-validity, G1B)  ┤  FALSIFIER-FIRST (product)
                                                                        ▼
                              Phase 2 (Coherent IR, full-dep-graph constructors + param-as-constructor + amplitude net, G2)
                                     └─▶ Phase 3 (palette + manifest-truth + compile≠coherence admission, G3)
                                            └─▶ Phase 4 (typed store + intent scale + identity + actor lattice, G4)
                                                   └─▶ Phase 5 (real salience + /sde shape, G5 ★central)
                                                          └─▶ Phase 5.5 (reload-UX acceptability, G5.5)
                                                                 └─▶ Phase 6 (first instrument, G6)
                                                                        └─▶ Phase 6.5 (cold-start, G6.5)
                                                                               └─▶ Phase 7 (hardening + export + amendment, G7)
```

---

## 10. Residual risks & how to falsify them (concrete, numeric/procedural)

Every falsifier gets a number or a named procedure. Any one firing forces re-architecture or a pre-declared rescope, not a patch.

1. **Intent-scale closure fails beyond the named breaker.** *Procedure:* Phase-0 dual-domain corpus. *Fires if:* an artifact is neither reference/revision/convention/constraint nor a composition, AND not handled by the actor lattice. **[Most under-tested; gated G0/G4.]**
2. **`authority` bites inside v1 scope.** *Fires if:* a v1 artifact requires peer-authority resolution the actor lattice cannot provide (G0). *Then:* cut the feature or re-open the intent primitive set (major). Multi-authority delegation is *already* named and scoped out — its appearance in collaboration is expected, not a surprise.
3. **§3c not closed by construction (incl. cross-rate/control + runtime params + schedule).** *Procedure:* G2 — attempt to construct a zero-delay audio/control cycle; drive `feedbackGain≥1` at runtime; construct a non-monotone schedule transform. *Fires if:* any constructor admits any of them → validate-reject, not by-construction → SSI claim false for signal.
4. **Amplitude leaks past the multi-boundary net.** *Fires if:* a clamp-legal patch produces audible inf/NaN/runaway at any boundary the net doesn't cover. *Then:* containment story broken at the one undecidable property.
5. **Host concurrency for the reload bridge is not viable.** *Procedure:* G1A item (1)/(2). *Fires if:* two live Engine/Performer instances cannot be advanced/fed/mixed concurrently without UB, or event/transport replay is non-deterministic. *Then:* **silence-boundary reload**; Tier 1/2 cut; "not a compromise" retracted in docs.
6. **Reload bridge can't mask the seam / xruns.** *Procedure:* G1A item (3). *Fires if:* dry-path crossfade audibly artifacts on sustained material OR overlap xruns at 128-buf/48 kHz on ≥40%-core patch. *Then:* malleability downgraded per patch class.
7. **In-series truncation is artistically unacceptable.** *Procedure:* G5.5. *Fires if:* acceptable < 70% OR "would break flow" > 20% on target workload. *Then:* edit-at-stop positioning or mandatory state-serializing modules.
8. **Parameter-class avoidance covers too little.** *Procedure:* Phase-3+ telemetry: fraction of edits handled as parameter-class. *Fires if:* low fraction AND reloads common AND Tier-1 can't mask → reloads dominate.
9. **Salience can't be calibrated into discovery (the central one).** *Procedure:* baseline-ladder, context-conditioned held-out, beats user-aware linter + EIG/VoI-ablation on abstention/usefulness/VoI; G1B (N≥8 pilot) and G5 (N≥24 powered). *Fires if:* SSI fails to beat the user-aware linter OR the EIG/VoI-ablation matches SSI OR musicians experience a checklist. *Then:* dialogic claim dead; ship Route-2 DAW; Route 1 experimental.
10. **Factorization independence is wrong.** *Procedure:* G1B-MV/G5-MV model-comparison. *Fires if:* sparse-pairwise/hierarchical beats factored by the registered margin. *Then:* add coupling or reduce KL/EIG claims.
11. **Cold-start makes the product-center claim hollow for new users.** *Procedure:* G6.5 with real new users. *Fires if:* new-user experience below bar OR opening question biases later salience. *Then:* redesign onboarding; scope v1 dialogic claim to post-learning.
12. **Convention can't bias regeneration transparently.** *Procedure:* G4 two-session demo. *Fires if:* recall-not-plan-time, or biasing opaque.
13. **piNen's IR model diverges from the compiled program.** *Procedure:* endpoint + identity verification at every reload. *Fires if:* a generator-bug class makes piNen "talk about" a patch that isn't playing → reflexivity premise unsafe.
14. **Module manifests insufficient / can lie.** *Procedure:* G3 incorrect-manifest module. *Fires if:* the system certifies a module whose real spectral/nonlinear/latency behavior contradicts its manifest → "can answer why" gate too weak; coherence claim (which rests on manifest truth) compromised.
15. **The vision was continuous morphing all along.** *Procedure:* G0 asks explicitly. *Fires if:* Donald wants to reshape the *running* graph as a performance gesture → Cmajor wrong; restart engine selection.
16. **Cmajor dies and export can't preserve malleability.** *Procedure:* G7. *Fires if:* "what survives?" is worse than "algorithms + intent substrate." Mitigated (early/continuous export), not eliminated; named residual.

---

## 11. Named open decisions for Donald (the conscious choices the framework cannot make for him)

These are §6.4/§6.7-style decisions where the framework can lay out the tradeoff but Donald must choose. Each names the evidence that would resolve it.

**Decision #1 — Is topology morphing an EDIT or a PERFORMANCE GESTURE? (§6.4)**
- *Tradeoff:* Edit ⇒ Cmajor + regenerate-and-reload is fully buildable today and preserves by-construction coherence. Performance gesture (reshape the *running* graph mid-note) ⇒ Cmajor cannot do it today (dynamic routing is roadmap-only, no timeline — R2/R4); a dynamic engine sacrifices *all* compiler-enforced clamps and forces reimplementing coherence as runtime checks (a different, weaker architecture).
- *Resolve by:* Donald's own statement at G0. *Evidence that would force the answer:* if in real use he reaches to morph topology as a continuous gesture, the engine bet is wrong (falsifier #15).

**Decision #2 — Cmajor commercial commitment & license-termination tolerance. (§6.7)**
- *Tradeoff:* Indie tier £2,000 one-time if org < $300K (cheap); Pro tier unpriced; EULA §7.1 permits at-will termination; GPLv3 fallback is viral (forces open-sourcing a commercial product). C++ export preserves *DSP algorithms* but not the *malleable loop*.
- *Resolve by:* legal read of the commercial agreement's termination terms + a Pro-tier quote (both Phase-0/1 actions). *Evidence:* if termination terms are genuinely at-will with no commercial-grade protection, and GPLv3 is unacceptable for the business model, the dependency is a single point of failure to weigh before heavy investment.

**Decision #3 — Is Route 1 (spec-driven dialogue) a CORE v1 claim or a PREMIUM/EXPERIMENTAL layer? (§6.8, §5.7, C3-Finding-8)**
- *Tradeoff:* Marketing Route 1 as core means the cold-start gap (no fossil → Route 1 disabled for new users) directly undercuts the first-impression experience. Treating Route 1 as premium/post-learning (Route 2 default) makes the cold-start disablement honest and low-stakes, but concedes that the *defining SSI dialogue* is not present for new users until the dialect is learned.
- *Resolve by:* G6.5 onboarding evidence + Donald's product positioning. *Evidence:* if G1B/G5 show salience genuinely beats the user-aware linter *and* G6.5 shows onboarding doesn't bias, Route 1 can be core-with-learning-period; otherwise it is premium/experimental.

**Decision #4 — Acceptable reload-UX floor for in-series tails. (§6.3, C3-Finding-11)**
- *Tradeoff:* Dry-path crossfade with in-series truncation buys malleability-during-playback at the cost of cut tails on sustained/ambient material. Silence-boundary reload guarantees no artifact but makes the instrument feel less live.
- *Resolve by:* G5.5 thresholds + Donald's taste on the target user. *Evidence:* the ≥70% acceptable / ≤20% flow-break numbers; if the target user is ambient/drone-focused, the truncation may be disqualifying and silence-boundary is the honest v1.

**Decision #5 — If the EIG/VoI machinery is NOT load-bearing, ship the user-aware heuristic Route 1, or Route-2-only? (§5.6, C3-Finding-7)**
- *Tradeoff:* If G1B's EIG/VoI-ablation matches full SSI, the expensive belief-shift machinery buys nothing measurable; a user-aware heuristic Route 1 is cheaper and "good enough," but it is *not* the SSI-distinctive claim. Route-2-only is the most honest but least ambitious.
- *Resolve by:* the ablation result at G1B/G5 + Donald's appetite for the distinctive claim vs shipping. *Evidence:* the abstention/usefulness/VoI deltas between full-SSI and the ablation.

---

## 12. How this plan answers the handoff's verification standard

The handoff's standard (§8): *"claims about Cmajor capabilities must be grounded in the actual docs/API, not assumed,"* and the loop must make *"the framework get stronger from a successful attack."*

- **Cmajor claims are R2/R4-grounded, not assumed.** Static topology (R2: "arrays cannot be re-sized"; "fully dynamic graph routing" = future). Zero-delay-cycle compile error + `[1]` legalization (R2, verbatim). State non-preservation across `setNewRenderer()` (R2: destroys A before B; DSP state zero-initialized; only parameters + `storedState` key-value survive). Reflexivity surface (`getInputEndpoints`/`getOutputEndpoints`/`getEndpointHandle`/`generateCode`; internal connection graph NOT API-introspectable but known to piNen because it authored the source — R2). Licensing/£2,000 Indie/§7.1 termination/C++ export (R4). **Where the plan goes *beyond* R2 — the two-live-Performer concurrent bridge — it is explicitly labeled a Phase-1 spike unknown (§6.2, G1A item 1), not an established capability** (closing the exact gap C3-Finding-9 named).
- **Every C3 finding is closed in text or named as a decision.** Blockers 1–4 (cross-rate causality, runtime-param constructor, schedule monotonicity, experimental-module escape) → closed in §4.1/§4.3/§4.4/§5.5 as G2/G3 pass conditions. Blocker 5 (authority) → closed by folding `actor` + the lattice (§3.3) and honestly downgrading intent to *directional*. Blocker 6 (independence) → G1B-MV model-validity gate (§5.3). Blocker 7 (linter falsifier) → baseline ladder + narrowed claim (§5.6). Findings 8–12 → Phase 6.5, §6.2/G1A-item-1, §6.1-Tier-2-recspec, §5.5-acceptability G5.5, §6.3-split-metrics. Finding 13 → investment-freeze rules on every gate. Finding 14 → the [ARCH]/[PAPER]/[GATE] labeling and "directional" language throughout.
- **The framework got stronger from the attack, honestly.** C3's authority attack produced a required `actor` field, a declared precedence lattice, a v1 scope cut, and an explicit *directional* (not closed) intent verdict — exactly the handoff's "an honest SSI may have to say 'the invariant is as strong as your primitive analysis.'" That sentence is now *in* the plan (§2), not avoided by it.
- **The two plan-falsifiers are tested first, cheaply, before the heavy build** (Phase 1A/1B), each with numeric gates and pre-declared rescopes — so the project either builds the instrument the handoff imagined or learns cheaply and exactly why it cannot, which is the only honest definition of success for a project this ambitious.

---

## 13. The plan in one breath

Do SSI **twice**. Build a **signal substrate** `{buffer, transform(poly), schedule, routing}` whose incoherence — zero-delay feedback *over the full audio+control+sidechain dependency graph*, ambiguous overlap, *runtime parameter excursions*, *non-monotone time* — is **unrepresentable** in a Coherent Patch IR via total constructors, with Cmajor's compiler as the independent witness and amplitude/NaN as the one statically-undecidable property *contained* (not constructed) by a mandatory multi-boundary net. Build an **intent substrate** `{reference(+identity), revision, convention, constraint(+actor)}` on a real transactional store, whose closure is honestly **directional, not closed**: the actor lattice resolves single-authority conflicts by construction, and multi-authority `authority` is the named, scoped-out breaker that makes the invariant exactly as strong as the analysis — and we say so. Make malleability **regenerate-and-reload**: free for constructor-checked parameter edits, masked on the dry path by an Engine-level crossfade *if two live Performers can actually run concurrently in the host (a Phase-1 spike, not an assumption)*, honestly truncating for in-series tails in v1. Compute salience as a per-user **context-conditioned belief shift** — EIG and VoI over a factored distribution — and prove it differs from a **user-aware heuristic linter** on abstention, usefulness, and answer-changing VoI, conceding cleanly if the EIG/VoI machinery turns out not to be load-bearing. Wrap it in a toggleable **spec-driven-ecological shape**, Route-2 by default, Route-1 salience-gated and conservative. Then **test the two things that can kill it first, in parallel, on paper** — the reload bridge (G1A, host-concurrency-first, numeric) and the salience discrimination (G1B, baseline-ladder, pre-registered) — behind gates with **investment-freeze rules** so no failure can be rationalized past. Keep the chromatic-scale register where it is load-bearing: four notes that build any instrument and cannot leave the scale, plus an intent scale whose honesty about its own leak is the point.

---

*End of final plan. F1 (Opus 4.8), plan of record for RUN_20260629-214123.*
