// src/run.ts — G1B Falsifier top-level orchestration (HARNESS-SPEC §15; PRE-REGISTRATION §7.3/§5.2/§9).
//
// The entry point that wires every module together in the LOCKED stream order and emits the two
// execution-phase artifacts (`artifacts/results.json`, `artifacts/REPORT.md`). This file contains
// orchestration and run-level guards ONLY — every number it reports is computed by the registered
// modules (config/prng/generative/holdout/posterior/ssi/baselines/metrics/stats/mv/decision/report).
// It introduces NO parameter not already frozen in PRE-REGISTRATION §9.4.
//
// HOW TO RUN (Node 24, native type-stripping, no external libs, no build step — HARNESS-SPEC §0):
//     node --experimental-strip-types src/run.ts
//
// LOADING MODEL: the G1B modules value-import each other with NodeNext `.js` specifiers, which
// native type-stripping does not rewrite to the on-disk `.ts` source. As the test harness does,
// this entry point registers the in-repo `./test/resolve-ts.ts` resolution hook FIRST and then
// dynamically imports the real, unmodified source modules so the hook is already active.
//
// LOCKED SEQUENCE (asserted below, HARNESS-SPEC §15 / PRE-REG §7.3):
//   assertConfigInvariants
//     -> buildPartition("holdout-partition")        (FIRST consumer of randomness; §5.2 wall)
//     -> sampleUser×N ("users/u")
//     -> generateCases train/eval ("fitting-data","evaluation")
//     -> assertWall                                  (BEFORE any decision; §5.2)
//     -> fit baselines (TRAIN only; §5.2)
//     -> ssiDecide + baseline.decide per user
//     -> perUserMetrics
//     -> permutationTest×5 + holmStepDown + bootstrapCI
//     -> mv (ppcCheck + compareModels + mvVerdict)
//     -> decideVerdict
//     -> buildResultsJSON -> writeResults -> renderReportMarkdown -> writeReport
//
// RUN-LEVEL GUARDS (HARNESS-SPEC §15; PRE-REG §7.3/§5.2/§9):
//   (a) streams are consumed in the locked order (derived from CONFIG.seedMaster by §7.3 label);
//   (b) assertWall passes BEFORE any decision is made;
//   (c) fewer than NFloor=8 valid users ⇒ the run is INVALID (regenerate under the seed), NOT a FAIL;
//   (d) SEED_MASTER is read from CONFIG and is NEVER overridden by results;
//   (e) any robustness seed-sweep is secondary/descriptive and cannot change the SEED_MASTER verdict
//       (this entry point runs the SEED_MASTER gate only; no sweep is performed here).
//
// NOTES (spec-ambiguity interpretations — NO new parameters; nothing here tunes the experiment):
//   RUN1. "Valid user" (§7.2 floor). The spec fixes N=12 and the NFloor=8 pilot floor but leaves
//         the per-user validity predicate to the harness. A user is counted VALID iff it produced
//         at least one evaluation case AND every per-method composite computed on it is finite.
//         At the registered rates generateCases always yields casesPerUser>0, so all N are valid;
//         the predicate exists solely to honor guard (c) defensively. Invalid runs raise a distinct
//         INVALID condition (exit code 2) — NOT a FAIL verdict.
//   RUN2. Stream disambiguation for the single "loo" label. PRE-REG §7.3 lists six ordered labels;
//         prng.ts additionally exposes the locked "ppc" and "loo" labels consumed by mv.ts (§8.1).
//         Both the loo-classifier baseline (§3.4) and the G1B-MV model comparison (§8.2) are "loo"
//         consumers; they are kept independent yet reproducible by salting the SAME locked label
//         ("loo","baseline") vs ("loo","mv") — salting is part of the prng derivation contract and
//         introduces no new stream label or parameter.
//   RUN3. configHash / node / timestampISO are RUN-ENVIRONMENT inputs, not registered parameters
//         (report.ts NOTE R1). configHash is a deterministic SHA-256 over a stable serialization of
//         the frozen CONFIG (bigint→hex), so it is bit-reproducible at SEED_MASTER. node and the
//         timestamp may be pinned via the G1B_NODE / G1B_TIMESTAMP environment variables so two
//         runs can produce byte-identical results.json for the §16 determinism check; absent the
//         overrides they fall back to os.hostname() and the wall clock (audit-trail only, ungated).
//   RUN4. Output-integrity guard (§14 [GATE]). writeResults/writeReport already refuse to overwrite
//         PRE-REGISTRATION.md / HARNESS-SPEC.md; this entry point additionally writes ONLY under
//         artifacts/ and re-asserts the two locked targets are never the write destinations.

