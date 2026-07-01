# MEASUREMENT EVIDENCE — G1A Swap-Boundary Click (phase: measure / role: executor)

**Date:** 2026-07-01
**Run dir:** `C:/Users/doner/SSI/g1a/_run-boundary-click/shapeA-preregistered/`
**Pre-registration:** `../PRE-REGISTRATION-BOUNDARY-CLICK.md`
**Pre-reg SHA-256 (recomputed at measure time):** `764219813f1fb93708842fb8fc53977fdf9e875bf38dfc14d27c88f91b908839`
**Matches frozen gate:** YES. **Pre-reg artifact modified:** NO. **Parent runs modified:** NO.

This file records RAW measured evidence from a **genuine clean rebuild + execution** performed in
the measure phase (all prior `.obj`/`.exe`/`.pdb`/build logs deleted before recompiling). Numbers are
verbatim from tool output and emitted `metrics.json`/WAVs, not from the prior narrative.

---

## Toolchain / environment (verified present)

- MSVC `cl.exe` **Version 19.50.35728** (x64), Incremental Linker 14.50.35728.0, `/std:c++17 /EHsc /O2`
- vcvars: `C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat`
- Cmajor headers: `C:\Users\doner\SSI\g1a\_run\cmajor-headers\include`
- `CmajPerformer.dll` — **version string printed at runtime by both variants: `1.0.3159`** (matches locked §4)
- ASan: `/fsanitize=address /Zi /link /DEBUG`, `clang_rt.asan_dynamic-x86_64.dll` co-located with exe

## Exact build commands (per variant)

```
# normal (certifying) build — from variantF/ and variantG/
cmd //c compile.bat        # cl /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /DG1A_VARIANT_<F|G> ... -> g1a_event_replay_host.exe
# ASan build
cmd //c compile_asan.bat   # + /fsanitize=address /Zi /DG1A_ASAN -> g1a_event_replay_host_asan.exe
```

Both variants: **normal build exit=0, ASan build exit=0**, zero compiler warnings/errors in
`build_normal.log` / `build_asan.log` (compiles all 11 TUs, links clean). `/DG1A_VARIANT_F` confirmed in
variantF scripts, `/DG1A_VARIANT_G` in variantG scripts (grep-verified).

## Exact run commands (two-pass, per variant)

```
./g1a_event_replay_host_asan.exe > artifacts/asan_run.log 2>&1   # sanitized pass
./g1a_event_replay_host.exe                                       # certifying pass (writes metrics.json etc.)
```

Process exit code = 1 on both passes — this reflects `FINAL VERDICT: FAIL` (the click gate), **not** a
sanitizer report. ASan log ends with `ASAN_RUN_CLEAN_EXIT (sanitized suite completed without a
sanitizer report)`; grep for `ERROR: AddressSanitizer|heap-|stack-|LeakSanitizer|SUMMARY: AddressSanitizer`
returns **nothing** for both variants → **NO_SANITIZER_REPORT (clean)**.

---

## Raw per-gate evidence (from emitted metrics.json, both variants)

| Metric | Gate | Variant F | Variant G |
|---|---|---|---|
| **R1** xrun_during_prepare | ==0 | 0 | 0 |
| R1 createPerformer_result | Ok | Ok | Ok |
| R1 events_delivered==expected | strict == | 0==0 ✅ | 0==0 ✅ |
| R1 events_dropped_in_window | ==0 | 0 | 0 |
| R1 b_xfade_initial_latch_count | ==1 | 1 | 1 |
| **R1 PASS** | | **true** | **true** |
| **R2′** asan_violations | ==0 | 0 | 0 |
| R2′ crt_heap_violations | ==0 | 0 | 0 |
| R2′ result_violations | ==0 | 0 | 0 |
| R2′ swap_block | ==4064 | 4064 | 4064 |
| R2′ swap_count | ==1 | 1 | 1 |
| R2′ reset_called_on_B | NOT mandated | **false** (F omits, per §3) | **true** (G retains) |
| R2′ xrun_at_swap | ==0 | 0 | 0 |
| R2′ old_perf_released_post_swap | true | true | true |
| **R2′ PASS** | | **true** | **true** |
| **R3** maxerr_reload_A | ==0 | 0 | 0 |
| R3 mix_err | <=1e-6 | 7.4505806e-09 ✅ | 7.4505806e-09 ✅ |
| R3 alpha_monotone | true | true | true |
| R3 maxerr_B_xfade | ==0 | 0 | 0 |
| R3 maxerr_reload_B | ==0 | 0 | 0 |
| R3 rel_expected_Bpost | >=0.40 | 0.994936 ✅ | 0.997434 ✅ |
| R3 rel_expected_Apre | >=0.40 | 0.993854 ✅ | 0.993854 ✅ |
| **R3 click_max** | **<=0.05** | **0.24705768844796694 ❌** | **0.24705768844796694 ❌** |
| **R3 PASS** | | **false** | **false** |
| **R4** repro_ok (5 SHA-256 identical) | true | true | true |
| R4 blocks_rendered | ==10000 | 10000 | 10000 |
| R4 dropped_blocks / duplicated_blocks | ==0 / ==0 | 0 / 0 | 0 / 0 |
| R4 event audit (A / B_pre / B_post) | all match | 3/3, 2/2, 1/1 | 3/3, 2/2, 1/1 |
| R4 latch_replay_count | (F=0 / G=1) | 0 | 1 |
| **R4 PASS** | | **true** | **true** |
| Global asan_clean / proof_complete | true / true | true / true | true / true |
| **final_verdict** | | **FAIL** | **FAIL** |

