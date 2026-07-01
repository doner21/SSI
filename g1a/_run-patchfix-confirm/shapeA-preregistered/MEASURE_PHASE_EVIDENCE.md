# MEASURE PHASE — RAW EVIDENCE (G1A PATCH-FIX CONFIRMATION)

Role: executor / phase "measure". This file records the **independent clean-rebuild
and re-run** of the spike, with verbatim command output and the exact build/run
commands used. Every pre-registered gate metric is computable from the raw numbers
below. No thresholds were altered; the frozen pre-registration was never edited.

## 0. Integrity preconditions (raw)

```
$ sha256sum C:/Users/doner/SSI/g1a/_run-patchfix-confirm/PRE-REGISTRATION-PATCHFIX.md
ea053f8250e5e5096fdf5abb6bd1ef84d80eab0aa151ec561093a03228e57411 *PRE-REGISTRATION-PATCHFIX.md
```
Frozen reference SHA-256 = `ea053f8250e5e5096fdf5abb6bd1ef84d80eab0aa151ec561093a03228e57411` → **MATCH**.

Parent run unchanged (still buggy — NOT modified by this run):
```
$ grep -n "out <-" C:/Users/doner/SSI/g1a/_run-boundary-click/shapeA-preregistered/variantF/patches.h
29:            out <- float (0.25 * sin (twoPi * phase));
```

Patch under test (this run):
```
variantP0/patches.h  :29:  out <- float (0.25 * sin (phase));         # corrected (treatment)
variantP1/patches.h  :29:  out <- float (0.25 * sin (phase));         # corrected (treatment)
diag-buggy-P0/patches.h:29: out <- float (0.25 * sin (twoPi * phase)); # buggy baseline (control)
```

Toolchain / DLL (raw):
```
Microsoft (R) C/C++ Optimizing Compiler Version 19.50.35728 for x64
** Visual Studio 2026 Developer Command Prompt v18.4.3  (vcvars64.bat x64)
DLL CmajPerformer.dll v1.0.3159   (string "1.0.3159" present in binary)
CmajPerformer.dll sha256 = bcf457086fe3d021d760e62b4e40c8ed5f19a7f639b82e269a0bbccb6027af9f
  (bit-identical across variantP0 / variantP1 / diag-buggy-P0 / parent _run-event-replay/spike)
```

## 1. Exact build commands (all via MSVC cl 19.50.35728, C++17, /O2)

Normal build (P0):
```
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /DG1A_VARIANT_F \
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:g1a_p0_host.exe \
  p0_main.cpp engine_setup.cpp event_schedule.cpp bg_prepare.cpp rt_render.cpp \
  crossfade.cpp swap.cpp reference.cpp perturb.cpp metrics.cpp proof.cpp
→ NORMAL_BUILD_EXIT=0
```
ASan build (P0): same + `/Zi /DG1A_ASAN /fsanitize=address /link /DEBUG`, `/Fe:g1a_p0_host_asan.exe`
→ `ASAN_BUILD_EXIT=0`.

P1 uses `main.cpp` (full bridge driver) instead of `p0_main.cpp`, `/Fe:g1a_event_replay_host{,_asan}.exe`;
same flags. Both builds → EXIT 0.

diag-buggy-P0: identical to P0 build but with the buggy `patches.h`, `/Fe:g1a_p0_buggy_host{,_asan}.exe`
→ both EXIT 0.

## 2. Run order (raw)

Locked run order: ASan build first (sanitized render → asan_run.log), then normal build (certifying).
NOTE on Device Guard/WDAC: the unsigned **normal** P0 exe was blocked at run time
(`"was blocked by your organization's Device Guard policy"`, exit 199). Per `run_cert.bat`'s
documented WDAC fallback, the **ASan build is the certifying render** and writes the full artifact
set (metrics.json, WAVs, trace.log). The P1 normal exe was allowed and produced an identical verdict.
The ASan renders are clean, so no metric is lost.

---

## 3. VARIANT P0 — corrected patch, plain no-swap render (verbatim)

