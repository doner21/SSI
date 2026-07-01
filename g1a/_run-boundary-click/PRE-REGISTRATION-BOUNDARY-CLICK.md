# PRE-REGISTRATION — G1A Swap-Boundary Click (tightly-scoped)

**Authored by:** ORCHESTRATOR (inter-phase deterministic gate). **Date:** 2026-07-01
**Parent chain:** `_run-event-replay/` (FAIL) → `_run-xfade-recheck/` (FAIL, but crossfade **phase solved**:
warm-up normalization drives `maxerr_B_xfade → 0`; thread-of-creation confirmed as the phase cause).
**Status at freeze:** no fix code written; no measured number exists below.

---

## 1. What is already won (evidence, do not re-litigate)

- Event-replay across the swap is **bit-exact** (`maxerr_reload_B == 0`).
- Crossfade anti-phase is **eliminated** by warm-up normalization (Variant E: advance worker-B by
  `W_WARM=1`, then `reset()`, then latch, BEFORE crossfading) → `maxerr_B_xfade = 0`.
- The oracle cursor bug (`renderRefBxfade` delivered 0 of 2 in-window events) is fixed.
- **Sole remaining defect:** `click_max = 0.247` (gate `≤ 0.05`) at the `K_SWAP` boundary — a
  reset+latch-replay transient, distinct from the crossfade, and it PERSISTS even with the phase fixed
  and the exact boundary sample excluded from the click metric.

## 2. Hypothesis under test

> The residual click is a **waveform discontinuity introduced by the `reset()`+latch-replay at `K_SWAP`**:
> the warmed-up B is already phase-correct and full-gain at the end of the crossfade, so re-`reset()`ing
> it at the swap jumps its phase relative to the crossfade output. Either (F) **not** resetting a
> warmed-up B at the swap, or (G) an **equal-power micro-fade across the boundary**, brings
> `click_max ≤ 0.05` while preserving every won invariant.

## 3. Variants (both built + measured; both build on the Variant-E warm-up)

- **Variant F — no-reset continuation at swap.** Warm-up B during xfade (Variant E). At `k==K_SWAP`:
  atomically drop A and **continue the already-warmed, phase-correct B WITHOUT calling `reset()` or
  re-latching** (B's naturally-advanced state is the swap state). Must still: perform the swap exactly
  once at `K_SWAP`, release A post-swap, stay ASan-clean, and keep post-swap output bit-exact
  (`maxerr_reload_B == 0`).
- **Variant G — equal-power boundary micro-fade.** Keep the Variant-E warm-up AND the `reset()`+latch at
  `K_SWAP`, but apply an **equal-power (constant-power) micro-fade of `W_BND_SAMPLES=256` samples
  straddling `K_SWAP`** between the pre-swap (A-crossfaded) stream and the post-swap B stream, to smooth
  the discontinuity. Must keep post-swap output converge to bit-exact after the micro-fade window.

## 4. LOCKED run parameters (inherit parent; additions below). No threshold may be tuned.

`fs=48000, block=256, N_blocks=10000, K_PREPARE_START=100, K_XFADE_START=4000, W_XFADE=64,
K_SWAP=4064, P_MEAS=512, R_repeats=5, seed_master=0x6121A0003, AMP=0.25,
freq_palette=[220,330,440,550,660], EPS_XFADE=1e-6, S_CLICK=0.05, W_WARM=1, W_BND_SAMPLES=256,
DLL CmajPerformer.dll v1.0.3159.`
Click metric = max |x[n]-x[n-1]| over the full output with the single exact `K_SWAP` boundary sample
excluded (same definition as parent; `click_boundary_excluded=true`).

## 5. Gates (per full-run variant; PASS iff ALL hold)

| Run | Gate |
|-----|------|
| R1 | `xrun_during_prepare==0` ∧ `createPerformer==Ok` ∧ windowed `events_delivered_A_prepare == events_scheduled_in[K_PREPARE_START,K_PREPARE_DONE]` (strict `==`) ∧ `dropped==0` ∧ `b_xfade_initial_latch_count==1` |
| R2′ | `asan==0` ∧ `crt==0` ∧ `result_violations==0` ∧ `swap_block==4064` ∧ `swap_count==1` ∧ `xrun_at_swap==0` ∧ `old_perf_released_post_swap==true`  (NOTE: `reset_called_on_B` is **not** mandated — Variant F intentionally omits it; Variant G retains it) |
| R3 | `maxerr_reload_A==0` ∧ `mix_err<=1e-6` ∧ `alpha_monotone` ∧ `maxerr_B_xfade==0` ∧ `maxerr_reload_B==0` ∧ `rel_expected_Bpost>=0.40` ∧ `rel_expected_Apre>=0.40` ∧ **`click_max<=0.05`** (inside R3_pass) |
| R4 | `repro_ok` (5 SHA-256 identical) ∧ `blocks==10000` ∧ `dropped==0` ∧ `dup==0` ∧ event audit all match |
| Global | `asan_clean` ∧ `proof_complete` |

## 6. Verdict rule

`FINAL PASS iff (Variant F PASS) ∨ (Variant G PASS)` under §5, naming the passing variant(s).
`FINAL FAIL otherwise.`

## 7. Pre-declared fallback (verbatim, emitted on FINAL FAIL)

> If the swap-boundary click cannot be brought `≤ 0.05` while preserving bit-exact post-swap
> (`maxerr_reload_B==0`) and crossfade phase (`maxerr_B_xfade==0`), adopt the **HYBRID** bridge:
> warm-up-normalized crossfade for the regenerate transition **plus per-block idempotent frequency
> re-statement across the `K_SWAP` boundary** (re-send current input values every block at/after the
> swap; state converges within one block period) in place of the reset+latch-replay swap. If the
> crossfade phase itself regresses, fall all the way back to full per-block idempotent frequency
> re-statement and investment-freeze the live-crossfade bridge.

## 8. Integrity requirements

- Copy sources from `_run-event-replay/spike/`; carry forward the shapeA gate fixes AND the shapeB
  oracle-cursor fix + Variant-E warm-up. Do NOT modify any parent run.
- Emit per-variant `metrics.json` + `trace.log` + WAV proofs + ASan log + build/cert logs.
- Verifier recomputes THIS file's SHA-256 vs freeze, refuses PASS on any tampering/tuning, and bases the
  verdict strictly on emitted artifacts, not executor narrative.
