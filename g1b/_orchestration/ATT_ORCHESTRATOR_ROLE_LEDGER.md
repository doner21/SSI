# G1B Orchestrator Role Integrity Ledger

**Run:** SSI-DAW G1B (salience discrimination falsifier — WoZ spike, no DSP)
**Opened:** 2026-06-30T00:54:58Z
**Requested shape/tool:** Build-phase orchestration per `SSI-DAW-BUILD-PLAN.md` §8 → G1B falsifier-first. Manual subagent orchestration driven by the visible session as ORCHESTRATOR.
**Current role of visible session:** ORCHESTRATOR (piNen seat). NOT executor, NOT author.

## Constitution carried forward (from BUILD-PLAN handoff)
- Generator ≠ certifier, cross-lab. Opus authors; **DeepSeek V4-Pro certifies**; (GPT-5.5 red-team not staffed until G2).
- Epistemic labels live on every artifact: [ARCH] / [PAPER] / [GATE].
- Pre-registration is locked BEFORE any results are seen. No p-hacking.
- Investment-freeze on G1B fail → pre-declared rescope (decision #5), not patch-and-extend.

## Seat assignments (G1B minimal team)
| Seat | Model | Status |
|---|---|---|
| Orchestrator | visible session (Opus 4.8, acting as piNen) | active |
| Architect / Planner | Opus 4.8 (subagent, isolated ctx) | — |
| Executor / Author | Opus 4.8 (subagent — architect-as-author at spike) | — |
| Verifier | DeepSeek V4-Pro (subagent) | — |
| Grounding | DeepSeek V4-Flash | not needed for G1B (no Cmajor) |

## Round log
| # | Phase | Seat | Model | Artifact(s) | Classification | Outcome |
|---|---|---|---|---|---|---|
| 0 | scaffold | Orchestrator | Opus 4.8 | run dirs, this ledger | orchestration support | done |
| 0b | correction | Orchestrator | — | this ledger | orchestration support | Donald flagged determinism. Switched build-time orchestration from manual hand-routed subagents → deterministic `orchestrate` harness (TS, isolated subprocesses, deterministic gate). Manual Architect subagent aborted. piNen (product TS orchestrator) confirmed deferred to Phase 2+ by investment-freeze; G1B builds no engine spine. G1B eval harness language = TypeScript (Node 24) to align with the TS spine. |

## Phase log
- **Phase 1 (lock-only)** via deterministic `orchestrate` harness — PASS. Run orc-mqzy27lj-jhel. Planner=Opus, Executor=Opus, Verifier=DeepSeek V4-Pro (routing evidence confirmed). Produced PRE-REGISTRATION.md (544 ln) + HARNESS-SPEC.md (573 ln). Verifier confirmed integrity crux: SSI CAN lose; baseline-iii genuinely strong; N=12 exact 2^12 permutation + Holm FWER. No results produced.
- **FREEZE** 2026-06-30T01:18Z: PRE-REGISTRATION.md sha256 afa823bc…, HARNESS-SPEC.md sha256 6dfd501e… recorded in FREEZE.txt. src/artifacts/data empty at freeze time.
- **Phase 2 (implement+run)** via `orchestrate` — run orc-mqzymizq-huhn. Phase PASS (experiment ran faithfully; verifier re-ran clean, determinism + hashes confirmed, nothing tuned). **G1B GATE OUTCOME = FAIL-MV**, and SSI lost the primary comparison to 4/5 baselines.
  - SSI composite 0.4581. Beat only silent-route2 (+0.258, p=0.008). LOST to generic-linter (-0.174), user-aware-linter (-0.171), LOO-classifier (-0.146), and its own EIG/VoI-ablation (-0.127).
  - SSI AQ=0.437 (BELOW chance 0.5), VoI=0.583, US=0.250. NC specificity mean 0.820.
  - G1B-MV: PPC p=0.9915 → factored independence REJECTED → MV-FORCE-COUPLE.
  - Two pre-registered falsifiers fired: (1) independence wrong (Blocker-6); (2) EIG/VoI not load-bearing — ablation beats SSI (C3-Finding-7) → **Open Decision #5 territory (Donald-owned)**.
- **Investment-freeze ENGAGED** per §9 Phase-1B fail rule: NO Phase-2+ Route-1-specific build proceeds. Honoring the freeze IS honoring the plan; "keep working" does not override a fired falsifier.
- **Phase 3 (diligence)**: cross-lab (V4-Pro) root-cause — is the negative a faithful falsification or a harness/spec artifact (esp. SSI below-chance AQ)? Read-only; locked files untouched. Then surface Decision #5 to Donald with complete picture.

## Direct orchestrator actions taken (must be orchestration-support only)
- Read plan; created run scaffolding; opened ledger; Telegram kickoff.
- NO main-task execution by the visible session.

## Determinism correction (Round 0b)
- TWO orchestrators disambiguated: (1) **piNen** = product runtime spine (constructors/gate/reload/IR/fossil store) → Phase-2+, NOT built in G1B. (2) **build-time orchestration** = the seat-running process → must be deterministic + state-owning → now the `orchestrate` harness, not the LLM.
- Orchestrator (visible session) holds only the inter-phase gate: freeze PRE-REGISTRATION before any results exist.
- Phase split to protect the pre-registration lock: Invocation-1 = spec+pre-reg only (no results); Invocation-2 = implement+run after freeze.

## Context checkpoints
- Open: orchestrator self-handoff rule fires at 70% context.

## Phase 3 (diligence) outcome
- Cross-lab root-cause (DeepSeek V4-Pro, agent pev-verifier) — **GENUINE-FALSIFICATION, conf 0.95**. No sign/threshold/label inversion; 5/5 convention checks pass. Below-chance AQ is faithful to 3 locked design elements (B=3 turn budget, S6 forced surfacing, EVSI silent-baseline def). Ablation-beats-SSI delta is clean → EIG/VoI net-negative. Artifact: artifacts/ROOT-CAUSE-V4PRO.md.
- Surfaced **DECISION-BRIEF-D5.md** to Donald: Option A (descope: A1 heuristic-Route-1 / A2 Route-2-only) vs Option B (one disciplined re-pre-registered redesign). Orchestrator recommendation: B (then re-evaluate). HELD at gate — did NOT silently pick. Telegram sent.

## Decision #5 outcome + G1B-v2 (Donald chose B)
- Donald chose **B**: one disciplined, re-pre-registered redesign. v1 artifacts remain LOCKED as attempt-1 record. v2 = new PRE-REGISTRATION-v2.md / HARNESS-SPEC-v2.md.
- Disciplined-redesign constraints: (1) sparse-pairwise coupling on SSI AND the ablation (MV remedy, clean isolation); (2) align SSI EVSI baseline to oracle pivotality def (or justify); (3) SSI gets SAME train-split theta calibration the linter gets (fairness symmetry, train-only, held-out wall absolute); (4) pre-register S6-forced-surfacing handling in AQ; (5) SAME generative world/oracle + SAME 5 baselines; (6) single pre-registered v2 seed, one run, no seed-shopping; (7) if SSI still loses ablation+linter -> DESCOPE, no further retries.
- Verifier mandate v2: falsify that the "fairness fixes" rig SSI; confirm calibration never touches held-out; confirm ablation also coupled; confirm baselines stay strong.

## Phase 4 (G1B-v2 lock) — infra abort + surgical repair
- `orchestrate` run orc-mr0791e5-qpre ABORTED: verifier (reviewer) subagent terminated mid-run (stopReason=error, errorMessage=terminated) — transient infrastructure failure, NOT a substantive verification fail. Planner + 4 executor passes ran correctly on Opus.
- Executor DID complete both v2 files: PRE-REGISTRATION-v2.md (113KB, full structure + CHANGES-FROM-v1 + ANTI-RIGGING-INVARIANTS), HARNESS-SPEC-v2.md (54KB). v1 locked hashes intact. No results produced.
- REPAIR (role-faithful): re-run ONLY the failed cross-lab verifier seat (DeepSeek V4-Pro) on the finished v2 files via a single subagent — the requested route, not a shape switch, not orchestrator self-execution. Pending verdict → then freeze v2 → Phase 5 (implement+run).

## Phase 4b (cross-lab audit) + FREEZE v2
- Replacement cross-lab verifier (DeepSeek V4-Pro subagent): **PASS-LOCK-READY, conf 0.98** on all six targets (A rigging / B oracle-leak / C held-out wall / D world-tampering / E SSI-can-still-lose / F scope-creep). Artifact: artifacts/ANTIRIG-AUDIT-V2-V4PRO.md.
- **FREEZE v2** 2026-06-30T05:52:40Z: PRE-REGISTRATION-v2.md sha256 c4042f91…, HARNESS-SPEC-v2.md sha256 706534f5… (FREEZE-v2.txt). SEED_MASTER v2 = 0x5551B_0002. v1 hashes still intact.
- **Phase 5 (implement+run v2)**: launching via `orchestrate`. Build under g1b/src-v2/, emit g1b/artifacts-v2/. FINAL authorized attempt: if SSI does not beat ablation AND user-aware linter under this fair test → DESCOPE per Decision #5, no further retries.

## Phase 5 (G1B-v2 implement+run) + FINAL OUTCOME
- `orchestrate` run orc-mr08dq37-dvhy — Phase PASS (ran faithfully; verifier confirmed determinism, all 4 locked hashes intact, ablation-coupling symmetry verified, no oracle leak, calibration train-only, nothing tuned).
- **G1B-v2 GATE = FAIL-MV, and the fair primary comparison is a clean DESCOPE.** SSI composite 0.183 — below EVERY non-silent baseline. SSI lost to coupled-ablation by -0.521 (p=1.0) and to user-aware-linter by -0.421. VoI=US=0 (SSI under-asks). MV failed again (coupled model also inadequate; hierarchical favored). Even if MV passed, FAIL-descope-D5 fires (ablation beats SSI).
- This was the FINAL authorized attempt (FREEZE-v2 no-further-retries). **Thesis FALSIFIED at the synthetic pilot, robustly, fair-audited (0.98). DESCOPE per Decision #5.**
- FINAL artifact: G1B-FINAL-VERDICT.md. Remaining sub-choice (A1 ship heuristic Route-1 / A2 Route-2-only) surfaced to Donald — NOT picked by orchestrator.

## Decision #5 — DESCOPE ACCEPTED (Donald, 2026-06-30)
- Donald reviewed the linter-vs-SSI analysis (g1b/G1B-LINTER-VS-SSI-ANALYSIS.md): baselines beat SSI on genuine useful-asking (US/VoI), SSI surfaced ZERO discretionary questions on held-out (≡ silent-route2); EVSI gate self-silences on novel consequences. Verdict accepted as real.
- **DECISION: accept the descope.** The registered EIG/VoI salience machinery is CUT from the v1 build. Route-1-specific freeze stands; engine/signal-stack freeze LIFTS for Route-1-independent parts. A1/A2 sub-choice deferred (low urgency; both lift the engine-track freeze).
- Next scope: NEXT-SCOPE-RECOMMENDATION.md + g1b/HANDOFF-NEXT.md. Central gate moves to G1A → G2/G3.

## REBOOT + AUTO-RESUME (2026-06-30)
- Donald requested a reboot (machine up a long time / slow). Prepared BEFORE reboot: handoff (HANDOFF-NEXT.md), Windows logon autostart (agent/pi-ssi-autostart.bat, copied to Startup folder) launching Pi in C:/Users/doner/ssi, and an agent_scheduler wake-up (~5 min) re-injecting the resume prompt. Resume depends on machine reaching the Windows desktop (auto-login or Donald login).

## POST-REBOOT RESUME (2026-06-30T09:27Z)

**Context:** Donald rebooted the machine (up long/slow). Auto-resume via `agent_scheduler` wake-up + Windows Startup (`agent/pi-ssi-autostart.bat`).

**State on resume:** G1B COMPLETE, Decision #5 descoPE accepted. HANDOFF-NEXT.md ready. This session resumed as ORCHESTRATOR.

**Actions taken (orchestrator-only, all routed to subagents):**
| # | Action | Subagent | Model | Classification | Outcome |
|---|---|---|---|---|---|
| 0 | Read HANDOFF-NEXT.md + ATT_ORCHESTRATOR_ROLE_LEDGER.md | — (orchestrator) | Opus 4.8 | orchestration support | context loaded |
| 1 | Confirm Telegram live (status: active, polling, owner) | — (orchestrator) | — | orchestration support | live, no takeover needed |
| 2 | Send Donald "back online" Telegram + flag D-A/D-B | — (orchestrator) | — | orchestration support | sent |
| 3 | **Cmajor license + host-viability decision brief** | ssidaw-research | DeepSeek V4-Pro | subagent (research) | `cmajor/CMAJOR-DECISION-BRIEF.md` (348 ln) |
| 4 | **G0 actor-lattice scope check** | researcher | Opus 4.8 | subagent (review) | `g0/G0-SCOPE-VERDICT.md` (131 ln) — CONDITIONAL PASS |
| 5 | **Cmajor grounding dossier** | researcher (V4-Flash override) | DeepSeek V4-Flash | subagent (grounding) | `cmajor/CMAJOR-GROUNDING-DOSSIER.md` (608 ln) |
| 6 | Save key findings to Engram memory (id=320) | — (orchestrator) | — | orchestration support | saved |

**Decisions (Donald-owned):**
- **D-A:** STILL PENDING. A1 (heuristic Route-1) vs A2 (Route-2-only). Orchestrator lean: A2. Low-urgency; does NOT block G1A.
- **D-B:** ✅ DECIDED 2026-06-30 — **bespoke C++ harness** (own real-time audio host over Cmajor's native C++ API; not JUCE plugin host, not cmaj standalone). Licensing puts zero constraint on host choice (GPLv3 obligations are distribution-gated; prototype is internal). This unblocks G1A.

**G1A route (next substantive run) — orchestration shape:**
- No *bespoke* build-time shape pre-assigned. Handoff assigns: deterministic `orchestrate` harness + cross-lab verifier; seat team = Architect(Opus) + V4-Pro certifier + V4-Flash grounding; pre-register 4 reload metrics + concurrency proof BEFORE results; investment-freeze on fail → silence-boundary fallback.
- Precedent (G1B): `orchestrate` plan-execute-verify, two-invocation freeze split (pre-reg → FREEZE by content-hash → implement+run), cross-lab. Proven.
- NEW vs G1B: G1A is a NATIVE C++ empirical spike (needs Cmajor C++ SDK + toolchain), not a self-contained TS experiment.
- OPEN: reuse G1B PEV+freeze shape, OR build a bespoke G1A native-spike shape (setup → pre-register-freeze → spike-build → concurrency-measure → diagnose → verdict) via shape-builder/paradigm-creator. Pending Donald.

**Context check:** 6.7% used at resume end — no self-handoff needed.

## Final role-integrity verdict (extended to include post-reboot)
- **PASS.** Visible session acted only as ORCHESTRATOR end-to-end: every plan/spec/code/run/diagnosis/audit routed to subagents via the deterministic `orchestrate` harness + cross-lab verifier subagents; the orchestrator authored NO spec, NO harness code, NO SSI logic. Held only: inter-phase pre-registration freezes (v1 + v2 by content-hash), the ledger, infra-failure diagnosis + role-faithful repair (re-ran failed verifier seat, did not self-execute or switch shape). Generator≠certifier preserved cross-lab throughout (Opus authored; DeepSeek V4-Pro certified/diagnosed/audited). Investment-freeze honored on both fired falsifiers. Donald-owned Decision #5 surfaced twice (initial + A1/A2 sub-choice), never pre-empted. No main-task work executed by the orchestrator. Bounded retries: exactly ONE authorized redesign, no goalpost-moving. The visible session acted only as ORCHESTRATOR throughout: routed planning/execution/verification/diagnosis to subagents via the deterministic `orchestrate` harness + cross-lab verifier; authored NO spec, NO harness code, NO SSI logic itself; held only the inter-phase pre-registration freeze and the ledger. Generator≠certifier preserved cross-lab (Opus authored; DeepSeek V4-Pro certified + diagnosed). Investment-freeze honored on the fired falsifier. Donald-owned Decision #5 surfaced, not pre-empted. No main-task work executed by the orchestrator.
