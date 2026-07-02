# ATT_RUN_REPORT — G1A "A ≠ B" shapeB-dualplan

**Date:** 2026-07-02  
**Shape:** B — dual-plan synthesis-execute-verify  
**Role:** Executor (deepseek/deepseek-v4-pro)  
**Pre-reg SHA:** `5f6f3ef079f6aa52ca324439e61077e5d49026aec62a561a8c1882d80a858a43` ✅ (unchanged since freeze)

---

## Integrity Verification

| Check | Result |
|---|---|
| Pre-reg SHA-256 vs freeze | ✅ `5f6f3ef079f6aa52ca324439e61077e5d49026aec62a561a8c1882d80a858a43` |
| Canonical `SOURCE-MANIFEST.sha256` all-OK | ✅ |
| `CmajPerformer.dll` SHA-256 | ✅ `bcf457086fe3d021d760e62b4e40c8ed5f19a7f639b82e269a0bbccb6027af9f` |
| `patches.h` SHA-256 (post-FM2OP addition) | `19a1bc044f08da92d4d19ffb8f0db167b074d7a77463504421249200c3bc5fad` (changed — FM2OP added) |
| B-patch source SHA-256 (FM2OP block) | `c19ddceed617d630ffd4a441c9d25d0ccd24e384f1168c9337c1528a1f50be77` |
| B-patch SHA convention | UTF-8, LF, no BOM, includes leading/trailing newline from C++ raw string literal, `strlen(FM2OP_SOURCE)` |
| No tampering of frozen pre-reg or canonical baseline | ✅ |
| No copying from `shapeA-preregistered/` sibling | ✅ |

---

## Implementation Summary

### Architecture (per PRE-REG §2.1)

- **A = FreqSine** (UNCHANGED canonical): `sessionId=0x5A`, handles `freq` + `out`
- **B = FM2op** (genuinely different Cmajor processor): `sessionId=0x5B`, handles `carrierHz` + `modIndex` + `ratio` + `out`
- Two distinct `Engine` objects: `engineA` (FreqSine) and `engineB` (FM2op)
- Single-thread-per-engine invariant preserved (worker touches `engineB` solo)
- Atomic `activeIndex` swap + safe-release protocol UNCHANGED

### Param Carry-Across (§2.2)

- A's `freq` events → B's `carrierHz` (1:1 value + timing)
- `modIndex` = 1.0 (declared default), latched once at B's first latch
- `ratio` = 1.0 (declared default), latched once at B's first latch
- At swap: `carrierHz` carries from `stateAt(K_XFADE_START)` + carried events — NO re-latch
- Variant-F no-reset continuation at K_SWAP

### Crossfade (§4)

- **Per-block equal-power**: `a=cos(θ)`, `b=sin(θ)`, `θ=(π/2)·(i+1)/64` for block ordinal i∈[0,63]
- 64 per-block coefficients recorded in `metrics.json`
- Mix: `out[j] = a·A[j] + b·B[j]` (a,b constant within each block)

### Reference Renders (§5)

| Reference | Engine | Description |
|---|---|---|
| REF_A | FreqSine | Canonical A [0, K_SWAP) — gates `maxerr_reload_A==0` |
| REF_Bpost | FM2op | Variant-F oracle: initial latch at K_XFADE_START, advance through K_SWAP with NO reset — gates `maxerr_reload_B==0` |
| REF_Bxfade | FM2op | Crossfade window only (envelope/presence, UN-GATED) |
| renderSolo_B | FM2op | Constant carrierHz, modIndex=1.0, ratio=1.0 — gates `click_max_Bsolo` and normalizes `rel_expected_Bpost` |

---

## Gate Results (5-repeat run)

### R1 — Prepare Non-Disruption ✅ PASS

| Metric | Value | Gate | Result |
|---|---|---|---|
| xrun_during_prepare | 0 | ==0 | ✅ |
| engineB_link | Ok | ==Ok | ✅ |
| createPerformer_B | Ok | ==Ok | ✅ |
| k_prepare_done | 100 | <4000 | ✅ |
| events_delivered_A_prepare | 0 | ==expected(0) | ✅ |
| events_dropped_in_window | 0 | ==0 | ✅ |
| b_xfade_initial_latch_count | 1 | ==1 | ✅ |

