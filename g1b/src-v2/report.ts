// ─────────────────────────────────────────────────────────────────────────────
// src-v2/report.ts — Results JSON + human-readable REPORT.md (HARNESS-SPEC-v2 §14).
//
// Renders exactly the two v2 run artifacts, EXACTLY per the §14.1 declared shape:
//   • g1b/artifacts-v2/results.json  — full machine-readable v2 run object.
//   • g1b/artifacts-v2/REPORT.md     — human-readable report (sections IN ORDER §14.2).
//
// NOTE on output location: HARNESS-SPEC-v2 §14 names the artifacts `results-v2.json`
//   / `REPORT-v2.md`. This executor task explicitly fixes the OUTPUT LOCATION to
//   `g1b/artifacts-v2/results.json` and `g1b/artifacts-v2/REPORT.md`. Both conventions
//   share the same intent — keep v2 OUT of the v1 `artifacts/` directory so the v1
//   permanent record is never overwritten. The actual paths are supplied by the caller
//   (run-v2.ts); this module stays pure and only enforces the refusal invariant below.
//
// Design (identical discipline to v1):
//   • `buildResultsJSON` is PURE: it assembles the frozen §14.1 ResultsJSON from
//     already-computed inputs (no randomness, no I/O, no recomputation of gated
//     quantities). It only reshapes (HoldoutPartition sets → FamilyId[] arrays,
//     seedMaster bigint → hex string) and places the TRAIN-selected calibrated
//     constants into `meta.calibrated` [v2 CHANGE (3)].
//   • `renderReportMarkdown` is PURE: it produces a Markdown string from ResultsJSON.
//   • `writeResults` / `writeReport` perform file I/O and are EXECUTION-PHASE ONLY
//     (§14 output integrity [GATE]). They REFUSE to overwrite the four LOCKED `.md`
//     files (PRE-REGISTRATION.md, HARNESS-SPEC.md, PRE-REGISTRATION-v2.md,
//     HARNESS-SPEC-v2.md) AND the v1 artifacts (artifacts/results.json,
//     artifacts/REPORT.md). The refusal is PATH-AWARE so the intended v2 outputs in
//     `artifacts-v2/` — which share the basenames `results.json` / `REPORT.md` — are
//     still permitted.
//
// NOTES (spec-ambiguity interpretations — declared here, no new registered parameters):
//   R1. configHash / node / timestampISO are RUN-ENVIRONMENT inputs, not registered
//       parameters. They are supplied by the caller (run-v2.ts) so this module stays
//       pure and deterministic. seedMaster is rendered from cfg as a hex string `0x…`.
//   R2. The §14.1 `tests.bootstrap` JSON field carries ONE {lo,hi} per baseline — the
//       reported percentile CI on the COMPOSITE paired difference D̄^{(b)} (§7.5). §14.2
//       additionally asks the three sub-metrics (AQ/VoI/US) be shown "separately with
//       bootstrap CIs". The frozen JSON shape only stores the composite CI, so the report
//       renders the three sub-metric paired-difference MEANS separately (computed from the
//       per-user data already in ResultsJSON) and shows the composite bootstrap CI beside
//       them. No extra JSON fields are invented (the §14.1 shape is honored EXACTLY).
//   R3. `nValid` (number of valid synthetic users, §7.2 floor check) is supplied by the
//       caller; if `nValid < NFloor` the run is INVALID (handled upstream in run-v2.ts), but
//       the report still renders the recorded counts honestly.
//   R4. The §9.3 verdict→action mapping is rendered VERBATIM from the supplied
//       VerdictResult (decision.ts already mirrors the §9.3 table strings); the report does
//       not re-derive the verdict (single source of truth = decision.ts).
//   R5. [v2 CHANGE (3)] `meta.calibrated` (the TRAIN-selected θ*_surprise, κ*, and their
//       TRAIN composite) is a COMPUTED input (from calibrateOnTrain), supplied alongside the
//       run-environment meta and surfaced in §1 of the report.
//   R6. [v2 CHANGE (4)] The mandatory-safety `ms` bucket already lives inside every
//       PerUserMetrics record; the report adds a dedicated §6.x table rendering it per method
//       (REPORTED, never gated — identical exclusion for SSI and all baselines, §6.1.1).
//   R7. [v2] The G1B-MV block carries `ΔELPD_hier`, `ΔELPD_fac`, and `SE_hier` on the
//       COUPLED model (M-cpl baseline) per §8 — replacing the v1 `ΔELPD_pair`/`SE_best`.
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, basename, dirname, sep } from "node:path";

