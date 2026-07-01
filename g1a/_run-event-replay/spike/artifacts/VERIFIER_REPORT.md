# CROSS-LAB VERIFIER REPORT — G1A Event-Replay Spike

**Role:** Independent cross-lab verifier (falsifier-first)
**Date:** 2026-07-01
**Artifacts path:** `C:/Users/doner/SSI/g1a/_run-event-replay/spike/artifacts/`

---

## 1. HASH INTEGRITY: PASS

| Artifact | Computed SHA-256 | Frozen Reference (FREEZE.txt) | Match |
|----------|-----------------|-------------------------------|-------|
| `HARNESS-SPEC.md` | `8257efbefee2ab18d3fe5c07a174d6ff793c77ce8958c9116e76ce125e3a79e6` | `8257efbefee2ab18d3fe5c07a174d6ff793c77ce8958c9116e76ce125e3a79e6` | YES |
| `PRE-REGISTRATION.md` | `707e105a917c09fe0945f7846313a2da52e11121576caf6d1ac82517a38d3a2c` | `707e105a917c09fe0945f7846313a2da52e11121576caf6d1ac82517a38d3a2c` | YES |

**Pre-registration artifacts are unmodified since freeze.**

---

## 2. EXECUTABLES EXIST: PASS

| Executable | Size | Present |
|-----------|------|---------|
| `g1a_event_replay_host.exe` | 486,400 bytes | YES |
| `g1a_event_replay_host_asan.exe` | 1,748,992 bytes | YES |

---

## 3. GATE FIDELITY: FAIL

Two violations found where the implementation's pass/fail logic deviates from the frozen spec.

### Violation A — R1: threshold weakened from `==` to `>=`

**Spec** (PRE-REG §5.1):
> `events_delivered_A_prepare == events_scheduled_in[K_PREPARE_START, K_PREPARE_DONE]`

**Implementation** (`main.cpp` line ~200):
```cpp
R.R1_pass = ... && (R.events_delivered_A_prepare >= R.events_expected_A_prepare) ...
```
Comment reads `// at least the expected count`.

**Evidence:**
- Prepare window: `[K_PREPARE_START, K_PREPARE_DONE]` = `[100, 100]`
- `events_scheduled_in[100, 100]` = **0** (no events at block 100)
- `events_delivered_A_prepare` = `st.eventsAppliedA.load()` = **3** (all events applied to A across the full run)
- 3 != 0, but `>=` passes

**Two compounding bugs:**
1. **Metric scope error**: `events_delivered_A_prepare` counts ALL A events (3), not just prepare-window events (0)
2. **Gate relaxation**: `>=` instead of `==` silently masks the scope error
3. The trace.log acknowledges the discrepancy (`delivered=3 expected=0`) but still reports R1=PASS

**Impact:** R1 would have failed under the spec's `==` gate. However, the final verdict is already FAIL due to R3, so this does not change the outcome.

### Violation B — R3: click_max check omitted from gate logic

**Spec** (PRE-REG §5.3(f)):
> `click_max <= S_click = 0.05`

**Implementation** (`main.cpp` R3_pass, lines ~230-240):
The code computes `R.click_max` and `R.click_boundary_excluded` but does NOT include them in `R.R3_pass`.

**Measured value:** `click_max = 0.24705768844796694` (well above 0.05)

R3 correctly fails on `maxerr_B_xfade = 0.499587 > 0`, so this omission is non-decisive, but it is a gate fidelity violation.

---

## 4. NO TUNING: FAIL

| Check | Spec | Implementation | Verdict |
|-------|------|---------------|---------|
| `maxerr_reload_A == 0` | `== 0` | `<= 1e-6` (minor, passes when 0) | Minor relaxation |
| `maxerr_B_xfade == 0` | `== 0` | `<= 1e-6` (value 0.499587 fails either way) | Minor relaxation, no impact |
| `maxerr_reload_B == 0` | `== 0` | `<= 1e-6` (minor, passes when 0) | Minor relaxation |
| R1 `delivered == expected` | `==` | `>=` (masks scope bug) | **Consequential** |
| R3 click check | `<= 0.05` | omitted from R3_pass | **Consequential** |

**Threshold weakened, check omitted** — the spec's gates were not faithfully implemented.

---

## 5. DETERMINISM / SOUNDNESS: PASS

