# G1A RELOAD-BRIDGE Falsifier — HARNESS SPECIFICATION (implementation blueprint)

**Companion to:** `C:/Users/doner/SSI/g1a/_run-reload/PRE-REGISTRATION.md` (the locked falsifier). This file is the **buildable spec** the shape's implement phase will build **EXACTLY**. It contains **NO C++ code** — only the design the implementation must realise. Every parameter here is the locked value from the PRE-REGISTRATION; **the harness implements these and only these.**

**Grounding (verified):** `C:/Users/doner/SSI/g1a/_run-reload/RELOAD-GROUNDING.md` (§1 no async build API → two-Engine synchronous background compile; §2 `std::atomic<uint32_t>` index swap into `cmaj::Performer[2]`; §3 COM-atomic safe release; §4 identical render loop + host-side crossfade; §5 threading model). Toolchain/header reality inherited from `C:/Users/doner/SSI/g1a/_run/SDK-GROUNDING.md` (§4 API sequence, §6 gotchas, §6.2 per-Performer single-thread model) and `C:/Users/doner/SSI/g1a/_run/SMOKE-TEST-REPORT.md` (single-performer render PROVEN; 5 header-usage corrections; ASan available & clean). Concurrent two-performer ownership/advance/mix is inherited as PROVEN from `C:/Users/doner/SSI/g1a/_run/HARNESS-SPEC.md` (first-pass FINAL PASS).

**No-result rule:** this phase writes the spec only. No spike is run; no numbers are reported as observed.

---

## 0. Target runtime, language, and constraints [ARCH]

- **Language/std:** C++17, MSVC `cl.exe 19.50` (VS18 BuildTools), under `vcvars64.bat` (x64). No C++20.
- **No third-party libraries** beyond the Cmajor headers + CHOC submodule vendored at `cmajor-headers/include/` and the C++ standard library (`<thread>`, `<atomic>`, `<chrono>`, `<cstdint>`, `<vector>`, `<string>`). A hand-rolled two-party block barrier (mutex + condition_variable + generation counter, or paired atomic block-completion counters) is used during the crossfade window; a `std::atomic<uint32_t>` is the swap index and a `std::atomic<bool>` is the `bReady` publication flag. A minimal SHA-256 (single-file public-domain implementation embedded in the host source) computes the proof hashes; **no external crypto dependency**.
- **Cmajor API contract (locked, from SDK-GROUNDING §6.2 / RELOAD-GROUNDING §5):** each `cmaj::Performer` is used from **exactly one thread** (the RT thread). Every `cmaj::Engine` `load`/`link`/`createPerformer` is done **off the RT thread** — Engine A on the main thread before RT start, Engine B on the **worker thread** at runtime. The RT thread **never** touches an `Engine` object after `createPerformer`. The DLL is loaded once via `cmaj::Library::initialise("CmajPerformer.dll")` with the DLL copied next to the `.exe`.
- **Header-usage corrections are mandatory (from SMOKE-TEST §4):** `AllocatedBuffer` has no public `.data` — use `.getView().data.data`; `Result` is `enum class : int32_t {Ok = 0, …}` (check `== Ok`, no `getMessage()`); `EndpointHandle` is `uint32_t` (check `!= 0`); `createInterleavedBuffer(...)` template deduces Sample (no explicit `<float>`); redefine `CHOC_ASSERT(x)` to `assert(x)` for a console app.
- **Reload-specific API contract (locked, from RELOAD-GROUNDING):** there is **no `cmaj::Patch` / async build API** — background compile is the full synchronous `Engine::create → Program::parse → setBuildSettings → load → getEndpointHandle → link → createPerformer` on a **second Engine** on the worker thread (§1). `cmaj::Performer` is **not** value-atomic (ref-counted COM wrapper) — the swap is an `std::atomic<uint32_t>` index into `cmaj::Performer[2]`, **never** `std::atomic<cmaj::Performer>` (§2). Endpoint handles are **per-engine**; store `outHandle_A` and `outHandle_B` separately, do not assume portability (§4, §7.1). Old-performer release is a COM-atomic decrement performed only post-crossfade and post-acquire-load (§3).