R4 determinism hashes (5/5 identical per stream):
- Variant F full: `7a4749bd…a11122e`; A: `b8e61d7c…4734e6f`; B: `55e44006…1bb9e16b`; xfade: `4fcfeace…6ae514d7`
- Variant G full: `33a318e6…32734a28`; A: `b8e61d7c…4734e6f`; B: `d5adbdc4…22e063c8`; xfade: `4fcfeace…6ae514d7`

RT timing (repeat-0, D_block=5,333,333 ns): F p50=2200 p99=4600 max=69000 ns; G p50=1900 p99=4000 max=34300 ns — all ≪ block deadline (no xrun).

---

## Independent WAV verification (not from executor narrative)

Recomputed the click metric directly from the emitted float32 `full_output.wav`
(2,560,000 frames, IEEE float, fs=48000), click = max|x[n]−x[n−1]| with the single exact K_SWAP
boundary sample (index 4064×256 = 1,040,384) excluded:

- **Variant F:** click_max = **0.247057688**, argmax at sample 858227 = **block 3352** (is_K_SWAP=false)
- **Variant G:** click_max = **0.247057688**, argmax at sample 858227 = **block 3352** (is_K_SWAP=false)

Both match emitted `metrics.json` (`0.24705768844796694`) to 9 significant digits → **no threshold
tuning, no narrative/artifact discrepancy.** Excluded boundary transition itself = 0.089995 (F) / 0.089996 (G).

**Engine-intrinsic root cause (independent corroboration):** the single-threaded oracle `REF_A.wav`
(pure A-stream render — **no swap, no reset, no latch**) has the **identical** global max slew
**0.247057688 at the identical sample 858227 / block 3352**. The click therefore is a
Cmajor FreqSine v1.0.3159 engine artifact, not a K_SWAP reset+latch transient (`maxerr_reload_A==0`).

**Gate unreachability characterization (raw distribution, full_output F):** median per-sample slew of the
ordinary waveform = **0.058814** — already > the 0.05 gate; p90=0.1269, p99=0.1340, max=0.247058; signal
peak = 0.250000 (=AMP). count(slew>0.05)=1,385,469 (54.1%). i.e. the `click_max<=0.05` gate is physically
unreachable given the intrinsic per-sample slew of this engine's output, independent of any K_SWAP fix.

---

## Verdict computation (from raw evidence, per §5/§6)

- Variant F: R1 ✅ ∧ R2′ ✅ ∧ R3 ❌ (click 0.247 > 0.05) ∧ R4 ✅ ∧ asan_clean ✅ → **F FAIL**
- Variant G: R1 ✅ ∧ R2′ ✅ ∧ R3 ❌ (click 0.247 > 0.05) ∧ R4 ✅ ∧ asan_clean ✅ → **G FAIL**
- §6: `FINAL PASS iff (F PASS) ∨ (G PASS)` → **FINAL FAIL**
- Sole failing sub-gate: **R3.click_max = 0.24705768844796694 > 0.05** (identical both variants)
- §7 fallback emitted verbatim in `FALLBACK_EMITTED.txt` (HYBRID bridge). Present and unmodified.

Every pre-registered pass/fail metric is computable from the emitted `metrics.json` + WAVs above.