| Check | Result |
|-------|--------|
| Full-output SHA-256 (5 repeats) | All identical: `59f47af359168df2cc201ab32aee426f1730674af60fd3e5c697b0f8fa7bdcfb` |
| A-stream SHA-256 (5 repeats) | All identical: `b8e61d7c0e01136bf2471e515f40488d81eec9a4be9f568b96420fe0b4734e6f` |
| B-stream SHA-256 (5 repeats) | All identical: `d5adbdc4fc411b1dc45d43e725f2570d0606503d4a1e48af4aea331a22e063c8` |
| Xfade SHA-256 (5 repeats) | All identical: `4fcfeace0cb62a38f25d1754ddcb7d1109998a5b1f7e5a3080d1481e6ae514d7` |
| Blocks rendered | 10,000 / 10,000 |
| Dropped blocks | 0 |
| Duplicated blocks | 0 |
| Swap block | 4064 (exactly once) |
| ASan violations | 0 |
| CRT heap violations | 0 |
| Performer API Result violations | 0 |
| Swap count | 1 |
| ASAN_RUN_CLEAN_EXIT | Confirmed in log |

No data races, ASan violations, or reproducibility issues detected.

---

## 6. EVENT CROSS-CHECK: PASS (R4 event audit)

| Metric | Measured | Scheduled | Match |
|--------|----------|-----------|-------|
| events_applied_A (pre-swap) | 3 | 3 | YES |
| events_applied_B_pre (xfade) | 2 | 2 | YES |
| events_applied_B_post (post-swap) | 1 | 1 | YES |
| xfade initial latch count | 1 | 1 | YES |
| latch-replay count | 1 | 1 | YES |

Schedule events: `[2481, 440]`, `[4031, 550]`, `[4039, 550]`, `[5448, 660]`
- `[0, K_SWAP=4064)` events = `2481, 4031, 4039` = 3 (R4 = PASS)
- `[K_XFADE_START=4000, K_SWAP=4064)` events = `4031, 4039` = 2 (R4 = PASS)
- `[K_SWAP=4064, N=10000)` events = `5448` = 1 (R4 = PASS)

All 5 sentinels verified:
1. At least one event in [0, K_XFADE): `2481` — PASS
2. No change in A_PRE [3488, 4000): `2481` before, `4031` after — PASS
3. Change before K_SWAP: events at 4031, 4039 — PASS
4. No change in B_POST [4064, 4576): next event is 5448 — PASS
5. At least one after B_POST: event at 5448 — PASS

---

## 7. FINAL VERDICT: FAIL

### Per-metric table

| Metric | Measured Value | Threshold | Gate Result |
|--------|---------------|-----------|-------------|
| **R1** `xrun_during_prepare` | 0 | == 0 | PASS |
| **R1** `createPerformer_result` | Ok | Ok | PASS |
| **R1** `b_ready_before_xfade` | true (k_done=100 < 4000) | true | PASS |
| **R1** `events_delivered_A_prepare` | 3 | == expected(0) [but code uses >=] | (would FAIL with ==) |
| **R1** `events_dropped_in_window` | 0 | == 0 | PASS |
| **R1** `b_xfade_initial_latch_count` | 1 | == 1 | PASS |
| **R2** `asan_violations` | 0 | == 0 | PASS |
| **R2** `crt_heap_violations` | 0 | == 0 | PASS |
| **R2** `result_violations` | 0 | == 0 | PASS |
| **R2** `swap_block` | 4064 | == 4064 | PASS |
| **R2** `swap_count` | 1 | == 1 | PASS |
| **R2** `reset_called_on_B` | true | true | PASS |
| **R2** `latch_replay_called` | true | true | PASS |
| **R2** `xrun_at_swap` | 0 | == 0 | PASS |
| **R2** `old_perf_released_post_crossfade` | true | true | PASS |
| **R3** `maxerr_reload_A` | 0 | == 0 | PASS |
| **R3** `mix_err` | 7.45e-09 | <= 1e-6 | PASS |
| **R3** `alpha_monotone` | true | true | PASS |
| **R3** `maxerr_B_xfade` | **0.499587** | **== 0** | **FAIL** |
| **R3** `maxerr_reload_B` | 0 | == 0 | PASS |
| **R3** `rel_expected_Bpost` | 1.0 | >= 0.40 | PASS |
| **R3** `rel_expected_Apre` | 0.994 | >= 0.40 | PASS |
| **R3** `click_max` | **0.247058** | **<= 0.05** | **FAIL** |
| **R4** `repro_ok` | true | true | PASS |
| **R4** `blocks_rendered` | 10000 | == 10000 | PASS |
| **R4** `dropped_blocks` | 0 | == 0 | PASS |
| **R4** `duplicated_blocks` | 0 | == 0 | PASS |
| **R4** `event_audit` | all match | all match | PASS |
| **R4** `latch counts` | 1 each | == 1 | PASS |