---

## 1. File / module layout under `g1a/_run-reload/spike/` [ARCH]

| File | Responsibility |
|---|---|
| `host_config.h` | The single locked-parameter header (every constant from PRE-REG §7). No tunables elsewhere. |
| `patches.h` | The two locked Cmajor source strings (`SineA` 440 Hz, `SineB` 880 Hz) as inline string literals. |
| `engine_setup.{h,cpp}` | Engine/Performer construction (the SDK-GROUNDING §4 sequence) for both the main-thread Engine A and the worker-thread Engine B. |
| `bg_compiler.{h,cpp}` | The worker (background-compile) thread: synchronous build of Engine B → `performers[1]`, publish `bReady` (RELOAD-GROUNDING §1, §4). |
| `swap.{h,cpp}` | The `std::atomic<uint32_t> activeIndex` + `std::atomic<bool> bReady` handoff, the locked-block swap, and the post-crossfade safe-release protocol (RELOAD-GROUNDING §2, §3). |
| `rt_render.{h,cpp}` | The single RT thread render loop: per block read `activeIndex`, advance active performer(s), apply the crossfade in the window, write the master output slot, time the block. |
| `crossfade.{h,cpp}` | The per-sample linear `α` schedule and the host-side mix `out[n] = (1−α(n))·A[n] + α(n)·B[n]`; the two-party crossfade-window barrier. |
| `perturb.{h,cpp}` | Deterministic seeded interleaving-perturbation schedule (SplitMix64-style) for repeats 1..4 (worker-thread compile + RT swap-window perturbations). |
| `metrics.{h,cpp}` | Goertzel, per-block timing reduction, mix-identity, click/slew bound, bit-compare, SHA-256, metric estimators (PRE-REG §5). |
| `proof.{h,cpp}` | Writes `trace.log`, the `.wav`/`.pcm` dumps, and `metrics.json` (PRE-REG §5.5). |
| `main.cpp` | Orchestrates the locked run order (§5 below); emits the FINAL PASS/FAIL verdict. |
| `compile.bat` / `compile_asan.bat` | The two locked build commands (§7 below). |

The build produces **two** executables from the same sources: `g1a_reload_host.exe` (normal) and `g1a_reload_host_asan.exe` (`/fsanitize=address`). Both run the full suite; ASan-clean is checked from the ASan run.

---

## 2. `host_config.h` — the single locked-parameter object [ARCH]

All constants below are the PRE-REGISTRATION §7 locked values. They appear **once**, here:

| Name | Value | Source |
|---|---|---|
| `SAMPLE_RATE` | `48000` (Hz) | PRE-REG §4.2 |
| `BLOCK_SIZE` | `256` (frames, mono) | PRE-REG §4.2 |
| `N_BLOCKS` | `10000` (total master blocks) | PRE-REG §4.2 |
| `D_BLOCK_NS` | `5333333` (ns; = 256/48000 s) | PRE-REG §5.1 |
| `K_COMPILE_START` | `100` (block to dispatch worker compile of B) | PRE-REG §4.2 |
| `K_XFADE_START` | `4000` (first crossfaded block) | PRE-REG §4.2 |
| `W_XFADE` | `64` (crossfade window length, blocks) | PRE-REG §4.2 |
| `K_SWAP` | `4064` (= K_XFADE_START + W_XFADE; activeIndex 0→1) | PRE-REG §4.2 |
| `P_MEAS` | `512` (pre/post measurement window, blocks) | PRE-REG §4.2 |
| `R_REPEATS` | `5` | PRE-REG §4.2 |
| `SEED_MASTER` | `0x6121A0002` (uint64) | PRE-REG §4.2 |
| `FREQ_A` | `440.0` (Hz, A4) | PRE-REG §4.3 |
| `FREQ_B` | `880.0` (Hz, A5) | PRE-REG §4.3 |
| `FREQ_CTL` | `660.0` (Hz, control bin) | PRE-REG §5.3 |
| `EPS_XFADE` | `1e-6` (crossfade mix-identity tolerance) | PRE-REG §5.3 |
| `S_CLICK` | `0.15` (max allowed per-sample slew) | PRE-REG §5.3 |
| `REL_MIN` | `0.40` (rel440_pre, rel880_post floor) | PRE-REG §5.3 |
| `LEAK_MAX` | `0.10` (cross-leak + control ceiling) | PRE-REG §5.3 |
| `DLL_NAME` | `"CmajPerformer.dll"` (v1.0.3159) | PRE-REG §4.1 |
| `INCLUDE_ROOT` | `cmajor-headers/include` | PRE-REG §4.1 |

