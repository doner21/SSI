# ATT_RUN_REPORT.md — G1A Patch-Fix Confirmation (shapeB-dualplan)

**Date:** 2026-07-01  
**Run dir:** `C:/Users/doner/SSI/g1a/_run-patchfix-confirm/shapeB-dualplan/`  
**Pre-registration:** `../PRE-REGISTRATION-PATCHFIX.md`  
**Pre-reg SHA-256:** `ea053f8250e5e5096fdf5abb6bd1ef84d80eab0aa151ec561093a03228e57411`  
**Recomputed match:** ✅ YES

---

## Verdict

# FINAL VERDICT: PASS ✅

**Rule:** `FINAL PASS iff (P0 click_max <= 0.05) ∧ (P1 full R1–R4 PASS)` (pre-reg §6)

| Criterion | Result | Gate |
|-----------|--------|------|
| P0 click_max ≤ 0.05 | 0.02159 | ✅ PASS |
| P1 R1 (prepare) | PASS | ✅ |
| P1 R2′ (swap safety) | PASS | ✅ |
| P1 R3 (correctness + click) | PASS | ✅ |
| P1 R4 (determinism + audit) | PASS | ✅ |

---

## §1 Pre-Registration Integrity

- **File:** `C:/Users/doner/SSI/g1a/_run-patchfix-confirm/PRE-REGISTRATION-PATCHFIX.md`
- **Expected SHA-256:** `ea053f8250e5e5096fdf5abb6bd1ef84d80eab0aa151ec561093a03228e57411`
- **Recomputed SHA-256:** `ea053f8250e5e5096fdf5abb6bd1ef84d80eab0aa151ec561093a03228e57411`
- **Match:** ✅ YES
- **prereg_modified:** false

---

## §2 Treatment: The One-Line Patch Fix

The ONLY functional change vs the parent winning bridge:

```diff
--- patches.h (buggy, line 29)
+++ patches.h (corrected, line 29)
-            out <- float (0.25 * sin (twoPi * phase));
+            out <- float (0.25 * sin (phase));
```

- **Accumulator unchanged:** `phase = addModulo2Pi (phase, float (twoPi * freq * processor.period));`
- **Applied to:** variantP0, variantP1 (corrected render paths)
- **Buggy control:** diag-buggy-P0 (identical to pre-fix state)

Verified diff between `variantP0/patches.h` and `diag-buggy-P0/patches.h`: exactly **1 line** differs, accumulator identical.

---

## §3 Locked Parameters (pre-reg §4)

All frozen, no tuning:
- fs=48000, block=256, N_blocks=10000
- K_PREPARE_START=100, K_XFADE_START=4000, W_XFADE=64, K_SWAP=4064
- P_MEAS=512, R_repeats=5, seed_master=0x6121A0003
- AMP=0.25, freq_palette=[220,330,440,550,660]
- EPS_XFADE=1e-6, S_CLICK=0.05, REL_MIN=0.40
- W_WARM=1, DLL CmajPerformer.dll v1.0.3159
- MSVC cl 19.50, C++17, /DCMAJOR_DLL=1, /DG1A_VARIANT_F (P1)

---

## §4 Variant P0: Corrected Patch, No-Swap Render

**Driver:** `p0_main.cpp` (one performer, phase 0, full [0, N_BLOCKS) timeline, no swap/reset/latch/crossfade/perturbation)  
**Metric:** `max|x[n]-x[n-1]|` over entire output, **NO sample excluded**  
**Patches.h:** `sin(phase)` (corrected)

| Metric | Value |
|--------|-------|
| **click_max** | **0.0215917** |
| click_max ≤ 0.05 | ✅ **PASS** |
| argmax_sample | 1,479,753 |
| argmax_block | 5,780 |
| argmax_offset | 73 |
| argmax_prev | +0.010803 |
| argmax_cur | −0.010789 |
| slew_median | 0.009456 |
| slew_p95 | 0.021271 |
| slew_p99 | 0.021579 |
| slew_mean | 0.009301 |
| events_applied | 4 |
| output_sha256 | `3070e2d8beef62de39472ad39535273c5c7ecf7018af5d7373d1eb3d3880b312` |

---

## §5 Diag Buggy-P0 Control

**Driver:** identical `p0_main.cpp` (same path, same params)  
**Patches.h:** `sin(twoPi*phase)` (buggy, unchanged, confirmed by runtime trace detection from FREQ_SINE_SOURCE)

