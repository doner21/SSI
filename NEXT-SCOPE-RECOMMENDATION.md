# SSI DAW — Next Scope of Work (post-G1B recommendation)

**Author:** Orchestrator / architect-judgment seat. **Status:** recommendation; Donald decides.
**Context:** G1B falsified the salience-distinctive thesis (computed EIG/VoI belief-shift) → descope (Decision #5: A1/A2 pending). The other falsifier (G1A reload bridge) is still untested.

---

## 1. The strategic reframe (read this first)

The original thesis was a **tripod**:
1. **Coherence by construction** (Coherent IR; incoherence unrepresentable; Cmajor compiler as witness) — untested, gated at G2/G3.
2. **Malleable regenerate-and-reload** (Engine-level crossfade between two live Performers) — untested, gated at **G1A**.
3. **Salience-dialogic instrument** (computed belief-shift questions) — **FALSIFIED at G1B.**

One leg is gone. The honest first question is therefore strategic, not tactical:

> **Is "a coherent-by-construction, malleably-reloadable DAW over Cmajor" — with at most heuristic 'smart warnings,' no belief-shift dialogue — still a product you want to build?**

My answer: **yes, conditionally.** Legs 1 and 2 are still genuinely differentiated (most DAWs cannot guarantee patch coherence; regenerate-and-reload malleability is novel). But two things are now true that weren't before:
- The remaining moat leans **almost entirely on Cmajor** — it's both the coherence-witness AND the reload bridge. Cmajor risk is now close to a **single point of failure** for the whole product.
- The two surviving pillars are **both still unproven.** Until G1A and G2/G3 clear, the product thesis is unvalidated. So we stay in **falsifier-first mode** — we do NOT start heavy build.

If the salience dialogue was, in your head, *the* reason to build SSI, then the right move is a bigger rethink, not G1A. If coherence + malleability are reason enough, proceed below.

---

## 2. Recommended next falsifier: **G1A (reload-bridge concurrency)**

It was always meant to run in parallel with G1B; it's now the cheapest test of the **most load-bearing surviving claim** (malleable reload). First-pass question (narrow, per plan §1.3): *can two live Engine/Performer instances be owned, advanced, fed, and mixed concurrently in the target host at all?* Event-replay/transport-sync/latency-comp are explicitly later passes. **If only offline dual-render works → silence-boundary fallback, and "not a compromise" is retracted.**

**G1A is blocked on a decision only you can make → see §3.**

---

## 3. The blocker that now dominates the critical path: **Decision #2 (Cmajor)**

Because the surviving moat concentrates risk on Cmajor, **Decision #2 is no longer Phase-0 housekeeping — it's the gate on everything.** It has two parts:
- **Host/target** for G1A: JUCE plugin host? `cmaj` standalone runtime? a bespoke C++ harness? This determines whether the concurrency spike is even buildable, and how.
- **Commercial/license read:** Cmajor's commercial-agreement termination terms + Pro-tier quote. If termination is at-will with no commercial-grade protection and GPLv3 is unacceptable for the business model, the entire remaining product sits on a dependency that can vanish — worth knowing *before* G1A spend, not after.

I can do the **research groundwork** now (license terms, Pro-tier, viable host-integration paths) and hand you a decision brief. The **commercial commitment itself is yours.**

---

## 4. Concrete next scope, prioritized

**A. Needs you (unblocks the critical path):**
1. **Decision #5 sub-pick:** A1 (heuristic Route 1) or A2 (Route-2-only). Low effort either way.
2. **Decision #2 inputs:** name the G1A host/target; authorize me to produce the Cmajor license/commercial decision brief.

**B. Runnable now, cheap, in parallel (I can drive as orchestrator):**
3. **Cmajor license + host-viability research dossier** (route to a researcher seat; grounds Decision #2). *No commitment — just facts.*
4. **G0 — actor-lattice scope check** (paper-only): confirm every v1 corpus artifact resolves under the single-authority lattice; narrow plan language to "directional." Closes the §3.3 / G0 item cheaply.
5. **Cmajor grounding dossier** (V4-Flash seat): real API/syntax facts the eventual IR/authoring seats will need, so nothing is emitted from parametric memory.
6. **Implement the G1B descope** once you pick A1/A2 (cheap), and **lift the investment-freeze** for the Route-1-independent engine/signal stack.

**C. Gated behind G1A (do NOT start until it clears):**
7. Phase 2 — Coherent IR: full-dep-graph total constructors, param-as-constructor, amplitude/NaN containment net (G2).
8. Phase 3 — palette over Cmajor std lib + per-module semantic manifests + manifest-truth tests (G3).

---

## 5. What G1B's result lets us CUT or DEFER (scope reduction = the upside of a falsification)

- **CUT from v1 heavy build:** the Phase-5 real salience engine, the EIG/VoI computation, Route-1 dialogic machinery, the belief-shift "central gate" G5. The factored intent distribution's *salience* role is gone.
- **KEEP (cheaply):** the fossil/intent store (L0/L2) **only** for **regeneration biasing** (personal-dialect priors on what to build), not for salience dialogue. This is still valuable and far cheaper than the salience stack.
- **Re-center the gates:** the project's central gate is no longer G5 (salience). It becomes **G1A (reload)** then **G2/G3 (coherence-by-construction)**. That's where the surviving moat lives and must be proven.

---

## 6. The one-line recommendation

**Proceed — but stay in falsifier-first mode and attack G1A next.** To start, I need from you: (a) **A1 or A2**, and (b) the **G1A host/target** (or: authorize me to produce the Cmajor decision brief first so you can choose the host with the licensing facts in hand). Everything in §4.B I can begin immediately without further input.
