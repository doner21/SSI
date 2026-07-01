# G1A EVENT-REPLAY Falsifier — HARNESS SPECIFICATION (implementation blueprint)

**Companion to:** `C:/Users/doner/SSI/g1a/_run-event-replay/PRE-REGISTRATION.md` (the locked falsifier). This file is the **buildable spec** the shape's implement phase will build **EXACTLY**. It contains **NO C++ code** — only the design the implementation must realise. Every parameter here is the locked value from the PRE-REGISTRATION; **the harness implements these and only these.**

**Grounding (verified):** `C:/Users/doner/SSI/g1a/_run-reload/RELOAD-GROUNDING.md` (§2 `std::atomic<uint32_t>` index swap into `cmaj::Performer[2]`; §3 COM-atomic safe release; §4 host-side crossfade; §5 threading model). **Input endpoint API reality** grounded in `C:/Users/doner/SSI/research-dossier-cmajor-input-api.md` (§3 `setInputValue` for `input value float` endpoints; §5 handles valid for all performers from same engine; §8 Strategy A: single engine, two performers, shared handles). Toolchain/header reality inherited from `C:/Users/doner/SSI/g1a/_run/SDK-GROUNDING.md` (§4 API sequence, §6 gotchas, §6.2 per-Performer single-thread model) and `C:/Users/doner/SSI/g1a/_run/SMOKE-TEST-REPORT.md` (single-performer render PROVEN; 5 header-usage corrections; ASan available & clean). Concurrency + swap/crossfade/safe-release mechanism is inherited as PROVEN from `C:/Users/doner/SSI/g1a/_run-reload/HARNESS-SPEC.md` (reload-bridge FINAL PASS).

**No-result rule:** this phase writes the spec only. No spike is run; no numbers are reported as observed.

---

## 0. Target runtime, language, and constraints [ARCH]

- **Language/std:** C++17, MSVC `cl.exe 19.50` (VS18 BuildTools), under `vcvars64.bat` (x64). No C++20.
- **No third-party libraries** beyond the Cmajor headers + CHOC submodule vendored at `cmajor-headers/include/` and the C++ standard library (`<thread>`, `<atomic>`, `<chrono>`, `<cstdint>`, `<vector>`, `<string>`). A hand-rolled two-party block barrier (mutex + condition_variable + generation counter, or paired atomic block-completion counters) is used during the crossfade window; a `std::atomic<uint32_t>` is the swap index and a `std::atomic<bool>` is the `bReady` publication flag. A minimal SHA-256 (single-file public-domain implementation embedded in the host source) computes the proof hashes; **no external crypto dependency**.
- **Cmajor API contract (locked):** each `cmaj::Performer` is used from **exactly one thread** (the RT thread). The `cmaj::Engine` `load`/`link` is done **off the RT thread** — on the main thread, once, before any RT work. `createPerformer()` is called on the main thread (for A) and on the worker thread (for B). The RT thread **never** touches the `Engine` object — it only touches `Performer` methods (`setBlockSize`, `setInputValue`, `advance`, `copyOutputFrames`, `reset`). The DLL is loaded once via `cmaj::Library::initialise("CmajPerformer.dll")` with the DLL copied next to the `.exe`.
- **Header-usage corrections are mandatory (from SMOKE-TEST §4):** `AllocatedBuffer` has no public `.data` — use `.getView().data.data`; `Result` is `enum class : int32_t {Ok = 0, …}` (check `== Ok`, no `getMessage()`); `EndpointHandle` is `uint32_t` (check `!= 0`); `createInterleavedBuffer(...)` template deduces Sample (no explicit `<float>`); redefine `CHOC_ASSERT(x)` to `assert(x)` for a console app.
- **Event-replay-specific API contract (locked, from dossier):**
  - `Performer::setInputValue(EndpointHandle handle, float newFreq, uint32_t numFramesToReachValue)` — latching frequency value (dossier §3). Called with `ramp = 0` (instant). For `input value float freq` endpoints only.
  - `Performer::reset()` — returns performer to initial state (phase 0, cleared internal buffers, cleared value latches to defaults) (dossier §8).
  - `Engine::getEndpointHandle("freq")` and `Engine::getEndpointHandle("out")` — called **after `load()` but before `link()`**. Handles are valid for all performers created from that engine (dossier §5, §8 Strategy A).
  - `Engine::createPerformer()` — called multiple times from the same engine to create independent performer instances (dossier §8).
  - **Single-thread engine-access invariant:** the engine is accessed by exactly one thread at a time. Main finishes `create→parse→load→getEndpointHandle→link→createPerformer(A)` before the worker touches the engine. Worker calls `createPerformer(B)` solo (main idle, RT never touches engine). RT never touches the engine at all.

---

## 1. File / module layout under `g1a/_run-event-replay/spike/` [ARCH]

