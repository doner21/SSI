# G1A RELOAD-BRIDGE PASS — RUN THROUGH THE BESPOKE SHAPE (self-handoff, fresh context)

**You are the ORCHESTRATOR (piNen seat).** Fresh session. The narrow first pass (can two live Cmajor
performers run concurrently + be mixed at all) is **DONE — FINAL PASS** (see `g1a/_run/ATT_RUN_REPORT.md`).
Your job now: **RUN the G1A RELOAD-BRIDGE pass** through the bespoke `preregistered-concurrency-spike`
shape. Do NOT execute the C++ spike or author the pre-registration yourself — route everything. Stay
ORCHESTRATOR throughout.

**STANDING INSTRUCTION FROM DONALD (load-bearing):** *Always start with a NEW CONTEXT WINDOW after
every one run.* This handoff itself is the result of that rule. At the END of this reload-bridge run
(after Step 4), you MUST self-handoff again: write a short next-step note, schedule ONE continuation,
`agent_new_session`, stop — so the next run (or the surfacing of results) also begins fresh. Each
orchestrate/shape execution = one "run" = followed by a fresh context.

## FIRST ACTIONS (strict order)
1. **Read `agent/agent-new-session-diagnostics.json`.** If `phase=done` & `newSessionConfirmed=true` →
   proceed. If `newSessionSilentlyFailed=true` → tell Donald to run `/agent-new-session` manually, then
   continue best-effort.
2. **Confirm Telegram:** `telegram_pi status`; `takeover` if not owner; message Donald: "G1A reload-bridge
   run online — pre-registering + freezing the reload-bridge spec, then running it through the shape."
3. **Read this file fully.** Then read as context (do NOT re-derive): `g1a/_run/ATT_RUN_REPORT.md` (the
   passed first pass), `g1a/_run/SDK-GROUNDING.md` + `g1a/_run/SMOKE-TEST-REPORT.md` (toolchain already
   set up), and `orchestration-artifacts/SSI-DAW-BUILD-PLAN.md` §1.2 mechanism #1 (regenerate-and-reload)
   + §1.3 (reload-bridge viability is the load-bearing engine claim).

## DECIDED (do NOT relitigate)
- **D-B DECIDED:** bespoke C++ harness over Cmajor native C++ API. **Concurrency already PROVEN** (first pass FINAL PASS).
- **The shape is built + usable:** `preregistered-concurrency-spike`, lifecycle `canary_passed`. Do NOT rebuild it.
- **Toolchain already set up** (reuse from `g1a/_run/`): SDK headers at `g1a/_run/cmajor-headers/include/`;
  runtime DLL `g1a/_run/CmajPerformer.dll` v1.0.3159; MSVC cl 19.50 via VS18 BuildTools vcvars64.bat;
  C++17, `/DCMAJOR_DLL=1`. ASan available; **TSan NOT available on Windows** (only ASan + deterministic stress).

## THE FALSIFIABLE QUESTION (this pass)
*Can a LIVE Cmajor performer be replaced by a freshly **background-JIT-compiled** performer (a new patch),
swapped into the running audio thread via a lock-free/atomic handoff, and **crossfaded** A→B while live,
with NO xrun, NO audible discontinuity (click-free), correct crossfade math, safe release of the old
performer, ASan-clean, and bit-exact determinism?* This is the **regenerate-and-reload bridge** —
build-plan load-bearing mechanism #1. The first pass proved two performers can coexist; this pass proves
one can be **hot-swapped for a regenerated one without a glitch.**

## THE ROUTE (route each step; orchestrator coordinates only)

### Step 0 — Run dir (orchestrator, deterministic)
- Create a SEPARATE run dir `C:/Users/doner/SSI/g1a/_run-reload/` with `spike/` and a fresh
  `ATT_ORCHESTRATOR_ROLE_LEDGER.md`. Reuse the SDK headers + DLL from `g1a/_run/` by absolute path
  (do NOT re-fetch — the SDK is already proven). A quick grounding subagent (DeepSeek **V4-Flash**) MAY
  confirm the Cmajor background-compile / hot-reload entry points (e.g. `cmaj::Patch` async build, or a
  second `Engine::createPerformer` background-compiled then atomically swapped) and the safe-release
  semantics of `cmaj::Performer` (ref-counted), writing a short `RELOAD-GROUNDING.md` — only if needed.

### Step 1 — Pre-registration authoring (route to Architect = Opus, agent `ssidaw-planner`, model `claude-opus-4-8`)
Author `g1a/_run-reload/PRE-REGISTRATION.md` + `g1a/_run-reload/HARNESS-SPEC.md` for the reload-bridge,
mirroring the structure of `g1a/_run/PRE-REGISTRATION.md`. Windows-feasible metrics only (ASan, no TSan).
Suggested metric scope (Architect locks exact estimators + thresholds — NO results in the docs):
- **R1 background-compile non-disruption:** new patch JIT-compiles on a NON-RT thread while performer A is
  live and advancing — A suffers **zero xruns** during the compile window; compile completes; `Result==Ok`.
