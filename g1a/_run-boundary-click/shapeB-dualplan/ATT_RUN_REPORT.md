# ATT_RUN_REPORT — G1A Swap-Boundary Click (shapeB-dualplan)

**Executor:** shapeB-dualplan executor (deepseek-v4-pro)
**Date:** 2026-07-01
**Pre-registration:** `C:/Users/doner/SSI/g1a/_run-boundary-click/PRE-REGISTRATION-BOUNDARY-CLICK.md`
**Pre-reg SHA-256:** `764219813f1fb93708842fb8fc53977fdf9e875bf38dfc14d27c88f91b908839` ✓ (recomputed and confirmed)

---

## 1. Provenance

- Sources copied from `_run-event-replay/spike/` into `shapeB-dualplan/`.
- Parent runs (`_run-event-replay/`, `_run-xfade-recheck/`, `shapeA-*`) are **not** modified.
- Four carried-forward fixes applied:
  1. **Oracle-cursor fix** in `renderRefBxfade`: `nextEventIdx` advanced past events with `block < K_XFADE_START`.
  2. **Variant-E warm-up** in RT Branch 2 and oracles: advance B by `W_WARM=1` block into local scratch before crossfade reset+latch.
  3. **ShapeA gate fixes**: R1 strict `==`, R3 strict `==0` maxerr, `click_max<=0.05` inside `R3_pass`.
  4. **R2′/R4**: `reset_called_on_B` and `latch_replay_count` removed from gates (still emitted for audit).

## 2. Source Changes (relative to `_run-event-replay/spike/`)

