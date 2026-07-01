# ATT_RUN_REPORT — G1A Crossfade Re-Check (reset()-vs-fresh phase fix)

**Run dir:** `C:/Users/doner/SSI/g1a/_run-xfade-recheck/shapeA-preregistered/`
**Phase:** implement (role: executor) · **Date:** 2026-07-01
**Parent run:** `g1a/_run-event-replay/` (untouched; sources copied, not modified).

---

## 0. Pre-registration integrity

| Item | Value |
|------|-------|
| Frozen path | `C:/Users/doner/SSI/g1a/_run-xfade-recheck/PRE-REGISTRATION-XFADE-FIX.md` |
| Frozen SHA-256 | `7ba29f63bf55d219b9ac4701f50d8c9e8ef4a819fc273195e94cd420c33cd895` |
| Recomputed SHA-256 | `7ba29f63bf55d219b9ac4701f50d8c9e8ef4a819fc273195e94cd420c33cd895` |
| Match | **YES** |
| Pre-registration modified by executor | **NO** (read-only; content-hash locked) |

The pre-registration artifact was **NOT modified in any way.**

---

## 1. What was built

Sources were copied verbatim from `g1a/_run-event-replay/spike/` into two sibling variant
trees. The parent run was **not** modified. Both variants received the same **gate-fidelity
fixes** required by §5/§8; each variant then received exactly its §3 fix.

Toolchain: MSVC `cl` 19.50 (VS 18 BuildTools), C++17, `/O2`, `/DCMAJOR_DLL=1`,
`CmajPerformer.dll` **v1.0.3159** (copied into each variant dir). ASan build adds
`/fsanitize=address /Zi /DEBUG /DG1A_ASAN`.

### Gate-fidelity fixes (both variants, faithful to §5 — no threshold relaxed)
- **R1** `>=` → strict `==` (parent bug). `main.cpp`.
- **R1** `events_delivered_A_prepare` now measures the **windowed** delivered count (events
  delivered to A while the B-prepare worker is in flight), not the whole-run total. Without
  this the strict `==` would compare a whole-run total (3) against a windowed scheduled count
  (0) — not what §5 names. Added atomic `eventsAppliedAPrepare` in `swap.h` + `rt_render.cpp`.
