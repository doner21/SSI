# G1A DELIVERABLE 2 — RUN G1A THROUGH THE BESPOKE SHAPE (self-handoff, fresh context)

**You are the ORCHESTRATOR (piNen seat).** Fresh session. Deliverable 1 (building the shape) is DONE
and the shape is USABLE. Your job now: **RUN the G1A spike through the bespoke
`preregistered-concurrency-spike` orchestration shape**, following its usage contract. Do NOT execute the
main task (the C++ spike) yourself — route everything. Stay ORCHESTRATOR throughout.

## FIRST ACTIONS (strict order)
1. **Read `agent/agent-new-session-diagnostics.json`.** Check `newSessionConfirmed` /
   `newSessionSilentlyFailed` / `executeCommandRejected` / `phase`. If `phase=done` &
   `newSessionConfirmed=true` → switch succeeded, proceed. If `newSessionSilentlyFailed=true` → tell
   Donald to run `/agent-new-session` manually, then continue best-effort.
2. **Confirm Telegram:** `telegram_pi status`; `takeover` if not owner; message Donald: "G1A Deliverable-2
   session online — preparing pre-registration + freeze, then running the spike through the shape."
3. **Read this file fully.** Then read, as context:
   - `~/.pi/agent/orchestration-builder/runs/RUN_20260630-203536/ATT_RUN_REPORT.md` (what the shape is + its usage contract + design rationale)
   - `cmajor/CMAJOR-DECISION-BRIEF.md` and `cmajor/CMAJOR-GROUNDING-DOSSIER.md` (D-B context: bespoke C++ harness over Cmajor native C++ API)
   - `g1b/PRE-REGISTRATION.md` + `g1b/FREEZE.txt` (TEMPLATES for the pre-registration + the orchestrator-held content-hash freeze — copy the format, not the content)
   - `g1a/HANDOFF-G1A-SHAPE-BUILD.md` "Deliverable 2" section (the narrow first-pass definition)

