// ─────────────────────────────────────────────────────────────────────────────
// src/report.ts — Results JSON + human-readable REPORT.md (HARNESS-SPEC §14).
//
// Renders exactly the two run artifacts, EXACTLY per the §14.1 declared shape:
//   • g1b/artifacts/results.json  — full machine-readable run object.
//   • g1b/artifacts/REPORT.md     — human-readable report (sections IN ORDER §14.2).
//
// Design:
//   • `buildResultsJSON` is PURE: it assembles the frozen §14.1 ResultsJSON from
//     already-computed inputs (no randomness, no I/O, no recomputation of gated
//     quantities). It only reshapes (e.g. HoldoutPartition sets → FamilyId[] arrays).
//   • `renderReportMarkdown` is PURE: it produces a Markdown string from ResultsJSON.
//   • `writeResults` / `writeReport` perform file I/O and are EXECUTION-PHASE ONLY
//     (§14 output integrity [GATE]). They refuse to overwrite the two LOCKED files
//     (PRE-REGISTRATION.md, HARNESS-SPEC.md).
//
// NOTES (spec-ambiguity interpretations — declared here, no new registered parameters):
//   R1. configHash / node / timestampISO are RUN-ENVIRONMENT inputs, not registered
//       parameters. They are supplied by the caller (run.ts) so this module stays pure
//       and deterministic. seedMaster is rendered from cfg as a hex string `0x…`.
//   R2. The §14.1 `tests.bootstrap` JSON field carries ONE {lo,hi} per baseline — the
//       reported percentile CI on the COMPOSITE paired difference D̄^{(b)} (§7.5). §14.2
//       additionally asks the three sub-metrics (AQ/VoI/US) be shown "separately with
//       bootstrap CIs". The frozen JSON shape only stores the composite CI, so the report
//       renders the three sub-metric paired-difference MEANS separately (computed from the
//       per-user data already in ResultsJSON) and shows the composite bootstrap CI beside
//       them. No extra JSON fields are invented (the §14.1 shape is honored EXACTLY).
//   R3. `nValid` (number of valid synthetic users, §7.2 floor check) is supplied by the
//       caller; if `nValid < NFloor` the run is INVALID (handled upstream in run.ts), but
//       the report still renders the recorded counts honestly.
//   R4. The §9.3 verdict→action mapping is rendered VERBATIM from the supplied
//       VerdictResult (decision.ts already mirrors the §9.3 table strings); the report does
//       not re-derive the verdict (single source of truth = decision.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, basename, dirname } from "node:path";