```
$ ./g1a_p0_host_asan.exe
=== G1A PATCH-FIX CONFIRM — Variant P0 (plain no-swap render, ASan build) ===
DLL loaded, version 1.0.3159
Engine (FreqSine, corrected patch) built: freqHandle=1 outHandle=2
Event schedule: 4 events
Rendered 10000 blocks (2560000 samples), events applied = 4

=== P0 METRICS (corrected patch, plain no-swap render) ===
  click_max          = 0.021591742523  (gate: <= 0.05)
  argmax block       = 5780 (sample 1479753, offset 73)
  slew median (p50)  = 0.00945574045181
  slew p95           = 0.0212710164487
  slew p99           = 0.0215789619833
  events_applied     = 4
  output sha256      = 3070e2d8beef62de39472ad39535273c5c7ecf7018af5d7373d1eb3d3880b312
  P0 = PASS
ASAN_RUN_CLEAN_EXIT (P0 sanitized render completed without a sanitizer report)

=== P0 VERDICT: PASS ===
```
Emitted `variantP0/artifacts/metrics.json`: `click_max=0.021591742523014545`, `argmax_block=5780`,
`slew_median=0.0094557404518127441`, `slew_p95=0.021271016448736191`, `slew_p99=0.021578961983323097`,
`P0_pass=true`, `asan_build=true`, `output_sha256=3070e2d8…`.
**GATE P0: click_max 0.0215917 ≤ 0.05 → PASS.** ASan clean.

## 4. VARIANT P1 — full bridge, corrected patch (verbatim, normal certifying run)

```
$ g1a_event_replay_host.exe
=== G1A BOUNDARY-CLICK spike — Variant F (normal build) ===
DLL loaded, version 1.0.3159
Engine (FreqSine) built: freqHandle=1 outHandle=2
Event schedule: 4 events
  sentinel(≥1 in [0, K_XFADE)): OK
  sentinel(no change in A_PRE): OK
  sentinel(change before K_SWAP): OK
  sentinel(no change in B_POST): OK
  sentinel(≥1 after B_POST): OK
  stateAt(K_XFADE_START)=440, stateAt(K_SWAP)=550, A_PRE freq=440
Rendering references...
  REF_A: 1040384 samples
  REF_Bxfade: 16384 samples
  REF_Bpost: 1519616 samples
  Solo presence refs: Apre=440 Hz, Kswap=550 Hz
Repeat 0 (perturb=off) rendering...
Repeat 1..4 (perturb=on) rendering...

=== METRIC SUMMARY ===
R1 (prepare non-disruption): PASS  xrun=0 create=Ok k_done=101 latch=1
R2 (swap+safety):           PASS  asan=0 crt=0 result=0 swap_block=4064 reset=N latch_replay=N xrun_swap=0
R3 (event+crossfade):       PASS  maxerr_A=0 mix_err=7.44922e-09 maxerr_Bxfade=0 maxerr_B=0 rel_Bpost=1.00003 click=0.0215917
R4 (determinism+audit):     PASS  repro=Y blocks=10000 evA=3/3 evBpre=2/2 evBpost=1/1 latch_xfade=1 latch_replay=0
asan_clean=true proof_complete=true

=== FINAL VERDICT: PASS ===
```
The ASan build (`asan_run.log`) produced the identical METRIC SUMMARY and
`ASAN_RUN_CLEAN_EXIT (sanitized suite completed without a sanitizer report)`.

Emitted `variantP1/artifacts/metrics.json` raw gate values:
| Gate | Raw evidence | Threshold | Result |
|------|-------------|-----------|--------|
| R1 | xrun_during_prepare=0, createPerformer_result=Ok, k_prepare_done=101, dropped=0, b_xfade_initial_latch=1 | xrun==0 & Ok & done<4000 & dropped==0 & latch==1 | **PASS** |
| R2′ | asan_violations=0, crt_heap_violations=0, result_violations=0, swap_block=4064, swap_count=1, xrun_at_swap=0, old_perf_released_post_crossfade=true | asan==0 & crt==0 & result==0 & swap@4064 & count==1 & xrun_swap==0 & released | **PASS** |
| R3 | maxerr_reload_A=0, mix_err=7.4492162716e-09, alpha_monotone=true, maxerr_B_xfade=0, maxerr_reload_B=0, rel_Bpost=1.00002658, rel_Apre=0.99999710, click_max=0.021591742523 | ==0 & <=1e-6 & monotone & ==0 & ==0 & >=0.40 & >=0.40 & click<=0.05 | **PASS** |
| R4 | repro_ok=true (5/5 identical full-hashes 5e031339…), blocks_rendered=10000, dropped=0, dup=0, events A=3/3, B_pre=2/2, B_post=1/1 | repro & blocks==10000 & dropped==0 & dup==0 & audit match | **PASS** |
| global | asan_clean=true, proof_complete=true, final_verdict=PASS | | **PASS** |

