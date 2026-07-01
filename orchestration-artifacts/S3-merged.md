# S3 — Merged Plan: The Two-Substrate SSI DAW (Coherent by Construction, Dialogic by Distribution)

**Role:** MERGE SYNTHESIZER S3 (Opus 4.8). Planning only; no code written.
**Inputs:** Handoff §§1–11; syntheses S1 (Opus) + S2 (Codex); critiques C1 (Codex→S1) + C2 (Opus→S2); research R1–R4.
**Mandate:** Forge one superior plan from the strongest elements of A and B, resolve **every** must-fix from C1 and C2 (incorporate or justify rejection), and decisively close the four critical issues the brief names. Front-load the two plan-falsifying unknowns (reload bridge, salience calibration) behind loud binary gates with numbers.

---

## 0. Thesis and executive position

> **SSI for a DAW is doing SSI twice.** There are two closed domains, each with its own complete primitive set and its own *by-construction* coherence mechanism: a **signal substrate** {buffer, transform(polymorphic over buffer AND schedule), schedule, routing} whose coherence is enforced by **total smart constructors in a Coherent Patch IR + the Cmajor compiler**, and an **intent substrate** {reference(+identity), revision, convention, constraint} whose coherence is enforced by a **transactional store with total constructors + a constraint-precedence solver**. The harness (piNen) is the sole inhabitant of the single seam between them: conventions and constraints bias/prune signal generation; signal sediments back into references and conventions. The entire ambition of the project lives in one computation at that seam — **whether, for THIS user, a detected signal consequence shifts the belief distribution over their intent enough to be worth a sentence** — and that computation is made real (not a linter) by representing intent as a small factored *distribution* over style axes, so Bayesian surprise and expected-information-gain are genuinely computable and genuinely personal.

Six commitments, taken as strong positions:

