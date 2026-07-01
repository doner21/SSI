# G1A Falsifier — HARNESS SPECIFICATION (implementation blueprint)

**Companion to:** `C:/Users/doner/SSI/g1a/_run/PRE-REGISTRATION.md` (the locked falsifier). This file is the **buildable spec** the shape's implement phase will build **EXACTLY**. It contains **NO C++ code** — only the design the implementation must realise. Every parameter here is the locked value from the PRE-REGISTRATION; **the harness implements these and only these.**

**Grounding (verified):** `C:/Users/doner/SSI/g1a/_run/SDK-GROUNDING.md` (§4 exact API call sequence, §3 `CMAJOR_DLL=1` + include chain, §6 gotchas, §6.2 sanitizer matrix + per-Performer single-thread model) and `C:/Users/doner/SSI/g1a/_run/SMOKE-TEST-REPORT.md` (single-performer render PROVEN; 5 header-usage corrections; ASan available & clean; Inno-Setup DLL acquisition).

**No-result rule:** this phase writes the spec only. No spike is run; no numbers are reported as observed.

---

## 0. Target runtime, language, and constraints [ARCH]

- **Language/std:** C++17, MSVC `cl.exe 19.50` (VS18 BuildTools), under `vcvars64.bat` (x64). No C++20.
- **No third-party libraries** beyond the Cmajor headers + CHOC submodule already vendored at `cmajor-headers/include/` and the C++ standard library (`<thread>`, `<atomic>`, `<barrier>` or hand-rolled CV barrier, `<chrono>`, `<cstdint>`, `<vector>`). A minimal SHA-256 (single-file public-domain implementation embedded in the host source) computes the proof hashes; **no external crypto dependency**.
- **Cmajor API contract (locked, from SDK-GROUNDING §6.2):** each `cmaj::Performer` is used from **exactly one thread**; every `cmaj::Engine` `load`/`link` is **single-threaded on the main thread before any RT thread starts**. The DLL is loaded once via `cmaj::Library::initialise("CmajPerformer.dll")` with the DLL copied next to the `.exe`.
- **Header-usage corrections are mandatory (from SMOKE-TEST §4):** `AllocatedBuffer` has no public `.data` — use `.getView().data.data`; `Result` is `enum class : int32_t {Ok = 0, …}` (check `== Ok`, no `getMessage()`); `EndpointHandle` is `uint32_t` (check `!= 0`); `createInterleavedBuffer(...)` template deduces Sample from the lambda (no explicit `<float>`); redefine `CHOC_ASSERT(x)` to `assert(x)` for a console app.

---

## 1. File / module layout under `g1a/_run/spike/` [ARCH]

| File | Responsibility |
|---|---|
| `host_config.h` | The single locked-parameter header (every constant from PRE-REG §7). No tunables elsewhere. |
| `patches.h` | The two locked Cmajor source strings (`SineA` 440 Hz, `SineB` 880 Hz) as inline string literals. |
| `engine_setup.{h,cpp}` | Main-thread Engine/Performer construction per performer (the SDK-GROUNDING §4 sequence). |
| `rt_performer.{h,cpp}` | The per-performer render worker (one thread): advance/copy a block into its own slot. |
| `barrier_mixer.{h,cpp}` | The per-block two-party barrier + the mixer sum `mixed[k] = slotA[k] + slotB[k]`. |
| `perturb.{h,cpp}` | Deterministic seeded interleaving-perturbation schedule (SplitMix64-style) for repeats 1..4. |
| `metrics.{h,cpp}` | Goertzel, per-block timing reduction, bit-compare, SHA-256, metric estimators (PRE-REG §5). |
| `proof.{h,cpp}` | Writes `trace.log`, the `.wav`/`.pcm` dumps, and `metrics.json` (PRE-REG §5.5). |
| `main.cpp` | Orchestrates the locked run order (§5 below); emits the FINAL PASS/FAIL verdict. |
| `compile.bat` / `compile_asan.bat` | The two locked build commands (§7 below). |

The build produces **two** executables from the same sources: `g1a_host.exe` (normal) and `g1a_host_asan.exe` (`/fsanitize=address`). Both run the full suite; ASan-clean is checked from the ASan run.

---

