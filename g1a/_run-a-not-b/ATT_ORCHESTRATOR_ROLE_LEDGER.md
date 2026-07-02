# Orchestrator Role Integrity Ledger — G1A "A ≠ B"

**Run:** G1A A≠B (live-swap to a genuinely different DSP). **Date:** 2026-07-01/02.
**Requested shapes/tools:** (1) `preregistered-concurrency-spike`, (2) `dual-plan-synthesis-execute-verify`
via the `orchestrate` tool, driven by a fresh session (agent_new_session) + scheduled wake-up.
**Current role:** ORCHESTRATOR throughout. The visible session did NOT execute the main task.

## Subagents spawned + roles
| Shape/phase | Tool | Executor model | Verifier model | Outcome |
|---|---|---|---|---|
| Shape 1 (preregistered-concurrency-spike) | orchestrate | anthropic/claude-opus-4-8 | deepseek/deepseek-v4-pro | ✅ FINAL PASS (4/4 subagents) |
| Shape 2 attempt 1 (dual-plan-synth-exec-verify) | orchestrate | deepseek/deepseek-v4-pro | openai-codex/gpt-5.5 | ⚠ executor produced full PASS artifacts, transport `terminated` before verify |
| Shape 2 attempt 2 (dual-plan-synth-exec-verify) | orchestrate | deepseek/deepseek-v4-pro | openai-codex/gpt-5.5 | ⚠ planner `Upstream idle timeout exceeded` (network) before planning |
| Shape 2 verify-phase repair | subagent (reviewer) | — | openai-codex/gpt-5.5 | ✅ FINAL PASS (independent, fresh re-run) |

## Subagent artifacts
- Frozen pre-reg: `g1a/_run-a-not-b/PRE-REGISTRATION-A-NOT-B.md` (SHA `5f6f3ef0…a858a43`, `FREEZE-A-NOT-B.txt`).
- Shape 1: `g1a/_run-a-not-b/shapeA-preregistered/spike/` + `artifacts/` + `ATT_RUN_REPORT.md`.
- Shape 2: `g1a/_run-a-not-b/shapeB-dualplan/spike/` + `artifacts/` + `ATT_RUN_REPORT.md` (+ Verifier Addendum).

## Direct orchestrator actions (classification)
| Action | Classification |
|---|---|
| Read new-session diagnostics; mem_search; git log | orchestration support |
| Read canonical baseline sources (patches.h, host_config.h, swap.h, etc.) | orchestration support / intake |
| Author `PRE-REGISTRATION-A-NOT-B.md` + sha256 freeze | orchestration state (pre-reg authoring — required orchestrator duty) |
| Create run dirs; verify canonical patch hash | orchestration support |
| Invoke Shape 1, Shape 2 (×2) via orchestrate | subagent spawning / routing |
| Read shapeB metrics.json + ATT_RUN_REPORT to diagnose the abort | reading logs / verifying completed jobs |
| Spawn gpt-5.5 verifier subagent for the lost verify phase | repair (recover lost verify phase via requested verifier model) |
| Append Verifier Addendum; write this ledger; Engram saves | handoff / orchestration state |

**Did the orchestrator execute any main-task work?** NO. The visible session wrote NO C++, built NO
harness, and ran NO experiment as the executor. Pre-registration authoring + sha256 freeze is the
orchestrator's pre-registered duty (the shape requires an externally-frozen gate). Re-running an
already-built binary was performed only inside the verifier SUBAGENT, not the orchestrator.

## Context checkpoints
- After pre-reg freeze: 7.5% used. After Shape 1: ~11.8%. Well under the 70% self-handoff threshold; no
  self-handoff required.

## Repair attempts + outcomes
1. Shape 2 attempt 1 failed (executor transport `terminated` after emitting complete PASS artifacts).
   → Diagnosed as transient infra failure (not task failure); executor artifacts intact + PASS.
2. Repair: re-invoked the SAME shape with a shortened "resume/verify existing build" task → attempt 2
   failed at the planner (`Upstream idle timeout exceeded`, network).
3. Repair (targeted): completed the requested shape's LOST verify phase with the SAME pre-registered
   verifier model (gpt-5.5) via a short verifier subagent. It freshly re-ran the binaries and returned
   FINAL PASS from raw artifacts. Shape/route preserved; main task NOT re-executed by the orchestrator.

**Policy note:** No orchestration shape was switched to complete the main task; the main task was
executed by the shapes' executor subagents. Provider/model fallback options were pre-registered and not
needed (deepseek executor succeeded substantively; only the verdict transport was lost).

## Final role-integrity verdict
✅ **PASS.** The orchestrator remained an orchestrator: it routed the main task through both requested
performant shapes, authored + froze the pre-registration, diagnosed two transient transport failures,
and repaired the lost verify phase using the requested verifier model — without ever executing the main
task directly or switching shapes to finish it.
