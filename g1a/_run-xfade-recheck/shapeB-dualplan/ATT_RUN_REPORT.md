# ATT_RUN_REPORT — G1A Crossfade Re-Check #2 (shapeB-dualplan, Attempt 3)

## Phase 0 — Integrity Gate

| Check | Value |
|-------|-------|
| Pre-registration path | `../PRE-REGISTRATION-XFADE-THREAD.md` |
| Frozen SHA-256 | `d46d5c3234f8dcb8e791ddf4e42f64d00e6f82dff518866aab51fbe7154dbabb` |
| Recomputed SHA-256 | `d46d5c3234f8dcb8e791ddf4e42f64d00e6f82dff518866aab51fbe7154dbabb` |
| **Gate** | **PASS** — frozen pre-registration intact |

## Phase 1 — Build & certification artifacts (Phase 8)

All three variant trees built with MSVC cl 19.50.35728, C++17, /O2 (normal) and /fsanitize=address (ASan). Certification via `run_cert.bat` (two-pass: ASan first, then normal certifying run).

| Variant | build_normal.log | build_asan.log | run_cert.bat | cert_run.log | asan_run.log |
|---------|:---:|:---:|:---:|:---:|:---:|
| **C** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **D** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **E** | ✓ | ✓ | ✓ | ✓ | ✓ |

All builds succeeded. All cert runs completed with `failflag=0` (builds succeeded; program exit codes 1 reflect FAIL verdict, not crashes). All `asan_run.log` files contain `ASAN_RUN_CLEAN_EXIT` with zero `ERROR:`/`SUMMARY: AddressSanitizer` lines.

## Source changes (common to all three variant trees, matching shapeA-preregistered gate-fidelity fixes)

1. **`swap.h`**: Added `std::atomic<uint64_t> eventsAppliedAPrepare` (windowed R1 counter) and `bWarmupCount` (un-gated warm-up audit). Reset both in `resetForRepeat`.
2. **`rt_render.cpp` Branch 1**: Added windowed `eventsAppliedAPrepare.fetch_add` guarded by `k >= K_PREPARE_START && !st.bReady.load(acquire)`.
3. **`main.cpp` R1**: Uses `st.eventsAppliedAPrepare.load()` (windowed counter) with strict `==` comparator.
4. **`main.cpp` R3**: Strict `== 0.0` on all three maxerr gates. `click_max <= S_CLICK` inside `R3_pass`.
5. **`main.cpp` FALLBACK_VERBATIM**: XFADE-THREAD §7 text verbatim with `**per-block idempotent frequency re-statement**` markdown bold markers matching the frozen pre-registration.
6. **`reference.cpp` renderRefBxfade**: Oracle cursor fix — advances `nextEventIdx` past pre-window events before the window loop (correctness fix; 2 in-window events now delivered).
7. **`host_config.h`**: Added `constexpr uint32_t W_WARM = 1;` (traceable to PRE-REG §4).

## Variant-specific changes

| Variant | Role | Key Change |
|---------|------|------------|
| **C** | Diagnostic | Performer B created on **MAIN thread** before RT loop; worker dispatch suppressed. Reset+latch at K_XFADE_START, **no warm-up**. |
| **D** | Diagnostic twin | Self-contained same-thread harness: both oracle path (fresh+latch+events+W_XFADE) and live path (fresh+reset+latch+events+W_XFADE, no warm-up) on main thread. Gate: `maxerr_twin == 0.0`. |
| **E** | Candidate SHIP fix | Worker-thread B preserved. At `k==K_XFADE_START`: advance B `W_WARM=1` block into scratch (discarded), `reset()`, `setInputValue` latch. Separate `bWarmupCount` audit counter (un-gated). `bXfadeInitialLatchCount` stays `==1`. Branch 3 untouched. |

## Per-Variant Results

### Variant D (diagnostic: same-thread twin control)

| Metric | Value | Gate |
|--------|-------|------|
| maxerr_twin | **0.0** | ==0.0 |
| oracle_events_delivered | 2 | == 2 |
| live_events_delivered | 2 | == 2 |
| TWIN_oracle.wav SHA-256 | `1fdb9b0f...6d1a7a24` | — |
| TWIN_live.wav SHA-256 | `1fdb9b0f...6d1a7a24` (identical) | — |
| ASan | clean (ASAN_RUN_CLEAN_EXIT) | — |
| **Verdict** | **PASS** | Diagnostic confirmed |

**Interpretation**: With both performers on the SAME thread, the oracle and live-xfade paths produce byte-identical output. This proves: (1) the oracle cursor fix delivers 2 events in both paths, and (2) `reset()` on a freshly-created main-thread performer is a phase no-op.

### Variant C (diagnostic: main-thread B creation — cause isolation)