| Metric | Value |
|--------|-------|
| **click_max** | **0.247058** |
| click_max ≤ 0.05 | ❌ FAIL |
| argmax_sample | 858,227 |
| argmax_block | **3,352** |
| argmax_offset | 115 |
| argmax_prev | +0.247067 |
| argmax_cur | +0.000009 |
| slew_median | 0.059271 |
| slew_p95 | 0.132546 |
| slew_p99 | 0.134045 |
| slew_mean | 0.058692 |
| output_sha256 | `c7d08e1eff06043a23b1bd66f2d2533455edf4fbf42148bb43be540e73eee58b` |

---

## §6 Before/After Slew Comparison

| Metric | Buggy (sin(2π·phase)) | Corrected (sin(phase)) | Δ |
|--------|----------------------|----------------------|---|
| click_max | 0.247058 | 0.021592 | **−91.3%** |
| argmax_block | 3,352 | 5,780 | — |
| slew_median | 0.059271 | 0.009456 | **−84.0%** |
| slew_p95 | 0.132546 | 0.021271 | **−84.0%** |
| slew_p99 | 0.134045 | 0.021579 | **−83.9%** |
| slew_mean | 0.058692 | 0.009301 | **−84.2%** |

The buggy click at block 3352 (~0.247) matches the pre-reg prediction.  
The corrected click at block 5780 (~0.0216) matches the predicted 660 Hz peak slew ≈ 0.25·2π·660/48000 ≈ 0.0216.

---

## §7 Variant P1: Full Winning Bridge (Variant-F), Corrected Patch

**Driver:** `main.cpp` (parent winning bridge) compiled with `/DG1A_VARIANT_F`  
**Bridge:** Variant-E warm-up (W_WARM=1) + Variant-F no-reset continuation at K_SWAP  
**Patches.h:** `sin(phase)` (corrected)  
**Click metric:** K_SWAP boundary sample excluded (pre-reg §4)

### R1: Event-Delivery & Prepare Non-Disruption

| Metric | Value | Gate | Result |
|--------|-------|------|--------|
| xrun_during_prepare | 0 | ==0 | ✅ |
| createPerformer_result | Ok | Ok | ✅ |
| k_prepare_done | 101 | < 4000 | ✅ |
| b_ready_before_xfade | true | true | ✅ |
| events_delivered_A_prepare | 0 | ==0 (strict) | ✅ |
| events_dropped_in_window | 0 | ==0 | ✅ |
| b_xfade_initial_latch_count | 1 | ==1 | ✅ |
| **R1 PASS** | | | ✅ |

### R2′: Atomic Swap Safety

| Metric | Value | Gate | Result |
|--------|-------|------|--------|
| asan_violations | 0 | ==0 | ✅ |
| crt_heap_violations | 0 | ==0 | ✅ |
| result_violations | 0 | ==0 | ✅ |
| swap_block | 4064 | ==4064 | ✅ |
| swap_count | 1 | ==1 | ✅ |
| xrun_at_swap | 0 | ==0 | ✅ |
| old_perf_released_post_crossfade | true | true | ✅ |
| **R2′ PASS** | | | ✅ |

### R3: Event-Response Correctness + Click-Free

| Metric | Value | Gate | Result |
|--------|-------|------|--------|
| maxerr_reload_A | 0.0 | ==0 (strict) | ✅ |
| mix_err | 7.45×10⁻⁹ | ≤1×10⁻⁶ | ✅ |
| alpha_monotone | true | true | ✅ |
| maxerr_B_xfade | 0.0 | ==0 (strict) | ✅ |
| maxerr_reload_B | 0.0 | ==0 (strict) | ✅ |
| rel_expected_Bpost | 1.00003 | ≥0.40 | ✅ |
| rel_expected_Apre | 0.999997 | ≥0.40 | ✅ |
| **click_max** | **0.021592** | **≤0.05** | ✅ |
| **R3 PASS** | | | ✅ |

Click details (K_SWAP boundary excluded):
- argmax_sample = 1,537,541 (block 6006, offset 5)
- prev = +0.010805, cur = −0.010787
- is_K_SWAP = false (argmax is NOT at the swap boundary)

### R4: Determinism + Completeness + Event Audit

| Metric | Value | Gate | Result |
|--------|-------|------|--------|
| repro_ok | true (5/5 identical SHA) | true | ✅ |
| blocks_rendered | 10,000 | ==10,000 | ✅ |
| dropped_blocks | 0 | ==0 | ✅ |
| duplicated_blocks | 0 | ==0 | ✅ |
| swap_block | 4,064 | ==4,064 | ✅ |
| events_applied_A | 3 | ==3 (scheduled) | ✅ |
| events_applied_B_pre | 2 | ==2 (scheduled) | ✅ |
| events_applied_B_post | 1 | ==1 (scheduled) | ✅ |
| b_xfade_initial_latch_count | 1 | ==1 | ✅ |
| **R4 PASS** | | | ✅ |