## 2. `host_config.h` — the single locked-parameter object [ARCH]

All constants below are the PRE-REGISTRATION §7 locked values. They appear **once**, here:

| Name | Value | Source |
|---|---|---|
| `SAMPLE_RATE` | `48000` (Hz) | PRE-REG §4.2 |
| `BLOCK_SIZE` | `256` (frames, mono) | PRE-REG §4.2 |
| `N_BLOCKS` | `10000` (blocks/performer) | PRE-REG §4.2 |
| `D_BLOCK_NS` | `5333333` (ns; = 256/48000 s) | PRE-REG §5.2 |
| `R_REPEATS` | `5` | PRE-REG §4.2 |
| `SEED_MASTER` | `0x6121A0001` (uint64) | PRE-REG §4.2 |
| `FREQ_A` | `440.0` (Hz, A4) | PRE-REG §4.3 |
| `FREQ_B` | `880.0` (Hz, A5) | PRE-REG §4.3 |
| `FREQ_CTL` | `660.0` (Hz, control bin) | PRE-REG §5.3 |
| `EPS_MIX` | `1e-6` | PRE-REG §5.3 |
| `REL_MIN` | `0.40` (rel440, rel880 floor) | PRE-REG §5.3 |
| `REL_CTL_MAX` | `0.10` (control leakage ceiling) | PRE-REG §5.3 |
| `DLL_NAME` | `"CmajPerformer.dll"` (v1.0.3159) | PRE-REG §4.1 |
| `INCLUDE_ROOT` | `cmajor-headers/include` | PRE-REG §4.1 |

Total rendered samples per stream: `TOTAL_SAMPLES = N_BLOCKS * BLOCK_SIZE = 2,560,000`.

---

## 3. `patches.h` — the two locked Cmajor patches [ARCH] *(music register load-bearing)*

Two **self-oscillating sine** processors, an **octave apart** so their mixed spectrum has energy in two **distinct** DFT bins (the property M3 verifies). Each is a complete Cmajor program (following SDK-GROUNDING §5 Option B form: `out <- sin(phase); phase = addModulo2Pi(phase, freq * processor.period * twoPi)`), with `output stream float out;` and **no input** (deterministic, phase 0 at block 0):

- **`SineA`** — processor emitting a `440.0 Hz` sine (A4).
- **`SineB`** — processor emitting an `880.0 Hz` sine (A5, one octave up).

The exact source strings are inline `R"(...)"` literals in `patches.h`. They differ **only** in the frequency constant, so the two JIT compiles are genuinely independent programs (the §2.1 hidden-global-state probe). Phase initialisation is fixed; no randomness inside the DSP. *(The "fed" clause of the falsifiable question is honored by the control configuration in §6; the primary signal patches stay input-free for clean frequency-domain distinguishability.)*

---

## 4. Engine/Performer construction (`engine_setup`) — locked call sequence [ARCH]

Per performer `P ∈ {A, B}`, on the **main thread only** (matches SDK-GROUNDING §4 exactly):

1. `cmaj::Library::initialise(DLL_NAME)` — **once** for the process (not per performer); abort on false.
2. `auto engine = cmaj::Engine::create();` — **a separate Engine per performer** (Engine A, Engine B).
3. `cmaj::Program program; program.parse(messages, "internal", <SineA|SineB source>);` — abort on parse error.
4. `engine.setBuildSettings(cmaj::BuildSettings().setFrequency(48000).setMaxBlockSize(256).setSessionID(<A|B id>));`
5. `engine.load(messages, program, {}, {});` — abort on false.
6. `auto outHandle = engine.getEndpointHandle("out");` — **after load, before link** (SDK-GROUNDING §6.5); check `!= 0`.
7. `engine.link(messages);` — abort on false.
8. `auto performer = engine.createPerformer();`
9. `performer.setBlockSize(256);` — check `Result == Ok`.

Both performers are fully constructed and linked **before** any RT thread is spawned. Handles (`outHandle_A`, `outHandle_B`), Engines, and Performers are owned by `main` and passed by reference to the RT workers. (For the §6 control config, the input-fed variant additionally captures an `in` handle and pre-builds a `setInputFrames` buffer.)

---

## 5. The locked run order (`main.cpp`) [ARCH]