| File | Responsibility |
|---|---|
| `host_config.h` | The single locked-parameter header (every constant from PRE-REG §7). No tunables elsewhere. |
| `patches.h` | The single locked Cmajor source string (`FreqSine`) as an inline string literal. |
| `engine_setup.{h,cpp}` | Single-engine construction: `create→parse→load→getEndpointHandle(s)→link→createPerformer(A)`. Stores `freqHandle`, `outHandle`. |
| `event_schedule.{h,cpp}` | Deterministic event schedule from `SEED_MASTER` via SplitMix64. Frozen to `schedule.json`. Enforces boundary sentinels. Provides `stateAt(K)` queries and `events_scheduled_in[a,b)` counts. |
| `bg_prepare.{h,cpp}` | The worker (off-RT prepare) thread: `engine.createPerformer()` + `setBlockSize(256)`, publish `bReady`. Records `K_PREPARE_DONE`. |
| `rt_render.{h,cpp}` | The single RT thread render loop: per-block read `activeIndex`, **mutually exclusive** event delivery by phase (pre-crossfade A-only, crossfade A+B, post-swap B-only with latch-replay), advance performer(s), apply crossfade in window, write master output, time the block. |
| `crossfade.{h,cpp}` | The per-sample linear `α` schedule and host-side mix `out[n] = (1−α(n))·A[n] + α(n)·B[n]`; the two-party crossfade-window barrier. |
| `swap.{h,cpp}` | The `std::atomic<uint32_t> activeIndex` + `std::atomic<bool> bReady` handoff, `reset()` + latch-replay at `K_SWAP`, and post-crossfade safe-release protocol. |
| `reference.{h,cpp}` | Single-threaded reference renders: `REF_A`, `REF_Bxfade` (with initial latch), `REF_Bpost` (with latch-replay), and solo presence refs at `stateAt(K_SWAP)` and the `A_PRE` frequency. |
| `perturb.{h,cpp}` | Deterministic seeded interleaving-perturbation schedule (SplitMix64-style) for repeats 1..4 (worker prepare timing + RT swap-window perturbations). |
| `metrics.{h,cpp}` | Goertzel, per-block timing reduction, mix-identity, click/slew bound (with `K_SWAP` boundary excluded), bit-compare, SHA-256, event-application audit, metric estimators (PRE-REG §5). |
| `proof.{h,cpp}` | Writes `trace.log`, `schedule.json`, `events_applied.log`, the sample dumps, and `metrics.json` (PRE-REG §5.5). |
| `main.cpp` | Orchestrates the locked run order (§5 below); emits the FINAL PASS/FAIL verdict. |
| `compile.bat` / `compile_asan.bat` | The two locked build commands (§7 below). |

The build produces **two** executables from the same sources: `g1a_event_replay_host.exe` (normal) and `g1a_event_replay_host_asan.exe` (`/fsanitize=address`). Both run the full suite; ASan-clean is checked from the ASan run.

---

## 2. `host_config.h` — the single locked-parameter object [ARCH]

All constants below are the PRE-REGISTRATION §7 locked values. They appear **once**, here:

| Name | Value | Source |
|---|---|---|
| `SAMPLE_RATE` | `48000` (Hz) | PRE-REG §4.2 |
| `BLOCK_SIZE` | `256` (frames, mono) | PRE-REG §4.2 |
| `N_BLOCKS` | `10000` (total master blocks) | PRE-REG §4.2 |
| `D_BLOCK_NS` | `5333333` (ns; = 256/48000 s) | PRE-REG §5.1 |
| `K_PREPARE_START` | `100` (block to dispatch worker prepare of B) | PRE-REG §4.2 |
| `K_XFADE_START` | `4000` (first crossfaded block) | PRE-REG §4.2 |
| `W_XFADE` | `64` (crossfade window length, blocks) | PRE-REG §4.2 |
| `K_SWAP` | `4064` (= K_XFADE_START + W_XFADE; activeIndex 0→1) | PRE-REG §4.2 |
| `P_MEAS` | `512` (pre/post measurement window, blocks) | PRE-REG §4.2 |
| `R_REPEATS` | `5` | PRE-REG §4.2 |
| `SEED_MASTER` | `0x6121A0003` (uint64) | PRE-REG §4.2 |
| `AMP` | `0.25` (sine amplitude) | PRE-REG §4.3 |
| `FREQ_PALETTE` | `{220.0, 330.0, 440.0, 550.0, 660.0}` (Hz) | PRE-REG §4.6 |
| `EPS_XFADE` | `1e-6` (crossfade mix-identity tolerance) | PRE-REG §5.3 |
| `S_CLICK` | `0.05` (max allowed per-sample slew, K_SWAP boundary excluded) | PRE-REG §5.3 |
| `REL_MIN` | `0.40` (Goertzel relative magnitude floor) | PRE-REG §5.3 |
| `LEAK_MAX` | `0.10` (cross-leakage ceiling) | PRE-REG §5.3 |
| `DLL_NAME` | `"CmajPerformer.dll"` (v1.0.3159) | PRE-REG §4.1 |
| `INCLUDE_ROOT` | `cmajor-headers/include` | PRE-REG §4.1 |

Derived (computed once, not separately tunable): `XFADE_SAMPLES = W_XFADE * BLOCK_SIZE = 16,384`; `TOTAL_SAMPLES = N_BLOCKS * BLOCK_SIZE = 2,560,000`; window ranges `A_PRE = [K_XFADE_START − P_MEAS, K_XFADE_START) = [3488, 4000)`; `B_POST = [K_SWAP, K_SWAP + P_MEAS) = [4064, 4576)`.

