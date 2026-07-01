# INDEPENDENT CROSS-LAB VERIFIER VERDICT — G1A Crossfade Re-Check

**Verifier role:** falsifier-first, evidence-based (metrics.json / WAV / ASan / source), NOT executor narrative.
**Date:** 2026-07-01

---

## 1. HASH_INTEGRITY — **PASS**

```
artifact  : C:/Users/doner/SSI/g1a/_run-xfade-recheck/PRE-REGISTRATION-XFADE-FIX.md
recomputed: 7ba29f63bf55d219b9ac4701f50d8c9e8ef4a819fc273195e94cd420c33cd895
frozen ref: 7ba29f63bf55d219b9ac4701f50d8c9e8ef4a819fc273195e94cd420c33cd895
=> EQUAL. Pre-registration NOT tampered after freeze.
```

## 2. GATE_FIDELITY — **PASS** (recomputed from source, not trusted from JSON)

Independently read gate code in `variant{A,B}/main.cpp`:
- **R1 §5 `==` fix present** — `main.cpp:355`: `(events_delivered_A_prepare == events_expected_A_prepare)` — parent's `>=` bug fixed. Windowed counter (`eventsAppliedAPrepare`) added so `==` is meaningful.
- **R3 click gate inside R3_pass** — `main.cpp:412`: `&& (click_max <= S_CLICK)` — parent's omission fixed.
- **maxerr gates strict `==0.0`** — `main.cpp:406,408,409` — strengthened from parent `<=1e-6` (never relaxed).
- **FINAL composition faithful** — `main.cpp:484`: `R1 && R2 && R3 && R4 && proof_complete && asan_clean`.
- **R2 faithful** — `main.cpp:446`.
- **Variant discipline correct per §3**: `diff` confirms Variant A drops `reset()` at `k==K_XFADE_START` (oracle byte-identical to parent), Variant B keeps live `reset()` and adds `perf.reset()` to `renderRefBxfade`.
- **Parent untouched**: `_run-event-replay/spike/` timestamps unchanged (11:49/11:55); Variant A `reference.cpp` byte-identical to parent.
- **Locked params match §4**: fs=48000, block=256, N=10000, K_XFADE_START=4000, K_SWAP=4064, seed=0x6121A0003, AMP=0.25, EPS=1e-6, S_CLICK=0.05, DLL v1.0.3159 — all present in both metrics.json.

## 3. NO_TUNING — **PASS**

No threshold weakened, no special-casing, no selective reporting. Every gate delta moves toward §5 (strengthening `<=1e-6`→`==0`, adding omitted click gate, tightening `>=`→`==`). `click_boundary_excluded=true` is not a cheat: click_max still measures **0.247** (≫0.05) and still FAILS, so nothing was hidden. Bit-identical results across normal `/O2` and ASan builds and across implement/measure rebuilds.

## 4. DETERMINISM / SOUNDNESS — **PASS**

- ASan: `grep ERROR:AddressSanitizer|heap|use-after|Leak` = **0** both variants; `ASAN_RUN_CLEAN_EXIT`.
- R4 determinism: 5/5 SHA-256 identical for full/A/B/xfade streams, both variants → `repro_ok=true`, 10000 blocks, 0 dropped, 0 dup.
- Exit code 1 = FINAL-FAIL verdict, confirmed not a crash.

## 5. Per-metric measured-vs-threshold (identical for Variant A and Variant B)

| Gate | Metric | Measured | §5 Threshold | Verdict |
|---|---|---|---|---|
| R1 | xrun_during_prepare | 0 | ==0 | ✅ |
| R1 | createPerformer | Ok | ==Ok | ✅ |
| R1 | delivered==expected | 0==0 | strict == | ✅ |
| R1 | dropped / b_xfade_latch | 0 / 1 | 0 / 1 | ✅ **R1 PASS** |
| R2 | asan/crt/result | 0/0/0 | all 0 | ✅ |
| R2 | swap_block/count/xrun | 4064/1/0 | 4064/1/0 | ✅ **R2 PASS** |
| R3 | maxerr_reload_A | 0 | ==0 | ✅ |
| R3 | mix_err | 7.45e-09 | ≤1e-6 | ✅ |
| R3 | alpha_monotone | true | true | ✅ |
| R3 | **maxerr_B_xfade** | **0.49958697** | **==0** | ❌ |
| R3 | maxerr_reload_B | 0 | ==0 | ✅ |
| R3 | rel_Bpost / rel_Apre | 1.0 / 0.9939 | ≥0.40 | ✅ |
| R3 | **click_max** | **0.24705769** | **≤0.05** | ❌ **R3 FAIL** |
| R4 | repro_ok / blocks / drop / dup | 5-eq / 10000 / 0 / 0 | — | ✅ **R4 PASS** |
| Global | asan_clean / proof_complete | true / true | true | ✅ |

**Per-variant FINAL:** Variant A = FAIL, Variant B = FAIL.
**§6 rule:** FINAL PASS iff (A PASS) ∨ (B PASS) = FALSE ∨ FALSE → **FINAL FAIL**, passing_variant = null.
**§7 fallback:** emitted **verbatim** in `FALLBACK_XFADE_FIX.md` (byte-checked against §7).

---

## VERIFY: PASS

The verification **process** is sound: hash intact, gates faithful to §5, no tuning, deterministic, ASan-clean. The executor's reported **FINAL FAIL is correct and independently reproduced from the raw metrics/WAV/source** — both pre-registered variants fail R3 identically (`maxerr_B_xfade=0.4996`, `click_max=0.247`, the exact parent values), and the §7 fallback was emitted verbatim.

> ⚠️ Scope note: `VERIFY: PASS` certifies the *run's integrity and the correctness of the FINAL-FAIL verdict*. It does **not** mean the crossfade fix succeeded — it did not. The pre-registration root-cause hypothesis is **FALSIFIED** by byte-identical oracle/live WAVs across the reset() toggle (`reset()` is a phase no-op on a fresh, never-advanced performer), so neither §3 variant addresses the true anti-phase cause. Fallback (investment-freeze; per-block idempotent frequency re-statement) stands.
