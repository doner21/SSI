# G1B Falsifier — Run Report (v2)

## 1. Run metadata

| field | value |
|---|---|
| seedMaster | `0x5551b0002` |
| N (target) | 12 |
| nValid | 12 |
| node | CORSAIRAI |
| timestamp (ISO) | 2026-06-30T06:55:54.175Z |
| configHash | `7597a02b702b6a795aef9181d2fc3660fcac499be74810c85ac624901f5be7f7` |

**Calibrated constants (TRAIN-only selection, §5.2.1 / [v2 CHANGE (3)]):**

| constant | value |
|---|---|
| θ*_surprise (TRAIN-selected) | 0.2000 |
| κ* (TRAIN-selected) | 0.1000 |
| TRAIN composite (argmax objective) | 0.7430 |

_The operating point (θ*_surprise, κ*) is chosen by SSI's OWN §6 composite on the TRAIN split ONLY — it consumes no randomness, no oracle labels, and no held-out cell (§5.2.1 absolute wall)._

## 2. Holdout partition (§5.1 no-peeking wall)

- **Train families:** headroom-clip-risk, brightness-shift, routing-idiom-change
- **Held-out families:** inharmonic-artifact, added-latency, feedback-safety
- **Held-out context combos:**
  - axis=`grit` level=2 context=`{"subdomain":"mastering","genre":"clean-pop"}`
  - axis=`grit` level=0 context=`{"genre":"lofi"}`

## 3. Per-baseline composite test (§6.4 / §7.1 / §7.4)

SSI mean composite (across users, D_disc): **0.1833**

| baseline | mean composite | D̄ = SSI−base | permutation p (raw) | margin pass (≥δ) |
|---|---|---|---|---|
| silent-route2 | 0.1833 | 0.0000 | 1.000000 (exact) | ✗ |
| generic-linter | 0.6041 | -0.4207 | 0.999023 (exact) | ✗ |
| user-heuristic | 0.5166 | -0.3332 | 1.000000 (exact) | ✗ |
| loo-classifier | 0.6314 | -0.4481 | 0.999023 (exact) | ✗ |
| coupled-ablation | 0.7046 | -0.5212 | 1.000000 (exact) | ✗ |

## 4. Holm–Bonferroni step-down (§7.4, α-FWER)

| baseline | p (raw) | Holm threshold α/(m−rank+1) | reject |
|---|---|---|---|
| silent-route2 | 1.000000 | 0.016667 | ✗ |
| generic-linter | 0.999023 | 0.010000 | ✗ |
| user-heuristic | 1.000000 | 0.025000 | ✗ |
| loo-classifier | 0.999023 | 0.012500 | ✗ |
| coupled-ablation | 1.000000 | 0.050000 | ✗ |

**All baselines rejected (H1 significance gate):** NO

## 5. Sub-metrics shown separately (§6.4) with bootstrap CIs (§7.5)

SSI mean sub-metrics (across users, D_disc): AQ=**0.4583**, VoI=**0.0000**, US=**0.0000**.

Per-baseline paired sub-metric differences (SSI − baseline). The bootstrap CI column is the registered percentile CI on the **composite** D̄ (§7.5, reporting-only; the gate verdict is the §7.4 permutation test + margin, never the CI — NOTES R2).

| baseline | ΔAQ | ΔVoI | ΔUS | composite D̄ | composite CI [2.5%, 97.5%] |
|---|---|---|---|---|---|
| silent-route2 | 0.0000 | 0.0000 | 0.0000 | 0.0000 | [0.0000, 0.0000] |
| generic-linter | -0.0518 | -0.7500 | -0.5000 | -0.4207 | [-0.5890, -0.2472] |
| user-heuristic | -0.0015 | -0.6667 | -0.3299 | -0.3332 | [-0.4804, -0.1817] |
| loo-classifier | -0.1077 | -0.7500 | -0.5250 | -0.4481 | [-0.6190, -0.2683] |
| coupled-ablation | -0.1347 | -0.8893 | -0.5582 | -0.5212 | [-0.6455, -0.4013] |