---

## 3. `patches.h` — the single locked Cmajor patch [ARCH]

A single Cmajor program — **`FreqSine`** — with `input value float freq` and `output stream float out`. Loaded/linked **once** on the main thread. All performers (A, B, reference performers, solo refs) are created from this same engine via `engine.createPerformer()`.

Exact source string as an inline `R"(...)"` literal:

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

- Amplitude **0.25** — locked by `AMP` in `host_config.h`; must match the Cmajor literal and the `S_CLICK` derivation.
- `input value float freq` — a latching value endpoint. Host sets it via `setInputValue(freqHandle, f, 0)`. On `reset()`, the latch reverts to its default (effectively 0.0 or uninitialized — the exact default is under test; latch-replay at `K_SWAP` is mandatory to override it).
- Phase **0** at first `advance()` — deterministic.
- DSP form: `out <- amp * sin(twoPi * phase); phase = addModulo2Pi(phase, twoPi * freq * processor.period)`.
- **No recompile-distinctness probe:** this pass uses the same program for A and B. The prior reload pass's 440/880-Octave probe is replaced by event-presence + bit-exact-vs-reference.

---

## 4. Engine/Performer construction (`engine_setup`) — locked call sequence [ARCH]

The SDK-GROUNDING §4 sequence is used **once** for the shared engine, then `createPerformer()` is called multiple times:

**On the MAIN thread, before any RT/worker thread starts:**
1. `cmaj::Library::initialise(DLL_NAME)` — **once** for the process; abort on false.
2. `auto engine = cmaj::Engine::create();`
3. `cmaj::Program program; program.parse(messages, "internal", <FreqSine source>);` — abort on parse error.
4. `engine.setBuildSettings(cmaj::BuildSettings().setFrequency(48000).setMaxBlockSize(256).setSessionID(<id>));`
5. `engine.load(messages, program, {}, {});` — abort on false.
6. `auto freqHandle = engine.getEndpointHandle("freq");` — **after load, before link** (SDK-GROUNDING §6.5); check `!= 0`.
7. `auto outHandle = engine.getEndpointHandle("out");` — after load, before link; check `!= 0`.
8. `engine.link(messages);` — abort on false.
9. `performers[0] = engine.createPerformer();` — Performer A.
10. `performers[0].setBlockSize(256);` — check `Result == Ok`.

The `freqHandle` and `outHandle` are stored globally — they are **valid for all performers from this engine** (dossier §5). All performers (A, B, reference) use the same handles.

**Performer B — on the WORKER thread, dispatched at `K_PREPARE_START`, while A is live (`bg_prepare`):**
1. `performers[1] = engine.createPerformer();` — record `createPerformer_result`.
2. `performers[1].setBlockSize(256);` — check `Result == Ok`.
3. Record `K_PREPARE_DONE` (current RT block index) and publish `bReady.store(true, release)`.

**Performer A recreation (start of each repeat):**
`performers[0] = engine.createPerformer(); performers[0].setBlockSize(256);` — on the main thread, before spawning RT/worker threads for the repeat. Engine is never released between repeats.

---

## 5. The locked run order (`main.cpp`) [ARCH]

`main` executes in this exact order; the verifier checks the order is honored:

1. **Construct** Engine → handles → Performer A (`performers[0]`) on the main thread (§4). Allocate `performers[2]` (`performers[1] = {}`), `activeIndex{0}`, `bReady{false}`, the master output buffer (`TOTAL_SAMPLES` floats), per-performer crossfade-region buffers (`A_xfade`, `B_xfade`, `XFADE_SAMPLES` floats each), and the per-block timing vector.
2. **Generate event schedule** (`event_schedule`) from `SEED_MASTER` via SplitMix64; validate sentinels; freeze to `schedule.json` with SHA-256. Store for the entire run.
3. **Reference (oracle) renders (PRE-REG §4.7):** single-threaded, no swap, no crossfade, separate performers.
   - `REF_A`: single performer, phase 0 at block 0, event model from schedule `[0, K_SWAP)`, advanced `[0, K_SWAP)`. Store `A_PRE` slice `[3488, 4000)`.
   - `REF_Bxfade`: single performer, phase 0 at `K_XFADE_START`. At `K_XFADE_START`, **initial-latched** via `setInputValue(freqHandle, stateAt(K_XFADE_START), 0)` before first advance. Event model from schedule `(K_XFADE_START, K_SWAP]`. Advanced `W_XFADE` blocks. (`b_xfade_initial_latch_count=1`, NOT a scheduled event — logged separately.)
   - `REF_Bpost`: single performer, phase 0 at block 0, advanced through schedule from 0 to `K_SWAP` to establish correct internal state. Then: `reset()` → **latch-replayed** via `setInputValue(freqHandle, stateAt(K_SWAP), 0)` → event model from schedule `(K_SWAP, N)`. Advanced `[K_SWAP, N)`. (`latch_replay_count=1`, NOT a scheduled event — logged separately.)
   - **Solo presence refs:** pure constant-frequency renders at `stateAt(K_SWAP)` and at the `A_PRE` frequency (determined from the schedule). Each: single performer, `setInputValue(freqHandle, f, 0)` once, advanced `P_MEAS` blocks. Used to normalize R3(e) Goertzel, **independent of any replay**.
