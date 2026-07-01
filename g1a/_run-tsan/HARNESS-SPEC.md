# G1A TSan/Linux Certification — HARNESS SPECIFICATION (buildable blueprint)

**Companion to:** `C:/Users/doner/SSI/g1a/_run-tsan/PRE-REGISTRATION.md` (the locked falsifier). This file is the **buildable spec** the shape's implement phase will build **EXACTLY**. It contains **NO C++ code** — only the design the implementation must realise. Every parameter here is the locked value from the PRE-REGISTRATION; **the harness implements these and only these.**

**Grounding (verified):**
- `C:/Users/doner/SSI/g1a/_run-tsan/RESEARCH-MEMO-FEASIBILITY.md` — Linux `libCmajPerformer.so` v1.0.3159 ships in `cmajor.linux.x64.zip`; WSL2 Ubuntu present; headers identical; API contract unchanged.
- `C:/Users/doner/SSI/g1a/_run-tsan/TSAN-REALITY-MEMO.md` — exact `clang++-18 -std=c++17 -fsanitize=thread -g -O1` invocation; `TSAN_OPTIONS`; control-race detector-liveness protocol; honest scoping (prebuilt `.so` + JIT uninstrumented; atomics not reported; `-O1` accepted trade-off; WSL2 ≠ RTOS).
- `C:/Users/doner/SSI/g1a/_run-reload/RELOAD-GROUNDING.md` (§1 no async build API → two-Engine synchronous background compile; §2 `std::atomic<uint32_t>` index swap into `cmaj::Performer[2]`; §3 COM-atomic safe release; §4 identical render loop + host-side crossfade; §5 threading model).
- `C:/Users/doner/SSI/g1a/_run/SDK-GROUNDING.md` (§4 API sequence, §6 gotchas, §6.2 per-Performer single-thread model).
- Windows reload-bridge harness at `C:/Users/doner/SSI/g1a/_run-reload/spike/` is the authoritative port source — the Linux harness is a **direct port** of that logic (same modules, same call sequences, same thread/swap/crossfade/release model).

**No-result rule:** this phase writes the spec only. No build is run; no numbers are reported as observed.

---

## 0. Target runtime, language, and constraints [ARCH]

- **Runtime:** WSL2 Ubuntu (present on this host — RESEARCH-MEMO-FEASIBILITY §3), running under Windows host `C:/Users/doner`. WSL2 path mapping: Windows `C:/Users/doner/SSI/g1a/_run-tsan/` ↔ WSL2 `/mnt/c/Users/doner/SSI/g1a/_run-tsan/`.
- **Language/std:** C++17, **primary compiler `clang++-18`**, **pre-declared single-swap fallback `g++-12`** (only if clang++-18 fails to link the TSan runtime against `libCmajPerformer.so`). No C++20.
- **No third-party libraries** beyond the Cmajor headers (vendored at `C:/Users/doner/SSI/g1a/_run/cmajor-headers/include/`, mapped via WSL2 `/mnt/c/Users/doner/SSI/g1a/_run/cmajor-headers/include/`) and the C++ standard library (`<thread>`, `<atomic>`, `<chrono>`, `<cstdint>`, `<vector>`, `<string>`, `<cstdio>`, `<cmath>`, `<cassert>`). A hand-rolled two-party block barrier (mutex + condition_variable + generation counter, or paired `std::atomic<uint64_t>` block-completion counters) is used during the crossfade window. A `std::atomic<uint32_t>` is the swap index; a `std::atomic<bool>` is the `bReady` publication flag. A minimal SHA-256 (single-file public-domain implementation embedded in the host source) computes the proof hashes; **no external crypto dependency**.
- **Cmajor API contract (locked, identical to Windows):** each `cmaj::Performer` is used from **exactly one thread** (the RT thread). Every `cmaj::Engine` `load`/`link`/`createPerformer` is done **off the RT thread**. The RT thread **never** touches an `Engine` object after `createPerformer`. On Linux, the `.so` is loaded once via `cmaj::Library::initialise("libCmajPerformer.so")`; **`LD_LIBRARY_PATH`** must include the directory containing `libCmajPerformer.so`.
- **Header-usage corrections are mandatory** (inherited from Windows — SDK-GROUNDING §6, RELOAD-GROUNDING §7.1): `AllocatedBuffer` has no public `.data` → use `.getView().data.data`; `Result` is `enum class : int32_t {Ok = 0, …}` (check `== Ok`); `EndpointHandle` is `uint32_t` (check `!= 0`); store endpoint handles **per-engine** (do not assume handle portability across engines); redefine `CHOC_ASSERT(x)` to `assert(x)` for a console app.
- **TSan-specific constraints:**
  - All host translation units are compiled with `-fsanitize=thread` (both compile and link).
  - Any spin or busy-wait on a non-atomic variable carries a **compiler fence** (`std::atomic_signal_fence(std::memory_order_seq_cst)` or equivalent) so TSan observes the memory access as a load/store rather than a register-promoted invisible spin (TSAN-REALITY-MEMO §2.2).
  - No `-fsanitize=address` in the TSan build (TSan+ASan incompatible — TSAN-REALITY-MEMO §11).
  - No MSVC-specific constructs (`_CrtSetDbgFlag`, `__declspec`, `windows.h`) — replaced by Linux equivalents per §7 port table.

---

## 1. File / module layout under `g1a/_run-tsan/spike/` [ARCH]

