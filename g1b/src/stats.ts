// src/stats.ts — G1B Falsifier exact statistical test (HARNESS-SPEC §11 / PRE-REGISTRATION §7.1–§7.5).
//
// The library-free, fully-deterministic test machinery that converts per-user composite arrays
// (§6.4 / §7.1) into the locked G1B verdict inputs:
//
//   • pairedDiffs      — §7.1 paired per-user differences d_u = Composite_u(SSI) − Composite_u(b).
//   • permutationTest  — §7.4 EXACT paired sign-flip permutation: enumerate all 2^N sign-vectors
//                        when N ≤ permExactMaxN (=20); one-sided p = #{D̄(s) ≥ D̄_obs}/2^N.
//                        Monte-Carlo fallback (add-one smoothed) via permRng only when N > 20.
//   • holmStepDown     — §7.4 Holm–Bonferroni step-down over the five raw permutation p-values
//                        at FWER α = 0.05; `allReject` is the H1 significance gate.
//   • bootstrapCI      — §7.5 percentile bootstrap over users (REPORTING-ONLY; never gates).
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules (NodeNext `.js` import specifiers), no
// `any` in public signatures, IEEE-754 `number`. This module consumes randomness ONLY through
// the injected `Rng` streams (`permutation`, `bootstrap`) — never `Math.random`. Every locked
// constant (deltaComposite, alphaFWER, permExactMaxN, permMonteCarloDraws, bootstrapDraws)
// arrives through `LockedConfig`; no new parameter is introduced.
//
// Locked semantics honored (PRE-REGISTRATION §7.4 [GATE]):
//   • At N = 12, all 2^12 = 4096 sign-vectors are enumerated exactly and deterministically;
//     achievable one-sided p-granularity is 1/4096 ≈ 2.4×10⁻⁴.
//   • H1 significance requires ALL FIVE baselines Holm-rejected AND every meanDiff ≥ 0.05.
//     This module supplies the two ingredients (Holm `allReject` and per-baseline `meanDiff`);
//     the conjunction itself is applied at the decision rule (§9 / decision.ts).
//   • Bootstrap CI is descriptive only and can never change a gate verdict.
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no new parameters):
//
//   S1. Tie handling in the one-sided count. The permutation p-value counts sign-vectors with
//       D̄(s) ≥ D̄_obs (ties INCLUDED — the observed all-(+1) vector is always counted, so
//       p ≥ 1/2^N > 0). To make the ≥ test robust to IEEE-754 round-off when distinct
//       sign-vectors yield mathematically-equal sums (e.g. when some d_u = 0), the comparison
//       uses a tiny tolerance EPS scaled to the data: permSum ≥ obsSum − EPS. Counting a
//       near-tie INFLATES p (more conservative / anti-false-positive), which is the safe
//       direction for a one-sided "SSI > baseline" gate. EPS is a numerical guard, NOT a
//       registered parameter, and is derived from the data magnitude, not chosen to fit a result.
//
//   S2. `N` for the test is `diffs.length` (the number of paired users actually produced).
//       The run guarantees N = 12 (§7.2); the exact branch (N ≤ permExactMaxN = 20) therefore
//       always fires at the registered N, and `permRng` is recorded-unused (§7.3 stream 5).
//       The Monte-Carlo branch is implemented (locked fallback) but never reached at N = 12.
//
//   S3. `holmStepDown` returns `perBaseline` in the SAME order as the input `raw` array (so the
//       caller can map results back by position / baseline id); each entry carries its own
//       rank-based Holm threshold α/(m − rank + 1) and the step-down `reject` flag. `allReject`
//       (the §7.4 gate) is true iff every baseline is rejected.
//
//   S4. Percentile convention for bootstrapCI (§7.5 "[2.5%, 97.5%] percentile interval"): the
//       reported endpoints use linear interpolation between order statistics (R-7 / NumPy
//       default), a standard deterministic percentile estimator. Reporting-only, never gated.
// ─────────────────────────────────────────────────────────────────────────────

import type { LockedConfig } from "./types.js";
import type { Rng } from "./prng.js";
import type { BaselineId } from "./baselines.js";

// ─────────────────────────────────────────────────────────────────────────────
// Public result shapes (HARNESS-SPEC §11).
// ─────────────────────────────────────────────────────────────────────────────

/** §7.1/§7.4 per-baseline paired-test outcome (one-sided permutation + margin). */
export interface PairedTestResult {
  readonly baseline: BaselineId;
  readonly meanDiff: number; // D̄^{(b)} (§7.1)
  readonly pValueRaw: number; // one-sided permutation p (§7.4)
  readonly marginPass: boolean; // D̄^{(b)} ≥ deltaComposite (§7.4)
  readonly exact: boolean; // true when 2^N enumerated, false if Monte-Carlo (§7.4)
}

