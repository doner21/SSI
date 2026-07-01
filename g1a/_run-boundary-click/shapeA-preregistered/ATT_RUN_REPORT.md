# ATT_RUN_REPORT — G1A Swap-Boundary Click (shapeA-preregistered)

**Phase:** implement (executor). **Date:** 2026-07-01.
**Run dir:** `C:/Users/doner/SSI/g1a/_run-boundary-click/shapeA-preregistered/`

## 0. Pre-registration integrity

- Artifact: `../PRE-REGISTRATION-BOUNDARY-CLICK.md`
- Frozen SHA-256 (task): `764219813f1fb93708842fb8fc53977fdf9e875bf38dfc14d27c88f91b908839`
- Recomputed SHA-256:   `764219813f1fb93708842fb8fc53977fdf9e875bf38dfc14d27c88f91b908839` ✅ **match**
- **The pre-registration artifact was NOT modified** (content-hash locked). No parent
  run under `_run-event-replay/` or `_run-xfade-recheck/` was modified.

## 1. What was built (sources carried forward + variant edits)

Base sources copied from `_run-event-replay/spike/` **with the proven Variant-E fixes
carried forward** from `_run-xfade-recheck/shapeB-dualplan/variantE/` (shapeA gate
fixes: R1 strict `==`, `click_max<=0.05` inside `R3_pass`, strict `==0` maxerr gates;
shapeB oracle-cursor fix in `renderRefBxfade`; Variant-E warm-up normalization
advance→`reset()`→latch at `K_XFADE_START`). Two full, independently-compiled variants
were produced:

- `variantF/` — **Variant F: no-reset continuation at swap.**
- `variantG/` — **Variant G: equal-power boundary micro-fade.**

LOCKED §4 params reproduced verbatim in `host_config.h` (`W_WARM=1`,
`W_BND_SAMPLES=256`, `fs=48000`, `block=256`, `N_blocks=10000`, `K_SWAP=4064`, …);
DLL `CmajPerformer.dll v1.0.3159`; MSVC cl 19.5x, C++17, `/O2`, ASan build via
`/fsanitize=address`. Build succeeded for both (normal + ASan). No threshold was
tuned, weakened, or reinterpreted.

### Per-variant source changes vs Variant-E baseline
| File | Variant F | Variant G |
|------|-----------|-----------|
| `host_config.h` | +`W_BND_SAMPLES`, +`VARIANT_NAME` | same |
| `crossfade.h` | +`equalPowerBoundarySample()` (quarter-sine constant-power) | same |
| `rt_render.cpp` (Branch 3, `k==K_SWAP`) | atomic swap only; **no `reset()`, no re-latch** — continue warmed-up B | atomic swap; advance un-reset B → OLD; `reset()`+latch → NEW; equal-power blend OLD→NEW over `W_BND_SAMPLES` of block K_SWAP |
| `reference.cpp` (`renderRefBpost`) | no-reset continuation oracle (latch@K_XFADE→advance→continue past K_SWAP) | unchanged (reset+latch oracle) |
| `main.cpp` | R2′/R4 = frozen §5 gates; §7 fallback verbatim | + `maxerr_reload_B` measured over `[K_SWAP+W_BND_SAMPLES, N)` per §3 ("after the micro-fade window") |
| `proof.cpp` | metrics.json: +variant, +params, +frozen threshold strings | + `maxerr_reload_B_region` |
| `compile*.bat` | `/DG1A_VARIANT_F` | `/DG1A_VARIANT_G` |