All sources live under WSL2 path `/mnt/c/Users/doner/SSI/g1a/_run-tsan/spike/` (≡ Windows `C:/Users/doner/SSI/g1a/_run-tsan/spike/`). Build artifacts and logs write to `g1a/_run-tsan/artifacts/`. The module layout mirrors the Windows reload-bridge harness at `_run-reload/spike/` structurally — each module has the same responsibility, call sequence, and threading model.

| File | Responsibility | Port notes |
|---|---|---|
| `host_config.h` | The single locked-parameter header (every constant from PRE-REG §8). No tunables elsewhere. | Identical values; no platform ifdefs needed (all params are platform-independent). |
| `patches.h` | The two locked Cmajor source strings (`SineA` 440 Hz, `SineB` 880 Hz) as inline string literals. | **Identical to `_run-reload/spike/patches.h`** — Cmajor source is platform-agnostic. |
| `engine_setup.{h,cpp}` | Engine/Performer construction (the SDK-GROUNDING §4 sequence) for both the main-thread Engine A and the worker-thread Engine B. | `cmaj::Library::initialise("libCmajPerformer.so")` (not `"CmajPerformer.dll"`). Otherwise identical call sequence. |
| `bg_compiler.{h,cpp}` | The worker (background-compile) thread: synchronous build of Engine B → `performers[1]`, publish `bReady` (RELOAD-GROUNDING §1, §4). | Identical logic; `.so` instead of `.dll`. No CRT debug heap. |
| `swap.{h,cpp}` | The `std::atomic<uint32_t> activeIndex` + `std::atomic<bool> bReady` handoff, the locked-block swap, and the post-crossfade safe-release protocol (RELOAD-GROUNDING §2, §3). | `std::atomic` is portable — **no change**. |
| `rt_render.{h,cpp}` | The single RT thread render loop: per block read `activeIndex`, advance active performer(s), apply the crossfade in the window, write the master output slot, time the block (informative only). | `QueryPerformanceCounter` → `clock_gettime(CLOCK_MONOTONIC)`. Otherwise identical. |
| `crossfade.{h,cpp}` | The per-sample linear `α` schedule and the host-side mix; the two-party crossfade-window barrier. | Identical logic; barrier uses `pthread` primitives via `<mutex>`/`<condition_variable>` (portable). |
| `perturb.{h,cpp}` | Deterministic seeded interleaving-perturbation schedule (SplitMix64-style) for repeats 1..4 (**`SEED_MASTER = 0x6121A_0003`**). | Identical logic; `std::this_thread::yield()` is portable. |
| `metrics.{h,cpp}` | Goertzel, per-block timing reduction, mix-identity, click/slew bound, bit-compare, SHA-256, metric estimators (PRE-REG §5). | Identical logic; `<cmath>` is portable. SHA-256 is pure computation — identical. |
| `proof.{h,cpp}` | Writes `trace.log`, the `.wav`/`.pcm` dumps, and `metrics.json` (PRE-REG §6). | Identical logic; file I/O uses `<fstream>` (portable). |
| `main.cpp` | Orchestrates the locked run order (§5 below); emits the FINAL PASS/FAIL verdict. | Identical orchestration; adds TSan-specific stderr capture + `TSAN_OPTIONS` propagation. |
| `tsan_control_race.cpp` | **Standalone binary** — deliberate non-atomic data race for T3a detector-liveness. Not part of the main harness. | Linux-only; built with same `-fsanitize=thread` invocation. |
| `tsan.suppressions` | Frozen suppressions file (matches only `libCmajPerformer.so` frames). | Linux-only; referenced via `TSAN_OPTIONS`. |
| `build_tsan.sh` | Locked build script for WSL2 Ubuntu — compiles + links the main harness, the control-race binary, and the RT-probe binary with TSan. | WSL2 bash script; invokes clang++-18 with locked flags. |
| `build_release.sh` | Optional companion: builds without TSan for functional baseline. | `-O2 -DNDEBUG`, no `-fsanitize=thread`. |

The build produces **three** executables:
1. **`g1a_tsan_host`** — the main certification harness (TSan-instrumented).
2. **`tsan_control_race`** — the T3a detector-liveness binary.
3. **`g1a_tsan_rtprobe`** — the T3b RT-coverage witness binary (same sources as `g1a_tsan_host`, built with `-DTSAN_RT_PROBE`).

---

## 2. `host_config.h` — the single locked-parameter object [ARCH]

All constants below are the PRE-REGISTRATION §8 locked values. They appear **once**, here. **No other module defines or hardcodes a tunable value.**

| Name | Value | Source |
|---|---|---|
| `SAMPLE_RATE` | `48000` (Hz) | PRE-REG §4.2 |
| `BLOCK_SIZE` | `256` (frames, mono) | PRE-REG §4.2 |
| `N_BLOCKS` | `10000` (total master blocks) | PRE-REG §4.2 |
| `D_BLOCK_NS` | `5333333` (ns; = 256/48000 s; **informative only under TSan**) | PRE-REG §5.1 |
| `K_COMPILE_START` | `100` | PRE-REG §4.2 |
| `K_XFADE_START` | `4000` | PRE-REG §4.2 |
| `W_XFADE` | `64` (crossfade window length, blocks) | PRE-REG §4.2 |
| `K_SWAP` | `4064` (= K_XFADE_START + W_XFADE) | PRE-REG §4.2 |
| `P_MEAS` | `512` (pre/post measurement window, blocks) | PRE-REG §4.2 |
| `R_REPEATS` | `5` | PRE-REG §4.2 |
| `SEED_MASTER` | `0x6121A0003` (uint64, **distinct** from Windows passes) | PRE-REG §4.2 |
| `FREQ_A` | `440.0` (Hz, A4) | PRE-REG §4.3 |
| `FREQ_B` | `880.0` (Hz, A5) | PRE-REG §4.3 |
| `FREQ_CTL` | `660.0` (Hz, control bin) | PRE-REG §5.4 |
| `EPS_XFADE` | `1e-6` (crossfade mix-identity tolerance) | PRE-REG §5.4 |
| `S_CLICK` | `0.15` (max allowed per-sample slew) | PRE-REG §5.4 |
| `REL_MIN` | `0.40` (rel440_pre, rel880_post floor) | PRE-REG §5.4 |
| `LEAK_MAX` | `0.10` (cross-leak + control ceiling) | PRE-REG §5.4 |
| `EPS_SPECTRAL` | `0.05` (cross-platform spectral diff tolerance) | PRE-REG §5.4 |
| `EPS_PREFIX` | `1e-4` (cross-platform short-prefix max delta) | PRE-REG §5.4 |
| `DLL_NAME` | `"libCmajPerformer.so"` (v1.0.3159) | PRE-REG §4.1 |
| `INCLUDE_ROOT` | `"__PATH_TO__/cmajor-headers/include"` (WSL2 path) | PRE-REG §4.1 |

