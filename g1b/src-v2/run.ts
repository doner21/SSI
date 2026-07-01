// src-v2/run.ts — G1B-v2 Falsifier top-level orchestration (HARNESS-SPEC-v2 §15; PRE-REG-v2 §7.3/§5.2/§5.2.1/§9).
//
// The entry point that wires every v2 module together in the LOCKED stream order and emits the two
// execution-phase artifacts (`artifacts-v2/results.json`, `artifacts-v2/REPORT.md`). This file
// contains orchestration and run-level guards ONLY — every number it reports is computed by the
// registered modules (config/prng/generative/holdout/posterior/ssi/baselines/metrics/stats/mv/
// decision/report). It introduces NO parameter not already frozen in PRE-REGISTRATION-v2 §9.4.
//
// HOW TO RUN (Node 24, native type-stripping, no external libs, no build step — HARNESS-SPEC-v2 §0):
//     node --experimental-strip-types g1b/src-v2/run.ts
//
// LOADING MODEL: the G1B modules value-import each other with NodeNext `.js` specifiers, which
// native type-stripping does not rewrite to the on-disk `.ts` source. As the test harness does,
// this entry point registers the in-repo `./test/resolve-ts.ts` resolution hook FIRST and then
// dynamically imports the real, unmodified source modules so the hook is already active.
//
// LOCKED SEQUENCE (asserted below, HARNESS-SPEC-v2 §15 / PRE-REG-v2 §7.3 — [v2] calibration is
// inserted in the FITTING phase and consumes ONLY "fitting-data" before "evaluation" opens):
//   assertConfigInvariants  (incl. seedMaster === 0x5551B_0002n)
//     -> buildPartition("holdout-partition")          (FIRST consumer of randomness; §5.2 wall)
//     -> sampleUser×N ("users/u")
//     -> generateCases train ("fitting-data")          [TRAIN cases only]
//     -> assertWall(train, partition)                  [§5.2 wall BEFORE any fit/calibration]
//     -> fit baselines (ii)–(v) on TRAIN
//     -> calibrateOnTrain(SSI) on TRAIN                ([v2 CHANGE (3)]; deterministic; held-out-free)
//     -> assertCalibrationWall(trainUsed, partition)   [§5.2.1 ABSOLUTE wall before "evaluation"]
//     -> generateCases eval ("evaluation")             [held-out families/contexts ONLY enter here]
//     -> assertWall(eval-recheck via split tags)       [§5.2 re-check]
//     -> ssiDecide(cal) + baseline.decide per user
//     -> partitionCases -> perUserMetrics (D_disc composite + D_safety MS)  ([v2 CHANGE (4)])
//     -> permutationTest×5 + holmStepDown + bootstrapCI
//     -> mv (ppcCheck + compareModels(M-cpl,M-hier,M-fac) + mvVerdict)
//     -> decideVerdict
//     -> buildResultsJSON -> writeResults(results.json) + renderReportMarkdown -> writeReport(REPORT.md)
//
// RUN-LEVEL GUARDS (HARNESS-SPEC-v2 §15; PRE-REG-v2 §7.3/§5.2/§5.2.1/§9) [GATE]:
//   (a) streams are consumed in the locked order (derived from CONFIG.seedMaster by §7.3 label);
//   (b) assertWall AND assertCalibrationWall pass BEFORE any decision and before "evaluation" opens
//       — calibration touching a held-out cell INVALIDATES the run (not a FAIL verdict);
//   (c) fewer than NFloor=8 valid users ⇒ the run is INVALID (regenerate under the seed), NOT a FAIL;
//   (d) SEED_MASTER = 0x5551B_0002 is read from CONFIG and is NEVER overridden by results;
//   (e) NO seed-shopping — one run; robustness sweeps are descriptive-only and cannot change the
//       verdict (§7.3). SSI consumes NO oracle labels in ssiDecide and NO held-out labels in
//       calibrateOnTrain (it optimizes its own §6 composite on TRAIN).
//
// NOTES (spec-ambiguity interpretations — NO new parameters; nothing here tunes the experiment):
//   RUN1. "Valid user" (§7.2 floor). A user is counted VALID iff it produced at least one
//         evaluation case AND every per-method composite computed on it is finite. At the
//         registered rates generateCases always yields casesPerUser>0, so all N are valid; the
//         predicate exists solely to honor guard (c). Invalid runs raise a distinct INVALID
//         condition (exit code 2) — NOT a FAIL verdict.
//   RUN2. Stream disambiguation for the single "loo" label. Both the loo-classifier baseline (§3.4)
//         and the G1B-MV model comparison (§8.2) are "loo" consumers; they are kept independent yet
//         reproducible by salting the SAME locked label ("loo","baseline") vs ("loo","mv") — salting
//         is part of the prng derivation contract and introduces no new stream label or parameter.
//   RUN3. configHash / node / timestampISO are RUN-ENVIRONMENT inputs, not registered parameters.
//         configHash is a deterministic SHA-256 over a stable serialization of the frozen CONFIG
//         (bigint→hex), so it is bit-reproducible at SEED_MASTER. node and the timestamp may be
//         pinned via G1B_NODE / G1B_TIMESTAMP so two runs can produce byte-identical results.json
//         for the §16 determinism check; absent the overrides they fall back to os.hostname() and
//         the wall clock (audit-trail only, ungated).
//   RUN4. [v2] Fitting/evaluation stream isolation. generative.generateCases derives its TRAIN
//         ("fitting-data") and EVAL ("evaluation") cases from two INDEPENDENT locked streams (each
//         per-user-forked by user.id). The byte order of stream derivation is therefore fixed by
//         the §7.3 labels and independent of call order. To honor the §5.2.1 absolute wall we never
//         let any EVAL case influence fitting/calibration: baselines are fit and SSI is calibrated
//         on `allTrain` ONLY, and assertCalibrationWall(allTrain) must pass BEFORE any EVAL case is
//         read by a decision. This satisfies "evaluation opens after the calibration wall passes".
//   RUN5. Output-integrity guard (§14 [GATE]). writeResults/writeReport already refuse to overwrite
//         the locked .md files; this entry point additionally writes ONLY under artifacts-v2/ and
//         re-asserts the locked pre-registration / harness-spec targets are never write destinations.

