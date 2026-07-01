# G1A RELOAD-BRIDGE Falsifier — PRE-REGISTRATION (LOCKED)

**Track:** SSI DAW — Track 1A reload-bridge spike (regenerate-and-reload; build-plan load-bearing mechanism #1). Bespoke real-time C++ audio host over the Cmajor native C++ API.
**Phase:** PRE-REGISTRATION LOCK. This document is written **before any spike result exists**. No spike is run, no C++ is shipped, no measured number appears in this document. Every numeric threshold below is a **pre-committed prediction / requirement**, not a measurement.
**Source of truth (verified API reality):** `C:/Users/doner/SSI/g1a/_run-reload/RELOAD-GROUNDING.md` (no async/Patch build API exists; background compile = a SECOND `cmaj::Engine` doing synchronous `create→load→link→createPerformer` on a NON-RT worker thread; atomic swap = `std::atomic<uint32_t>` active-index into a 2-element `cmaj::Performer` array; safe release after `activeIndex.store` + RT acquire-load shows RT no longer touches old; render loop identical to first pass: `setBlockSize→setInputFrames→advance→copyOutputFrames`). Toolchain/SDK reality inherited from `C:/Users/doner/SSI/g1a/_run/SDK-GROUNDING.md` and `C:/Users/doner/SSI/g1a/_run/SMOKE-TEST-REPORT.md`. Concurrent two-performer ownership/advance/mix is **already PROVEN** by the first-pass FINAL PASS (`C:/Users/doner/SSI/g1a/_run/PRE-REGISTRATION.md`).
**Decisions already made (NOT relitigated here):**
- **D-B DECIDED:** a **bespoke C++ host** over Cmajor's **native C++ API**. **NOT** a JUCE plugin host, **NOT** cmaj standalone.
- **Concurrency is PROVEN** (first-pass FINAL PASS): two live performers can be owned, advanced, and mixed concurrently, ASan-clean, bit-exact, zero xruns. This pass builds **on top of** that result; it does not re-test it.
- **Reload API shape is GROUNDED and FIXED** (RELOAD-GROUNDING §1–§5): two-Engine pattern, `std::atomic<uint32_t>` active-index swap, COM-atomic ref-counted safe release, host-side crossfade. This pass does not relitigate the API shape; it tests whether that shape actually delivers a click-free, race-safe, deterministic hot-swap.
- Out of scope for this pass (later passes): event-replay across reload, transport-sync, latency-compensation, multi-authority, full TSan/Linux certification (§10).

**Claim labels used throughout:**
- **[ARCH]** — an architectural commitment of the spike (how the host is built / what is measured).
- **[SPIKE]** — a claim whose evidentiary standard is **pilot/spike-grade Windows-only** evidence; the heavier standard (true data-race certification) is a **separate later Linux/TSan pass** (§10), not this run.
- **[GATE]** — a binary, decision-forcing pass/fail criterion that this pre-registration locks.

**Integrity crux (non-negotiable, applies to every section):** It must be **structurally possible for this spike to FAIL.** The metrics below are constructed so that real defects (a JIT global lock stalling the live performer during background compile; a torn read or use-after-free on swap; a click at the swap boundary; wrong crossfade math; a cloned-not-recompiled B; a race making output interleaving-dependent; a dropped block at the boundary) produce real failures, not so that the spike is guaranteed to pass. Concrete failure paths each metric catches are enumerated in §2.4. A specification under which the spike **cannot** fail is a falsifier-defeating fraud and is explicitly out of bounds. See §2.

---

## 1. Hypotheses

### 1.1 Primary hypothesis H1 (the reload-bridge claim) [GATE][SPIKE]

> **H1 (directional).** A **live** Cmajor performer **A** (a 440 Hz sine, already advancing on the RT thread) can be replaced by a **freshly BACKGROUND-JIT-COMPILED** performer **B** (an `880` Hz sine — a *genuinely different program* compiled at runtime on a **non-RT worker thread** via a **second `cmaj::Engine`** while A is live), **swapped into the running audio thread via a lock-free `std::atomic<uint32_t>` active-index handoff at a pre-committed block boundary**, and **CROSSFADED A→B while live** over a locked `W_XFADE = 64`-block window, **with ZERO xruns during the background-compile window, NO audible discontinuity (click-free), correct crossfade math, ref-count-safe release of the old performer only AFTER the crossfade completes, AddressSanitizer-clean, and bit-exact determinism across `R = 5` seeded repeats** — for a locked total of `N = 10,000` blocks of `256` frames at `48,000` Hz.

The directional prediction is: *the regenerate-and-reload bridge (background compile → atomic swap → live crossfade → safe release) is feasible AT ALL on this Windows host, to the locked tolerances of §5.*

### 1.2 Explicit FALSIFICATION condition (what would refute H1) [GATE]

> **H1 is FALSIFIED** if **any** of the following occurs under the locked run (§4–§5): (a) performer A suffers **one or more xruns during the background-compile window**, or the background compile of B returns a non-`Ok`/`false` result, or B is **not ready before the locked crossfade-start block** (**R1 fails**); or (b) the RT thread suffers a **torn read, use-after-free, or any ASan/CRT violation** on the atomic swap, or the **old performer is released before the crossfade completes**, or the swap does **not** occur at the locked block index (**R2 fails**); or (c) the live crossfade exhibits an **audible discontinuity** (a sample-to-sample jump above the locked click threshold), or the **crossfade math is wrong** (mix identity violated beyond `ε_xfade`), or `α` is not monotone `0→1`, or **B's distinct frequency is not present post-window** / **A's frequency is not present pre-window** (proving B was not a genuinely different recompiled program) (**R3 fails**); or (d) the rendered output is **not bit-identical across the `R = 5` seeded repeats**, or the total blocks rendered ≠ `N`, or the swap block ≠ the locked index, or any block is **dropped or duplicated across the boundary** (**R4 fails**).

A single failing metric ⇒ **FINAL FAIL** ⇒ the pre-declared fallback (§8) fires verbatim. There is no partial pass.

### 1.3 What is explicitly NOT claimed by this pass [SPIKE]

- This pass does **not** claim a certified **absence of data races**. TSan does not exist on Windows under MSVC or clang-cl (SDK-GROUNDING §6.2; SMOKE-TEST §7; RELOAD-GROUNDING §7.3). The Windows-feasible correctness strategy here is **ASan-clean + deterministic seeded adversarial-interleaving stress with a bit-reproducibility invariant + a static no-unsynchronized-shared-mutable-state audit on the swap/release path** (§3). A **full TSan certification of the swap/release path is pre-declared as a SEPARATE LATER Linux pass and is OUT OF SCOPE here** (§10).
- This pass does **not** claim event-replay across reload, transport-sync, latency-compensation, or multi-authority hot-swap. Those are **later passes** (§10).
- This pass is **pilot/spike-grade**: a **single** A→B reload event, two trivial octave-apart sine patches, `N = 10,000` blocks (≈ 53.3 s), `R = 5`, Windows-only. A PASS clears the *cheap reload-bridge falsifier* so heavier investment in regenerate-and-reload may proceed; it is not a production hot-reload guarantee.

---

## 2. Integrity crux — why this spike can genuinely FAIL

### 2.1 The reload-bridge hypotheses (the things that can break) [ARCH]

The reload bridge stacks **four** new failure surfaces on top of the proven concurrency result, each independently capable of breaking the bridge:

1. **Background-compile disruption.** RELOAD-GROUNDING §1 establishes there is **no async build API** — background compile is a full synchronous `create→load→link→createPerformer` on a second Engine on a worker thread. If `CmajPerformer.dll` holds a **global JIT/LLVM lock**, a **shared codegen arena**, or a **process-wide allocator lock**, the worker-thread compile can **stall the live RT performer A** mid-`advance()`, producing an xrun. This is the central unverified risk of background compile and **R1** exists to catch it.
2. **Swap-handoff unsafety.** RELOAD-GROUNDING §2 establishes `cmaj::Performer` is **not** value-atomic (it is a ref-counted COM wrapper); the handoff is an `std::atomic<uint32_t>` index. If the acquire/release fences are wrong, the RT thread can **tear-read** the index or use a **half-published** performer, and if the old performer is released too early the RT thread suffers a **use-after-free**. **R2** exists to catch this (ASan + locked-block + post-crossfade-release ordering).
3. **Crossfade audible discontinuity / wrong math.** The crossfade is host-side mixing (RELOAD-GROUNDING §4). A wrong `α` schedule, a block-boundary step, a swap that lands mid-window, or a buffer mismatch produces an audible **click** or a **mix-identity violation**. **R3** exists to catch this.
4. **B-is-not-really-recompiled.** The whole claim is that B is a *genuinely different program JIT-compiled at runtime on the worker thread*, not a clone of A. If the harness accidentally re-used A's program/IR, the post-window spectrum would still be 440 Hz. **R3's frequency-domain endpoint test** (440 present pre-window, 880 present post-window, in distinct DFT bins) exists to catch exactly this.
5. **Hidden race / non-determinism / boundary drop.** A race on the swap/crossfade host buffers, or a dropped/duplicated block at the boundary, makes output interleaving-dependent or block-incomplete. **R4** exists to catch this.

### 2.2 The spike is NOT rigged to pass [ARCH]

- **R1 xruns can genuinely appear.** If background JIT contends a global lock, the live performer stalls → xrun > 0 during the compile window → FAIL. Nothing in the host suppresses or hides RT stalls.
- **R1 compile can genuinely not finish in time.** If JIT of B is slower than the budget of blocks before the locked crossfade start, B is not ready → `compile_completed_before_xfade = false` → FAIL.
- **R2 ASan / use-after-free can genuinely fire.** A premature release of the old performer, or a torn index read, produces a real ASan report. ASan is verified working on this host (SMOKE-TEST §7) and is a real detector.
- **R3 click can genuinely appear.** A discontinuity at the swap boundary produces a sample-to-sample jump above `S_click`. The threshold is set **above** the natural per-sample slew of the 880 Hz tone and **below** a real click, so a clean crossfade passes and a real click fails (§5.3).
- **R3 frequency endpoint can genuinely fail.** If B is a clone of A (not recompiled), 880 Hz will be absent post-window → FAIL. Nothing forces 880 Hz to appear except a genuinely different compiled program.
- **R4 determinism can genuinely differ.** A race on the host crossfade buffers makes output interleaving-dependent → the `R = 5` SHA-256 hashes diverge → FAIL.

### 2.3 No metric is auto-satisfied [GATE]

Each of the four metrics has a concrete, pre-committed numeric threshold (§5) and at least one named real-world failure path (§2.4). The first-pass concurrency PASS does **not** imply the reload bridge passes — background compile, atomic swap, live crossfade, and safe release are **four new mechanisms** not exercised by the first pass.

### 2.4 Enumerated failure paths (each maps to a metric) [ARCH]

| # | Failure path | Caught by |
|---|---|---|
| FR1 | Background JIT contends a global lock / shared codegen arena → live performer A stalls mid-`advance()` → xrun during compile window | **R1** (xrun_during_compile) |
| FR2 | Background JIT of B too slow → B not ready before the locked crossfade-start block | **R1** (compile_completed_before_xfade) |
| FR3 | Background compile returns non-`Ok`/`false` (parse/load/link/createPerformer failure) | **R1** (compile_result) |
| FR4 | Torn read / half-published performer on the atomic index handoff (bad acquire/release fence) | **R2** (ASan + swap_block + result_violations) |
| FR5 | Old performer released BEFORE crossfade completes / while RT may still touch it → use-after-free | **R2** (ASan + old_perf_released_post_crossfade) |
| FR6 | Swap lands at the wrong block (index glitch, double-flip, missed flip) | **R2 / R4** (swap_block == locked index) |
| FR7 | Click / discontinuity at the swap boundary or a block-boundary `α` step | **R3** (click_max ≤ S_click) |
| FR8 | Wrong crossfade math (mix ≠ (1−α)·A + α·B; α not monotone 0→1) | **R3** (mix_err, alpha_monotone) |
| FR9 | B is a clone of A, not a genuinely recompiled different program → distinct freq absent post-window | **R3** (rel880_post, rel440_pre, cross-leak) |
| FR10 | Hidden race on host crossfade/swap buffers → output interleaving-dependent | **R4** (repro_ok across R seeded repeats) + **R2** (ASan) |
| FR11 | Dropped / duplicated block across the swap boundary; wrong total block count | **R4** (blocks_rendered == N; contiguous index) |

---

## 3. Reload-correctness strategy (Windows-feasible, locked) [ARCH][SPIKE]

Because TSan is unavailable on Windows (SDK-GROUNDING §6.2; RELOAD-GROUNDING §7.3), reload correctness is established by the **conjunction** of four Windows-feasible mechanisms, each independently checkable by the verifier:

1. **ASan-clean across the full reload run** (`/fsanitize=address`, verified available — SMOKE-TEST §7), plus MSVC CRT debug-heap corruption checking (`_CrtSetDbgFlag(_CRTDBG_ALLOC_MEM_DF | _CRTDBG_CHECK_ALWAYS_DF)`). Detects torn-read use-after-free, premature-release use-after-free, double-free, and overruns on the swap/crossfade/release paths.
2. **Deterministic seeded adversarial-interleaving stress with a bit-reproducibility invariant.** The reload run is executed `R = 5` times; repeat `r = 0` is clean, repeats `r = 1..4` apply a **seeded** schedule of interleaving perturbations (yields/spins) on the worker (compile) thread and on the RT thread around the swap window (§4.5). **The audio output must be bit-identical across all `R` repeats.** Critically, the crossfade and swap are scheduled by **block index** (`K_XFADE_START`, `K_SWAP`), **not** by background-compile completion time — so a *correct* implementation is deterministic regardless of when the worker-thread compile happens to finish (it need only finish before `K_XFADE_START`). A race on the swap/crossfade host buffers would make output interleaving-dependent → caught as a determinism failure. This is the Windows-feasible stand-in for TSan: races manifest as non-determinism.
3. **Static no-unsynchronized-shared-mutable-state audit on the swap/release path (locked design constraint).** Per RELOAD-GROUNDING §2–§3 and §5: the **only** cross-thread synchronization between the RT thread and the worker thread is the `std::atomic<uint32_t> activeIndex` (and the publication of `performers[1]` *happens-before* the `store(release)` that the RT thread observes via `load(acquire)`). The worker thread **never** touches `performers[idx]` while the RT thread might; the RT thread **never** touches the Engine objects. Old-performer release happens **only after** the RT thread's acquire-load has demonstrably moved to the new index and the crossfade window has fully elapsed. The verifier checks the implementation honors this design.
4. **Determinism-by-schedule of the swap (locked).** The swap is bound to a **pre-committed block index**, decoupling audio determinism from compile-timing jitter. This is what makes R4 sound in the presence of a genuinely non-deterministic (wall-clock-varying) background compile.

**This conjunction is the locked reload-correctness metric for this pass. "TSan-clean" is NOT a pass requirement here** and is pre-declared as a separate later Linux pass (§10).

---

## 4. The locked run design (what is executed)

> Full buildable detail is in the companion `HARNESS-SPEC.md`. This section locks the parameters the verifier checks against; the spec implements **these and only these**.

### 4.1 Toolchain (locked, inherited from first-pass verified reality) [ARCH]
- Compiler **MSVC `cl.exe` 19.50** (VS18 BuildTools), invoked under `vcvars64.bat`; **C++17** (`/std:c++17 /EHsc`).
- `/DCMAJOR_DLL=1`; include root `C:/Users/doner/SSI/g1a/_run/cmajor-headers/include`; single include `cmajor/API/cmaj_Engine.h`.
- DLL: `C:/Users/doner/SSI/g1a/_run/CmajPerformer.dll` (**v1.0.3159**), loaded via `cmaj::Library::initialise(...)`; copied next to the host `.exe`.
- ASan build adds `/fsanitize=address`; runtime needs `clang_rt.asan_dynamic-x86_64.dll` (present at `g1a/_run/`).

### 4.2 Audio + timeline parameters (locked) [ARCH]
- Sample rate **`fs = 48,000` Hz**; block size **`B_block = 256` frames** (mono, 1 channel); **`N = 10,000`** total blocks rendered to the master output (≈ 53.333 s).
- Per-block real-time budget **`D_block = B_block / fs = 256 / 48000 = 5.33333… ms`** (the deadline an xrun is measured against — §5.1).
- **`K_COMPILE_START = 100`** — the block on A's RT timeline at which the worker thread is dispatched to background-compile B.
- **`K_XFADE_START = 4000`** — the pre-committed block at which the live A→B crossfade begins (first crossfaded block).
- **`W_XFADE = 64`** blocks — the locked crossfade window length (`W_XFADE · B_block = 16,384` crossfade samples ≈ 341 ms).
- **`K_SWAP = K_XFADE_START + W_XFADE = 4064`** — the pre-committed block at which the crossfade completes, `activeIndex` is `store`d `0→1`, and output becomes pure B. This is the locked "swap block."
- **`P_MEAS = 512`** blocks — the pre/post measurement-window length for the R3 frequency-endpoint test. Pre-window `A_PRE = [K_XFADE_START − P_MEAS, K_XFADE_START) = [3488, 4000)` (pure A); post-window `B_POST = [K_SWAP, K_SWAP + P_MEAS) = [4064, 4576)` (pure B).
- Repeats **`R = 5`** seeded interleaving repeats (§4.5).
- Master seed **`SEED_MASTER = 0x6121A_0002`** (fixed registered constant, distinct from the first pass's `0x6121A_0001`; drives only the interleaving-perturbation schedule — the audio itself is deterministic by block-indexed schedule, §3).

Timeline phases on the master output: blocks `[0, 4000)` pure A; blocks `[4000, 4064)` live crossfade (both A and B advancing, host-mixed); blocks `[4064, 10000)` pure B.

### 4.3 The two reload patches (locked) [ARCH] — *music register is load-bearing here*
Two **self-oscillating sine** processors, an **octave apart** so their spectra fall in **distinct DFT bins** (the musical register is load-bearing: the octave separation **A4 = 440 Hz → A5 = 880 Hz** is what makes the R3 endpoint-presence test provable in the frequency domain — "B's tone appears post-window where it was absent pre-window"):
- **Performer A — `SineA` :** a `440` Hz sine (A4), self-oscillating, no input stream. Output endpoint `out` (stream float). Loaded into **Engine A on the main thread before any RT work** — the *live* performer.
- **Performer B — `SineB` :** an `880` Hz sine (A5, one octave up), self-oscillating, no input stream. Output endpoint `out` (stream float). Loaded into a **second `cmaj::Engine` (Engine B) on the WORKER thread at runtime** while A is live (RELOAD-GROUNDING §1) — the *background-compiled* performer.

`SineB` is a **genuinely different program** (different frequency constant ⇒ a distinct JIT compile), compiled at runtime on the worker thread — **not** a clone of A, **not** pre-built on the main thread. The control frequency `660` Hz (present in neither patch) is the leakage/false-positive bin. Exact patch source is locked in `HARNESS-SPEC.md`. Phase initialisation is fixed (phase 0 at each performer's first advanced block) so all renders are deterministic.

### 4.4 Thread + swap + crossfade model (locked) [ARCH]
- **Main thread:** loads `Library`; creates Engine A; parses/loads/links `SineA`; creates Performer A; `setBlockSize(256)`. Allocates the 2-element `cmaj::Performer performers[2]` array (`performers[0] = A`, `performers[1] = {}`), the `std::atomic<uint32_t> activeIndex{0}`, and host crossfade buffers. Starts the RT thread and (at `K_COMPILE_START`) the worker thread.
- **RT thread (single, owns the render loop — RELOAD-GROUNDING §5):** for each block `k = 0..N−1`: `idx = activeIndex.load(acquire)`; render the active performer(s) and write the master output for block `k`. Outside the crossfade window only `performers[idx]` is advanced; inside `[K_XFADE_START, K_SWAP)` **both** `performers[0]` and `performers[1]` are advanced and host-mixed (§4.5 crossfade math). The RT thread never touches Engine objects (RELOAD-GROUNDING §5).
- **Worker (BG compile) thread:** dispatched at `K_COMPILE_START`. Runs the full synchronous `Engine::create → Program::parse(SineB) → setBuildSettings → load → getEndpointHandle("out") → link → createPerformer` on **Engine B** (RELOAD-GROUNDING §1, §4). On success, publishes `performers[1] = engineB.createPerformer()` and `setBlockSize(256)` on it, then signals "B ready" (a `std::atomic<bool> bReady` with release semantics) — **all before `K_XFADE_START`**. The worker never touches the RT performer; it never touches `activeIndex` except as designed.
- **The atomic swap (RELOAD-GROUNDING §2):** at block `K_SWAP`, after the crossfade window has fully elapsed, the RT thread (the sole writer of `activeIndex` at swap time) performs `activeIndex.store(1, release)`. From `K_SWAP` onward the RT thread's `load(acquire)` returns `1` and it advances only `performers[1]`.
- **Safe release (RELOAD-GROUNDING §3):** the old performer `performers[0]` is released (`performers[0] = {}`, COM-atomic decrement) **only after** (i) the crossfade window has fully elapsed (block ≥ `K_SWAP`) **and** (ii) the RT thread has performed at least one `load(acquire)` returning `1` (so it provably no longer references `performers[0]`). Engine A is released after Performer A. `old_perf_release_block` is recorded.
- **Crossfade is the only place both performers advance.** No host mutable buffer is written by both the RT thread and the worker thread without the `activeIndex`/`bReady` atomics mediating publication; the worker writes `performers[1]` and `bReady`, the RT thread reads them via acquire after the worker's release (§3.3).

### 4.5 Crossfade math + adversarial-interleaving stress (locked) [ARCH]
- **Crossfade schedule (per-sample linear, click-free by construction):** over the crossfade window of `W_XFADE · B_block = 16,384` samples, define `α(n) = n / (W_XFADE · B_block − 1)` for `n = 0..16383` (the sample offset from the first crossfade sample). `α` is **per-sample**, monotone non-decreasing, with `α(0) = 0.0` and `α(16383) = 1.0`. Master output during the window: `out[n] = (1 − α(n)) · A[n] + α(n) · B[n]`. Per-sample (not per-block) interpolation guarantees no block-boundary step. Both A and B advance every crossfade block; the host mixes their copied output frames.
- **Repeat `r = 0`: clean / timing-reference run** — **no** perturbation injected. R1's xrun-during-compile and the per-block timing distribution are measured on repeat 0 only (injected sleeps would inflate timings; the deadline metric must reflect real compute cost).
- **Repeats `r = 1..4`:** each derives a deterministic perturbation schedule from `hash(SEED_MASTER, r)` and injects bounded yields/short spins (i) on the worker thread during the compile (to vary when B becomes ready relative to A's block progress) and (ii) on the RT thread in the blocks immediately around `K_SWAP` (to vary the swap/release interleaving). The audio output of every repeat — full master output, the A-stream, the B-stream, and the crossfade region — must be **bit-identical to repeat 0** (§5.4). This is the load-bearing demonstration that the swap/crossfade/release is race-free under the sampled interleavings.

### 4.6 The reference (solo) renders (locked) [ARCH]
Independently, render **A_solo** (pure `SineA`, single-threaded, `P_MEAS` blocks at the pre-window phase) and **B_solo** (pure `SineB`, single-threaded, `P_MEAS` blocks at the post-window phase) to normalise the R3 Goertzel magnitudes. These reference renders use the same phase initialisation as the corresponding windows so the normalisation is exact.

---

## 5. The four pre-registered reload metrics + the reload-PROOF artifact

Each metric has an **exact, deterministic, computable estimator** and a **concrete pre-committed PASS threshold**. All thresholds are predictions/requirements fixed now, never measurements.

### 5.1 R1 — Background-compile non-disruption [GATE]
**Estimator.** While performer A is live and advancing, the worker thread (dispatched at `K_COMPILE_START`) background-JIT-compiles B. Define the **compile window** as the interval on A's RT timeline `[K_COMPILE_START, K_COMPILE_DONE]`, where `K_COMPILE_DONE` is the block index at which the worker signals `bReady`. On the **clean repeat 0**:
- `xrun_during_compile` = count of blocks `k ∈ [K_COMPILE_START, K_COMPILE_DONE]` whose RT per-block processing time `t_k` exceeds `D_block` (high-resolution `QueryPerformanceCounter`).
- `compile_result` = `Ok` iff every worker-thread API call (`Program::parse`, `Engine::load`, `Engine::link`, `Engine::createPerformer`, `Performer::setBlockSize`) succeeded (`bool == true` / `Result == Ok`).
- `compile_completed_before_xfade` = `true` iff `K_COMPILE_DONE < K_XFADE_START` (B is ready before the crossfade must begin).

**PASS threshold (all must hold):** `xrun_during_compile == 0` **AND** `compile_result == Ok` **AND** `compile_completed_before_xfade == true`. *(Reported alongside, not gated: `K_COMPILE_DONE ≤ 3900`, i.e. ≥ 100 blocks margin before `K_XFADE_START` — informative headroom expectation, not a gate.)*
**Falsifies via:** FR1, FR2, FR3 (§2.4).

### 5.2 R2 — Atomic / lock-free swap safety [GATE]
**Estimator.** Over the full reload run (all `R` repeats; ASan build for the safety counts):
- `asan_violations` = count of AddressSanitizer reports; `crt_heap_violations` = count of CRT debug-heap corruption reports.
- `result_violations` = count of `Performer` API calls (`setBlockSize`, `setInputFrames`, `advance`, `copyOutputFrames`) returning `Result ≠ Ok` across the whole run.
- `swap_block` = the block index at which `activeIndex` transitions `0 → 1` (read from `trace.log`); `swap_count` = number of `0→1` transitions (must be exactly 1).
- `old_perf_released_post_crossfade` = `true` iff `old_perf_release_block ≥ K_SWAP` **AND** the release occurred after the RT thread performed at least one `load(acquire)` returning `1` (ordering recorded in `trace.log`).

**PASS threshold (all must hold):** `asan_violations == 0` **AND** `crt_heap_violations == 0` **AND** `result_violations == 0` **AND** `swap_block == K_SWAP (= 4064)` **AND** `swap_count == 1` **AND** `old_perf_released_post_crossfade == true`.
**Falsifies via:** FR4, FR5, FR6 (§2.4).

### 5.3 R3 — Click-free crossfade correctness [GATE]
**Estimator (three independent checks, all required):**
- **(a) Crossfade mix identity + monotone α.** Over the `16,384` crossfade-window samples (repeat 0): `mix_err = max_n |out[n] − ((1 − α(n)) · A[n] + α(n) · B[n])|` where `A[n]`, `B[n]` are the per-performer copied outputs for that sample and `α(n)` is the locked schedule (§4.5). `alpha_monotone = true` iff `α` is non-decreasing with `α(first) == 0.0` and `α(last) == 1.0`.
- **(b) Click-free (slew bound).** `click_max = max_k |out[k] − out[k−1]|` over the **full** master output (`N · 256 = 2,560,000` samples, repeat 0), with special attention to the crossfade boundaries `K_XFADE_START` and `K_SWAP`. The threshold `S_click` is locked **above** the natural per-sample slew of the highest tone (an 880 Hz unit sine has max per-sample delta `2π·880/48000 ≈ 0.115`) and **below** a real click (a swap discontinuity is a large jump up to ≈ 2.0): `S_click = 0.15`.
- **(c) Frequency-domain endpoint presence (B is genuinely a different recompiled program).** Goertzel magnitude at `440`, `880`, `660` (control) over the pre-window `A_PRE` and post-window `B_POST` (each `P_MEAS · 256 = 131,072` samples, repeat 0), normalised by the solo references (§4.6): `rel440_pre = mag_Apre(440)/mag_Asolo(440)`; `rel880_post = mag_Bpost(880)/mag_Bsolo(880)`; cross-leakage `leak880_pre = mag_Apre(880)/mag_Asolo(440)`, `leak440_post = mag_Bpost(440)/mag_Bsolo(880)`, `relCtl = max(mag_Apre(660), mag_Bpost(660)) / max(mag_Asolo(440), mag_Bsolo(880))`.

**PASS threshold (all must hold):** `mix_err ≤ ε_xfade = 1e-6` **AND** `alpha_monotone == true` **AND** `click_max ≤ S_click = 0.15` **AND** `rel440_pre ≥ 0.40` **AND** `rel880_post ≥ 0.40` **AND** `leak880_pre ≤ 0.10` **AND** `leak440_post ≤ 0.10` **AND** `relCtl ≤ 0.10`.
**Falsifies via:** FR7, FR8, FR9 (§2.4). *(440 strong pre / weak post and 880 weak pre / strong post in distinct DFT bins is the decisive proof that B is a genuinely different program compiled at runtime, not a clone of A.)*

### 5.4 R4 — Determinism + completeness (bit-exact) [GATE]
**Estimator (three independent checks, all required):**
- **(a) Interleaving determinism.** For the full master output, the A-stream, the B-stream, and the crossfade region, compute the SHA-256 of the full rendered float buffer for **every** repeat `r = 0..4`. `repro_ok ≡` all `R` hashes are identical per stream (output invariant under the seeded adversarial interleavings of §4.5, including the swap-window perturbations).
- **(b) Block completeness.** `blocks_rendered` = number of master-output blocks written; the block-index sequence written to the output must be contiguous `0..N−1` with no gap or repeat (`dropped_blocks == 0`, `duplicated_blocks == 0`).
- **(c) Swap location.** `swap_block == K_SWAP` (cross-checked against R2).

**PASS threshold (all must hold):** `repro_ok == true` (all `R = 5` per-stream hashes bit-identical) **AND** `blocks_rendered == N (= 10,000)` **AND** `dropped_blocks == 0` **AND** `duplicated_blocks == 0` **AND** `swap_block == K_SWAP (= 4064)`.
**Falsifies via:** FR10, FR11, FR6 (§2.4).

### 5.5 The reload-PROOF artifact (must exist and be machine-checkable) [GATE]
A concrete saved bundle under `C:/Users/doner/SSI/g1a/_run-reload/artifacts/` that the verifier can inspect without re-running the spike:
1. **`trace.log`** — header (locked params, DLL version `1.0.3159`, toolchain); per-block RT Result-audit; the compile-window timing summary and `K_COMPILE_DONE`; the worker-thread compile Result-audit; the `activeIndex` transition record (`swap_block`, `swap_count`); the `old_perf_release_block` and the RT-acquire-load ordering proving release was post-crossfade; the repeat-0 per-block timing distribution (`p50/p99/max`, xrun list if any); and the **captured ASan/CRT stderr** for the ASan build (or an explicit `ASAN: no reports` line).
2. **Rendered sample dumps (the four required, plus normalisation references)** — **`A_pre.wav`** (pre-window pure-A region), **`B_post.wav`** (post-window pure-B region), **`crossfade_region.wav`** (the `16,384`-sample crossfade window), **`full_output.wav`** (the entire `N·256` master output) — each mono, `fs = 48,000`, 32-bit float (or raw `float32 .pcm` with a sidecar describing `fs`, channels, sample count). Plus auxiliary `A_solo.wav`, `B_solo.wav` (R3 normalisation references) and the per-performer `A_xfade.wav`, `B_xfade.wav` crossfade-region buffers (R3 mix-identity inputs).
3. **`metrics.json`** — machine-checkable JSON containing, for each metric R1–R4: the computed estimator values, the locked threshold, and a boolean pass; plus `asan_clean` (bool), all run parameters (`fs`, `B_block`, `N`, `K_COMPILE_START`, `K_XFADE_START`, `W_XFADE`, `K_SWAP`, `P_MEAS`, `R`, `SEED_MASTER`, DLL version `1.0.3159`, `freq_a`, `freq_b`, `freq_ctl`, `S_click`, `EPS_XFADE`), the `R` per-stream SHA-256 hashes, and the final verdict.

**PASS threshold:** all three components exist, are well-formed, and `metrics.json` is internally consistent with the dumps (its hashes match the dumped buffers).

---

## 6. Decision rule — FINAL PASS / FINAL FAIL (locked) [GATE]

The verdict is a **deterministic function** of §5, fixed before any result exists:

> **FINAL PASS** iff **all four metrics clear their thresholds** — `R1 ∧ R2 ∧ R3 ∧ R4` — **AND** the reload-PROOF artifact (§5.5) exists and is well-formed **AND** ASan is clean (`asan_violations == 0`, restated as an independent gate).
>
> **FINAL FAIL** otherwise — i.e. **any** metric fails its threshold, **or** the proof artifact is missing/malformed, **or** any ASan/CRT violation is reported.

There is **no partial pass**. On **FINAL FAIL**, the pre-declared fallback (§8) fires verbatim. The verifier (§9) independently recomputes the four metrics from the proof artifact; if any threshold was tuned, or either frozen file's SHA-256 changed, the run is FAILED regardless of the computed metrics.

| Condition | Verdict | Action |
|---|---|---|
| `R1 ∧ R2 ∧ R3 ∧ R4` all pass **and** proof artifact exists **and** ASan clean | **FINAL PASS** (pilot/spike-grade, Windows-only) | Regenerate-and-reload bridge (background compile → atomic swap → live click-free crossfade → safe release) is feasible AT ALL; investment in the reload bridge may proceed to later passes (§10). Full TSan/Linux certification of the swap path still owed (§10). |
| any metric fails, **or** proof artifact missing/malformed, **or** any ASan/CRT violation | **FINAL FAIL** | Fire §8 verbatim: investment-freeze → silence-boundary reload fallback. |

---

## 7. Locked-parameter summary [GATE]

Fixed at this pre-registration; may **not** change after any result exists: `fs = 48,000 Hz`; `B_block = 256` frames; `N = 10,000` blocks; `D_block = 5.33333 ms`; `K_COMPILE_START = 100`; `K_XFADE_START = 4000`; `W_XFADE = 64` blocks; `K_SWAP = 4064`; `P_MEAS = 512` blocks (`A_PRE = [3488, 4000)`, `B_POST = [4064, 4576)`); `R = 5` repeats; `SEED_MASTER = 0x6121A_0002`; patches `SineA = 440 Hz` (Engine A, main thread, live), `SineB = 880 Hz` (Engine B, **worker-thread runtime compile**), control bin `660 Hz`; `std::atomic<uint32_t>` active-index swap into `cmaj::Performer[2]`; per-sample linear `α` crossfade; tolerances `ε_xfade = 1e-6`, `S_click = 0.15`, `rel440_pre ≥ 0.40`, `rel880_post ≥ 0.40`, `leak880_pre ≤ 0.10`, `leak440_post ≤ 0.10`, `relCtl ≤ 0.10`, `xrun_during_compile == 0`, `result_violations == 0`, `asan_violations == 0`, `swap_count == 1`, `blocks_rendered == 10,000`, `swap_block == 4064`; DLL `CmajPerformer.dll v1.0.3159`; toolchain MSVC `cl 19.50`, C++17, `/DCMAJOR_DLL=1`, `/fsanitize=address` for the ASan build. The companion `HARNESS-SPEC.md` implements these **and only these**. Any deviation observed during execution **invalidates the run under this seed**; it does **not** license post-hoc re-tuning.

---

## 8. PRE-DECLARED FALLBACK (committed BEFORE results — quotable verbatim on FINAL FAIL) [GATE]

> **PRE-DECLARED FALLBACK — G1A reload-bridge pass (committed before any result exists):**
>
> **On FINAL FAIL of the G1A reload-bridge spike, the verdict is: `investment-freeze on fail → silence-boundary reload fallback`.**
>
> **(1) Investment-freeze** means: **immediately HALT all further investment in the live crossfade reload bridge.** No additional engineering is spent on background-compiled atomic-swap live-crossfade hot-reload of `cmaj::Performer` instances. The later reload-bridge passes (event-replay across reload, transport-sync, latency-compensation, multi-authority) are **NOT started**. The live-crossfade-swap question is **escalated to Donald** for a platform decision. The freeze **persists until the swap/release path is certified on a TSan-capable platform** (Linux x64, `-fsanitize=thread`) — the separate later pass declared OUT OF SCOPE in §10.
>
> **(2) Silence-boundary reload fallback** means: the SSI DAW ships, in the interim, the **reload model already PROVEN in pass 1** — a **single-performer-at-a-time** reload with **no live crossfade**. To reload from patch A to a freshly compiled patch B, the host **stops performer A to digital silence at the boundary** (advance A to the boundary block, then hold the output at zero samples), background-compiles B as in pass 1's proven concurrency model, and only then **starts performer B** from silence. **There is NO live A→B crossfade of two simultaneously-live performers** in this fallback — the click-free live-crossfade reload remains blocked until the reload bridge is proven on a TSan-capable platform (§10). This trades the seamless live-crossfade reload for the **already-PROVEN** correctness of pass 1 (concurrent ownership + single-performer render: Gain 0.5, XRuns 0, ASan clean, bit-exact).
>
> This block is quotable **verbatim** by the shape's verdict phase on FINAL FAIL.

---

## 9. Verifier contract (falsifier-first) [GATE]

The orchestrator SHA-256-**freezes** `PRE-REGISTRATION.md` and `HARNESS-SPEC.md` immediately after they are written. An independent verifier later:
1. **FAILS the run if either frozen file's SHA-256 changed** (any threshold tuned, any parameter edited post-lock).
2. **FAILS the run if any §5 threshold present in the executed run differs** from the value locked here (threshold tuning after results).
3. **Recomputes R1–R4 independently from the proof artifact** (§5.5) — not from the implementer's narrative — including re-running Goertzel on `A_pre.wav`/`B_post.wav`, recomputing `mix_err` from `crossfade_region.wav`/`A_xfade.wav`/`B_xfade.wav`, recomputing `click_max` from `full_output.wav`, and re-hashing every dumped buffer to confirm the `R` per-stream SHA-256 values and bit-reproducibility.
4. **Confirms ASan-clean** from the captured ASan run log.
5. **Confirms the no-unsynchronized-shared-mutable-state design on the swap/release path** (§3.3) is honored: the only RT↔worker synchronization is `activeIndex` (+ `bReady` publication); the worker never touches the live performer; old-performer release is provably post-crossfade and post-acquire-load.
6. **Confirms B was a genuinely different runtime compile** (R3c: 880 Hz present post-window in its distinct bin, absent pre-window) and that the swap landed at the locked block (`swap_block == 4064`, `swap_count == 1`).
7. Issues **FINAL PASS** only if §6's conjunction holds; otherwise **FINAL FAIL** and quotes §8 verbatim.

---

## 10. OUT OF SCOPE (explicit — these are LATER passes) [ARCH]

The following are **NOT** part of this reload-bridge pass and are **not** gated here:
- **Event-replay across reload** (sample-accurate event/MIDI state carried from A to B across the swap).
- **Transport-sync** (shared tempo/playhead/transport preserved across the reload).
- **Latency-compensation** (aligning differing performer latencies across the swap).
- **Multi-authority** (more than one writer of `activeIndex` / multiple concurrent reload authorities).
- **Full ThreadSanitizer / data-race certification of the swap/release path** — TSan does **not** exist on Windows under MSVC or clang-cl (SDK-GROUNDING §6.2; SMOKE-TEST §7; RELOAD-GROUNDING §7.3). A certified absence of data races on the atomic-index handoff requires **cross-compiling this same harness for Linux x64 and running it under `-fsanitize=thread`**. That is a **separate later Linux pass** and is **explicitly out of scope here**; this Windows pass uses the §3 Windows-feasible conjunction instead and must **not** be gated on TSan.

---

## 11. Honest limitations (locked) [SPIKE]

- **Windows-only.** All evidence here is from one Windows x64 host with MSVC `cl 19.50` and `CmajPerformer.dll v1.0.3159`. Results may not transfer to other platforms/DLL versions.
- **No TSan.** Swap/release correctness rests on ASan + determinism-under-adversarial-interleaving + a static synchronization audit (§3), **not** on a thread-race certifier. A subtle race on the `activeIndex` handoff that happens to produce identical output under the `R = 5` sampled interleavings could escape detection; the load-bearing certification is the later Linux/TSan pass (§10).
- **Single reload event, pilot/spike-grade.** One A→B reload, two trivial octave-apart sines, `N = 10,000` blocks (≈ 53.3 s), `R = 5`. Not a soak test, not repeated rapid reloads, not a statistical guarantee.
- **Compile-timing is genuinely non-deterministic; audio determinism is by schedule.** The background compile finishes at a wall-clock-varying block, but the crossfade/swap are bound to fixed block indices (`K_XFADE_START`/`K_SWAP`), so audio is deterministic **provided** the compile finishes before `K_XFADE_START` (R1). If it does not, that is a real FAIL, not a tolerance — intentional.
- **Determinism assumes deterministic DSP.** The sine patches are deterministic by construction; exact-equality (bit-exact) is the strict, honest bar. If the DLL introduced nondeterministic fast-math/denormal handling, M4/R4 would (correctly) flag it as a failure rather than absorb it.
- **`S_click` is a slew bound, not a psychoacoustic model.** `S_click = 0.15` cleanly separates the natural 880 Hz per-sample slew (≈ 0.115) from a real discontinuity; it is an honest, conservative click detector for these locked tones, not a general audibility model.

---

## 12. Lock statement [GATE]

Every parameter, threshold, tolerance, patch, seed, thread/swap/crossfade model, and decision branch in §1–§11 is **fixed at this pre-registration and may not be changed after any result exists.** This document contains **no result, no measured number, and no code.** The companion `HARNESS-SPEC.md` (implementation blueprint, no code this phase) must implement **these and only these**. The orchestrator will SHA-256-freeze both files immediately; the verifier (§9) FAILS the run if any hash changed or any threshold was tuned. **No spike is run and no results are produced in this phase.**