Derived (computed once, not separately tunable): `XFADE_SAMPLES = W_XFADE * BLOCK_SIZE = 16,384`; `TOTAL_SAMPLES = N_BLOCKS * BLOCK_SIZE = 2,560,000`; window ranges `A_PRE = [K_XFADE_START − P_MEAS, K_XFADE_START) = [3488, 4000)`; `B_POST = [K_SWAP, K_SWAP + P_MEAS) = [4064, 4576)`.

---

## 3. `patches.h` — the two locked Cmajor patches [ARCH] *(music register load-bearing)*

**Identical** to `_run-reload/spike/patches.h`. Two self-oscillating sine processors, an octave apart in distinct DFT bins:

- **`SineA`** — processor emitting a `440.0 Hz` sine (A4). Output endpoint `out` (stream float). Loaded into **Engine A on the main thread before RT start** — the *live* performer (`performers[0]`).
- **`SineB`** — processor emitting an `880.0 Hz` sine (A5, one octave up). Compiled into **Engine B on the WORKER thread at runtime** while A is live — the *background-compiled* performer (`performers[1]`).

The exact source strings are inline `R"(...)"` literals in `patches.h`. They differ **only** in the frequency constant. Phase initialisation is fixed (phase 0 at first advanced block); amplitude `1.0`; self-oscillating (no input stream). Each follows the SDK-GROUNDING §5 Option B form: `out <- sin(phase); phase = addModulo2Pi(phase, freq * processor.period * twoPi)`.

---

## 4. Engine/Performer construction (`engine_setup`) — locked call sequence [ARCH]

**Identical** to the Windows reload-bridge harness (`_run-reload/HARNESS-SPEC.md §4`), with one platform substitution: `cmaj::Library::initialise("libCmajPerformer.so")` instead of `"CmajPerformer.dll"`.

**Engine A — on the MAIN thread, before any RT/worker thread starts:**
1. `cmaj::Library::initialise("libCmajPerformer.so")` — **once** for the process; abort on false. (The `LD_LIBRARY_PATH` environment variable must include the directory containing `libCmajPerformer.so`.)
2. `auto engineA = cmaj::Engine::create();`
3. `cmaj::Program programA; programA.parse(messages, "internal", <SineA source>);` — abort on parse error.
4. `engineA.setBuildSettings(cmaj::BuildSettings().setFrequency(48000).setMaxBlockSize(256).setSessionID(<A id>));`
5. `engineA.load(messages, programA, {}, {});` — abort on false.
6. `auto outHandle_A = engineA.getEndpointHandle("out");` — **after load, before link**; check `!= 0`.
7. `engineA.link(messages);` — abort on false.
8. `performers[0] = engineA.createPerformer();`
9. `performers[0].setBlockSize(256);` — check `Result == Ok`.

**Engine B — on the WORKER thread, dispatched at `K_COMPILE_START`, while A is live (`bg_compiler`):**
1. `auto engineB = cmaj::Engine::create();` — a **separate** Engine.
2. `cmaj::Program programB; programB.parse(messages, "internal", <SineB source>);` — record `compile_result` on failure.
3. `engineB.setBuildSettings(cmaj::BuildSettings().setFrequency(48000).setMaxBlockSize(256).setSessionID(<B id>));`
4. `engineB.load(messages, programB, {}, {});` — record `compile_result`.
5. `auto outHandle_B = engineB.getEndpointHandle("out");` — after load, before link; check `!= 0` (**per-engine handle, stored separately** — RELOAD-GROUNDING §7.1).
6. `engineB.link(messages);` — record `compile_result`.
7. `performers[1] = engineB.createPerformer();` — record `compile_result`.
8. `performers[1].setBlockSize(256);` — check `Result == Ok`.
9. Record `K_COMPILE_DONE` and publish `bReady.store(true, release)`.

Threading discipline (identical to Windows): the worker thread **never** touches `performers[0]`; the RT thread **never** touches the Engine objects.

---

## 5. The locked run order (`main.cpp`) [ARCH]

`main` executes in this exact order; the verifier checks the order is honored:

**Step 0 — Detector-liveness precondition (T3a + T3b, run BEFORE the cert run):**
1. Build and run `tsan_control_race` (T3a): verify `WARNING: ThreadSanitizer: data race` present in stderr **with the suppressions file active**. If absent → abort with `DETECTOR_LIVENESS_FAIL`; do NOT proceed.
2. Build and run `g1a_tsan_rtprobe` (T3b): verify a data-race report naming a frame inside the RT render loop. If absent → abort with `DETECTOR_LIVENESS_FAIL`; do NOT proceed.

