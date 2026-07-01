# G1B-v2 CROSS-LAB ANTI-RIGGING AUDIT

**Auditor:** DeepSeek V4-Pro (Witness, read-only)
**Audited artifact:** `PRE-REGISTRATION-v2.md` + `HARNESS-SPEC-v2.md`
**Baseline for comparison:** `PRE-REGISTRATION.md` (v1 locked design, sha256 `afa823bc`)
**Date:** 2026-06-30
**Verdict:** **PASS-LOCK-READY**
**Confidence: 0.98**

---

## Executive Summary

The v2 re-pre-registration is the ONE authorized disciplined redesign (DECISION-BRIEF-D5 Option B) after G1B-v1 fired its falsifier (FAIL-MV + SSI lost 4/5 baselines). This audit independently verifies all six FALSIFICATION TARGETS (A-F) using direct evidence from the locked documents. **Every target PASSES.** The four permitted changes are principled corrections of genuine mis-specifications diagnosed in `ROOT-CAUSE-V4PRO.md`. None rigs the outcome for SSI; each is symmetric or cuts both ways; SSI remains structurally falsifiable. No scope creep is detected. The v2 redesign is **fair, symmetric, and audit-clean** -- ready for lock and execution.

---

## PER-TARGET FINDINGS

### TARGET A: RIGGING

#### A(i): Does baseline (v) ablation receive the IDENTICAL sparse-pairwise coupling as SSI?

**Finding: PASS (confidence 0.99)**

Evidence from PRE-REG-v2 Section 3.5: the full Section 4.1 sparse-pairwise-coupled, context-conditioned posterior -- identical to SSI's belief model -- but initiation is decided by a threshold on the coupled posterior / Bayesian surprise alone, with the EIG/VoI machinery removed. Section 3.5 [ARCH]: baseline (v) consumes the same coupled posterior functions as SSI (the Section 4.1 coupling lives in the shared belief module) but imports no EVSI/EIG symbol from SSI's salience module. HARNESS-SPEC-v2 Section 1: posterior.ts is shared by SSI and ablation (v). HARNESS-SPEC-v2 Section 9: makeCoupledAblation must call the identical posterior.ts belief functions SSI uses and decide via a surprise threshold tuned on TRAIN only, with no call into any EVSI/EIG function. HARNESS-SPEC-v2 Section 16: static import-graph test asserts baselines.ts references no EVSI/EIG symbol from ssi.ts. Section 3.6: It remains structurally possible for SSI to LOSE: baseline (v) (now equally coupled) can still tie/beat SSI if EIG/VoI is non-load-bearing.

**Analysis:** The coupling is applied IDENTICALLY to both SSI and baseline (v). The SSI-ablation delta isolates ONLY EIG/VoI on a common, MV-remedied belief model. The ablation's import-cleanliness is enforced by a static import-graph test. No asymmetry. PASS.

#### A(ii): Does baseline (iii) the user-aware linter retain its train-split fit and full strength?

**Finding: PASS (confidence 0.99)**

Evidence: PRE-REG-v1 Section 3.3 defined baseline (iii) with features and thresholds fit on the training split to the best achievable heuristic. PRE-REG-v2 Section 3.3 carries this VERBATIM from v1. The v2 note adds only that SSI now receives the same TRAIN-split calibration discipline this baseline already enjoys -- fairness symmetry -- so a baseline-(iii) win remains fully possible. Section B.3: Baseline (iii) remains a deliberately STRONG competitor -- best-achievable heuristic fit on the TRAIN split -- No baseline was weakened.

**Analysis:** Baseline (iii)'s definition is verbatim from v1. The calibration symmetry gives SSI what (iii) already had; it does NOT remove anything from (iii). No weakening. PASS.

---

### TARGET B: ORACLE LEAK -- Does aligned EVSI let SSI read oracle labels or theta_u?

**Finding: PASS (confidence 0.98)**