`main` executes in this exact order; the verifier checks the order is honored:

1. **Construct** Performer A and Performer B (§4), single-threaded.
2. **Solo renders (isolation reference, §4.6 of PRE-REG):** render `A_solo` then `B_solo`, each single-threaded, `N_BLOCKS` blocks, into `float[TOTAL_SAMPLES]` buffers. (Performers are re-created or reset to phase 0 so solo and concurrent start from identical state.)
3. **Concurrent repeats:** for `r = 0..R_REPEATS-1`:
   - Re-create/reset both performers to phase-0 initial state.
   - Spawn **RT thread A** and **RT thread B** (§6). Repeat `r = 0` injects **no** perturbation; repeats `r = 1..4` use the seeded perturbation schedule (`perturb`, §7 below).
   - Each thread renders `N_BLOCKS` blocks into its own `slotA`/`slotB` per-block storage; the per-block barrier + mixer (`barrier_mixer`) produces `mixed_r[k]`.
   - On `r = 0` **only**: record per-block compute times (M2) into a timing vector.
   - Store the full `A_r`, `B_r`, `mixed_r` buffers (or their SHA-256 immediately, to bound memory) for the determinism check.
   - Join both threads before the next repeat (no overlap between repeats).
4. **Compute metrics** M1–M4 (`metrics`, §8) from the buffers/timings/Result-codes/hashes.
5. **Write proof artifact** (`proof`, §9): `trace.log`, the five `.wav`/`.pcm` dumps (from repeat 0 + solos), `metrics.json`.
6. **Emit verdict:** FINAL PASS iff `M1 ∧ M2 ∧ M3 ∧ M4 ∧ proof-exists ∧ asan-clean` (PRE-REG §6); else FINAL FAIL (and the runner echoes the §8 fallback block).

ASan run: `g1a_host_asan.exe` runs the same order; its stderr/ASan output is captured to `trace.log` and `asan_clean` is set from whether any ASan/CRT report appeared.

---

## 6. RT performer worker + barrier mixer [ARCH]

**`rt_performer` (one thread per performer, owns exactly one Performer — SDK-GROUNDING §6.2):** for each block `k = 0..N_BLOCKS-1`:
1. *(control config only)* `setInputFrames(inHandle, inBuf, 256)` — see input note below.
2. `performer.advance();` — capture `Result`; record into the per-performer Result-audit.
3. `performer.copyOutputFrames(outHandle, &slot[k*BLOCK_SIZE], 256);` — capture `Result`. Destination is this performer's **own** slot region only.
4. *(repeat r ≥ 1)* apply the perturbation hook for block `k` (a bounded `std::this_thread::yield()` / short spin per the seeded schedule).
5. Arrive at the **per-block barrier** for block `k`.

**`barrier_mixer` (the only cross-thread synchronization — PRE-REG §3.3, §4.4):** a two-party reusable barrier. After **both** threads arrive for block `k`, the mixer computes `mixed[k*256 + j] = slotA[k*256 + j] + slotB[k*256 + j]` for `j = 0..255`, then releases both threads to block `k+1`. Implementation: `std::barrier` (C++20) is **not** available under C++17 here — use a hand-rolled barrier built from `std::mutex` + `std::condition_variable` + a generation counter, **or** two `std::atomic<uint64_t>` block-completion counters spun on by the mixer. **No shared mutable buffer is written by both threads:** thread A writes only `slotA`, thread B only `slotB`, the mixer writes only `mixed` and reads `slotA`/`slotB` strictly after the barrier. This design is the static audit target the verifier checks (PRE-REG §9.5).