1. **Coherence is by construction, not by validation.** Incoherent signal patches (zero-delay feedback cycles, ambiguous schedule overlaps) are made **unrepresentable** in the IR via total constructors — the `SpawnGuard` move lifted to audio. The clamp *verifier* and the Cmajor compiler are belt-and-braces cross-checks, never the primary mechanism. (Closes C1-A4-construction-half, C2-A1.)
2. **One coherence property resists by-construction enforcement: amplitude/NaN.** It is statically undecidable for arbitrary IIR/feedback systems (you cannot prove a resonant feedback path stays bounded for all inputs). It is therefore handled by a **mandatory, non-removable, multi-boundary runtime containment net** — honestly labeled *containment*, not construction. (Closes C1-A4, C2-A1-residual; satisfies brief #1's "say exactly why a residual net is needed.")
3. **The intent domain gets its own primitive set and its own *run* closure attack** — not an imported one. The signal-only {reference, revision, convention} verdict of S1 is **rejected as incomplete**: C1's project-scoped-commitment artifact breaks it. The merged intent scale adds **constraint** and folds **identity** into reference. (Closes C1-A1, C1-A2, C1-A5, C2-A3.)
4. **Intent is a distribution from day one — but a cheap one.** A factored per-axis distribution over ~9 style axes makes KL-surprise and EIG closed-form and tractable *because the domain is tiny* (7 primitives). The "rules/weights" of S1/S2 survive only as the *sufficient statistics* that parameterize it. (Closes C2-A2, C1-A10.)
5. **Reload is audible by default and only *partially* maskable.** A three-tier strategy (parameter-class avoidance → engine-level crossfade for the compile gap → parallel-send-only tail bridge) is specified at the correct API level, with the in-series-tail-truncation limitation stated plainly and a CPU-xrun falsifier with numbers. (Closes C1-A6, C1-A7, C1-A8, C2-A4, C2-A6.)
6. **The two plan-falsifying unknowns are tested first, in parallel, on paper/mock, before the heavy build** — reload-bridge measurement (engine) and a Wizard-of-Oz held-out-consequence salience study (product) — each behind a loud binary gate that can stop the project cheaply. (Closes C1-A11, C1-A13, C2-A5.)

---

## 1. Primitive-set verdict — BOTH domains, with the closure attacks actually run

The SSI load-bearing condition (handoff §1) — *"the invariant holds by construction only if the domain's primitive set is genuinely closed and complete"* — must be satisfied for **both** the signal domain and the intent domain, because the product is built around the intent domain. S1 and S2 both satisfied it for signal and quietly waved the intent domain away as "harness metadata." That is the un-run attack, still un-run (C2-A3). We run it here for both.

### 1.1 Signal domain — closure HOLDS (accepted, plus one fresh artifact)

R1 and R4 ran two independent adversarial passes (arrangement features; interaction model) and Cmajor corroborates twenty years of Storer's experience. Verdict: **{buffer, transform(polymorphic over buffer AND schedule), schedule, routing} is complete for the known signal domain.** Accepted; not relitigated.

**Fresh artifact run here (honoring brief #3's "actually run, not import"):** *stem-mastering loudness normalization to a relational target* — "make the master hit −14 LUFS integrated, and keep the snare 6 dB below the kick across the whole song." This is the artifact C2 suggested but neither S1 nor S2 tested.
- **Signal half reduces:** integrated-loudness measurement is a `transform` on a `bus` (routing) emitting a control `buffer`; the gain correction is a `transform` driven by that buffer. No fifth signal primitive. ✓
- **But the *target* does not live in the signal domain.** "−14 LUFS integrated" and "snare 6 dB below kick across the whole song" are **normative, relational, project-scoped commitments**. They are not buffers, transforms, schedules, or routing. They are intent-domain objects. **This artifact does not break signal closure — it proves the intent domain is load-bearing and needs its own primitives.** It hands us the bridge to §1.2.

**Signal verdict: closed and complete (R1 + R4 + this pass + Cmajor). Strong.**

### 1.2 Intent domain — S1's {reference, revision, convention} is BROKEN; the merged scale is {reference(+identity), revision, convention, constraint}

C1's breaking artifact (Attack 1), restated: a user asserts *"for this song, preserve the accidental aliasing in the intro even if later mastering is clean; keep the chorus pad phase-locked to the sidechain pump whenever sections move; never quantize the vocal breaths."* This is:
- **not a reference** (not a pointer to a signal object),
- **not a revision** (not a reversible delta between configurations),
- **not a convention** as S1 defined it (not a weighted tendency under repeated evidence — it is a *one-shot normative prescription*).

S1 storing it as a convention either underweights it (a one-off, so future regeneration violates an explicit user rule) or overweights it (a local song decision pollutes the global dialect). **The intent scale needs a primitive S1 lacked.** We add it, and we redefine reference to carry identity.

**The merged intent scale — four primitives, defined by their defining property:**

| Primitive | Defining property | Carries (reductions) | Distinct from |
|---|---|---|---|
| **reference** | *immutable binding from a stable logical **identity** to a versioned signal-layer object* | comping/takes, region aliasing, freeze/bounce, non-destructive edit, ARA exposure, "the same delay module before & after reload" | a raw pointer (which goes stale on regeneration) |
| **revision** | *typed, reversible delta + the tree it forms (branching is the defining property; linear undo is the degenerate case)* | undo/redo, undo trees, project alternatives, the entire edit history, collaborative concurrent edits (CRDT-shaped) | a snapshot (a revision is the *transition*, with its inverse) |
| **convention** | *descriptive, evidence-weighted, context-tagged tendency ("this user tends to combine X with Y in context C")* | the personal dialect, module affinities, routing habits, naming, deliberate-"wrong" choices kept | a constraint (a convention is *tends-to*, not *must-hold*) |
| **constraint** | *prescriptive, scoped, revocable normative commitment over future revisions ("this MUST hold until revoked")* | the §11 "spec," the loudness target, "preserve the intro aliasing," "keep phase-lock," tempo/warp anchoring rules, "never quantize the breaths" | a convention (prescriptive vs descriptive; the spec IS a set of constraints) |

**Identity is folded into reference as a required field, not made a fifth primitive** (resolving C1-A2's explicit either/or). Rationale: identity is the *defining attribute* of a reference in a regenerate-and-reload world — a reference that does not survive regeneration is not a reference. Making it a separate primitive would inflate the count without buying expressive power. But the fold is **explicit and load-bearing**: a reference = `(logical_id, versioned_binding)`, and the scale ships with **identity-preservation rules across regeneration** for split / merge / replace / delete / clone / unlink / bounce, plus a runtime endpoint-verification check that the regenerated concrete endpoints still bind to the expected logical identities (this is the §6.5 reflexivity seam; see §5.4). (Closes C1-A2.)

### 1.3 Running the closure attack on the merged intent scale (not asserting it)

Brief #3 demands the intent scale be stress-tested, not constitutionalized. Adversarial candidates and verdicts:

- **Project-scoped commitment** → `constraint`. ✓ (the artifact that broke S1).
- **Stable identity across regeneration** → `reference` field + preservation rules. ✓ (C1-A2).
- **Conflicting schedule timebases** (tempo map says bar17@43.2s; warp says transient@42.9s; section-move; phase-lock) → a *set of constraints* resolved by the **constraint-precedence solver** with explicit anchoring modes (sample-time vs musical-time vs relational). Not a new primitive; a clamp (§4.4). ✓ (closes C1-A5, which correctly noted "summing buses don't resolve timebase conflicts").
- **Collaborative multi-user editing** → concurrent `revision` trees over shared `reference`s with a merge function; merge conflicts resolved by `constraint` precedence. CRDT-shaped. Reduces. ✓ **[THIN — one pass]**
- **Provenance / rationale** ("why did I do this") → a `revision` annotation referencing the `convention`/`constraint` that motivated it. Borderline; reduces to metadata-on-revision. ✓ **[THIN — thinnest reduction; flagged]**
- **Contradiction between conventions** (saturation→filter in session 3, filter→saturation in session 7) → handled by `convention` being *distributional and context-tagged*, not point-valued (§4.3). Not a new primitive.

**Named residual / breaking-artifact candidate (honest flag, NOT constitutionalized):** **cross-user normative authority.** When two users assert contradictory `constraint`s at equal precedence, *whose wins?* This may require an `authority`/`ownership` notion that is arguably a fifth intent primitive. We **do not** claim the intent scale closes against this. It is scheduled as the intent-scale's standing falsifier (§9 Phase 0 attack corpus; §10 falsifier #2). For single-user v1 it does not bite.

**Intent verdict: {reference(+identity), revision, convention, constraint} is the best closed hypothesis for the single-user known domain, with `authority` named as the open attack surface. [THIN relative to signal — two passes here vs R1+R4+Cmajor for signal; this is the most under-tested claim in the plan and is gated, not constitutionalized — see Phase 0.]**

### 1.4 The coupling seam — three-tier generation, made mechanical

The two scales touch at exactly one structural seam, and the three intent constructs play three *different* roles in generation — this is the precise unification S1 reached for but under-specified:

```
intent ─▶ [ CLAMPS make incoherent UNCONSTRUCTABLE ]      ⊃  the coherence envelope (signal scale)
            [ CONSTRAINTS prune must-hold violations ]      ⊃  the legal-for-this-song set (intent: constraint)
              [ CONVENTIONS rank by personal dialect ]       →  the chosen IR (intent: convention)
                                                              ▲
              signal output ── captured as ──▶ reference ─── sediments back ──▶ convention / (confirmed) constraint
```

- **Clamps** (signal substrate): incoherent is *unrepresentable*.
- **Constraints** (intent): hard filters; prune candidate IRs that violate a must-hold commitment. A constraint cannot push a patch outside the coherence envelope (clamps still bind), but it can forbid otherwise-coherent patches.
- **Conventions** (intent): soft ranking; the distribution biases which surviving coherent+legal IR is chosen.

The harness is the only inhabitant of this seam (Cmajor lives entirely signal-side and is forbidden the intent side — §11d; Engram/Graphify/the typed store live entirely intent-side). "Harness at the center" is therefore a structural necessity, not a slogan: it is the only thing that can read a convention and emit a routing graph.

### 1.5 Verdict summary

| Domain | Members | Closure | Enforced by | Strength |
|---|---|---|---|---|
| Signal | buffer, transform(poly), schedule, routing | closed + complete | total IR constructors **+** Cmajor compiler (+ residual amplitude net) | **Strong** (R1+R4+Cmajor+fresh artifact) |
| Intent | reference(+identity), revision, convention, constraint | closed hypothesis (single-user); `authority` open | typed transactional store + total constructors + constraint-precedence solver | **[THIN]** — two passes; gated in Phase 0 |

---

## 2. §6.2 — the closure stance, stated as three falsifiable proof obligations

S1 wanted to "promise closure outright"; C1-A3 correctly attacked this as changing the meaning of "closure" midstream. We adopt C1's demanded precise language. SSI does **not** promise unconditional closure. It promises, **per domain**:

> **Closure relative to a named domain corpus, enforced through total constructors, falsifiable by (a) an irreducible operation or (b) an unclamped emission path.**

This decomposes into **three separable proof obligations** (C1-A3, C2-A1):

1. **Expressibility/completeness** — every operation in the named corpus is a composition of the domain's primitives. *(Signal: R1/R4. Intent: §1.3, [THIN].)*
2. **Coherence by construction** — the harness can only *construct* the coherent refinement, because the constructors are **total over coherent states only** (the incoherent state has no representation). *(Signal: §4. Intent: §4.4. Exception: amplitude/NaN, §4.2 — runtime containment, honestly excluded from "by construction.")*
3. **Implementation non-bypass (the "no raw escape hatch" invariant)** — every signal artifact must enter through the IR constructors; every intent artifact through the intent-scale constructors/validators. No path (agent-authored modules, raw Cmajor generation, imported patches, direct Engram writes, Graphify-derived conventions) may inject an artifact that skips its scale's constructors. *(This is the obligation S1 and S2 both omitted; it is what makes "directional invariant" actually equal "closure" — C1-A3.)*

"Directional invariant" and "closure" are the same wall from two sides **only when obligation 3 holds**. We therefore make non-bypass an explicit, tested invariant (Phase 2/3 deliverable), not an assumption.

Completeness is **inductive, not exhaustive** (R1 Open Risk #1): we have reduced every *named* operation; we cannot quantify over the unknown. The honest promise is *"for every operation we or Storer's experience have named, the result is coherent by construction; new named operations are tested against the scales; a gate decides reduce-or-amend."* Adding a primitive is a **constitutional amendment** (lifecycle: proposed → verified → reload → usable), not a patch (§7.4, §9 Phase 7).

---

## 3. Resolved stances on §6.1–§6.8 (compact)

- **§6.1 (arrangement-as-shape vs primitive):** Signal arrangement features are *shapes on the signal scale* (R1/R4). But the **intent/working-history domain is a second domain with its own primitive scale** {reference, revision, convention, constraint} (§1.2). Both domains get explicit closure analysis (§1.1–§1.3). This is the §6.1 discovery — *intent becoming primitive* — landed honestly.
- **§6.2 (closure vs direction):** Three proof obligations, closure relative to a named corpus, falsifiable (§2).
- **§6.3 (state across reload):** State is **not** preserved (R2). Audible by default; *partially* maskable via the three-tier bridge (§6). In-series stateful tails truncate in v1 — stated plainly.
- **§6.4 (continuous topology morphing):** **Not** v1 vision. Topology change is an edit, not a performance gesture (R4). Confirmed by Donald at G0 or the engine bet is wrong.
- **§6.5 (reflexivity):** Cmajor host API gives sufficient *runtime endpoint* reflexivity (R2); piNen owns **structural** reflexivity (it generates the source) **and** must carry a **semantic module manifest** per transform so it can *talk about* a patch, not just name endpoints (C1-A9, §5.5). Two-source seam: piNen IR authoritative for topology+intent; Cmajor compiled view authoritative for what ran; mismatch blocks reload.
- **§6.6 (intent store):** Read at **three** moments (regeneration biasing, salience calibration, dialogue enrichment) — R3. Three layers; the store of record is a **dedicated typed transactional database**, with Engram/Graphify as *summary/retrieval/semantic-index*, NOT the transactional revision DB (C1-A15, §5).
- **§6.7 (Cmajor dependency):** Proceed as candidate; legal + export gates in Phase 1 (R2/R4). C++ export exercised early (Phase 1), not late (C1-A10/C2 sequencing). Indie tier £2,000 if org < $300K; Pro tier unknown; EULA §7.1 at-will termination needs legal read; GPLv3 fallback acceptable for prototype.
- **§6.8 (salience):** Adopt R3's *Salience-as-Belief-Shift conditioned on Intent* (S1–S6) — but only on a **distributional** intent model that can actually compute it (§5.6). Route 2 is the default; Route 1 is opt-in/premium and conservative.

---

## 4. Substrate-clamp enforcement — by construction, with one honestly-scoped runtime residual

This is brief requirement #1. The architecture is a **Coherent Patch IR** between intent and Cmajor source. The IR is the smart constructor; the clamp verifier and the Cmajor compiler are independent cross-checks; one property (amplitude) needs a runtime net.

```
intent ─▶ [Convention-biased planner] ─▶ Coherent Patch IR ─▶ [Emitter] ─▶ Cmajor src ─▶ [Cmajor compiler] ─▶ Performer
                                          (TOTAL CONSTRUCTORS)    (belt)          (braces)                         │
                                          incoherent = unrepresentable                          [multi-boundary amplitude/NaN net] (residual)
```

### 4.1 The three structural clamps are by-construction (unrepresentable-when-incoherent)

The fix C2-A1 and C1-A4 both demand: **construction, not validation.** Concretely, the IR exposes *no constructor that can produce an incoherent state*:

**Clamp 1 — Causality (no zero-delay feedback).**
- There is **no** general `addEdge(a,b)` that can close a cycle. Forward edges use `connect(src,dst)`. The *only* way to introduce a back-edge that would close a cycle is `closeFeedbackLoop(path, delay: PositiveNat)`, whose type **requires** a ≥1-sample delay argument. Incremental cycle detection runs at *each* edge construction (implementable one edge at a time, including in a live patching UI — C2-A1's point that this is concrete, not aspirational). A zero-delay cycle has **no representation** in the IR. Karplus-Strong is constructible; the screaming loop is not.
- *Braces:* Cmajor independently rejects zero-delay cycles at compile time (R2 confirmed: `connection p1->p2->p3->p1` is a compile error; `[1]` delay legalizes).
- *Net:* none — fully static.

**Clamp 3 — Time-monotonicity & schedule-collision (single coherent timeline).**
- A schedule placement's *only* possible target is a **summing `Bus`** (a first-class IR object with a declared gain law). There is **no** constructor that places two entries on the same output channel at the same instant *without* a bus — "ambiguous overlap" has no representation (C2-A1). Collisions are resolved at construction by routing through the mandatory bus.
- Project time is a monotone non-decreasing function; reverse playback is a *buffer-read* `transform` inside a forward schedule window, never negative project time (S2's correct model).
- **Arrangement-time conflicts** (tempo map vs warp vs section-move vs phase-lock — C1-A5) are *constraint-vs-constraint* conflicts resolved by the **constraint-precedence solver** on the intent scale (§4.4), with explicit anchoring modes. The summing bus resolves *audio-output* collisions; the precedence solver resolves *timebase* collisions. Both are by-construction in their respective scales.

### 4.2 Clamp 2 — Boundedness: the one place a runtime residual is genuinely required (brief #1's explicit ask)

**Two halves, with sharply different enforceability.**

- **Termination / stack-boundedness — by construction.** Transforms are drawn only from the manifest-bearing module library; Cmajor disallows runtime recursion and bounds stack/allocation at compile time (R2 confirmed). The IR cannot reference an unvetted transform (non-bypass, §2 obligation 3).
- **Amplitude / NaN / inf finiteness — NOT by construction; runtime containment net. Here is exactly why (brief #1):** Whether a *legal, causal, stack-bounded* patch (e.g., a high-Q resonant IIR or a feedback path with a 1-sample delay) stays amplitude-bounded for all inputs is **statically undecidable** — it is a behavioral property of a dynamical system over unbounded input, not a syntactic property of the graph. R2 confirms Cmajor bounds the *stack* but makes **no finite-amplitude guarantee**. No IR constructor and no compiler can refuse "the unstable-for-some-input patch" without also refusing musically essential resonant/feedback structures (R1's exact argument against baking coherence into primitives). Therefore amplitude finiteness is enforced by a **runtime net** — and we do **not** dress it as "by construction."
- **Scope of the net (correcting C1-A4: not just the DAC).** A mandatory, non-removable **guard transform** (NaN/inf flush-to-defined, soft-saturator to renderable range, DC blocker, denormal flush) is inserted at **every state boundary where a poisoned value can persist or propagate**: feedback-loop boundaries, every `Bus` output, send/return taps, sidechain/control-rate conversion taps, freeze/bounce write points, and the DAC. This is the audio analogue of the spawn cap you cannot raise — it is a signal-scale `transform` (costs nothing in primitive count) but is unbypassable by intent (non-bypass invariant).
- **Honest limitation (C1-A4):** the net is **containment, not coherence**. It prevents crash/propagation/speaker-damage and bounds output; it can turn an intended-unstable sound into clamped/defined output rather than the user's intended result. It does **not** make the patch "coherent by construction." We label it precisely as containment and surface a *consequence* ("this path is conditionally unstable; the guard is engaging") to the salience layer rather than silently swallowing it.

### 4.3 Why three layers (and not just trust Cmajor)

Cmajor's compiler guards *its* concern (real-time safety), not *ours* (coherent musical artifacts). The IR belt exists so the harness *never forms an incoherent intent* — refusals surface as plan-time "I can't build that, here's the nearest buildable thing" (which feeds the dialogue, §5.6/§7), not as a compile error the user must decode. The compiler braces are an independent witness (catches emitter bugs). The amplitude net exists because amplitude is the one coherence property neither IR nor compiler can prove statically. Remove any layer and a real failure class leaks.

### 4.4 The intent-scale consistency clamp + constraint-precedence solver

Because intent is a closed scale, it gets its own by-construction directional invariant, enforced by piNen alone:
- **revision** may only be appended if it keeps the tree acyclic and reversible (carries its inverse). No constructor produces a self-ancestor revision.
- **convention** is written only through the contradiction-resolver: a contradicting convention is **contextualized** (both retained, conditioned on context C, evidence-weighted, time-decayed — R3 exponential-decay/sliding-window), never clobbered.
- **constraint** is written with a scope (global / project / section), a precedence rank, and a revocation handle. The **constraint-precedence solver** resolves constraint-vs-constraint conflicts deterministically by (rank, scope-specificity, recency, anchoring-mode), and *refuses* to emit an IR that violates an un-revoked constraint (the hard-filter of §1.4). Conflicting constraints with equal precedence raise a **salience event** (a question), never a silent pick — and for cross-user equal-precedence conflicts, this is the `authority` open problem (§1.3).

---

## 5. Arrangement / fossil store + intent model + the computable salience principle

This is brief requirement #2 and the heart of the project. The design must (a) be a real transactional store, not loose memories; (b) carry the four intent primitives; (c) drive a salience principle whose math the chosen representation can actually compute; (d) ship a falsifier a tuned linter fails.

### 5.1 Storage of record: a dedicated typed transactional store (NOT Engram-as-database)

C1-A15 is correct: Engram stores text observations; Graphify builds project graphs; neither is a low-latency transactional, typed, referential-integrity arrangement DB. A DAW needs atomic revisions, branching undo, stable IDs, referential integrity, queryable constraints.

| Layer | Content (intent-scale terms) | Backing store | Read at |
|---|---|---|---|
| **L0 Store of record** | the actual `reference`/`revision`/`constraint` graph: event-sourced, snapshot-capable, ACID, referential integrity, schema-migratable, corruption-recoverable | **dedicated typed store** (e.g., embedded transactional DB / event log + snapshots) — the source of truth | every edit; undo; reload identity verification |
| **L1 Raw/semantic index** | session summaries, structural relations between patches, retrieval | **Engram** (type-tagged observations) + **Graphify** (community structure over patches) | recall, dialogue enrichment, retrieval |
| **L2 Fossil** | the **conventions** + (confirmed) **constraints**: de-duplicated, contradiction-resolved, context-tagged, evidence-weighted | L0 + Engram topic-keys + Graphify organization | regeneration biasing; salience prior |
| **L3 Intent model** | derived **factored distribution** P(Intent) over style axes — **NOT persisted** | computed at session start from L2, updated incrementally | regeneration biasing; **salience math** |

**Discipline:** L3 is recomputed each session, never persisted (persisting it breaks intent-scale closure and lets stale opaque state accumulate). Engram/Graphify are demoted to index/summary; L0 is the transactional truth (C1-A15).

### 5.2 Plan-time biasing — the personal-dialect mechanism, made mechanical

When intent arrives: clamps bound the constructible set (coherent); constraints prune it (legal-for-this-song); conventions rank the survivors (dialect). Biasing only ever selects among already-coherent, already-legal IRs — it cannot bias toward an incoherent or constraint-violating patch (§1.4). The dialect operates *inside* the coherence envelope and *inside* the constraint filter. Transparency requirement: any biased choice must be answerable from L2 ("why saturation there?" → the convention + evidence count that produced it) — gated at G4.

### 5.3 The intent-model representation — distribution, but CHEAP (resolving C2-A2 head-on)

C2-A2 is the decisive attack on S2 and the latent flaw in S1's MVP: **a rule/weight model cannot compute KL-surprise or EIG.** You cannot take a KL divergence of a rule list. We resolve it by choosing the **distributional** horn — and rejecting the premise that distributional means expensive:

- The intent model is a **factored distribution over ~9 style axes** (R3/S2's enumerated axes): cleanliness↔grit; artifact-tolerance (aliasing/clipping/feedback/latency); module-family affinity; routing idioms; rate preference; dialogue preference; expertise vocabulary; risk appetite; temporal style.
- Each axis is a small parametric belief — e.g., a **Beta/Dirichlet** posterior over a low-cardinality categorical/ordinal. Independence across axes (or a sparse pairwise coupling) is assumed for v1.
- **The "rules/weights" of S1/S2 survive only as the sufficient statistics** (evidence counts) that parameterize these posteriors. So we keep S1/S2's transparency (you can read "saturation-before-filter: 3 confirmations") *and* get genuine computability: a Beta posterior gives **closed-form KL** and **closed-form entropy/EIG**.
- This is cheap *because the domain is tiny* (R3's Flash-Fill insight: inference is tractable when the program space is small; the 7 primitives ARE the tiny DSL). We therefore **reject R3/C2's framing that "probabilistic ⇒ a 100-dimension Bayesian network ⇒ expensive."** Nine factored axes is not that. (Incorporate C2-A2's horn (a); reject its cost premise.)

This is the real coupling: **the salience prior P(Intent) IS the fossil record (L2) compiled into per-axis posteriors.** A linter has no user and no prior; it cannot compute S1. SSI computes surprise against THIS user's posteriors.

### 5.4 Identity, regeneration, and the reflexivity seam (closing C1-A2, C1-A9)

Because reference carries logical identity, state migration and dialogue key on **stable logical identity + an explicit per-module state contract**, never on source-name coincidence (C1-A2). On each regeneration, piNen diffs the old and new IR (it generated both), computes the identity map (split/merge/replace/delete/clone/unlink/bounce), and after compile runs the runtime endpoint verification (`getInputEndpoints`/`getOutputEndpoints`, R2) to confirm regenerated concrete endpoints bind to the expected logical identities; a mismatch is a generator bug and **blocks reload** (two-source seam). Dialogue ("explain why the chorus pad is routed through that compressor") resolves through logical identity, so it survives regeneration.

### 5.5 Module manifests and the admission gate (closing C1-A9, C1-A14)

Reflexivity from endpoint names alone is insufficient to *talk about* a patch (C1-A9). Every transform carries a **semantic manifest**: rate behavior, gain bounds, state bounds, latency, nonlinearities/spectral assumptions, oversampling/anti-alias policy, parameter semantics, NaN/denormal policy. "Can answer *why*?" is part of the manifest, hence part of the gate — not an emergent property of names.

**Agent-authored modules** (§10d) are untrusted until they pass a defined gate (C1-A14, replacing S1's hand-waved "boundedness check"). Admission levels:
- **experimental** — compiles, no recursion, endpoints verified; routed through heavier runtime guards + UI disclosure.
- **guarded** — passes impulse/sweep tests, parameter-range stress, NaN/denormal sweeps, latency declaration, manifest review.
- **certified** — guarded + adversarial test vectors + reproducible amplitude bounds within declared parameter ranges.
Only manifest-bearing transforms are referenceable in the IR (non-bypass).

### 5.6 The salience principle — adopted, made computable, and given a linter-proof falsifier

We adopt R3's principle (the same S1 and S2 reached) — but bind every criterion to the §5.3 distribution so it is genuinely evaluable, and add the discriminating gate both critics demanded.

> A detected consequence **C** earns a question **iff**:
> **S1 — Surprise:** KL( P(Intent|C) ‖ P(Intent) ) > θ_surprise, on the factored per-axis posteriors (closed-form). *Consequence→likelihood mapping is generic:* C maps to evidence over style axes (e.g., "introduces inharmonic artifact" → likelihood favoring grit-tolerance). This is the key to generalization (below).
> **S2 — Affordance:** C materially changes the user's action possibilities (Gibson).
> **S3 — Relevance:** expected cognitive benefit > processing effort (Sperber–Wilson). *(Honestly: estimated qualitatively by the LLM; bounded by S1/S4 — see thin-spots.)*
> **S4 — Value of Information:** EVSI(C) > cost-of-interruption.
> **S5 — Informativeness:** among survivors, surface highest EIG first; hard stop at the turn budget.
> **S6 — Safety/Constraint override:** any substrate-clamp safety event **OR any user-`constraint` violation** is surfaced *always*, regardless of salience. (Most clamp violations are *unconstructable* (§4), so S6 mostly fires as "you asked for the unbuildable — here's the nearest buildable thing" and "this would violate your own constraint X.")

**The coupling that makes it real, not a linter (resolving C2-A2, C1-A10):** the consequence→likelihood map is **generic over style axes**, and the prior is **per-user**. Therefore even a consequence type *no one hand-coded a rule for* gets personalized salience automatically, *because it still maps to evidence over the same axes and the surprise is computed against this user's posteriors.* A linter has neither the per-user prior nor the generic axis-likelihood; it surfaces by fixed type-rules. **This is the structural difference, and it is testable.**

**The linter-proof falsifier (the gate, not a milestone — C1-A10, C2-A2):**
- Calibrate salience on consequence types **{aliasing, clipping, feedback}**.
- Test on a **HELD-OUT** consequence type *never used in calibration* (e.g., latency-induced phase smear, DC offset, intermodulation distortion) across **two fossil histories** (grit-user vs clean-user).
- **Pass condition:** the *same mechanism, with no rule added for the held-out type*, produces materially different salience decisions for the two histories (target: surfacing-rate difference ≥ 40 percentage points on the held-out type, p<0.05, N≥8 musicians), **AND** a tuned generic-linter baseline shows **no** such difference (it structurally cannot — no prior, no axis-likelihood for the held-out type). A linter that passed would falsify our claim that this is the discriminator; it can't, which is the point.
- **Negative controls** (C1-A10): detected-but-should-not-surface cases (grit-user + aliasing) must abstain.
- Detection (arithmetic) is **separated from initiation** (audited for abstention quality): a linter-like detector is fine; what is audited is *which detections become questions* (C1-A10).

### 5.7 How Route 1 avoids becoming a clippy — structural, not aspirational (closing C2-A8)

C2-A8 correctly attacks "a list of product rules is not a mechanism." Each defense is bound to a computation:
1. **Route 2 is the default** (R3 inversion). A system that mostly stays silent cannot be a clippy. Route 1 is opt-in/premium.
2. **Conservative θ_surprise + asymmetric cost.** False positives kill Route 1; false negatives are caught free by Route 2 (the user hears it and asks). Calibrate toward silence: initial target Route-1 false-positive ("unnecessary") rate ≤ 20%.
3. **Turn budget (S5):** hard cap ≤ 3 questions per generation transaction — the dialogue analogue of the spawn cap. Interrogation floods are *structurally impossible*.
4. **Cold-start guard.** A new user has no L2 → uncalibrated posteriors (the most likely clippy trigger, R3 Risk #2). Route 1 is **disabled** until L2 has ≥ ~12 evidence observations across ≥ 3 style axes; replaced meanwhile by one opening genre-prior question. **The system earns the right to interrogate by first learning the dialect.**
5. **Enforced VoI (rule "ask only if the answer changes the build"):** computed, not hoped — if both answers yield the same chosen IR under the constraint filter + convention ranking, EVSI = 0 → S4 fails → no question (C2-A8).

### 5.8 Honest thin spots (do not smooth)
**[THIN]** θ_surprise has no analytic value (R3 Risk #1) — tuned by musician studies; Route 1 conservative-by-fiat until then. **[THIN]** S3 relevance is LLM-qualitative, not quantifiable (R3 Risk #4) — bounded by S1/S4 and Route 2 as net. **[THIN]** "feels like discovery" is study-only (R3 Risk #6) — the §5.6 held-out gate is the operationalization; if it fails after calibration, the *dialogic claim* is falsified (§10) even though a fine Route-2 DAW still ships.

---

## 6. State across reload — mechanically honest, three tiers, R2-correct (brief #4)

R2 is decisive and accepted without flinching: `setNewRenderer()` **destroys Performer A before B exists**; DSP state (delay lines, reverb tails, filter state, LFO/oscillator phase, ramps, counters) is **zero-initialized** in B; only **parameter values** and **`storedState` key-value pairs on the `Patch` object** survive. The reload boundary is audible by default. We convert *some* gaps to morphs, name what we cannot, and put numbers on the falsifier.

### 6.1 The crossfade-vs-tail-bridge tension, resolved by separating guarantees (C2-A4)

C2-A4 is correct that crossfade (short, masks the compile gap) and tail-bridge (long, preserves a tail) pull opposite directions, and that "tail-only execution" does not exist (A is a whole compiled performer of the *old* topology). We therefore do **not** conflate them. Three tiers with **distinct, limited, stated** guarantees:

**Tier 0 — Parameter-class avoidance (primary, free; covers the majority of edits).**
- Classify intents: *parameter-class* ("brighter," "more reverb," "slower LFO") → live `setInputValue`/`addInputEvent` with `rampFrames`; **no reload, no gap, sample-accurate** (R2 confirms live). *Topology-class* → reload.
- Generation strategy: emit graphs with **dormant zero-contribution stages** (e.g., a saturator at `drive=0`) so many "structural" intents become parameter moves.
- **Bounded, measured — not a panacea (closing C1-A8):** dormant-stage coverage is an *optimization with a CPU/latency budget*, not a seam-hiding strategy. Policy: max-dormant-modules per graph, defined bypass semantics, CPU/latency/denormal budget. **Required telemetry:** real-session fraction of edits handled as parameter-class vs topology-class. If the fraction is low, Tier 0 isn't carrying the load and the engine bet weakens.

**Tier 1 — Engine-level crossfade for the *compile gap* (masks the swap on the dry/input path).**
- Operate at **`Engine`/`Performer` level** (`copyOutputFrames`/`setInputFrames`), **not** `Patch::rebuild` (C2-A4): the Patch helper destroys A before B exists, so concurrent A+B is incompatible with the free Patch-level parameter/storedState preservation. **Therefore we must re-implement at the Engine level:** parameter save/restore, storedState round-trip, manifest handling, status callbacks, input duplication, MIDI/transport replay, latency compensation, parameter-ramp continuation. (This enumeration is the explicit cost C2-A4 demanded we state.)
- Compile B on a background thread while A plays (R2: Build is already background-threaded); equal-power crossfade A→B over ~5–50ms (to be measured); drop A.
- **Stated guarantee and limit:** this masks the *compile gap* for edits to the *dry/input* path. It does **NOT** preserve in-series DSP tails — B starts with zero state, so an in-series reverb/delay/filter **truncates** on reload in v1. We say this plainly.

**Tier 2 — Parallel-send-only tail bridge (narrow, honest).**
- ONLY for stateful effects on a **parallel bus the edit does not touch**: A's send keeps rendering its tail while B takes the dry path; sum the fading tail with B. Works *only* for parallel topology; **in-series stateful effects are not covered** (C2-A4).

**Residual, named (not hidden):** in-series reverb/delay/filter state is **not** preserved across topology reload in v1. State migration via Cmajor `storedState` is **key-value on the Patch object, not internal processor variables** — it is **not** general DSP-state migration (correcting C1-A6 and S1's overclaim, and C2-A6's LFO-phase point). Only modules that **explicitly serialize** state to stored-state endpoints can migrate; we require that contract for a *small* set of continuity-critical modules and accept truncation elsewhere. LFO/oscillator phase is in the **"cannot migrate in v1"** column, not "migrate" (C2-A6).

### 6.2 CPU / xrun — a falsifier with numbers (C2-A4c)
Running A and B concurrently transiently **doubles** DSP load → xrun risk on a heavy patch near budget — the very dropout the crossfade was meant to prevent. **Explicit falsifier:** *if dual-graph overlap causes xruns on a representative heavy patch (≥40% single-core baseline) at a 128-sample buffer @ 48 kHz, Tier-1 crossfade is impractical for that patch class → fall back to silence-boundary reload for it.* Phase 1 measures **CPU-under-overlap**, not just click masking.

### 6.3 Honest verdict on §6.3/§5d
The reload boundary is **audible by default, maskable for the dry/input path and for parameter-class edits, and *not* fully solvable for in-series tails in v1.** The handoff's "regenerate-and-reload is the correct topology, not a compromise" survives **conditionally**: it is correct for parameter-class and dry-path edits; it *is* a compromise for in-series-tail edits, which we name rather than hide. If Phase 1 shows even the dry-path crossfade artifacts unacceptably on sustained material, or xruns on representative patches, that is a falsifier (§10).

---

## 7. The spec-driven-ecological workflow — a toggleable sibling shape, two routes

Per §11c and the `spec-driven-ecology` skill: a **sibling shape on the substrate**, toggled by `/spec-driven-ecological-design-intent` (short `/sde`), never importing another shape, registered in the registry, following the shape-builder lifecycle (proposed → implemented_verified → reload → discovered → canary_passed → usable). No new core machinery; what is unproven is the judgment inside it (§5.6).

```
intent intake ─▶ (consult L2: prune by constraint, bias by convention)
   ▼
candidate Coherent-Patch-IRs   ◀── TOTAL CONSTRUCTORS (incoherent unrepresentable)
   ▼
static consequence detection (aliasing, clipping headroom, latency, CPU, constraint-violation) — arithmetic, cheap, linter-like (fine)
   ▼
ROUTE SWITCH (shape ON/OFF?)
  ON  ─▶ salience S1–S6 over the factored P(Intent) ─▶ surface top-EIG question(s), ≤3 ─▶ user answers / asks "what is X?" ─▶ intent sharpens ─▶ loop
  OFF ─▶ pick constraint-legal, convention-best IR ─▶ build
   ▼ (both converge; HARD clamps + constraints inviolable in BOTH routes)
emit Cmajor ─▶ compile ─▶ RELOAD BRIDGE (§6) ─▶ play
   ▼
sediment: references + revision + (confirmed) conventions/constraints ─▶ L0/L2 (the fossil grows)
```

- **Route 1 (ON, premium):** spec-first; salience-gated pre-build questions; the "what is aliasing?" question routes into a teaching sub-dialogue and back into the loop with sharpened intent (the enactive mechanism), writing a convention.
- **Route 2 (OFF, DEFAULT):** predict-and-build; the user hears the artifact and asks backward; the user is their own salience filter.
- **Safety in both routes:** hard clamps (zero-delay feedback, schedule ambiguity, non-terminating/unbounded code, invalid endpoint/rate with no conversion) and **user-constraint violations** are never bypassable; Route 2 may skip *aliasing* questions, never hard clamps or constraint violations.
- **Canaries:** (1) clean-mastering fossil + aliasing → Route 1 asks; (2) lo-fi fossil + same aliasing → suppresses/reframes as grit; (3) zero-delay feedback → both routes refuse-by-construction + offer nearest buildable; (4) simple insertion → reload with crossfade, no irrelevant questions; (5) **held-out consequence type** + two fossils → different salience (the §5.6 gate).
- The 15-phase ecological skill maps onto Route 1 but is **cheap** because the scales are tiny (R3 Flash-Fill insight): affordance-analysis = S2; failure-mode-analysis = consequence detection + S6; perturbation-tests = the closure attacks.

---

## 8. Architecture at a glance

```
                         ┌──────────────────────── piNen harness (the permanent center) ───────────────────────┐
   user intent / gesture │  /sde shape (Route 1/2) ─ salience engine (S1–S6 over factored P(Intent))            │
        ───────────────▶ │        │                          ▲                                                   │
                         │        │ prune(constraint) bias(convention)                                          │
                         │        ▼                          │ surprise prior = L2 compiled to posteriors        │
                         │  Convention-biased planner ─▶ Coherent Patch IR (TOTAL CONSTRUCTORS) ─▶ Emitter       │
                         │        │                                                                  │           │
                         │  Intent substrate {reference(+identity), revision, convention, constraint}│           │
                         │  L0 typed transactional store · L1 Engram/Graphify index · L3 distribution│           │
                         └────────┼──────────────────────────────────────────────────────────────────┼──────────┘
                                  │ identity diff / endpoint verification (two-source seam)           │ Cmajor source
                                  ▼                                                                    ▼
                         RELOAD BRIDGE (Engine/Performer level; 3 tiers)  ◀───────────  Cmajor compiler (braces)
                                  │                                                                    │
                                  ▼                                                                    ▼
                         Performer A ║ Performer B  (crossfade / parallel-send tail)            multi-boundary amplitude/NaN net
                                  ▼
                                 DAC
```

---

## 9. Phased roadmap — front-loading the plan-falsifiers behind numeric gates

Principle (both critiques): the two unknowns that can *falsify the plan* — the **reload bridge** (engine) and **salience calibration** (product) — are pulled as early as their dependencies allow, in **parallel**, on **paper/mock before the heavy build**, each behind a **loud binary gate with numbers**. Phase 0 ratifies only *hypotheses + attack plans*, never constitutionalizes a thin claim (C1-A13).

### Phase 0 — Provisional constitution, dual-domain closure ATTACK, Go/No-Go (no engine code)
- **Objective:** ratify *provisional hypotheses and attack plans* — not a constitution (C1-A13).
- **Work:**
  - **Run a fresh §6.1 attack on BOTH domains** with artifacts *not* in R1/R4: signal — the relational loudness/LUFS artifact (§1.1); intent — the project-scoped-commitment artifact (§1.2) + cross-user authority + provenance/rationale + collaborative-edit (§1.3). Output per artifact: *reduces (with mapping)* or *breaks (named primitive)*.
  - Draft the constitution in **hypothesis** language: "closure hypothesis relative to corpus X, enforced by total constructors, falsifiable by Y; intent scale [THIN], `authority` open" (§2).
  - Non-technical gates: **(a)** Donald confirms regenerate-and-reload vision (topology = edit, not performance gesture — §6.4); **(b)** legal read of Cmajor EULA §7.1 at-will termination + Pro-tier pricing; GPLv3 fallback acceptable for prototype.
- **Decision gate G0 (binary):** *Vision is regenerate-and-reload AND Cmajor dependency acceptable for prototype AND the dual-domain attack produced no un-handled breaking artifact?* No → re-scope engine / re-open primitive set before spending. Yes → proceed (intent scale carried as **hypothesis**, gated again at G4/G5).
- **Risk:** the vision secretly needs continuous morphing → whole engine bet wrong. Mitigated by asking first.

### Phase 1 — TWO PARALLEL DE-RISK TRACKS (the falsifier-first phase)

**Track 1A — Engine spike + Reload-Bridge measurement (riskiest engine unknown).**
- piNen generates a trivial Cmajor patch; loads via C++/JS API (R2); drives a parameter live (prove parameter-class no-reload path); regenerates a topology change and measures.
- Build the **Engine/Performer-level** reload bridge prototype (§6.1 Tier 1) — enumerate and implement the re-implemented Patch-level features. Test on **(a) percussive, (b) sustained pad + long reverb tail, (c) one real stateful module** (delay buffer / filter state / LFO phase — C1-A6: parameter preservation is not enough).
- Exercise **C++ export** here (not Phase 7 — C1-A10/C2-A5): prove a generated module compiles dependency-free outside Cmajor.
- **Gate G1A (binary, numeric):** *Native compile+swap gap ≤ 30 ms for a ~20-processor graph AND dual-graph overlap does NOT xrun on a representative heavy patch (≥40% single-core) at 128-sample buffer @ 48 kHz AND the crossfade passes ABX on sustained material (≥1 trained ear, recorded artifacts) AND C++ export builds standalone?* No → accept reload only at silence boundaries (degrades malleability image) or reconsider engine. Yes → §5d "not a compromise" earned for the covered edit classes.
- **Strike "JIT is fast" as an assumption** — it is a Phase-1 measurement (C2-A6).

**Track 1B — Salience spike, Wizard-of-Oz, NO DSP engine (riskiest product unknown).**
- Mocked consequence detectors + synthetic fossil histories (grit-user, clean-user) + recorded audio examples + Wizard-of-Oz dialogue.
- Implement the §5.3 factored distribution + §5.6 salience math on the mock. Run the **held-out-consequence discrimination test** (§5.6) with N≥8 musicians.
- **Gate G1B (binary, numeric — gates the entire Phase 4–6 build):** *On a held-out consequence type with no rule added, does the same mechanism produce ≥40-percentage-point surfacing-rate difference between the two fossil histories (p<0.05), while a tuned generic-linter baseline shows no such difference; and do negative controls abstain?* No → the dialogic claim is **provisionally falsified**; either redesign the intent representation or **descope to a Route-2 DAW** before investing in Phases 4–6. Yes → salience is worth building; θ_surprise gets a first empirical value.
- Rationale (C1-A11, C2-A5): the central, most-likely-to-fail-quietly risk needs **no working DSP** to test; testing it last would burn months. Salience is a **continuous track**, not a Phase-5 feature.

### Phase 2 — Coherent Patch IR + total constructors + multi-boundary amplitude net
- **Objective:** make incoherent signal patches *unrepresentable*; make the amplitude residual unbypassable.
- **Work:** implement total constructors (causality via `closeFeedbackLoop(delay:PositiveNat)` with incremental cycle-checking; schedule-collision-via-mandatory-bus; reverse-as-forward-buffer-read). Implement the emitter IR→Cmajor. Implement the **multi-boundary** amplitude/NaN net (§4.2) at every state boundary. Establish the **non-bypass invariant** (§2 obligation 3): no artifact reaches Cmajor except through IR constructors. Adversarial fuzz.
- **Gate G2 (binary):** *Is a zero-delay cycle / ambiguous schedule overlap **unrepresentable** in the IR (not merely caught) — verified by attempting to construct one and finding no constructor exists — AND does the amplitude net flush a deliberately-unstable IIR to defined output at every boundary (feedback, send, sidechain, bounce, DAC) — AND is there no raw escape hatch?* (Milestone language: "unrepresentable," not "caught before Cmajor" — C2-A1.)
- **Risk:** amplitude leaks past the net at a boundary we forgot → the containment story breaks. Net coverage is itself fuzzed.

### Phase 3 — Cmajor emitter + module palette + manifests + admission gate
- **Objective:** §10 interaction model — four-port modules, signal-as-control unification, three-sources-one-mechanism, agent-authored modules, rate-as-enacted-constraint.
- **Work:** palette over Cmajor std lib (oscillators, filters, envelopes, `std::voices::VoiceAllocator` for polyphony — not a primitive, R4). Patching UI as a piNen arrangement-layer projection (R4). **Semantic manifests per module** (§5.5). **Agent-authoring** via the emit→gate→reload path, entering at **experimental**, promoted via the **defined admission gate** (impulse/sweep/param-range/NaN/denormal/adversarial vectors — C1-A14). Static rate-mismatch detection feeds salience (§10e).
- **Gate G3 (binary):** *Does agent-authoring reduce to the existing emit→gate→reload path with no special-case machinery (R4 predicts yes), and does every palette module carry a manifest sufficient to answer "why"/"what does this do" (C1-A9)?*
- **Risk:** introspection thinner than R2 claims for complex graphs → piNen's owned IR model must stay consistent with the compiled program (two-source seam; mismatch blocks reload).

### Phase 4 — Typed transactional arrangement store + intent scale + identity
- **Objective:** build the intent substrate {reference(+identity), revision, convention, constraint} on a **real transactional store** (§5.1).
- **Work:** L0 typed event-sourced store (ACID, snapshots, referential integrity, migration, recovery). Immutable **references** with logical identity + preservation rules (§5.4). **Revision** tree + consistency clamp (acyclic, reversible). **Convention** with contradiction-resolver (context-tagged, evidence-weighted, time-decayed). **Constraint** with scope/precedence/revocation + the **constraint-precedence solver** (§4.4). Engram/Graphify demoted to index/summary (C1-A15). L3 derived distribution recomputed each session.
- **Gate G4 (binary):** *Does a convention learned in session N demonstrably change session N+1's generated patch, transparently (user asks "why saturation there?" and gets the convention + evidence back) — AND does a user-`constraint` ("preserve the intro aliasing") survive regeneration and block a contradicting edit — AND does identity survive regeneration so "the same delay" is addressable across reload?* No → personal-dialect and/or constraint mechanism unrealized.
- **Risk:** harness complexity (R1 Open Risk #2) under-built into "we store preferences." Guard: every feature must be a reference/revision/convention/constraint or it doesn't ship (closure discipline).

### Phase 5 — Salience engine (real) + spec-driven-ecological shape (the heart; central gate)
- **Objective:** make Route 1 *discovery, not interrogation*, on the real engine with real fossils.
- **Work:** implement the §7 shape (substrate sibling, `/sde` toggle, Route 2 default). Implement salience over the **factored distribution** (§5.3/§5.6) — S6 first (safety + constraint overrides), then full S1–S5. Cold-start guard, turn budget, enforced VoI (§5.7). Re-run the §5.6 held-out gate with real artifacts; tune θ_surprise from real data.
- **Gate G5 (binary, the project's central gate):** *On the real engine, with real fossils, does the held-out-consequence discrimination hold (§5.6 numbers), do musicians experience Route 1 as discovery (pre-registered: false-positive interruption rate, post-hoc "wish warned" precision/recall beating the linter baseline by the registered margin, opt-out rate, time-to-flow-disruption), AND does it beat Route-2-plus-reactive-dialogue?* No → **the dialogic claim is falsified; ship the Route-2 DAW (still valuable) and demote Route 1 to experimental.** Yes → SSI's defining ambition is empirically realized.
- **Risk [THIN]:** θ_surprise/relevance/"feels like discovery" are study-only — the gate is loud and binary precisely because this is where the project most likely fails quietly.

### Phase 6 — First real instrument, end-to-end
- **Objective:** harness builds one non-trivial user-shaped DAW config (tracker-style OR modular-style) end-to-end, fossil accumulating across a multi-session arc, biasing regeneration.
- **Gate G6 (integrative):** *Recognizably SSI — a malleable instrument grown around a permanent harness — not a scriptable DSP host? Coherence never breaks; reloads inaudible (covered classes) or honestly bounded; dialect visibly shapes generation; both routes sharpen intent; the harness is visibly at the center (not a code generator that exits)?*

### Phase 7 — Hardening, export insurance, dependency de-risk, amendment process
- **Objective:** durability against the engine bet + governance.
- **Work:** exercise C++ export continuously (R2/R4 strongest mitigation; already proven in Phase 1). Resolve commercial license if commercializing. Crash/panic recovery, project-format versioning, fossil-memory privacy policy, red-team report. **Document the constitutional amendment process** for adding a primitive to either scale (proposed → verified → reload → usable).
- **Gate G7:** *If Cmajor died tomorrow, what survives?* Required answer: all DSP algorithms (exported C++) + the entire intent substrate; lost only the JIT malleable loop until re-hosted. Worse → export not exercised enough.
- **Named residual:** export preserves *algorithms*, not the *malleable loop* (R4). Lock-in of malleability, not DSP, is the residual.

### Dependency graph
```
Phase 0 (provisional constitution + dual-domain attack + G0)
   ├─▶ Phase 1A (engine + reload bridge, G1A) ─┐   FALSIFIER-FIRST (engine)
   └─▶ Phase 1B (salience WoZ + held-out, G1B) ┤   FALSIFIER-FIRST (product) — both gate the build
                                               ▼
                              Phase 2 (Coherent IR + total constructors + amplitude net, G2)
                                     └─▶ Phase 3 (palette + manifests + admission gate, G3)
                                            └─▶ Phase 4 (typed store + intent scale + identity, G4)
                                                   └─▶ Phase 5 (real salience + /sde shape, G5 ★central)
                                                          └─▶ Phase 6 (first instrument, G6)
                                                                 └─▶ Phase 7 (hardening + export + amendment, G7)
```

---

## 10. Residual risks & how to falsify them (concrete, numeric/procedural)

Every falsifier gets a number or a named procedure (C1-A12, C2-A7). Any one firing forces re-architecture, not a patch.

1. **Intent-scale closure fails.** *Procedure:* the Phase-0 dual-domain attack corpus (project-commitment ✓ handled by `constraint`; identity ✓ by reference field; collaborative-edit; provenance/rationale; **cross-user authority** = nominated breaker). *Fires if:* an artifact is neither reference/revision/convention/constraint nor a composition, AND not handled by the named `authority` extension. **[Most under-tested claim; gated at G0/G4, not constitutionalized.]**
2. **`authority` is a real fifth intent primitive.** *Fires if:* multi-user equal-precedence constraint conflict cannot be resolved without an ownership/authority notion. *Then:* intent scale = 5 primitives; v1 stays single-user (does not block v1).
3. **§3c not actually closed by construction.** *Procedure:* attempt to construct a zero-delay cycle / ambiguous overlap in the IR (G2). *Fires if:* any constructor admits it (then it's validate-reject, not by-construction — the SSI claim is false).
4. **Amplitude leaks past the multi-boundary net.** *Fires if:* a clamp-legal patch produces audible inf/NaN/runaway at any boundary the net doesn't cover. *Then:* containment story broken at the one statically-undecidable property.
5. **Reload bridge can't mask the seam / xruns.** *Procedure:* G1A numbers (≤30 ms gap; no xrun at 128-buf/48 kHz on ≥40%-core patch; ABX on sustained pad). *Fires if:* dry-path crossfade audibly artifacts on sustained material OR dual-graph overlap xruns OR in-series-tail truncation proves artistically unacceptable for the target use. *Then:* malleability downgraded to silence-boundary reload; §5d "not a compromise" falsified for that class.
6. **Parameter-class avoidance covers too little.** *Procedure:* Phase-3+ telemetry: fraction of edits handled as parameter-class. *Fires if:* the fraction is low AND reloads are common AND Tier-1 can't mask them → reloads dominate the experience.
7. **Salience can't be calibrated into discovery (the central one).** *Procedure:* the held-out-consequence, two-fossil-history discrimination test (≥40 pp, p<0.05, beats linter baseline) at G1B (mock) and G5 (real); pre-registered precision/recall, FP-interruption rate, opt-out, flow-disruption. *Fires if:* the held-out discrimination fails after calibration OR a tuned linter matches it OR musicians experience it as a checklist. *Then:* dialogic claim dead; ship Route-2 DAW; Route 1 experimental.
8. **Convention can't bias regeneration transparently.** *Procedure:* G4 two-session demo (same intent → different dialect-shaped patches for two fossils; "why" answered from L2). *Fires if:* it's recall not plan-time biasing, or biasing is opaque.
9. **piNen's IR model diverges from the compiled program.** *Procedure:* endpoint-verification check at every reload; identity-binding check. *Fires if:* a generator-bug class makes piNen "talk about" a patch that isn't playing → reflexivity premise unsafe; dialogue built on a model that can lie.
10. **Module manifests are insufficient for honest dialogue.** *Fires if:* the agent confidently describes a module's spectral/nonlinear behavior that the manifest didn't actually capture (C1-A9) → manifest schema under-powered; "can answer why" gate was too weak.
11. **The vision was continuous morphing all along.** *Procedure:* G0 asks explicitly. *Fires if:* in use, Donald wants to reshape the *running* graph as a performance gesture → Cmajor wrong (R2/R4: dynamic routing roadmap-only); restart engine selection.
12. **Cmajor dies and export can't preserve malleability.** *Procedure:* G7. *Fires if:* the answer to "what survives?" is worse than "algorithms + intent substrate." Mitigated (early/continuous export), not eliminated; named residual.

---

## 11. Critique resolution table

Every must-fix from C1 (vs S1) and C2 (vs S2): **incorporated** / **incorporated-modified** / **rejected** + rationale.

| # | Critique must-fix | Disposition | Where / rationale |
|---|---|---|---|
| **C1-1** | Run adversarial intent-scale closure pass before ratifying; don't constitutionalize {reference,revision,convention} | **Incorporated** | §1.3 runs it; §9 Phase 0 attack corpus; ratified only as hypothesis (G0), re-gated G4/G5 |
| **C1-2** | Add stable identity (primitive or reference field) + preservation rules | **Incorporated-modified** | §1.2/§5.4: folded into `reference` as required field (not a separate primitive) — avoids count inflation; identity is reference's defining attribute; preservation rules for split/merge/replace/delete/clone/unlink/bounce + endpoint verification |
| **C1-3** | Replace "promise closure outright" with three precise proof obligations + no-escape-hatch | **Incorporated** | §2: expressibility / coherence-by-construction / implementation-non-bypass; closure relative to named corpus, falsifiable |
| **C1-4** | §3c boundedness not by-construction; guard beyond DAC; module contracts; stop calling crash-mat "by construction" | **Incorporated** | §4.2: amplitude is statically undecidable → runtime *containment* net at ALL state boundaries, explicitly NOT labeled by-construction; §5.5 module manifests |
| **C1-5** | Time-monotonicity ≠ summing buses; cover tempo/warp/anchoring conflicts | **Incorporated** | §4.1/§4.4: summing bus resolves audio-output collisions; the **constraint-precedence solver** resolves timebase conflicts with anchoring modes |
| **C1-6** | Cmajor stored-state overclaimed as DSP migration | **Incorporated** | §6.1 residual: storedState is key-value on Patch, NOT internal processor state; only explicit-serialization modules migrate; truncation named elsewhere |
| **C1-7** | Reload Bridge requirements + ABX + worst cases + thresholds | **Incorporated** | §6.1 Tier 1 enumerates dual-engine ownership, MIDI/transport replay, latency comp, param continuation; §6.2/§9 G1A: ABX + numeric CPU/xrun/gap thresholds |
| **C1-8** | Dormant-graph strategy smuggles dynamic topology via bloat | **Incorporated-modified** | §6.1 Tier 0: kept as a *bounded, measured optimization* with max-dormant policy + CPU/latency budget + parameter-class-fraction telemetry — not a seam-hiding panacea. (Not rejected: it genuinely removes the gap for many edits; bounded.) |
| **C1-9** | Reflexivity overgeneralized; require semantic module manifest + consistency checks | **Incorporated** | §5.5/§6.5: per-module semantic manifest; "can answer why" is part of the gate; two-source seam consistency check |
| **C1-10** | Salience MVP is a linter; separate detection from initiation; negative controls; held-out; pre-registered metrics; serious baseline | **Incorporated** | §5.6: detection (linter-fine) separated from initiation (audited); held-out-consequence gate; negative controls; pre-registered metrics; non-straw linter baseline |
| **C1-11** | Move salience validation to Phase 0/1 in parallel | **Incorporated** | §9 Phase 1B WoZ salience spike, parallel to 1A, gating the build |
| **C1-12** | Falsifiers too weak/late; predefine corpora + metrics; move export early; independent verifier | **Incorporated** | §10 numeric/procedural falsifiers; §9 export in Phase 1; gates are binary with thresholds |
| **C1-13** | Phase 0 smuggles research into governance | **Incorporated** | §9 Phase 0 ratifies hypotheses + attack plans only; constitution uses "hypothesis/evidence-required/amendment" language |
| **C1-14** | Agent-authored module gate undefined; admission levels + stress tests | **Incorporated** | §5.5: experimental/guarded/certified + impulse/sweep/param-range/NaN/denormal/adversarial vectors |
| **C1-15** | Engram/Graphify under-specified as substrate; need typed transactional store | **Incorporated** | §5.1: dedicated typed transactional L0 store of record; Engram/Graphify demoted to index/summary |
| **C2-1** | Close §3c by construction, not validation; total smart constructors; "unrepresentable" milestone | **Incorporated** | §4.1: `closeFeedbackLoop(delay:PositiveNat)`, mandatory-bus schedule target, incremental cycle-checking; verifier/compiler are belt-and-braces; G2 milestone = "unrepresentable" |
| **C2-2** | Salience schema/representation mismatch; commit probabilistic OR drop KL/EIG vocab; held-out falsifier as gate | **Incorporated (horn a); cost-premise rejected** | §5.3: factored per-axis Beta/Dirichlet → closed-form KL/EIG, genuinely computable; **reject** the premise that probabilistic ⇒ expensive 100-dim network (tiny domain ⇒ ~9 factored axes); §5.6 held-out gate (G1B/G5) |
| **C2-3** | Actually run §6.1; intent domain needs own closure analysis; resolve "metadata vs product center" | **Incorporated** | §1.1 fresh signal artifact; §1.2/§1.3 fresh intent attack + own primitive scale; the contradiction resolved — intent is a *first-class second domain*, not metadata |
| **C2-4** | Reload bridge vs R2 API; Engine/Performer level; crossfade vs tail-bridge separation; in-series truncation; CPU-xrun falsifier | **Incorporated** | §6.1 Engine-level + enumerated reimplemented features; Tier 1 crossfade (gap) vs Tier 2 parallel-send-only tail bridge; in-series truncation named; §6.2 xrun falsifier with numbers |
| **C2-5** | Conditional Cmajor commitment + early salience de-risk | **Incorporated** | §9 Phase 0 = candidate + kill criteria; commitment contingent on G1A; Phase 1B early salience gating Phase 4–6 |
| **C2-6** | Strike "JIT is fast"; move LFO phase to "cannot migrate v1" | **Incorporated** | §9 Phase 1A measures compile time; §6.1 LFO/oscillator phase in "cannot migrate v1" column |
| **C2-7** | Numeric thresholds / procedures on all falsifiers | **Incorporated** | §9 gates + §10 falsifiers all numeric or named-procedure |
| **C2-8** | Anti-clippy rules are aspirations; bind to computation or relabel | **Incorporated** | §5.7: Route-2-default (structural), turn-budget hard cap, cold-start gate, enforced VoI (EVSI=0 ⇒ no question) — each bound to a computation; remaining heuristics relabeled |

**Net:** of 23 must-fixes, 21 incorporated, 2 incorporated-with-modification (C1-2 identity-as-field, C1-8 dormant-as-bounded-optimization), and 1 explicit premise-rejection within an otherwise-incorporated fix (C2-2's "probabilistic ⇒ expensive"). No must-fix is rejected outright; the two modifications and one premise-rejection are justified above.

---

## 12. The plan in one breath

Do SSI **twice**. Build a **signal substrate** {buffer, transform(poly), schedule, routing} whose incoherence (zero-delay feedback, ambiguous overlap) is **unrepresentable** in a Coherent Patch IR via total constructors — Cmajor's compiler is the belt-and-braces witness, and the single statically-undecidable property, amplitude/NaN, is contained (not constructed) by a mandatory multi-boundary runtime net. Build an **intent substrate** {reference(+identity), revision, convention, constraint} on a real transactional store, where constraints *prune* and conventions *rank* inside the coherence envelope, and the fossil record compiles into a **small factored distribution** over style axes so that **Bayesian surprise and EIG are genuinely computable and genuinely personal** — the one thing that makes the dialogue SSI and not a linter, provable by a held-out-consequence test a tuned linter structurally cannot pass. Make malleability **regenerate-and-reload**: free for parameter-class edits, masked on the dry path by an Engine-level crossfade, honestly truncating for in-series tails in v1. Wrap it in a toggleable **spec-driven-ecological shape**, Route-2-by-default, Route-1 salience-gated and conservative. Then **test the two things that can kill it first, in parallel, on paper** — the reload bridge (G1A, numeric) and the salience discrimination (G1B, held-out) — and gate the whole build on them. You will either have built the instrument the handoff imagined, or learned cheaply and exactly why it cannot be built — which is the only honest definition of success for a project this ambitious.

---

*End of S3 merged synthesis.*