R4 repeat hashes (all 5 identical): `5e0313397f5dac016892332b81d9e9fa956c6779a6208b5ece1859372a261d66`.
11 WAV proofs emitted (all valid RIFF/WAVE): A_pre, A_xfade, B_post, B_xfade, REF_A, REF_Bpost,
REF_Bxfade, Solo_440, Solo_550, crossfade_region, full_output.

## 5. BEFORE/AFTER slew — identical P0 render path (diag-buggy-P0, verbatim)

```
$ ./g1a_p0_buggy_host_asan.exe        # same driver + params, ONLY patches.h reverted to buggy
  click_max          = 0.247057688448  (gate: <= 0.05)
  argmax block       = 3352 (sample 858227, offset 115)
  slew median (p50)  = 0.0592713654041
  slew p95           = 0.132546454668
  slew p99           = 0.134044989944
  output sha256      = c7d08e1eff06043a23b1bd66f2d2533455edf4fbf42148bb43be540e73eee58b
  P0 = FAIL
ASAN_RUN_CLEAN_EXIT
```
Emitted `diag-buggy-P0/artifacts/metrics.json`: `click_max=0.24705768844796694`, `argmax_block=3352`,
`argmax_offset=115`, `slew_median=0.059271365404129028`.

| | buggy (`sin(twoPi*phase)`) | corrected (`sin(phase)`) | ratio |
|---|---|---|---|
| click_max | 0.24705768844796694 | 0.021591742523014545 | ↓ 11.44× |
| slew_median | 0.05927136540412903 | 0.00945574045181274 | ↓ 6.27× |
| argmax block | 3352 (offset 115) | 5780 (offset 73) | — |
| P0 gate | FAIL (>0.05) | PASS (≤0.05) | — |
| output sha256 | c7d08e1e… | 3070e2d8… | differ ⇒ fix changed output |

The buggy render reproduces the parent `_run-boundary-click` click **bit-for-bit**:
`0.24705768844796694 @ block 3352, offset 115`. This cross-validates the P0 path (identical harness;
only the doubled-twoPi differs).

## 6. Sanitizer / UB scan (raw)

```
$ grep -rniE "AddressSanitizer|ERROR:|heap-buffer|use-after|stack-buffer|SEGV|runtime error|LeakSanitizer|undefined behavior" \
    variantP0/artifacts/asan_run.log variantP1/artifacts/asan_run.log diag-buggy-P0/artifacts/buggy_run.log
(no matches; grep exit=1)
```
All three ASan renders completed with `ASAN_RUN_CLEAN_EXIT` / `asan_clean=true` and zero sanitizer,
CRT-heap, or result violations.

## 7. Gate computation (from raw evidence, per PRE-REG §5/§6)

- **P0 gate:** click_max = 0.021591742523014545 ≤ 0.05 → **PASS**.
- **P1 gate:** R1 ∧ R2′ ∧ R3 ∧ R4 ∧ asan_clean ∧ proof_complete → **PASS**.
- **FINAL (§6):** (P0 click ≤ 0.05) ∧ (P1 R1–R4 PASS) → **PASS**.
- §7 fallback: **NOT emitted** (both conditions hold; doubled-twoPi diagnosis CONFIRMED).

All numbers above were produced by a from-scratch clean rebuild (objs/exes/artifacts deleted first)
and re-run in this measure phase; they reproduce the prior phase's emitted metrics.json bit-for-bit.