**Step 1 — Construct** Engine A → Performer A (`performers[0]`) on the main thread (§4). Allocate `performers[2]` (`performers[1] = {}`), `activeIndex{0}`, `bReady{false}`, the master output buffer (`TOTAL_SAMPLES` floats), the per-performer crossfade-region buffers (`A_xfade`, `B_xfade`, `XFADE_SAMPLES` floats each), and the per-block timing vector.

**Step 2 — Reference (solo) renders (PRE-REG §4.2):** render `A_solo` (`SineA`, `P_MEAS` blocks at the pre-window phase) and `B_solo` (`SineB`, `P_MEAS` blocks at the post-window phase), each single-threaded, for the T4 Goertzel normalisation.

**Step 3 — Reload repeats:** for `r = 0..R_REPEATS-1`:
- Reset both performers/engines to phase-0 initial state (Engine B is rebuilt fresh each repeat on the worker thread). `activeIndex = 0`, `bReady = false`.
- Spawn the **RT thread** (`rt_render`). At block `K_COMPILE_START`, spawn the **worker thread** (`bg_compiler`, §4 Engine B). Repeat `r = 0` injects **no** perturbation; repeats `r = 1..4` use the seeded perturbation schedule (`perturb`, §7) on the worker compile and on the RT thread around `K_SWAP`.
- The RT thread renders `N_BLOCKS` blocks: `[0, K_XFADE_START)` pure A; `[K_XFADE_START, K_SWAP)` host-mixed crossfade; at `K_SWAP` `activeIndex.store(1, release)`; `[K_SWAP, N_BLOCKS)` pure B.
- After the crossfade window has elapsed and the RT thread's first post-swap `load(acquire)` returns `1`, perform the **safe release** of `performers[0]` and Engine A copy (`swap.cpp`, §6); record `old_perf_release_block`.
- Store the full master output, A-stream, B-stream, and crossfade region (or their SHA-256 immediately, to bound memory).
- Join the RT and worker threads before the next repeat (no overlap between repeats).

**Step 4 — Compute metrics** T1–T4 (`metrics`, §8) from the buffers/timings/Result-codes/hashes/trace records. T1 is computed from the build step; T2 from the TSan stderr + run completeness; T3 from the control/RT-probe logs; T4 from the audio dumps.

**Step 5 — Write proof artifact** (`proof`, §9): `build.log`, `tsan.suppressions` (the frozen file), `ldd.txt` + `runtime_version.txt`, `logic_diff_witness.txt`, `tsan_main_run.log`, `tsan_control.log`, `tsan_rtprobe.log`, the audio dumps, `metrics.json`.

**Step 6 — Emit verdict:** FINAL PASS iff `T1 ∧ T2 ∧ T3(a∧b) ∧ T4 ∧ proof-exists ∧ tsan_clean` (PRE-REG §7); else FINAL FAIL (and the runner echoes the §9 fallback block verbatim, selecting branch (i) for genuine race/T2 FAIL, branch (ii) for feasibility/T1 FAIL, or the `DETECTOR_LIVENESS_FAIL` sub-clause for T3 FAIL).

---

## 6. RT render + background compile + swap + crossfade model [ARCH]

**Identical** to the Windows reload-bridge harness (`_run-reload/HARNESS-SPEC.md §6`), with Linux primitive substitutions per §7 port table.

**`rt_render` (the single RT thread):** for each block `k = 0..N_BLOCKS-1`, timed with `clock_gettime(CLOCK_MONOTONIC)` (**informative only** — not gated under TSan):
1. `idx = activeIndex.load(std::memory_order_acquire);`
2. **Phase select by block index (deterministic):**
   - `k < K_XFADE_START` → advance only `performers[0]`: `setBlockSize(256)`, `advance()`, `copyOutputFrames(outHandle_A, &master[k*256], 256)`.
   - `K_XFADE_START ≤ k < K_SWAP` → **crossfade block**: advance **both** performers, rendezvous at the two-party barrier, host-mix using the per-sample `α` schedule.
   - `k == K_SWAP` → before rendering, `activeIndex.store(1, std::memory_order_release)` (the swap); then advance only `performers[1]`.
   - `k > K_SWAP` → advance only `performers[idx]` (= `performers[1]`).
3. *(repeat r ≥ 1)* apply perturbation hook (bounded `std::this_thread::yield()` / short spin per seeded schedule).

**`bg_compiler` (the worker thread):** dispatched at `K_COMPILE_START`. Runs the full synchronous Engine B build (§4 Engine B steps), recording `compile_result` and `K_COMPILE_DONE`, publishes `performers[1]` and `bReady.store(true, release)`. *(repeat r ≥ 1)* applies seeded perturbation (bounded yields between build steps).

**`crossfade` — per-sample linear α:** `α(m) = m / (XFADE_SAMPLES − 1)` for `m = 0..XFADE_SAMPLES-1`, `α(0)=0.0`, `α(last)=1.0`, monotone non-decreasing. `master[...] = (1 − α(m)) * A_xfade[m] + α(m) * B_xfade[m]`.

**`swap` — atomic handoff + safe release:**
- Swap: `activeIndex.store(1, release)` at `k == K_SWAP`, performed by the RT thread, exactly once (`swap_count == 1`).
- Safe release: after block ≥ `K_SWAP` **and** RT thread has performed `load(acquire)` returning `1`, release `performers[0] = cmaj::Performer{}` then release Engine A copy. Record `old_perf_release_block`.

