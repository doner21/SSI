# PRE-REGISTRATION — G1A "A ≠ B" (live-swap to a genuinely DIFFERENT DSP)

**Authored by:** ORCHESTRATOR (inter-phase deterministic gate). **Date:** 2026-07-01
**Parent baseline:** `g1a/_canonical-baseline/` (VALIDATED, locked). Copy `spike/` from there.
**Status at freeze:** no B-patch harness code written; no measured number exists below.
**Scope:** the real "regenerate into something new" case — swap the live voice to a *structurally
different* Cmajor processor with its *own* input-endpoint schema, while it is playing.

---

## 1. What is already won (evidence — DO NOT re-litigate; proven + committed @2473998)

- The live-crossfade event-replay reload **bridge mechanism** is validated end-to-end (R1–R4) for the
  **same-patch** swap (FreqSine → FreqSine): dual-shape, dual-executor, dual-verifier, from raw WAV bytes.
- Canonical fixes baked into the baseline: corrected patch (`sin(phase)`), warm-up normalization
  (`W_WARM=1`), Variant-F no-reset continuation at `K_SWAP`, oracle-cursor fix, gate-fidelity fixes.
- Determinism (R4): 5/5 identical SHA-256. Swap safety (R2): atomic single swap @4064, A released,
  ASan-clean. Same-patch click after patch fix: `click_max = 0.0216 ≤ 0.05`.
- Lock hashes (verify integrity before forking): canonical `patches.h`
  `c513b5d0fc469c94b7d0ebb9629ae8355f0d8b1d607fa05d56039a57132c3fa7`; pinned
  `CmajPerformer.dll v1.0.3159` `bcf457086fe3d021d760e62b4e40c8ed5f19a7f639b82e269a0bbccb6027af9f`.

## 2. The genuinely NEW thing under test (this run only)

**A** = the canonical FreqSine (pure sine, `input value float freq`, AMP=0.25) — UNCHANGED.
**B** = a **2-operator FM voice** (`FM2op`) with a **different internal state topology** (two phase
accumulators) and a **different input-endpoint schema** (three inputs, *different names*), verbatim:

```cmajor
// B PATCH — LOCKED. 2-operator FM voice. AMP=0.25. Harmonic (ratio default 1.0),
// modIndex default 1.0 → peak instantaneous frequency = 2·carrierHz (band-limited enough
// to plausibly satisfy the S_CLICK=0.05 whole-output slew gate at the top palette freq 660 Hz:
// 0.25·2π·1320/48000 ≈ 0.0432 ≤ 0.05). sin() returns float64 → cast to float32 for the stream.
processor FM2op
{
    input value float carrierHz;   // carrier fundamental Hz — PARAM-CARRY target (A.freq -> B.carrierHz)
    input value float modIndex;    // FM modulation index          — DECLARED DEFAULT 1.0
    input value float ratio;       // modulator:carrier freq ratio  — DECLARED DEFAULT 1.0
    output stream float out;

    void main()
    {
        float cphase = 0.0f;   // carrier phase accumulator
        float mphase = 0.0f;   // modulator phase accumulator

        loop
        {
            float m = modIndex * sin (mphase);
            out <- float (0.25 * sin (cphase + m));
            cphase = addModulo2Pi (cphase, float (twoPi * carrierHz * processor.period));
            mphase = addModulo2Pi (mphase, float (twoPi * carrierHz * ratio * processor.period));
            advance();
        }
    }
}
```

B must be a real Cmajor `processor` that compiles + links against `CmajPerformer.dll v1.0.3159`.

### 2.1 Two-engine architecture (the structural change)

A and B **can no longer share one engine/program** (their schemas differ). The harness MUST build
**two engines**: `engineA` from the canonical `FREQ_SINE_SOURCE` (handles `freq`, `out`) and `engineB`
from the new `FM2OP_SOURCE` (handles `carrierHz`, `modIndex`, `ratio`, `out`). Performer A =
`engineA.createPerformer()`; the worker prepares Performer B = `engineB.createPerformer()`. The
worker touches `engineB` solo (single-thread-at-a-time invariant preserved per engine). The
`std::atomic<uint32_t> activeIndex` swap of `performers[2]` and the safe-release protocol are UNCHANGED.
The RT render dispatches to A-handles or B-handles based on `activeIndex`.

### 2.2 Parameter carry-across mapping (PRE-REGISTERED — the crux of "regenerate into something new")

The deterministic event schedule (`SEED_MASTER=0x6121A0003`) is UNCHANGED — it still emits
`(block, freq)` frequency-change events. Because B's schema differs, the events are carried across by
this **explicit, pre-registered mapping**, applied identically in the live run AND in the B reference
renders:

