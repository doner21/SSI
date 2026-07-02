# ATT_RUN_REPORT — G1A "A ≠ B" live-swap to a genuinely DIFFERENT DSP

**Shape:** shapeA-preregistered · **Phase:** implement (executor) · **Date:** 2026-07-01
**Working dir:** `g1a/_run-a-not-b/shapeA-preregistered/spike/`
**Variant:** F (no-reset continuation at K_SWAP — the canonical winning path)

---

## 0. Integrity gates (checked FIRST, before any build)

| Artifact | Expected SHA-256 | Observed | Status |
|---|---|---|---|
| Frozen pre-registration `PRE-REGISTRATION-A-NOT-B.md` | `5f6f3ef0…a858a43` | `5f6f3ef0…a858a43` | ✅ MATCH — not tampered |
| Canonical `patches.h` (baseline lock) | `c513b5d0…32c3fa7` | `c513b5d0…32c3fa7` | ✅ MATCH |
| Pinned `CmajPerformer.dll v1.0.3159` | `bcf45708…6027af9f` | `bcf45708…6027af9f` | ✅ MATCH |
| Full canonical `SOURCE-MANIFEST.sha256` | (26 files) | all OK | ✅ untouched |

The frozen pre-registration was **read only** and was **NOT modified** in any way (re-verified
post-run: still `5f6f3ef0…a858a43`). Sources were copied from `_canonical-baseline/spike/`; the
canonical baseline and DLL were **not modified**. Not forked from any `_run-*` evidence dir.

## 1. B patch (FM2op) provenance — the Global gate

`FM2OP_SOURCE` was added to `patches.h` **byte-for-byte** from the pre-reg §2 fenced `cmajor` block
(1215 bytes, UTF-8, LF, trailing newline included — standard markdown fence extraction).

```
b_source_sha256 = 80632228fc3a62114fb04e31b6c739f31156d16414b5da28993baabc05a89155  (1215 bytes)
```

The harness recomputes this SHA in-process over the exact `FM2OP_SOURCE` literal and emits it into
`metrics.json` (`b_patch.b_source_sha256`). The verifier recomputes the same SHA over §2 and compares.
**Ambiguity noted (falsifiable choice made):** the exact byte convention for "the §2 source block" is
not spelled out. The most natural convention — *the fenced content between the ` ```cmajor `/` ``` `
markers, UTF-8, LF, trailing newline of the final `}` line included* — was used and is recorded
explicitly in `metrics.json.b_patch.sha_convention`. (Without the trailing newline the block is 1214
bytes / `162c5c6d…`.) No threshold was relaxed; this only fixes the hashing convention.

## 2. Structural change implemented (A ≠ B)

- **Two-engine build (§2.1):** `engineA` from `FREQ_SINE_SOURCE` (schema `freq`, `out`); `engineB`
  from `FM2OP_SOURCE` (DIFFERENT schema `carrierHz`, `modIndex`, `ratio`, `out`), distinct session IDs
  (0x5A / 0x5B). Performer A = `engineA.createPerformer()`; the worker prepares Performer B =
  `engineB.createPerformer()` **solo**. The `std::atomic<uint32_t> activeIndex` swap of `performers[2]`
  and the safe-release protocol are UNCHANGED. RT render dispatches to A-handles (`freq`/`out`) or
  B-handles (`carrierHz`/`modIndex`/`ratio`/`out`) by `activeIndex`.
- **Param carry-across (§2.2)** — applied identically in the live path AND every B reference render via
  a single shared `latchBInitial(...)` primitive: A's `freq` events map 1:1 (value + timing) to B's
  `carrierHz`; `modIndex`/`ratio` take declared defaults **1.0**, latched **once** at B's first latch
  (K_XFADE_START), never changed by the schedule. Runtime evidence (`events_applied.log`): A `freq`
  events @2481→440, @4031→550, @4039→550 carried to B `carrierHz` at the same blocks (pre-swap @4031/
  @4039, post-swap @5448→660); initial latch @4000 carrierHz=440=stateAt(K_XFADE_START).
- **Equal-power crossfade (§4):** `a=cosθ`, `b=sinθ`, `θ=(π/2)(k−K_XFADE_START+1)/W_XFADE` over
  k∈[K_XFADE_START,K_SWAP); run mix `a·A + b·B`. B warm-up-normalized (W_WARM=1). Variant-F no-reset
  continuation at K_SWAP. `maxerr_B_xfade` **RETIRED** (undefined for different waveforms).