Evidence: PRE-REG-v2 Section 2.5 states the context-prior SSI uses is SSI's own prior belief (computable from alpha^0 and counts), not an oracle label. Section 4.5 defines t_prior(c) as tolerance implied by the CONTEXT-PRIOR P(axis | context c) -- the belief BEFORE the consequence update. Section 4.5 [ARCH]: SSI still predicts answers with its own posterior and never reads theta_u or any oracle label. HARNESS-SPEC-v2 Section 8: answerDist uses SSI's OWN coupled posterior to predict answers -- no oracle label. Section B.2: SSI never accesses oracle labels or theta_u; the aligned-EVSI context-prior is SSI's own pre-consequence belief (from alpha^0, beta^0, counts), not an oracle label.

**Analysis:** The context-prior is SSI's Bayesian best-guess built from registered hyperpriors (alpha^0, beta^0) and fossil counts (n, m) -- NOT the true theta_u. SSI never reads worth_surfacing, answer_changes_IR, or theta_u. The alignment makes both SSI and oracle use context-prior as silent baseline -- a spec-faithfulness fix, not a backdoor. PASS.

---

### TARGET C: HELD-OUT WALL BREACH -- Does calibration touch held-out families/contexts?

**Finding: PASS (confidence 0.99)**

Evidence: PRE-REG-v2 Section 5.2.1: Calibration consumes only the fitting-data stream (TRAIN families x non-held-out context combinations) -- the identical TRAIN cases baseline (iii)/(v) are fit on. The evaluation stream is never read during calibration. Section 5.2.1 [GATE]: The held-out wall on calibration is ABSOLUTE. Calibration runs entirely in the fitting phase before evaluation per Section 7.3 ordering. It may never read a held-out family, context combination, or any oracle label from the evaluation stream. Any violation invalidates the run. The grid, objective, and tie-break are fixed at pre-registration before any data exists -- mechanical, non-post-hoc. HARNESS-SPEC-v2 Section 15: assertWall then fit baselines then calibrateOnTrain(SSI) on TRAIN then assertCalibrationWall then generateCases eval. Section 16: assertCalibrationWall throws if calibrateOnTrain consumed any held-out cell.

**Analysis:** Triple-enforced wall: (1) calibration uses only fitting-data before evaluation opens; (2) assertCalibrationWall programmatically verifies no held-out cell touched; (3) grid/objective/tie-break all fixed pre-registration. PASS.

---

### TARGET D: WORLD TAMPERING -- Is Section 2 carried VERBATIM from v1?

**Finding: PASS (confidence 0.99)**

Evidence: PRE-REG-v2 Section 2 banner explicitly states Section 2 IS CARRIED VERBATIM FROM v1 -- the synthetic generative world, latent axes, context variables, correlated-axis structure, consequence-to-likelihood mapping, and oracle labels are identical to v1. No v2 change touches the generative truth or oracle labels. Sections 2.1-2.4 are structurally identical to v1. Section 2.5 oracle labels retain v1 definitions; the alignment anchor is an explication, not a label change. The [v2 reading] note in 2.3 explicitly states no new fossil data is generated and the generative model is unchanged. HARNESS-SPEC-v2 Section 5: module is CARRIED VERBATIM from v1. Section B.1 confirms. v1 sha256 confirmed: afa823bc.

**PASS.**

---

### TARGET E: SSI-CANNOT-LOSE -- Structurally possible for SSI to fail?

**Finding: PASS (confidence 0.97)**

Three independent escape hatches confirmed OPEN:

**E1. Ablation path (baseline v):** The ablation shares SSI's coupled posterior, has NO turn budget, NO EVSI=0 gate, NO EIG ranking. If threshold-based surfing already captures oracle-rewarded cases, EIG/VoI adds nothing -> ablation wins -> H0-ablation fires -> FAIL-descope. (Section 1.3, 3.5, 3.6, 9.2 branch 2, B.10)

**E2. User-aware linter path (baseline iii):** Retains deliberately STRONG TRAIN-fit heuristic. Under calibration symmetry, both are TRAIN-fit; the two-axis held-out design is where a coarse-context heuristic may still outperform. (Section 3.3, 3.6, B.10)