| File | Change |
|------|--------|
| `host_config.h` | Added `W_WARM=1`, `W_BND_SAMPLES=256` |
| `crossfade.h` | Added `#include <cmath>`, added `equalPowerBoundarySample()` inline helper |
| `metrics.h` | Added `ClickAnalysis` struct and `clickAnalyze()` declaration |
| `metrics.cpp` | Implemented `clickAnalyze()` with argmax + slew percentiles |
| `proof.h` | Extended `MetricResults` with click argmax, REF_A fields, `maxerr_reload_B_scope`, `maxerr_bnd_window`, `engine_intrinsic_verdict` |
| `proof.cpp` | Updated `trace.log` and `metrics.json` output for new fields; updated threshold strings for R2′/R4 |
| `main.cpp` | Replaced `FALLBACK_VERBATIM` with §7 HYBRID; R1 windowed delivered count (strict `==`); R2′ removed reset/latch_replay gates; R3 strict `==0` + `click_max<=S_CLICK` inside gate; R4 removed `latch_replay_count` gate; added click argmax/slew analysis for `master0` and `REF_A`; variant-aware `maxerr_reload_B` scoping |
| `rt_render.cpp` | Variant-E warm-up in Branch 2; variant-aware Branch 3 (`#ifdef G1A_VARIANT_F` / `G1A_VARIANT_G`) |
| `reference.cpp` | Oracle-cursor fix in `renderRefBxfade`; warm-up in all oracles; variant-aware `renderRefBpost` |
| `compile_F.bat`, `compile_G.bat` | Per-variant build scripts with `/DG1A_VARIANT_F` / `/DG1A_VARIANT_G`, `objF\`/`objG\` object dirs |
| `compile_F_asan.bat`, `compile_G_asan.bat` | Per-variant ASan build scripts |
| `run_F.bat`, `run_G.bat` | Per-variant run scripts (ASan → cert) |

## 3. Locked Parameters (from metrics.json, confirmed verbatim §4)

| Parameter | Value | Match |
|-----------|-------|-------|
| `fs` | 48000 | ✓ |
| `block` | 256 | ✓ |
| `N_blocks` | 10000 | ✓ |
| `K_PREPARE_START` | 100 | ✓ |
| `K_XFADE_START` | 4000 | ✓ |
| `W_XFADE` | 64 | ✓ |
| `K_SWAP` | 4064 | ✓ |
| `P_MEAS` | 512 | ✓ |
| `R_repeats` | 5 | ✓ |
| `seed_master` | 0x6121A0003 | ✓ |
| `AMP` | 0.25 | ✓ |
| `W_WARM` | 1 | ✓ |
| `W_BND_SAMPLES` | 256 | ✓ |
| `S_CLICK` | 0.05 | ✓ |
| DLL version | 1.0.3159 | ✓ |

## 4. Per-Variant Gate Results

### Variant F — No-Reset Continuation

| Gate | Result | Key Values |
|------|--------|------------|
| R1 | **PASS** | xrun=0, createPerformer=Ok, k_done=101<4000, delivered==expected (strict), dropped=0, latch=1 |
| R2′ | **PASS** | asan=0, crt=0, result=0, swap_block=4064, swap_count=1, xrun_swap=0, released_post_crossfade=true (reset=false, latch_replay=false — not gated) |
| R3 | **FAIL** | maxerr_A=0, mix_err=7.45e-9≤1e-6, maxerr_Bxfade=0, maxerr_reload_B=0 (scope: full), rel_Bpost=0.995, rel_Apre=0.994, **click_max=0.247 > 0.05** |
| R4 | **PASS** | repro=true (5/5 identical), blocks=10000, dropped=0, dup=0, events equal, latch_xfade=1, latch_replay=0 |
| Global | **PASS** | asan_clean=true, proof_complete=true |

### Variant G — Equal-Power Micro-Fade

| Gate | Result | Key Values |
|------|--------|------------|
| R1 | **PASS** | xrun=0, createPerformer=Ok, k_done=101<4000, delivered==expected (strict), dropped=0, latch=1 |
| R2′ | **PASS** | asan=0, crt=0, result=0, swap_block=4064, swap_count=1, xrun_swap=0, released_post_crossfade=true (reset=true, latch_replay=true — not gated) |
| R3 | **FAIL** | maxerr_A=0, mix_err=7.45e-9≤1e-6, maxerr_Bxfade=0, maxerr_reload_B=0 (scope: post_bnd_window per §3), maxerr_bnd_window=0.482, rel_Bpost=0.997, rel_Apre=0.994, **click_max=0.247 > 0.05** |
| R4 | **PASS** | repro=true (5/5 identical), blocks=10000, dropped=0, dup=0, events equal, latch_xfade=1, latch_replay=1 |
| Global | **PASS** | asan_clean=true, proof_complete=true |

## 5. Engine-Intrinsic vs Swap-Boundary Determination

### Click Argmax (both variants — identical)

| Field | Variant F | Variant G |
|-------|-----------|-----------|
| `click_max` | 0.247058 | 0.247058 |
| `argmax_sample` | 858227 | 858227 |
| `argmax_block` | 3352 | 3352 |
| `argmax_offset` | 115 | 115 |
| `argmax_prev` | 0.247067 | 0.247067 |
| `argmax_cur` | 8.988e-06 | 8.988e-06 |
| `is_K_SWAP` | false | false |

**The argmax is at block 3352, NOT at the K_SWAP boundary (block 4064).**

### REF_A (No-Swap Oracle) Comparison

| Field | master0 | REF_A |
|-------|---------|-------|
| `click_max` | 0.247058 | 0.247058 |
| `argmax_sample` | 858227 | 858227 |
| `argmax_block` | 3352 | 3352 |
| `slew_median` | 0.058814 | 0.000000 |
| `slew_p95` | 0.132550 | 0.088436 |
| `slew_p99` | 0.134045 | 0.089970 |
| `slew_mean` | 0.058551 | 0.022875 |

**REF_A reproduces the identical click (0.247058) at the identical sample (858227) with NO swap.** The argmax is the same value at the same sample with no swap involved. This is definitive.

### Slew Analysis

- Median per-sample slew in `master0`: **0.058814 > 0.05** → `S_CLICK=0.05` is physically unreachable with any K_SWAP-level strategy.
- The engine-intrinsic single-sample dropout produces a slew of 0.247 at block 3352, offset 115: the sample drops from 0.247067 to 8.988e-06 (near zero) in one sample, consistent with a Cmajor FreqSine v1.0.3159 internal phase discontinuity or sample dropout.

### Verdict: **ENGINE_INTRINSIC — CONFIRMED**

The residual click is an engine-intrinsic artifact of Cmajor FreqSine v1.0.3159, not a swap-boundary artifact. The claim from the prior shapeA run is **independently confirmed** from raw WAV analysis in two independently-compiled variants.

## 6. Final Verdict per §6

`FINAL PASS iff (Variant F PASS) ∨ (Variant G PASS)`

| Variant | R1 | R2′ | R3 | R4 | Global | Verdict |
|---------|-----|------|-----|-----|--------|---------|
| F | PASS | PASS | FAIL | PASS | PASS | FAIL |
| G | PASS | PASS | FAIL | PASS | PASS | FAIL |

**FINAL VERDICT: FAIL**

Neither variant passes R3 because the click at block 3352 is engine-intrinsic, present identically in the no-swap oracle REF_A, and `click_max=0.247058 > 0.05`. No swap-boundary strategy can fix an engine-intrinsic dropout.

---

## §7 Pre-Declared Fallback (Verbatim)

> If the swap-boundary click cannot be brought `≤ 0.05` while preserving bit-exact post-swap
> (`maxerr_reload_B==0`) and crossfade phase (`maxerr_B_xfade==0`), adopt the **HYBRID** bridge:
> warm-up-normalized crossfade for the regenerate transition **plus per-block idempotent frequency
> re-statement across the `K_SWAP` boundary** (re-send current input values every block at/after the
> swap; state converges within one block period) in place of the reset+latch-replay swap. If the
> crossfade phase itself regresses, fall all the way back to full per-block idempotent frequency
> re-statement and investment-freeze the live-crossfade bridge.