4. **Event-replay repeats:** for `r = 0..R_REPEATS-1`:
   - **Recreate performer A:** `performers[0] = engine.createPerformer(); performers[0].setBlockSize(256);` (fresh, phase 0). `activeIndex.store(0)`, `bReady.store(false)`, `performers[1] = {}`.
   - Spawn the **RT thread** (`rt_render`). At block `K_PREPARE_START`, spawn the **worker thread** (`bg_prepare`, §4 Engine B). Repeat `r = 0` injects **no** perturbation; repeats `r = 1..4` use the seeded perturbation schedule (`perturb`, §7) on the worker prepare and on the RT thread around `K_SWAP`.
   - The RT thread renders `N_BLOCKS` blocks into the master output following the mutually exclusive event-delivery branches (§6). Crossfade mixing as in the reload pass. At `K_SWAP`: `activeIndex.store(1, release)` → `performers[1].reset()` → latch-replay `setInputValue(freqHandle, stateAt(K_SWAP), 0)` → advance B.
   - After the crossfade window has elapsed and the RT thread's first post-swap `load(acquire)` returns `1`, perform the **safe release** of `performers[0]` (`swap.cpp`); record `old_perf_release_block`.
   - Store the full master output, the A-stream, the B-stream, and the crossfade region (or their SHA-256 immediately, to bound memory) for the determinism check.
   - Join the RT and worker threads before the next repeat (no overlap between repeats).
5. **Compute metrics** R1–R4 (`metrics`, §8) from the buffers/timings/Result-codes/hashes/trace records/event-application logs.
6. **Write proof artifact** (`proof`, §9): `trace.log`, `schedule.json`, `events_applied.log`, the required sample dumps, `metrics.json`.
7. **Emit verdict:** FINAL PASS iff `R1 ∧ R2 ∧ R3 ∧ R4 ∧ proof-exists ∧ asan-clean` (PRE-REG §6); else FINAL FAIL (and the runner echoes the §8 fallback block verbatim from PRE-REG).

ASan run: `g1a_event_replay_host_asan.exe` runs the same order; its stderr/ASan output is captured to `trace.log` and `asan_clean` is set from whether any ASan/CRT report appeared.

---

## 6. RT render event-delivery model (mutually exclusive branches) [ARCH]

**`rt_render` (the single RT thread):** for each block `k = 0..N_BLOCKS-1`, timed with `QueryPerformanceCounter`:
1. `idx = activeIndex.load(std::memory_order_acquire);`
2. **Event delivery + performer advancement — mutually exclusive branches by block phase:**

   **Branch 1 — Pre-crossfade** `k < K_XFADE_START`:
   - For each scheduled event at block `k`: `performers[0].setInputValue(freqHandle, freq, 0);` — record in `events_applied.log` as an A-event.
   - `performers[0].setBlockSize(256); advance(); copyOutputFrames(outHandle, &master[k*256], 256);`

   **Branch 2 — Crossfade** `K_XFADE_START ≤ k < K_SWAP`:
   - **At `k == K_XFADE_START` only:** before B's first `advance()`, call `performers[1].setInputValue(freqHandle, stateAt(K_XFADE_START), 0);` — this is B's **crossfade-start initial latch**, recorded in `events_applied.log` under `X_FADE_INITIAL_LATCH` (NOT as a scheduled event). Record result, increment `b_xfade_initial_latch_count`.
   - For each scheduled event at block `k`: call `setInputValue(freqHandle, freq, 0)` on **both** A and B, each exactly once. Record both in `events_applied.log`.
   - Advance both: `performers[0]` → `A_xfade` region, `performers[1]` → `B_xfade` region (each `setBlockSize(256); advance(); copyOutputFrames` with `outHandle`).
   - Rendezvous at crossfade barrier, host-mix into master (per-sample `α`).

   **Branch 3 — Post-swap** `k ≥ K_SWAP`:
   - **At `k == K_SWAP` only (swap sequence):** (1) `activeIndex.store(1, release)`; (2) `performers[1].reset()` — record result; (3) `performers[1].setInputValue(freqHandle, stateAt(K_SWAP), 0)` — this is the **latch-replay**, recorded in `events_applied.log` under `LATCH_REPLAY` (NOT as a scheduled event). Record result, increment `latch_replay_count`; (4) measure `t_k` from start of block `K_SWAP` to end (includes reset + latch-replay timing → `xrun_at_swap`).
   - For each scheduled event at block `k ≥ K_SWAP`: call `setInputValue(freqHandle, freq, 0)` on B exactly once. Record in `events_applied.log` as a B-post event.
   - `performers[idx].setBlockSize(256); advance(); copyOutputFrames(outHandle, &master[k*256], 256);`

3. *(repeat `r ≥ 1`)* apply the perturbation hook for block `k` (a bounded `std::this_thread::yield()` / short spin per the seeded schedule), concentrated in `[K_SWAP-2, K_SWAP+2]`.
4. Record `Result` codes and (r = 0) the per-block time; on the first block where `load(acquire) == 1`, record the ordering fact used by the safe-release gate.

