# G1B → Open Decision #5 — Decision Brief for Donald

**Status:** G1B falsifier FIRED. Investment-freeze ENGAGED. This is a Donald-owned decision (plan §11 #5: *"the team surfaces the tradeoff, never silently picks"*). Nothing past the freeze has been built.

**Epistemic weight:** [GATE] result, **pilot-grade SYNTHETIC** (N=12, synthetic oracle). It does NOT establish the human claim (that is G5, N≥24 real musicians). It DOES, per the plan's own pre-registered rules, fire the freeze and this decision.

---

## 1. What the falsifier found (faithfully, cross-lab confirmed)

- SSI beat **only** the trivial silent-Route-2 baseline (+0.258, p=0.008).
- SSI **lost** to: generic linter (−0.174), **user-aware linter** (−0.171), LOO classifier (−0.146), and **its own EIG/VoI-ablation** (−0.127).
- SSI abstention quality **0.437 — below chance (0.5)**. Usefulness 0.250. VoI 0.583.
- Model-validity gate **failed**: factored-independence rejected (PPC p=0.9915) → MV-FORCE-COUPLE.
- Cross-lab (DeepSeek V4-Pro) root-cause: **GENUINE-FALSIFICATION, conf 0.95.** No inversion bug. The ablation (no EIG/VoI) beating SSI is a *clean* isolation: the machinery is net-negative here.

**Two pre-registered falsifiers fired together:** (1) factored independence is wrong (Blocker-6); (2) the EIG/VoI machinery is not load-bearing (C3-Finding-7) → **Decision #5**.

---

## 2. The honest caveat that keeps the door open

Part of SSI's loss is **structural to the frozen formulation**, not necessarily to the EIG/VoI *idea*:
- **EVSI baseline mismatch** — SSI's VoI uses the cc-posterior as its silent baseline; the oracle's "answer changes IR" uses the context-prior. When the posterior is already definitive, SSI scores EVSI=0 and abstains on genuinely pivotal cases. (Registered as §4.5 — so locked, but arguably a mis-specification, not a law of nature.)
- **No threshold calibration** — SSI's θ_surprise/κ were frozen blind, while the user-aware linter was allowed to fit the train split. The plan itself (Phase 5) says θ_surprise is *meant* to be tuned from data. The asymmetry may be unfair.
- **S6 forced surfacings scored as false positives** in AQ — safety surfacing is mandated, yet it's penalized as an abstention error, dragging AQ below chance.

None of these were p-hacks (all locked pre-results). But they mean the result reads as *"SSI-as-frozen-in-this-pre-registration loses,"* not *"no EIG/VoI machinery can win."*

---

## 3. The decision (yours — it hinges on your appetite for the distinctive claim)

### Option A — Accept the falsification now, descope per Decision #5
Pick a v1 Route-1 target:
- **A1:** ship the **user-aware heuristic Route 1** (it won here — cheap, "good enough", but NOT the SSI-distinctive claim), or
- **A2:** **Route-2-only** (most honest, least ambitious; Route 1 becomes experimental).
Retract the "computed belief shift" claim. Lift the freeze for the signal/engine stack on the parts independent of Route 1.
- *Best if:* you want maximum honesty/speed and are willing to let the cheap pilot kill the distinctive thesis.

### Option B — Authorize ONE disciplined, re-pre-registered redesign (G1B-v2) before deciding the descope
A single, locked, one-shot retry that fixes the *fairness/spec* issues — NOT a tweak-until-pass:
- add sparse-pairwise coupling (the MV-FORCE-COUPLE remedy), applied to SSI **and** the ablation;
- align SSI's EVSI baseline to the oracle's pivotality definition (or justify);
- give SSI the **same** train-split θ-calibration the linter gets (fairness symmetry);
- pre-register whether S6-forced surfacings are excluded from AQ;
- keep all 5 baselines + the ablation; **if SSI still fails to beat the ablation AND the user-aware linter → accept the falsification and descope, no further retries.**
- *Best if:* you want to separate "the thesis is wrong" from "the first formulation was unfair" before killing the distinctive claim. Cost: ~1 more synthetic cycle (cheap). Risk: goalpost-moving — controlled by the one-shot, ablation-must-be-beaten rule.

---

## 4. Orchestrator recommendation (advisory; you decide)

**Option B — one disciplined redesign — then re-evaluate.** Reasoning: the falsification is real but partly an artifact of a *frozen, uncalibrated, possibly-unfair* formulation; the diagnosis isolates genuine fairness gaps that a single principled re-pre-registration can close cheaply. If SSI still loses to the ablation under a *fair* test, that is a far stronger, harder-to-argue descope signal than the current run — and Option A becomes the clear, well-earned call. If you have low appetite for defending the distinctive claim, **A2 (Route-2-only)** is the honest, fast alternative and I will not argue against it.

I am holding at this gate. Tell me **A1**, **A2**, or **B** (or redirect) and I proceed.