## 6. Mandatory-safety (MS) bucket per method (§6.1.1, [v2 CHANGE (4)] — REPORTED, NOT GATED)

The S6/AQ mandatory-safety cases (`D_safety`) are scored in a SEPARATE bucket, EXCLUDED IDENTICALLY from the D_disc composite for **all** methods (SSI and every baseline). This bucket is reported for transparency and **never enters the gate** — it cannot rescue or sink a verdict.

| method | mean MS (across users) |
|---|---|
| SSI | 0.5426 |
| silent-route2 | 0.0000 |
| generic-linter | 0.0000 |
| user-heuristic | 0.4048 |
| loo-classifier | 0.2500 |
| coupled-ablation | 1.0000 |

## 7. Calibration / reliability + ECE per method (§6.5, DIAGNOSTIC — never gated)

| method | surfacing ECE | abstention ECE |
|---|---|---|
| SSI | 0.2341 | 0.2428 |
| silent-route2 | 0.8743 | 0.5090 |
| generic-linter | 0.4544 | 0.2187 |
| user-heuristic | 0.3390 | 0.2517 |
| loo-classifier | 0.5618 | 0.2539 |
| coupled-ablation | 0.5763 | 0.2624 |

_Calibration is reported only (§6.5): a better-calibrated SSI at equal composite is informative but does NOT rescue a failed gate; the gate is §6.4 composite + §7 test._

**SSI negative-control specificity per user (§7.6, H-NC bar ≥ 0.80):**

| userId | NC specificity |
|---|---|
| 0 | 1.0000 |
| 1 | 1.0000 |
| 2 | 1.0000 |
| 3 | 1.0000 |
| 4 | 1.0000 |
| 5 | 1.0000 |
| 6 | 1.0000 |
| 7 | 1.0000 |
| 8 | 1.0000 |
| 9 | 1.0000 |
| 10 | 1.0000 |
| 11 | 1.0000 |

Across-user mean NC specificity: **1.0000**.

## 8. G1B-MV — model-validity check on the coupled model (§8, [v2])

| quantity | value |
|---|---|
| PPC p-value (T_assoc) | 0.998000 |
| PPC adequate (in band) | NO |
| ΔELPD_hier (nats/fossil; richer hierarchical vs coupled) | -0.053148 |
| ΔELPD_fac (nats/fossil; factored vs coupled — coupling-needed) | 0.017292 |
| SE_hier (paired SE of ΔELPD_hier) | 0.030206 |
| material (size AND reliability on M-hier) | NO |
| MV verdict | **MV-FORCE-COUPLE** |

## 9. Final verdict (§9.3 summary table)

- **Verdict:** **FAIL-MV**
- **Rationale:** MV-FORCE-COUPLE fired and the forced remedy was not applied: G1B-MV rejects the factored independence assumption, so SSI's KL/EIG claims are invalid as stated.
- **Action:** Add coupling / reduce KL-EIG claims; re-enter G1B; freeze Phase-2+ Route-1 work.

## 10. SELF-CHECK — pre-registered elements honored

