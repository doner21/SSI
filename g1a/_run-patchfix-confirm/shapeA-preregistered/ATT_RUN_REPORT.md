# ATT_RUN_REPORT — G1A PATCH-FIX CONFIRMATION (doubled-twoPi oscillator bug)

**Run dir:** `C:/Users/doner/SSI/g1a/_run-patchfix-confirm/shapeA-preregistered/`
**Role:** executor (implement phase) — bounded orchestration shape.
**Date:** 2026-07-01
**Toolchain:** MSVC cl 19.50.35728 (x64), C++17, `CmajPerformer.dll` **v1.0.3159** (confirmed at runtime).

---

## 0. Pre-registration integrity (recomputed, NOT modified)

| Item | Value |
|------|-------|
| Frozen artifact | `C:/Users/doner/SSI/g1a/_run-patchfix-confirm/PRE-REGISTRATION-PATCHFIX.md` |
| Expected SHA-256 | `ea053f8250e5e5096fdf5abb6bd1ef84d80eab0aa151ec561093a03228e57411` |
| **Recomputed SHA-256** | `ea053f8250e5e5096fdf5abb6bd1ef84d80eab0aa151ec561093a03228e57411` ✅ **MATCH** |
| Pre-registration modified? | **NO** (content-hash locked; read-only) |
| Parent run modified? | **NO** — `_run-boundary-click/.../variantF/patches.h` verified still buggy (`sin(twoPi*phase)`) |
| Thresholds tuned? | **NO** — `S_CLICK=0.05`, `EPS_XFADE=1e-6`, `REL_MIN=0.40`, strict `==0` maxerr gates all inherited verbatim from `host_config.h` |

---

## 1. Treatment applied (PRE-REG §2 — the ONLY change)

In `patches.h`, the single output line was changed; the phase accumulator was left untouched:

```
- out <- float (0.25 * sin (twoPi * phase));      // BUGGY: spurious second twoPi
+ out <- float (0.25 * sin (phase));              // CORRECT radian-convention output
  phase = addModulo2Pi (phase, float (twoPi * freq * processor.period));   // UNCHANGED
```

**Integrity proof:** a file-by-file diff of every `*.cpp` / `*.h` / build script between this run's
`variantP1/` and the winning parent `_run-boundary-click/.../variantF/` shows **exactly one differing
file: `patches.h`**, and within it the **only functional change is the §2 line**. All carried-forward
fixes therefore remain byte-identical:
- shapeA gate-fidelity fixes (R1 strict `==`, `click_max<=0.05` **inside** `R3_pass`, strict `==0`
  maxerr gates) — present in `main.cpp`;
- oracle-cursor fix in `renderRefBxfade` — present in `reference.cpp`;
- Variant-E warm-up normalization (`W_WARM=1`) — present in `rt_render.cpp` / `host_config.h`;
- Variant-F no-reset continuation at `K_SWAP` — present in `rt_render.cpp` / `reference.cpp`.

The corrected patch is applied identically to A, B, and all reference/oracle renders (single shared
`FREQ_SINE_SOURCE`), so all maxerr comparisons remain valid.

---

## 2. LOCKED parameters (PRE-REG §4, inherited verbatim)

`fs=48000, block=256, N_blocks=10000, K_PREPARE_START=100, K_XFADE_START=4000, W_XFADE=64,
K_SWAP=4064, P_MEAS=512, R_repeats=5, seed_master=0x6121A0003, AMP=0.25,
freq_palette=[220,330,440,550,660], EPS_XFADE=1e-6, S_CLICK=0.05, **W_WARM=1**,
DLL v1.0.3159.` Click metric = `max |x[n]-x[n-1]|`; for P0 (plain, no swap) **no boundary sample is
excluded** (strictest reading); for P1 the single exact `K_SWAP` boundary sample pair is excluded
(same definition as parents).

---

## 3. Variant P0 — patch-fix isolation (plain no-swap render)

Corrected patch rendered through the single no-swap oracle path (REF_A-equivalent): one performer,
phase 0, **all** scheduled events applied, **no** swap/reset/latch/crossfade, full `[0,10000)` timeline.

| Metric | Value | Gate |
|--------|-------|------|
| **click_max** | **0.021591742523** | ✅ `<= 0.05` |
| argmax block | 5780 (sample 1479753, offset 73) | (660 Hz region — highest palette freq) |
| slew median (p50) | 0.0094557404518 | — |
| slew p95 | 0.0212710164487 | — |
| slew p99 | 0.0215789619833 | — |
| events applied | 4 | — |
| ASan | clean (`ASAN_RUN_CLEAN_EXIT`, 0 violations) | ✅ |

Predicted by PRE-REG §3 P0: `click_max ≈ 0.014–0.022` (660 Hz peak slew `0.25·twoPi·660/48000 ≈ 0.0216`).
**Measured 0.0216 — dead-on.** → **P0 PASS.**

Artifacts: `variantP0/artifacts/{metrics.json, trace.log, asan_run.log, P0_full_output.wav,
P0_region_3300_3400.wav}`, build logs `variantP0/build_{normal,asan}.log`.

---

## 4. Variant P1 — full winning bridge with corrected patch

Variant-E warm-up + Variant-F no-reset continuation swap, corrected patch, full R1–R4, 5 seeded repeats.

