# G1A BESPOKE SHAPE BUILD — SELF-HANDOFF (fresh context)

**You are the ORCHESTRATOR (piNen seat).** Fresh session. Job: **DESIGN AND BUILD a bespoke, deterministic G1A orchestration shape** usable via the `orchestrate` command, then make it usable (reload + canary). Do NOT execute the main task yourself — route everything. Donald explicitly chose this (Option B: build a bespoke shape, NOT reuse G1B's generic PEV).

## FIRST ACTIONS (in strict order)
1. **Read `agent/agent-new-session-diagnostics.json`.** Check `newSessionConfirmed` / `newSessionSilentlyFailed` / `executeCommandRejected` / `phase`. If `phase=done` & `newSessionConfirmed=true` → switch succeeded, proceed. If `newSessionSilentlyFailed=true` → tell Donald to run `/agent-new-session` manually, then continue best-effort.
2. **Confirm Telegram:** `telegram_pi status`; `takeover` if not owner; send Donald: "G1A shape-build session online — designing the bespoke deterministic shape."
3. **Read this file fully.** Then, only as needed for context: `cmajor/CMAJOR-DECISION-BRIEF.md`, `cmajor/CMAJOR-GROUNDING-DOSSIER.md`, `g1b/HANDOFF-NEXT.md`, and the post-reboot + D-B sections of `g1b/_orchestration/ATT_ORCHESTRATOR_ROLE_LEDGER.md`.
4. **Read the skill: `~/.pi/agent/skills/orchestration-builder/SKILL.md` and FOLLOW BUILD PATH B.** This is the authoritative procedure.

## DECISIONS ALREADY MADE (do NOT relitigate)
- **D-B DECIDED:** bespoke C++ harness (own real-time audio host over Cmajor's native C++ API). Not JUCE plugin host, not cmaj standalone.
- **G1B descope ACCEPTED.** EIG/VoI salience machinery CUT from v1.
- **Option B chosen:** BUILD a new named reusable G1A shape (Build Path B → reload required). NOT Path A compose, NOT reuse of G1B PEV.
- **D-A (A1/A2) still pending** — low urgency, does NOT block this work.

## THE TASK (two clearly-separated deliverables — do them in order)
### Deliverable 1 (THIS session's focus): BUILD the bespoke G1A shape
Run the orchestration-builder **Build Path B** to design + build + make-usable a NEW registered `orchestrate` shape for falsifier-first concurrency spikes.

**Why bespoke (the value-add over generic PEV):** the shape must **encode the falsifier-first discipline deterministically** — specifically the **pre-registration FREEZE before any results exist** (content-hash lock). Generic PEV does not enforce a hash-freeze between pre-registration and implementation. The bespoke shape bakes that in.

**Proposed shape design (STARTING POINT — refine via `paradigm-creator`):**
- Suggested name: `preregistered-concurrency-spike` (or `falsifier-first-spike`). Safe kebab, not reserved.
- Phases (≤8, `maxIterations` exactly 1, deterministic, finite, no unbounded loops, no sibling imports):
  1. **pre-register** (planner): author the gate — metrics + pass/fail thresholds + pre-declared fallback. NO results.
  2. **freeze** (deterministic, non-LLM if supported): sha256 the pre-registration artifact; record as immutable reference.
  3. **implement** (executor/author): build the spike strictly to the frozen spec.
  4. **measure** (executor): build + run; collect raw evidence (concurrency, xruns, thread-safety/UB).
  5. **verify** (cross-lab verifier): certify determinism, hash-integrity (pre-reg untouched), gate computed faithfully, nothing tuned.
  6. **verdict** (deterministic aggregation): PASS / FAIL-with-pre-declared-fallback.
- **KEY DESIGN QUESTION to resolve & justify:** can the FREEZE be a phase WITHIN one shape run, or must pre-registration+freeze stay a separate orchestrator-held invocation (G1B used a two-invocation split)? If the shape-builder phase model supports a deterministic non-LLM "freeze" step, bake it in (cleaner). If not, scope the shape to implement→measure→verify→verdict and keep pre-reg+freeze as the orchestrator's inter-phase gate — document the choice explicitly in SHAPE_SPEC + ledger.

**Build Path B mechanics (from the skill):**
- Runtime home: `~/.pi/agent/orchestration-builder/runs/{run_id}/`, `run_id = RUN_YYYYMMDD-HHMMSS`. Create dir before any orchestrate call.
- Artifacts: `ORCHESTRATION_STATE.json`, `ATT_ORCHESTRATOR_ROLE_LEDGER.md`, `SHAPE_SPEC.json`, `ATT_PROPOSAL.md`, `ATT_BUILD_REPORT.md`, `ATT_RUN_REPORT.md`.
- **B1** write `SHAPE_SPEC.json` (shape-builder spec format).
- **B2** `orchestrate(paradigm:"paradigm-creator", task:<design intent>)` — propose-only, confidence gate; refine spec if flagged.
- **B3** `orchestrate(paradigm:"shape-builder", task:"SHAPE_BUILDER_SPEC_JSON\n<spec contents>")` — writes TS shape+test, registry/docs edits, runs independent verifier; returns `reloadRequired:true` ONLY on verifier PASS. **Require the verifier PASS, not an executor narrative.**
- **B4 RELOAD handoff (mandatory):** schedule continuation FIRST (`agent_scheduler`, delaySeconds 75–90) carrying run id/dir/targetName/task + "resume as ORCHESTRATOR, B5 next"; then `agent_reload_runtime {}`; stop. Continuation's FIRST action reads `agent/agent-reload-diagnostics.json` (`reloadConfirmed`/`reloadSilentlyFailed`).
- **B5** after reload: confirm the new shape is discovered; run the `SHAPE_CANARY:<name>` canary; only `canary_passed` = usable.
- Model routing: design/paradigm-creator planner = **DeepSeek V4-Pro**; shape build executor = **V4-Flash**; verifier = **V4-Pro**.

### Deliverable 2 (LATER — after shape is usable; do NOT start now): RUN G1A through the new shape
- Narrow first pass: *can two live Engine/Performer instances be owned/advanced/fed/mixed concurrently in the bespoke C++ host at all?* 4 reload metrics + concurrency proof. Event-replay/transport-sync/latency-comp are LATER passes. Investment-freeze on fail → silence-boundary fallback.
- Needs **Cmajor C++ SDK + toolchain** (native spike, unlike the TS G1B). A host-neutral SDK setup + trivial-patch smoke test is the sensible first G1A step.
- Cross-lab team: Architect(Opus) authors · DeepSeek **V4-Pro** certifies · **V4-Flash** grounding.
- **Do not conflate building the shape with running G1A.** Finish Deliverable 1 (shape usable) and surface to Donald before launching the full G1A run.

## ROLE INTEGRITY (load-bearing)
Stay ORCHESTRATOR throughout. Do NOT hand-write the shape's TS source or the G1A experiment yourself — route via paradigm-creator/shape-builder/subagents. Maintain `ATT_ORCHESTRATOR_ROLE_LEDGER.md` in the run dir. Do NOT mark the shape usable before reload+discovery+canary. Generator≠certifier cross-lab. Self-handoff at 70% context. Keep Telegram updated at each phase transition.
