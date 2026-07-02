# HANDOFF — G1A "A ≠ B" (next scope of work)

**Created:** 2026-07-01 by the outgoing session (context growing). **For:** the fresh session.
**Your role:** ORCHESTRATOR. Do NOT write C++ or run the experiment yourself. Author + freeze the
pre-registration(s), route the work through the two shapes, aggregate results. (AGENTS.md role-integrity
policy applies: no direct main-task execution; repair-only fallback; produce a role-integrity ledger.)

---

## FIRST ACTION (do this before anything else)

Read `agent/agent-new-session-diagnostics.json`. Confirm `newSessionConfirmed: true` and `phase: "done"`.
- If `newSessionSilentlyFailed: true` or `executeCommandRejected: true` with no confirmation → the session
  switch did NOT happen; tell Donald to run `/agent-new-session` manually.
- `confirmedBy: "session_shutdown:new"` = authoritative success.

Then `mem_search` Engram for topic_key `g1a-event-replay-spike` to reload the full validated chain.

---

## The task: G1A A ≠ B — live-swap to a genuinely DIFFERENT DSP

Everything validated so far swapped the SAME patch (FreqSine → FreqSine), proving the swap MECHANISM.
This run tests the real SSI case: the agent regenerates *structurally different* Cmajor and it's swapped
in live while playing.

- **A** = the corrected FreqSine (sine) from the canonical baseline.
- **B** = a genuinely different DSP with its OWN input-endpoint schema. Suggested B: a **2-operator FM
  voice** or a **detuned dual-saw**. It must be a real Cmajor `processor` that compiles against
  `CmajPerformer.dll v1.0.3159`, amplitude 0.25, with at least a frequency-like input.

### What is already won (do NOT re-litigate — it's proven + committed)

- Bridge validated end-to-end for same-patch swap (R1–R4 PASS, dual-shape, dual-verifier).
- **Canonical baseline** at `g1a/_canonical-baseline/spike/` — corrected patch (`sin(phase)`), warm-up
  normalization (`W_WARM=1`), Variant-F no-reset continuation at K_SWAP, oracle-cursor fix, gate-fidelity
  fixes. Lock hashes in `g1a/_canonical-baseline/CANONICAL-LOCK.md`. **Copy sources from here**, not from
  the frozen `_run-*` evidence dirs.
- Git: local commit `2473998` on `main`, NOT pushed. Do not push unless Donald asks.

### What is genuinely NEW in A≠B (design the pre-registration around this)

1. **No bit-exact A↔B oracle.** The crossfade is now a real timbral morph, not a phase match. So:
   - Retire `maxerr_B_xfade == 0` (only meaningful when A and B are the same signal).
   - Post-swap correctness becomes **`maxerr_reload_B == 0` vs a reference render of B's OWN patch**
     (B compared to itself, not to A).
   - Crossfade gate becomes **equal-power continuity / no-click**: `click_max <= 0.05` across the
     morph (use the corrected click definition; B's own patch must also be click-clean in a solo render,
     i.e. add a P0-style B-solo sanity check so you don't inherit another toy-patch bug).
2. **Parameter carry-across when schemas differ.** B may not accept A's `freq` event. Pre-register the
   explicit mapping (e.g. B's fundamental-frequency input latched to the current frequency at swap;
   B's other inputs take declared defaults). This is the crux of "regenerate into something new."
3. **Warm-up normalization** still applies to B's own phase; A–B phase alignment is undefined for
   different waveforms, so measure the click fresh.
4. **Keep** R1 (prepare non-disruption), R2 (atomic swap safety + ASan + A released), R4 (determinism,
   5/5 SHA-256). These are DSP-agnostic and must still hold.

---

## Orchestrator workflow

1. Create run dirs: `g1a/_run-a-not-b/shapeA-preregistered/` and `.../shapeB-dualplan/` (separate cwds —
   both rebuild the same source base, must not collide).
2. Author `g1a/_run-a-not-b/PRE-REGISTRATION-A-NOT-B.md`: hypotheses; the exact B patch source; the
   param-mapping; LOCKED params (inherit the canonical ones + W_WARM=1); gates (R1, R2, R3' with
   B-vs-B `maxerr_reload_B==0` + `click_max<=0.05` + B-solo click sanity, R4); verdict rule; pre-declared
   fallback (e.g. if the different-DSP crossfade can't be click-clean → silence-boundary / per-block
   re-statement bridge for A≠B). Freeze it: `sha256sum PRE-REGISTRATION-A-NOT-B.md | tee FREEZE-A-NOT-B.txt`.
3. **Shape 1 — preregistered-concurrency-spike**, cwd `shapeA-preregistered`:
   executorProvider `anthropic` / executorModel `claude-opus-4-8`; verifierProvider `deepseek` /
   verifierModel `deepseek-v4-pro`; executorFallbackProvider `deepseek` / executorFallbackModel
   `deepseek-v4-pro`. Pass the frozen pre-reg path + SHA in the task.
4. **Shape 2 — dual-plan-synthesis-execute-verify**, cwd `shapeB-dualplan`:
   executorProvider `deepseek` / executorModel `deepseek-v4-pro`; verifierProvider `openai-codex` /
   verifierModel `gpt-5.5`; executorFallbackProvider `anthropic` / executorFallbackModel
   `claude-opus-4-8`. Run AFTER Shape 1 (sequential; separate cwds).
5. After each shape: `mem_save` to Engram, topic_key `g1a-event-replay-spike`.
6. Present results + decision to Donald. If orchestrator context exceeds 70%, self-handoff again
   (write handoff → schedule wake-up → agent_new_session → stop).

## Proven routing note

Both shapes are already built + canary-passed. The preregistered-concurrency-spike freeze is an
orchestrator-held sha256 gate (author + freeze BEFORE invoking the shape; pass path + hash in the task).

## Pointers

- Prior pre-regs (frozen evidence, examples of the format): `_run-boundary-click/PRE-REGISTRATION-BOUNDARY-CLICK.md`,
  `_run-patchfix-confirm/PRE-REGISTRATION-PATCHFIX.md`.
- Canonical patch to fork A from: `g1a/_canonical-baseline/spike/patches.h`.
- Cmajor API/syntax reference: `research-dossier-cmajor-input-api.md`, `cmajor-docs-dir.md` (repo root).