**No unsynchronized shared mutable state** beyond `activeIndex`/`bReady` — the static-audit target the verifier checks (PRE-REG §12.4).

---

## 7. The locked Windows→Linux port table + build invocations [ARCH][GATE]

### 7.1 Windows→Linux port table (the buildable heart)

| Windows construct | Linux/WSL2 port | Notes |
|---|---|---|
| MSVC `cl 19.50`, `/std:c++17`, `/O2`, `/fsanitize=address` | `clang++-18` (gcc-12 fallback), `-std=c++17`, **`-O1`** (TSan-recommended; not O2/O3/O0 — TSAN-REALITY-MEMO §1.1, §4.5), **`-fsanitize=thread -g`** | TSan uses `-O1`; `-g` required for source locations in race reports |
| `/DCMAJOR_DLL=1` | `-DCMAJOR_DLL=1` | Identical preprocessor name |
| `CmajPerformer.dll v1.0.3159` via `cmaj::Library::initialise("CmajPerformer.dll")` | `libCmajPerformer.so v1.0.3159` from `cmajor.linux.x64.zip` (**T1 feasibility gate**; branch (ii) on fail); `cmaj::Library::initialise("libCmajPerformer.so")`; `LD_LIBRARY_PATH` must include the `.so` directory | Same version, same API — RESEARCH-MEMO-FEASIBILITY §1 |
| `cmajor-headers/include` (Windows path) | identical headers from WSL2 path `/mnt/c/Users/doner/SSI/g1a/_run/cmajor-headers/include/` | Headers are platform-agnostic |
| `QueryPerformanceCounter` | `clock_gettime(CLOCK_MONOTONIC)` | **Informative only, not gated under TSan** |
| `_CrtSetDbgFlag(_CRTDBG_ALLOC_MEM_DF \| _CRTDBG_CHECK_ALWAYS_DF)` | **n/a** (TSan ≠ heap checker; do NOT add ASan — TSan+ASan incompatible — TSAN-REALITY-MEMO §11) | Heap safety already covered by Windows ASan passes |
| `clang_rt.asan_dynamic-x86_64.dll` | n/a | TSan runtime auto-linked by `-fsanitize=thread`; verify `ldd \| grep tsan` |
| `std::atomic<uint32_t> activeIndex`, `std::atomic<bool> bReady` | **unchanged** (portable; TSan does not report atomics — TSAN-REALITY-MEMO §2.3) | |
| `<thread>`/`<mutex>`/`<condition_variable>`, crossfade barrier | **unchanged** (pthread-backed on Linux; TSan instruments fully) | |
| `std::this_thread::yield()` perturbation | unchanged (portable) | |
| Spin on non-atomic flag (any) | Must carry **compiler fence** (`std::atomic_signal_fence(std::memory_order_seq_cst)`) so TSan observes the memory access (TSAN-REALITY-MEMO §2.2) | Without fence, `-O1` may promote to register → invisible to TSan |
| xrun deadline gate (Windows R1/R2) | **demoted to informative** (TSan 2–5× slowdown makes RT deadline impossible — TSAN-REALITY-MEMO §4.6) | Not a TSan metric; xrun count logged but not gated |
| SHA-256, Goertzel, mix-identity, click/slew | **unchanged** (pure computation, portable C++) | |

### 7.2 Exact build invocation (locked) [GATE]

Executed under WSL2 Ubuntu:

```bash
#!/bin/bash
# build_tsan.sh — locked build script for G1A TSan/Linux certification
# Primary compiler: clang++-18
# Fallback compiler (pre-declared): g++-12

set -euo pipefail

CLANG=clang++-18
CXXFLAGS="-std=c++17 -fsanitize=thread -g -O1"
CXXFLAGS="$CXXFLAGS -DCMAJOR_DLL=1"
CXXFLAGS="$CXXFLAGS -I/mnt/c/Users/doner/SSI/g1a/_run/cmajor-headers/include"
LDFLAGS="-fsanitize=thread -lpthread -ldl"

SPIKE_DIR="/mnt/c/Users/doner/SSI/g1a/_run-tsan/spike"
ARTIFACTS_DIR="/mnt/c/Users/doner/SSI/g1a/_run-tsan/artifacts"
mkdir -p "$ARTIFACTS_DIR"

cd "$SPIKE_DIR"

# --- Main harness ---
echo "=== Building main harness (g1a_tsan_host) ==="
$CLANG $CXXFLAGS -c engine_setup.cpp -o engine_setup.o
$CLANG $CXXFLAGS -c bg_compiler.cpp -o bg_compiler.o
$CLANG $CXXFLAGS -c swap.cpp -o swap.o
$CLANG $CXXFLAGS -c rt_render.cpp -o rt_render.o
$CLANG $CXXFLAGS -c crossfade.cpp -o crossfade.o
$CLANG $CXXFLAGS -c perturb.cpp -o perturb.o
$CLANG $CXXFLAGS -c metrics.cpp -o metrics.o
$CLANG $CXXFLAGS -c proof.cpp -o proof.o
$CLANG $CXXFLAGS -c main.cpp -o main.o
$CLANG $LDFLAGS -o g1a_tsan_host \
    engine_setup.o bg_compiler.o swap.o rt_render.o \
    crossfade.o perturb.o metrics.o proof.o main.o

# --- Control-race binary (T3a) ---
echo "=== Building control-race binary (tsan_control_race) ==="
$CLANG $CXXFLAGS -c tsan_control_race.cpp -o tsan_control_race.o
$CLANG $LDFLAGS -o tsan_control_race tsan_control_race.o

# --- RT-probe binary (T3b) ---
echo "=== Building RT-probe binary (g1a_tsan_rtprobe) ==="
$CLANG $CXXFLAGS -DTSAN_RT_PROBE -c rt_render.cpp -o rt_render_probe.o
$CLANG $LDFLAGS -o g1a_tsan_rtprobe \
    engine_setup.o bg_compiler.o swap.o rt_render_probe.o \
    crossfade.o perturb.o metrics.o proof.o main.o

# --- Verify TSan runtime linked in all three binaries ---
echo "=== Verifying TSan linkage ==="
for BIN in g1a_tsan_host tsan_control_race g1a_tsan_rtprobe; do
    echo "--- $BIN ---"
    ldd "$BIN" | grep tsan || { echo "TSan NOT linked in $BIN — BUILD FAILED"; exit 1; }
    nm "$BIN" | grep __tsan_ | head -3 || { echo "No __tsan_* symbols in $BIN — BUILD FAILED"; exit 1; }
done

echo "=== Build complete — TSan linked in all binaries ==="
```

