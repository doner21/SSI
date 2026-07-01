# G1A Canonical Baseline — LOCKED

**Locked:** 2026-07-01 · **Status:** VALIDATED (within scope) · **Owner:** orchestrator on Donald's authority

This directory is the **single go-forward source of truth** for the G1A live-crossfade event-replay
reload harness. Future G1A spikes MUST copy `spike/` from here (not from the frozen `_run-*` evidence
dirs, which carried the toy-patch bug). It is `variantP1` from the patch-fix confirmation, promoted:
corrected patch + every proven fix, source-only + the pinned DLL.

## Lock hashes

| Artifact | SHA-256 |
|----------|---------|
| Canonical patch `spike/patches.h` | `c513b5d0fc469c94b7d0ebb9629ae8355f0d8b1d607fa05d56039a57132c3fa7` |
| Source manifest `SOURCE-MANIFEST.sha256` (27 files) | `a5610448a64e77d9766568fe074b4157a3e1b9ea1770e280ae284d58140c080d` |
| Pinned `spike/CmajPerformer.dll` v1.0.3159 | `bcf457086fe3d021d760e62b4e40c8ed5f19a7f639b82e269a0bbccb6027af9f` |

To verify integrity later: `cd spike && sha256sum -c ../SOURCE-MANIFEST.sha256`.

## What is validated (and how)

The live-crossfade event-replay reload bridge passes **end-to-end (R1–R4)** with the corrected patch,
**confirmed by two independent orchestration shapes, two executors, two verifiers, from raw WAV bytes**:

| Property | Result |
|----------|--------|
| Event-replay across atomic swap | bit-exact (`maxerr_reload_B == 0`) |
| Crossfade phase (warm-up normalization) | `maxerr_B_xfade == 0` |
| Swap safety (atomic, single swap @4064, A released), ASan | clean |
| Determinism (R4) | 5/5 identical SHA-256 |
| Click after patch fix | `click_max = 0.0216 ≤ 0.05` |
| Final | **PASS** (both shapes) |

## The canonical fixes baked into this baseline

1. **Patch fix (the lock-in reason):** `patches.h` FreqSine — `sin(twoPi * phase)` → `sin(phase)`.
   The original doubled-`twoPi` produced a tone ~2π× too high with intrinsic per-sample slew
   ~0.059 > the 0.05 click gate, plus periodic wrap discontinuities (the "click" at block 3352 that
   failed three prior runs). Accumulator `addModulo2Pi(phase, twoPi*freq*period)` is UNCHANGED.
2. **Warm-up normalization (Variant E):** advance worker-B by `W_WARM=1` block → `reset()` → latch,
   before the crossfade. Cures the worker-thread-of-creation phase offset.
3. **No-reset continuation at swap (Variant F):** at `K_SWAP`, atomically drop A and continue the
   already-warmed phase-correct B (no reset/relatch); post-swap stays bit-exact.
4. **Oracle-cursor fix** in `reference.cpp::renderRefBxfade` (delivered in-window events).
5. **Gate-fidelity fixes** in `main.cpp`: R1 strict `==` (windowed counter), `click_max<=0.05` inside
   `R3_pass`, strict `==0` maxerr gates.

## Frozen evidence (do NOT modify — these are the audit trail)

| Run | Verdict | Pre-reg SHA-256 |
|-----|---------|-----------------|
| `_run-event-replay/` | FAIL (buggy patch, mis-attributed) | `707e105a917c09fe0945f7846313a2da52e11121576caf6d1ac82517a38d3a2c` |
| `_run-xfade-recheck/` (phase solved) | FAIL | fix `7ba29f63…c33cd895`; thread `d46d5c32…5154dbabb` |
| `_run-boundary-click/` (click = engine/patch-intrinsic) | FAIL | `764219813f…b908839` |
| `_run-patchfix-confirm/` (**PASS**, source of this baseline) | PASS | `ea053f8250…8e57411` |

## Build / run (Windows, MSVC + pinned DLL)

```
cd spike
compile.bat        &&  run.bat          # normal
compile_asan.bat   &&  run_cert.bat     # ASan certification
```

## Out of scope — NOT yet validated (open for future spikes off this baseline)

- **A ≠ B**: swapping to a *genuinely different* DSP (the real "regenerate into something new" case).
  This baseline swaps the *same* patch on both sides.
- **Stateful effects**: reverb tails, delay lines, convolution (latent buffer state the warm-up cannot
  restore).
- **Live real-time audio device** under scheduling jitter (this baseline is an offline deterministic
  block render).

## Lock policy

- Treat `spike/` as read-only reference. To run a new spike, COPY it into a new `_run-*/` dir and modify
  the copy; never edit this baseline in place.
- If the baseline itself must change, re-validate through both shapes and update the lock hashes above.