Derived (computed once, not separately tunable): `XFADE_SAMPLES = W_XFADE * BLOCK_SIZE = 16,384`; `TOTAL_SAMPLES = N_BLOCKS * BLOCK_SIZE = 2,560,000`; window ranges `A_PRE = [K_XFADE_START − P_MEAS, K_XFADE_START) = [3488, 4000)`; `B_POST = [K_SWAP, K_SWAP + P_MEAS) = [4064, 4576)`.

---

## 3. `patches.h` — the two locked Cmajor patches [ARCH] *(music register load-bearing)*

Two **self-oscillating sine** processors, an **octave apart** so the reload moves spectral energy from one **distinct** DFT bin to another (the property R3 verifies: 440 Hz present pre-window, 880 Hz present post-window). Each is a complete Cmajor program (following SDK-GROUNDING §5 Option B form: `out <- sin(phase); phase = addModulo2Pi(phase, freq * processor.period * twoPi)`), with `output stream float out;` and **no input** (deterministic, phase 0 at first advanced block), amplitude `1.0`:

- **`SineA`** — processor emitting a `440.0 Hz` sine (A4). Loaded into **Engine A on the main thread before RT start** — the *live* performer (`performers[0]`).
- **`SineB`** — processor emitting an `880.0 Hz` sine (A5, one octave up). Compiled into **Engine B on the WORKER thread at runtime** while A is live — the *background-compiled* performer (`performers[1]`).

The exact source strings are inline `R"(...)"` literals in `patches.h`. They differ **only** in the frequency constant, so `SineB` is a genuinely independent JIT compile (the §2.1 "B is really a different program" probe). `SineB` is **never** built on the main thread and is **never** a copy of `SineA`'s program/IR — it is parsed and compiled fresh on the worker thread (RELOAD-GROUNDING §1). Phase initialisation is fixed; no randomness inside the DSP.

---

## 4. Engine/Performer construction (`engine_setup`) — locked call sequence [ARCH]

The SDK-GROUNDING §4 sequence is used **twice**, on **two different threads** (RELOAD-GROUNDING §1, §4):

**Engine A — on the MAIN thread, before any RT/worker thread starts:**
1. `cmaj::Library::initialise(DLL_NAME)` — **once** for the process; abort on false.
2. `auto engineA = cmaj::Engine::create();`
3. `cmaj::Program programA; programA.parse(messages, "internal", <SineA source>);` — abort on parse error.
4. `engineA.setBuildSettings(cmaj::BuildSettings().setFrequency(48000).setMaxBlockSize(256).setSessionID(<A id>));`
5. `engineA.load(messages, programA, {}, {});` — abort on false.
6. `auto outHandle_A = engineA.getEndpointHandle("out");` — **after load, before link** (SDK-GROUNDING §6.5); check `!= 0`.
7. `engineA.link(messages);` — abort on false.
8. `performers[0] = engineA.createPerformer();`
9. `performers[0].setBlockSize(256);` — check `Result == Ok`.