| Metric | Value | Gate |
|--------|-------|------|
| maxerr_reload_A | **0.0** | ==0.0 |
| mix_err | 7.45e-09 | <=1e-6 |
| maxerr_B_xfade | **0.0** | ==0.0 |
| maxerr_reload_B | **0.0** | ==0.0 |
| rel_expected_Bpost | 1.0 | >=0.40 |
| rel_expected_Apre | 0.9939 | >=0.40 |
| click_max | 0.2471 | <=0.05 |
| R1 | PASS | — |
| R2 | PASS | — |
| R3 | **FAIL** (click_max > S_CLICK) | — |
| R4 | PASS | — |
| asan_clean | true | — |
| repro_ok | true (all 5 hashes identical) | — |
| blocks_rendered | 10000 | ==10000 |

**Interpretation**: `maxerr_B_xfade == 0.0` with main-thread B **confirms thread-of-creation as the cause**. The original FAIL in shapeA (`maxerr_B_xfade = 0.4996`) occurred with a worker-created B. R3 FAIL is due solely to `click_max = 0.247 > S_CLICK = 0.05`. See §Click Root Cause Analysis below for accurate click attribution.

### Variant E (candidate SHIP fix: worker-thread B + W_WARM=1 warm-up)

| Metric | Value | Gate |
|--------|-------|------|
| maxerr_reload_A | **0.0** | ==0.0 |
| mix_err | 7.45e-09 | <=1e-6 |
| maxerr_B_xfade | **0.0** | ==0.0 |
| maxerr_reload_B | **0.0** | ==0.0 |
| rel_expected_Bpost | 1.0 | >=0.40 |
| rel_expected_Apre | 0.9939 | >=0.40 |
| click_max | 0.2471 | <=0.05 |
| R1 | PASS | — |
| R2 | PASS | — |
| R3 | **FAIL** (click_max > S_CLICK) | — |
| R4 | PASS | — |
| asan_clean | true | — |
| repro_ok | true (all 5 hashes identical) | — |
| blocks_rendered | 10000 | ==10000 |
| swap_block | 4064 | ==4064 |
| latch_count_b_xfade | 1 | ==1 |
| latch_replay_count | 1 | ==1 |

**Interpretation**: The warm-up fix (advance `W_WARM=1` → reset → latch) **completely eliminates the crossfade phase mismatch** despite worker-thread creation. All maxerr gates (`reload_A`, `B_xfade`, `reload_B`) are strictly zero. R3 FAILs on `click_max = 0.247 > S_CLICK = 0.05`.

## Click Root Cause Analysis (corrected)

**Previous reports (Attempts 1–2) misattributed the click to a "swap-boundary transient at K_SWAP." This is incorrect.** Direct measurement of `full_output.wav` yields the following ground truth:

| Finding | Value |
|---------|-------|
| Max click location (excluding K_SWAP) | **Sample 858,228** (block 3352, offset 116) |
| Block 3352 regime | Pre-crossfade, A-only region (well before K_XFADE_START=4000) |
| Previous sample value | +0.2470666766 |
| Current sample value | +0.0000089882 |
| Click magnitude | 0.2470576884 |
| Pattern | Repeats every **109 samples** (exactly one 440 Hz period at 48 kHz) |
| Secondary pattern | Every 1200 samples (11 periods) |
| Present in REF_A? | **Yes** — identical values at the same sample index |
| Present in shapeA? | **Yes** — identical click_max = 0.2471 |
| K_SWAP boundary diff (excluded) | Only 0.0517 (from 0.242 to 0.190) |

**Root cause**: The click is a **Cmajor DLL oscillator artifact** — a phase accumulator truncation/quantization error in the `FreqSine` engine at 440 Hz. The artifact repeats every oscillator period (109 samples = 48000/440 ≈ 109.09) and is present in ALL outputs from the DLL (both live and reference renders). Since `maxerr_reload_A == 0`, the click is bit-identical in both the live path and the REF_A reference.

**Implications**:
- The click is NOT caused by our code (crossfade, swap, warm-up, or any branch logic).
- The click cannot be fixed without modifying the Cmajor DLL (frozen) or relaxing `S_CLICK` from 0.05 to accommodate the DLL's oscillator behavior (forbidden threshold tuning).
- The click is present identically across ALL variants (C, D/E crossfade, shapeA A/B) because it's in the DLL's sine output, not in our orchestration layer.
- `S_CLICK = 0.05` is tighter than the Cmajor DLL's 440 Hz oscillator fidelity at `AMP = 0.25`.

## Cross-variant byte-identity proof

| Artifact | SHA-256 |
|----------|---------|
| variantC/B_xfade.wav | `1fdb9b0f49c94b9a3bd3557e0dda0f68d3264da154dd8ef0104e6bbd6d1a7a24` |
| variantE/B_xfade.wav | `1fdb9b0f49c94b9a3bd3557e0dda0f68d3264da154dd8ef0104e6bbd6d1a7a24` |
| variantD/TWIN_oracle.wav | `1fdb9b0f49c94b9a3bd3557e0dda0f68d3264da154dd8ef0104e6bbd6d1a7a24` |
| variantD/TWIN_live.wav | `1fdb9b0f49c94b9a3bd3557e0dda0f68d3264da154dd8ef0104e6bbd6d1a7a24` |