### R2 — Atomic Swap Safety ✅ PASS

| Metric | Value | Gate | Result |
|---|---|---|---|
| asan_violations | 0 | ==0 | ✅ |
| crt_heap_violations | 0 | ==0 | ✅ |
| result_violations | 0 | ==0 | ✅ |
| swap_block | 4064 | ==4064 | ✅ |
| swap_count | 1 | ==1 | ✅ |
| xrun_at_swap | 0 | ==0 | ✅ |
| old_perf_released_post_swap | true | ==true | ✅ |
| reset_called_on_B | false | NOT mandated (Variant F) | — |

### R3′ — Event Response + Click-Free ✅ PASS

| Metric | Value | Gate | Result |
|---|---|---|---|
| maxerr_reload_A | 0.0 | ==0 | ✅ |
| mix_err | 7.45×10⁻⁹ | ≤1×10⁻⁶ | ✅ |
| alpha_monotone (a²+b²≈1) | true | ==true | ✅ |
| maxerr_reload_B | 0.0 | ==0 | ✅ |
| click_max | 0.04314 | ≤0.05 | ✅ |
| click_max_Bsolo | 0.03596 | ≤0.05 | ✅ |
| rel_expected_Apre | 1.0000 | ≥0.40 | ✅ |
| rel_expected_Bpost (vs renderSolo_B) | 1.0001 | ≥0.40 | ✅ |
| param_carry_audit_ok | true | ==true | ✅ |
| maxerr_B_xfade | 0.0 | UN-GATED (different waveforms) | — |

### R4 — Determinism + Completeness ✅ PASS

| Metric | Value | Gate | Result |
|---|---|---|---|
| repro_ok (5/5 identical SHA-256) | true | ==true | ✅ |
| blocks_rendered | 10000 | ==10000 | ✅ |
| dropped_blocks | 0 | ==0 | ✅ |
| duplicated_blocks | 0 | ==0 | ✅ |
| events_applied_A | 3/3 | ==scheduled | ✅ |
| events_applied_B_pre | 2/2 | ==scheduled | ✅ |
| events_applied_B_post | 1/1 | ==scheduled | ✅ |

**Per-stream hashes (all 5 repeats identical):**

| Stream | SHA-256 |
|---|---|
| full | `6078eb8bdce5d78d29246dc9000da5314864b7b421102c7f204d66b422a18426` |
| A | `20024b8516235999aaae63fc1c81587b95e01272bd37e8d098764f95bf14d036` |
| B | `159f9fbae3bd2a2878971c48a2109a440e89a9514d4d7e3f5f6afc8780590f61` |
| xfade | `87dcd7e99284fea926500dff200fbf4828ed5435764f76f35c15baeb97f02aef` |

### Global ✅ PASS

| Metric | Value |
|---|---|
| asan_clean | true |
| proof_complete | true |
| B-source SHA matches §2 | ✅ `c19ddceed617d630ffd4a441c9d25d0ccd24e384f1168c9337c1528a1f50be77` |

---

## Final Verdict: ✅ **PASS**

All gates R1, R2, R3′, R4, and Global hold across the full 5-repeat run.

### Key achieved values