### 7.3 Exact run invocation (locked) [GATE]

```bash
#!/bin/bash
# run_tsan_cert.sh — locked run script for G1A TSan/Linux certification

set -euo pipefail

SPIKE_DIR="/mnt/c/Users/doner/SSI/g1a/_run-tsan/spike"
ARTIFACTS_DIR="/mnt/c/Users/doner/SSI/g1a/_run-tsan/artifacts"
SUPPRESSIONS="$SPIKE_DIR/tsan.suppressions"

export TSAN_OPTIONS="report_atomic_races=1:halt_on_error=0:history_size=7:suppressions=$SUPPRESSIONS:second_deadlock_stack=1"
export LD_LIBRARY_PATH="$SPIKE_DIR:$LD_LIBRARY_PATH"

cd "$SPIKE_DIR"

# --- Step 0a: Control-race liveness (T3a) ---
echo "=== T3a: Control-race detector liveness ==="
./tsan_control_race > /dev/null 2> "$ARTIFACTS_DIR/tsan_control.log" || true
if grep -q "WARNING: ThreadSanitizer: data race" "$ARTIFACTS_DIR/tsan_control.log"; then
    echo "T3a PASS: TSan caught planted race (detector alive)"
else
    echo "T3a FAIL: DETECTOR_LIVENESS_FAIL — TSan did NOT catch planted race"
    exit 1
fi

# --- Step 0b: RT-probe coverage (T3b) ---
echo "=== T3b: RT-thread-coverage witness ==="
./g1a_tsan_rtprobe > /dev/null 2> "$ARTIFACTS_DIR/tsan_rtprobe.log" || true
if grep -q "WARNING: ThreadSanitizer: data race" "$ARTIFACTS_DIR/tsan_rtprobe.log"; then
    echo "T3b PASS: TSan caught RT-probe race (RT thread covered)"
else
    echo "T3b FAIL: DETECTOR_LIVENESS_FAIL — TSan did NOT catch RT-probe race"
    exit 1
fi

# --- Step 1: Main certification run ---
echo "=== Main TSan certification run ==="
./g1a_tsan_host > /dev/null 2> "$ARTIFACTS_DIR/tsan_main_run.log"
RET=$?

# --- Verdict ---
RACE_COUNT=$(grep -c "WARNING: ThreadSanitizer: data race" "$ARTIFACTS_DIR/tsan_main_run.log" 2>/dev/null || echo 0)
echo "TSan data-race WARNING count: $RACE_COUNT"
echo "Host return code: $RET"
echo "Logs saved to $ARTIFACTS_DIR/"
exit $RET
```

### 7.4 Suppressions file shape (locked) [GATE]

The frozen `tsan.suppressions` file must contain **only** entries matching frames inside `libCmajPerformer.so`:

```
# tsan.suppressions — G1A TSan/Linux certification
# Locked: suppresses ONLY races involving at least one access inside
# the prebuilt libCmajPerformer.so (uninstrumented, opaque).
# NO host translation unit may appear in any suppression entry.
# The control-race binary (T3a) must still be caught with this file active.

race:libCmajPerformer.so
```

**Verifier audit rules:**
- No suppression line matches any host TU filename (e.g., `engine_setup.cpp`, `swap.cpp`, `rt_render.cpp`, etc.).
- The `race:libCmajPerformer.so` pattern is the **only** allowed form.
- The control-race binary WAS caught with this file active → proof the suppression is scoped, not global.
- Any suppressed race in `tsan_main_run.log` whose stack trace includes a host TU = **FAIL**.

---

## 8. Metric estimators (`metrics`) — exact, per PRE-REG §5 [ARCH]

- **T1 (Clean Linux TSan BUILD).** From `build.log`: `host_build_ok`, `control_build_ok`, `rtprobe_build_ok`, `link_ok`, `tsan_enabled_in_binary` (via `ldd|grep tsan` **and** `nm __tsan_*` **and** `readelf -d`). Feasibility sub-gate: `linux_runtime_obtained`, `runtime_arch==x86_64` (via `file`), `runtime_version==1.0.3159` (via `strings | grep`). PASS: `build_ok ∧ link_ok ∧ tsan_enabled ∧ runtime_obtained ∧ arch==x86_64 ∧ version==1.0.3159`. Closest-version deviation → escalate + downgrade to spike-grade, never silent.

