# PRE-REGISTRATION — G1A Crossfade Re-Check (reset()-vs-fresh phase hypothesis)

**Authored by:** ORCHESTRATOR (inter-phase deterministic gate). **Date:** 2026-07-01
**Parent run:** `g1a/_run-event-replay/` (FINAL FAIL on R3; event-replay across swap proven bit-exact).
**Status at freeze:** no fix code written; no measured number exists below.

---

## 1. Corrected root cause (from verification of parent run)

The parent handoff attributed R3's crossfade FAIL to a *worker-thread* phase quirk. Direct evidence
**falsifies** that:

- **Post-swap path** (`rt_render.cpp:218`): B is worker-created, `reset()`+`setInputValue`. Reference
  `renderRefBpost` is main-created, `reset()`+`setInputValue`. → **bit-exact** (`maxerr_reload_B = 0`).
  If worker-thread creation shifted phase, this would also fail. It does not.
- **Xfade path** (`rt_render.cpp:150`): B is worker-created, **`reset()`** + `setInputValue` + advance.
  Reference `renderRefBxfade` uses a **fresh** performer, **no `reset()`**. → anti-phase
  (`maxerr_B_xfade = 0.4996 ≈ 2×amp`, `click_max = 0.247`).

**Conclusion:** the artifact is a deterministic **`reset()`-produces-different-phase-than-fresh**
property of Cmajor, compounded by an **oracle-construction inconsistency** (xfade reference modelled
`fresh`, live path used `reset()`). It is NOT threading and NOT nondeterminism (R4 proved determinism).

## 2. Hypothesis under test

> The crossfade path is salvageable without touching threading. Making the live xfade B-initialization
> and the xfade oracle **use the same construction discipline** will drive `maxerr_B_xfade → 0` and
> `click_max ≤ S_click`, turning R3 PASS while keeping R1/R2/R4 PASS.

## 3. Two fix variants (both must be built + measured; verdict compares them)

- **Variant A — drop `reset()` in xfade init.** In `rt_render.cpp` at `k == K_XFADE_START`, do NOT call
  `performers[1].reset()`; use the freshly worker-created B directly (matches `renderRefBxfade`), then
  `setInputValue(stateAt(K_XFADE_START))` + advance. Oracle unchanged.
- **Variant B — align oracle to implementation.** Keep the live `reset()` in xfade init, but change
  `renderRefBxfade` to also call `reset()` before the initial latch (models exactly what the live path
  does). Tests whether the mechanism is internally self-consistent under `reset()`.

## 4. LOCKED run parameters (identical to parent, do not tune)

`fs=48000, block=256, N_blocks=10000, K_PREPARE_START=100, K_XFADE_START=4000, W_XFADE=64,
K_SWAP=4064, P_MEAS=512, R_repeats=5, seed_master=0x6121A0003, AMP=0.25,
freq_palette=[220,330,440,550,660], EPS_XFADE=1e-6, S_CLICK=0.05, DLL CmajPerformer.dll v1.0.3159.`

## 5. Gates (verdict = PASS iff ALL hold; no threshold may be relaxed)

| Run | Gate |
|-----|------|
| R1 | `xrun_during_prepare==0` ∧ `createPerformer==Ok` ∧ `events_delivered_A_prepare == events_scheduled_in[K_PREPARE_START,K_PREPARE_DONE]` (strict `==`, fix the parent's `>=` bug) ∧ `dropped==0` ∧ `b_xfade_initial_latch_count==1` |
| R2 | `asan==0` ∧ `crt==0` ∧ `result_violations==0` ∧ `swap_block==4064` ∧ `swap_count==1` ∧ `reset/latch as designed` ∧ `xrun_at_swap==0` ∧ `released_post_crossfade` |
| R3 | `maxerr_reload_A==0` ∧ `mix_err<=1e-6` ∧ `alpha_monotone` ∧ **`maxerr_B_xfade==0`** ∧ `maxerr_reload_B==0` ∧ `rel_Bpost>=0.40` ∧ `rel_Apre>=0.40` ∧ **`click_max<=0.05`** (click gate MUST be inside R3_pass, fix the parent's omission) |
| R4 | `repro_ok` (all 5 SHA-256 identical) ∧ `blocks==10000` ∧ `dropped==0` ∧ `dup==0` ∧ event audit all match |
| Global | `asan_clean` ∧ `proof_complete` |

## 6. Verdict rule

`FINAL PASS iff (Variant A PASS) ∨ (Variant B PASS)` under §5, with the passing variant named.
`FINAL FAIL otherwise.`

## 7. Pre-declared fallback (verbatim, emitted on FINAL FAIL — unchanged from parent)

> Investment-freeze on the live-crossfade event-replay bridge. Fallback strategy: **per-block idempotent
> frequency re-statement** (re-send current input values every block after swap; state converges within
> one block period) instead of latch-replay + crossfade.

## 8. Integrity requirements for the executor/verifier

- Copy sources from `g1a/_run-event-replay/spike/` into the shape's run dir; do NOT modify the parent run.
- Fix the parent's two gate-fidelity bugs (R1 `>=`→`==`; add click gate to R3_pass) so the harness gates
  faithfully implement §5.
- Emit `metrics.json` + `trace.log` + WAV proofs + ASan log, same schema as parent.
- Verifier recomputes this file's SHA-256 against the freeze and refuses PASS on any tampering/tuning.