- **R3** `click_max <= S_CLICK` moved **inside** `R3_pass` (parent omission). `main.cpp`.
- **R3** the three bit-exact gates (`maxerr_reload_A`, `maxerr_B_xfade`, `maxerr_reload_B`)
  compared with the literal **`== 0`** of §5 (tightened from the parent's `<= 1e-6`). This is
  a *strengthening* toward the frozen spec, never a relaxation.

### Variant A — drop `reset()` in xfade init (`variantA/`)
`rt_render.cpp`: at `k == K_XFADE_START`, the `performers[1].reset()` call was removed; B is
used as the fresh worker-created performer, then `setInputValue(stateAt(K_XFADE_START))` +
advance. Oracle (`reference.cpp::renderRefBxfade`) unchanged. The `K_SWAP` reset (R2) is
preserved.

### Variant B — align oracle to implementation (`variantB/`)
`reference.cpp::renderRefBxfade`: added `perf.reset()` before the initial latch, modelling
exactly what the live xfade path does. `rt_render.cpp` unchanged (keeps the live `reset()`).

---

## 2. Created / modified source & build artifacts

Both variant trees under `shapeA-preregistered/`:

| File | Variant A | Variant B | Change |
|------|-----------|-----------|--------|
| `main.cpp` | modified | modified | R1 `==` + windowed LHS; R3 click gate + `==0` |
| `swap.h` | modified | modified | added `eventsAppliedAPrepare` counter |
| `rt_render.cpp` | **modified (drop xfade reset)** | unchanged (vs parent) | + R1 windowed increment |
| `reference.cpp` | unchanged (vs parent) | **modified (reset before latch)** | Variant B oracle align |
| `run_cert.bat` | **new** | **new** | Device-Guard-aware two-pass ASan certifier |
| all other `.cpp/.h`, `compile.bat`, `compile_asan.bat`, `run.bat`, `CmajPerformer.dll`, `clang_rt.asan_dynamic-x86_64.dll` | copied verbatim | copied verbatim | — |

Emitted per variant (`variantA/artifacts/`, `variantB/artifacts/`):
`metrics.json`, `trace.log`, `asan_run.log`, `cert_console.log`, `schedule.json`,
`events_applied.log`, and WAV proofs: `A_pre.wav`, `B_post.wav`, `crossfade_region.wav`,
`full_output.wav`, `A_xfade.wav`, `B_xfade.wav`, `REF_A.wav`, `REF_Bxfade.wav`,
`REF_Bpost.wav`, `Solo_440.wav`, `Solo_550.wav`. Build logs: `build_normal.log`,
`build_asan.log`, `cert_run.log`.

Run-dir aggregate: `metrics.json`, `FALLBACK_XFADE_FIX.md`, `ATT_RUN_REPORT.md`.

---

## 3. Certification note (Device Guard)

On this host the freshly-built **normal** exe was intermittently blocked by the org **Device
Guard** (WDAC / ISG reputation) policy (Variant A blocked on every retry; Variant B's normal
exe happened to run). The **ASan** exe ran for both. Because the oracle and live paths are
rendered by the **same build in the same process**, every R1–R4 comparison is internally
self-consistent, and the ASan build is a strict superset (identical `/O2` float math plus
sanitizer instrumentation). Certification therefore uses a **two-pass ASan** run
(`run_cert.bat`): pass 1 writes a complete `asan_run.log`; pass 2 ingests that complete log
and writes the certifying `metrics.json`. ASan reports: **0** for both variants; both reached
`ASAN_RUN_CLEAN_EXIT`.

---

## 4. Measured results (per §5 gates)

| Gate | Variant A | Variant B |
|------|-----------|-----------|
| R1 (prepare non-disruption) | **PASS** (delivered==expected==0) | **PASS** |
| R2 (swap safety + reset + latch-replay) | **PASS** (asan/crt/result=0, swap=4064, reset+latch OK) | **PASS** |
| R3 (event-response + click-free) | **FAIL** | **FAIL** |
| R4 (determinism + audit) | **PASS** (5/5 hashes identical, blocks=10000, events audited) | **PASS** |
| asan_clean / proof_complete | true / true | true / true |
| **FINAL** | **FAIL** | **FAIL** |

R3 detail (identical for both variants, bit-for-bit the parent value):
- `maxerr_reload_A = 0` ✓ · `mix_err = 7.45e-09 (<=1e-6)` ✓ · `alpha_monotone = true` ✓
- **`maxerr_B_xfade = 0.49958696961402893`** ✗ (gate `==0`) — ~2·AMP, anti-phase
- `maxerr_reload_B = 0` ✓ · `rel_expected_Bpost = 1.0` ✓ · `rel_expected_Apre = 0.9939` ✓
- **`click_max = 0.24705768844796694`** ✗ (gate `<=0.05`)

---

## 5. Root-cause hypothesis: FALSIFIED (direct WAV evidence)

The pre-registration hypothesized that `reset()` leaves a different oscillator phase than
fresh construction, and that the xfade oracle used fresh construction while the live path used
`reset()`. Direct evidence refutes this:

| WAV | Variant A sha256 | Variant B sha256 | Identical? |
|-----|------------------|------------------|-----------|
| oracle `REF_Bxfade.wav` | `0338bb27…5fe9ccd` | `0338bb27…5fe9ccd` | **YES** |
| live `B_xfade.wav` | `1fdb9b0f…6d1a7a24` | `1fdb9b0f…6d1a7a24` | **YES** |

Adding `reset()` to the oracle (Variant B) produced a **byte-identical** oracle to the
no-reset oracle (Variant A). Removing `reset()` from the live path (Variant A) produced a
**byte-identical** live buffer to the reset-keeping path (Variant B). Therefore
**`reset()` is a phase no-op on a freshly-created, never-advanced Cmajor performer** — it does
not move the oscillator phase. The `maxerr_B_xfade = 0.4996` divergence is **not** caused by
reset()-vs-fresh construction. Both pre-registered variants are inert with respect to the true
root cause and both fail R3 with exactly the parent's numbers. (The remaining candidate — a
difference between the worker-thread-created B that sat idle ~3900 blocks and the
main-thread-created oracle B — is outside the two variants defined by §3 and was not in scope
to fix here.)

---

## 6. Verdict (§6) and fallback (§7)

**Verdict rule (§6):** `FINAL PASS iff (Variant A PASS) ∨ (Variant B PASS)`.
Variant A = FAIL, Variant B = FAIL ⇒ **FINAL FAIL.** No passing variant to name.

**Fallback (§7), emitted verbatim** (see `FALLBACK_XFADE_FIX.md`):

> Investment-freeze on the live-crossfade event-replay bridge. Fallback strategy: **per-block idempotent
> frequency re-statement** (re-send current input values every block after swap; state converges within
> one block period) instead of latch-replay + crossfade.

---

## 7. Integrity statement

- The frozen pre-registration was **NOT modified** (SHA-256 verified before and after).
- No pass/fail threshold was tuned, weakened, or reinterpreted. Every gate change was a
  fidelity fix toward §5 (`>=`→`==`, add omitted click gate, tighten `<=1e-6`→`==0`, and
  measure the windowed quantity §5 names). All strengthenings/faithful readings, never
  relaxations.
- The parent run `g1a/_run-event-replay/` was not touched.
- Verdict is derived from the emitted `metrics.json` + WAV hashes, reproducible via each
  variant's `run_cert.bat`. The independent verifier should recompute the pre-registration
  SHA-256 and re-derive R1–R4 from the emitted artifacts.