| pre-registered element | how this run honors it |
|---|---|
| §2 axis/context/oracle structure | oracles read θ_u + context only; method output never read (generative.ts §2) |
| §3 five baselines (incl. coupled-ablation) | tested: silent-route2, generic-linter, user-heuristic, loo-classifier, coupled-ablation |
| §4.0–§4.6 coupled belief core [v2 CHANGE (1)] | single shared sparse-pairwise-coupled posterior consumed identically by SSI and baseline (v) |
| §4.3–§4.7 SSI: aligned-EVSI + TRAIN calibration [v2 CHANGE (2)/(3)] | θ*_surprise=0.2000, κ*=0.1000 (TRAIN-only) |
| §5.1 holdout no-peeking wall | held-out families inharmonic-artifact/added-latency/feedback-safety + 2 context combo(s) committed before fitting |
| §5.2.1 calibration wall | calibrateOnTrain touched NO held-out cell (asserted upstream); calibrated constants reported §1 |
| §6.1.1 D_disc / D_safety split [v2 CHANGE (4)] | MS bucket scored separately, excluded identically for all methods (table §6) |
| §6.4 composite weights (0.40,0.40,0.20) | composite = w_AQ·AQ + w_VoI·VoI + w_US·US over D_disc (metrics.ts) |
| §6.5 calibration/ECE (diagnostic, never gated) | surfacing+abstention ECE reported per method §7 |
| §7.1 unit of analysis = synthetic user | 12 per-user composites; 12 valid |
| §7.2 N=12, floor 8 | N=12, nValid=12 (run invalid if <8 — handled upstream) |
| §7.3 seed scheme (SEED_MASTER=0x5551B_0002, splittable PRNG) | seedMaster=0x5551b0002; bit-reproducible |
| §7.4 exact paired sign-flip permutation + Holm α=0.05 + δ=0.05 | allReject=false; per-baseline margin pass shown §3 |
| §7.5 deterministic bootstrap CIs (reporting-only) | composite percentile CIs shown §5; never gates |
| §7.6 H-NC specificity bar ≥ 0.80 | across-user mean NC specificity=1.0000 (bar 0.8) |
| §8 G1B-MV on coupled model (τ_MV, SE bar) | PPC p=0.9980; ΔELPD_hier=-0.0531; MV verdict=MV-FORCE-COUPLE |
| §9.3 ordered decision branches | final verdict=FAIL-MV mapped verbatim from the §9.3 table |

## 11. Evidentiary status (READ THIS)

**This result is PILOT-GRADE SYNTHETIC EVIDENCE ONLY.** Every oracle label (`worth_surfacing`, `answer_changes_IR`) and therefore every metric here is defined by the §2 synthetic generative model, **not by humans**. A G1B pass clears (or a fail blocks) the cheap synthetic falsifier so heavier build phases are gated honestly — it does **not** establish the human claim.

**The human claim is owed at G5, not G1B.** The powered, human-grounded standard is **N ≥ 24 real musicians** with real fossils, real engine, real usefulness ratings and real answer-changing observations (§9 Phase 5). G1B's N ≥ 8 is explicitly pilot-grade (§5.6, §6.6). No metric in this report should be read as establishing the human claim.

---

## 12. EXECUTOR RUN-13 ADDENDUM — determinism, isolation, and the literal §9 outcome

_Appended by the Phase-5 executor after running the FROZEN v2 harness on the committed
`SEED_MASTER = 0x5551B_0002`. No registered constant, threshold grid, weight, N, or seed was
altered; no seed-shopping was performed. The single run above is the pre-registered run._

### 12.1 Determinism (run-twice, byte-identical modulo timestamp)

The harness was executed three times, each preceded by `rm -rf g1b/artifacts-v2`:

| run | command | verdict | results.json sha256 (full file) |
|---|---|---|---|
| #1 | `node --experimental-strip-types g1b/src-v2/run.ts` | FAIL-MV | `5eea3402…b2d4` |
| #2 | (same, clean dir) | FAIL-MV | (full-file hash differs ONLY at `timestampISO`) |
| #3 | (same, clean dir) | FAIL-MV | (full-file hash differs ONLY at `timestampISO`) |

A full line-diff of `results.json` between independent clean runs yields **exactly one differing
hunk** — the `meta.timestampISO` field (the sole spec-allowed wall-clock field):

```
7c7
<     "timestampISO": "2026-06-30T06:55:44.805Z",
---
>     "timestampISO": "2026-06-30T06:55:54.175Z",
```

Stripping `meta.timestampISO` and canonicalizing, the two runs are **byte-identical**
(`IDENTICAL modulo timestampISO: True`). Determinism per §7.3 is therefore confirmed: SSI's
decisions and the TRAIN calibration argmax are analytic/seed-free, and all randomness is routed
through the splittable PRNG seeded by the committed master constant.

### 12.2 Ablation isolation (the load-bearing falsifier) — VERIFIED

`g1b/src-v2/baselines.ts` has exactly one runtime value-import:

```ts
import { consequenceConditioned, coupledPosterior, klCoupled } from "./posterior.js";
```

