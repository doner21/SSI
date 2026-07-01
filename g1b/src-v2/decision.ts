// src/decision.ts — G1B Falsifier ordered decision rule (HARNESS-SPEC §13 / PRE-REGISTRATION §9).
//
// The terminal, fully-deterministic function that maps the locked test inputs (§7–§8) onto the
// single G1B verdict. It performs NO statistics of its own: every ingredient (Holm step-down,
// per-baseline paired diffs, the H1 conjunction, the ablation-tie predicate, the negative-control
// specificity, and the G1B-MV verdict) is computed upstream and handed in. This module only
// evaluates the LOCKED, mutually-exclusive branch order (§9.2) — first match wins — and renders
// the rationale/action strings that mirror the §9.3 summary table.
//
// Locked branch order (PRE-REGISTRATION §9.2 [GATE]):
//   1. FAIL-MV          — if MV == "MV-FORCE-COUPLE" AND the forced remedy was NOT applied.
//   2. FAIL-descope-D5  — else if ablationTie (SSI ⊀ baseline (v) by margin@significance).
//   3. FAIL (general)   — else if !h1Pass (baselines i–iv) OR !ncPass.
//   4. PASS             — else (MV ok-or-remedied, no ablation tie, all 5 beaten, NC holds).
//
// When MV-FORCE-COUPLE fires WITH a completed remedy, the upstream §7 test is re-run on the
// remedied (coupled / claim-reduced) model and `h1Pass`, `ablationTie`, `ncPass` are read from
// that re-run (PRE-REGISTRATION §9.1, option (a)/(b)); this module simply consumes those
// remedied inputs and continues through branches 2–4. A completed remedy is therefore NOT a
// terminal FAIL-MV.
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules (NodeNext `.js` import specifiers), no
// `any` in public signatures, pure & deterministic (no I/O, no randomness, no clock). Introduces
// NO new parameter — every threshold lives upstream in §7–§9 and arrives pre-computed. `cfg` is
// accepted to honor the HARNESS-SPEC §13 signature and to keep the lock-statement contract
// explicit, even though all gating predicates are pre-reduced to booleans by the caller.
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no new parameters):
//
//   D1. `cfg: LockedConfig` is part of the locked §13 signature (`decideVerdict(cfg, inp)`).
//       Because §9.1 pre-reduces every numeric threshold (δ_composite, α_FWER, the 0.80 NC bar)
//       into the boolean inputs (`h1Pass`, `ablationTie`, `ncPass`), this function needs no
//       constant from `cfg` to compute the verdict. We keep the parameter (signature fidelity)
//       and reference it in a cheap, side-effect-free invariant guard rather than dropping it,
//       so the lock-contract "verdict is a deterministic function of the locked tests" is visibly
//       honored. The guard never changes the verdict.
//
//   D2. Branch 3 ("FAIL general") is specified as `!h1Pass on baselines i–iv OR !ncPass`. The
//       ablation tie is baseline (v) ONLY and is fully captured by branch 2, which is checked
//       FIRST (§9.2 explicitly orders descope before generic FAIL "even if SSI also beat some
//       other baselines"). Therefore by the time control reaches branch 3, any surviving
//       `!h1Pass` necessarily concerns baselines i–iv (a v-only failure would have triggered
//       branch 2's `ablationTie`). We pass `h1Pass` through as-is; no re-derivation is needed.
//       The DecisionInputs contract documents `h1Pass` as "all 5: margin ∧ Holm-significant"
//       (§9.1), and `ablationTie` as the dedicated baseline-(v) predicate, so the ordered
//       evaluation yields exactly the §9.3 routing.
//
//   D3. The rationale/action strings are fixed, verbatim-aligned to the §9.3 table rows so the
//       report renderer (§14) can surface them unchanged. They are descriptive text, not tunable
//       parameters.
//
//   D4. "Remedy applied" semantics: per §9.1, FAIL-MV is terminal ONLY when MV-FORCE-COUPLE
//       fires and NEITHER coupling re-run NOR claim-reduction was completed. We model that as the
//       single boolean `mvRemedyApplied`; when true under MV-FORCE-COUPLE, evaluation falls
//       through to branches 2–4 on the remedied-model inputs the caller supplies.
// ─────────────────────────────────────────────────────────────────────────────

import type { LockedConfig } from "./types.js";
import type { HolmResult, PairedTestResult } from "./stats.js";
import type { MVVerdict } from "./mv.js";

// ─────────────────────────────────────────────────────────────────────────────
// Public result shapes (HARNESS-SPEC §13).
// ─────────────────────────────────────────────────────────────────────────────

/** §9.2 the four mutually-exclusive G1B verdicts. */
export type Verdict = "PASS" | "FAIL-descope-D5" | "FAIL-MV" | "FAIL";