/** §7.4 Holm–Bonferroni step-down outcome across the five baselines. */
export interface HolmResult {
  readonly perBaseline: readonly {
    readonly baseline: BaselineId;
    readonly pRaw: number;
    readonly pAdjThreshold: number; // the rank-based Holm threshold α/(m − rank + 1)
    readonly reject: boolean;
  }[];
  readonly allReject: boolean; // H1 significance gate (§7.4): every baseline rejected
}

// ─────────────────────────────────────────────────────────────────────────────
// §7.1 — paired per-user differences SSI − baseline.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the per-user paired differences d_u = Composite_u(SSI) − Composite_u(baseline).
 * Both arrays are per-user composite scalars (§6.4) in user order; lengths must match (one
 * Composite_u per user, §7.1).
 */
export function pairedDiffs(
  ssi: readonly number[],
  base: readonly number[],
): readonly number[] {
  if (ssi.length !== base.length) {
    throw new Error(
      `pairedDiffs: mismatched per-user arrays (ssi N=${ssi.length}, base N=${base.length}); ` +
        `each user must contribute exactly one Composite_u (§7.1).`,
    );
  }
  const out = new Array<number>(ssi.length);
  for (let u = 0; u < ssi.length; u++) out[u] = ssi[u]! - base[u]!;
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Small deterministic numeric helpers.
// ─────────────────────────────────────────────────────────────────────────────

/** Sum of an array (left-to-right; deterministic accumulation order). */
function sum(xs: readonly number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}

/**
 * Data-scaled tolerance for the ≥ tie test (NOTES S1). Derived from the L1 magnitude of the
 * differences so it tracks the scale of the partial sums; a pure numerical guard, not a knob.
 */
function tieEps(diffs: readonly number[]): number {
  let mag = 0;
  for (const d of diffs) mag += Math.abs(d);
  // Relative to total magnitude, with a tiny absolute floor for the all-zero case.
  return mag > 0 ? mag * 1e-12 : 1e-15;
}

// ─────────────────────────────────────────────────────────────────────────────
// §7.4 — exact paired sign-flip permutation test (Monte-Carlo fallback only when N > 20).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One-sided paired permutation test for the alternative "SSI > baseline".
 *
 * Observed statistic: D̄_obs = (1/N) Σ d_u  (the all-(+1) sign vector, §7.1).
 * Permutation null: independent sign-flips s_u ∈ {−1,+1} of each user's difference.
 * One-sided p = #{ s : D̄(s) ≥ D̄_obs } / 2^N  (ties included, NOTES S1).
 *
 * EXACT branch (N ≤ cfg.permExactMaxN): enumerate all 2^N sign-vectors (bit b set ⇒ s_u = −1).
 * MONTE-CARLO branch (N > cfg.permExactMaxN): draw cfg.permMonteCarloDraws sign-vectors from
 * `permRng` and use the add-one-smoothed estimate p = (1 + #{≥ obs}) / (1 + B_perm) (§7.4).
 *
 * Returns { p, meanDiff = D̄_obs, exact }.
 */
export function permutationTest(
  cfg: LockedConfig,
  diffs: readonly number[],
  permRng: Rng,
): { p: number; meanDiff: number; exact: boolean } {
  const N = diffs.length;
  if (N <= 0) {
    throw new Error("permutationTest: requires at least one paired difference (§7.2).");
  }

  const obsSum = sum(diffs); // D̄_obs · N  (comparing sums preserves the ≥ ordering)
  const meanDiff = obsSum / N;
  const eps = tieEps(diffs);
  const threshold = obsSum - eps; // count permSum ≥ obsSum − EPS (NOTES S1)

  // ── EXACT enumeration: all 2^N sign-vectors. ───────────────────────────────
  if (N <= cfg.permExactMaxN) {
    const total = 1 << N; // 2^N (N ≤ 20 ⇒ fits a 32-bit int; at registered N=12 ⇒ 4096)
    let count = 0;
    for (let mask = 0; mask < total; mask++) {
      // permSum = Σ s_u d_u, with s_u = −1 when bit u is set in `mask`, else +1.
      let permSum = 0;
      for (let u = 0; u < N; u++) {
        const s = (mask >> u) & 1 ? -1 : 1;
        permSum += s * diffs[u]!;
      }
      if (permSum >= threshold) count++;
    }
    return { p: count / total, meanDiff, exact: true };
  }

  // ── MONTE-CARLO fallback (locked; unreached at registered N=12, NOTES S2). ──
  const B = cfg.permMonteCarloDraws;
  let count = 0;
  for (let b = 0; b < B; b++) {
    let permSum = 0;
    for (let u = 0; u < N; u++) {
      const s = permRng.nextInt(2) === 1 ? -1 : 1; // independent sign-flip per user
      permSum += s * diffs[u]!;
    }
    if (permSum >= threshold) count++;
  }
  // Add-one smoothing (§7.4): guarantees a strictly positive, never-zero p estimate.
  return { p: (1 + count) / (1 + B), meanDiff, exact: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// §7.4 — Holm–Bonferroni step-down across the five raw permutation p-values.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Holm–Bonferroni step-down at FWER α = cfg.alphaFWER over the supplied raw p-values.
 *
 * Sort ascending: p_(1) ≤ … ≤ p_(m). Reject p_(k) iff p_(j) ≤ α/(m − j + 1) for ALL j ≤ k
 * (step-down: the first failure stops all further rejections). `allReject` is the §7.4 H1
 * significance gate — true iff every baseline is rejected.
 *
 * `perBaseline` is returned in input order (NOTES S3); each entry carries its own rank-based
 * threshold α/(m − rank + 1) and the step-down reject flag.
 */
export function holmStepDown(
  cfg: LockedConfig,
  raw: readonly { baseline: BaselineId; p: number }[],
): HolmResult {
  const m = raw.length;
  const alpha = cfg.alphaFWER;

  // Stable ascending sort by p (ties keep input order ⇒ deterministic ranks).
  const order = raw
    .map((r, i) => ({ ...r, i }))
    .sort((a, b) => (a.p === b.p ? a.i - b.i : a.p - b.p));

  // Step-down: walk ranks; once a rank fails its threshold, it and all later ranks are NOT rejected.
  const rejectByInput = new Array<boolean>(m).fill(false);
  const thresholdByInput = new Array<number>(m).fill(0);
  let stillRejecting = true;
  for (let k = 0; k < m; k++) {
    const rankThreshold = alpha / (m - k); // α/(m − (k+1) + 1) = α/(m − k), k is 0-indexed
    const entry = order[k]!;
    thresholdByInput[entry.i] = rankThreshold;
    if (stillRejecting && entry.p <= rankThreshold) {
      rejectByInput[entry.i] = true;
    } else {
      stillRejecting = false; // step-down halts at the first non-rejection
    }
  }

  const perBaseline = raw.map((r, i) => ({
    baseline: r.baseline,
    pRaw: r.p,
    pAdjThreshold: thresholdByInput[i]!,
    reject: rejectByInput[i]!,
  }));

  return { perBaseline, allReject: perBaseline.every((e) => e.reject) };
}

// ─────────────────────────────────────────────────────────────────────────────
// §7.5 — deterministic percentile bootstrap over users (REPORTING-ONLY).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Linear-interpolated percentile (R-7 / NumPy default) of a SORTED ascending array (NOTES S4).
 * `q` ∈ [0,1]. Empty input is a programmer error (guarded by the caller).
 */
function percentileSorted(sorted: readonly number[], q: number): number {
  const n = sorted.length;
  if (n === 1) return sorted[0]!;
  const pos = q * (n - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo]!;
  const frac = pos - lo;
  return sorted[lo]! * (1 - frac) + sorted[hi]! * frac;
}

/**
 * Percentile bootstrap CI on the mean paired difference D̄ (§7.5). Resamples N users WITH
 * REPLACEMENT cfg.bootstrapDraws times from the injected `bootRng`, recomputes D̄*, and returns
 * the [2.5%, 97.5%] percentile interval. DESCRIPTIVE ONLY — never gates the verdict (§7.5).
 */
export function bootstrapCI(
  cfg: LockedConfig,
  diffs: readonly number[],
  bootRng: Rng,
): { lo: number; hi: number } {
  const N = diffs.length;
  if (N <= 0) {
    throw new Error("bootstrapCI: requires at least one paired difference (§7.5).");
  }
  const B = cfg.bootstrapDraws;
  const means = new Array<number>(B);
  for (let b = 0; b < B; b++) {
    let acc = 0;
    for (let k = 0; k < N; k++) {
      const idx = bootRng.nextInt(N); // resample a user with replacement
      acc += diffs[idx]!;
    }
    means[b] = acc / N;
  }
  means.sort((a, b) => a - b); // ascending order statistics
  return {
    lo: percentileSorted(means, 0.025),
    hi: percentileSorted(means, 0.975),
  };
}