**E3. G1B-MV path:** The coupled model is tested against a RICHER hierarchical alternative. If residual interactions are material or PPC rejects the coupled model -> MV-FORCE-COUPLE -> FAIL-MV. (Section 8.1-8.3, 9.2 branch 1, B.8)

**Structural design:** All three paths OPEN. Aligned EVSI can create new false positives. TRAIN-optimal calibration carries no held-out guarantee. Section 2.6 integrity argument remains operational. PASS.

---

### TARGET F: SCOPE CREEP -- Any changes beyond the four permitted?

**Finding: PASS (confidence 0.99)**

Full audit

of every locked parameter:

| Item | Status | Evidence |
|---|---|---|
| SEED_MASTER = 0x5551B_0002 | PASS | Single value, fixed pre-results, Section A.0: no seed-shopping |
| Composite weights (0.40, 0.40, 0.20) | PASS | Identical to v1, Sections 6.4/7.1 |
| N=12, permutation, Holm, delta=0.05 | PASS | Identical to v1, Section 7 |
| Held-out families/contexts/wall | PASS | Identical to v1, Sections 5.1-5.2 |
| Decision rule (4 branches, order, labels) | PASS | Structurally identical, Sections 9.2-9.3 |
| New constants (lambda, b_base, grids) | PASS | All part of permitted changes A.1/A.3, fixed in 9.4 |
| Ablation renamed to coupled-ablation | PASS | Naming reflection of CHANGE (1), not new baseline |
| MV model set {cpl, hier, fac} | PASS | Direct consequence of CHANGE (1) |
| Section A.5: list is closed | PASS | No fifth change exists |
| No results produced | PASS | Section B.11, both docs declare-only |

**PASS.**

---

## CROSS-VALIDATION: WHY EACH CHANGE IS PRINCIPLED, NOT RIGGING

**Change 1 (COUPLING):** Fixes v1 FAIL-MV. Applied IDENTICALLY to SSI and ablation. Coupled model still faces G1B-MV and CAN FAIL. Can hurt SSI: more accurate model may reduce S1 surprise gaps.

**Change 2 (ALIGNED EVSI):** Fixes v1 EVSI mismatch. No oracle label read. Context-prior is SSI own belief. Can hurt SSI: creates new false-positive route.

**Change 3 (CALIBRATION SYMMETRY):** Fixes v1 fairness asymmetry. Same TRAIN-only discipline baselines already had. Wall ABSOLUTE. Can hurt SSI: TRAIN-optimal != held-out win.

**Change 4 (S6/AQ HANDLING):** Fixes v1 metric mis-specification. Applied IDENTICALLY to every method. Helps ALL safety-obeying methods equally. MS reported, NOT gated.

---

## VERDICT

```
VERDICT: PASS-LOCK-READY
```

The G1B-v2 re-pre-registration passes all six anti-rigging falsification targets. The four permitted changes are principled corrections of genuine mis-specifications, each symmetric or cutting both ways. No baseline is weakened. No oracle label is leaked. The held-out wall is absolute and double-asserted. The generative world and oracle are verbatim v1. SSI remains structurally falsifiable through three independent paths (ablation, linter, MV). No scope creep is detected. The redesign is **fair, symmetric, audit-clean** -- certified ready for lock and execution under SEED_MASTER = 0x5551B_0002.

---

## Confidence Notes

- **0.98 overall**, discounted from 1.00 only for implementation-level concerns that the harness test plan explicitly addresses:
  - The [v2 reading] co-occurrence counting in Section 2.3 adds a new code path; the Section 16 lambda->0 limit test would catch any implementation error.
  - Calibration uses TRAIN oracle labels (same as baselines (iii)/(v) in v1). Sections B.2 and 5.2.1 are internally consistent: the wall is on HELD-OUT labels, not TRAIN. Executor must implement assertCalibrationWall faithfully.
- Each individual target confidence is stated inline.
- No adversarial reading of the locked documents found a path to rigging.