import { register } from "node:module";
import { hostname } from "node:os";
import { createHash } from "node:crypto";
import { resolve, basename } from "node:path";

// Register the `.js → .ts` resolution hook BEFORE importing any source module (see LOADING MODEL).
register("./test/resolve-ts.ts", import.meta.url);

// ── Types (erased at runtime; safe to static-import) ─────────────────────────
import type { ConsequenceCase, FamilyId, LockedConfig, SyntheticUser } from "./types.js";
import type { Rng, StreamLabel } from "./prng.js";
import type { HoldoutPartition } from "./types.js";
import type { Baseline, BaselineId } from "./baselines.js";
import type { PerUserMetrics } from "./metrics.js";
import type { PairedTestResult } from "./stats.js";
import type { MVVerdict } from "./mv.js";
import type { PerUserResult, ResultsInput } from "./report.js";

// ── Real, unmodified source modules (dynamic import so the hook is already active) ──
const { CONFIG, assertConfigInvariants } = await import("./config.js");
const { deriveStream } = await import("./prng.js");
const { sampleUser, generateCases } = await import("./generative.js");
const { buildPartition, assertWall } = await import("./holdout.js");
const { ssiDecide } = await import("./ssi.js");
const { allBaselines } = await import("./baselines.js");
const {
  perUserMetrics,
  negControlSpecificity,
  surfacingReliability,
  abstentionReliability,
} = await import("./metrics.js");
const { permutationTest, holmStepDown, bootstrapCI } = await import("./stats.js");
const { ppcCheck, compareModels, mvVerdict } = await import("./mv.js");
const { decideVerdict } = await import("./decision.js");
const { buildResultsJSON, renderReportMarkdown, writeResults, writeReport } = await import(
  "./report.js"
);

// ─────────────────────────────────────────────────────────────────────────────
// Run-environment helpers (NOTE RUN3) — deterministic, ungated.
// ─────────────────────────────────────────────────────────────────────────────

/** Stable serialization of the frozen CONFIG with bigint → hex, for a reproducible configHash. */
function configHashOf(cfg: LockedConfig): string {
  const json = JSON.stringify(cfg, (_k, v) => (typeof v === "bigint" ? `0x${v.toString(16)}` : v));
  return createHash("sha256").update(json, "utf8").digest("hex");
}

/** A locked stream derived purely from CONFIG.seedMaster by its §7.3 label (+ optional salt). */
function stream(label: StreamLabel, ...salt: (string | number)[]): Rng {
  return deriveStream(CONFIG.seedMaster, label, ...salt);
}

/** Distinct INVALID-run signal (guard c): below the pilot floor ⇒ regenerate, NOT a FAIL. */
class InvalidRunError extends Error {}

// ─────────────────────────────────────────────────────────────────────────────
// main() — the locked orchestration (HARNESS-SPEC §15).
// ─────────────────────────────────────────────────────────────────────────────

