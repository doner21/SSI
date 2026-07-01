# ATT_RUN_REPORT — G1A Deliverable 2 (run G1A through the bespoke shape)

**Run dir:** `C:/Users/doner/SSI/g1a/_run/`
**Date:** 2026-06-30
**Role:** ORCHESTRATOR (piNen seat) throughout — routed everything; executed no main-task work directly.
**Requested shape:** `preregistered-concurrency-spike` (bespoke, `canary_passed`). Used as requested — NOT substituted.

## FINAL VERDICT: ✅ PASS

**Spike question (narrow first pass):** *Can two live Cmajor Engine/Performer instances be owned, advanced, fed, and MIXED CONCURRENTLY in a bespoke C++ host at all?*
**Answer: YES — demonstrably viable.** Two separate `cmaj::Engine`/`Performer` instances (SineA 440 Hz, SineB 880 Hz), one real-time thread each, mixed by a per-block two-party barrier, ran 10,000 blocks/performer with bit-exact reproducibility, exact solo↔concurrent isolation, correct mix, zero xruns, and a clean AddressSanitizer run.

## Route executed (all routed; orchestrator coordinated only)
| Step | Action | Routed to | Model | Outcome |
|---|---|---|---|---|
| 0a | SDK grounding (locate SDK + native API + low-friction Windows recipe) | researcher | DeepSeek V4-Flash | DONE → `SDK-GROUNDING.md` (prebuilt DLL exists; **TSan unavailable on Windows**) |
| 0b | SDK setup + single-performer smoke test (de-risk) | coder | DeepSeek V4-Pro | PASS → `SMOKE-TEST-REPORT.md` (Gain 0.5, 0 xruns; ASan works) |
| 1 | Author pre-registration + harness spec (narrow first pass, Windows-feasible metrics) | Architect (ssidaw-planner) | Anthropic Opus | DONE → `PRE-REGISTRATION.md`, `HARNESS-SPEC.md` |
| 2 | **FREEZE** (sha256, non-LLM) | **orchestrator (allowed gate)** | — | `FREEZE.txt`; spike/ empty at freeze |
| 3 | Run the spike through the shape | `preregistered-concurrency-spike` | exec Opus / verify V4-Pro | **FINAL PASS** (4 phases: implement→measure→verify→verdict) |
| 4 | Verdict + surface | orchestrator | — | this report + ledger + Telegram |

Generator≠certifier satisfied: Opus implemented/measured; DeepSeek V4-Pro independently re-hashed the frozen files and re-computed every metric from the raw WAV payloads.

## Frozen pre-registration (untouched through the entire run)
| File | SHA-256 | Post-run re-check |
|---|---|---|
| `PRE-REGISTRATION.md` | `de09b4bbdaf4e4b3e0905d5df97e84f8ad217f2b1c0a43c28f37901209d43586` | ✓ unchanged |
| `HARNESS-SPEC.md` | `7c6cd7ce5fc2529d469e3d93f21357c8a839eafa6881db9ab0b69bb02fb98023` | ✓ unchanged |
Frozen 2026-06-30T20:39:33Z, before any spike result existed. No threshold tuned (verify GATE_FIDELITY + NO_TUNING both PASS).

## Pre-registered metrics vs frozen thresholds (verifier-recomputed from raw artifacts)
| Metric | Measured | Frozen threshold | Result |
|---|---|---|---|
| **M1** mem-safety + completeness | result_violations=0, blocks A/B=10000, asan=0, crt=0 | all 0; blocks==10000 | PASS |
| **M2** real-time deadline (xrun) | xrun_count=0; max 53,600 ns ≪ budget 5,333,333 ns (p50 1,700 ns) | xrun_count==0 | PASS |
| **M3** mixed-output correctness | rel440=0.99999, rel880=0.99999, rel_ctl=2.42e-05, mix_err=5.96e-08 | rel≥0.40, ctl≤0.10, mix_err≤1e-6 | PASS |
| **M4** determinism + isolation | 5/5 SHA-256 identical per stream; iso_A_err=0.0, iso_B_err=0.0 (A_concurrent byte-identical to A_solo) | all R equal & iso==0.0 exact | PASS |
| **ASan** | `ASAN_RUN_COMPLETE`, 0 reports | asan_violations=0 | PASS |
| **Proof bundle** | trace.log + 5 WAVs (10,240,044 B each) + metrics.json present & consistent | exists & consistent | PASS |

## Concurrency-proof artifacts (physically verified to exist)
- `spike/artifacts/trace.log`
- `spike/artifacts/A_solo.wav`, `B_solo.wav`, `A_concurrent.wav`, `B_concurrent.wav`, `mixed.wav` (mono f32 @48 kHz, 2,560,000 samples each)
- `spike/artifacts/asan_run.log`, `spike/artifacts/metrics.json` (`final_verdict":"PASS"`)
- Built binaries: `spike/g1a_host.exe`, `spike/g1a_host_asan.exe`
- Bespoke host sources under `spike/` (host_config.h, patches.h, engine_setup, rt_performer, barrier_mixer, perturb, metrics, proof, main.cpp + build drivers)

## Scope honesty
- **In scope (this pass):** can two live performers be owned/advanced/fed/mixed concurrently at all — answered YES on Windows.
- **Out of scope (LATER passes, per frozen §10):** event-replay, transport-sync, latency-compensation, crossfade/atomic patch swap, malleable live-reload, and a **full ThreadSanitizer certification on Linux** (TSan does not exist on Windows; this pass used ASan + a deterministic seeded-interleaving stress + bit-exact determinism/isolation as the Windows-feasible concurrency proof). The PASS is a Windows, spike-grade result — strong but not a TSan certification.
- The fallback ("investment-freeze → silence-boundary") was **NOT** invoked (no FAIL condition).

## Role-integrity verdict: ✅ PASS
The visible orchestrator executed **no** main-task work. The C++ spike, the smoke test, the SDK grounding, and the pre-registration were all authored by routed subagents / the shape. The only direct orchestrator technical action was the deterministic sha256 FREEZE (an allowed inter-phase gate) plus state/ledger/artifact writes and read-only verification of completed work. The requested shape was used (not silently substituted); no different shape was used to complete the task; no shape repair/retry was needed.