import { register } from "node:module";
import { hostname } from "node:os";
import { createHash } from "node:crypto";
import { resolve, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Register the `.js → .ts` resolution hook BEFORE importing any source module (see LOADING MODEL).
register("./test/resolve-ts.ts", import.meta.url);

// ── Types (erased at runtime; safe to static-import) ─────────────────────────
import type {
  ConsequenceCase,
  LockedConfig,
  SyntheticUser,
  HoldoutPartition,
  CalibratedConstants,
  MethodDecision,
} from "./types.js";
import type { Rng, StreamLabel } from "./prng.js";
import type { Baseline, BaselineId } from "./baselines.js";
import type { PerUserMetrics } from "./types.js";
import type { PairedTestResult } from "./stats.js";
import type { MVVerdict } from "./mv.js";
import type { PerUserResult, ResultsInput } from "./report.js";

// ── Real, unmodified source modules (dynamic import so the hook is already active) ──
const { CONFIG, assertConfigInvariants } = await import("./config.js");
const { deriveStream } = await import("./prng.js");
const { sampleUser, generateCases } = await import("./generative.js");
const { buildPartition, assertWall } = await import("./holdout.js");
const { ssiDecide, calibrateOnTrain } = await import("./ssi.js");
const { allBaselines } = await import("./baselines.js");
const {
  perUserMetrics,
  partitionCases,
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

/**
 * [v2 CHANGE (3)] §5.2.1 ABSOLUTE calibration wall. Asserts that the cases consumed by
 * `calibrateOnTrain` are TRAIN cases only and that NO held-out family/context leaked into them —
 * i.e. the TRAIN-only calibration touched NO held-out cell. Reuses the §5.2 `assertWall`
 * predicate (split tag + held-out membership + tag integrity) so the calibration wall is
 * provably the SAME no-peeking discipline applied to the SSI calibration step. Throwing here
 * INVALIDATES the run before the "evaluation" stream opens (it is NOT a FAIL verdict).
 */
export function assertCalibrationWall(
  trainUsed: readonly ConsequenceCase[],
  p: HoldoutPartition,
): void {
  try {
    assertWall(trainUsed, p);
  } catch (err) {
    throw new Error(
      `§5.2.1 calibration wall: SSI calibrateOnTrain consumed a held-out cell — ` +
        `${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// main() — the locked orchestration (HARNESS-SPEC-v2 §15).
// ─────────────────────────────────────────────────────────────────────────────

export async function main(): Promise<void> {
  // ── Step 0: validate the locked parameter object (incl. seedMaster === 0x5551B_0002n) (§3/§9.4). ──
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

  // ── Step 3: generate TRAIN/EVAL cases (§5.3) on the independent "fitting-data" + "evaluation"
  // streams (NOTE RUN4). EVAL cases are held aside and NOT touched until the calibration wall passes. ──
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

  // ── Step 4: the no-peeking WALL must pass BEFORE any fit/calibration (guard b, §5.2). ──
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

  // ── Step 5b: [v2 CHANGE (3)] TRAIN-only SSI calibration — deterministic argmax of SSI's own §6
  // composite over G_θ × G_κ; consumes NO randomness, NO θ_u, NO held-out label (§5.2.1). ──
  const cal: CalibratedConstants = calibrateOnTrain(cfg, users, allTrain);

  // ── Step 5c: [v2] §5.2.1 ABSOLUTE wall — calibration touched NO held-out cell. Must pass BEFORE
  // any "evaluation" case is read by a decision (NOTE RUN4). ──
  assertCalibrationWall(allTrain, partition);

  // ── Step 5d: re-check the EVAL split tags against the wall (§5.2 recheck): every EVAL case must
  // be split="eval"; held-out families/contexts may ONLY appear here, never in TRAIN. ──
  for (const i of validIdx) {
    for (const c of evalByUser[i]!) {
      if (c.split !== "eval") {
        throw new Error(
          `§5.2 wall re-check: case ${c.caseId} in the EVAL split is tagged split="${c.split}".`,
        );
      }
    }
  }

  // ── Step 6: per-user decisions (SSI + each baseline) and per-user metrics (§6.4, §6.1.1). ──
  const ssiComposite: number[] = [];
  const baseComposite: Record<BaselineId, number[]> = Object.fromEntries(
    baselineIds.map((id) => [id, [] as number[]]),
  ) as Record<BaselineId, number[]>;
  const perUserRows: PerUserResult[] = [];

  // Pooled (per-case) score/label streams for the diagnostic calibration curves (§6.5).
  const ssiDecisionsAll: { dec: readonly MethodDecision[]; cases: ConsequenceCase[] }[] = [];
  const baseDecisionsAll: Record<
    BaselineId,
    { dec: readonly MethodDecision[]; cases: ConsequenceCase[] }[]
  > = Object.fromEntries(baselineIds.map((id) => [id, []])) as Record<
    BaselineId,
    { dec: readonly MethodDecision[]; cases: ConsequenceCase[] }[]
  >;

  for (const i of validIdx) {
    const user = users[i]!;
    const cases = evalByUser[i]!;
    const { disc } = partitionCases(cases); // [v2] §6.1.1 discretionary slice (NC/calibration scope)

    // SSI: method under test — decides using the TRAIN-calibrated operating point `cal`.
    const ssiDec = ssiDecide(cfg, cal, user, cases);
    const ssiM = perUserMetrics(cfg, ssiDec, cases); // D_disc composite + D_safety MS
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
      ssiNegControlSpecificity: negControlSpecificity(ssiDec, disc), // §7.6 over D_disc
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

  // ── Step 8: G1B-MV sub-gate — PPC adequacy + LOO model comparison (M-cpl vs M-hier/M-fac) (§8). ──
  const ppc = ppcCheck(cfg, users, stream("ppc"));
  const cmp = compareModels(cfg, users, stream("loo", "mv"));
  const mvV: MVVerdict = mvVerdict(cfg, { adequate: ppc.adequate }, cmp);

  // ── Step 9: diagnostic calibration / reliability ECE per method over D_disc (§6.5; never gated). ──
  const eceOf = (
    rows: { dec: readonly MethodDecision[]; cases: ConsequenceCase[] }[],
  ): { surfacingECE: number; abstentionECE: number } => {
    const dec = rows.flatMap((r) => r.dec);
    const disc = rows.flatMap((r) => partitionCases(r.cases).disc); // [v2] D_disc only
    return {
      surfacingECE: surfacingReliability(cfg, dec, disc).ece,
      abstentionECE: abstentionReliability(cfg, dec, disc).ece,
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
  // §9.1 ablation tie vs baseline (v) = the EIG/VoI ablation ("coupled-ablation" in v2).
  const abRow = perBaseline.find((t) => t.baseline === "coupled-ablation")!;
  const abHolm = holm.perBaseline.find((h) => h.baseline === "coupled-ablation")!;
  const ablationTie = abRow.meanDiff < cfg.deltaComposite || !abHolm.reject; // §9.1 ablation tie.
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
    calibrated: cal, // [v2 CHANGE (3)] TRAIN-selected (θ*, κ*) operating point.
    partition,
    perUser: perUserRows,
    tests: { perBaseline, holm, bootstrap },
    calibration,
    mv: {
      pPPC: ppc.pPPC,
      ppcAdequate: ppc.adequate,
      dElpdHier: cmp.dElpdHier,
      dElpdFac: cmp.dElpdFac,
      seHier: cmp.seHier,
      material: cmp.material,
      verdict: mvV,
    },
    decision,
  };
  const results = buildResultsJSON(input);

  // ── Step 12: emit the two execution-phase artifacts (output-integrity guard, NOTE RUN5). ──
  // Anchor artifacts-v2/ to the harness location (g1b/, the parent of src-v2/) so the outputs land
  // beside the v2 source regardless of the process cwd (NOTE RUN5; mirrors the v1 g1b/artifacts/).
  const g1bRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const outDir = resolve(g1bRoot, "artifacts-v2");
  const resultsPath = resolve(outDir, "results.json");
  const reportPath = resolve(outDir, "REPORT.md");
  assertWritableTarget(resultsPath);
  assertWritableTarget(reportPath);
  writeResults(resultsPath, results);
  writeReport(reportPath, renderReportMarkdown(results));

  // Console summary (audit trail; not an artifact).
  // eslint-disable-next-line no-console
  console.log(
    `G1B-v2 run complete @ SEED_MASTER=0x${cfg.seedMaster.toString(16)}: ` +
      `nValid=${validIdx.length}/${cfg.N}, ` +
      `cal(θ*=${cal.thetaSurprise}, κ*=${cal.kappa}), verdict=${decision.verdict}.`,
  );
  // eslint-disable-next-line no-console
  console.log(`  -> ${resultsPath}`);
  // eslint-disable-next-line no-console
  console.log(`  -> ${reportPath}`);
}

/** Guard (NOTE RUN5): refuse to ever write to the LOCKED pre-registration / harness-spec files. */
function assertWritableTarget(path: string): void {
  const b = basename(path).toLowerCase();
  const locked = new Set([
    "pre-registration.md",
    "pre-registration-v2.md",
    "harness-spec.md",
    "harness-spec-v2.md",
  ]);
  if (locked.has(b)) {
    throw new Error(`run.ts: refusing to overwrite the locked file '${path}' (§14 [GATE]).`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point. INVALID runs (guard c) exit 2; any other failure exits 1; success exits 0.
// (Skipped when imported as a module — e.g. by the §16 import-graph test — via G1B_NO_MAIN.)
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.G1B_NO_MAIN !== "1") {
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
}