Full output SHA-256 (all 5 repeats identical):  
`5e0313397f5dac016892332b81d9e9fa956c6779a6208b5ece1859372a261d66`

---

## §8 ASan Certification

| Variant | ASan Violations | CRT Violations | Clean | ASan Log |
|---------|----------------|----------------|-------|----------|
| P0 Corrected | 0 | 0 | ✅ | `variantP0/artifacts/asan_run.log` |
| Buggy-P0 | 0 | 0 | ✅ | `diag-buggy-P0/artifacts/asan_run.log` |
| P1 ASan | 0 | 0 | ✅ | `variantP1/artifacts/asan_run.log` |

All three variants were built with `/fsanitize=address /Zi /link /DEBUG` and executed.
No sanitizer reports were emitted for any variant.

P0 Corrected ASan exit: `P0 FINAL VERDICT: PASS` (no ASan violations)  
Buggy-P0 ASan exit: `P0 FINAL VERDICT: FAIL` (click > 0.05, no ASan violations)  
P1 ASan exit: `ASAN_RUN_CLEAN_EXIT (sanitized suite completed without a sanitizer report)`

---

## §9 Artifacts Emitted

### variantP0/artifacts/
- `P0_full_output.wav` (10,240,044 bytes, 2,560,000 samples)
- `P0_focus_region.wav` (192,044 bytes, ±0.5 s around argmax)
- `metrics.json` (corrected P0 metrics)
- `schedule.json`, `trace.log`
- `asan_run.log` (ASan: 0 violations, clean)
- `run_normal.log`

### diag-buggy-P0/artifacts/
- `P0_full_output.wav` (10,240,044 bytes)
- `P0_focus_region.wav` (192,044 bytes)
- `metrics.json` (buggy P0 metrics)
- `schedule.json`, `trace.log`
- `asan_run.log` (ASan: 0 violations, clean)
- `run_normal.log`

### variantP1/artifacts/
- `full_output.wav`, `A_pre.wav`, `B_post.wav`
- `crossfade_region.wav`, `A_xfade.wav`, `B_xfade.wav`
- `REF_A.wav`, `REF_Bxfade.wav`, `REF_Bpost.wav`
- `Solo_440.wav`, `Solo_550.wav`
- `metrics.json`, `trace.log`, `schedule.json`, `events_applied.log`
- `asan_run.log`

### Build logs (run root)
- `build_P0_normal.log`, `build_P0_asan.log`
- `build_buggyP0_normal.log`, `build_buggyP0_asan.log`
- `build_P1_normal.log`, `build_P1_asan.log`

---

## §10 Cross-Corroboration with shapeA

shapeA preregistered-concurrency-spike independently reported:
- P0 click_max = 0.02159 @ block 5780
- Buggy click_max = 0.24706 @ block 3352

shapeB-dualplan independently confirms:
- P0 click_max = 0.02159 @ block 5780 ✅
- Buggy click_max = 0.24706 @ block 3352 ✅

**The two shapes corroborate within machine precision.**

---

## §11 Harness Source

- **Base copy from:** `_run-event-replay/spike/` (DLLs v1.0.3159)
- **Winning bridge source from:** `_run-boundary-click/shapeB-dualplan/` (Variant-E, Variant-F, oracle-cursor fix, gate-fidelity fixes)
- **No files from shapeA-preregistered used as source** (cross-check only)
- **No parent-run modifications**
- **No threshold tuning**

---

## §12 Verdict Summary

| Gate | Result |
|------|--------|
| Pre-reg SHA-256 match | ✅ |
| P0 click_max = 0.02159 ≤ 0.05 | ✅ PASS |
| Buggy control click_max = 0.24706 (confirms bug presence) | ✅ confirmed |
| P1 R1 (prepare non-disruption) | ✅ PASS |
| P1 R2′ (swap safety) | ✅ PASS |
| P1 R3 (correctness + click-free) | ✅ PASS |
| P1 R4 (determinism + audit) | ✅ PASS |
| ASan clean (P1) | ✅ |
| Proof complete (all variants) | ✅ |

**FINAL VERDICT: PASS** ✅

The one-line patch fix (`sin(twoPi*phase)` → `sin(phase)`) removes the residual click.  
The corrected-patch live-crossfade bridge passes end-to-end on all gates.  
Cross-shape corroboration (shapeA ↔ shapeB) is exact.
