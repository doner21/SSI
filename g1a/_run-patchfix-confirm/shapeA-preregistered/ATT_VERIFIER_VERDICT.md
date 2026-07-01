# ATT — INDEPENDENT CROSS-LAB VERIFIER VERDICT

**Role:** verifier (falsifier-first, evidence-only). **Date:** 2026-07-01
**Basis:** emitted `metrics.json` / WAVs / ASan logs / source files — NOT the executor narrative.

---

## 1. HASH_INTEGRITY — **PASS**

| Item | Value |
|------|-------|
| Frozen reference (task) | `ea053f8250e5e5096fdf5abb6bd1ef84d80eab0aa151ec561093a03228e57411` |
| Recomputed (`sha256sum PRE-REGISTRATION-PATCHFIX.md`) | `ea053f8250e5e5096fdf5abb6bd1ef84d80eab0aa151ec561093a03228e57411` |
| Result | **EQUAL** → pre-registration NOT tampered after freeze |

## 2. Treatment / source integrity — **PASS**

- `variantP0/patches.h:29` and `variantP1/patches.h:29` = `out <- float (0.25 * sin (phase));` (corrected).
- Accumulator line 30 = `addModulo2Pi (phase, float (twoPi * freq * processor.period));` in ALL variants → **unchanged**, exactly the §2 one-line treatment.
- `diag-buggy-P0/patches.h:29` = `sin (twoPi * phase)` → buggy control on the **identical** P0 path.
- Parent runs still buggy (`_run-boundary-click/.../variantF/patches.h:29` and `_run-event-replay/spike/patches.h:29` both `sin(twoPi*phase)`) → **no parent modified**.
- `CmajPerformer.dll` bit-identical `bcf45708…` across P0/P1/diag; roll-up reports v1.0.3159 → toolchain locked.

## 3. GATE_FIDELITY — **PASS**

Every threshold matches frozen §4/§5 verbatim (`s_click=0.05`, `eps_xfade=1e-6`, `rel>=0.40`, strict `==0` maxerr gates, `k_swap=4064`, `w_warm=1`, `n_blocks=10000`). Gates recomputed below from raw emitted numbers.

### P0 (§5 gate: `click_max <= 0.05`)
| Metric | Measured | Threshold | Verdict |
|--------|----------|-----------|---------|
| click_max | 0.0215917 | ≤ 0.05 | **PASS** |
| argmax block | 5780 (offset 73) | report | ✓ |
| slew median / p95 / p99 | 0.0094557 / 0.0212710 / 0.0215790 | report | ✓ |
| ASan | CLEAN_EXIT | clean | ✓ |

### P1 (§5 full R1∧R2′∧R3∧R4)
| Metric | Measured | Threshold | Verdict |
|--------|----------|-----------|---------|
| R1 (xrun/create/done/dropped/latch) | 0 / Ok / 101 / 0 / 1 | ==0 / Ok / <4000 / ==0 / ==1 | **PASS** |
| R2′ swap_block / count / xrun_at_swap | 4064 / 1 / 0 | 4064 / 1 / 0 | **PASS** |
| R2′ asan / crt / result / A released | 0 / 0 / 0 / true | 0 / 0 / 0 / true | **PASS** |
| maxerr_reload_A | 0 | ==0 | **PASS** |
| maxerr_B_xfade | 0 | ==0 | **PASS** |
| maxerr_reload_B | 0 | ==0 | **PASS** |
| mix_err | 7.4492e-09 | ≤ 1e-6 | **PASS** |
| alpha_monotone | true | true | **PASS** |
| rel_Bpost / rel_Apre | 1.00003 / 0.99999 | ≥ 0.40 | **PASS** |
| click_max (in R3) | 0.0215917 | ≤ 0.05 | **PASS** |
| R4 repro | 5/5 identical (`5e031339…`) | 5/5 | **PASS** |
| R4 blocks / dropped / dup | 10000 / 0 / 0 | 10000 / 0 / 0 | **PASS** |
| R4 event audit A/Bpre/Bpost | 3=3 / 2=2 / 1=1 | match | **PASS** |
| asan_clean ∧ proof_complete | true ∧ true | true | **PASS** |

## 4. NO_TUNING — **PASS**

- No threshold weakened, no test special-cased, no selective reporting. P0 uses the full `[0,10000)` timeline with no boundary exclusion (harder); P1 excludes only the single K_SWAP sample per the frozen §4 click definition (consistent with parents).
- Before/after control is on the **identical** P0 path: buggy render reproduces the parent boundary click **bit-for-bit** (`click_max = 0.24705768844796694 @ block 3352, offset 115`, median slew 0.0592714) vs corrected `0.0215917` (median 0.0094557). Distinct output SHAs (`c7d08e1e…` vs `3070e2d8…`) prove the one-line change altered the signal, not the measurement.

## 5. DETERMINISM / SOUNDNESS — **PASS**

- R4: 5/5 bit-identical full/A/B/xfade hashes → reproducible, no data race.
- All three ASan logs: `ASAN_RUN_CLEAN_EXIT`, no AddressSanitizer/heap/use-after/SEGV/UB matches.
- 13 WAV proofs all valid `RIFF…WAVE`.
- **Environmental note (not a defect):** the unsigned *normal* P0 exe was blocked by WDAC/Device Guard (exit 199); per the documented `run_cert.bat` fallback the sanitizer-clean ASan build served as the certifying render and emitted the full metric set. No metric lost, no gate weakened. P1 normal exe ran and matched.

---

## FINAL VERDICT (§6: `(P0 click_max ≤ 0.05) ∧ (P1 R1–R4 PASS)`)

- P0 click_max 0.0215917 ≤ 0.05 → **true**
- P1 R1∧R2′∧R3∧R4 → **true**

# VERIFY: PASS

The doubled-twoPi toy-patch oscillator diagnosis is **CONFIRMED**: the §2 one-line fix (`sin(twoPi*phase)`→`sin(phase)`, accumulator unchanged) removes the residual click in a plain render (11.4× click / 6.3× median-slew reduction on the identical path) AND the corrected-patch live-crossfade bridge passes every gate end-to-end. §7 fallback NOT triggered. Previously proven results stand (event-replay bit-exact, crossfade phase solved, swap safe).
