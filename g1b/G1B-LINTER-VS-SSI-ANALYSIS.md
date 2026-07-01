# G1B-v2 — What exactly did the baselines beat SSI on? (Donald's question)

## The decisive fact
On the held-out set, **SSI surfaced zero discretionary questions.** Per-user, SSI's discretionary triple is *identical to silent-Route-2* for all 12 users (AQ at the always-abstain floor 0.5 — or 0.25 on all-positive users; US=0; VoI=0; composite ≡ silent-route2). SSI's only non-silent behavior was the mandatory S6 safety surfacings (MS>0), which are excluded from the gated composite. **The salience engine produced no questions on novel consequences.**

## Q1 — Useful/economical asking, or label-matching?
**Useful asking, decisively — not label-matching.** The losing margins are on **US** (precision of asked questions vs `worth_surfacing`) and **VoI** (precision of asked questions vs `answer_changes_IR`), the two asking-precision metrics. On **AQ** (the balanced-accuracy "label-match" axis) SSI is only ~0.05–0.13 behind the baselines — close. The blow-out is on US/VoI, and only because SSI asked nothing (registered null = 0).

The coupled-ablation (SSI's *exact* coupled posterior, minus the EVSI/EIG gate) asked questions that were genuinely pivotal: **VoI = 1.0 for 8 of 12 users** (≥0.5 for all 12), mean US ≈ 0.56. So real IR-changing value existed in the held-out set, and a simple surprise threshold captured it. VoI=1 means the surfaced consequence genuinely flips the chosen IR under the oracle — that is captured *useful asking*, not classifier label-matching.

## Q2 — Were both sides built to strength?
- **Baselines: yes.** The ablation works well (VoI=1, composite up to 1.0); the user-aware linter and LOO classifier ask and score in the 0.5–0.9 range.
- **SSI: built to the *registered* spec, but that spec yields a *degenerate* SSI on held-out.** SSI follows the plan's literal §5.7 rule "EVSI = 0 ⇒ no question," with θ*/κ* calibrated on TRAIN. Note the train/test gap: at its calibrated operating point SSI scored **0.743 on TRAIN** (it *did* ask there) but **collapsed to zero asks on held-out families**. So it is not a dead implementation — it is a **generalization failure**.

## The mechanism (the real finding)
SSI's EVSI/VoI gate only fires when SSI can correctly model a consequence's *pivotality* (whether the user's answer would change the IR vs the context-prior). On **held-out consequence families SSI never saw**, its likelihood model is uninformative → the consequence doesn't move the posterior → aligned-EVSI ≈ 0 everywhere → SSI abstains on everything. The ablation asks on raw Bayesian **surprise**, which still fires on novel consequences, so it generalizes and wins. **The EIG/VoI machinery is not merely non-load-bearing; under distribution shift it is self-silencing — exactly where salience most needs to generalize.**

## Verdict on the binary (Decision #5 for real, or measured the wrong thing?)
**Closer to Decision #5 firing for real.** The metric is sound (the ablation proves the value was real and capturable; SSI failed to capture it), and the loss is on genuine useful-asking, not a label-matching artifact. What is *robustly* falsified is the **registered** "EVSI=0 ⇒ abstain" initiation rule — brittle and net-negative vs a surprise threshold, twice, fair-audited.

**The legitimate caveat on your side:** the failure is an *extreme, specific* brittleness (hard EVSI gate + no surprise fallback on unseen families). A **steelman** SSI — soft VoI weighting, or surprise-fallback when EVSI is uninformative on novel consequences — was **not** tested. The result does not prove "no VoI-guided design could help"; it proves *this* one self-silences. Testing the steelman would be a deliberate exception to the "no further retries" rule.

## Two clean options if you don't consider it settled
- **(a) Accept it:** the registered VoI machinery is brittle/net-negative → descope per Decision #5.
- **(b) Sharpen first:** a read-only cross-lab diagnostic to confirm the mechanism (trace held-out EVSI values — faithful flat-likelihood generalization failure vs over-hard gate), and/or ONE narrowly-scoped steelman test (soft/fallback VoI) under the same "descope-if-it-loses" discipline — explicitly breaking the no-retry rule, your call.