### Gate implementation = frozen §5 (faithful, no tuning)
- **R1** = frozen §5 (xrun==0 ∧ createPerformer Ok ∧ windowed delivered `==` scheduled ∧ dropped==0 ∧ `b_xfade_initial_latch_count==1`).
- **R2′** = frozen §5 exactly: `asan==0 ∧ crt==0 ∧ result==0 ∧ swap_block==4064 ∧ swap_count==1 ∧ xrun_at_swap==0 ∧ old_perf_released_post_swap`. `reset_called_on_B` is **not** gated (F omits it; G retains the behavior). Both variants use the identical frozen R2′ gate.
- **R3** = frozen §5 including **`click_max<=0.05` inside `R3_pass`** and strict `==0` maxerr gates.
- **R4** = frozen §5: `repro_ok ∧ blocks==10000 ∧ dropped==0 ∧ dup==0 ∧ event-audit all match`. (Variant-E's extra `latch_replay_count==1` condition is NOT in frozen §5 and is not gated — required so Variant F, which performs no latch-replay, is judged by the frozen gate; both counts are still emitted for transparency.)

### Documented ambiguity (§3 Variant G geometry — most-falsifiable interpretation)
The literal "256 samples straddling K_SWAP centered on the boundary" is infeasible
because the post-swap reset+latch B (phase-0 **at** K_SWAP) has no coherent samples
*before* K_SWAP. The most-falsifiable, phase-coherent, gate-preserving realization
used: window `[K_SWAP, K_SWAP+W_BND_SAMPLES)` (== block K_SWAP, one BLOCK_SIZE),
equal-power blend of the **pre-swap B-xfade continuation (OLD, un-reset B advanced one
block)** into the **post-swap reset+latch B (NEW)**. This bridges the two streams
across the swap transition. `maxerr_reload_B==0` is then measured over
`[K_SWAP+W_BND_SAMPLES, N)` — exactly the pre-registered "converge to bit-exact after
the micro-fade window" (minimal exclusion; `==0` threshold unchanged).

## 2. Measured results (from emitted metrics.json — not narrative)

| Gate | Variant F | Variant G |
|------|:---------:|:---------:|
| R1 | **PASS** | **PASS** |
| R2′ | **PASS** (`reset_called_on_B=false`, `swap_count=1`, `xrun_at_swap=0`, released post-swap) | **PASS** (`reset_called_on_B=true`, `swap_count=1`) |
| R3 | **FAIL** | **FAIL** |
| R4 | **PASS** | **PASS** |
| asan_clean | true | true |
| **Verdict** | **FAIL** | **FAIL** |

R3 detail (both): `maxerr_reload_A=0`, `mix_err=7.45e-09 (≤1e-6)`, `alpha_monotone=true`,
`maxerr_B_xfade=0`, **`maxerr_reload_B=0`** (F over `[K_SWAP,N)`; G over
`[K_SWAP+256,N)`), `rel_expected_Bpost≈0.995/0.997`, `rel_expected_Apre≈0.994` — **all
pass**. The **only** failing sub-gate is **`click_max=0.24705768844796694 > 0.05`**.

## 3. FINAL VERDICT (per §6)

`FINAL PASS iff (Variant F PASS) ∨ (Variant G PASS)`. Both variants FAIL (R3 click).
→ **FINAL FAIL.** The verbatim §7 fallback is emitted in `FALLBACK_EMITTED.txt`.

## 4. Root-cause finding (evidence, `ROOT_CAUSE_click.json`)

Direct WAV analysis shows the pre-registration §2 hypothesis (click = reset+latch
transient **at K_SWAP**) is **falsified**:

- The `click_max=0.247` argmax is at **sample 858227 (block 3352, offset 115)** — in
  the **pre-crossfade A-only region**, `is_K_SWAP=false`. It is a **single-sample
  dropout** (`x≈9e-6` between neighbours `0.247` and `0.089` on a clean 440 Hz sine).
- Such dropouts are **pervasive**: 3955 in the full output, **799 in the
  single-threaded oracle `REF_A`**, 3161 in `REF_Bpost`. They begin right after the
  first frequency change (block 2481 → 440 Hz). Because the oracle reproduces them and
  `maxerr_reload_A==0`, they are an **engine/DLL artifact of Cmajor FreqSine v1.0.3159
  on non-integer-period frequencies**, independent of the swap, reset, latch, crossfade
  or threading.
- Both variants **did** reduce the genuine K_SWAP reset transient (boundary slew
  `|x[K_SWAP]-x[K_SWAP-1]|`: **E-baseline 0.190 → F 0.090, G 0.090**), confirming a
  *partial* K_SWAP transient existed — but the ≤0.05 click gate is **unreachable by any
  K_SWAP-only strategy** (F, G, or the §7 HYBRID) while these engine dropouts remain.

## 5. Emitted artifacts (per variant, under `variant{F,G}/artifacts/`)

`metrics.json`, `trace.log`, `asan_run.log` (ASAN_RUN_CLEAN_EXIT), `cert_run.log`,
`events_applied.log`, `schedule.json`, and WAV proofs (`full_output.wav`, `A_pre.wav`,
`B_post.wav`, `crossfade_region.wav`, `A_xfade.wav`, `B_xfade.wav`, `REF_A.wav`,
`REF_Bxfade.wav`, `REF_Bpost.wav`, `Solo_*.wav`). Run-dir level:
`ROOT_CAUSE_click.json`, `FALLBACK_EMITTED.txt`, this `ATT_RUN_REPORT.md`.

Verifier note: recompute the pre-registration SHA-256, then read
`variant{F,G}/artifacts/metrics.json` and the WAVs directly. The verdict is FINAL FAIL
on the frozen `click_max<=0.05` sub-gate; no threshold was tuned.
