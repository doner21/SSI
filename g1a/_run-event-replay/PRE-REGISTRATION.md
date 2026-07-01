# G1A EVENT-REPLAY Falsifier — PRE-REGISTRATION (LOCKED)

**Track:** SSI DAW — Track 1A event-replay spike (event-reactive patches with deterministic replay across reload boundary). Bespoke real-time C++ audio host over the Cmajor native C++ API.
**Phase:** PRE-REGISTRATION LOCK. This document is written **before any spike result exists**. No spike is run, no C++ is shipped, no measured number appears in this document. Every numeric threshold below is a **pre-committed prediction / requirement**, not a measurement.
**Source of truth (verified API reality):** `C:/Users/doner/SSI/g1a/_run-reload/RELOAD-GROUNDING.md` (no async/Patch build API; atomic swap = `std::atomic<uint32_t>` active-index into a 2-element `cmaj::Performer` array; safe release after `activeIndex.store` + RT acquire-load shows RT no longer touches old; render loop: `setBlockSize→setInputFrames→advance→copyOutputFrames`). **Input endpoint API reality** grounded in `C:/Users/doner/SSI/research-dossier-cmajor-input-api.md` (§3 `setInputValue` for latching `input value float` endpoints driven per-block with optional ramp; §5: endpoint handles obtained after `load`/before `link` are valid for all performers created from that engine; §8 Strategy A: single engine, two performers, shared handles). Toolchain/SDK reality inherited from `C:/Users/doner/SSI/g1a/_run/SDK-GROUNDING.md` and `C:/Users/doner/SSI/g1a/_run/SMOKE-TEST-REPORT.md`.
**Decisions already made (NOT relitigated here):**
- **D-A DECIDED: `input value float freq`** — the simplest event model (dossier §3). Frequency changes via `Performer::setInputValue(freqHandle, newFreq, 0)` per-block. No MIDI, no `input event`, no `input stream` for frequency — those are later passes (§10).
- **D-B DECIDED: single engine, two performers** — both from the same `cmaj::Engine::createPerformer()` so handles are shared (dossier §5, §8 Strategy A). No two-engine complexity.
- **D-C DECIDED: deterministic event schedule from SEED** — a schedule of frequency-change events at specific block offsets is pre-computed from the master seed. No runtime "capture" needed — events are generated deterministically.
- **D-D DECIDED: reset + replay** — after atomic-index swap to performer B, call `performerB.reset()` (clears state), then replay the same event schedule from the swap point onward.
- **D-E DECIDED: single reload event** — one A→B swap, `N = 10,000` blocks, `R = 5` seeded repeats.
- **Concurrency + the swap/crossfade/safe-release mechanism are PROVEN** by the prior reload-bridge pass (FINAL PASS, `_run-reload/PRE-REGISTRATION.md`). They are inherited as-is and are **not relitigated here**. The reload-bridge pass proved: two performers can be owned/advanced/mixed concurrently, background-compiled (two-engine pattern), atomically swapped, and safely released with ASan-clean bit-exact output. This pass builds **on top of** that result.
- **The novel load-bearing claim here is event-replay fidelity across the reset boundary.** The prior pass used self-oscillating sines (no input endpoints) — it proved the swap/crossfade/release mechanism. This pass replaces those with event-responsive patches (`input value float freq`) and tests whether events can be replayed onto a fresh performer after reset, producing bit-identical output.

**Claim labels used throughout:**
- **[ARCH]** — an architectural commitment of the spike (how the host is built / what is measured).
- **[SPIKE]** — a claim whose evidentiary standard is **pilot/spike-grade Windows-only** evidence; the heavier standard (true data-race certification) is a **separate later Linux/TSan pass** (§10), not this run.
- **[GATE]** — a binary, decision-forcing pass/fail criterion that this pre-registration locks.

**The structural shift vs the reload pass (grounded, not re-tested):**
- **(i) Single engine, shared handles.** The dossier (§5) confirms: "Handles are valid for all performers created from that engine" and (§8 Strategy A) "Create Performer A = E.createPerformer(); Create Performer B = E.createPerformer() — since both performers come from the same engine, the handles are valid." This replaces the prior pass's two-engine pattern. The engine is `create→parse→load→getEndpointHandle→link` on the main thread **once**; `createPerformer()` is called for A (main thread) and B (worker thread) from the same engine. The invariant: **engine accessed by exactly one thread at a time** — main finishes all engine operations before any other thread touches it; worker calls `createPerformer(B)` solo; RT thread never touches the engine at all.
- **(ii) Event-reactive patch.** `FreqSine` with `input value float freq` (dossier §3, §4 Option A), driven per-block via `setInputValue(freqHandle, v, 0)`. The host uses a **true event model** — `setInputValue` is called **only on scheduled change blocks**, never idempotently re-stated every block. This is load-bearing: if the latch were re-stated every block, event *loss* at the boundary would be structurally impossible and the spike could not fail on the exact failure mode the task asks about.

**Integrity crux (non-negotiable, applies to every section):** It must be **structurally possible for this spike to FAIL.** The metrics below are constructed so that real defects (a dropped event at the swap boundary, an omitted latch-replay after reset, a race on the atomic handoff, an event delivered to A but not B during crossfade, `reset()` overrunning the RT block budget) produce real failures, not so that the spike is guaranteed to pass. Concrete failure paths each metric catches are enumerated in §2.4. A specification under which the spike **cannot** fail is a falsifier-defeating fraud and is explicitly out of bounds. See §2.

---

## 1. Hypotheses

### 1.1 Primary hypothesis H1 (the event-replay claim) [GATE][SPIKE]

> **H1 (directional).** Frequency-change events (via `setInputValue`) delivered to live performer **A** (a `FreqSine` with `input value float freq`, already advancing on the RT thread) within a deterministic event schedule can — after an atomic `activeIndex` swap to performer **B** (from the same engine, prepared off-RT, latched to `stateAt(K_XFADE_START)` before its first crossfade advance), `B.reset()`, and re-latching B to `stateAt(K_SWAP)` before its first post-swap advance — be replayed onto B from the swap point onward, producing **bit-identical** post-swap output to a single-performer reference render that models the identical reset-and-replay, with **no event loss**, **no click beyond the deterministic-reset discontinuity** (which is verified by bit-exact-vs-reference), and **bit-exact determinism** across `R = 5` seeded repeats — for a locked total of `N = 10,000` blocks of `256` frames at `48,000` Hz.

The directional prediction is: *event-replay across the reload boundary (frequency-change events, deterministic schedule, reset-and-re-latch) is feasible AT ALL on this Windows host, to the locked tolerances of §5.*

### 1.2 Explicit FALSIFICATION condition (what would refute H1) [GATE]