import type {
  FamilyId,
  HeldOutContextCombo,
  HoldoutPartition,
  LockedConfig,
  CalibratedConstants,
  PerUserMetrics,
} from "./types.js";
import type { BaselineId } from "./baselines.js";
import type { HolmResult, PairedTestResult } from "./stats.js";
import type { MVVerdict } from "./mv.js";
import type { Verdict, VerdictResult } from "./decision.js";

// ─────────────────────────────────────────────────────────────────────────────
// §14.1 — Results JSON declared shape (EXACT). [ARCH][GATE]
// ─────────────────────────────────────────────────────────────────────────────

export interface ResultsJSON {
  readonly meta: {
    seedMaster: string;
    N: number;
    nValid: number;
    node: string;
    timestampISO: string;
    configHash: string;
    /** [v2 CHANGE (3)] the TRAIN-selected (θ*_surprise, κ*) + TRAIN composite. */
    calibrated: CalibratedConstants;
  };
  readonly holdout: {
    trainFamilies: FamilyId[];
    heldOutFamilies: FamilyId[];
    heldOutContextCombos: HeldOutContextCombo[];
  };
  readonly perUser: readonly {
    userId: number;
    ssi: PerUserMetrics; // [v2] includes ms (mandatory-safety bucket)
    baselines: Readonly<Record<BaselineId, PerUserMetrics>>; // [v2] each includes ms
    ssiNegControlSpecificity: number;
  }[];
  readonly tests: {
    perBaseline: readonly PairedTestResult[]; // baseline ids include "coupled-ablation"
    holm: HolmResult;
    bootstrap: Readonly<Record<BaselineId, { lo: number; hi: number }>>;
  };
  readonly calibration: { ssi: { surfacingECE: number; abstentionECE: number } } & Record<
    BaselineId,
    { surfacingECE: number; abstentionECE: number }
  >;
  readonly mv: {
    pPPC: number;
    ppcAdequate: boolean;
    dElpdHier: number; // ΔELPD_hier (richer hierarchical alt vs coupled, nats/fossil)
    dElpdFac: number; // ΔELPD_fac  (factored vs coupled — coupling-needed diagnostic)
    seHier: number; // registered paired SE of ΔELPD_hier (§8.2)
    material: boolean;
    verdict: MVVerdict;
  };
  readonly decision: { verdict: Verdict; rationale: string; action: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// buildResultsJSON — assemble the frozen §14.1 object from computed inputs (PURE).
// ─────────────────────────────────────────────────────────────────────────────

/** Run-environment metadata that is NOT a registered parameter (NOTES R1). */
export interface RunMeta {
  /** Number of VALID synthetic users actually produced (§7.2 floor check). */
  readonly nValid: number;
  /** Host/node identifier (e.g. os.hostname()), supplied by run-v2.ts. */
  readonly node: string;
  /** ISO-8601 run timestamp, supplied by run-v2.ts. */
  readonly timestampISO: string;
  /** Deterministic hash of the locked CONFIG, supplied by run-v2.ts (audit trail). */
  readonly configHash: string;
}

/** Per-user metric record (one row per synthetic user) for the §14.1 `perUser` array. */
export interface PerUserResult {
  readonly userId: number;
  readonly ssi: PerUserMetrics;
  readonly baselines: Readonly<Record<BaselineId, PerUserMetrics>>;
  readonly ssiNegControlSpecificity: number;
}

/** Calibration ECE block: SSI plus every baseline (§6.5, diagnostic-only). */
export type CalibrationBlock = { ssi: { surfacingECE: number; abstentionECE: number } } & Record<
  BaselineId,
  { surfacingECE: number; abstentionECE: number }
>;

/** G1B-MV materiality block on the COUPLED model (§8) [v2]. */
export interface MVResultBlock {
  readonly pPPC: number;
  readonly ppcAdequate: boolean;
  readonly dElpdHier: number;
  readonly dElpdFac: number;
  readonly seHier: number;
  readonly material: boolean;
  readonly verdict: MVVerdict;
}

/** All computed inputs to buildResultsJSON (every quantity is computed in §5–§9). */
export interface ResultsInput {
  readonly cfg: LockedConfig;
  readonly meta: RunMeta;
  /** [v2 CHANGE (3)] TRAIN-selected calibrated constants (from calibrateOnTrain). */
  readonly calibrated: CalibratedConstants;
  readonly partition: HoldoutPartition;
  readonly perUser: readonly PerUserResult[];
  readonly tests: {
    readonly perBaseline: readonly PairedTestResult[];
    readonly holm: HolmResult;
    readonly bootstrap: Readonly<Record<BaselineId, { lo: number; hi: number }>>;
  };
  readonly calibration: CalibrationBlock;
  readonly mv: MVResultBlock;
  readonly decision: VerdictResult;
}

/**
 * Assemble the §14.1 ResultsJSON from already-computed inputs. PURE: no randomness,
 * no I/O, no recomputation of any gated quantity. Only reshapes (HoldoutPartition sets
 * → FamilyId[] arrays; seedMaster bigint → hex string) and embeds the calibrated
 * constants into `meta.calibrated` [v2].
 */
export function buildResultsJSON(input: ResultsInput): ResultsJSON {
  const { cfg, meta, calibrated, partition, perUser, tests, calibration, mv, decision } = input;

  return {
    meta: {
      seedMaster: `0x${cfg.seedMaster.toString(16)}`,
      N: cfg.N,
      nValid: meta.nValid,
      node: meta.node,
      timestampISO: meta.timestampISO,
      configHash: meta.configHash,
      calibrated: {
        thetaSurprise: calibrated.thetaSurprise,
        kappa: calibrated.kappa,
        trainComposite: calibrated.trainComposite,
      },
    },
    holdout: {
      trainFamilies: [...partition.trainFamilies],
      heldOutFamilies: [...partition.heldOutFamilies],
      heldOutContextCombos: [...partition.heldOutContextCombos],
    },
    perUser: perUser.map((u) => ({
      userId: u.userId,
      ssi: u.ssi,
      baselines: u.baselines,
      ssiNegControlSpecificity: u.ssiNegControlSpecificity,
    })),
    tests: {
      perBaseline: tests.perBaseline,
      holm: tests.holm,
      bootstrap: tests.bootstrap,
    },
    calibration,
    mv: {
      pPPC: mv.pPPC,
      ppcAdequate: mv.ppcAdequate,
      dElpdHier: mv.dElpdHier,
      dElpdFac: mv.dElpdFac,
      seHier: mv.seHier,
      material: mv.material,
      verdict: mv.verdict,
    },
    decision: {
      verdict: decision.verdict,
      rationale: decision.rationale,
      action: decision.action,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Small rendering helpers (deterministic; no I/O).
// ─────────────────────────────────────────────────────────────────────────────

/** Fixed-precision numeric formatting (deterministic; NaN/Infinity rendered honestly). */
function fmt(x: number, dp = 4): string {
  if (!Number.isFinite(x)) return String(x);
  return x.toFixed(dp);
}

/** Format a paired-test p-value with its exact/Monte-Carlo provenance (§7.4). */
function fmtP(t: PairedTestResult): string {
  return `${fmt(t.pValueRaw, 6)} (${t.exact ? "exact" : "monte-carlo"})`;
}

/** Mean of a numeric list (0 for empty — caller guarantees non-empty in the locked run). */
function mean(xs: readonly number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Ordered list of baseline ids present in the run (from the perBaseline test rows). */
function baselineOrder(r: ResultsJSON): readonly BaselineId[] {
  return r.tests.perBaseline.map((t) => t.baseline);
}

/** Mean SSI metric across users for a selector. */
function ssiMean(r: ResultsJSON, sel: (m: PerUserMetrics) => number): number {
  return mean(r.perUser.map((u) => sel(u.ssi)));
}

/** Mean baseline metric across users for a selector. */
function baseMean(r: ResultsJSON, b: BaselineId, sel: (m: PerUserMetrics) => number): number {
  return mean(r.perUser.map((u) => sel(u.baselines[b])));
}

/** Mean paired SSI−baseline difference across users for a sub-metric selector (§6.4/§7.1). */
function pairedSubDiff(r: ResultsJSON, b: BaselineId, sel: (m: PerUserMetrics) => number): number {
  return mean(r.perUser.map((u) => sel(u.ssi) - sel(u.baselines[b])));
}

// ─────────────────────────────────────────────────────────────────────────────
// §14.2 — REPORT.md renderer. Sections IN ORDER (PURE). [PAPER]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render the human-readable REPORT.md from a ResultsJSON. Sections, IN ORDER (§14.2):
 *   1. run metadata + configHash + the calibrated (θ*, κ*) and their TRAIN composite [v2]
 *   2. holdout partition
 *   3. per-baseline composite means + paired diffs + permutation p + margin pass
 *   4. Holm step-down table
 *   5. the three sub-metrics shown SEPARATELY (§6.4) with bootstrap CIs
 *   6. the MS mandatory-safety bucket per method (REPORTED, not gated) [v2 CHANGE (4)]
 *   7. calibration / reliability + ECE per method (§6.5)
 *   8. G1B-MV block (PPC p, ΔELPD_hier, ΔELPD_fac, materiality) on the coupled model [v2]
 *   9. final verdict mapped to §9.3 with action
 *  10. SELF-CHECK of pre-registered elements
 *  11. explicit pilot-grade-synthetic-evidence-only statement (human claim owed @ G5, N≥24)
 */
export function renderReportMarkdown(r: ResultsJSON): string {
  const baselines = baselineOrder(r);
  const out: string[] = [];

  // ── 1. Run metadata + configHash + calibrated (θ*, κ*) + TRAIN composite [v2] ─
  out.push("# G1B Falsifier — Run Report (v2)");
  out.push("");
  out.push("## 1. Run metadata");
  out.push("");
  out.push("| field | value |");
  out.push("|---|---|");
  out.push(`| seedMaster | \`${r.meta.seedMaster}\` |`);
  out.push(`| N (target) | ${r.meta.N} |`);
  out.push(`| nValid | ${r.meta.nValid} |`);
  out.push(`| node | ${r.meta.node} |`);
  out.push(`| timestamp (ISO) | ${r.meta.timestampISO} |`);
  out.push(`| configHash | \`${r.meta.configHash}\` |`);
  out.push("");
  out.push("**Calibrated constants (TRAIN-only selection, §5.2.1 / [v2 CHANGE (3)]):**");
  out.push("");
  out.push("| constant | value |");
  out.push("|---|---|");
  out.push(`| θ*_surprise (TRAIN-selected) | ${fmt(r.meta.calibrated.thetaSurprise)} |`);
  out.push(`| κ* (TRAIN-selected) | ${fmt(r.meta.calibrated.kappa)} |`);
  out.push(`| TRAIN composite (argmax objective) | ${fmt(r.meta.calibrated.trainComposite)} |`);
  out.push("");
  out.push(
    "_The operating point (θ*_surprise, κ*) is chosen by SSI's OWN §6 composite on the TRAIN split " +
      "ONLY — it consumes no randomness, no oracle labels, and no held-out cell (§5.2.1 absolute wall)._",
  );
  out.push("");

  // ── 2. Holdout partition ────────────────────────────────────────────────────
  out.push("## 2. Holdout partition (§5.1 no-peeking wall)");
  out.push("");
  out.push(`- **Train families:** ${r.holdout.trainFamilies.join(", ") || "(none)"}`);
  out.push(`- **Held-out families:** ${r.holdout.heldOutFamilies.join(", ") || "(none)"}`);
  out.push("- **Held-out context combos:**");
  if (r.holdout.heldOutContextCombos.length === 0) {
    out.push("  - (none)");
  } else {
    for (const c of r.holdout.heldOutContextCombos) {
      const ctx = JSON.stringify(c.context);
      out.push(`  - axis=\`${c.axis}\` level=${c.level} context=\`${ctx}\``);
    }
  }
  out.push("");

  // ── 3. Per-baseline composite means + paired diffs + permutation p + margin ──
  out.push("## 3. Per-baseline composite test (§6.4 / §7.1 / §7.4)");
  out.push("");
  out.push(`SSI mean composite (across users, D_disc): **${fmt(ssiMean(r, (m) => m.composite))}**`);
  out.push("");
  out.push("| baseline | mean composite | D̄ = SSI−base | permutation p (raw) | margin pass (≥δ) |");
  out.push("|---|---|---|---|---|");
  for (const t of r.tests.perBaseline) {
    const bm = baseMean(r, t.baseline, (m) => m.composite);
    out.push(
      `| ${t.baseline} | ${fmt(bm)} | ${fmt(t.meanDiff)} | ${fmtP(t)} | ${t.marginPass ? "✓" : "✗"} |`,
    );
  }
  out.push("");

  // ── 4. Holm step-down table ─────────────────────────────────────────────────
  out.push("## 4. Holm–Bonferroni step-down (§7.4, α-FWER)");
  out.push("");
  out.push("| baseline | p (raw) | Holm threshold α/(m−rank+1) | reject |");
  out.push("|---|---|---|---|");
  for (const row of r.tests.holm.perBaseline) {
    out.push(
      `| ${row.baseline} | ${fmt(row.pRaw, 6)} | ${fmt(row.pAdjThreshold, 6)} | ${row.reject ? "✓" : "✗"} |`,
    );
  }
  out.push("");
  out.push(`**All baselines rejected (H1 significance gate):** ${r.tests.holm.allReject ? "YES" : "NO"}`);
  out.push("");

  // ── 5. Three sub-metrics shown SEPARATELY with bootstrap CIs (§6.4 / §7.5) ───
  out.push("## 5. Sub-metrics shown separately (§6.4) with bootstrap CIs (§7.5)");
  out.push("");
  out.push(
    "SSI mean sub-metrics (across users, D_disc): " +
      `AQ=**${fmt(ssiMean(r, (m) => m.aq))}**, ` +
      `VoI=**${fmt(ssiMean(r, (m) => m.voi))}**, ` +
      `US=**${fmt(ssiMean(r, (m) => m.us))}**.`,
  );
  out.push("");
  out.push(
    "Per-baseline paired sub-metric differences (SSI − baseline). The bootstrap CI column is the " +
      "registered percentile CI on the **composite** D̄ (§7.5, reporting-only; the gate verdict is the " +
      "§7.4 permutation test + margin, never the CI — NOTES R2).",
  );
  out.push("");
  out.push("| baseline | ΔAQ | ΔVoI | ΔUS | composite D̄ | composite CI [2.5%, 97.5%] |");
  out.push("|---|---|---|---|---|---|");
  for (const b of baselines) {
    const dAQ = pairedSubDiff(r, b, (m) => m.aq);
    const dVoI = pairedSubDiff(r, b, (m) => m.voi);
    const dUS = pairedSubDiff(r, b, (m) => m.us);
    const dComp = pairedSubDiff(r, b, (m) => m.composite);
    const ci = r.tests.bootstrap[b];
    const ciStr = ci ? `[${fmt(ci.lo)}, ${fmt(ci.hi)}]` : "(n/a)";
    out.push(`| ${b} | ${fmt(dAQ)} | ${fmt(dVoI)} | ${fmt(dUS)} | ${fmt(dComp)} | ${ciStr} |`);
  }
  out.push("");

  // ── 6. MS mandatory-safety bucket per method (REPORTED, not gated) [v2 CHG 4] ─
  out.push("## 6. Mandatory-safety (MS) bucket per method (§6.1.1, [v2 CHANGE (4)] — REPORTED, NOT GATED)");
  out.push("");
  out.push(
    "The S6/AQ mandatory-safety cases (`D_safety`) are scored in a SEPARATE bucket, EXCLUDED " +
      "IDENTICALLY from the D_disc composite for **all** methods (SSI and every baseline). This bucket " +
      "is reported for transparency and **never enters the gate** — it cannot rescue or sink a verdict.",
  );
  out.push("");
  out.push("| method | mean MS (across users) |");
  out.push("|---|---|");
  out.push(`| SSI | ${fmt(ssiMean(r, (m) => m.ms))} |`);
  for (const b of baselines) {
    out.push(`| ${b} | ${fmt(baseMean(r, b, (m) => m.ms))} |`);
  }
  out.push("");

  // ── 7. Calibration / reliability + ECE per method (§6.5, diagnostic-only) ───
  out.push("## 7. Calibration / reliability + ECE per method (§6.5, DIAGNOSTIC — never gated)");
  out.push("");
  out.push("| method | surfacing ECE | abstention ECE |");
  out.push("|---|---|---|");
  out.push(`| SSI | ${fmt(r.calibration.ssi.surfacingECE)} | ${fmt(r.calibration.ssi.abstentionECE)} |`);
  for (const b of baselines) {
    const c = r.calibration[b];
    out.push(`| ${b} | ${fmt(c.surfacingECE)} | ${fmt(c.abstentionECE)} |`);
  }
  out.push("");
  out.push(
    "_Calibration is reported only (§6.5): a better-calibrated SSI at equal composite is informative " +
      "but does NOT rescue a failed gate; the gate is §6.4 composite + §7 test._",
  );
  out.push("");
  out.push("**SSI negative-control specificity per user (§7.6, H-NC bar ≥ 0.80):**");
  out.push("");
  out.push("| userId | NC specificity |");
  out.push("|---|---|");
  for (const u of r.perUser) {
    out.push(`| ${u.userId} | ${fmt(u.ssiNegControlSpecificity)} |`);
  }
  const ncMean = mean(r.perUser.map((u) => u.ssiNegControlSpecificity));
  out.push("");
  out.push(`Across-user mean NC specificity: **${fmt(ncMean)}**.`);
  out.push("");

  // ── 8. G1B-MV block on the COUPLED model (PPC p, ΔELPD_hier/fac, material) §8 ─
  out.push("## 8. G1B-MV — model-validity check on the coupled model (§8, [v2])");
  out.push("");
  out.push("| quantity | value |");
  out.push("|---|---|");
  out.push(`| PPC p-value (T_assoc) | ${fmt(r.mv.pPPC, 6)} |`);
  out.push(`| PPC adequate (in band) | ${r.mv.ppcAdequate ? "YES" : "NO"} |`);
  out.push(`| ΔELPD_hier (nats/fossil; richer hierarchical vs coupled) | ${fmt(r.mv.dElpdHier, 6)} |`);
  out.push(`| ΔELPD_fac (nats/fossil; factored vs coupled — coupling-needed) | ${fmt(r.mv.dElpdFac, 6)} |`);
  out.push(`| SE_hier (paired SE of ΔELPD_hier) | ${fmt(r.mv.seHier, 6)} |`);
  out.push(`| material (size AND reliability on M-hier) | ${r.mv.material ? "YES" : "NO"} |`);
  out.push(`| MV verdict | **${r.mv.verdict}** |`);
  out.push("");

  // ── 9. Final verdict mapped to §9.3 with action ─────────────────────────────
  out.push("## 9. Final verdict (§9.3 summary table)");
  out.push("");
  out.push(`- **Verdict:** **${r.decision.verdict}**`);
  out.push(`- **Rationale:** ${r.decision.rationale}`);
  out.push(`- **Action:** ${r.decision.action}`);
  out.push("");

  // ── 10. SELF-CHECK — each pre-registered element & that the code honors it ───
  out.push("## 10. SELF-CHECK — pre-registered elements honored");
  out.push("");
  const ncBar = 0.8; // §7.6 registered bar (rendered for the check; gate applied in §9)
  const selfChecks: readonly [string, string][] = [
    ["§2 axis/context/oracle structure", "oracles read θ_u + context only; method output never read (generative.ts §2)"],
    ["§3 five baselines (incl. coupled-ablation)", `tested: ${baselines.join(", ")}`],
    ["§4.0–§4.6 coupled belief core [v2 CHANGE (1)]", "single shared sparse-pairwise-coupled posterior consumed identically by SSI and baseline (v)"],
    ["§4.3–§4.7 SSI: aligned-EVSI + TRAIN calibration [v2 CHANGE (2)/(3)]", `θ*_surprise=${fmt(r.meta.calibrated.thetaSurprise)}, κ*=${fmt(r.meta.calibrated.kappa)} (TRAIN-only)`],
    ["§5.1 holdout no-peeking wall", `held-out families ${r.holdout.heldOutFamilies.join("/")} + ${r.holdout.heldOutContextCombos.length} context combo(s) committed before fitting`],
    ["§5.2.1 calibration wall", "calibrateOnTrain touched NO held-out cell (asserted upstream); calibrated constants reported §1"],
    ["§6.1.1 D_disc / D_safety split [v2 CHANGE (4)]", "MS bucket scored separately, excluded identically for all methods (table §6)"],
    ["§6.4 composite weights (0.40,0.40,0.20)", "composite = w_AQ·AQ + w_VoI·VoI + w_US·US over D_disc (metrics.ts)"],
    ["§6.5 calibration/ECE (diagnostic, never gated)", "surfacing+abstention ECE reported per method §7"],
    ["§7.1 unit of analysis = synthetic user", `${r.perUser.length} per-user composites; ${r.meta.nValid} valid`],
    ["§7.2 N=12, floor 8", `N=${r.meta.N}, nValid=${r.meta.nValid} (run invalid if <8 — handled upstream)`],
    ["§7.3 seed scheme (SEED_MASTER=0x5551B_0002, splittable PRNG)", `seedMaster=${r.meta.seedMaster}; bit-reproducible`],
    ["§7.4 exact paired sign-flip permutation + Holm α=0.05 + δ=0.05", `allReject=${r.tests.holm.allReject}; per-baseline margin pass shown §3`],
    ["§7.5 deterministic bootstrap CIs (reporting-only)", "composite percentile CIs shown §5; never gates"],
    ["§7.6 H-NC specificity bar ≥ 0.80", `across-user mean NC specificity=${fmt(ncMean)} (bar ${ncBar})`],
    ["§8 G1B-MV on coupled model (τ_MV, SE bar)", `PPC p=${fmt(r.mv.pPPC, 4)}; ΔELPD_hier=${fmt(r.mv.dElpdHier, 4)}; MV verdict=${r.mv.verdict}`],
    ["§9.3 ordered decision branches", `final verdict=${r.decision.verdict} mapped verbatim from the §9.3 table`],
  ];
  out.push("| pre-registered element | how this run honors it |");
  out.push("|---|---|");
  for (const [k, v] of selfChecks) {
    out.push(`| ${k} | ${v} |`);
  }
  out.push("");

  // ── 11. Pilot-grade synthetic-evidence-only statement (§1.5 / §6.6) ─────────
  out.push("## 11. Evidentiary status (READ THIS)");
  out.push("");
  out.push(
    "**This result is PILOT-GRADE SYNTHETIC EVIDENCE ONLY.** Every oracle label " +
      "(`worth_surfacing`, `answer_changes_IR`) and therefore every metric here is defined by the §2 " +
      "synthetic generative model, **not by humans**. A G1B pass clears (or a fail blocks) the cheap " +
      "synthetic falsifier so heavier build phases are gated honestly — it does **not** establish the " +
      "human claim.",
  );
  out.push("");
  out.push(
    "**The human claim is owed at G5, not G1B.** The powered, human-grounded standard is " +
      "**N ≥ 24 real musicians** with real fossils, real engine, real usefulness ratings and real " +
      "answer-changing observations (§9 Phase 5). G1B's N ≥ 8 is explicitly pilot-grade (§5.6, §6.6). " +
      "No metric in this report should be read as establishing the human claim.",
  );
  out.push("");

  return out.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION-PHASE-ONLY writers. PATH-AWARE refusal of LOCKED files (§14 [GATE]).
//
// Refuses to overwrite:
//   • the FOUR locked spec docs (distinct basenames): PRE-REGISTRATION.md,
//     HARNESS-SPEC.md, PRE-REGISTRATION-v2.md, HARNESS-SPEC-v2.md.
//   • the V1 artifacts (permanent record of attempt 1): <…>/artifacts/results.json
//     and <…>/artifacts/REPORT.md — identified by their PARENT directory being exactly
//     `artifacts` (NOT `artifacts-v2`), so the intended v2 outputs in `artifacts-v2/`
//     (which share the basenames `results.json` / `REPORT.md`) are STILL PERMITTED.
// ─────────────────────────────────────────────────────────────────────────────

/** The four locked spec documents that must NEVER be overwritten (§9.4 / FREEZE-v2.txt). */
const LOCKED_MD_BASENAMES: ReadonlySet<string> = new Set([
  "PRE-REGISTRATION.md",
  "HARNESS-SPEC.md",
  "PRE-REGISTRATION-v2.md",
  "HARNESS-SPEC-v2.md",
]);

/** v1 artifact filenames that are locked WHEN under a directory literally named `artifacts`. */
const V1_ARTIFACT_BASENAMES: ReadonlySet<string> = new Set(["results.json", "REPORT.md"]);

/**
 * Throw if a write target collides with a LOCKED artifact (output integrity [GATE]).
 * Path-aware: distinguishes v1 `artifacts/` from the permitted v2 `artifacts-v2/`.
 */
function assertNotLocked(path: string): void {
  const abs = resolve(path);
  const base = basename(abs);

  // (a) the four locked spec documents — refuse by (distinct) basename.
  if (LOCKED_MD_BASENAMES.has(base)) {
    throw new Error(
      `report: refusing to overwrite LOCKED spec file '${path}' (§14 output integrity; FREEZE-v2.txt).`,
    );
  }

  // (b) the v1 artifacts — refuse ONLY when the immediate parent directory is exactly
  //     `artifacts` (the v1 dir), NOT `artifacts-v2` (the permitted v2 output dir).
  const parentDir = basename(dirname(abs));
  if (parentDir === "artifacts" && V1_ARTIFACT_BASENAMES.has(base)) {
    throw new Error(
      `report: refusing to overwrite LOCKED v1 artifact '${path}' (permanent record of attempt 1; ` +
        `§14 output integrity). v2 outputs must go to 'artifacts-v2${sep}'.`,
    );
  }
}

/** Write the §14.1 results.json (execution phase only). Pretty-printed, stable key order. */
export function writeResults(path: string, r: ResultsJSON): void {
  assertNotLocked(path);
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true }); // ensure output dir exists (determinism re-run deletes artifacts-v2/)
  writeFileSync(abs, JSON.stringify(r, null, 2) + "\n", "utf8");
}

/** Write the §14.2 REPORT.md (execution phase only). */
export function writeReport(path: string, md: string): void {
  assertNotLocked(path);
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true }); // ensure output dir exists (determinism re-run deletes artifacts-v2/)
  writeFileSync(abs, md.endsWith("\n") ? md : md + "\n", "utf8");
}
