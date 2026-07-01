# ATT — INDEPENDENT CROSS-LAB VERIFIER VERDICT
## G1A Swap-Boundary Click — shapeA-preregistered

**Verifier role:** independent falsifier-first. Verdict based strictly on emitted
`metrics.json` / WAV artifacts and recomputed evidence, NOT the executor narrative.
**Date:** 2026-07-01

---

## 1. HASH INTEGRITY — **PASS**

| Item | Value |
|------|-------|
| Frozen reference (task) | `764219813f1fb93708842fb8fc53977fdf9e875bf38dfc14d27c88f91b908839` |
| Recomputed (`certutil/sha256sum` on `PRE-REGISTRATION-BOUNDARY-CLICK.md`) | `764219813f1fb93708842fb8fc53977fdf9e875bf38dfc14d27c88f91b908839` |
| Equal? | **YES** — pre-registration not tampered after freeze |

## 2. GATE FIDELITY — **PASS**

Every threshold used in the built binaries was read from the frozen pre-reg (§4/§5), unchanged:

| Frozen param/gate | §4/§5 value | In-source value | Match |
|---|---|---|---|
| `S_CLICK` (click gate) | `0.05` | `host_config.h: S_CLICK=0.05`; `main.cpp: R.click_max <= S_CLICK` | ✅ |
| `W_WARM` | `1` | `1` | ✅ |
| `W_BND_SAMPLES` | `256` | `256` | ✅ |
| `REL_MIN` | `0.40` | `0.40` | ✅ |
| `maxerr_reload_A/B_xfade/reload_B` | strict `==0` | `== 0.0` (all three) | ✅ |
| `mix_err` | `<= 1e-6` (EPS_XFADE) | `<= EPS_XFADE` | ✅ |
| click boundary exclusion | single exact `K_SWAP` sample only | `click_boundary_excluded=true` | ✅ |
| R3_pass composition | §5 conjunction incl. click inside | verbatim conjunction incl. `click_max<=S_CLICK` | ✅ |

R2′ correctly does **not** mandate `reset_called_on_B` (F=false PASS, G=true PASS) — matches §5 note.

## 3. NO TUNING — **PASS**

- The click gate `<= 0.05` is intact and evaluated **inside** R3_pass for both variants.
- Both variants honestly report **R3 FAIL** (`click_max=0.247 > 0.05`); the verdict was NOT softened to PASS.
- No threshold was weakened, no test special-cased, no selective reporting: all bit-exact gates report `==0` truthfully and the failing sub-gate is named explicitly.
- The appended "EXECUTOR CAVEAT" in `FALLBACK_EMITTED.txt` is explicitly informational and states "the frozen gate verdict stands as FINAL FAIL" — it does not reinterpret or relax any threshold.

## 4. DETERMINISM / SOUNDNESS — **PASS**

- **R4 reproducibility:** 5/5 identical SHA-256 for full/A/B/xfade streams (both variants). Event audit 3/3, 2/2, 1/1. `blocks=10000, dropped=0, dup=0`.
- **ASan:** grep for `ERROR: AddressSanitizer|heap-*|stack-*|use-after|LeakSanitizer` = empty → clean, both variants. No UB/race evidence.
- **Independent click recomputation** (verifier-parsed float32 `full_output.wav`, 2,560,000 frames, K_SWAP sample excluded): `click_max = 0.247057688447967` at sample **858227 (block 3352, off 115), NOT K_SWAP(4064)** — matches `metrics.json` (`0.24705768844796694`) to 15 sig figs, both variants.
- **Root-cause corroborated:** single-threaded oracle `REF_A.wav` (no swap/reset/latch) shows the **identical 0.247057688 at the identical sample 858227** → click is engine-intrinsic (Cmajor FreqSine v1.0.3159), not a K_SWAP reset+latch transient. The actual K_SWAP boundary transition (excluded sample) measures only ~0.090.

## 5. PER-METRIC MEASURED-VALUE-vs-THRESHOLD (from emitted artifacts + recompute)

| Gate | Threshold (§5) | Variant F | Variant G | Result |
|---|---|---|---|---|
| R1 | xrun=0 ∧ Ok ∧ delivered==expected ∧ dropped=0 ∧ latch==1 | all hold | all hold | **PASS** |
| R2′ | asan/crt/result=0 ∧ swap_block=4064 ∧ swap_count=1 ∧ xrun_swap=0 ∧ released=true | holds (reset_on_B=false) | holds (reset_on_B=true) | **PASS** |
| R3.maxerr_reload_A | ==0 | 0 | 0 | pass |
| R3.mix_err | <=1e-6 | 7.45e-09 | 7.45e-09 | pass |
| R3.maxerr_B_xfade | ==0 | 0 | 0 | pass |
| R3.maxerr_reload_B | ==0 | 0 | 0 | pass |
| R3.rel_expected_Bpost/Apre | >=0.40 | 0.995 / 0.994 | 0.997 / 0.994 | pass |
| **R3.click_max** | **<=0.05** | **0.24705769** | **0.24705769** | **FAIL** |
| R3 (all) | conjunction | — | — | **FAIL** |
| R4 | repro ∧ 10000 ∧ dropped=0 ∧ dup=0 ∧ audit | holds | holds | **PASS** |
| Global | asan_clean ∧ proof_complete | true/true | true/true | **PASS** |
| **Variant verdict (§5)** | ALL hold | **FAIL** | **FAIL** | |

## 6. §6 verdict rule applied

`FINAL PASS iff (F PASS) ∨ (G PASS)` → both FAIL on R3.click_max → **FINAL FAIL**.
§7 HYBRID fallback emitted **verbatim** in `FALLBACK_EMITTED.txt` (text identical modulo markdown emphasis/backtick markers).

---

## VERDICT

```
HASH_INTEGRITY : PASS   (764219…908839 == frozen reference)
GATE_FIDELITY  : PASS   (all §4/§5 thresholds unchanged in source & eval)
NO_TUNING      : PASS   (click gate 0.05 intact; FAIL reported honestly)
DETERMINISM    : PASS   (5/5 repro, ASan clean, click independently reproduced to 15 sig figs)

TASK OUTCOME   : FINAL FAIL — neither Variant F nor G met R3.click_max<=0.05
                 (measured 0.247 both; argmax at block 3352, engine-intrinsic per REF_A oracle)

VERIFY: PASS
```

**VERIFY: PASS** means the verification integrity holds: the frozen gate was honored,
no tampering or tuning occurred, and the emitted **FINAL FAIL** verdict is correct and
trustworthy. The spike did not achieve a passing variant; the pre-declared §7 HYBRID
fallback was correctly emitted.