> **H1 is FALSIFIED** if **any** of the following occurs under the locked run (§4–§5): (a) performer A suffers **one or more xruns during the off-RT prepare window**, or events to A are **not delivered correctly during the prepare window**, or `createPerformer(B)` returns a non-`Ok` result, or B is **not ready before the locked crossfade-start block** (**R1 fails**); or (b) the RT thread suffers a **torn read, use-after-free, or any ASan/CRT violation** on the atomic swap, or the **old performer is released before the crossfade completes**, or the swap does **not** occur at the locked block index, or `reset()` is **not called on B** after swap and before B's first post-swap advance, or `reset()` **overruns the block budget** at `K_SWAP` (**R2 fails**); or (c) B's post-swap output is **not bit-identical to the reference**, or the event-presence check **fails** (expected frequency not present / wrong frequency present / wrong amplitude), or an **audible discontinuity** occurs in pure regions or the crossfade interior (**R3 fails**); or (d) the rendered output is **not bit-identical across the `R = 5` seeded repeats**, or the total blocks rendered ≠ `N`, or the swap block ≠ the locked index, or any block is **dropped or duplicated across the boundary**, or the event-application audit **shows a mismatch** between scheduled events and applied events (**R4 fails**).

A single failing metric ⇒ **FINAL FAIL** ⇒ the pre-declared fallback (§8) fires verbatim. There is no partial pass.

### 1.3 What is explicitly NOT claimed by this pass [SPIKE]

- This pass does **not** claim a certified **absence of data races**. TSan does not exist on Windows under MSVC or clang-cl (SDK-GROUNDING §6.2; SMOKE-TEST §7; RELOAD-GROUNDING §7.3). The Windows-feasible correctness strategy here is **ASan-clean + deterministic seeded adversarial-interleaving stress with a bit-reproducibility invariant + a static no-unsynchronized-shared-mutable-state audit on the swap/release path** (§3). A **full TSan certification of the swap/release path is pre-declared as a SEPARATE LATER Linux pass and is OUT OF SCOPE here** (§10).
- This pass does **not** claim **phase-continuous event replay across reset** (the reset discontinuity at `K_SWAP` is expected and out of scope, §10). The "no click" claim is refined: the `K_SWAP` boundary is excluded from the slew click metric and is instead verified by the stricter bit-exact-vs-reference check (R3d).
- This pass does **not** claim full MIDI event model (note-on/note-off with velocity, pitch bend, etc.), transport-sync / tempo map, multiple simultaneous event streams, or multi-authority hot-swap. Those are **later passes** (§10).
- This pass is **pilot/spike-grade**: a **single** A→B reload event, one trivial event-reactive sine patch, `N = 10,000` blocks (≈ 53.3 s), `R = 5`, Windows-only. A PASS clears the *cheap event-replay falsifier* so heavier investment may proceed; it is not a production event-replay guarantee.

---

## 2. Integrity crux — why this spike can genuinely FAIL

### 2.1 The event-replay failure surfaces (the things that can break) [ARCH]

The event-replay pass stacks **five** new failure surfaces on top of the proven reload-bridge result, each independently capable of breaking the replay:

1. **Off-RT prepare disruption.** The worker thread performs `engine.createPerformer()` + `setBlockSize(256)` on the **same** engine from which performer A is already rendering. If `createPerformer()` contends an internal engine lock with A's running JIT state, A could stall mid-`advance()` producing an xrun, or could produce wrong output. **R1** exists to catch this.
2. **Latch-replay omitted after reset.** Task #5 requires: after `activeIndex.store` at `K_SWAP`, call `B.reset()` then re-latch B to `stateAt(K_SWAP)` before B's first post-swap `advance()`. If latch-replay is omitted, B plays its default frequency (0.0 or silent) → R3(d)/(e) fail. If `reset()` is skipped entirely, B carries garbage phase/state → R2 + R3(d) fail. This is the **load-bearing step** of the entire pass — it is exactly what makes event-replay possible across the reset boundary. **R2** and **R3** exist to catch this being omitted or wrong.
3. **Event loss at the boundary.** The host uses a **true event model** — `setInputValue` is called **only on scheduled change blocks** (not idempotently re-stated every block). This means: if an event is missed during the swap, B never hears that frequency change and produces incorrect output. **R3(d)/(e)** and **R4** exist to catch this.
4. **Event delivery during crossfade.** During `[K_XFADE_START, K_SWAP)`, both A and B are advancing. Scheduled events must be delivered to **both** performers. If events are delivered to A but not B, B plays wrong frequency → the crossfade mix is wrong → R3 fails. **R1** and **R3(c)** exist to catch this.
5. **Race on swap/handoff + `reset()` on the RT thread.** `reset()` at `K_SWAP` on the RT thread is itself an untested RT-safety risk — a potential allocation or deadline miss at the swap block. This is gated by `xrun_at_swap == 0` under R2. Additionally, the atomic-index handoff carries the same race risk as the prior pass (torn read, use-after-free). **R2** (ASan + swap_block + xrun_at_swap) and **R4** (determinism) exist to catch these.

### 2.2 The spike is NOT rigged to pass [ARCH]

- **R1 xruns can genuinely appear.** If `createPerformer(B)` on the worker contends a shared engine lock, the live performer stalls → xrun > 0 during the prepare window → FAIL. Nothing suppresses RT stalls.
- **R1 event delivery can genuinely fail during prepare.** The scheduler on A must fire `setInputValue` on every scheduled change block, including during the prepare window. If interleaving causes a missed timed delivery, `events_delivered_A ≠ events_scheduled_in[0,K_SWAP)` → FAIL.
- **R2 reset can genuinely be omitted or overrun.** If the RT thread's per-block timing includes `reset()` at `K_SWAP`, and `reset()` allocates or blocks, `xrun_at_swap > 0` → FAIL.
- **R3 post bit-exact can genuinely fail.** If the latch-replay is omitted, B plays default freq → `maxerr(reload_B, REF_Bpost) > 0` → FAIL. If an event is dropped at the boundary, B plays wrong freq → FAIL.
- **R3 event-presence can genuinely fail.** The independent Goertzel oracle on `B_POST` checks whether the expected single frequency is present with the correct magnitude. If latch-replay is wrong, the wrong frequency dominates → FAIL. If latch-replay is omitted, magnitude is near zero → FAIL.
- **R4 determinism can genuinely differ.** A race on swap/crossfade buffers makes output interleaving-dependent → the `R = 5` SHA-256 hashes diverge → FAIL.

### 2.3 No metric is auto-satisfied [GATE]

Each of the four metrics has a concrete, pre-committed numeric threshold (§5) and at least one named real-world failure path (§2.4). The reload-bridge FINAL PASS does **not** imply the event-replay passes — the event model, latch-replay-after-reset, single-engine shared-handle createPerformer concurrency, and deterministic schedule are **four new mechanisms** not exercised by the reload-bridge pass.

### 2.4 Enumerated failure paths (each maps to a metric) [ARCH]