export async function main(): Promise<void> {
  // ── Step 0: validate the locked parameter object; fail the run on any violation (§3/§9.4). ──
  assertConfigInvariants(CONFIG);
  const cfg = CONFIG; // guard (d): SEED_MASTER is read from CONFIG and never overridden.

  // ── Step 1: holdout partition — FIRST consumer of randomness, before any fitting data (§5.2). ──
  const partition: HoldoutPartition = buildPartition(cfg, stream("holdout-partition"));

  // ── Step 2: sample N users (§2.3) on the "users" stream; per-user sub-streams hash(seed,u). ──
  const usersRng = stream("users");
  const users: SyntheticUser[] = [];
  for (let u = 0; u < cfg.N; u++) {
    users.push(sampleUser(cfg, usersRng, u));
  }

  // ── Step 3: generate TRAIN/EVAL cases (§5.3) on the "fitting-data" + "evaluation" streams. ──
  const fitRng = stream("fitting-data");
  const evalRng = stream("evaluation");
  const trainByUser: ConsequenceCase[][] = [];
  const evalByUser: ConsequenceCase[][] = [];
  for (const user of users) {
    const { train, eval: ev } = generateCases(cfg, partition, evalRng, fitRng, user);
    trainByUser.push([...train]);
    evalByUser.push([...ev]);
  }
  const allTrain: ConsequenceCase[] = trainByUser.flat();

  // ── Step 4: the no-peeking WALL must pass BEFORE any decision is made (guard b, §5.2). ──
  assertWall(allTrain, partition);

  // ── Guard (c): count VALID users (NOTE RUN1) BEFORE deciding; below NFloor ⇒ INVALID run. ──
  const validIdx: number[] = users
    .map((_, i) => i)
    .filter((i) => evalByUser[i]!.length > 0);
  if (validIdx.length < cfg.NFloor) {
    throw new InvalidRunError(
      `INVALID run: only ${validIdx.length} valid users < NFloor=${cfg.NFloor} (§7.2). ` +
        `Regenerate under SEED_MASTER; this is NOT a FAIL verdict.`,
    );
  }

  // ── Step 5: fit the five baselines on the TRAIN split ONLY (§5.2). ──
  const baselines: readonly Baseline[] = allBaselines(cfg, stream("loo", "baseline"));
  for (const b of baselines) {
    b.fit(cfg, allTrain, users);
  }
  const baselineIds: readonly BaselineId[] = baselines.map((b) => b.id);

  // ── Step 6: per-user decisions (SSI + each baseline) and per-user metrics (§6.4). ──
  const ssiComposite: number[] = [];
  const baseComposite: Record<BaselineId, number[]> = Object.fromEntries(
    baselineIds.map((id) => [id, [] as number[]]),
  ) as Record<BaselineId, number[]>;
  const perUserRows: PerUserResult[] = [];

  // Pooled (per-case) score/label streams for the diagnostic calibration curves (§6.5).
  const ssiDecisionsAll: { dec: ReturnType<typeof ssiDecide>; cases: ConsequenceCase[] }[] = [];
  const baseDecisionsAll: Record<
    BaselineId,
    { dec: ReturnType<Baseline["decide"]>; cases: ConsequenceCase[] }[]
  > = Object.fromEntries(baselineIds.map((id) => [id, []])) as Record<
    BaselineId,
    { dec: ReturnType<Baseline["decide"]>; cases: ConsequenceCase[] }[]
  >;

  for (const i of validIdx) {
    const user = users[i]!;
    const cases = evalByUser[i]!;

    const ssiDec = ssiDecide(cfg, user, cases);
    const ssiM = perUserMetrics(cfg, ssiDec, cases);
    ssiComposite.push(ssiM.composite);
    ssiDecisionsAll.push({ dec: ssiDec, cases });

    const baseMetrics: Record<BaselineId, PerUserMetrics> = {} as Record<BaselineId, PerUserMetrics>;
    for (const b of baselines) {
      const bDec = b.decide(cfg, user, cases);
      const bM = perUserMetrics(cfg, bDec, cases);
      baseMetrics[b.id] = bM;
      baseComposite[b.id]!.push(bM.composite);
      baseDecisionsAll[b.id]!.push({ dec: bDec, cases });
    }

    perUserRows.push({
      userId: user.id,
      ssi: ssiM,
      baselines: baseMetrics,
      ssiNegControlSpecificity: negControlSpecificity(ssiDec, cases),
    });
  }

  // ── Step 7: the exact paired permutation test ×5 + Holm step-down + bootstrap CIs (§7). ──
  const permRng = stream("permutation"); // unused at N≤permExactMaxN (exact); recorded per §7.3.
  const bootRng = stream("bootstrap");
  const perBaseline: PairedTestResult[] = [];
  const bootstrap: Record<BaselineId, { lo: number; hi: number }> = {} as Record<
    BaselineId,
    { lo: number; hi: number }
  >;
  for (const id of baselineIds) {
    const diffs = ssiComposite.map((s, u) => s - baseComposite[id]![u]!);
    const pt = permutationTest(cfg, diffs, permRng);
    perBaseline.push({
      baseline: id,
      meanDiff: pt.meanDiff,
      pValueRaw: pt.p,
      marginPass: pt.meanDiff >= cfg.deltaComposite,
      exact: pt.exact,
    });
    bootstrap[id] = bootstrapCI(cfg, diffs, bootRng);
  }
  const holm = holmStepDown(
    cfg,
    perBaseline.map((t) => ({ baseline: t.baseline, p: t.pValueRaw })),
  );

  // ── Step 8: G1B-MV sub-gate — PPC adequacy + LOO model comparison + verdict (§8). ──
  const ppc = ppcCheck(cfg, users, stream("ppc"));
  const cmp = compareModels(cfg, users, stream("loo", "mv"));
  const mvV: MVVerdict = mvVerdict(cfg, { adequate: ppc.adequate }, cmp);

  // ── Step 9: diagnostic calibration / reliability ECE per method (§6.5; never gated). ──
  const eceOf = (
    rows: { dec: readonly { caseId: number; surface: 0 | 1; score: number }[]; cases: ConsequenceCase[] }[],
  ): { surfacingECE: number; abstentionECE: number } => {
    const dec = rows.flatMap((r) => r.dec);
    const cases = rows.flatMap((r) => r.cases);
    return {
      surfacingECE: surfacingReliability(cfg, dec, cases).ece,
      abstentionECE: abstentionReliability(cfg, dec, cases).ece,
    };
  };
  const calibration = {
    ssi: eceOf(ssiDecisionsAll),
    ...(Object.fromEntries(baselineIds.map((id) => [id, eceOf(baseDecisionsAll[id]!)])) as Record<
      BaselineId,
      { surfacingECE: number; abstentionECE: number }
    >),
  } as ResultsInput["calibration"];

  // ── Step 10: the ordered §9 decision rule. ──
  const h1Pass = perBaseline.every((t) => t.marginPass) && holm.allReject; // all 5 clear δ + Holm.
  const faRow = perBaseline.find((t) => t.baseline === "factored-ablation")!;
  const faHolm = holm.perBaseline.find((h) => h.baseline === "factored-ablation")!;
  const ablationTie = faRow.meanDiff < cfg.deltaComposite || !faHolm.reject; // §9.1 ablation tie.
  const ncMean =
    perUserRows.reduce((a, r) => a + r.ssiNegControlSpecificity, 0) / perUserRows.length;
  const ncPass = ncMean >= cfg.ncSpecificityBar; // §7.6 H-NC across-user specificity bar.

  const decision = decideVerdict(cfg, {
    holm,
    perBaseline,
    h1Pass,
    ablationTie,
    ncPass,
    mv: mvV,
    mvRemedyApplied: false, // single automated SEED_MASTER run: no coupling re-run / claim reduction.
  });

  // ── Step 11: assemble the §14.1 ResultsJSON (PURE reshape; no recomputation). ──
  const node = process.env.G1B_NODE ?? hostname();
  const timestampISO = process.env.G1B_TIMESTAMP ?? new Date().toISOString();
  const input: ResultsInput = {
    cfg,
    meta: { nValid: validIdx.length, node, timestampISO, configHash: configHashOf(cfg) },
    partition,
    perUser: perUserRows,
    tests: { perBaseline, holm, bootstrap },
    calibration,
    mv: {
      pPPC: ppc.pPPC,
      ppcAdequate: ppc.adequate,
      dElpdPair: cmp.dElpdPair,
      dElpdHier: cmp.dElpdHier,
      seBest: cmp.seBest,
      material: cmp.material,
      verdict: mvV,
    },
    decision,
  };
  const results = buildResultsJSON(input);

  // ── Step 12: emit the two execution-phase artifacts (output-integrity guard, NOTE RUN4). ──
  const outDir = resolve("artifacts");
  const resultsPath = resolve(outDir, "results.json");
  const reportPath = resolve(outDir, "REPORT.md");
  assertWritableTarget(resultsPath);
  assertWritableTarget(reportPath);
  writeResults(resultsPath, results);
  writeReport(reportPath, renderReportMarkdown(results));

  // Console summary (audit trail; not an artifact).
  // eslint-disable-next-line no-console
  console.log(
    `G1B run complete @ SEED_MASTER=0x${cfg.seedMaster.toString(16)}: ` +
      `nValid=${validIdx.length}/${cfg.N}, verdict=${decision.verdict}.`,
  );
  // eslint-disable-next-line no-console
  console.log(`  -> ${resultsPath}`);
  // eslint-disable-next-line no-console
  console.log(`  -> ${reportPath}`);
}

/** Guard (NOTE RUN4): refuse to ever write to the two LOCKED pre-registration files. */
function assertWritableTarget(path: string): void {
  const b = basename(path).toLowerCase();
  if (b === "pre-registration.md" || b === "harness-spec.md") {
    throw new Error(`run.ts: refusing to overwrite the locked pre-registration file '${path}' (§14 [GATE]).`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point. INVALID runs (guard c) exit 2; any other failure exits 1; success exits 0.
// ─────────────────────────────────────────────────────────────────────────────
await main().catch((err: unknown) => {
  if (err instanceof InvalidRunError) {
    // eslint-disable-next-line no-console
    console.error(String(err.message));
    process.exit(2); // INVALID (regenerate) — distinct from a FAIL verdict (§7.2).
  }
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