- **Shares SSI's coupling:** the `coupled-ablation` baseline reasons on the **identical** shared
  `posterior.ts` belief functions SSI uses (`coupledPosterior`, `consequenceConditioned`, and
  `klCoupled` — which IS SSI's `s1Surprise`). The coupling lives entirely in `posterior.ts`, so
  SSI and baseline (v) consume the **same** upstream model.
- **Imports NO EIG/VoI:** `baselines.ts` imports **nothing** from `ssi.ts`, and references **no**
  EVSI/EIG symbol (`evsiAligned`, `irSilentAligned`, `eig`). A grep for `evsi`/`eig` in the file
  returns only documentation comments and the substring inside the word "w**eig**hts" — **zero**
  functional references. The ablation decides via its **own** single-parameter surprise threshold
  tuned on TRAIN only (not SSI's `calibrateOnTrain`).
- **Consequence:** **SSI − (coupled-ablation) isolates ONLY the EIG/VoI machinery** on a common,
  coupled belief model — exactly the clean falsifier the v2 re-pre-registration demands (§3.5).

### 12.3 The fair head-to-head — stated plainly

Under this fair, pre-registered test (composite over `D_disc`, paired sign-flip permutation,
δ_composite = 0.05, Holm α = 0.05):

- **Did SSI beat the coupled-ablation?** **NO.** D̄ = SSI − ablation = **−0.5212** (SSI is *worse*);
  raw permutation p = 1.000; Holm reject = NO. SSI loses to its own ablation decisively.
- **Did SSI beat the user-aware linter (generic-linter)?** **NO.** D̄ = **−0.4207** (SSI is *worse*);
  raw permutation p = 0.9990; Holm reject = NO.
- In fact SSI's mean composite (0.1833) is **below every non-silent baseline**
  (generic-linter 0.6041, user-heuristic 0.5166, loo-classifier 0.6314, coupled-ablation 0.7046).
  Adding the EIG/VoI machinery on top of the coupled model **did not help and actively hurt**.

### 12.4 §9 DECISION RULE applied — LITERAL outcome

The locked, mutually-exclusive branch order (PRE-REG-v2 §9.2; `decision.ts`) is evaluated
first-match-wins:

1. **FAIL-MV** — `MV == "MV-FORCE-COUPLE"` **AND** the forced remedy was **NOT** applied. ✅ **FIRES.**
   The G1B-MV sub-gate returned `MV-FORCE-COUPLE` (PPC p = 0.998, out of band; the factored
   independence assumption is rejected) and no in-run coupling/claim-reduction remedy was applied,
   so this branch is terminal.
2. FAIL-descope-D5 — (would also have fired: `ablationTie` is TRUE, since SSI ⊀ baseline (v)).
3. FAIL (general) — (would also have fired: not all baselines beaten; H1 fails).
4. PASS — not reached.

**LITERAL OUTCOME: `FAIL-MV`.**

Note for honesty: even if MV had passed, the next branch (**FAIL-descope-D5**) would have fired,
because SSI did **not** beat the coupled-ablation. By the FREEZE-v2 rule ("if SSI does not beat
the ablation AND the user-aware linter under this fair test, DESCOPE per Decision #5 — no further
retries"), the **substantive** result is a clean **descope**: SSI's EIG/VoI machinery is not
justified by this falsifier. The terminal verdict label is `FAIL-MV` only because the model-validity
gate is checked before the ablation gate; both gates fail. **Nothing was tuned to manufacture a
PASS** — this is a fair, honest FAIL, which is an accepted and valuable outcome.

### 12.5 Integrity re-verification (post-run)

All four locked `.md` files match the FREEZE-v2 record **after** the runs:

| file | sha256 | matches freeze |
|---|---|---|
| PRE-REGISTRATION-v2.md | `c4042f91…3307` | ✅ |
| HARNESS-SPEC-v2.md | `706534f5…3550` | ✅ |
| PRE-REGISTRATION.md (v1) | `afa823bc…a2a2b` | ✅ |
| HARNESS-SPEC.md (v1) | `6dfd501e…5ed3b` | ✅ |

All 14 v1 `src/*.ts` files pass `sha256sum -c` against their pre-run baseline (OK ×14), and all
four v1 `artifacts/*` files are unchanged. No v1 file and no locked `.md` file was modified by this
run.
