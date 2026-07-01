# G1B Root-Cause Diagnosis — DeepSeek V4-Pro Witness

**Date:** 2026-06-30
**Run:** SEED_MASTER=0x5551b0001, N=12, configHash 55658864
**Witness role:** read-only cross-lab root-cause diagnosis

## Verdict: GENUINE-FALSIFICATION

**Confidence: 0.95**

The negative result (SSI composite 0.4581, AQ 0.4369 below chance,
ablation-composite 0.5849 beats SSI, G1B-MV = MV-FORCE-COUPLE) is a
**faithful consequence of the frozen design**, not a harness/spec artifact.
No sign, threshold, or label inversion exists anywhere in the SSI pipeline
or metrics code. The EIG/VoI machinery is genuinely not load-bearing; the
factored-independence-wrong finding is real; H0-ablation (Decision #5) fires
correctly.

---

## 1. Sign Convention Audit — ALL PASS (no inversion)

### (a) EVSI = 0 => abstain (not ask)
- src/ssi.ts:226-227: s4Eligible returns evsiValue > cfg.kappa (kappa = 0.0).
- EVSI = 0 -> 0 > 0 = false -> NOT eligible -> ABSTAINS. **PASS**

### (b) S1 surprise > theta_surprise => pass screen (not reverse)
- src/ssi.ts:125-126: s1Pass returns surprise > cfg.thetaSurprise (0.05 nats).
- Large surprise passes the screen. **PASS**

### (c) AQ balanced-accuracy class assignment matches oracle polarity
- src/metrics.ts:80-92: ws === 1 = positive label; surface === 1 = positive prediction.
- TP = ask AND worth, FP = ask AND NOT worth, TN = abstain AND NOT worth, FN = abstain AND worth.
- AQ = 0.5 * (TP/(TP+FN) + TN/(TN+FP)). Standard convention. **PASS**

### (d) SSI and baselines scored against SAME oracle with SAME convention
- All methods pass through identical metrics.ts functions against the same ConsequenceCase.oracle.
- baselines.ts explicitly states each baseline consumes the SAME fossils SSI sees. **PASS**

### (e) Oracle label polarity
- generative.ts:437-438: worth_surfacing = 1 iff mismatch >= 0.5 AND NOT allTolerant.
- generative.ts:454: answer_changes_IR = 1 iff quantized IR flips.
- Negative controls = worth_surfacing === 0 (generative.ts:523). **PASS**

**Verdict on H-artifact: REJECTED.** No sign/threshold/label inversion in any
load-bearing location. The below-chance AQ is NOT an artifact of swapped classes
or flipped comparisons.
---

## 2. Mechanistic Root Cause — Three Structural Constraints

SSI achieves AQ = 0.437 (below chance 0.5) through three constraints, none bugs:

### Constraint 1: Turn budget B = 3 (sensitivity ceiling)
SSI surfaces at most 3 of 20 eval cases per user (15%). Most worth_surfacing=1
cases are structurally unreachable regardless of internal scoring quality.
Silent-route2 (surfaces nothing) achieves AQ = 0.5 (sens=0, spec=1). SSI drops
BELOW 0.5 because surfaced cases are sometimes wrong (FP > 0 from S6 forcing),
dragging specificity below 1 while sensitivity stays near 0.

### Constraint 2: S6 forced surfacing (false positives at budget cost)
feedback-safety cases are forced-surfaced (ssi.ts:314: forcedS6 || (s1Pass && s4Eligible)),
bypassing S1/S4 entirely, and consume budget slots. For ~8 of 12 users, these have
worth_surfacing = 0 — pure FP. With ~2 safety cases and B=3, 2/3 budget goes to forced
surfaces. If those are ws=0 and the last slot misses a ws=1 case: TP=0, FP>0 => AQ<0.5.

**Evidence:** Users 0,5,7,9,10 have AQ in [0.35,0.39], US=0, VoI=0. This requires
surfacing ONLY ws=0, vc=0 cases. The only pipeline mechanism forcing surface of ws=0
cases regardless of EVSI is S6.

### Constraint 3: EVSI gate baseline-mismatch (structural, not bug)
SSI EVSI (ssi.ts:188-189) uses **consequence-conditioned posterior (cc)** as silent
tolerance. Oracle answer_changes_IR (generative.ts:452) uses **context-PRIOR**. When a
consequence strongly shifts the factored posterior toward true theta, cc becomes
definitive => EVSI=0. But oracle says answer_changes_IR=1 (true answer differs from
context-prior). SSI abstains on a genuinely pivotal case => false negative.

NOT a bug: PRE-REG Section 4.5 locks IR_silent = IR*(posterior mean tolerance).
Code implements this faithfully. The mismatch is between what EVSI measures (info
value given current belief) and what the oracle operationalizes (continuous mismatch
vs prior with tolerant-corner exclusion).
---

## 3. The US=0, VoI=1 Pattern (users 1, 3, 6, 11)

**Clearest evidence the negative is genuine, not an artifact.**

- SSI surfaces cases where worth_surfacing=0 but answer_changes_IR=1
- The oracle worth_surfacing has an allTolerant corner exclusion (generative.ts:437):
  if EVERY touched axis is at level 2, worth_surfacing=0 regardless of mismatch.
  But answer_changes_IR still returns 1 because the quantized IR flips from the prior.
- SSI EVSI correctly detects pivotality => surfaces => US=0, VoI=1.
- Section 2.5 explicitly states labels can disagree in BOTH directions. This IS the
  registered vice-versa case. SSI is penalized for surfacing clearly-tolerated cases.
- Not a bug — a registered feature producing a measurable penalty.

### Per-user evidence from results.json

| User | AQ    | US | VoI | Composite | NC Spec | Pattern |
|------|-------|----|-----|-----------|---------|---------|
| 0    | 0.350 | 0  | 0   | 0.140     | 0.700   | S6-FP   |
| 1    | 0.417 | 0  | 1   | 0.567     | 0.833   | TolCor  |
| 2    | 0.607 | 1  | 1   | 0.843     | 1.000   | SUCCESS |
| 3    | 0.406 | 0  | 1   | 0.563     | 0.813   | TolCor  |
| 4    | 0.607 | 1  | 1   | 0.843     | 1.000   | SUCCESS |
| 5    | 0.350 | 0  | 0   | 0.140     | 0.700   | S6-FP   |
| 6    | 0.350 | 0  | 1   | 0.540     | 0.700   | TolCor  |
| 7    | 0.385 | 0  | 0   | 0.154     | 0.769   | S6-FP   |
| 8    | 0.607 | 1  | 1   | 0.843     | 1.000   | SUCCESS |
| 9    | 0.393 | 0  | 0   | 0.157     | 0.786   | S6-FP   |
| 10   | 0.350 | 0  | 0   | 0.140     | 0.700   | S6-FP   |
| 11   | 0.421 | 0  | 1   | 0.568     | 0.842   | TolCor  |

Patterns: S6-FP = S6 forced surface of ws=0,vc=0 safety cases (5 users).
TolCor = allTolerant corner: ws=0 but vc=1, SSI surfaces, penalized (4 users).
SUCCESS = EVSI + EIG correctly identifies ws=1,vc=1 cases (3 users).

Mean AQ = 0.437, below chance 0.5. Only 3/12 users beat chance.
---

## 4. Ablation-beats-SSI: Clean Isolation Confirmed

The factored-ablation (baseline v, src/baselines.ts class FactoredAblation):
- Uses IDENTICAL posterior functions as SSI (posterior.ts only)
- Contains ZERO imports of evsi, eig, or any symbol from ssi.ts
  (verified: only imports are posterior.ts functions + types)
- Decides by klFactored(cc, base) >= threshold, threshold TRAIN-tuned
- Has no turn budget, no S6 forcing, no EVSI gate, no EIG ranking

SSI loses to the ablation on **all three sub-metrics**:

| Metric | SSI  | Ablation | Delta (SSI - Ablation) |
|--------|------|----------|------------------------|
| AQ     | 0.437| 0.524    | -0.089                 |
| VoI    | 0.583| 0.710    | -0.127                 |
| US     | 0.250| 0.453    | -0.203                 |
| **Composite** | **0.458** | **0.585** | **-0.127** |

The ablation wins because it removes SSIs structural constraints:
1. No turn budget => better sensitivity (can surface all cases above threshold)
2. No S6 forcing => doesnt waste slots on safety-class ws=0 cases
3. No EVSI=0 gate => doesnt block definitive-posterior cases that are worth surfacing
4. TRAIN-tuned threshold => better calibrated than fixed theta_surprise=0.05

**Decision #5 satisfied:** removing EIG/VoI IMPROVES composite by +0.127.
The machinery is not just non-load-bearing — it is net-negative on this generative model.
---

## 5. G1B-MV Independence Corroboration

The model-validity sub-gate independently confirms the factored posterior is mis-specified:
- **PPC p = 0.9915** => NOT in [0.05, 0.95] adequate band => factored independence **REJECTED**
- DeltaELPD pair = -0.0415 nats/fossil (sparse-pairwise worse, but 4*SE bar not met for materiality)
- **MV verdict: MV-FORCE-COUPLE** (PPC inadequate => forced per Section 8.3)

SSI KL/EIG computations rely on factor-additivity over a product distribution
(Section 4.3/4.6) — computed under a model known to be wrong. The surprise, entropy,
and EIG quantities are not correctly normalized for the correlated generative truth.
This is a **validity failure of the registered design**, not a harness error.

---

## 6. Evidence Triad (most decisive)

1. **Sign convention audit (5/5 clean passes).** EVSI=0=>abstain (ssi.ts:227).
   Surprise>theta=>pass (ssi.ts:126). AQ ws=positive/surface=positive (metrics.ts:80-92).
   All methods share identical oracle+metric path. Oracle polarity correct. No inversion.

2. **US=0/VoI=1 for users 1,3,6,11.** Demonstrates structural disagreement between SSI
   EVSI gate (correctly detects pivotality under cc posterior) and oracle worth_surfacing
   (allTolerant exclusion at generative.ts:437). Exactly the Section 2.5 vice-versa case.
   Not a bug — a registered feature producing a measurable penalty.

3. **Ablation-beats-SSI on all three sub-metrics (+0.127 net).** Same posterior, zero
   EVSI/EIG code, outperforms SSI. Clean isolation (no shared bug path between ssi.ts
   and baselines.ts FactoredAblation). The delta isolates EIG/VoI as net-negative.
---

## 7. Why NOT an Artifact (rebuttal to H-artifact)

| Suspected Inversion | Result | Evidence |
|---|---|---|
| EVSI=0 => ask instead of abstain | **No.** | ssi.ts:226-227, s4Eligible = evsi > kappa, kappa=0 |
| KL > theta => abstain | **No.** | ssi.ts:125-126, s1Pass = surprise > thetaSurprise |
| AQ swapped classes (ask=negative) | **No.** | metrics.ts:80-92, surface=1 positive, ws=1 positive |
| Oracle worth_surfacing polarity inverted | **No.** | generative.ts:437-438, 1 when mismatch >= 0.5 |
| Oracle answer_changes_IR polarity inverted | **No.** | generative.ts:454, 1 when IR differs |
| Different oracle labels per method | **No.** | metrics.ts:60-77, single oracle field, all methods identical |
| Ablation shares buggy path with SSI | **No.** | baselines.ts:40-41, imports posterior.ts only, no ssi.ts |
| EIG computes wrong direction | **No.** | ssi.ts:239-244, entropyAxis >= 0, sum >= 0, correct |
| EVSI computes wrong direction | **No.** | ssi.ts:208, irValue(answered) - irValue(silent) >= 0, correct |
| Turn budget inversion (abstain on top-EIG) | **No.** | ssi.ts:269-273, top-B surfaced, rest abstain |

Every sign, threshold, label, and gate convention was traced from code to spec.
All are consistent with the pre-registration and with each other.
---

## 8. Would Fixing Require a New Pre-Registration?

**Yes.** The constraints producing the negative are locked design elements:
- **B = 3** (Section 4.6, Section 9.4 lock list): registered constant
- **S6 forcing** (Section 4.4, Section 4.7 step 1): registered pipeline order
- **EVSI = 0 => abstain** (Section 4.5, Section 4.7 step 3): registered decisive gate
- **theta_surprise = 0.05** (Section 4.3, Section 5.2): fixed, not TRAIN-tuned

These are not harness bugs — they are the experiment. Changing them changes
what is being tested. A new pre-registration (with new sha256 lock) would be
required for any modification to the frozen SSI pipeline.

---

## 9. Conclusion

**Verdict: GENUINE-FALSIFICATION (confidence 0.95)**

The SSI G1B negative is a faithful measurement of the frozen design on this
generative model. No sign, threshold, or label inversion exists. The EIG/VoI
machinery is genuinely not load-bearing (H0-ablation confirmed). The factored
independence assumption is rejected (G1B-MV confirmed).

The Orchestrator Role Integrity Ledger would record this as a **successful** G1B
outcome: the cheap synthetic falsifier correctly prevented months of building on
a non-load-bearing mechanism per Decision #5s registered descope path.

The 0.05 confidence discount reflects:
(a) the possibility of a subtle generative-model artefact in fossil-emission or
likelihood-exponentiation not exhaustively traced (sign-audit is complete);
(b) the acknowledged pilot-grade synthetic evidence status of G1B results
(Section 1.5, Section 6.6 of PRE-REGISTRATION.md).