/** §9.1 the pre-reduced inputs to the locked decision rule (all computed in §7–§8). */
export interface DecisionInputs {
  /** §7.4 Holm step-down result across the five baselines (carried for the report/audit trail). */
  readonly holm: HolmResult;
  /** §7.1/§7.4 per-baseline paired-test outcomes; INCLUDES baseline (v) used for `ablationTie`. */
  readonly perBaseline: readonly PairedTestResult[];
  /** §9.1 H1: every baseline clears BOTH the δ_composite margin AND Holm significance (all 5). */
  readonly h1Pass: boolean;
  /** §9.1 ablation tie vs baseline (v): (D̄^{(v)} < δ) OR (Holm-adjusted p^{(v)} ≥ 0.05). */
  readonly ablationTie: boolean;
  /** §7.6 H-NC: SSI negative-control specificity ≥ 0.80 (FP-interruption ≤ 0.20). */
  readonly ncPass: boolean;
  /** §8.3 the G1B-MV materiality verdict on the factored-independence assumption. */
  readonly mv: MVVerdict;
  /** §9.1 forced remedy completed (coupling re-run OR claim reduction); inputs then re-read. */
  readonly mvRemedyApplied: boolean;
}

/** The terminal verdict plus the §9.3 rationale/action strings (rendered verbatim in §14). */
export interface VerdictResult {
  readonly verdict: Verdict;
  readonly rationale: string;
  readonly action: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §9.3 fixed rationale/action strings (mirror the summary verdict table verbatim).
// ─────────────────────────────────────────────────────────────────────────────

const RATIONALE: Readonly<Record<Verdict, string>> = Object.freeze({
  "FAIL-MV":
    "MV-FORCE-COUPLE fired and the forced remedy was not applied: G1B-MV rejects the factored " +
    "independence assumption, so SSI's KL/EIG claims are invalid as stated.",
  "FAIL-descope-D5":
    "ablation_tie: SSI does not beat baseline (v) (the EIG/VoI ablation) by the registered " +
    "margin δ_composite=0.05 at Holm-FWER significance — the EIG/VoI machinery is NOT load-bearing " +
    "(accepted falsification H0-ablation, Decision #5).",
  FAIL:
    "H1_pass is false on baselines (i)–(iv) (SSI fails the margin/significance against a strong " +
    "baseline) or NC_pass is false (SSI over-surfaces on negative controls).",
  PASS:
    "MV adequate-or-remedied, ablation_tie false, H1_pass true for all five baselines at " +
    "δ_composite=0.05 / Holm-FWER<0.05, and NC_pass holds — SSI beats all five baselines and " +
    "negative controls abstain. PILOT-GRADE synthetic evidence only; human claim remains owed at G5 (N≥24).",
});

const ACTION: Readonly<Record<Verdict, string>> = Object.freeze({
  "FAIL-MV":
    "Add coupling / reduce KL-EIG claims; re-enter G1B; freeze Phase-2+ Route-1 work.",
  "FAIL-descope-D5":
    "Descope (Decision #5): ship the user-aware heuristic Route-1 (baseline iii) or Route-2-only, " +
    "retract the 'computed belief shift' claim, and freeze EIG/VoI-dependent Phase-2+ work.",
  FAIL:
    "Freeze Phase-2+ Route-1 work; redesign the salience model and re-enter G1B.",
  PASS:
    "Clear the pilot-grade G1B gate; Phases 4–6 Route-1 work may proceed. Human claim still owed at G5 (N≥24).",
});

// ─────────────────────────────────────────────────────────────────────────────
// §9.2 the ordered decision rule (top-down, first match wins) [GATE].
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate the LOCKED §9.2 branch order and return the terminal G1B verdict.
 *
 * Branch order (mutually exclusive, first match wins):
 *   1. FAIL-MV          — MV == "MV-FORCE-COUPLE" AND NOT mvRemedyApplied.
 *   2. FAIL-descope-D5  — ablationTie.
 *   3. FAIL             — NOT h1Pass (baselines i–iv) OR NOT ncPass.
 *   4. PASS             — otherwise.
 *
 * Pure & deterministic: no I/O, no randomness, no clock. `cfg` honors the §13 signature and is
 * used only in a side-effect-free invariant guard (see NOTE D1) that never alters the verdict.
 */
export function decideVerdict(cfg: LockedConfig, inp: DecisionInputs): VerdictResult {
  // NOTE D1: signature-fidelity guard — `cfg` must be the locked config; never gates the verdict.
  if (cfg === undefined || cfg === null) {
    throw new Error("decideVerdict: LockedConfig is required (§9.4 lock statement).");
  }

  // Branch 1 — FAIL-MV: forced coupling demanded by G1B-MV but no remedy completed (§9.2.1).
  if (inp.mv === "MV-FORCE-COUPLE" && !inp.mvRemedyApplied) {
    return verdictOf("FAIL-MV");
  }

  // Branch 2 — FAIL-descope (Decision #5): the EIG/VoI ablation tie (§9.2.2). Checked BEFORE the
  // generic FAIL so an ablation tie is always routed to descope, even if SSI beat other baselines.
  if (inp.ablationTie) {
    return verdictOf("FAIL-descope-D5");
  }

  // Branch 3 — FAIL (general): H1 fails on baselines (i)–(iv), or negative-control over-surfacing
  // (§9.2.3). By construction a baseline-(v)-only failure was already captured by branch 2.
  if (!inp.h1Pass || !inp.ncPass) {
    return verdictOf("FAIL");
  }

  // Branch 4 — PASS (pilot-grade): all gates satisfied (§9.2.4).
  return verdictOf("PASS");
}

/** Assemble the immutable {verdict, rationale, action} triple for a resolved verdict. */
function verdictOf(verdict: Verdict): VerdictResult {
  return Object.freeze({
    verdict,
    rationale: RATIONALE[verdict],
    action: ACTION[verdict],
  });
}