**Input note (the "fed" clause):** the falsifiable question requires performers be "fed." The primary signal patches (§3) are self-oscillating for clean spectral distinguishability, so the "fed" obligation is satisfied by a **parallel control configuration**: a second pair of patches/run where each performer is a `Passthrough`/`Gain` (SDK-GROUNDING §5 Option A/C) driven by a deterministic per-block input buffer via `setInputFrames`, advanced and mixed identically. The control config exercises the full `setInputFrames → advance → copyOutputFrames` concurrent path; its M1/M2/M4 results are recorded in `metrics.json` under `control_config` but the **gated** M3 distinguishability metric is evaluated on the sine pair. *(If the implement phase prefers a single configuration, it MAY instead add a `setInputFrames` DC-feed of value 0.0 to the sine patches' unused input — but the locked, preferred design is the self-oscillating sines for M3 + the passthrough control for the "fed" path.)*

---

## 7. Deterministic perturbation schedule (`perturb`) + build configs [ARCH]

**`perturb` (PRE-REG §4.5):** a SplitMix64-style splittable PRNG seeded by `hash(SEED_MASTER, r)` for repeat `r`. It produces, per RT thread, a deterministic boolean (and bounded micro-delay magnitude) per block deciding whether to inject a `yield`/short-spin at that block's perturbation hook. The schedule is **fixed by `(SEED_MASTER, r, threadId)`** so each repeat's interleaving pressure is reproducible. The perturbation changes **interleaving only**, never inputs or phase — so a correct, race-free implementation must produce **bit-identical** audio across all repeats (M4a). Repeat `r = 0` injects nothing (clean timing reference for M2).

**Build commands (the two locked configs):**
- **Normal:** `cl /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /I"<INCLUDE_ROOT>" /Fe:g1a_host.exe main.cpp engine_setup.cpp rt_performer.cpp barrier_mixer.cpp perturb.cpp metrics.cpp proof.cpp` (under `vcvars64.bat`).
- **ASan:** identical plus `/fsanitize=address` and `/Fe:g1a_host_asan.exe`; requires `clang_rt.asan_dynamic-x86_64.dll` at runtime (present at `g1a/_run/`). Per SMOKE-TEST §7, add `/Zi`/`/DEBUG` for better ASan reporting.
`CmajPerformer.dll` must sit next to both `.exe`s (SDK-GROUNDING §6.1).

---

## 8. Metric estimators (`metrics`) — exact, per PRE-REG §5 [ARCH]

- **M1 (completeness + safety).** Sum Result-audit ≠ `Ok` across all calls → `result_violations`; count successfully completed blocks per performer → must equal `10000`; `asan_violations`/`crt_heap_violations` parsed from the ASan run log. PASS: all zero, both counts = 10000.
- **M2 (xrun).** From the repeat-0 per-block timing vector (`QueryPerformanceCounter` deltas in ns): `xrun_count = #{ k : t_k > D_BLOCK_NS }`; also `p50`, `p99`, `max`. PASS: `xrun_count = 0`. (`p99 ≤ 0.5·D_BLOCK_NS` reported, not gated.)
- **M3 (mix correctness).** Goertzel magnitude at `FREQ_A`, `FREQ_B`, `FREQ_CTL` over the full `2,560,000`-sample repeat-0 mixed buffer, and the solo buffers; `rel440 = mag_mixed(440)/mag_Asolo(440)`, `rel880 = mag_mixed(880)/mag_Bsolo(880)`, `relCtl = mag_mixed(660)/max(mag_Asolo(440),mag_Bsolo(880))`; `mix_err = max_k |mixed[k] − (A_conc[k]+B_conc[k])|`. PASS: `rel440 ≥ 0.40 ∧ rel880 ≥ 0.40 ∧ relCtl ≤ 0.10 ∧ mix_err ≤ 1e-6`. Goertzel is the standard single-bin recurrence at `cos/sin(2π·f/fs)`; magnitude normalised by sample count.
- **M4 (determinism + isolation).** `repro_ok` = all `R` SHA-256 hashes equal per stream (A, B, mixed); `iso_A_err = max_k |A_conc(r0)[k] − A_solo[k]|`; `iso_B_err` likewise. PASS: `repro_ok ∧ iso_A_err == 0.0 ∧ iso_B_err == 0.0` (exact float equality).

The embedded SHA-256 hashes the raw little-endian `float32` byte stream of each buffer.

---

## 9. Proof artifact (`proof`) — exactly what is written (PRE-REG §5.5) [ARCH]

Under `C:/Users/doner/SSI/g1a/_run/artifacts/`:

1. **`trace.log`** — header (locked params, DLL version `1.0.3159`, toolchain); per-performer Result-audit summary; repeat-0 per-block timing summary (p50/p99/max, xrun list if any); barrier-arrival ordering sample; and the **captured ASan/CRT stderr** from the ASan run (or an explicit `ASAN: no reports` line).
2. **Sample dumps** — `A_solo`, `B_solo`, `A_concurrent` (repeat 0), `B_concurrent` (repeat 0), `mixed` (repeat 0), each as a `.wav` (mono, `fs=48000`, 32-bit float) **and/or** raw `.pcm` float32 with a `.json` sidecar (`fs`, channels=1, count=2,560,000).
3. **`metrics.json`** — machine-checkable object:
   ```
   {
     "run_params": { "fs":48000, "block":256, "n_blocks":10000, "r_repeats":5,
                     "seed_master":"0x6121A0001", "dll_version":"1.0.3159",
                     "freq_a":440.0, "freq_b":880.0, "freq_ctl":660.0 },
     "M1": { "result_violations":<int>, "blocks_A":<int>, "blocks_B":<int>,
             "asan_violations":<int>, "crt_heap_violations":<int>, "pass":<bool>,
             "threshold":"all zero; blocks==10000" },
     "M2": { "xrun_count":<int>, "p50_ns":<int>, "p99_ns":<int>, "max_ns":<int>,
             "d_block_ns":5333333, "pass":<bool>, "threshold":"xrun_count==0" },
     "M3": { "rel440":<float>, "rel880":<float>, "rel_ctl":<float>, "mix_err":<float>,
             "pass":<bool>, "threshold":"rel440>=0.40 & rel880>=0.40 & rel_ctl<=0.10 & mix_err<=1e-6" },
     "M4": { "hashes_A":[5x sha256], "hashes_B":[5x sha256], "hashes_mixed":[5x sha256],
             "repro_ok":<bool>, "iso_A_err":<float>, "iso_B_err":<float>, "pass":<bool>,
             "threshold":"all R hashes equal per stream & iso_*_err==0.0" },
     "asan_clean":<bool>,
     "proof_complete":<bool>,
     "final_verdict":"PASS"|"FAIL",
     "control_config": { "M1":..., "M2":..., "M4":... }   // the "fed" passthrough path (§6)
   }
   ```
   The verifier recomputes M1–M4 from the dumps and confirms `metrics.json` is consistent (its hashes match the dumped buffers). The thresholds embedded here are **copies of the locked values** — the verifier cross-checks them against PRE-REG §7 and FAILS on any mismatch.

---

## 10. Consistency map — HARNESS-SPEC ↔ PRE-REGISTRATION [ARCH]

| PRE-REG section | HARNESS-SPEC realisation |
|---|---|
| §3 Windows-feasible concurrency strategy | §1 ASan build, §6 barrier (no unsynchronized shared mutable state), §7 seeded interleaving stress |
| §4.1 toolchain | §0, §7 build commands |
| §4.2 audio params | §2 `host_config.h` |
| §4.3 two patches (440/880) | §3 `patches.h` |
| §4.4 thread + mixer model | §4 engine setup, §6 rt_performer + barrier_mixer |
| §4.5 adversarial interleaving | §7 `perturb` |
| §4.6 solo/isolation renders | §5 step 2 |
| §5.1 M1 | §8 M1, §9 metrics.json.M1 |
| §5.2 M2 | §8 M2, §9 metrics.json.M2 |
| §5.3 M3 | §8 M3 (Goertzel + sum identity), §9 metrics.json.M3 |
| §5.4 M4 | §8 M4 (hashes + isolation), §9 metrics.json.M4 |
| §5.5 proof artifact | §9 `proof` |
| §6 decision rule | §5 step 6 verdict |
| §8 fallback | §5 step 6 echoes the verbatim block on FINAL FAIL |
| §10 out-of-scope | not implemented (event-replay, transport-sync, latency-comp, patch-swap, live-reload, TSan/Linux) |

---

## 11. Lock statement [ARCH]

This spec implements **exactly** the locked PRE-REGISTRATION and **no more**. It contains **no C++ code** and **no result**. Every constant traces to PRE-REG §7. The orchestrator SHA-256-freezes this file alongside `PRE-REGISTRATION.md`; the verifier FAILS the run if either hash changes or if the executed harness deviates from this spec (different params, tuned thresholds, extra synchronization beyond the locked barrier, or a missing proof component). **No spike is run and no results are produced in this phase.**