- **T2 (TSAN-CLEAN main run).** From `tsan_main_run.log`: `nonsuppressed_race_reports = 0`; `warning_reports = 0`; `suppressed_race_count` logged; `host_suppressed_races = 0` (verifier audit). From run: `runs_completed == R`, `blocks_per_run == N`. PASS: `nonsuppressed == 0 ∧ warnings == 0 ∧ runs_completed == R ∧ blocks_per_run == N ∧ host_suppressed == 0`.

- **T3a (Control-race liveness).** From `tsan_control.log`: `control_race_caught = (grep -c "WARNING: ThreadSanitizer: data race" ≥ 1)`. PASS: `control_race_caught == true`.

- **T3b (RT-probe coverage).** From `tsan_rtprobe.log`: `rtprobe_race_caught = (grep -c "WARNING: ThreadSanitizer: data race" ≥ 1)` **AND** the race report names an RT-loop frame (e.g., `rt_render.cpp` line in backtrace). PASS: `rtprobe_race_caught == true`.

- **T4a (Spectral endpoint).** Goertzel over `A_pre`/`B_post`/`A_solo`/`B_solo`: `rel440_pre ≥ 0.40`, `rel880_post ≥ 0.40`, `leak880_pre ≤ 0.10`, `leak440_post ≤ 0.10`, `relCtl ≤ 0.10`.

- **T4b (Mix identity).** `mix_err = max |crossfade_region[m] − ((1−α(m))·A_xfade[m] + α(m)·B_xfade[m])| ≤ 1e-6`. `alpha_monotone = true` (non-decreasing, starts 0.0, ends 1.0).

- **T4c (Click-free).** `click_max = max |full_output[k] − full_output[k−1]| ≤ 0.15`.

- **T4d (Completeness + swap).** `blocks_rendered == 10000`, `swap_block == 4064`, `swap_count == 1`, `dropped_blocks == 0`, `duplicated_blocks == 0`, `old_perf_released_post_crossfade == true`.

- **T4e (Within-Linux determinism).** All `R=5` per-stream SHA-256 hashes identical. `repro_ok == true`.

- **T4f (Cross-platform equivalence — spectral + bounded short-prefix).** `|rel440_pre_linux − rel440_pre_windows| ≤ 0.05`, `|rel880_post_linux − rel880_post_windows| ≤ 0.05`, `|click_max_linux − click_max_windows| ≤ 0.05`. **Plus** `max_{k=0..255} |master_linux[k] − master_windows[k]| ≤ 1e-4`. Full-output per-sample bit-exactness across platforms is **explicitly disclaimed** (ULP/phase drift — PRE-REG §11).

**Computed from `metrics.json`:** `final_verdict = (T1 ∧ T2 ∧ T3a ∧ T3b ∧ T4a ∧ T4b ∧ T4c ∧ T4d ∧ T4e ∧ T4f ∧ proof_complete ∧ tsan_clean) ? "PASS" : "FAIL"`.

---

## 9. Proof artifact (`proof`) — exactly what is written (PRE-REG §6) [ARCH]

Under `C:/Users/doner/SSI/g1a/_run-tsan/artifacts/` (WSL2 `/mnt/c/Users/doner/SSI/g1a/_run-tsan/artifacts/`):

1. **`build.log`** — exact build commands + `ldd`/`nm __tsan_*`/`readelf -d` output for each binary + `file libCmajPerformer.so` + version capture.

2. **`tsan.suppressions`** — the frozen suppressions file (as audited by verifier).

3. **`ldd.txt`** + **`runtime_version.txt`** — evidence the real `libCmajPerformer.so` v1.0.3159, x86_64 was loaded (anti-stub).

4. **`logic_diff_witness.txt`** — module-by-module map: for each source file (`engine_setup.*`, `swap.*`, `rt_render.*`, `crossfade.*`, `bg_compiler.*`, `perturb.*`, `metrics.*`, `proof.*`, `main.cpp`), describe the exact Windows→Linux port changes made (only primitive substitutions per §7.1 port table; thread/swap/crossfade/release logic structurally identical).

5. **`tsan_main_run.log`** — full TSan stderr from the main harness run (all repeats).

6. **`tsan_control.log`** — TSan stderr from the control-race binary (T3a).

7. **`tsan_rtprobe.log`** — TSan stderr from the RT-probe binary (T3b).

8. **Audio dumps:** the four required — `A_pre.wav`, `B_post.wav`, `crossfade_region.wav`, `full_output.wav` — plus `A_solo.wav`, `B_solo.wav`, `A_xfade.wav`, `B_xfade.wav`. Each mono, `fs=48000`, 32-bit float `.wav`, or raw `float32 .pcm` with a `.json` sidecar.