- **R2 atomic/lock-free swap safety:** the RT thread switches A→B at a pre-committed block boundary via a
  `std::atomic`/lock-free handoff — no torn read, no use-after-free, **ASan-clean**, old performer released
  only after the crossfade completes (ref-count safe).
- **R3 click-free crossfade correctness:** over an N-block crossfade window, output == (1−α)·A + α·B within
  ε, α monotone 0→1; **no discontinuity** (max |sample[k]−sample[k−1]| bounded below a pre-committed click
  threshold); both A and B signals present at the right ratios at window endpoints.
- **R4 determinism + completeness:** bit-exact output across R seeded repeats; swap occurs at the locked
  block; total blocks rendered as specified; no dropped/duplicated blocks across the boundary.
- **Concurrency/reload-PROOF artifact:** trace.log + WAV dumps (A_pre, B_post, crossfade_region, full_output)
  + machine-checkable metrics.json.
- **Pre-declared fallback (verbatim, committed BEFORE results):** *investment-freeze on fail →
  **silence-boundary reload** fallback* — i.e. if the live crossfade swap fails, ship the reload model
  proven in pass 1: stop performer A to digital silence at the boundary, then start performer B (NO live
  crossfade), until the reload bridge is proven on a TSan-capable platform. State precisely so `verdict`
  can quote it verbatim.
- **OUT OF SCOPE (later passes):** event-replay across reload, transport-sync, latency-compensation,
  multi-authority, full TSan/Linux certification. Say so explicitly.

### Step 2 — FREEZE (orchestrator-held, deterministic, non-LLM — YOU do this)
- Confirm `g1a/_run-reload/spike/` is empty (no results yet).
- `sha256sum g1a/_run-reload/PRE-REGISTRATION.md g1a/_run-reload/HARNESS-SPEC.md`.
- Write `g1a/_run-reload/FREEZE.txt` (G1B/first-pass format): frozen-by, frozen-at, locked artifacts +
  SHA-256, no-modify rule. Record in ledger.

### Step 3 — Invoke the shape
```
orchestrate(
  task: "G1A RELOAD-BRIDGE pass. SPIKE GOAL: hot-swap a live Cmajor performer with a freshly background-JIT-compiled performer via a lock-free/atomic handoff, crossfaded click-free, in the bespoke C++ host. FROZEN PRE-REGISTRATION: path=g1a/_run-reload/PRE-REGISTRATION.md sha256=<hash> + HARNESS-SPEC path=g1a/_run-reload/HARNESS-SPEC.md sha256=<hash>. Reuse SDK headers g1a/_run/cmajor-headers/include and DLL g1a/_run/CmajPerformer.dll. Build strictly to the frozen spec; measure the pre-registered metrics; verify hash integrity + gate fidelity; emit FINAL PASS or the verbatim pre-declared fallback. Write all spike artifacts under g1a/_run-reload/spike/.",
  paradigm: "preregistered-concurrency-spike",
  cwd: "C:/Users/doner/SSI",
  executorModel: "claude-opus-4-8", executorProvider: "anthropic",
  verifierModel: "deepseek-v4-pro", verifierProvider: "deepseek"
)
```
- Generator≠certifier: Opus implements/measures, V4-Pro verifies/aggregates. Narrate each phase; require the shape's own verify/verdict evidence.

### Step 4 — Verdict + surface, THEN fresh-context handoff
- On FINAL PASS: record evidence; write `g1a/_run-reload/ATT_RUN_REPORT.md`; surface the reload-bridge proof to Donald.
- On FINAL FAIL: the verdict quotes the verbatim fallback (investment-freeze → silence-boundary reload). Do NOT improvise. Surface with the decisive reason.
- Update the ledger with the final role-integrity verdict.
- **Then honor the standing instruction:** ensure the message queue is empty, schedule ONE continuation
  (~80s) that resumes as ORCHESTRATOR to surface/decide the next pass, `agent_new_session`, stop.

## ROLE INTEGRITY (load-bearing)
Stay ORCHESTRATOR. Do NOT write the C++ reload harness or the pre-registration yourself — route to
subagents / the shape. The ONE direct technical action is the deterministic sha256 FREEZE. Maintain
`g1a/_run-reload/ATT_ORCHESTRATOR_ROLE_LEDGER.md`. Do NOT silently substitute a different shape; if the
shape fails to RUN (not the spike failing — the spike legitimately FAILing is a valid PASS-of-process
outcome), retry its execution ONCE then escalate (repair-only fallback). **Self-handoff at 70% context.**
Keep Telegram updated at every phase transition. Git-safety: do not commit unless Donald explicitly asks.

## OPERATIONAL LESSON (avoid the reload trap)
Before any `agent_new_session`, ensure the message queue is empty (no overlapping scheduled wake-ups).
Schedule exactly ONE continuation 75–90s out, then trigger the bridge, then stop. The continuation's
FIRST action reads `agent/agent-new-session-diagnostics.json`.