- `click_max` = 0.04314 (below 0.05 threshold — FM2op's sideband slew at 550 Hz stays within gate)
- `click_max_Bsolo` = 0.03596 (FM2op's own solo render is click-clean)
- `maxerr_reload_B` = 0.0 (B-vs-B bit-exact post-swap confirmed — Variant-F oracle matches live B output)
- `maxerr_reload_A` = 0.0 (A pre-swap bit-exact to REF_A)
- `mix_err` = 7.45×10⁻⁹ (per-block equal-power crossfade is consistent)
- `rel_expected_Bpost` = 1.0001 (FM2op fundamental strongly present vs renderSolo_B)
- Param-carry audit: `modIndex` set exactly once (==1.0), `ratio` set exactly once (==1.0), `carrierHz` carries freq 1:1

### Interpretation

The G1A hypothesis is **confirmed for a genuinely different DSP voice**: the validated live-crossfade event-replay bridge generalizes from same-patch (FreqSine→FreqSine) to a structurally different DSP (FreqSine→FM2op) with a different input-endpoint schema. The two-engine architecture, pre-registered `freq→carrierHz` carry-across, warm-up normalization of B's own phase, and per-block equal-power crossfade all hold — producing a bit-exact post-swap B stream (B-vs-B), ASan-clean 5/5 deterministic output, and boundary-continuous clicks (0.04314 ≤ 0.05).

---

## Files Changed

| File | Change |
|---|---|
| `spike/patches.h` | Added `FM2OP_SOURCE` from pre-reg §2 (verbatim, UTF-8/LF/no-BOM) |
| `spike/host_config.h` | Added `MOD_INDEX=1.0`, `RATIO=1.0` |
| `spike/engine_setup.h` | Added B handles (`carrierHzHandle`, `modIndexHandle`, `ratioHandle`); declared `buildFM2opEngine()` |
| `spike/engine_setup.cpp` | Implemented `buildFM2opEngine()` — load FM2op patch, get 4 B handles, link |
| `spike/swap.h` | Replaced single `sharedEngine`/`freqHandle`/`outHandle` with two-engine split (`engineA`+A handles, `engineB`+B handles); added `ParamCarryEntry`, param-carry audit log + counters |
| `spike/bg_prepare.cpp` | Changed `st.sharedEngine.createPerformer()` → `st.engineB.createPerformer()` |
| `spike/crossfade.h` | Replaced per-sample linear alpha with per-block equal-power (`equalPowerAlpha`/`equalPowerBeta`) |
| `spike/crossfade.cpp` | Replaced per-sample mix with per-block equal-power mix |
| `spike/rt_render.cpp` | Two-engine dispatch: Branch 1 uses A handles; Branch 2 warm-up+three-input initial latch B, freq→carrierHz carry-across, per-block mix; Branch 3 Variant-F no-reset continuation with B handles |
| `spike/reference.h` | Split ctx (FreqSine for REF_A/solo refs, FM2op for REF_Bxfade/REF_Bpost); added `renderSoloB()` |
| `spike/reference.cpp` | Implemented FM2op-aware reference renders with 3-input latches; Variant-F oracle for REF_Bpost |
| `spike/metrics.h` | Updated `mixError` to per-block recomputation; `alphaMonotone()` no-arg (64 block points) |
| `spike/metrics.cpp` | Replaced per-sample mix error with per-block recomputation; 64-point alpha monotone check |
| `spike/proof.h` | Added `engineB_link_ok`, `click_max_Bsolo`, `param_carry_audit_ok`, `b_patch_sha`, `b_patch_sha_convention`, `mod_index`, `ratio`, `per_repeat[]`, `xfade_convention`, `xfade_coeffs` |
| `spike/proof.cpp` | Updated `writeMetricsJson` with all new fields; updated trace log gates; added crossfade include |
| `spike/main.cpp` | Two-engine build (ctxA+ctxB); B-solo render; R3′ gate (removed `maxerr_B_xfade`, added `click_max_Bsolo`+`param_carry_audit_ok`); `rel_expected_Bpost` normalized vs `renderSolo_B`; replaced `FALLBACK_VERBATIM` with pre-reg §8 verbatim |
| `spike/compile.bat` | Added `/utf-8` flag |
| `spike/compile_asan.bat` | Added `/utf-8` flag |

---

## Artifacts Emitted

All in `spike/artifacts/`:

- **WAVs:** `A_pre.wav`, `crossfade_region.wav`, `B_post.wav`, `B_solo.wav`, `full_output.wav`, `A_xfade.wav`, `B_xfade.wav`, `REF_A.wav`, `REF_Bxfade.wav`, `REF_Bpost.wav`, `Solo_440.wav`, `Solo_550.wav`
- **Logs:** `trace.log`, `events_applied.log`, `schedule.json`, `metrics.json`
- **Build/run:** `build_normal.log`, `build_asan.log`, `asan_run.log`, `cert_run.log`

---

## Timing

| Metric | Value |
|---|---|
| p50 (per-block) | 3,300 ns |
| p99 | 4,900 ns |
| max | 89,300 ns |
| D_block (budget) | 5,333,333 ns |

---

## Notes

- The per-block equal-power crossfade (NOT per-sample) is the locked formula per pre-reg §4. The verifier should use the 64 (a,b) coefficient pairs emitted in `metrics.json` to confirm the mix.
- `REF_Bpost` is the canonical Variant-F oracle (fresh performer, initial latch at K_XFADE_START, no reset at K_SWAP) — the same cursor/`stateAt`/event-order/Variant-F logic as the live path.
- The B-source SHA convention includes the leading and trailing newlines from the C++ raw string literal `R"cmajor(\n...\n)cmajor"`. The verifier should extract the fenced block from pre-reg §2, prepend and append `\n`, and SHA-256 the result.
- `modIndex` and `ratio` were set exactly once (first latch) and never changed by the schedule — confirmed by `paramCarryModIndexSets==1` and `paramCarryRatioSets==1`.
- `maxerr_B_xfade` is measured but UN-GATED (different waveforms between A and B make this metric undefined for bit-exact comparison).

---

## Verifier Addendum — INDEPENDENT VERIFY PHASE (recovered)

**Added by:** ORCHESTRATOR on behalf of the independent verifier subagent (openai-codex/gpt-5.5).
**Why appended here:** the dual-plan-synthesis-execute-verify orchestration transport dropped TWICE
(attempt 1: executor subagent `terminated` after ~35 min *after* emitting all artifacts + PASS;
attempt 2: planner `Upstream idle timeout exceeded` ~7 min in). Both are transient upstream/network
failures, NOT task falsifications; preflight showed all 3 routes healthy each time. The shape's
**executor phase completed** with deterministic passing artifacts; only the internal verify phase was
lost. Per role-integrity repair-only policy the lost verify phase was completed using the SAME
pre-registered verifier model (gpt-5.5). No shape switch; no orchestrator self-execution of the main task.

**Verdict:** ✅ **FINAL PASS** — reproduced from freshly re-run binaries (fresh artifact timestamps
2026-07-02 01:08; ASan exit 0, normal exit 0; DLL v1.0.3159).

| Integrity gate | Result |
|---|---|
| Pre-reg SHA-256 == freeze | ✅ `5f6f3ef0…a858a43` |
| Canonical `SOURCE-MANIFEST.sha256` all-OK; patches.h `c513b5d0…`; DLL `bcf45708…` | ✅ unmodified |
| B-patch SHA (fenced §2 block, UTF-8/LF, leading+trailing newline) | ✅ `c19ddcee…f50be77` == metrics.json == embedded FM2OP_SOURCE |
| Schema A (`freq,out`) vs B (`carrierHz,modIndex,ratio,out`) | ✅ genuinely different |
| No threshold tuning in host_config.h | ✅ |

**Gates:** R1 ✅ · R2 ✅ · R3′ ✅ · R4 ✅ · Global ✅ (maxerr_B_xfade correctly retired/ungated).
Key values: `maxerr_reload_A=0`, `maxerr_reload_B=0`, `mix_err=7.45e-09`, `click_max=0.043136`,
`click_max_Bsolo=0.035962`, `rel_expected_Bpost=1.0001`, `param_carry_audit_ok=true`, 5/5 identical
SHA-256 (`full=6078eb8b…a18426`). ASan scan clean (`ASAN_RUN_CLEAN_EXIT`, no sanitizer keywords).
Independent WAV byte analysis: A_pre.wav RMS 0.17678 / slew 0.01440 (pure sine ~440 Hz) vs B_solo.wav
RMS 0.14221 / slew 0.03596 (FM sidebands ~550/1100/1650 Hz) — A≠B is real. Authorship: harness produced
by the executor subagent (deepseek/deepseek-v4-pro), not the visible orchestrator.

**Non-blocking defects flagged (do not affect verdict):** (1) `metrics.json` is not strict-valid JSON
because `b_patch_sha_convention` embeds unescaped `R"cmajor(...)cmajor"` quotes/newlines (values were
independently verified from raw text/logs/WAV bytes); (2) `trace.log` has a stale label
`latch_replay_count = 0 (gate: ==1)` — Variant F correctly does NOT mandate reset/latch replay.
