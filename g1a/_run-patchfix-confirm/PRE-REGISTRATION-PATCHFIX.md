# PRE-REGISTRATION — G1A Patch-Fix Confirmation (doubled-twoPi oscillator bug)

**Authored by:** ORCHESTRATOR (inter-phase deterministic gate). **Date:** 2026-07-01
**Parent chain:** `_run-event-replay/` → `_run-xfade-recheck/` (crossfade phase solved) →
`_run-boundary-click/` (residual click proven engine/patch-intrinsic, at block 3352, present in the
no-swap oracle REF_A; median per-sample slew 0.0588 > 0.05).
**Status at freeze:** no fix code written; no measured number exists below.

---

## 1. The claim under test

The residual `click_max = 0.247` (median slew 0.0588) that fails the `S_CLICK=0.05` gate is caused by a
**bug in the toy test patch**, NOT by Cmajor's runtime and NOT by the reload bridge.

The bug (`patches.h` line 29–30): `phase` is accumulated in **radians**
(`phase = addModulo2Pi(phase, twoPi*freq*period)`) and wrapped mod 2π, but the output computes
`sin(twoPi * phase)` — a **spurious second `twoPi`**. Correct radian-convention output is `sin(phase)`.
Predicted effect of the bug: effective per-sample phase step ≈ `twoPi·(twoPi·440/48000) ≈ 0.362` rad →
peak slew ≈ `0.25·0.362 ≈ 0.090`, median ≈ `0.0577` (matches measured 0.0588), plus a wrap
discontinuity every fundamental period.

## 2. The one-line fix (the treatment)

In `patches.h`, change ONLY the output line:
`out <- float (0.25 * sin (twoPi * phase));`  →  `out <- float (0.25 * sin (phase));`
Leave the phase accumulator (`addModulo2Pi(phase, twoPi*freq*period)`) unchanged. Apply the SAME
corrected patch to A, B, and all reference/oracle renders (consistency preserved → maxerr comparisons
remain valid). Nothing else in the harness changes.

## 3. Predictions (pre-registered, falsifiable)

- **P0 (patch-fix isolation, plain no-swap render):** render the corrected patch through the single
  no-swap oracle path (REF_A-equivalent, schedule events applied, no swap/reset/latch/crossfade).
  Expect `click_max ≤ 0.05` (predicted ≈ 0.014–0.022; the highest palette freq 660 Hz gives peak slew
  ≈ `0.25·twoPi·660/48000 ≈ 0.0216`).
- **P1 (full bridge with corrected patch):** run the winning bridge — Variant-E warm-up normalization
  + the no-reset-continuation swap (Variant F) — with the corrected patch. Expect **all of R1–R4 PASS,
  including `click_max ≤ 0.05`** → the live-crossfade event-replay bridge passes end-to-end.

## 4. LOCKED run parameters (inherit parent; patch correction is the only treatment). No tuning.

`fs=48000, block=256, N_blocks=10000, K_PREPARE_START=100, K_XFADE_START=4000, W_XFADE=64,
K_SWAP=4064, P_MEAS=512, R_repeats=5, seed_master=0x6121A0003, AMP=0.25,
freq_palette=[220,330,440,550,660], EPS_XFADE=1e-6, S_CLICK=0.05, W_WARM=1,
DLL CmajPerformer.dll v1.0.3159.` Click metric = max |x[n]-x[n-1]| over full output, single exact
K_SWAP boundary sample excluded (same definition as parents).

## 5. Gates

| Variant | Gate |
|---------|------|
| **P0** | `click_max <= 0.05` on the corrected-patch plain no-swap render (isolates the click as the patch bug). Also report argmax block + median/p95/p99 slew. |
| **P1** | Full R1 ∧ R2′ ∧ R3 ∧ R4 per the frozen `_run-boundary-click` §5, INCLUDING `click_max<=0.05` inside R3_pass, `maxerr_reload_A==0`, `maxerr_B_xfade==0`, `maxerr_reload_B==0`, `mix_err<=1e-6`, `alpha_monotone`, `rel>=0.40`; R2′ = atomic single swap@4064, A released, ASan/crt/result==0, xrun_at_swap==0; R4 = repro 5/5 identical, blocks==10000, no drop/dup, event audit matches; global asan_clean ∧ proof_complete. |

## 6. Verdict rule

`FINAL PASS iff (P0 click_max <= 0.05) ∧ (P1 full R1–R4 PASS)` — i.e. the patch fix removes the click
in a plain render AND the corrected-patch bridge passes every gate. `FINAL FAIL otherwise.`

## 7. Pre-declared fallback (verbatim, emitted on FINAL FAIL)

> If the one-line patch fix does NOT drop the plain-render `click_max` to `≤ 0.05`, the doubled-twoPi
> diagnosis is FALSIFIED and the click has another source — do NOT claim the bridge validated on the
> click gate; escalate for further diagnosis (candidate: a genuine Cmajor runtime dropout, to be
> reported as a toolchain defect). If P0 passes but P1 fails a non-click gate, the patch was the click
> source but a distinct bridge regression exists → open a new scoped spike on that gate. In all cases
> the previously proven results stand: event-replay bit-exact, crossfade phase solved, swap safe.

## 8. Integrity requirements

- Copy sources from `_run-event-replay/spike/`; carry forward the shapeA gate fixes, the oracle-cursor
  fix, the Variant-E warm-up, and the Variant-F no-reset continuation. Apply ONLY the §2 patch line
  change. Do NOT modify any parent run. Do NOT tune thresholds.
- Emit per-variant `metrics.json` + `trace.log` + WAV proofs + ASan log + build/cert logs, and an
  explicit before/after slew comparison (buggy vs corrected patch) in `ATT_RUN_REPORT.md`.
- Verifier recomputes THIS file's SHA-256 vs freeze, refuses PASS on tampering/tuning, and bases the
  verdict strictly on emitted artifacts.