| # | Failure path | Caught by |
|---|---|---|
| FR1 | Off-RT `createPerformer(B)` contends engine lock / shared state → live performer A stalls mid-`advance()` → xrun during prepare window | **R1** (xrun_during_prepare) |
| FR2 | Off-RT prepare of B too slow → B not ready before `K_XFADE_START` | **R1** (b_ready_before_xfade) |
| FR3 | `createPerformer(B)` returns non-`Ok` / `false` | **R1** (createPerformer_result) |
| FR4 | Event missed or mis-timed on A during prepare window (interleaving defect) | **R1** (events_delivered_A) |
| FR5 | Event scheduled during crossfade delivered to A but not B → B plays wrong freq → mix wrong | **R1** (events_dropped_in_window) + **R3(c)** |
| FR6 | Torn read / half-published performer on atomic index handoff | **R2** (ASan + swap_block) |
| FR7 | Old performer released before crossfade completes → use-after-free | **R2** (ASan + old_perf_released_post_crossfade) |
| FR8 | Swap lands at wrong block / double-flip / missed flip | **R2 / R4** (swap_block, swap_count) |
| FR9 | `reset()` NOT called on B after swap → B carries A's phase/state | **R2** (reset_called_on_B) |
| FR10 | Latch-replay omitted after reset → B plays default frequency (0.0 or garbage) | **R2** (latch_replay_called) + **R3(d)/(e)** |
| FR11 | `reset()` or latch-replay on RT thread overruns block budget at `K_SWAP` | **R2** (xrun_at_swap) |
| FR12 | B's crossfade-start initial latch omitted → B plays default freq during crossfade | **R3(c)** (B_xfade != REF_Bxfade) + **R1** (b_xfade_initial_latch_count) |
| FR13 | Post-swap output not bit-identical to reference (event drop/loss/mis-timing) | **R3(d)** |
| FR14 | Event-presence Goertzel fails: wrong frequency present / correct freq absent / wrong amplitude | **R3(e)** |
| FR15 | Audible discontinuity / click in pure regions or crossfade interior | **R3(f)** |
| FR16 | Non-determinism: race makes output interleaving-dependent | **R4** (repro_ok across R repeats) + **R2** (ASan) |
| FR17 | Dropped/duplicated block across boundary; wrong total block count | **R4** (blocks_rendered, dropped, dup) |
| FR18 | Event-application count mismatch: events applied ≠ events scheduled | **R4** (events_applied audit) |

**Integrity note — event model is load-bearing:** The host uses a **true event model** — `setInputValue(freqHandle, f, 0)` is fired **only on scheduled change blocks**, precisely so event loss is possible and detectable. **Re-stating the current latched frequency every block is forbidden** — it would make event loss structurally impossible and defeat the falsifier. The forced boundary sentinels (§4.6) ensure there is no scheduled event in `[K_SWAP, K_SWAP+P_MEAS)`, so B_POST is a **single latched frequency** whose value depends entirely on the latch-replay at `K_SWAP` — if the replay is omitted, the wrong frequency plays and R3(e) fails.

---

## 3. Event-replay correctness strategy (Windows-feasible, locked) [ARCH][SPIKE]

Because TSan is unavailable on Windows, event-replay correctness is established by the **conjunction** of five Windows-feasible mechanisms, each independently checkable by the verifier:

1. **ASan-clean across the full event-replay run** (`/fsanitize=address`, verified available — SMOKE-TEST §7), plus MSVC CRT debug-heap corruption checking. Detects torn-read use-after-free, premature-release use-after-free, double-free, and overruns on the swap/crossfade/release paths.
2. **Deterministic seeded adversarial-interleaving stress with a bit-reproducibility invariant.** The event-replay run is executed `R = 5` times; repeat `r = 0` is clean, repeats `r = 1..4` apply a **seeded** schedule of interleaving perturbations (yields/spins) on the worker (prepare) thread and on the RT thread around the swap window (§4.5). **The audio output must be bit-identical across all `R` repeats.** The crossfade and swap are scheduled by **block index** (`K_XFADE_START`, `K_SWAP`), **not** by prepare-completion time — so a *correct* implementation is deterministic regardless of when prepare finishes (it need only finish before `K_XFADE_START`). A race on the swap/crossfade host buffers would make output interleaving-dependent → caught as a determinism failure.
3. **Static no-unsynchronized-shared-mutable-state audit on the swap/release path (locked design constraint).** The **only** cross-thread synchronization between the RT thread and the worker thread is the `std::atomic<uint32_t> activeIndex` (and the publication of `performers[1]` *happens-before* the `store(release)` that the RT thread observes via `load(acquire)`). The worker thread **never** touches `performers[idx]` while the RT thread might; the RT thread **never** touches the Engine object. Old-performer release happens **only after** the RT thread's acquire-load has demonstrably moved to the new index and the crossfade window has fully elapsed. The verifier checks the implementation honors this design.
4. **Determinism-by-schedule of the swap + event schedule.** The swap is bound to a **pre-committed block index**, and the **event schedule is frozen to `schedule.json`** from the master seed. Both decouple audio determinism from prepare-timing jitter. The event schedule contains locked boundary sentinels (§4.6) that force the fence-posts of the replay to be verifiable.
5. **Single-thread engine-access invariant (locked).** The engine is accessed by exactly one thread at a time: main thread performs `create→parse→load→getEndpointHandle→link→createPerformer(A)`; worker thread later performs `createPerformer(B)` solo (main idle, RT never touches engine); RT thread never touches the engine at all, only `Performer` methods (`setBlockSize`, `setInputValue`, `advance`, `copyOutputFrames`, `reset`).

**This conjunction is the locked event-replay correctness metric for this pass. "TSan-clean" is NOT a pass requirement here** and is pre-declared as a separate later Linux pass (§10).

---

## 4. The locked run design (what is executed)

> Full buildable detail is in the companion `HARNESS-SPEC.md`. This section locks the parameters the verifier checks against; the spec implements **these and only these**.

### 4.1 Toolchain (locked, inherited from verified reality) [ARCH]
- Compiler **MSVC `cl.exe` 19.50** (VS18 BuildTools), invoked under `vcvars64.bat`; **C++17** (`/std:c++17 /EHsc`).
- `/DCMAJOR_DLL=1`; include root `C:/Users/doner/SSI/g1a/_run/cmajor-headers/include`; single include `cmajor/API/cmaj_Engine.h`.
- DLL: `C:/Users/doner/SSI/g1a/_run/CmajPerformer.dll` (**v1.0.3159**), loaded via `cmaj::Library::initialise(...)`; copied next to the host `.exe`.
- ASan build adds `/fsanitize=address`; runtime needs `clang_rt.asan_dynamic-x86_64.dll` (present at `g1a/_run/`).

### 4.2 Audio + timeline parameters (locked) [ARCH]
- Sample rate **`fs = 48,000` Hz**; block size **`B_block = 256` frames** (mono, 1 channel); **`N = 10,000`** total blocks rendered to the master output (≈ 53.333 s).
- Per-block real-time budget **`D_block = B_block / fs = 256 / 48000 = 5.33333… ms`** (the deadline an xrun is measured against — §5.1).
- **`K_PREPARE_START = 100`** — the block on A's RT timeline at which the worker thread is dispatched to create performer B off-RT.
- **`K_XFADE_START = 4000`** — the pre-committed block at which the live A→B crossfade begins (first crossfaded block). B must be ready before this block.
- **`W_XFADE = 64`** blocks — the locked crossfade window length (`W_XFADE · B_block = 16,384` crossfade samples ≈ 341 ms).
- **`K_SWAP = K_XFADE_START + W_XFADE = 4064`** — the pre-committed block at which the crossfade completes, `activeIndex` is `store`d `0→1`, `B.reset()` is called, B is re-latched to `stateAt(K_SWAP)`, and output becomes pure B. This is the locked "swap block."
- **`P_MEAS = 512`** blocks — the pre/post measurement-window length for the R3 frequency checks. Pre-window `A_PRE = [K_XFADE_START − P_MEAS, K_XFADE_START) = [3488, 4000)` (pure A); post-window `B_POST = [K_SWAP, K_SWAP + P_MEAS) = [4064, 4576)` (pure B).
- Repeats **`R = 5`** seeded interleaving repeats (§4.5).
- Master seed **`SEED_MASTER = 0x6121A_0003`** (fixed registered constant, distinct from the first pass's `0x6121A_0001` and the reload pass's `0x6121A_0002`; drives the event schedule **and** the interleaving-perturbation schedule — both deterministic from this seed).