| Source (A schema) | Target (B schema) | Rule |
|---|---|---|
| `freq` event value @block | `carrierHz` input | **carried** — `setInputValue(carrierHz, freq)` at the same block (1:1 value + timing) |
| — | `modIndex` input | **declared default 1.0** — latched once at B's first latch; never changed by the schedule |
| — | `ratio` input | **declared default 1.0** — latched once at B's first latch; never changed by the schedule |

At the swap, B's `carrierHz` is latched to the **frequency active at `K_SWAP`** (`stateAt(K_SWAP)` from
the same schedule); `modIndex` and `ratio` hold their declared defaults. No A→B phase alignment is
attempted (different waveforms → undefined).

## 3. Hypothesis under test

> The validated live-crossfade event-replay bridge generalizes from same-patch to a **structurally
> different DSP with a different endpoint schema**: with (i) a two-engine build, (ii) the pre-registered
> `freq → carrierHz` carry-across + declared `modIndex`/`ratio` defaults, (iii) warm-up normalization of
> B's *own* phase, and (iv) an **equal-power** crossfade (A and B are uncorrelated, so mix on the
> envelope, not the sample), the swap preserves R1 (prepare non-disruption), R2 (atomic swap safety +
> ASan + A released), R4 (5/5 determinism), achieves **B-vs-B post-swap bit-exactness**
> (`maxerr_reload_B == 0` against a reference render of B's *own* patch), and stays boundary-continuous
> (`click_max ≤ 0.05`) — with B's *own* solo render independently click-clean (`click_max_Bsolo ≤ 0.05`).

## 4. LOCKED run parameters (inherit canonical; B-specific additions below). No threshold may be tuned.

`fs=48000, block=256, N_blocks=10000, K_PREPARE_START=100, K_XFADE_START=4000, W_XFADE=64,
K_SWAP=4064, P_MEAS=512, R_repeats=5, seed_master=0x6121A0003, AMP=0.25,
freq_palette=[220,330,440,550,660], EPS_XFADE=1e-6, S_CLICK=0.05, REL_MIN=0.40, W_WARM=1,
DLL CmajPerformer.dll v1.0.3159.`
**B-specific LOCKED:** `MOD_INDEX=1.0, RATIO=1.0` (declared defaults; B's non-carried inputs).
**Crossfade type:** equal-power (constant-power), coefficients `a=cos(θ)`, `b=sin(θ)`,
`θ=(π/2)·(k−K_XFADE_START+1)/W_XFADE` over `k∈[K_XFADE_START, K_SWAP)`; the run mix is `a·A + b·B`.
**Click metric** = `max |x[n]−x[n−1]|` over the full output with the single exact `K_SWAP` boundary
sample excluded (same corrected definition as the parent; `click_boundary_excluded=true`).
**B-solo click** = the same metric over `renderSolo_B` (below). RETIRED gate (no longer meaningful):
`maxerr_B_xfade` (only defined when A and B are the identical signal).

## 5. Reference (oracle) renders for THIS run

- **REF_A** — canonical FreqSine, phase 0, events from schedule `[0, K_SWAP)` on `freq`. (UNCHANGED.)
  Gates `maxerr_reload_A == 0` (live A pre-swap bit-exact to REF_A).
- **REF_Bpost** — **B's own FM2op patch**: advance from block 0 with the carry-across mapping
  (`carrierHz` = schedule freq, `modIndex=RATIO`… i.e. `modIndex=1.0`, `ratio=1.0`) through `K_SWAP`,
  then the Variant-F no-reset continuation (the canonical winning path) → continue to `N_BLOCKS`.
  Gates `maxerr_reload_B == 0` (live B post-swap bit-exact to REF_Bpost). **B compared to itself.**
- **REF_Bxfade** — B's own patch, warm-up-normalized (`W_WARM=1`), initial-latched to
  `stateAt(K_XFADE_START)` on `carrierHz` (defaults on modIndex/ratio), rendered over the crossfade
  window. Used ONLY for the equal-power envelope/presence checks below — **NOT** for a bit-exact
  A↔B compare (retired).
- **renderSolo_B** — pure constant-`carrierHz` B render (defaults on modIndex/ratio), `P_MEAS` blocks,
  for (a) the B-solo click sanity gate and (b) Goertzel presence normalization of B's fundamental.
- **Solo A refs** — pure constant-frequency FreqSine renders (UNCHANGED) for A-side Goertzel.

## 6. Gates (per full-run; PASS iff ALL hold)

| Run | Gate |
|-----|------|
| R1 | `xrun_during_prepare==0` ∧ `createPerformer_B==Ok` ∧ `engineB_link==Ok` ∧ windowed `events_delivered_A_prepare == events_scheduled_in[K_PREPARE_START,K_PREPARE_DONE]` (strict `==`) ∧ `dropped==0` ∧ `b_xfade_initial_latch_count==1` |
| R2 | `asan==0` ∧ `crt==0` ∧ `result_violations==0` ∧ `swap_block==4064` ∧ `swap_count==1` ∧ `xrun_at_swap==0` ∧ `old_perf_released_post_swap==true` (Variant-F: `reset_called_on_B` NOT mandated) |
| R3′ | `maxerr_reload_A==0` ∧ `mix_err<=1e-6` (equal-power coeffs) ∧ `alpha_monotone` (a↓, b↑, `a²+b²≈1`) ∧ **`maxerr_reload_B==0`** (B-vs-B) ∧ **`click_max<=0.05`** ∧ **`click_max_Bsolo<=0.05`** (B-solo sanity) ∧ `rel_expected_Apre>=0.40` ∧ `rel_expected_Bpost>=0.40` (B fundamental via Goertzel vs renderSolo_B) ∧ `param_carry_audit_ok` (every B latch: `carrierHz`=scheduled freq, `modIndex==1.0`, `ratio==1.0`) |
| R4 | `repro_ok` (5 SHA-256 identical) ∧ `blocks==10000` ∧ `dropped==0` ∧ `dup==0` ∧ event/param audit all match |
| Global | `asan_clean` ∧ `proof_complete` ∧ B patch source SHA-256 in `metrics.json` matches §2 verbatim |

## 7. Verdict rule

`FINAL PASS iff` all §6 gates hold on the full 5-repeat run with the B = FM2op patch swapped in live
`AND` the B-solo sanity render is click-clean. `FINAL FAIL otherwise.` The report must name the achieved
`click_max`, `click_max_Bsolo`, `maxerr_reload_B`, and the param-carry audit.

## 8. Pre-declared fallback (verbatim, emitted on FINAL FAIL)

> **(a) Click-only failure** — if `maxerr_reload_B==0`, R1/R2/R4 hold, and B's carry-across is correct,
> but the equal-power crossfade or B's own solo render exceeds `click_max > 0.05` (FM sidebands push
> whole-output slew over the gate), adopt the **SILENCE-BOUNDARY bridge for A≠B**: fade A to zero over
> `[K_XFADE_START, K_SWAP)` (equal-power down-ramp on A, B muted), hold one block of equal-power
> silence at `K_SWAP`, then bring B up from its param-carried latch — replacing the A↔B morph with a
> gap so no cross-timbre discontinuity exists. Re-measure `click_max` on the silence-boundary output.
> **(b) Post-swap bit-exactness failure** — if `maxerr_reload_B != 0`, fall back to **per-block
> idempotent carry-across re-statement** across `K_SWAP` (re-send `carrierHz`/`modIndex`/`ratio` every
> block at/after the swap; B state converges within one block period) in place of a single latch-replay.
> **(c) Hard regression** — if even the silence-boundary + idempotent re-statement cannot hold R2/R4
> bit-exactness for a different-schema B, **investment-freeze the A≠B live-crossfade** and record the
> validated result as: *different-timbre live regeneration requires a silence boundary; the sample-exact
> live crossfade is proven only for same-schema swaps.*

## 9. Integrity requirements

- **Copy sources from `g1a/_canonical-baseline/spike/`** (verify the two lock hashes in §1 first). Do NOT
  fork from any frozen `_run-*` evidence dir. Do NOT modify the canonical baseline or any parent run.
- Add `FM2OP_SOURCE` to `patches.h` verbatim from §2; add `engineB` build + B-handle set; implement the
  §2.2 carry-across mapping in the live path AND all B reference renders identically.
- Emit `metrics.json` (incl. B-patch source SHA-256, `click_max`, `click_max_Bsolo`, `maxerr_reload_B`,
  full param-carry audit) + `trace.log` + WAV proofs (A-pre, crossfade, B-post, B-solo) + ASan log +
  build/cert logs, per run, for all 5 repeats.
- The verifier recomputes THIS file's SHA-256 vs the freeze, recomputes the B-patch SHA-256 vs §2,
  refuses PASS on any tampering/threshold-tuning, and bases the verdict strictly on emitted artifacts —
  NOT the executor's narrative. The verifier must FAIL if the visible orchestrator (not the shape's
  executor subagent) produced the harness code, or if the requested shape was silently replaced.