**Engine B — on the WORKER thread, dispatched at `K_COMPILE_START`, while A is live (`bg_compiler`):**
1. `auto engineB = cmaj::Engine::create();` — a **separate** Engine (no shared state with Engine A).
2. `cmaj::Program programB; programB.parse(messages, "internal", <SineB source>);` — record `compile_result` on failure.
3. `engineB.setBuildSettings(cmaj::BuildSettings().setFrequency(48000).setMaxBlockSize(256).setSessionID(<B id>));`
4. `engineB.load(messages, programB, {}, {});` — record `compile_result`.
5. `auto outHandle_B = engineB.getEndpointHandle("out");` — after load, before link; check `!= 0` (per-engine handle, stored separately — RELOAD-GROUNDING §7.1).
6. `engineB.link(messages);` — record `compile_result`.
7. `performers[1] = engineB.createPerformer();` — record `compile_result`.
8. `performers[1].setBlockSize(256);` — check `Result == Ok`.
9. Record `K_COMPILE_DONE` (current RT block index) and publish `bReady.store(true, release)`.

Engine A, Engine B, both Performers, and both endpoint handles are owned by `main`/`bg_compiler` and passed by reference; the RT thread receives only the `performers[2]` array, `activeIndex`, `bReady`, `outHandle_A`, `outHandle_B`, and the host buffers. The worker thread **never** touches `performers[0]` (the live one); the RT thread **never** touches the Engine objects.

---

## 5. The locked run order (`main.cpp`) [ARCH]

`main` executes in this exact order; the verifier checks the order is honored:

1. **Construct** Engine A → Performer A (`performers[0]`) on the main thread (§4). Allocate `performers[2]` (`performers[1] = {}`), `activeIndex{0}`, `bReady{false}`, the master output buffer (`TOTAL_SAMPLES` floats), the per-performer crossfade-region buffers (`A_xfade`, `B_xfade`, `XFADE_SAMPLES` floats each), and the per-block timing vector.
2. **Reference (solo) renders (PRE-REG §4.6):** render `A_solo` (`SineA`, `P_MEAS` blocks at the pre-window phase) and `B_solo` (`SineB`, `P_MEAS` blocks at the post-window phase), each single-threaded, for the R3 Goertzel normalisation.
3. **Reload repeats:** for `r = 0..R_REPEATS-1`:
   - Reset both performers/engines to phase-0 initial state (Engine B is rebuilt fresh each repeat on the worker thread, since a runtime compile is the thing under test). `activeIndex = 0`, `bReady = false`.
   - Spawn the **RT thread** (`rt_render`). At block `K_COMPILE_START`, spawn the **worker thread** (`bg_compiler`, §4 Engine B). Repeat `r = 0` injects **no** perturbation; repeats `r = 1..4` use the seeded perturbation schedule (`perturb`, §7) on the worker compile and on the RT thread around `K_SWAP`.
   - The RT thread renders `N_BLOCKS` blocks into the master output: `[0, K_XFADE_START)` pure A; `[K_XFADE_START, K_SWAP)` host-mixed crossfade of A and B (both advancing); at `K_SWAP` `activeIndex.store(1, release)`; `[K_SWAP, N_BLOCKS)` pure B. On `r = 0` **only**, record per-block compute times (R1/R2) and the compile-window xrun count.
   - After the crossfade window has elapsed and the RT thread's first post-swap `load(acquire)` returns `1`, perform the **safe release** of `performers[0]` and Engine A copy for this repeat (`swap.cpp`, §6); record `old_perf_release_block`.
   - Store the full master output, the A-stream, the B-stream, and the crossfade region (or their SHA-256 immediately, to bound memory) for the determinism check.
   - Join the RT and worker threads before the next repeat (no overlap between repeats).
4. **Compute metrics** R1–R4 (`metrics`, §8) from the buffers/timings/Result-codes/hashes/trace records.
5. **Write proof artifact** (`proof`, §9): `trace.log`, the four required `.wav` dumps (`A_pre`, `B_post`, `crossfade_region`, `full_output`) + auxiliary references, `metrics.json`.
6. **Emit verdict:** FINAL PASS iff `R1 ∧ R2 ∧ R3 ∧ R4 ∧ proof-exists ∧ asan-clean` (PRE-REG §6); else FINAL FAIL (and the runner echoes the §8 fallback block verbatim).

ASan run: `g1a_reload_host_asan.exe` runs the same order; its stderr/ASan output is captured to `trace.log` and `asan_clean` is set from whether any ASan/CRT report appeared.

---