Timeline phases on the master output: blocks `[0, 4000)` pure A; blocks `[4000, 4064)` live crossfade (both A and B advancing, host-mixed); blocks `[4064, 10000)` pure B (after reset + latch-replay).

### 4.3 The patch (single, shared by all performers) [ARCH]
A single Cmajor program — **`FreqSine`** — loaded/linked **once** on the main thread. All performers (A, B, and reference performers) are created from this same engine via `engine.createPerformer()`.

**Cmajor source specification:**
```
processor FreqSine
{
    input value float freq;
    output stream float out;

    void main()
    {
        float phase = 0.0f;

        loop
        {
            out <- 0.25f * sin (twoPi * phase);
            phase = addModulo2Pi (phase, float (twoPi * freq * processor.period));
            advance();
        }
    }
}
```
- Amplitude **0.25** (locks `S_click` derivation: `2π·660·0.25/48000 ≈ 0.0216`, well below a real click).
- `input value float freq` — a latching value endpoint, non-sample-accurate, zero overhead when not updated (dossier §1, §3). Changed per-block via host `setInputValue(freqHandle, newFreq, 0)`.
- Phase **0** at first `advance()` — deterministic.
- Endpoint handles: `freqHandle = engine.getEndpointHandle("freq")` and `outHandle = engine.getEndpointHandle("out")` — resolved after `load()`, before `link()`. Valid for all performers from this engine (dossier §5).
- **This pass has NO recompile-distinctness probe** (same program for both A and B). The retired 440/880-Octave probe from the reload pass is replaced by **event-presence + bit-exact-vs-reference** (§5.3): the verifier checks that B produces the correct latched frequency after replay, not that B is a "different program" from A.