| Gate | Result | Key evidence |
|------|--------|--------------|
| **R1** (prepare non-disruption) | ✅ PASS | xrun=0, createPerformer=Ok, k_prepare_done=102 (<4000), delivered==expected, dropped=0, initial-latch=1 |
| **R2′** (atomic swap safety) | ✅ PASS | asan=0, crt=0, result=0, swap_block=4064, swap_count=1, xrun_at_swap=0, A released post-crossfade |
| **R3** (event+crossfade+click) | ✅ PASS | maxerr_reload_A=**0**, maxerr_B_xfade=**0**, maxerr_reload_B=**0**, mix_err=7.4492e-09 (<=1e-6), alpha_monotone, rel_Bpost=1.0000266 (>=0.40), **click_max=0.0215917 (<=0.05, inside R3_pass)** |
| **R4** (determinism+audit) | ✅ PASS | repro 5/5 identical, blocks=10000, dropped=0, dup=0, evA=3/3, evBpre=2/2, evBpost=1/1 |
| global | ✅ | asan_clean=true, proof_complete=true |

**P1 FINAL VERDICT: PASS.**

Artifacts: `variantP1/artifacts/{metrics.json, trace.log, asan_run.log, schedule.json,
events_applied.log, full_output.wav, A_pre.wav, B_post.wav, crossfade_region.wav, A_xfade.wav,
B_xfade.wav, REF_A.wav, REF_Bxfade.wav, REF_Bpost.wav, Solo_440.wav, Solo_550.wav}`,
build logs `variantP1/build_{normal,asan}.log`.

---

## 5. Before/after slew comparison (buggy vs corrected patch)

Measured **apples-to-apples through the identical P0 plain no-swap render path** (`diag-buggy-P0/`
rebuilds the same driver with the buggy `sin(twoPi*phase)` patch):

| Metric | BUGGY `sin(twoPi*phase)` | CORRECTED `sin(phase)` | Change |
|--------|--------------------------|------------------------|--------|
| **click_max** | **0.24705768844797** | **0.02159174252301** | **↓ 11.4×** |
| argmax block | **3352** (offset 115) | 5780 (offset 73) | click hot-spot relocated |
| slew median (p50) | 0.05927136540413 | 0.00945574045181 | **↓ 6.3×** |
| slew p95 | 0.13254645466805 | 0.02127101644874 | ↓ 6.2× |
| slew p99 | 0.13404498994350 | 0.02157896198332 | ↓ 6.2× |

**Cross-validation:** the buggy P0 render reproduces the parent boundary-click run **bit-for-bit** —
`click_max = 0.24705768844796694` at **block 3352, offset 115, sample 858227** — identical to
`_run-boundary-click/.../ROOT_CAUSE_click.json`. This confirms the P0 path is the faithful
REF_A-equivalent oracle and that the residual click is entirely explained by the doubled-twoPi bug.

Mechanism (as pre-registered §1): the buggy output `sin(twoPi·phase)` (a) inflates the effective
per-sample angular step to `twoPi·(twoPi·freq/fs) ≈ 0.362 rad` at 440 Hz (median slew ≈ 0.059,
matching 0.0593 measured), and (b) introduces a hard wrap discontinuity every fundamental period
(the 0.247 spikes) because `sin(twoPi·phase)` is *not* continuous across the `mod 2π` phase wrap.
The fix `sin(phase)` restores both: the step drops to `twoPi·freq/fs` and `sin` is continuous across
the `mod 2π` wrap → clicks vanish.

---

## 6. FINAL VERDICT (PRE-REG §6)

`FINAL PASS iff (P0 click_max <= 0.05) ∧ (P1 full R1–R4 PASS)`

- P0 click_max = **0.0216 ≤ 0.05** → ✅
- P1 R1 ∧ R2′ ∧ R3 ∧ R4 ∧ asan_clean ∧ proof_complete → ✅

# ➜ FINAL VERDICT: **PASS**

**Diagnosis CONFIRMED.** The residual `click_max = 0.247` was the toy `FreqSine` patch's doubled-twoPi
oscillator bug — NOT a Cmajor runtime dropout and NOT a reload-bridge defect. The one-line fix removes
the click in a plain render AND makes the live-crossfade event-replay bridge pass end-to-end. All
previously proven results stand: event-replay bit-exact (`maxerr_reload_B=0`), crossfade phase solved
(`maxerr_B_xfade=0`), atomic swap safe. The §7 fallback is **NOT** emitted.

---

## 7. Artifact index

```
shapeA-preregistered/
├── ATT_RUN_REPORT.md                 (this file)
├── metrics.json                      (run-level roll-up)
├── variantP0/                        (corrected patch, plain no-swap render)
│   ├── p0_main.cpp  patches.h(fixed)  compile.bat compile_asan.bat run.bat
│   ├── build_normal.log  build_asan.log
│   ├── g1a_p0_host.exe  g1a_p0_host_asan.exe  CmajPerformer.dll
│   └── artifacts/{metrics.json,trace.log,asan_run.log,P0_full_output.wav,P0_region_3300_3400.wav}
├── variantP1/                        (full winning bridge, corrected patch)
│   ├── main.cpp reference.cpp rt_render.cpp swap.cpp ... patches.h(fixed)
│   ├── build_normal.log  build_asan.log
│   ├── g1a_event_replay_host.exe  g1a_event_replay_host_asan.exe  CmajPerformer.dll
│   └── artifacts/{metrics.json,trace.log,asan_run.log,schedule.json,events_applied.log,*.wav}
└── diag-buggy-P0/                    (DIAGNOSTIC: buggy patch, identical P0 path — before-fix baseline)
    ├── p0_main.cpp  patches.h(buggy)  compile.bat  g1a_p0_buggy_host.exe
    └── artifacts/metrics_buggy.json
```

*Generator ≠ certifier: this report is the executor's account. The independent verifier must recompute
the pre-registration SHA-256, refuse PASS on any threshold tuning, and base the verdict strictly on the
emitted `metrics.json` / WAVs, not this narrative.*