## 6. RT render + background compile + swap + crossfade model [ARCH]

**`rt_render` (the single RT thread — RELOAD-GROUNDING §5):** for each block `k = 0..N_BLOCKS-1`, timed with `QueryPerformanceCounter`:
1. `idx = activeIndex.load(std::memory_order_acquire);`
2. **Phase select by block index (deterministic, RELOAD-GROUNDING §3 swap-by-schedule):**
   - `k < K_XFADE_START` → advance only `performers[0]`: `setBlockSize(256)`, `advance()`, `copyOutputFrames(outHandle_A, &master[k*256], 256)` (capture Result).
   - `K_XFADE_START ≤ k < K_SWAP` → **crossfade block**: advance **both** performers (`performers[0]` into `A_xfade` region, `performers[1]` into `B_xfade` region, each `advance()` + `copyOutputFrames` with its own per-engine handle), rendezvous at the two-party crossfade barrier (`crossfade`, the only cross-thread sync inside the window), then host-mix into `master[k*256 + j]` using the per-sample `α` schedule (§ below).
   - `k == K_SWAP` (first pure-B block) → before rendering, `activeIndex.store(1, std::memory_order_release)` (the swap); then advance only `performers[1]` into `master`.
   - `k > K_SWAP` → advance only `performers[idx]` (= `performers[1]`) into `master`.
3. *(repeat r ≥ 1)* apply the perturbation hook for block `k` (a bounded `std::this_thread::yield()` / short spin per the seeded schedule), concentrated in `[K_SWAP-2, K_SWAP+2]` to stress the swap interleaving.
4. Record `Result` codes and (r = 0) the per-block time; on the first block where `load(acquire) == 1`, record the ordering fact used by the safe-release gate.

**`bg_compiler` (the worker thread — RELOAD-GROUNDING §1, §4):** dispatched at `K_COMPILE_START`. Runs the full synchronous Engine B build (§4 Engine B steps), recording `compile_result` and `K_COMPILE_DONE`, publishes `performers[1]` and `bReady.store(true, release)`. *(repeat r ≥ 1)* applies its own seeded perturbation (bounded yields between build steps) to vary when B becomes ready relative to A's block progress. The worker **never** touches `performers[0]`, `master`, or `activeIndex`.

**`crossfade` — per-sample linear α (the click-free schedule, PRE-REG §4.5):** for the crossfade window the global sample offset is `m = (k − K_XFADE_START)*256 + j` for `j = 0..255`, `m ∈ [0, XFADE_SAMPLES)`. `α(m) = m / (XFADE_SAMPLES − 1)` (per-sample, monotone, `α(0)=0.0`, `α(XFADE_SAMPLES−1)=1.0`). `master[...] = (1 − α(m)) * A_xfade[m] + α(m) * B_xfade[m]`. Per-sample interpolation guarantees no block-boundary step (no click by construction; R3 verifies it). The two-party barrier (mutex + condition_variable + generation counter, **or** paired `std::atomic<uint64_t>` block-completion counters spun on by the mixer) is **only** used inside `[K_XFADE_START, K_SWAP)` where both performers run; outside the window only one performer runs and no barrier is needed.

**`swap` — atomic handoff + safe release (RELOAD-GROUNDING §2, §3):**
- The swap is `activeIndex.store(1, release)` at `k == K_SWAP`, performed by the RT thread (the sole writer of `activeIndex`), exactly once (`swap_count == 1`).
- **Safe-release protocol:** after the crossfade window has fully elapsed (block ≥ `K_SWAP`) **and** the RT thread has performed at least one `load(acquire)` returning `1` (so it provably no longer references `performers[0]`), release `performers[0] = cmaj::Performer{}` (COM-atomic decrement; deletes the `PerformerInterface` when the count hits 0) and then release the Engine A copy. Record `old_perf_release_block`. **No host buffer is written by both the RT thread and the worker thread without an atomic mediating publication** — this is the static-audit target the verifier checks (PRE-REG §9.5).

