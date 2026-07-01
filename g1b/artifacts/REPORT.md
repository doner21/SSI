# G1B Falsifier — Run Report

## 1. Run metadata

| field | value |
|---|---|
| seedMaster | `0x5551b0001` |
| N (target) | 12 |
| nValid | 12 |
| node | CORSAIRAI |
| timestamp (ISO) | 2026-06-30T03:10:33.924Z |
| configHash | `556588647ed0597c9043bdb0386d3881969303a623acf8cd16476431f077841a` |

## 2. Holdout partition (§5.1 no-peeking wall)

- **Train families:** headroom-clip-risk, brightness-shift, routing-idiom-change
- **Held-out families:** inharmonic-artifact, added-latency, feedback-safety
- **Held-out context combos:**
  - axis=`grit` level=2 context=`{"subdomain":"mastering","genre":"clean-pop"}`
  - axis=`grit` level=0 context=`{"genre":"lofi"}`

## 3. Per-baseline composite test (§6.4 / §7.1 / §7.4)

SSI mean composite (across users): **0.4581**

| baseline | mean composite | D̄ = SSI−base | permutation p (raw) | margin pass (≥δ) |
|---|---|---|---|---|
| silent-route2 | 0.2000 | 0.2581 | 0.007813 (exact) | ✓ |
| generic-linter | 0.6316 | -0.1735 | 0.904297 (exact) | ✗ |
| user-heuristic | 0.6291 | -0.1710 | 1.000000 (exact) | ✗ |
| loo-classifier | 0.6036 | -0.1455 | 0.959961 (exact) | ✗ |
| factored-ablation | 0.5849 | -0.1268 | 0.947998 (exact) | ✗ |

## 4. Holm–Bonferroni step-down (§7.4, α-FWER)

| baseline | p (raw) | Holm threshold α/(m−rank+1) | reject |
|---|---|---|---|
| silent-route2 | 0.007813 | 0.010000 | ✓ |
| generic-linter | 0.904297 | 0.012500 | ✗ |
| user-heuristic | 1.000000 | 0.050000 | ✗ |
| loo-classifier | 0.959961 | 0.025000 | ✗ |
| factored-ablation | 0.947998 | 0.016667 | ✗ |

**All baselines rejected (H1 significance gate):** NO

## 5. Sub-metrics shown separately (§6.4) with bootstrap CIs (§7.5)

SSI mean sub-metrics (across users): AQ=**0.4369**, VoI=**0.5833**, US=**0.2500**.

Per-baseline paired sub-metric differences (SSI − baseline). The bootstrap CI column is the registered percentile CI on the **composite** D̄ (§7.5, reporting-only; the gate verdict is the §7.4 permutation test + margin, never the CI — NOTES R2).

| baseline | ΔAQ | ΔVoI | ΔUS | composite D̄ | composite CI [2.5%, 97.5%] |
|---|---|---|---|---|---|
| silent-route2 | -0.0631 | 0.5833 | 0.2500 | 0.2581 | [0.0975, 0.4197] |
| generic-linter | -0.1421 | -0.0833 | -0.4167 | -0.1735 | [-0.4005, 0.0584] |
| user-heuristic | -0.1185 | -0.2063 | -0.2054 | -0.1710 | [-0.2702, -0.0900] |
| loo-classifier | -0.1446 | -0.1137 | -0.2110 | -0.1455 | [-0.2951, -0.0098] |
| factored-ablation | -0.0887 | -0.1268 | -0.2029 | -0.1268 | [-0.2589, 0.0095] |

## 6. Calibration / reliability + ECE per method (§6.5, DIAGNOSTIC — never gated)

| method | surfacing ECE | abstention ECE |
|---|---|---|
| SSI | 0.2660 | 0.1765 |
| silent-route2 | 0.7208 | 0.4250 |
| generic-linter | 0.3801 | 0.0895 |
| user-heuristic | 0.2584 | 0.1948 |
| loo-classifier | 0.3643 | 0.3193 |
| factored-ablation | 0.5270 | 0.2399 |

_Calibration is reported only (§6.5): a better-calibrated SSI at equal composite is informative but does NOT rescue a failed gate; the gate is §6.4 composite + §7 test._