**`bg_prepare` (the worker thread):** dispatched at `K_PREPARE_START`. Calls `engine.createPerformer()` + `setBlockSize(256)`. Records `createPerformer_result` and `K_PREPARE_DONE`, publishes `performers[1]` and `bReady.store(true, release)`. *(repeat `r ≥ 1`)* applies its own seeded perturbation (bounded yields between steps) to vary when `bReady` is published relative to A's block progress. The worker **never** touches `performers[0]`, `master`, or `activeIndex`.

**`crossfade` — per-sample linear α:** for the crossfade window the global sample offset is `n = (k − K_XFADE_START)*256 + j` for `j = 0..255`, `n ∈ [0, XFADE_SAMPLES)`. `α(n) = n / (XFADE_SAMPLES − 1)` (per-sample, monotone, `α(0)=0.0`, `α(16383)=1.0`). `master[...] = (1 − α(n)) * A_xfade[n] + α(n) * B_xfade[n]`.

**`swap` — atomic handoff + reset + latch-replay + safe release:**
- The swap is `activeIndex.store(1, release)` at `k == K_SWAP`, performed by the RT thread (sole writer), exactly once (`swap_count == 1`).
- Immediately after the store: `performers[1].reset()` then `setInputValue(freqHandle, stateAt(K_SWAP), 0)` (latch-replay). Both on the RT thread, at `k == K_SWAP`, before B's first post-swap `advance()`.
- **Safe-release protocol:** after the crossfade window has fully elapsed (block ≥ `K_SWAP`) **and** the RT thread has performed at least one `load(acquire)` returning `1`, release `performers[0] = cmaj::Performer{}`. Record `old_perf_release_block`.
- **No `std::atomic<cmaj::Performer>`:** the only atomics are `activeIndex` (`uint32_t`), `bReady` (`bool`), and the barrier counters.

---

## 7. Deterministic perturbation schedule (`perturb`) + build configs [ARCH]