**No `std::atomic<cmaj::Performer>`:** per RELOAD-GROUNDING §2, `cmaj::Performer` is a ref-counted COM wrapper and is **not** value-atomic; the only atomics are `activeIndex` (`uint32_t`), `bReady` (`bool`), and the barrier counters. The COM ref-count itself is internally atomic (`std::atomic<int> referenceCount`), making the release safe.

---

## 7. Deterministic perturbation schedule (`perturb`) + build configs [ARCH]

**`perturb` (PRE-REG §4.5):** a SplitMix64-style splittable PRNG seeded by `hash(SEED_MASTER, r)` for repeat `r`. It produces two independent deterministic streams: (i) a worker-thread schedule of bounded yields between Engine B build steps (varying when `bReady` is published relative to A's block progress), and (ii) an RT-thread schedule of bounded yields/short spins in the blocks around `K_SWAP` (varying the swap/release interleaving). The schedule is **fixed by `(SEED_MASTER, r, threadId)`** so each repeat's interleaving pressure is reproducible. The perturbation changes **interleaving only**, never inputs, never phase, never the `K_XFADE_START`/`K_SWAP` block indices — so a correct, race-free implementation must produce **bit-identical** audio across all repeats (R4a), even though the *wall-clock* moment of compile completion varies. Repeat `r = 0` injects nothing (clean timing reference for R1/R2).

**Build commands (the two locked configs):**
- **Normal:** `cl /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /I"<INCLUDE_ROOT>" /Fe:g1a_reload_host.exe main.cpp engine_setup.cpp bg_compiler.cpp swap.cpp rt_render.cpp crossfade.cpp perturb.cpp metrics.cpp proof.cpp` (under `vcvars64.bat`).
- **ASan:** identical plus `/fsanitize=address` and `/Fe:g1a_reload_host_asan.exe`; requires `clang_rt.asan_dynamic-x86_64.dll` at runtime (present at `g1a/_run/`). Per SMOKE-TEST §7, add `/Zi`/`/DEBUG` for better ASan reporting.
`CmajPerformer.dll` must sit next to both `.exe`s (SDK-GROUNDING §6.1).

---

## 8. Metric estimators (`metrics`) — exact, per PRE-REG §5 [ARCH]

- **R1 (background-compile non-disruption).** From repeat 0: `xrun_during_compile = #{ k ∈ [K_COMPILE_START, K_COMPILE_DONE] : t_k > D_BLOCK_NS }`; `compile_result = Ok` iff every Engine B build call succeeded; `compile_completed_before_xfade = (K_COMPILE_DONE < K_XFADE_START)`. PASS: `xrun_during_compile == 0 ∧ compile_result == Ok ∧ compile_completed_before_xfade == true`. (`K_COMPILE_DONE ≤ 3900` reported, not gated.)
- **R2 (atomic/lock-free swap safety).** `result_violations` = count of Performer API calls returning `≠ Ok` across the whole run; `asan_violations`/`crt_heap_violations` parsed from the ASan run log; `swap_block` and `swap_count` from the `activeIndex`-transition record in `trace.log`; `old_perf_released_post_crossfade = (old_perf_release_block ≥ K_SWAP) ∧ (release after first RT acquire-load == 1)`. PASS: `asan_violations==0 ∧ crt_heap_violations==0 ∧ result_violations==0 ∧ swap_block==4064 ∧ swap_count==1 ∧ old_perf_released_post_crossfade==true`.
- **R3 (click-free crossfade correctness).**
  - `mix_err = max_{m∈[0,XFADE_SAMPLES)} |crossfade_region[m] − ((1−α(m))·A_xfade[m] + α(m)·B_xfade[m])|`; `alpha_monotone` checked over the locked schedule (`α(0)==0.0`, `α(last)==1.0`, non-decreasing).
  - `click_max = max_{k=1..TOTAL_SAMPLES-1} |full_output[k] − full_output[k−1]|`.
  - Goertzel magnitudes at `FREQ_A`, `FREQ_B`, `FREQ_CTL` over `A_pre` (`P_MEAS·256` samples), `B_post` (`P_MEAS·256` samples), `A_solo`, `B_solo`; `rel440_pre = mag_Apre(440)/mag_Asolo(440)`; `rel880_post = mag_Bpost(880)/mag_Bsolo(880)`; `leak880_pre = mag_Apre(880)/mag_Asolo(440)`; `leak440_post = mag_Bpost(440)/mag_Bsolo(880)`; `relCtl = max(mag_Apre(660), mag_Bpost(660))/max(mag_Asolo(440), mag_Bsolo(880))`.
  - PASS: `mix_err ≤ 1e-6 ∧ alpha_monotone ∧ click_max ≤ 0.15 ∧ rel440_pre ≥ 0.40 ∧ rel880_post ≥ 0.40 ∧ leak880_pre ≤ 0.10 ∧ leak440_post ≤ 0.10 ∧ relCtl ≤ 0.10`. Goertzel is the standard single-bin recurrence at `cos/sin(2π·f/fs)`; magnitude normalised by sample count.
- **R4 (determinism + completeness).** `repro_ok` = all `R` SHA-256 hashes equal per stream (full master output, A-stream, B-stream, crossfade region); `blocks_rendered` = master blocks written (contiguous `0..N−1`); `dropped_blocks`/`duplicated_blocks` from the block-index audit; `swap_block` cross-checked. PASS: `repro_ok ∧ blocks_rendered==10000 ∧ dropped_blocks==0 ∧ duplicated_blocks==0 ∧ swap_block==4064`.

The embedded SHA-256 hashes the raw little-endian `float32` byte stream of each buffer.

---

## 9. Proof artifact (`proof`) — exactly what is written (PRE-REG §5.5) [ARCH]

Under `C:/Users/doner/SSI/g1a/_run-reload/artifacts/`:

1. **`trace.log`** — header (locked params, DLL version `1.0.3159`, toolchain); per-performer Result-audit summary; the worker-thread compile Result-audit and `K_COMPILE_DONE`; the compile-window xrun count and repeat-0 per-block timing summary (`p50/p99/max`, xrun list if any); the `activeIndex` transition record (`swap_block`, `swap_count`); the `old_perf_release_block` and the RT-acquire-load ordering proving release was post-crossfade; barrier-arrival sample for the crossfade window; and the **captured ASan/CRT stderr** from the ASan run (or an explicit `ASAN: no reports` line).
2. **Sample dumps** — the **four required** dumps: `A_pre` (pre-window pure-A, `P_MEAS·256` samples), `B_post` (post-window pure-B, `P_MEAS·256` samples), `crossfade_region` (`XFADE_SAMPLES = 16,384` samples), `full_output` (entire `TOTAL_SAMPLES = 2,560,000` master output) — each as a `.wav` (mono, `fs=48000`, 32-bit float) **and/or** raw `.pcm` float32 with a `.json` sidecar (`fs`, channels=1, count). Plus auxiliary `A_solo`, `B_solo` (R3 normalisation) and `A_xfade`, `B_xfade` (R3 mix-identity inputs, `XFADE_SAMPLES` each).
3. **`metrics.json`** — machine-checkable object:
   ```
   {
     "run_params": { "fs":48000, "block":256, "n_blocks":10000,
                     "k_compile_start":100, "k_xfade_start":4000, "w_xfade":64,
                     "k_swap":4064, "p_meas":512, "r_repeats":5,
                     "seed_master":"0x6121A0002", "dll_version":"1.0.3159",
                     "freq_a":440.0, "freq_b":880.0, "freq_ctl":660.0,
                     "eps_xfade":1e-6, "s_click":0.15 },
     "R1": { "xrun_during_compile":<int>, "compile_result":"Ok"|"Fail",
             "k_compile_done":<int>, "compile_completed_before_xfade":<bool>,
             "pass":<bool>, "threshold":"xrun==0 & result Ok & done<4000" },
     "R2": { "asan_violations":<int>, "crt_heap_violations":<int>,
             "result_violations":<int>, "swap_block":<int>, "swap_count":<int>,
             "old_perf_release_block":<int>, "old_perf_released_post_crossfade":<bool>,
             "pass":<bool>,
             "threshold":"asan==0 & crt==0 & result==0 & swap_block==4064 & swap_count==1 & released_post_crossfade" },
     "R3": { "mix_err":<float>, "alpha_monotone":<bool>, "click_max":<float>,
             "rel440_pre":<float>, "rel880_post":<float>,
             "leak880_pre":<float>, "leak440_post":<float>, "rel_ctl":<float>,
             "pass":<bool>,
             "threshold":"mix_err<=1e-6 & monotone & click<=0.15 & rel>=0.40 & leak<=0.10 & ctl<=0.10" },
     "R4": { "hashes_full":[5x sha256], "hashes_A":[5x sha256], "hashes_B":[5x sha256],
             "hashes_xfade":[5x sha256], "repro_ok":<bool>, "blocks_rendered":<int>,
             "dropped_blocks":<int>, "duplicated_blocks":<int>, "swap_block":<int>,
             "pass":<bool>,
             "threshold":"all R hashes equal per stream & blocks==10000 & dropped==0 & dup==0 & swap_block==4064" },
     "asan_clean":<bool>,
     "proof_complete":<bool>,
     "final_verdict":"PASS"|"FAIL"
   }
   ```
   The verifier recomputes R1–R4 from the dumps and confirms `metrics.json` is consistent (its hashes match the dumped buffers). The thresholds embedded here are **copies of the locked values** — the verifier cross-checks them against PRE-REG §7 and FAILS on any mismatch.

---

## 10. Consistency map — HARNESS-SPEC ↔ PRE-REGISTRATION [ARCH]

| PRE-REG section | HARNESS-SPEC realisation |
|---|---|
| §3 Windows-feasible reload-correctness strategy | §0 ASan build, §6 swap/release (no unsynchronized shared mutable state; swap-by-schedule), §7 seeded interleaving stress |
| §4.1 toolchain | §0, §7 build commands |
| §4.2 audio + timeline params | §2 `host_config.h` |
| §4.3 two patches (440 live / 880 worker-compiled) | §3 `patches.h`, §4 Engine A (main) / Engine B (worker) |
| §4.4 thread + swap + crossfade model | §4 engine setup, §6 rt_render + bg_compiler + swap + crossfade |
| §4.5 crossfade math + adversarial interleaving | §6 `crossfade` per-sample α, §7 `perturb` |
| §4.6 solo/reference renders | §5 step 2 |
| §5.1 R1 | §8 R1, §9 metrics.json.R1 |
| §5.2 R2 | §8 R2, §9 metrics.json.R2 |
| §5.3 R3 | §8 R3 (Goertzel + mix identity + slew bound), §9 metrics.json.R3 |
| §5.4 R4 | §8 R4 (hashes + completeness), §9 metrics.json.R4 |
| §5.5 proof artifact | §9 `proof` (A_pre, B_post, crossfade_region, full_output + metrics.json + trace.log) |
| §6 decision rule | §5 step 6 verdict |
| §8 fallback | §5 step 6 echoes the verbatim block on FINAL FAIL |
| §10 out-of-scope | not implemented (event-replay, transport-sync, latency-comp, multi-authority, TSan/Linux) |

---

## 11. Lock statement [ARCH]

This spec implements **exactly** the locked PRE-REGISTRATION and **no more**. It contains **no C++ code** and **no result**. Every constant traces to PRE-REG §7. The reload mechanism is built **only** on the grounded API surface (two-Engine synchronous background compile, `std::atomic<uint32_t>` index swap into `cmaj::Performer[2]`, COM-atomic safe release, host-side per-sample crossfade — RELOAD-GROUNDING §1–§5); no async/`Patch`/`std::atomic<cmaj::Performer>` API is assumed. The orchestrator SHA-256-freezes this file alongside `PRE-REGISTRATION.md`; the verifier FAILS the run if either hash changes or if the executed harness deviates from this spec (different params, tuned thresholds, extra synchronization beyond the locked `activeIndex`/`bReady`/crossfade-barrier, a swap at a block other than `K_SWAP`, release before the crossfade completes, or a missing proof component). **No spike is run and no results are produced in this phase.**
