# PRE-REGISTRATION — G1A Crossfade Re-Check #2 (thread-of-creation + warm-up normalization)

**Authored by:** ORCHESTRATOR (inter-phase deterministic gate). **Date:** 2026-07-01
**Parent runs:** `g1a/_run-event-replay/` (FINAL FAIL) and `g1a/_run-xfade-recheck/shapeA-preregistered/`
(FINAL FAIL — falsified the reset()-vs-fresh hypothesis).
**Status at freeze:** no fix code written; no measured number exists below.

---

## 1. What the prior runs established (evidence, not assumption)

- Event-replay across the atomic swap is **bit-exact** (`maxerr_reload_B = 0`).
- `reset()` is a **phase no-op on a freshly-created, never-advanced** Cmajor performer (byte-identical
  WAVs across the reset toggle in shapeA-preregistered).
- The xfade anti-phase (`maxerr_B_xfade = 0.4996 ≈ 2×amp`, `click_max = 0.247`) therefore is NOT caused
  by reset(). By elimination the only remaining difference between the failing live xfade B (fresh,
  **worker-created**) and the passing oracle (fresh, **main-created**) is **thread-of-creation**.
- The post-swap path is bit-exact precisely because worker-B is **advanced, then `reset()`+latched** at
  K_SWAP — i.e. an advance→reset→latch sequence **normalizes** the phase.

## 2. Hypotheses under test

- **H1 (cause):** A Cmajor performer created via `createPerformer()` on a **worker thread** has a
  different intrinsic oscillator phase than one created on the **main thread** (fresh, same subsequent
  ops). This is the residual cause of the xfade anti-phase.
- **H2 (production-viable fix):** Applying the proven post-swap normalization —
  **advance worker-B ≥1 block, then `reset()`, then `setInputValue` latch** — BEFORE the crossfade
  eliminates the anti-phase, salvaging the crossfade WITHOUT abandoning the non-disruptive worker-thread
  prepare (G1A's whole point).

## 3. Variants (all built + measured)

- **Variant C — main-thread B creation (cause isolation).** Create performer B on the **main thread**
  before the RT loop; keep all else identical to the live xfade path. Expectation if H1 true:
  `maxerr_B_xfade → 0`, `click_max ≤ 0.05`. (Note: main-thread creation is NOT production-viable during
  live playback; C is a *diagnostic* to confirm the cause, not the shipping fix.)
- **Variant D — same-thread twin control (cause isolation).** Create TWO performers on the SAME thread;
  run the oracle path on one and the live-xfade path on the other. Gate: cross-performer
  `maxerr_twin == 0`. Confirms path logic is identical and the only variable is creation thread.
- **Variant E — warm-up normalization (candidate SHIP fix).** Keep worker-thread B creation. In the
  xfade init at `k==K_XFADE_START`: **advance B by W_WARM≥1 block(s), then `reset()`, then
  `setInputValue(stateAt(K_XFADE_START))` latch**, THEN crossfade. Gate: full R1–R4 as §5.

## 4. LOCKED run parameters (identical to parent; W_WARM=1 for Variant E)

`fs=48000, block=256, N_blocks=10000, K_PREPARE_START=100, K_XFADE_START=4000, W_XFADE=64,
K_SWAP=4064, P_MEAS=512, R_repeats=5, seed_master=0x6121A0003, AMP=0.25,
freq_palette=[220,330,440,550,660], EPS_XFADE=1e-6, S_CLICK=0.05, W_WARM=1,
DLL CmajPerformer.dll v1.0.3159.` No threshold may be tuned.

## 5. Gates (per full-run variant; PASS iff ALL hold)

Same as the frozen §5 of PRE-REGISTRATION-XFADE-FIX.md (R1 strict `==`; R2 swap safety; R3 with
`maxerr_B_xfade==0` AND `click_max<=0.05` inside R3_pass, `maxerr_reload_A==0`, `maxerr_reload_B==0`,
`mix_err<=1e-6`, monotone, rel≥0.40; R4 determinism/audit; global asan_clean ∧ proof_complete).
Variant D uses only its twin gate `maxerr_twin==0`.

## 6. Verdict rule

- **FINAL PASS iff Variant E achieves full R1–R4 PASS** (the production-viable warm-up fix salvages the
  crossfade). Variant C and D are reported as cause-confirmation diagnostics (do not by themselves
  produce FINAL PASS, since main-thread creation is not production-viable).
- If Variant E FAILS → **FINAL FAIL**, report whether C/D confirmed thread-of-creation as the cause.

## 7. Pre-declared fallback (verbatim, emitted on FINAL FAIL — unchanged)

> Investment-freeze on the live-crossfade event-replay bridge. Fallback strategy: **per-block idempotent
> frequency re-statement** (re-send current input values every block after swap; state converges within
> one block period) instead of latch-replay + crossfade.

## 8. Integrity requirements

- Copy sources from `g1a/_run-event-replay/spike/`; do NOT modify parent runs. Keep the shapeA gate
  fixes (R1 `==`, click gate inside R3_pass, strict `==0` maxerr gates).
- Emit per-variant `metrics.json` + `trace.log` + WAV proofs + ASan log; verifier bases verdict on raw
  artifacts, recomputes this file's SHA-256 vs freeze, refuses PASS on tampering/tuning.