### 4.4 Threading, swap, crossfade, reset, and latch-replay model (locked) [ARCH]
- **Main thread:** loads `Library`; creates Engine; parses/loads/link `FreqSine`; resolves `freqHandle` and `outHandle` (after load, before link); creates Performer A = `engine.createPerformer()`; `setBlockSize(256)`. Allocates the 2-element `cmaj::Performer performers[2]` array (`performers[0] = A`, `performers[1] = {}`), the `std::atomic<uint32_t> activeIndex{0}`, `std::atomic<bool> bReady{false}`, host crossfade buffers, and the event-schedule data structure. Starts the RT thread and (at `K_PREPARE_START`) the worker thread. **Performer A is recreated fresh from the engine at the start of each repeat** (after the prior repeat's safe release of the old performer A).
- **RT thread (single, owns the render loop):** for each block `k = 0..N−1`: `idx = activeIndex.load(acquire)`; render the active performer(s) and write the master output for block `k`. Event delivery and performer advancement follow **mutually exclusive branches** by block phase (see below). The RT thread **never** touches the Engine object.
- **Worker (off-RT prepare) thread:** dispatched at `K_PREPARE_START`. Calls `engine.createPerformer()` + `setBlockSize(256)` on the **same** engine. Records `createPerformer_result`. Publishes `performers[1]` and `bReady.store(true, release)`. Records `K_PREPARE_DONE` (the block index at which `bReady` was published). **All before `K_XFADE_START`.** The worker never touches `performers[0]` (the live one); it never touches `activeIndex` except as designed.
- **Mutually exclusive RT render branches — event delivery:**
  - **Pre-crossfade** `k < K_XFADE_START`: advance only `performers[0]` (A). For each scheduled change at block `k`, call `setInputValue` on A exactly once. Capture `Result`.
  - **Crossfade** `K_XFADE_START ≤ k < K_SWAP`: advance **both** `performers[0]` (A) and `performers[1]` (B). For each scheduled change at block `k`, call `setInputValue` on A exactly once AND on B exactly once. Both performers advance; host per-sample-α mix into master.
    - **At `k == K_XFADE_START` (first crossfade block):** before B's first `advance()`, latch B to `stateAt(K_XFADE_START)` — the frequency value A currently holds at the start of block `K_XFADE_START`. This is B's **crossfade-start initial latch** (`b_xfade_initial_latch_count=1`, counted separately from scheduled events).
  - **Post-swap** `k ≥ K_SWAP`: advance only `performers[idx]` (= B).
    - **At `k == K_SWAP`:** immediately after the swap, the RT thread: (1) `activeIndex.store(1, release)`; (2) `performers[1].reset()`; (3) re-latch B to `stateAt(K_SWAP)` — the frequency value A held immediately before the swap (this is the **latch-replay**, `latch_replay_count=1`, counted separately from scheduled events); (4) then advance B. For each scheduled change at block `k ≥ K_SWAP`, call `setInputValue` on B exactly once (the latch-replay call at `K_SWAP` is NOT a scheduled event — it is the re-latch, counted separately).
- **The atomic swap:** at block `K_SWAP`, the RT thread (the sole writer of `activeIndex` at swap time) performs `activeIndex.store(1, release)`. From `K_SWAP` onward the RT thread's `load(acquire)` returns `1` and it advances only `performers[1]`.
- **Safe release:** the old performer `performers[0]` is released (`performers[0] = {}`, COM-atomic decrement) **only after** (i) the crossfade window has fully elapsed (block ≥ `K_SWAP`) **and** (ii) the RT thread has performed at least one `load(acquire)` returning `1` (so it provably no longer references `performers[0]`). Engine is NOT released between repeats.
- **Repeat lifecycle (locked):** at the start of each repeat: `performers[0] = engine.createPerformer()` (fresh performer A, phase 0); `activeIndex.store(0)`, `bReady.store(false)`. Within each repeat, after the safe-release protocol completes, `performers[0] = {}` (release). The engine persists across all repeats; only performers are created/released. This keeps `R = 5` repeats buildable and self-contained.

### 4.5 Crossfade math + adversarial-interleaving stress (locked) [ARCH]
- **Crossfade schedule (per-sample linear, click-free by construction):** over the crossfade window of `W_XFADE · B_block = 16,384` samples, define `α(n) = n / (W_XFADE · B_block − 1)` for `n = 0..16383` (the sample offset from the first crossfade sample). `α` is **per-sample**, monotone non-decreasing, with `α(0) = 0.0` and `α(16383) = 1.0`. Master output during the window: `out[n] = (1 − α(n)) · A[n] + α(n) · B[n]`. Both A and B advance every crossfade block; the host mixes their copied output frames. Reused unchanged from the reload pass.
- **Repeat `r = 0`: clean / timing-reference run** — **no** perturbation injected. R1's xrun-during-prepare and the per-block timing distribution are measured on repeat 0 only (injected sleeps would inflate timings; the deadline metric must reflect real compute cost).
- **Repeats `r = 1..4`:** each derives a deterministic perturbation schedule from `hash(SEED_MASTER, r)` and injects bounded yields/short spins (i) on the worker thread during the prepare (to vary when `bReady` is published relative to A's block progress) and (ii) on the RT thread in the blocks immediately around `K_SWAP` (to vary the swap/release interleaving). The audio output of every repeat — full master output, the A-stream, the B-stream, and the crossfade region — must be **bit-identical to repeat 0** (§5.4).

### 4.6 Event schedule (locked, deterministic from SEED_MASTER) [ARCH]
- **Schedule algorithm:** deterministic sequence `Schedule = [(block_i, freq_i)]` generated from `SEED_MASTER` using SplitMix64. `freq ∈ FREQ_PALETTE = {220, 330, 440, 550, 660}` (Hz, locked). Only change blocks are recorded — blocks where freq differs from the previous block's freq. The schedule is **frozen to `schedule.json`** before any spike is run, with its SHA-256.
- **Event model:** `setInputValue(freqHandle, f, 0)` with `ramp = 0` (instant) — fired **only on scheduled change blocks**. Never re-state the current latched value every block (that would defeat the event-loss falsifier — see §2 integrity note).
- **Locked boundary sentinels (forced by the deterministic schedule algorithm, verified in `schedule.json`):**
  1. **≥1** frequency change in `[0, K_XFADE_START)` — ensures A experiences at least one event before the crossfade.
  2. **A_PRE is single-frequency:** no change in `[K_XFADE_START − P_MEAS, K_XFADE_START) = [3488, 4000)` — the pre-window is a pure constant-frequency region for clean Goertzel analysis.
  3. At least one frequency change **strictly before `K_SWAP`** (could be during `[K_XFADE_START, K_SWAP)` or earlier) such that `stateAt(K_SWAP)` is a well-defined testable value.
  4. **NO** frequency change in `[K_SWAP, K_SWAP + P_MEAS) = [4064, 4576)` — so `B_POST` is a **single latched frequency** = `stateAt(K_SWAP)`. This forces the post-swap output in the `B_POST` window to depend *entirely* on the latch-replay at `K_SWAP` — if the latch-replay is omitted/wrong, R3(e) detects it.
  5. **≥1** frequency change in `(K_SWAP + P_MEAS, N)` — ensures B experiences at least one post-measurement event (not just the latched frequency).
- **Schedule audit:** `schedule.json` contains the full `[(block, freq)]` list, `SEED_MASTER`, the generation algorithm description, the sentinel assertions and their verification results, and a SHA-256 of the schedule.

### 4.7 Reference renders (oracles) — single-threaded, separate phase, locked [ARCH]
All reference renders use a **separate single performer** from the same engine (single-threaded, no swap, no crossfade). Each models the exact same event schedule and latch semantics as the corresponding region in the reload run. **All reference renders use the same event model** (setInputValue only on change blocks). **All reference renders involve no crossfade — they are self-contained renders of exactly the relevant block range:**

- **`REF_A`:** single performer, phase 0 at block 0, event model from schedule `[0, K_SWAP)`, advanced `[0, K_SWAP)`. Produces `P_MEAS` blocks of pre-window audio (the `[K_XFADE_START − P_MEAS, K_XFADE_START)` slice).
- **`REF_Bxfade`:** single performer, phase 0 at `K_XFADE_START`. At `K_XFADE_START`, **initial-latched** to `stateAt(K_XFADE_START)` (same as the crossfade-B initial latch). Event model from schedule `(K_XFADE_START, K_SWAP]`. Advanced `W_XFADE` blocks. Produces exactly what B should produce during the crossfade.
- **`REF_Bpost`:** single performer, phase 0. First, advanced through the schedule from block 0 to `K_SWAP` to establish correct internal state, then (matching the reload run): `reset()`, **latch-replayed** to `stateAt(K_SWAP)`. Event model from schedule `(K_SWAP, N)`. Advanced `[K_SWAP, N)`. Produces the reference for `reload_B[K_SWAP, N)`.
- **Solo presence refs:** independent pure constant-frequency renders (no scheduled changes) used to normalize the R3(e) Goertzel magnitudes. `Solo(f)` renders `P_MEAS` blocks of `FreqSine` at constant frequency `f` (amplitude 0.25, phase 0). One solo ref for `stateAt(K_SWAP)` (the expected B_POST frequency) and one for the A_PRE frequency. These are **independent** of any replay — they normalize the Goertzel check so that if replay is broken, R3(e) fails even if `REF_Bpost` happens to be broken identically.

---

## 5. The four pre-registered event-replay metrics + the event-replay-PROOF artifact

Each metric has an **exact, deterministic, computable estimator** and a **concrete pre-committed PASS threshold**. All thresholds are predictions/requirements fixed now, never measurements.

### 5.1 R1 — Event-delivery & prepare non-disruption [GATE]
**Estimator.** While performer A is live on the RT thread, the worker thread (dispatched at `K_PREPARE_START`) performs off-RT `createPerformer(B)`. Define the **prepare window** as the interval `[K_PREPARE_START, K_PREPARE_DONE]` where `K_PREPARE_DONE` is the block at which the worker publishes `bReady`. On the **clean repeat 0**:

- `xrun_during_prepare` = count of blocks `k ∈ [K_PREPARE_START, K_PREPARE_DONE]` whose RT per-block processing time `t_k` exceeds `D_block`.
- `createPerformer_result` = `Ok` iff `engine.createPerformer()` returned a valid performer and `setBlockSize(256)` returned `Result == Ok`.
- `b_ready_before_xfade` = `true` iff `K_PREPARE_DONE < K_XFADE_START` (B is ready before the crossfade must begin).
- `events_delivered_A_prepare` = number of scheduled changes in `[K_PREPARE_START, K_PREPARE_DONE]` for which `setInputValue` was called on A with `Result == Ok`. Must equal `events_scheduled_in[K_PREPARE_START, K_PREPARE_DONE]`.
- `events_dropped_in_window` = 0 iff during `[K_XFADE_START, K_SWAP)`, for every scheduled change at block `k`, `setInputValue` was called on **both** A and B with `Result == Ok`.
- `b_xfade_initial_latch_count` = 1 iff at `K_XFADE_START`, before B's first crossfade `advance()`, `setInputValue(freqHandle, stateAt(K_XFADE_START), 0)` was called on B with `Result == Ok`. **(Separate latch count — NOT a scheduled event.)**

**PASS threshold (all must hold):** `xrun_during_prepare == 0` **AND** `createPerformer_result == Ok` **AND** `b_ready_before_xfade == true` **AND** `events_delivered_A_prepare == events_scheduled_in[K_PREPARE_START, K_PREPARE_DONE]` **AND** `events_dropped_in_window == 0` **AND** `b_xfade_initial_latch_count == 1`.
**Falsifies via:** FR1, FR2, FR3, FR4, FR5, FR12 (§2.4).

### 5.2 R2 — Atomic / lock-free swap safety + reset correctness [GATE]
**Estimator.** Over the full event-replay run (all `R` repeats; ASan build for the safety counts):

- `asan_violations` = count of AddressSanitizer reports; `crt_heap_violations` = count of CRT debug-heap corruption reports.
- `result_violations` = count of `Performer` API calls (`setBlockSize`, `setInputValue`, `advance`, `copyOutputFrames`, `reset`) returning `Result ≠ Ok` across the whole run.
- `swap_block` = the block index at which `activeIndex` transitions `0 → 1` (read from `trace.log`); `swap_count` = number of `0→1` transitions (must be exactly 1).
- `reset_called_on_B == true` iff `performers[1].reset()` was called exactly once, on the RT thread, at `k == K_SWAP`, **after** `activeIndex.store(1, release)` and **before** B's first post-swap `advance()`.
- `latch_replay_called == true` iff `setInputValue(freqHandle, stateAt(K_SWAP), 0)` was called on B exactly once, on the RT thread, at `k == K_SWAP`, **after** `reset()` and **before** B's first post-swap `advance()`. **(Separate latch count — NOT a scheduled event.)**
- `xrun_at_swap` = 0 iff the per-block processing time `t_k` at `k == K_SWAP` does **not** exceed `D_block` (the `reset()` + latch-replay at the swap must not overrun the budget).
- `old_perf_released_post_crossfade` = `true` iff `old_perf_release_block ≥ K_SWAP` **AND** the release occurred after the RT thread performed at least one `load(acquire)` returning `1`.

**PASS threshold (all must hold):** `asan_violations == 0` **AND** `crt_heap_violations == 0` **AND** `result_violations == 0` **AND** `swap_block == K_SWAP (= 4064)` **AND** `swap_count == 1` **AND** `reset_called_on_B == true` **AND** `latch_replay_called == true` **AND** `xrun_at_swap == 0` **AND** `old_perf_released_post_crossfade == true`.
**Falsifies via:** FR6, FR7, FR8, FR9, FR10, FR11 (§2.4).

### 5.3 R3 — Event-response correctness + click-free (all required) [GATE]
**Estimator (six independent checks, all required):**

- **(a) Pre bit-exact (A region).** `maxerr(reload_A[0, K_XFADE_START), REF_A slice) == 0` — the live A output pre-crossfade is bit-identical to the reference. Proves A's event delivery under live conditions matches the reference.
- **(b) Crossfade mix identity + monotone α.** Over the `16,384` crossfade-window samples: `mix_err = max_n |out[n] − ((1 − α(n)) · A[n] + α(n) · B[n])|` where `A[n]`, `B[n]` are per-performer outputs. `alpha_monotone = true` iff `α` is non-decreasing with `α(0)==0.0` and `α(16383)==1.0`.
- **(c) Crossfade-B bit-exact.** `maxerr(B_xfade_region, REF_Bxfade) == 0` — B's output during the crossfade matches the reference (which includes the same initial latch at `K_XFADE_START`).
- **(d) Post bit-exact (load-bearing).** `maxerr(reload_B[K_SWAP, N), REF_Bpost) == 0` — B's post-swap output (after reset + latch-replay) is bit-identical to the reference. **This is the central load-bearing check:** if the latch-replay is omitted or wrong, this fails.
- **(e) Event-presence (independent oracle).** Goertzel magnitude on the single-frequency `B_POST` window (`P_MEAS · 256` samples, repeat 0), normalized against the **independent solo presence ref** at the same frequency:
  - `rel_expected_Bpost = mag_Bpost(stateAt(K_SWAP)) / mag_solo(stateAt(K_SWAP))` ≥ `0.40`
  - For every other palette frequency `f ≠ stateAt(K_SWAP)`: `mag_Bpost(f) / mag_solo(f) ≤ 0.10`
  - Same for `A_PRE`: `rel_expected_Apre ≥ 0.40` at the A_PRE frequency, all others `≤ 0.10`.
  The normalization uses **independent solo renders**, not the replay reference — so if replay is broken identically, the ratio signals failure.
- **(f) Within-region slew click (refined from reload pass).** `click_max = max_k |out[k] − out[k−1]|` over pure regions `A_PRE` and `B_POST` plus the crossfade **interior** (sample offset `1..16382`). **The `K_SWAP` boundary sample is excluded** — the deterministic reset discontinuity is expected (out of scope §10) and covered by the stricter bit-exact-vs-reference check (d). Derivation: max per-sample slew in `B_POST` is `2π·660·0.25/48000 ≈ 0.0216`; ceiling `S_click = 0.05` gives > 2× margin above natural slew and is `≪` any real click (a discontinuity is a jump up to ≈ 0.5 for amplitude 0.25 tones). **PASS:** `click_max ≤ S_click = 0.05`.

**PASS threshold (all must hold):** (a) `maxerr_reload_A == 0` **AND** (b) `mix_err ≤ ε_xfade = 1e-6` **AND** `alpha_monotone == true` **AND** (c) `maxerr_B_xfade == 0` **AND** (d) `maxerr_reload_B == 0` **AND** (e) `rel_expected_Bpost ≥ 0.40` **AND** all other palette freqs `≤ 0.10` in B_POST **AND** `rel_expected_Apre ≥ 0.40` and all others `≤ 0.10` in A_PRE **AND** (f) `click_max ≤ 0.05`.
**Falsifies via:** FR4, FR5, FR10 (post bit-exact), FR12, FR13, FR14, FR15 (§2.4).

### 5.4 R4 — Determinism + completeness (bit-exact) + event-application audit [GATE]
**Estimator (five independent checks, all required):**

- **(a) Interleaving determinism.** For the full master output, the A-stream, the B-stream, and the crossfade region, compute the SHA-256 of the full rendered float buffer for **every** repeat `r = 0..4`. `repro_ok ≡` all `R` hashes are identical per stream.
- **(b) Block completeness.** `blocks_rendered = N (= 10,000)`; the block-index sequence must be contiguous `0..N−1` with `dropped_blocks == 0` and `duplicated_blocks == 0`.
- **(c) Swap location.** `swap_block == K_SWAP (= 4064)` (cross-checked against R2).
- **(d) Event-application audit (scheduled events).** From `events_applied.log`:
  - `events_applied_A == events_scheduled_in[0, K_SWAP)` — every scheduled change in the A-window was applied to A exactly once with `Result == Ok`.
  - `events_applied_B_pre == events_scheduled_in[K_XFADE_START, K_SWAP)` — every scheduled change in the crossfade window was applied to B exactly once.
  - `events_applied_B_post == events_scheduled_in[K_SWAP, N)` — every scheduled change in the B-post window was applied to B exactly once.
  - These are the **scheduled-change counts only** — latch events are counted separately, not included.
- **(e) Separate latch-event audit (excluded from scheduled-event counts).** From `events_applied.log`:
  - `b_xfade_initial_latch_count == 1` (B's initial latch at `K_XFADE_START` — separately audited, NOT part of `events_scheduled_in`).
  - `latch_replay_count == 1` (B's re-latch at `K_SWAP` after reset — separately audited, NOT part of `events_scheduled_in`).

**PASS threshold (all must hold):** `repro_ok == true` **AND** `blocks_rendered == 10,000` **AND** `dropped_blocks == 0` **AND** `duplicated_blocks == 0` **AND** `swap_block == 4064` **AND** `events_applied_A == events_scheduled_in[0, K_SWAP)` **AND** `events_applied_B_pre == events_scheduled_in[K_XFADE_START, K_SWAP)` **AND** `events_applied_B_post == events_scheduled_in[K_SWAP, N)` **AND** `b_xfade_initial_latch_count == 1` **AND** `latch_replay_count == 1`.
**Falsifies via:** FR8, FR16, FR17, FR18 (§2.4).

### 5.5 The event-replay-PROOF artifact (must exist and be machine-checkable) [GATE]
A concrete saved bundle under `C:/Users/doner/SSI/g1a/_run-event-replay/artifacts/` that the verifier can inspect without re-running the spike:
1. **`trace.log`** — header (locked params, DLL version `1.0.3159`, toolchain); per-block RT Result-audit; the prepare-window timing summary and `K_PREPARE_DONE`; the worker-thread `createPerformer` Result-audit; the `activeIndex` transition record (`swap_block`, `swap_count`); the `old_perf_release_block` and the RT-acquire-load ordering proving release was post-crossfade; `reset()` call record (called at `K_SWAP`, before B's first post-swap advance); `latch_replay` call record; `b_xfade_initial_latch` call record; the repeat-0 per-block timing distribution (`p50/p99/max`, xrun list if any, `t_k` at `K_SWAP`); and the **captured ASan/CRT stderr** for the ASan build (or an explicit `ASAN: no reports` line).
2. **`schedule.json`** — the full deterministic event schedule: `[(block, freq)]` list, `SEED_MASTER`, generation algorithm, sentinel assertions and verification, SHA-256.
3. **`events_applied.log`** — per-block record of every `setInputValue` call: for A (columns: `block, freq, result`), for B during crossfade (`block, freq, result`), and for B post-swap (`block, freq, result`). **Latch events are logged in separate sections:** `X_FADE_INITIAL_LATCH: block=4000, freq=<stateAt(K_XFADE_START)>, result=<Ok/Fail>` and `LATCH_REPLAY: block=4064, freq=<stateAt(K_SWAP)>, result=<Ok/Fail>`. Summary counts: `events_applied_A`, `events_applied_B_pre`, `events_applied_B_post`, `b_xfade_initial_latch_count`, `latch_replay_count`.
4. **Rendered sample dumps** — `A_pre` (pre-window pure-A, `P_MEAS·256` samples), `B_post` (post-window pure-B, `P_MEAS·256` samples), `crossfade_region` (`16,384` samples), `full_output` (entire `2,560,000` master output), `A_xfade` and `B_xfade` (per-performer crossfade-region buffers, `16,384` samples each), `REF_A`, `REF_Bxfade`, `REF_Bpost` (the reference oracle renders), and solo presence refs at `stateAt(K_SWAP)` and at the `A_PRE` frequency. Each mono, `fs = 48,000`, 32-bit float.
5. **`metrics.json`** — machine-checkable JSON containing, for each metric R1–R4: the computed estimator values, the locked threshold, and a boolean pass; plus `asan_clean` (bool), all run parameters, the `R` per-stream SHA-256 hashes, and the final verdict. **Schema includes the separate latch counts:**
   ```json
   {
     "R4": {
       "events_applied_A": <int>,
       "events_applied_B_pre": <int>,
       "events_applied_B_post": <int>,
       "events_scheduled_pre_swap": <int>,
       "events_scheduled_xfade": <int>,
       "events_scheduled_post_swap": <int>,
       "b_xfade_initial_latch_count": <int>,
       "latch_replay_count": <int>,
       ...
       "threshold": "applied_A==scheduled_pre_swap & applied_B_pre==scheduled_xfade & applied_B_post==scheduled_post_swap & b_xfade_initial_latch==1 & latch_replay==1 & repro_ok & blocks==10000 & dropped==0 & dup==0 & swap_block==4064"
     }
   }
   ```

---

## 6. Decision rule — FINAL PASS / FINAL FAIL (locked) [GATE]

The verdict is a **deterministic function** of §5, fixed before any result exists:

> **FINAL PASS** iff **all four metrics clear their thresholds** — `R1 ∧ R2 ∧ R3 ∧ R4` — **AND** the event-replay-PROOF artifact (§5.5) exists and is well-formed **AND** ASan is clean (`asan_violations == 0`, restated as an independent gate).
>
> **FINAL FAIL** otherwise — i.e. **any** metric fails its threshold, **or** the proof artifact is missing/malformed, **or** any ASan/CRT violation is reported.

There is **no partial pass**. On **FINAL FAIL**, the pre-declared fallback (§8) fires verbatim. The verifier (§9) independently recomputes the four metrics from the proof artifact; if any threshold was tuned, or either frozen file's SHA-256 changed, the run is FAILED regardless of the computed metrics.

| Condition | Verdict | Action |
|---|---|---|
| `R1 ∧ R2 ∧ R3 ∧ R4` all pass **and** proof artifact exists **and** ASan clean | **FINAL PASS** (pilot/spike-grade, Windows-only) | Event-replay across the reload boundary (deterministic event schedule, reset-and-re-latch, bit-exact-vs-reference) is feasible AT ALL; investment may proceed to later passes (§10). Full TSan/Linux certification of the swap path still owed (§10). |
| any metric fails, **or** proof artifact missing/malformed, **or** any ASan/CRT violation | **FINAL FAIL** | Fire §8 verbatim: investment-freeze on event-replay. |

---

## 7. Locked-parameter summary [GATE]

Fixed at this pre-registration; may **not** change after any result exists:

| Parameter | Value |
|---|---|
| `fs` | `48,000` Hz |
| `B_block` | `256` frames (mono) |
| `N` | `10,000` blocks |
| `D_block` | `5.33333` ms |
| `K_PREPARE_START` | `100` |
| `K_XFADE_START` | `4000` |
| `W_XFADE` | `64` blocks |
| `K_SWAP` | `4064` |
| `P_MEAS` | `512` blocks |
| `A_PRE` | `[3488, 4000)` |
| `B_POST` | `[4064, 4576)` |
| `R` | `5` repeats |
| `SEED_MASTER` | `0x6121A_0003` |
| Patch | `FreqSine` (single, shared) |
| Amplitude | `0.25` |
| `FREQ_PALETTE` | `{220, 330, 440, 550, 660}` Hz |
| Crossfade | per-sample linear `α(n)`, host-mixed |
| Swap | `std::atomic<uint32_t>` active-index into `cmaj::Performer[2]` |
| `ε_xfade` | `1e-6` |
| `S_click` | `0.05` (>2× margin above `2π·660·0.25/48000 ≈ 0.0216`) |
| `REL_MIN` | `0.40` |
| `LEAK_MAX` | `0.10` |
| DLL | `CmajPerformer.dll v1.0.3159` |
| Toolchain | MSVC `cl 19.50`, C++17, `/DCMAJOR_DLL=1`, `/fsanitize=address` for ASan build |
| `b_xfade_initial_latch_count` | `== 1` (separate from scheduled events) |
| `latch_replay_count` | `== 1` (separate from scheduled events) |

The companion `HARNESS-SPEC.md` implements these **and only these**. Any deviation observed during execution **invalidates the run under this seed**; it does **not** license post-hoc re-tuning.

---

## 8. PRE-DECLARED FALLBACK (committed BEFORE results — quotable verbatim on FINAL FAIL) [GATE]

> **PRE-DECLARED FALLBACK — G1A event-replay pass (committed before any result exists):**
>
> **On FINAL FAIL of the G1A event-replay spike, the verdict is: `investment-freeze on event-replay → the reload bridge exists without event-replay capability`.**
>
> Events-in-flight during reload are dropped. A later pass may revisit events with a different API approach.

---

## 9. Verifier contract (falsifier-first) [GATE]

The orchestrator SHA-256-**freezes** `PRE-REGISTRATION.md` and `HARNESS-SPEC.md` immediately after they are written. An independent verifier later:
1. **FAILS the run if either frozen file's SHA-256 changed** (any threshold tuned, any parameter edited post-lock).
2. **FAILS the run if any §5 threshold present in the executed run differs** from the value locked here (threshold tuning after results).
3. **Recomputes R1–R4 independently from the proof artifact** (§5.5) — not from the implementer's narrative — including re-running Goertzel on `A_pre`/`B_post` normalized against independent solo refs, recomputing `mix_err` from `crossfade_region`/`A_xfade`/`B_xfade`, recomputing `click_max` from `full_output` (with `K_SWAP` boundary excluded), re-diffing `reload_A` vs `REF_A`, `B_xfade` vs `REF_Bxfade`, `reload_B` vs `REF_Bpost`, re-hashing every dumped buffer to confirm the `R` per-stream SHA-256 values and bit-reproducibility, and re-auditing `events_applied.log` to confirm scheduled-event counts and the two separate latch counts.
4. **Confirms ASan-clean** from the captured ASan run log.
5. **Confirms the event model is honored:** no per-block idempotent re-statement of the latch; `setInputValue` only on scheduled change blocks plus the two explicitly separate latch events.
6. **Confirms latch-replay is present:** the post-swap `events_applied.log` shows `LATCH_REPLAY: block=4064` with `setInputValue(freqHandle, stateAt(K_SWAP), 0)`, called after `reset()` and before B's first post-swap `advance()`.
7. **Confirms B's crossfade-start initial latch is present:** `X_FADE_INITIAL_LATCH: block=4000` with `setInputValue(freqHandle, stateAt(K_XFADE_START), 0)` before B's first crossfade `advance()`.
8. **Confirms the single-thread engine-access invariant:** the engine is touched by exactly one thread at a time; the RT thread never calls engine methods.
9. **Confirms `K_SWAP` boundary click-exclusion is justified:** the deterministic-reset discontinuity is expected (out of scope §10) and is verified by the stricter bit-exact-vs-reference check (R3d).
10. **Confirms the `metrics.json` schema** includes the five separate event-application counts (`events_applied_A`, `events_applied_B_pre`, `events_applied_B_post`, `b_xfade_initial_latch_count`, `latch_replay_count`) and that their values are consistent with `events_applied.log` and `schedule.json`.
11. Issues **FINAL PASS** only if §6's conjunction holds; otherwise **FINAL FAIL** and quotes §8 verbatim.

---

## 10. OUT OF SCOPE (explicit — these are LATER passes) [ARCH]

The following are **NOT** part of this event-replay pass and are **not** gated here:
- **Full MIDI event model** (note-on/note-off with velocity, pitch bend, aftertouch, control change, program change, etc.) — this pass uses only `input value float freq` (dossier §3), not `input event std::midi::Message` or `input event` with custom types.
- **Phase-continuous event replay across reset** — the reset discontinuity at `K_SWAP` is expected and excluded from the click metric; preserving oscillator phase across `reset()` is a later pass.
- **Transport-sync / tempo map** (shared tempo/playhead/transport preserved across the reload).
- **Multiple simultaneous event streams** (e.g. freq + gain + filter-cutoff sent in the same block).
- **Multi-authority** (more than one writer of `activeIndex` / multiple concurrent reload authorities).
- **Full ThreadSanitizer / data-race certification of the swap/release path** — TSan does **not** exist on Windows under MSVC or clang-cl (SDK-GROUNDING §6.2; SMOKE-TEST §7; RELOAD-GROUNDING §7.3). A certified absence of data races on the atomic-index handoff requires **cross-compiling this same harness for Linux x64 and running it under `-fsanitize=thread`**. That is a **separate later Linux pass** and is **explicitly out of scope here**; this Windows pass uses the §3 Windows-feasible conjunction instead.

---

## 11. Honest limitations (locked) [SPIKE]

- **Windows-only.** All evidence here is from one Windows x64 host with MSVC `cl 19.50` and `CmajPerformer.dll v1.0.3159`. Results may not transfer to other platforms/DLL versions.
- **No TSan.** Swap/release correctness rests on ASan + determinism-under-adversarial-interleaving + a static synchronization audit (§3), **not** on a thread-race certifier. A subtle race on the `activeIndex` handoff that happens to produce identical output under the `R = 5` sampled interleavings could escape detection; the load-bearing certification is the later Linux/TSan pass (§10).
- **Single reload event, pilot/spike-grade.** One A→B reload, one trivial event-reactive sine patch, `N = 10,000` blocks (≈ 53.3 s), `R = 5`. Not a soak test, not repeated rapid reloads, not a statistical guarantee.
- **Prepare-timing is genuinely non-deterministic; audio determinism is by schedule.** The off-RT prepare of B finishes at a wall-clock-varying block, but the crossfade/swap are bound to fixed block indices (`K_XFADE_START`/`K_SWAP`), so audio is deterministic **provided** the prepare finishes before `K_XFADE_START` (R1). If it does not, that is a real FAIL, not a tolerance — intentional.
- **Determinism assumes deterministic DSP + deterministic event schedule.** The `FreqSine` patch + the locked `schedule.json` are deterministic by construction; exact-equality (bit-exact) is the strict, honest bar.
- **`S_click` is a slew bound, not a psychoacoustic model.** `S_click = 0.05` is derived from the max natural per-sample slew at amplitude 0.25 and max palette frequency 660 Hz; it cleanly separates natural slew from a real discontinuity and is an honest, conservative click detector for these locked tones, not a general audibility model.
- **`createPerformer(B)` on the worker thread while A renders is an untested concurrency concern.** Single-engine createPerformer concurrency is explicitly under test in this spike (R1, R2, R4) — it's what distinguishes this pass from the two-engine reload pass.

---

## 12. Lock statement [GATE]

Every parameter, threshold, tolerance, patch, seed, event-schedule algorithm, sentinel, thread/swap/crossfade/reset/re-latch model, and decision branch in §1–§11 is **fixed at this pre-registration and may not be changed after any result exists.** This document contains **no result, no measured number, and no code.** The companion `HARNESS-SPEC.md` (implementation blueprint, no code this phase) must implement **these and only these**. The orchestrator will SHA-256-freeze both files immediately; the verifier (§9) FAILS the run if any hash changed or any threshold was tuned. **No spike is run and no results are produced in this phase.**