### R3 Root Cause — B_xfade mismatch

`maxerr_B_xfade = 0.499587` is approximately `2 * AMP(0.25)` — the maximum possible difference for two anti-phase amplitude-0.25 sine waves. This indicates the `reset()` call at K_XFADE_START in the live path produces a different internal phase state than creating a fresh performer in the reference path.

**Comparison:**
- **REF_Bxfade** (reference.cpp): fresh performer → `setInputValue(440Hz)` → advance 64 blocks
- **Live B xfade** (rt_render.cpp): worker-created performer at block 100 → at K_XFADE_START: `reset()` → `setInputValue(440Hz)` → advance 64 blocks

The two paths differ in that the reference creates a brand-new performer while the live path calls `reset()` on a previously-created (but never advanced) performer. Cmajor's `reset()` apparently does not produce the same internal state as fresh construction.

**In contrast**, `maxerr_reload_B = 0` — the post-swap latch-replay IS bit-exact. This means `reset()` followed by `setInputValue` at the POST-SWAP point works correctly (because the reset + relatch happens at K_SWAP and B's subsequent output matches REF_Bpost). The difference is in the XFADE path where B was **never advanced before reset+setInputValue**, yet the reset changes state differently than a fresh performer.

### Verdict Rule (PRE-REG §6)

```
FINAL PASS iff R1 ∧ R2 ∧ R3 ∧ R4 ∧ proof-exists ∧ asan-clean
FINAL FAIL otherwise
```

| Condition | Value |
|-----------|-------|
| R1 | true (spec: would be false with == gate) |
| R2 | true |
| **R3** | **false** |
| R4 | true |
| proof_complete | true |
| asan_clean | true |

**R3 fails** → **FINAL VERDICT: FAIL** (correct) ✅

### Gate-Fidelity Sanity

Even with the implementation's gate relaxations, the correct FAIL verdict is reached because R3's `maxerr_B_xfade` (0.499587) exceeds both the spec's strict `== 0` threshold AND the implementation's relaxed `<= 1e-6` threshold. The click_max (0.247 > 0.05) is an additional independent failure that would also trigger R3 FAIL.

**The final verdict FAIL is sound.** However, the R1 gate relaxation and click-check omission are genuine verifier findings that should be corrected in future spike passes.

---

## 8. Cmajor Worker-Thread Performer Creation Phase Artifact

**Location:** `C:/Users/doner/SSI/g1a/_run-event-replay/spike/bg_prepare.{h,cpp}`

**Artifact:** The worker-thread Performer B creation phase (`backgroundPrepareB`), dispatched at block `K_PREPARE_START=100`.

**Design:**
- Runs on a worker thread while performer A is live on the RT thread
- Calls `st.sharedEngine.createPerformer()` — solo engine access (RT thread never touches engine; main thread finished all engine ops before dispatch)
- Calls `perfB.setBlockSize(BLOCK_SIZE)`
- Publishes `st.performers[1] = move(perfB)` followed by release fence: `st.bReady.store(true, release)`
- On failure: stores error but does NOT publish bReady (RT thread will detect at K_XFADE_START)
- Perturbation interleaving via `PerturbSchedule` for repeats 1..4 (repeat 0 = clean)

**Invariant verified:** Single-thread engine access is respected; the worker calls `createPerformer()` and `setBlockSize()` solo on the shared engine.

**Trace evidence:** `kPrepareDone = 100` (bReady published at block 100, well before K_XFADE_START=4000). xrun_during_prepare = 0.

---

## Signature Block

```
HASH_INTEGRITY:  PASS  (SHA-256 match HARNESS-SPEC.md, PRE-REGISTRATION.md)
GATE_FIDELITY:   FAIL  (R1 == downgraded to >=; R3 click check omitted from gate logic)
NO_TUNING:       FAIL  (threshold weakened, click-gate omitted)
DETERMINISM:     PASS  (all 5x4 SHA-256 identical; zero ASan/CRT/result violations)
VERIFY_VERDICT:  FAIL  (R3 maxerr_B_xfade=0.499587 > 0; R3 click_max=0.247058 > 0.05)
                     (Gate violations documented but non-decisive for final FAIL)
```