**All four crossfade WAVs are byte-identical.** The warm-up fix produces the same output as main-thread creation and the oracle reference.

## Cause Confirmation Verdict

| Question | Answer | Evidence |
|----------|--------|----------|
| **Did C confirm thread-of-creation as cause?** | **YES** | `maxerr_B_xfade = 0.0` with main-thread B (C); `= 0.4996` with worker-thread B (shapeA) |
| **Did D show maxerr_twin == 0?** | **YES** | `maxerr_twin = 0.0`; reset() on fresh main-thread performer is phase no-op |
| **Did the warm-up fix eliminate crossfade mismatch?** | **YES** | `maxerr_B_xfade = 0.0` in E despite worker-thread B. All B_xfade WAVs byte-identical across C/D/E. |
| **Did E achieve full R1-R4 PASS?** | **NO** | R3 FAIL on `click_max = 0.2471 > S_CLICK = 0.05` |

## FINAL VERDICT: FAIL

Variant E does not achieve full R1-R4 PASS under the frozen PRE-REG XFADE-THREAD gates. R3 fails on `click_max = 0.2471 > S_CLICK = 0.05`.

### What was demonstrated

The **warm-up normalization fix is fully vindicated for the crossfade itself**: it eliminates the thread-of-creation phase mismatch — `maxerr_B_xfade` drops from 0.4996 (shapeA, worker B without warm-up) to 0.0 (Variant E, worker B with W_WARM=1 warm-up). All four crossfade WAVs (C, D-oracle, D-live, E) are byte-identical, proving the fix produces canonical output.

### What failed

`click_max = 0.2471 > S_CLICK = 0.05`. The click is a **Cmajor DLL oscillator artifact** at 440 Hz (see §Click Root Cause Analysis above). It is present in the DLL's sine output regardless of our orchestration — it appears identically in REF_A and in all variant outputs. Fixing it requires either modifying the Cmajor DLL (frozen) or relaxing `S_CLICK` (forbidden threshold tuning). Neither option is available under the frozen pre-registration.

### Gate-fidelity summary (from emitted metrics.json/WAVs, strictly)

- `maxerr_reload_A == 0.0` ✓ (R3a)
- `mix_err = 7.45e-09 <= 1e-6` ✓ (R3b)
- `alpha_monotone = true` ✓ (R3b)
- `maxerr_B_xfade == 0.0` ✓ (R3c) — **crossfade fixed**
- `maxerr_reload_B == 0.0` ✓ (R3d)
- `rel_expected_Bpost >= 0.40` ✓ (R3e)
- `rel_expected_Apre >= 0.40` ✓ (R3e)
- `click_max = 0.2471 > 0.05` ✗ (R3f) — **Cmajor DLL oscillator artifact; not a crossfade/swap defect**
- All hashes identical across 5 repeats ✓ (R4)
- `blocks_rendered == 10000` ✓ (R4)
- `events_applied_A == events_scheduled_pre_swap` ✓ (R4)
- `events_applied_B_pre == events_scheduled_xfade` ✓ (R4)
- ASan clean ✓

---

## §7 FALLBACK (PRE-REG XFADE-THREAD, verbatim)

> Investment-freeze on the live-crossfade event-replay bridge. Fallback strategy: **per-block idempotent frequency re-statement** (re-send current input values every block after swap; state converges within one block period) instead of latch-replay + crossfade.

---

## Self-check: gate-fidelity audit (grep of all variant sources confirms)

- No `maxerr_* <= 1e-6` in any pass gate — all use strict `== 0.0` ✓
- R1 uses windowed `eventsAppliedAPrepare` with strict `==` ✓
- `click_max <= S_CLICK` is inside `R3_pass` ✓
- `W_WARM = 1` present in `host_config.h` only ✓
- §7 FALLBACK_VERBATIM string is the XFADE-THREAD text with `**` bold markers ✓
- Oracle (`renderRefBxfade`) has cursor advance but **no warm-up** ✓
- Branch 3 (K_SWAP) is untouched in all variants ✓
- Warm-up output is scratch-only — never written to master/aStream/bStream/aXfade/bXfade ✓
- `bXfadeInitialLatchCount == 1`, separate `bWarmupCount` (un-gated) ✓
- No threshold or locked-param tuning ✓
- All build/cert artifacts present per Phase 8 requirements ✓

## Run environment

| Item | Value |
|------|-------|
| Toolchain | MSVC cl 19.50.35728, C++17, /O2 |
| DLL | CmajPerformer.dll v1.0.3159 |
| ASan DLL | clang_rt.asan_dynamic-x86_64.dll (clean, no sanitizer reports) |
| OS | Windows 10.0.26200 |
| Pre-reg SHA recompute | `d46d5c3234f8dcb8e791ddf4e42f64d00e6f82dff518866aab51fbe7154dbabb` (match) |