9. **`metrics.json`** — machine-checkable object:
   ```
   {
     "run_params": { "fs":48000, "block":256, "n_blocks":10000,
                     "k_compile_start":100, "k_xfade_start":4000, "w_xfade":64,
                     "k_swap":4064, "p_meas":512, "r_repeats":5,
                     "seed_master":"0x6121A0003",
                     "freq_a":440.0, "freq_b":880.0, "freq_ctl":660.0,
                     "eps_xfade":1e-6, "s_click":0.15,
                     "eps_spectral":0.05, "eps_prefix":1e-4,
                     "dll_name":"libCmajPerformer.so", "dll_version":"1.0.3159",
                     "compiler":"clang++-18", "tsan_options":"report_atomic_races=1:halt_on_error=0:history_size=7:suppressions=tsan.suppressions:second_deadlock_stack=1" },
     "T1": { "host_build_ok":<bool>, "control_build_ok":<bool>,
             "rtprobe_build_ok":<bool>, "link_ok":<bool>,
             "tsan_enabled_in_binary":<bool>,
             "linux_runtime_obtained":<bool>, "runtime_arch":"x86_64",
             "runtime_version":"1.0.3159", "pass":<bool>,
             "threshold":"build ok & link ok & tsan linked & runtime v1.0.3159 x86_64 obtained" },
     "T2": { "nonsuppressed_race_reports":<int>, "warning_reports":<int>,
             "suppressed_race_count":<int>, "host_suppressed_races":<int>,
             "runs_completed":<int>, "blocks_per_run":<int>,
             "pass":<bool>,
             "threshold":"nonsuppressed==0 & warnings==0 & runs==R & blocks==N & host_suppressed==0" },
     "T3": { "T3a": { "control_race_caught":<bool> },
             "T3b": { "rtprobe_race_caught":<bool>, "rt_frame_named":<bool> },
             "detector_alive":<bool>, "rt_covered":<bool>,
             "pass":<bool>,
             "threshold":"control caught & rtprobe caught naming RT frame" },
     "T4": { "rel440_pre":<float>, "rel880_post":<float>,
             "leak880_pre":<float>, "leak440_post":<float>, "rel_ctl":<float>,
             "mix_err":<float>, "alpha_monotone":<bool>, "click_max":<float>,
             "blocks_rendered":<int>, "swap_block":<int>, "swap_count":<int>,
             "dropped_blocks":<int>, "duplicated_blocks":<int>,
             "old_perf_released_post_crossfade":<bool>,
             "hashes_full":[5x sha256], "hashes_A":[5x sha256],
             "hashes_B":[5x sha256], "hashes_xfade":[5x sha256],
             "repro_ok":<bool>,
             "cross_platform": {
               "delta_rel440_pre":<float>, "delta_rel880_post":<float>,
               "delta_click_max":<float>,
               "prefix_max_delta":<float>,
               "windows_reference_rel440_pre":<float>,
               "windows_reference_rel880_post":<float>,
               "windows_reference_click_max":<float>
             },
             "pass":<bool>,
             "threshold":"spectral ok & mix<=1e-6 & monotone & click<=0.15 & complete & swap ok & repro ok & cross-platform delta<=0.05 & prefix<=1e-4" },
     "tsan_clean":<bool>,
     "proof_complete":<bool>,
     "final_verdict":"PASS"|"FAIL"
   }
   ```
   The verifier recomputes all estimators from the dumps and confirms `metrics.json` is internally consistent.

---

## 10. Consistency map — HARNESS-SPEC ↔ PRE-REGISTRATION [ARCH]

| PRE-REG section | HARNESS-SPEC realisation |
|---|---|
| §3 TSan certification strategy (T3a∧T3b→T2→T4) | §0 TSan constraints, §5 Step 0 detector-liveness precondition, §7 control-race + RT-probe binaries, §8 T3a/T3b estimators |
| §4.1 toolchain (clang++-18, gcc-12 fallback) | §0, §7.2 `build_tsan.sh` |
| §4.2 audio + timeline params | §2 `host_config.h` |
| §4.3 two patches (440 live / 880 worker-compiled) | §3 `patches.h`, §4 Engine A (main) / Engine B (worker) |
| §4.4 thread + swap + crossfade model | §4 engine setup, §6 rt_render + bg_compiler + swap + crossfade |
| §4.5 TSAN_OPTIONS | §7.3 run invocation, §7.4 suppressions file |
| §4.6 suppressions discipline | §7.4 `tsan.suppressions` + verifier audit rules |
| §5.1 T1 (Clean Linux TSan BUILD) | §7.2 build invocation, §8 T1, §9 `build.log` |
| §5.2 T2 (TSAN-CLEAN) | §8 T2, §9 `tsan_main_run.log` + `metrics.json` |
| §5.3 T3a/T3b (detector-liveness + RT-coverage) | §7.2 control-race + RT-probe binaries, §8 T3a/T3b, §9 `tsan_control.log` + `tsan_rtprobe.log` |
| §5.4 T4 (functional equivalence + completeness) | §8 T4, §9 audio dumps + `metrics.json` |
| §6 proof artifact | §9 nine-component proof bundle |
| §7 decision rule | §5 step 6 verdict |
| §8 locked-parameter summary | §2 `host_config.h` |
| §9 fallback (branch (i), branch (ii), DETECTOR_LIVENESS_FAIL) | §5 step 6 echoes the verbatim block on FINAL FAIL |
| §10 out-of-scope | not implemented |
| §11 honest limitations | §0 TSan constraints, §7.1 port table (timing demotion, fence-on-spin), §9 metrics.json (scoping notes) |
| §12 verifier contract | §9 proof artifact (independent recompute) |

---

## 11. Lock statement [ARCH]

This spec implements **exactly** the locked PRE-REGISTRATION and **no more**. It contains **no C++ code** and **no result**. Every constant traces to PRE-REG §8. The harness is a **direct port** of the proven Windows reload-bridge harness at `_run-reload/spike/` — same modules, same call sequences, same thread/swap/crossfade/release model — with **only** the platform-primitive substitutions listed in §7.1. No logic is added, removed, or altered beyond what the port table specifies. The orchestrator SHA-256-freezes this file alongside `PRE-REGISTRATION.md`; the verifier FAILS the run if either hash changes or if the executed harness deviates from this spec (different params, tuned thresholds, extra synchronization beyond the locked `activeIndex`/`bReady`/crossfade-barrier, a swap at a block other than `K_SWAP`, release before the crossfade completes, a suppressions entry covering a host TU, or a missing proof component). **No TSan run is executed and no results are produced in this phase.**