**`perturb` (PRE-REG §4.5):** a SplitMix64-style splittable PRNG seeded by `hash(SEED_MASTER, r)` for repeat `r`. It produces two independent deterministic streams: (i) a worker-thread schedule of bounded yields between prepare steps (varying when `bReady` is published relative to A's block progress), and (ii) an RT-thread schedule of bounded yields/short spins in the blocks around `K_SWAP` (varying the swap/release interleaving). The schedule is **fixed by `(SEED_MASTER, r, threadId)`** so each repeat's interleaving pressure is reproducible. The perturbation changes **interleaving only**, never inputs, never phase, never the `K_XFADE_START`/`K_SWAP` block indices — so a correct, race-free implementation must produce **bit-identical** audio across all repeats (R4a). Repeat `r = 0` injects nothing (clean timing reference for R1/R2).

**Build commands (the two locked configs):**
- **Normal:** `cl /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /I"<INCLUDE_ROOT>" /Fe:g1a_event_replay_host.exe main.cpp engine_setup.cpp event_schedule.cpp bg_prepare.cpp rt_render.cpp crossfade.cpp swap.cpp reference.cpp perturb.cpp metrics.cpp proof.cpp` (under `vcvars64.bat`).
- **ASan:** identical plus `/fsanitize=address` and `/Fe:g1a_event_replay_host_asan.exe`; requires `clang_rt.asan_dynamic-x86_64.dll` at runtime (present at `g1a/_run/`). Per SMOKE-TEST §7, add `/Zi`/`/DEBUG` for better ASan reporting.
`CmajPerformer.dll` must sit next to both `.exe`s.

---

## 8. Metric estimators (`metrics`) — exact, per PRE-REG §5 [ARCH]

**R1 — Event-delivery & prepare non-disruption (from repeat 0):**
- `xrun_during_prepare = #{ k ∈ [K_PREPARE_START, K_PREPARE_DONE] : t_k > D_BLOCK_NS }`
- `createPerformer_result = Ok` iff `engine.createPerformer()` returned valid performer ∧ `setBlockSize(256)` returned `Result == Ok`
- `b_ready_before_xfade = (K_PREPARE_DONE < K_XFADE_START)`
- `events_delivered_A_prepare = #{ k ∈ [K_PREPARE_START, K_PREPARE_DONE] : scheduled event at k ∧ setInputValue on A with Result==Ok }`; must equal `events_scheduled_in[K_PREPARE_START, K_PREPARE_DONE]`
- `events_dropped_in_window = 0` iff ∀ scheduled events in `[K_XFADE_START, K_SWAP)`: `setInputValue` called on **both** A and B with `Result == Ok`
- `b_xfade_initial_latch_count = 1` iff at `K_XFADE_START`, `setInputValue(freqHandle, stateAt(K_XFADE_START), 0)` called on B with `Result == Ok` **(separate latch, NOT counted as scheduled event)**
- PASS: all thresholds above meet PRE-REG §5.1.

**R2 — Atomic/lock-free swap safety + reset correctness (across all repeats, ASan build for safety counts):**
- `asan_violations`, `crt_heap_violations` — parsed from ASan run log
- `result_violations` = count of Performer API calls returning `≠ Ok`
- `swap_block`, `swap_count` from `activeIndex` transition record
- `reset_called_on_B` = (`performers[1].reset()` called exactly once, on RT thread, at `k == K_SWAP`, after store, before B's first post-swap advance)
- `latch_replay_called` = (`setInputValue(freqHandle, stateAt(K_SWAP), 0)` called on B exactly once, on RT thread, at `k == K_SWAP`, after `reset()`, before B's first post-swap advance) **(separate latch, NOT counted as scheduled event)**
- `xrun_at_swap` = (at `k == K_SWAP`, `t_k ≤ D_BLOCK_NS`)
- `old_perf_released_post_crossfade` = (`old_perf_release_block ≥ K_SWAP` ∧ release after first RT `load(acquire)==1`)
- PASS: all thresholds per PRE-REG §5.2.

**R3 — Event-response correctness + click-free (repeat 0):**
- **(a)** `maxerr(reload_A[0,K_XFADE_START), REF_A slice) == 0` (sample-wise float32 exact match)
- **(b)** `mix_err = max_n |crossfade_region[n] − ((1−α(n))·A_xfade[n] + α(n)·B_xfade[n])|`; `alpha_monotone` checked
- **(c)** `maxerr(B_xfade_region, REF_Bxfade) == 0`
- **(d)** `maxerr(reload_B[K_SWAP,N), REF_Bpost) == 0` — **load-bearing**: latch-replay fidelity
- **(e)** Goertzel: `mag(dftBin_f)` over `A_PRE` and `B_POST` (`P_MEAS·256` samples each), normalized against **independent solo presence refs** at the same frequencies:
  - `rel_expected_Bpost = mag_Bpost(stateAt(K_SWAP)) / mag_solo(stateAt(K_SWAP))`
  - For each other freq `f ∈ FREQ_PALETTE \ {stateAt(K_SWAP)}`: `mag_Bpost(f) / mag_solo(f)`
  - Same for `A_PRE`: `rel_expected_Apre` at its frequency, all others
- **(f)** `click_max = max_{k, boundary_excluded} |full_output[k] − full_output[k−1]|` over:
  - `A_PRE` sample range (pure A pre-window)
  - `B_POST` sample range (pure B post-window)
  - Crossfade interior: sample offset `1..(XFADE_SAMPLES−2)` within the crossfade region
  - **Excluded:** the two crossfade-boundary sample pairs at `K_XFADE_START` block boundary and the `K_SWAP` sample pair (deterministic reset discontinuity, verified by (d))
- PASS: all thresholds per PRE-REG §5.3.

**R4 — Determinism + completeness + event-application audit:**
- `repro_ok` = all `R=5` SHA-256 hashes equal per stream (full master output, A-stream, B-stream, crossfade region)
- `blocks_rendered == 10000`, `dropped_blocks == 0`, `duplicated_blocks == 0`, `swap_block == 4064`
- **Scheduled-event count audit (from `events_applied.log`, NOT including latch events):**
  - `events_applied_A == events_scheduled_in[0, K_SWAP)`
  - `events_applied_B_pre == events_scheduled_in[K_XFADE_START, K_SWAP)`
  - `events_applied_B_post == events_scheduled_in[K_SWAP, N)`
- **Separate latch-event count audit (from `events_applied.log` latch sections, NOT included in scheduled counts):**
  - `b_xfade_initial_latch_count == 1`
  - `latch_replay_count == 1`
- PASS: all thresholds per PRE-REG §5.4.

The embedded SHA-256 hashes the raw little-endian `float32` byte stream of each buffer. Goertzel is the standard single-bin recurrence at `cos/sin(2π·f/fs)`; magnitude normalized by sample count (not squared).

---

## 9. Proof artifact (`proof`) — exactly what is written (PRE-REG §5.5) [ARCH]

Under `C:/Users/doner/SSI/g1a/_run-event-replay/artifacts/`:

1. **`trace.log`** — header (locked params, DLL version `1.0.3159`, toolchain); per-performer Result-audit summary; the worker-thread `createPerformer` Result-audit and `K_PREPARE_DONE`; the prepare-window xrun count and repeat-0 per-block timing summary (`p50/p99/max`, xrun list if any, `t_k` at `K_SWAP`); the `activeIndex` transition record (`swap_block`, `swap_count`); `reset()` call record (called on B at `K_SWAP`, before first post-swap advance); `latch_replay` call record; `b_xfade_initial_latch` call record; the `old_perf_release_block` and the RT-acquire-load ordering proving release was post-crossfade; and the **captured ASan/CRT stderr** from the ASan run (or an explicit `ASAN: no reports` line).

2. **`schedule.json`** — machine-checkable JSON:
   ```json
   {
     "seed_master": "0x6121A0003",
     "algorithm": "SplitMix64",
     "freq_palette": [220.0, 330.0, 440.0, 550.0, 660.0],
     "event_model": "change-blocks-only",
     "events": [ [<block>, <freq>], ... ],
     "events_scheduled_in_0_KSWAP": <int>,
     "events_scheduled_in_KXFADE_KSWAP": <int>,
     "events_scheduled_in_KSWAP_N": <int>,
     "sentinels": {
       "at_least_one_in_0_KXFADE": <bool>,
       "no_change_in_APRE_3488_4000": <bool>,
       "change_strictly_before_KSWAP": <bool>,
       "no_change_in_BPOST_4064_4576": <bool>,
       "at_least_one_after_BPOST": <bool>
     },
     "stateAt_KXFADE_START": <float>,
     "stateAt_KSWAP": <float>,
     "APRE_frequency": <float>,
     "sha256": "<hex>"
   }
   ```

3. **`events_applied.log`** — per-block record with separate sections:
   ```
   # EVENTS_APPLIED_A (scheduled change blocks, performer A, blocks [0, K_SWAP))
   block=<k> freq=<f> result=<Ok|Fail>  (one line per scheduled change block k)

   # EVENTS_APPLIED_B_PRE (scheduled change blocks, performer B, blocks [K_XFADE_START, K_SWAP))
   block=<k> freq=<f> result=<Ok|Fail>

   # EVENTS_APPLIED_B_POST (scheduled change blocks, performer B, blocks [K_SWAP, N))
   block=<k> freq=<f> result=<Ok|Fail>

   # X_FADE_INITIAL_LATCH (B's initial latch at K_XFADE_START, NOT a scheduled event)
   block=4000 freq=<stateAt(K_XFADE_START)> result=<Ok|Fail>

   # LATCH_REPLAY (B's re-latch after reset at K_SWAP, NOT a scheduled event)
   block=4064 freq=<stateAt(K_SWAP)> result=<Ok|Fail>

   # SUMMARY
   events_applied_A=<N_A>
   events_applied_B_pre=<N_Bpre>
   events_applied_B_post=<N_Bpost>
   b_xfade_initial_latch_count=<0|1>
   latch_replay_count=<0|1>
   ```

4. **Sample dumps** — the **required** dumps: `A_pre` (`P_MEAS·256` samples), `B_post` (`P_MEAS·256` samples), `crossfade_region` (`16,384` samples), `full_output` (entire `2,560,000` master output), `A_xfade` and `B_xfade` (per-performer crossfade-region buffers, `16,384` each). **Reference dumps:** `REF_A`, `REF_Bxfade`, `REF_Bpost`. **Solo presence refs:** `Solo_<freqApre>` and `Solo_<stateAtKSWAP>`. Each as a `.wav` (mono, `fs=48000`, 32-bit float) **and/or** raw `.pcm` float32 with a `.json` sidecar.

5. **`metrics.json`** — machine-checkable object:
   ```json
   {
     "run_params": {
       "fs": 48000, "block": 256, "n_blocks": 10000,
       "k_prepare_start": 100, "k_xfade_start": 4000, "w_xfade": 64,
       "k_swap": 4064, "p_meas": 512, "r_repeats": 5,
       "seed_master": "0x6121A0003", "dll_version": "1.0.3159",
       "amp": 0.25, "freq_palette": [220.0, 330.0, 440.0, 550.0, 660.0],
       "eps_xfade": 1e-6, "s_click": 0.05
     },
     "R1": {
       "xrun_during_prepare": <int>,
       "createPerformer_result": "Ok"|"Fail",
       "k_prepare_done": <int>,
       "b_ready_before_xfade": <bool>,
       "events_delivered_A_prepare": <int>,
       "events_expected_A_prepare": <int>,
       "events_dropped_in_window": <int>,
       "b_xfade_initial_latch_count": <int>,
       "pass": <bool>,
       "threshold": "xrun==0 & result Ok & done<4000 & delivered==expected & dropped==0 & b_xfade_initial_latch==1"
     },
     "R2": {
       "asan_violations": <int>,
       "crt_heap_violations": <int>,
       "result_violations": <int>,
       "swap_block": <int>,
       "swap_count": <int>,
       "reset_called_on_B": <bool>,
       "latch_replay_called": <bool>,
       "xrun_at_swap": <int>,
       "old_perf_release_block": <int>,
       "old_perf_released_post_crossfade": <bool>,
       "pass": <bool>,
       "threshold": "asan==0 & crt==0 & result==0 & swap_block==4064 & swap_count==1 & reset_called & latch_replay_called & xrun_at_swap==0 & released_post_crossfade"
     },
     "R3": {
       "maxerr_reload_A": <float>,
       "mix_err": <float>,
       "alpha_monotone": <bool>,
       "maxerr_B_xfade": <float>,
       "maxerr_reload_B": <float>,
       "rel_expected_Bpost": <float>,
       "other_freqs_Bpost": [<float>, ...],
       "rel_expected_Apre": <float>,
       "other_freqs_Apre": [<float>, ...],
       "click_max": <float>,
       "click_boundary_excluded": true,
       "pass": <bool>,
       "threshold": "maxerr_A==0 & mix_err<=1e-6 & monotone & maxerr_Bxfade==0 & maxerr_B==0 & rel_Bpost>=0.40 & others<=0.10 & rel_Apre>=0.40 & others<=0.10 & click<=0.05"
     },
     "R4": {
       "hashes_full": [<5x sha256>],
       "hashes_A": [<5x sha256>],
       "hashes_B": [<5x sha256>],
       "hashes_xfade": [<5x sha256>],
       "repro_ok": <bool>,
       "blocks_rendered": <int>,
       "dropped_blocks": <int>,
       "duplicated_blocks": <int>,
       "swap_block": <int>,
       "events_applied_A": <int>,
       "events_scheduled_pre_swap": <int>,
       "events_applied_B_pre": <int>,
       "events_scheduled_xfade": <int>,
       "events_applied_B_post": <int>,
       "events_scheduled_post_swap": <int>,
       "b_xfade_initial_latch_count": <int>,
       "latch_replay_count": <int>,
       "pass": <bool>,
       "threshold": "repro_ok & blocks==10000 & dropped==0 & dup==0 & swap_block==4064 & applied_A==scheduled_pre_swap & applied_B_pre==scheduled_xfade & applied_B_post==scheduled_post_swap & b_xfade_initial_latch==1 & latch_replay==1"
     },
     "asan_clean": <bool>,
     "proof_complete": <bool>,
     "final_verdict": "PASS"|"FAIL"
   }
   ```
   The thresholds embedded in `metrics.json` are **copies of the locked values** — the verifier cross-checks them against PRE-REG §7 and FAILS on any mismatch.

---

## 10. Consistency map — HARNESS-SPEC ↔ PRE-REGISTRATION [ARCH]

| PRE-REG section | HARNESS-SPEC realisation |
|---|---|
| §3 Windows-feasible event-replay correctness strategy | §0 ASan build, §6 swap/release + reset + latch-replay, §7 seeded interleaving stress, §0 single-thread engine-access invariant |
| §4.1 toolchain | §0, §7 build commands |
| §4.2 audio + timeline params | §2 `host_config.h` |
| §4.3 single event-reactive patch | §3 `patches.h`, §4 single-engine setup |
| §4.4 threading/swap/crossfade/reset/latch-replay | §4 engine setup, §6 mutually exclusive rt_render + bg_prepare + swap + crossfade |
| §4.5 crossfade math + adversarial interleaving | §6 `crossfade` per-sample α, §7 `perturb` |
| §4.6 event schedule (locked, sentinels) | §2 `event_schedule`, §9 `schedule.json` |
| §4.7 reference renders (oracles) | §5 step 3, `reference.{h,cpp}`: REF_A, REF_Bxfade (with initial latch), REF_Bpost (with latch-replay), solo presence refs |
| §5.1 R1 | §8 R1 (prepare non-disruption + event-delivery + b_xfade_initial_latch_count), §9 metrics.json.R1 |
| §5.2 R2 | §8 R2 (swap safety + reset + latch-replay + xrun_at_swap), §9 metrics.json.R2 |
| §5.3 R3 | §8 R3 (bit-exact + Goertzel + mix identity + slew with K_SWAP excluded), §9 metrics.json.R3 |
| §5.4 R4 | §8 R4 (hashes + completeness + event-application audit with separate latch counts), §9 metrics.json.R4 |
| §5.5 proof artifact | §9 `proof` (trace.log, schedule.json, events_applied.log, dumps, metrics.json) |
| §6 decision rule | §5 step 7 verdict |
| §8 fallback | §5 step 7 echoes the PRE-REG §8 verbatim block on FINAL FAIL |
| §9 verifier contract | §10 consistency map (verifier uses this to cross-check), §9 frozen schema |
| §10 out-of-scope | not implemented (full MIDI, phase-continuous replay, transport-sync, multi-stream, TSan/Linux) |
| Repeat lifecycle (§4.4) | §5 step 4: recreate performer A fresh each repeat from engine; safe release of old A within repeat |

---

## 11. Lock statement [ARCH]

This spec implements **exactly** the locked PRE-REGISTRATION and **no more**. It contains **no C++ code** and **no result**. Every constant traces to PRE-REG §7. The event-replay mechanism is built **only** on the grounded API surface: single-engine `createPerformer()` for shared handles (dossier §5, §8 Strategy A), `setInputValue(freqHandle, f, 0)` for latching frequency values (dossier §3), `reset()` + latch-replay for event-replay across the boundary (dossier §8), `std::atomic<uint32_t>` index swap into `cmaj::Performer[2]` (RELOAD-GROUNDING §2), COM-atomic safe release (RELOAD-GROUNDING §3), host-side per-sample crossfade (RELOAD-GROUNDING §4). The event model is locked: `setInputValue` is called **only on scheduled change blocks** plus the two explicitly separate latch events (`b_xfade_initial_latch` at `K_XFADE_START`, `latch_replay` at `K_SWAP`) — never idempotently re-stated every block. The engine-access invariant is locked: engine accessed by exactly one thread at a time; RT thread never touches the engine; worker calls `createPerformer(B)` solo. The orchestrator SHA-256-freezes this file alongside `PRE-REGISTRATION.md`; the verifier FAILS the run if either hash changes or if the executed harness deviates from this spec (different params, tuned thresholds, extra synchronization beyond the locked `activeIndex`/`bReady`/crossfade-barrier, a swap at a block other than `K_SWAP`, omitted reset or latch-replay, missing proof component, or per-block latch re-statement). **No spike is run and no results are produced in this phase.**