- **Reference renders (§5):** REF_A (canonical, engineA); REF_Bpost (B's OWN FM2op patch, carry-across
  + Variant-F continuation — B-vs-B bit-exact target); REF_Bxfade (engineB, envelope/presence only,
  NOT bit-exact); renderSolo_B (constant carrierHz, B-solo click + Goertzel); Solo A ref.

## 3. Gate results — full 5-repeat run (FINAL PASS iff ALL hold)

| Run | Key measurements | Verdict |
|---|---|---|
| **R1** prepare non-disruption | xrun_during_prepare=0 · createPerformer_B=Ok · engineB_link=Ok · windowed events delivered==expected · dropped=0 · b_xfade_initial_latch_count=1 | ✅ PASS |
| **R2** swap safety | asan=0 · crt=0 · result_violations=0 · swap_block=4064 · swap_count=1 · xrun_at_swap=0 · old_perf_released_post_swap=true | ✅ PASS |
| **R3′** event + equal-power xfade | maxerr_reload_A=0 · mix_err=7.45e-09 (≤1e-6) · alpha_monotone (a↓,b↑,a²+b²≈1) · **maxerr_reload_B=0** (B-vs-B) · **click_max=0.04314** (≤0.05) · **click_max_Bsolo=0.03596** (≤0.05) · rel_expected_Apre=0.99999 (≥0.40) · rel_expected_Bpost=1.0001 (≥0.40) · **param_carry_audit_ok=true** | ✅ PASS |
| **R4** determinism + audit | repro_ok=true (5/5 identical SHA-256 on full/A/B/xfade) · blocks=10000 · dropped=0 · dup=0 · event audit A 3/3, B_pre 2/2, B_post 1/1 | ✅ PASS |
| **Global** | asan_clean=true · proof_complete=true · b_source_sha256=`80632228…a89155` (matches §2) | ✅ PASS |

### Named results required by §7
- `click_max` = **0.043136479333** (≤ 0.05) — equal-power A↔B morph, K_SWAP boundary excluded.
- `click_max_Bsolo` = **0.035962391645** (≤ 0.05) — renderSolo_B (FM2op @550 Hz).
- `maxerr_reload_B` = **0** — post-swap B bit-exact to REF_Bpost (B's own FM2op patch). B compared to itself.
- `param_carry_audit`: carrierHz==scheduled freq at every B latch; modIndex=1.0 (×1); ratio=1.0 (×1). **OK.**

## FINAL VERDICT: **PASS**

All §6 gates hold on the full 5-repeat run with B = FM2op swapped in live, and the B-solo sanity render
is click-clean. The validated live-crossfade event-replay bridge **generalizes** from same-patch to a
structurally different DSP with a different endpoint schema. §8 fallback **not** triggered.

## 4. Toolchain
MSVC `cl 19.50.35728` (x64), C++17, `/DCMAJOR_DLL=1 /DG1A_VARIANT_F`, pinned `CmajPerformer.dll v1.0.3159`.
Normal build (`compile.bat`→`g1a_event_replay_host.exe`) + ASan build (`compile_asan.bat`,
`/fsanitize=address`→`g1a_event_replay_host_asan.exe`). Two-pass cert via `run_cert.bat`: ASan run →
`artifacts/asan_run.log` (ASAN_RUN_CLEAN_EXIT, 0 reports), then normal certifying run ingests it.

## 5. Emitted proof artifacts (`spike/artifacts/`)
`metrics.json` (B-source SHA, click_max, click_max_Bsolo, maxerr_reload_B, full param-carry audit,
5×4 stream hashes) · `trace.log` · `events_applied.log` · `schedule.json` · WAV proofs: `A_pre.wav`,
`crossfade_region.wav`, `B_post.wav`, `B_solo.wav` (+ `full_output.wav`, `A_xfade.wav`, `B_xfade.wav`,
`REF_A.wav`, `REF_Bpost.wav`, `REF_Bxfade.wav`, `Solo_A_440.wav`, `Solo_B_550.wav`) · `asan_run.log` ·
`cert_run.log` · build logs `build_normal.log` / `build_asan.log`.

> Generator ≠ certifier: this executor implemented and measured. The independent verifier re-hashes the
> frozen pre-registration, recomputes the B-patch SHA vs §2, and bases the verdict strictly on the raw
> emitted artifacts (WAV bytes + metrics.json + logs), NOT this narrative.