## DECISIONS ALREADY MADE (do NOT relitigate)
- **D-B DECIDED:** bespoke C++ harness (own real-time audio host over Cmajor's native C++ API). Not JUCE host, not cmaj standalone.
- **G1B descope ACCEPTED:** EIG/VoI salience machinery CUT from v1.
- **The shape is built + usable:** `preregistered-concurrency-spike`, lifecycle `canary_passed`. Source in `~/.pi/pi-orchestrator-extension/src/shapes/`. Do NOT rebuild it.
- **D-A (A1/A2) still pending** — low urgency, does NOT block this work.

## THE SHAPE'S USAGE CONTRACT (load-bearing — this is WHY the shape is shaped this way)
`preregistered-concurrency-spike` runs phases `implement → measure → verify → verdict` (each an LLM
subagent). It does **NOT** author or freeze the pre-registration itself — there is no non-LLM phase
primitive, so the **FREEZE is an orchestrator-held deterministic gate you perform BEFORE invoking the
shape.** Concretely, before calling `orchestrate`:
1. The pre-registration (metrics + pass/fail thresholds + pre-declared fallback) must already exist as a file.
2. You must deterministically `sha256sum` it (bash, non-LLM) and write a `FREEZE.txt` (G1B format) recording the locked hash, the freeze time, and the rule that implement/measure may NOT modify the locked file.
3. You pass the **spike goal + the frozen pre-registration file path + its sha256 reference hash** inside the `orchestrate` task string.
The shape's `verify` phase will independently re-`sha256sum` the file and FAIL if it differs (tamper),
or if thresholds were tuned, then `verdict` emits the verbatim pre-declared fallback on FAIL.

## THE ROUTE (do these in order; route each to subagents/shape — orchestrator coordinates only)

### Step 0 — Working dir + toolchain prep (route to an executor subagent)
- Create a G1A run/working dir, e.g. `C:/Users/doner/SSI/g1a/_run/` with `ATT_ORCHESTRATOR_ROLE_LEDGER.md`.
- **Toolchain reality check** (this is the sensible FIRST G1A step, per the handoff): verify/obtain the
  **Cmajor C++ SDK + a C++ toolchain**. `cmake` is present (`C:\Program Files\CMake`); a C++ compiler
  (MSVC/clang) and the Cmajor SDK headers/sources must be located or fetched. Route SDK location/setup +
  a **host-neutral SDK setup + trivial-patch smoke test** (compile + load a trivial Cmajor patch, render
  a block of audio) to an executor/grounding subagent. This de-risks before the concurrency spike.
  - Grounding/research (locating the Cmajor SDK, native API entry points) → DeepSeek **V4-Flash**.

### Step 1 — Pre-registration authoring (route to Architect = Opus)
Spawn an Architect subagent (anthropic Opus) to AUTHOR `g1a/_run/PRE-REGISTRATION.md` for the **narrow
first pass only**:
- **Falsifiable question:** *Can two live Cmajor Engine/Performer instances be owned, advanced, fed, and
  mixed CONCURRENTLY in the bespoke C++ host at all?*
- **Metrics (4 reload metrics + concurrency proof):** define exactly what is measured (e.g. both
  performers advance on separate threads without data race; ThreadSanitizer/UBSan clean; no xruns over N
  blocks; mixed output is non-trivial/correct; a concurrency proof artifact).
- **Pass/fail thresholds:** concrete, pre-committed numbers.
- **Pre-declared fallback (committed BEFORE results):** *investment-freeze on fail → silence-boundary
  fallback* (state it precisely so `verdict` can quote it verbatim).
- **OUT OF SCOPE (later passes):** event-replay, transport-sync, latency-compensation. Say so explicitly.
- Optionally author a `HARNESS-SPEC.md` describing the bespoke host, and freeze it too (G1B froze both).

### Step 2 — FREEZE (orchestrator-held, deterministic, non-LLM — YOU do this)
- Confirm no spike results exist yet (empty `g1a/_run/spike/` etc.).
- `sha256sum g1a/_run/PRE-REGISTRATION.md` (and HARNESS-SPEC.md if authored).
- Write `g1a/_run/FREEZE.txt` in the G1B format: frozen-by, frozen-at, locked artifacts + SHA-256, and
  the no-modify rule. This is your deterministic gate. Record it in the ledger.

### Step 3 — Invoke the shape (the actual G1A run)
```
orchestrate(
  task: "G1A narrow first pass. SPIKE GOAL: <one-line goal>. FROZEN PRE-REGISTRATION: path=g1a/_run/PRE-REGISTRATION.md sha256=<hash>. <+ HARNESS-SPEC path+hash if used>. Build the bespoke C++ Cmajor host spike strictly to the frozen spec; measure the pre-registered metrics; verify hash integrity + gate fidelity; emit FINAL PASS or the verbatim pre-declared fallback.",
  paradigm: "preregistered-concurrency-spike",
  executorModel: "claude-opus-4-8", executorProvider: "anthropic",   // Architect authors+measures the spike
  verifierModel: "deepseek-v4-pro", verifierProvider: "deepseek"      // V4-Pro certifies (generator != certifier)
)
```
- Generator≠certifier is satisfied: Opus implements/measures, V4-Pro verifies/aggregates.
- Narrate each phase. Require the shape's own `verify`/`verdict` evidence; do not hand-wave a PASS.

### Step 4 — Verdict handling + surface to Donald
- On **FINAL PASS:** record evidence; surface the concurrency proof + metrics to Donald.
- On **FINAL FAIL:** the verdict will quote the pre-declared fallback (investment-freeze → silence-boundary).
  Do NOT improvise a different outcome. Surface to Donald with the decisive reason.
- Write an `ATT_RUN_REPORT.md` in `g1a/_run/`. Update the ledger with the final role-integrity verdict.

## MODEL ROUTING SUMMARY
- SDK grounding/research subagent: DeepSeek **V4-Flash**.
- Pre-registration Architect subagent: **Opus**.
- Shape `executor` phases (implement, measure): **Opus** (`executorModel: claude-opus-4-8`, provider anthropic).
- Shape `verifier` phases (verify, verdict): DeepSeek **V4-Pro** (`verifierModel: deepseek-v4-pro`).

## ROLE INTEGRITY (load-bearing)
Stay ORCHESTRATOR. Do NOT write the C++ spike or the pre-registration yourself — route to subagents /
the shape. The ONE thing you do directly is the deterministic sha256 FREEZE (allowed orchestrator gate)
plus state/ledger/artifact writes. Do NOT silently substitute a different shape; if the shape fails,
retry its execution+verification ONCE, otherwise escalate (repair-only fallback). Maintain
`g1a/_run/ATT_ORCHESTRATOR_ROLE_LEDGER.md`. **Orchestrator self-handoff at 70% context** — if exceeded,
save state, schedule a continuation, start a new session, resume as orchestrator. Keep Telegram updated
at every phase transition. Git-safety: do not commit anything unless Donald explicitly asks.

## OPERATIONAL LESSON FROM DELIVERABLE 1 (avoid the reload trap)
Autonomous reload/new-session bridges fail if the message queue is congested. **Before any
`agent_reload_runtime` or `agent_new_session`, ensure the message queue is empty (no overlapping
scheduled wake-ups).** Schedule exactly ONE continuation 75–90s out, then trigger the bridge, then stop.
The continuation's FIRST action reads the relevant diagnostics file.
