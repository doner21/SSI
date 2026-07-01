# G1A HANDOFF — to next ORCHESTRATOR session

**Date:** 2026-07-01
**Handoff from:** Fresh ORCHESTRATOR context (session #sched-4g-57f0d5 continuation)
**To:** Next fresh ORCHESTRATOR context (self-handoff)

## State snapshot

### All three G1A passes — ✅ PASS

| # | Pass | Standard | Verdict |
|---|---|---|---|
| 1 | Concurrent two-performer mixing (Windows, ASan) | Spike-grade (ASan + deterministic stress) | ✅ PASS — `g1a/_run/` |
| 2 | Regenerate-and-reload hot-swap (Windows, ASan) | Spike-grade (ASan + deterministic stress) | ✅ PASS — `g1a/_run-reload/` |
| **3** | **Linux/TSan host-side data-race CERT** | **Genuine TSan (clang++-18, `-fsanitize=thread`)** | **✅ FINAL PASS — `g1a/_run-tsan/`** |

Both core engine mechanisms (concurrent mixing + regenerate-and-reload bridge) are now **Windows-validated AND Linux race-certified (host-side)**.

### TSan cert details
- T1: Build + feasibility ✅ (clang++-18, libCmajPerformer.so v1.0.3159 x86_64)
- T2: TSAN-CLEAN ✅ (0 nonsuppressed races, 0 warnings, R=5, 0 host-suppressed)
- T3a: Detector liveness ✅ (control race caught WITH suppressions active)
- T3b: RT-path coverage ✅ (probe caught naming rt_render.cpp:130)
- T4: Functional equivalence ✅ (cross-platform Δ ≤ 5.96e-08)
- Suppression: single `race:libCmajPerformer.so`, proven non-masking
- Proof artifacts in `g1a/_run-tsan/artifacts/` (metrics.json tsan_clean:true, 0-byte tsan_main_run.log, 8 WAVs)

### Toolchain state (WSL2)
- clang++-18 (18.1.3) installed as root (`wsl -u root apt install`)
- TSan runtime linked and verified live
- Cmajor runtime libCmajPerformer.so v1.0.3159 cached in `g1a/_run-tsan/spike/`

### Telegram
- Already paired to chat 878335… (icyma1p)
- This session WAS the active owner (pid 16500, heartbeat alive)
- Next session should run `telegram_pi status` and `telegram_pi takeover` if not owner

## Outstanding: Donald's decision

Donald was presented with **six candidates** for the next G1A pass:

1. **Event-replay across reload** — sample-accurate event replay through hot-swap (cheapest next)
2. **Transport-sync** — shared tempo/playhead across performers
3. **Latency-compensation** — align differing performer latencies
4. **Multi-authority** — multiple controller threads
5. **Instrument Cmajor runtime** — rebuild SDK under TSan (expensive)
6. **Production soak** — long-duration run

Honest recommendation: #1 (event-replay) is the cheapest and most earned — closes the functional gap of held notes dropping during reload.

**Donald was asked to choose a pass.** He has NOT yet decided — this handoff preserves the open decision.

### Standing rules for next session
- **Role:** ORCHESTRATOR — route everything; do NOT execute main-task work directly
- **Planning shape:** adversarial-synthesis via `dual-plan-synthesis-execute-verify` (NOT composable-pipeline — it has a malformed-model-id bug, logged in `bugs that need to be fixed/`)
- **Workflow per pass:** grounding → pre-registration → FREEZE (sha256) → `preregistered-concurrency-spike` → verdict
- **Self-handoff** after every run — schedule ~80s continuation + agent_new_session + stop
- **70% context threshold** — self-handoff if exceeded during orchestration
- **Telegram** the results to Donald after each verdict

### Bug logged
- `composable-pipeline` built-in shape has a malformed-model-id bug (composed middle phase spawns `coder` with `claude-sonnet-4.5` → 404). Do NOT use it. Use `dual-plan-synthesis-execute-verify` instead for adversarial-synthesis planning.