**SSI negative-control specificity per user (§7.6, H-NC bar ≥ 0.80):**

| userId | NC specificity |
|---|---|
| 0 | 0.7000 |
| 1 | 0.8333 |
| 2 | 1.0000 |
| 3 | 0.8125 |
| 4 | 1.0000 |
| 5 | 0.7000 |
| 6 | 0.7000 |
| 7 | 0.7692 |
| 8 | 1.0000 |
| 9 | 0.7857 |
| 10 | 0.7000 |
| 11 | 0.8421 |

Across-user mean NC specificity: **0.8202**.

## 7. G1B-MV — model-validity check (§8)

| quantity | value |
|---|---|
| PPC p-value (T_assoc) | 0.991500 |
| PPC adequate (in band) | NO |
| ΔELPD pair (nats/fossil) | -0.041509 |
| ΔELPD hier (nats/fossil) | -0.013465 |
| SE (best ΔELPD) | 0.025991 |
| material (size AND reliability) | NO |
| MV verdict | **MV-FORCE-COUPLE** |

## 8. Final verdict (§9.3 summary table)

- **Verdict:** **FAIL-MV**
- **Rationale:** MV-FORCE-COUPLE fired and the forced remedy was not applied: G1B-MV rejects the factored independence assumption, so SSI's KL/EIG claims are invalid as stated.
- **Action:** Add coupling / reduce KL-EIG claims; re-enter G1B; freeze Phase-2+ Route-1 work.

## 9. SELF-CHECK — pre-registered elements honored

| pre-registered element | how this run honors it |
|---|---|
| §2 axis/context/oracle structure | oracles read θ_u + context only; method output never read (generative.ts §2.6) |
| §3 five baselines | tested: silent-route2, generic-linter, user-heuristic, loo-classifier, factored-ablation |
| §4 SSI constants (α_base, θ_surprise, κ, B=3, IR*) | SSI is analytic & seed-free (§4.7); constants from frozen CONFIG |
| §5.1 holdout no-peeking wall | held-out families inharmonic-artifact/added-latency/feedback-safety + 2 context combo(s) committed before fitting |
| §5.3 evaluation-set rates | per-user eval cases generated at registered rates (generative.ts) |
| §6.4 composite weights (0.40,0.40,0.20) | composite = w_AQ·AQ + w_VoI·VoI + w_US·US (metrics.ts) |
| §6.5 calibration/ECE (diagnostic, never gated) | surfacing+abstention ECE reported per method above |
| §7.1 unit of analysis = synthetic user | 12 per-user composites; 12 valid |
| §7.2 N=12, floor 8 | N=12, nValid=12 (run invalid if <8 — handled upstream) |
| §7.3 seed scheme (SEED_MASTER, splittable PRNG) | seedMaster=0x5551b0001; bit-reproducible |
| §7.4 exact paired sign-flip permutation + Holm α=0.05 + δ=0.05 | allReject=false; per-baseline margin pass shown §3 |
| §7.5 deterministic bootstrap CIs (reporting-only) | composite percentile CIs shown §5; never gates |
| §7.6 H-NC specificity bar ≥ 0.80 | across-user mean NC specificity=0.8202 (bar 0.8) |
| §8 G1B-MV (τ_MV=0.02 nats/obs, 4·SE bar) | PPC p=0.9915; MV verdict=MV-FORCE-COUPLE |
| §9.3 ordered decision branches | final verdict=FAIL-MV mapped verbatim from the §9.3 table |

## 10. Evidentiary status (READ THIS)

**This result is PILOT-GRADE SYNTHETIC EVIDENCE ONLY.** Every oracle label (`worth_surfacing`, `answer_changes_IR`) and therefore every metric here is defined by the §2 synthetic generative model, **not by humans**. A G1B pass clears (or a fail blocks) the cheap synthetic falsifier so heavier build phases are gated honestly — it does **not** establish the human claim.

**The human claim is owed at G5, not G1B.** The powered, human-grounded standard is **N ≥ 24 real musicians** with real fossils, real engine, real usefulness ratings and real answer-changing observations (§9 Phase 5). G1B's N ≥ 8 is explicitly pilot-grade (§5.6, §6.6). No metric in this report should be read as establishing the human claim.