import type { FamilyId, HeldOutContextCombo, HoldoutPartition, LockedConfig } from "./types.js";
import type { BaselineId } from "./baselines.js";
import type { PerUserMetrics } from "./metrics.js";
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
  };
  readonly holdout: {
    trainFamilies: FamilyId[];
    heldOutFamilies: FamilyId[];
    heldOutContextCombos: HeldOutContextCombo[];
  };
  readonly perUser: readonly {
    userId: number;
    ssi: PerUserMetrics;
    baselines: Readonly<Record<BaselineId, PerUserMetrics>>;
    ssiNegControlSpecificity: number;
  }[];
  readonly tests: {
    perBaseline: readonly PairedTestResult[];
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
    dElpdPair: number;
    dElpdHier: number;
    seBest: number;
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
  /** Host/node identifier (e.g. os.hostname()), supplied by run.ts. */
  readonly node: string;
  /** ISO-8601 run timestamp, supplied by run.ts. */
  readonly timestampISO: string;
  /** Deterministic hash of the locked CONFIG, supplied by run.ts (audit trail). */
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

/** G1B-MV materiality block (§8). */
export interface MVResultBlock {
  readonly pPPC: number;
  readonly ppcAdequate: boolean;
  readonly dElpdPair: number;
  readonly dElpdHier: number;
  readonly seBest: number;
  readonly material: boolean;
  readonly verdict: MVVerdict;
}

/** All computed inputs to buildResultsJSON (every quantity is computed in §5–§9). */
export interface ResultsInput {
  readonly cfg: LockedConfig;
  readonly meta: RunMeta;
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
 * → FamilyId[] arrays; seedMaster bigint → hex string).
 */
export function buildResultsJSON(input: ResultsInput): ResultsJSON {
  const { cfg, meta, partition, perUser, tests, calibration, mv, decision } = input;

  return {
    meta: {
      seedMaster: `0x${cfg.seedMaster.toString(16)}`,
      N: cfg.N,
      nValid: meta.nValid,
      node: meta.node,
      timestampISO: meta.timestampISO,
      configHash: meta.configHash,
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
    mv,
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
 *   1. run metadata + configHash
 *   2. holdout partition
 *   3. per-baseline composite means + paired diffs + permutation p + margin pass
 *   4. Holm step-down table
 *   5. the three sub-metrics shown SEPARATELY (§6.4) with bootstrap CIs
 *   6. calibration / reliability + ECE per method (§6.5)
 *   7. G1B-MV block (PPC p, ΔELPD, materiality) (§8)
 *   8. final verdict mapped to §9.3 with action
 *   9. SELF-CHECK of pre-registered elements
 *  10. explicit pilot-grade-synthetic-evidence-only statement (human claim owed @ G5, N≥24)
 */
export function renderReportMarkdown(r: ResultsJSON): string {
  const baselines = baselineOrder(r);
  const out: string[] = [];

  // ── 1. Run metadata + configHash ──────────────────────────────────────────
  out.push("# G1B Falsifier — Run Report");
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
  out.push(`SSI mean composite (across users): **${fmt(ssiMean(r, (m) => m.composite))}**`);
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
    "SSI mean sub-metrics (across users): " +
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

  // ── 6. Calibration / reliability + ECE per method (§6.5, diagnostic-only) ───
  out.push("## 6. Calibration / reliability + ECE per method (§6.5, DIAGNOSTIC — never gated)");
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

  // ── 7. G1B-MV block (PPC p, ΔELPD, materiality) (§8) ────────────────────────
  out.push("## 7. G1B-MV — model-validity check (§8)");
  out.push("");
  out.push("| quantity | value |");
  out.push("|---|---|");
  out.push(`| PPC p-value (T_assoc) | ${fmt(r.mv.pPPC, 6)} |`);
  out.push(`| PPC adequate (in band) | ${r.mv.ppcAdequate ? "YES" : "NO"} |`);
  out.push(`| ΔELPD pair (nats/fossil) | ${fmt(r.mv.dElpdPair, 6)} |`);
  out.push(`| ΔELPD hier (nats/fossil) | ${fmt(r.mv.dElpdHier, 6)} |`);
  out.push(`| SE (best ΔELPD) | ${fmt(r.mv.seBest, 6)} |`);
  out.push(`| material (size AND reliability) | ${r.mv.material ? "YES" : "NO"} |`);
  out.push(`| MV verdict | **${r.mv.verdict}** |`);
  out.push("");

  // ── 8. Final verdict mapped to §9.3 with action ─────────────────────────────
  out.push("## 8. Final verdict (§9.3 summary table)");
  out.push("");
  out.push(`- **Verdict:** **${r.decision.verdict}**`);
  out.push(`- **Rationale:** ${r.decision.rationale}`);
  out.push(`- **Action:** ${r.decision.action}`);
  out.push("");

  // ── 9. SELF-CHECK — each pre-registered element & that the code honors it ────
  out.push("## 9. SELF-CHECK — pre-registered elements honored");
  out.push("");
  const ncBar = 0.8; // §7.6 registered bar (rendered for the check; gate applied in §9)
  const selfChecks: readonly [string, string][] = [
    ["§2 axis/context/oracle structure", "oracles read θ_u + context only; method output never read (generative.ts §2.6)"],
    ["§3 five baselines", `tested: ${baselines.join(", ")}`],
    ["§4 SSI constants (α_base, θ_surprise, κ, B=3, IR*)", "SSI is analytic & seed-free (§4.7); constants from frozen CONFIG"],
    ["§5.1 holdout no-peeking wall", `held-out families ${r.holdout.heldOutFamilies.join("/")} + ${r.holdout.heldOutContextCombos.length} context combo(s) committed before fitting`],
    ["§5.3 evaluation-set rates", "per-user eval cases generated at registered rates (generative.ts)"],
    ["§6.4 composite weights (0.40,0.40,0.20)", "composite = w_AQ·AQ + w_VoI·VoI + w_US·US (metrics.ts)"],
    ["§6.5 calibration/ECE (diagnostic, never gated)", "surfacing+abstention ECE reported per method above"],
    ["§7.1 unit of analysis = synthetic user", `${r.perUser.length} per-user composites; ${r.meta.nValid} valid`],
    ["§7.2 N=12, floor 8", `N=${r.meta.N}, nValid=${r.meta.nValid} (run invalid if <8 — handled upstream)`],
    ["§7.3 seed scheme (SEED_MASTER, splittable PRNG)", `seedMaster=${r.meta.seedMaster}; bit-reproducible`],
    ["§7.4 exact paired sign-flip permutation + Holm α=0.05 + δ=0.05", `allReject=${r.tests.holm.allReject}; per-baseline margin pass shown §3`],
    ["§7.5 deterministic bootstrap CIs (reporting-only)", "composite percentile CIs shown §5; never gates"],
    ["§7.6 H-NC specificity bar ≥ 0.80", `across-user mean NC specificity=${fmt(ncMean)} (bar ${ncBar})`],
    ["§8 G1B-MV (τ_MV=0.02 nats/obs, 4·SE bar)", `PPC p=${fmt(r.mv.pPPC, 4)}; MV verdict=${r.mv.verdict}`],
    ["§9.3 ordered decision branches", `final verdict=${r.decision.verdict} mapped verbatim from the §9.3 table`],
  ];
  out.push("| pre-registered element | how this run honors it |");
  out.push("|---|---|");
  for (const [k, v] of selfChecks) {
    out.push(`| ${k} | ${v} |`);
  }
  out.push("");

  // ── 10. Pilot-grade synthetic-evidence-only statement (§1.5 / §6.6) ─────────
  out.push("## 10. Evidentiary status (READ THIS)");
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
// EXECUTION-PHASE-ONLY writers. Refuse to overwrite the two LOCKED files (§14 [GATE]).
// ─────────────────────────────────────────────────────────────────────────────

/** Locked artifacts that must NEVER be overwritten by the harness (§9.4 / FREEZE.txt). */
const LOCKED_BASENAMES: ReadonlySet<string> = new Set(["PRE-REGISTRATION.md", "HARNESS-SPEC.md"]);

/** Throw if a write target collides with a locked artifact (output integrity [GATE]). */
function assertNotLocked(path: string): void {
  if (LOCKED_BASENAMES.has(basename(path))) {
    throw new Error(
      `report: refusing to overwrite LOCKED file '${path}' (§14 output integrity; FREEZE.txt).`,
    );
  }
}

/** Write the §14.1 results.json (execution phase only). Pretty-printed, stable key order. */
export function writeResults(path: string, r: ResultsJSON): void {
  assertNotLocked(path);
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true }); // ensure output dir exists (determinism re-run deletes artifacts/)
  writeFileSync(abs, JSON.stringify(r, null, 2) + "\n", "utf8");
}

/** Write the §14.2 REPORT.md (execution phase only). */
export function writeReport(path: string, md: string): void {
  assertNotLocked(path);
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true }); // ensure output dir exists (determinism re-run deletes artifacts/)
  writeFileSync(abs, md.endsWith("\n") ? md : md + "\n", "utf8");
}
