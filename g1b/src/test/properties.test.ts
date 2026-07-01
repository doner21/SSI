// src/test/properties.test.ts — G1B Falsifier property/unit tests (HARNESS-SPEC §16).
//
// Verifies the MATH and the INTEGRITY invariants of the harness — NOT the experiment. No
// results.json is produced and no verdict is computed here; these are deterministic checks of
// the closed-form belief math (§4), the EVSI value-of-information property (§4.5), the exact
// permutation test (§7.4), the no-peeking wall (§5.2), the §3.5 ablation isolation, and the
// §2.6 oracle integrity. Library-free; the only randomness is the seeded §7.3 PRNG.
//
// HOW TO RUN (Node 24, native type-stripping, no external libs):
//     node --experimental-strip-types src/test/properties.test.ts
//
// The process EXITS NON-ZERO if any check fails (CI-friendly, HARNESS-SPEC §16).
//
// Loading model: the G1B modules value-import each other with NodeNext `.js` specifiers, which
// native type-stripping does not rewrite to `.ts`. This file therefore registers the in-repo
// `resolve-ts.ts` hook FIRST and then dynamically imports the real, unmodified source modules,
// so every property is checked against the genuine implementation (see resolve-ts.ts).
//
// One module — `src/baselines.ts` — uses a TS *parameter property* (`constructor(private …)`),
// which native strip-types rejects; importing it is therefore impossible without a transform.
// The §3.5 ablation-isolation check is by design a STATIC source property ("references no
// EVSI/EIG symbol"), so it reads `baselines.ts` as text via `node:fs` instead of importing it.
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTES (spec-ambiguity interpretations — no new parameters; nothing here tunes the experiment):
//   T1. EVSI biconditional (§4.5 / ssi.ts NOTES S1). The spec asserts EVSI = 0 EXACTLY when
//       "every answer yields the same IR". We compute the "same-IR" side INDEPENDENTLY of evsi
//       — by enumerating the touched-axis answer joint and calling the registered `selectIR`
//       oracle directly (generative.ts) — then assert the biconditional against `ssi.evsi`.
//       Under the registered match-utility IR value, a differing IR strictly lowers value on at
//       least one touched axis under the one-hot post-answer belief, so the bracket is strictly
//       positive; the biconditional is therefore exact (EVSI === 0 ⇔ all-same-IR), and the test
//       checks `=== 0` for the same-IR side and `> 0` for the changes-IR side.
//   T2. "Exact enumeration count = 2^N" (§7.4) is verified by two analytic anchors at several N:
//       all-zero diffs ⇒ every one of the 2^N sign-vectors satisfies the ≥ test ⇒ p === 1
//       (count = 2^N); all-equal-positive diffs ⇒ only the all-(+1) vector qualifies ⇒
//       p === 1/2^N (count = 1). Together with the granularity check (every p is k/2^N) this
//       pins the denominator to exactly 2^N.
//   T3. Permutation monotonicity (§7.4) uses unit magnitudes |d_u| = 1 with k positives and
//       (N−k) negatives. The sign-flip null distribution of Σ s_u d_u depends only on the
//       magnitudes, so it is identical for every k; raising k strictly raises D̄_obs, hence the
//       one-sided p (count of permutations ≥ D̄_obs) is non-increasing in k — a clean monotone
//       probe of the registered statistic.
//   T4. Ablation isolation (§3.5) is a static check: comments are stripped, then (a) `baselines`
//       must not `import … from "./ssi(.js|.ts)"`, and (b) the `FactoredAblation` class body
//       must contain no `evsi`/`eig` identifier. Comment text (which legitimately mentions "NO
//       EVSI gate") is removed first so only real symbols are scanned.
// ─────────────────────────────────────────────────────────────────────────────

import { register } from "node:module";
import { readFileSync } from "node:fs";

// Register the `.js → .ts` resolution hook BEFORE importing any source module (see header).
register("./resolve-ts.ts", import.meta.url);

import type {
  AxisId,
  AxisLevel,
  AxisPosterior,
  ConsequenceCase,
  Context,
  FactoredPosterior,
  FamilyId,
  LockedConfig,
  SyntheticUser,
} from "../types.js";
import type { Rng } from "../prng.js";

// Real, unmodified source modules (dynamically imported so the hook is already active).
const { CONFIG } = await import("../config.js");
const { deriveStream } = await import("../prng.js");
const { klAxis, entropyAxis, klFactored, entropyFactored } = await import("../posterior.js");
const { evsi, ssiDecide } = await import("../ssi.js");
const { selectIR, sampleUser, generateCases, oracleWorthSurfacing, oracleAnswerChangesIR } =
  await import("../generative.js");
const { permutationTest } = await import("../stats.js");
const { buildPartition, assertWall, tagHeldOut } = await import("../holdout.js");

const cfg: LockedConfig = CONFIG;
const LN3 = Math.log(3);
const TOL = 1e-12;

// ─────────────────────────────────────────────────────────────────────────────
// Tiny library-free assertion + test harness (exits non-zero on any failure).
// ─────────────────────────────────────────────────────────────────────────────

let failures = 0;
let passes = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    passes++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failures++;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  FAIL  ${name}\n          ${msg}`);
  }
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}
function assertClose(a: number, b: number, tol: number, msg: string): void {
  if (!(Math.abs(a - b) <= tol)) throw new Error(`${msg} (|${a} − ${b}| = ${Math.abs(a - b)} > ${tol})`);
}
function assertThrows(fn: () => void, msg: string): void {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) throw new Error(`expected a throw but none occurred: ${msg}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic generators (seeded §7.3 PRNG only — never Math.random).
// ─────────────────────────────────────────────────────────────────────────────

const AXIS_IDS: readonly AxisId[] = cfg.axes.map((a) => a.id);

/** A strictly-positive random AxisPosterior (positivity keeps klAxis well-defined: q_k > 0). */
function randDist(rng: Rng): AxisPosterior {
  const a = rng.nextUnit() + 1e-3;
  const b = rng.nextUnit() + 1e-3;
  const c = rng.nextUnit() + 1e-3;
  const s = a + b + c;
  return [a / s, b / s, c / s];
}

/** A random factored posterior over all registered axes. */
function randFactored(rng: Rng): FactoredPosterior {
  const out: Record<AxisId, AxisPosterior> = {} as Record<AxisId, AxisPosterior>;
  for (const id of AXIS_IDS) out[id] = randDist(rng);
  return out;
}

/** Touched axes of a family in canonical CONFIG order (mirrors ssi/generative; reads CONFIG only). */
function touchedOrdered(family: FamilyId): readonly AxisId[] {
  const sig = cfg.families.find((f) => f.family === family);
  if (sig === undefined) throw new Error(`unknown family ${family}`);
  const set = new Set<AxisId>(sig.touchedAxes);
  return AXIS_IDS.filter((id) => set.has(id));
}

/**
 * Independent "every positive-probability answer yields the same IR" predicate (NOTES T1),
 * computed via the registered `selectIR` oracle — NOT via `evsi` — so it is a genuine cross-check.
 */
function allAnswersSameIR(cc: FactoredPosterior, family: FamilyId, ctx: Context): boolean {
  const touched = touchedOrdered(family);
  if (touched.length === 0) return true; // no axis the IR oracle reads ⇒ no answer can move it
  const tolBase = cc as Record<AxisId, AxisPosterior | AxisLevel>;
  const irSilent = selectIR(cfg, { effectiveTolerance: tolBase, context: ctx, family });
  let same = true;
  const combo: AxisLevel[] = touched.map(() => 0 as AxisLevel);
  const rec = (i: number): void => {
    if (!same) return;
    if (i === touched.length) {
      const tol: Record<AxisId, AxisPosterior | AxisLevel> = { ...cc };
      for (let t = 0; t < touched.length; t++) tol[touched[t]!] = combo[t]!;
      const irAnswered = selectIR(cfg, { effectiveTolerance: tol, context: ctx, family });
      if (irAnswered !== irSilent) same = false;
      return;
    }
    const p = cc[touched[i]!];
    for (let lvl = 0 as AxisLevel; lvl < 3; lvl = (lvl + 1) as AxisLevel) {
      if (p[lvl] > 0) {
        combo[i] = lvl;
        rec(i + 1);
      }
    }
  };
  rec(0);
  return same;
}

/** A one-hot AxisPosterior (all mass on `level`). */
function oneHot(level: AxisLevel): AxisPosterior {
  return [level === 0 ? 1 : 0, level === 1 ? 1 : 0, level === 2 ? 1 : 0];
}

const SAMPLE_CTXS: readonly Context[] = [
  { subdomain: "mixing", flow: "focused", genre: "clean-pop" },
  { subdomain: "synthesis", flow: "exploring", genre: "experimental" },
  { subdomain: "mastering", flow: "focused", genre: "experimental" },
];

const DUMMY_USER: SyntheticUser = {
  id: -1,
  theta: { grit: 0, bright: 0, interrupt: 0, artifact: 0, expertise: 0, routing: 0 },
  fossils: [],
};

// ═════════════════════════════════════════════════════════════════════════════
// §4.3 / §4.6 — KL and entropy bounds + identities.
// ═════════════════════════════════════════════════════════════════════════════

check("klAxis ≥ 0 and klAxis(p,p) = 0 exactly (§4.3)", () => {
  const rng = deriveStream(cfg.seedMaster, "ppc", "test", "kl");
  for (let i = 0; i < 5000; i++) {
    const p = randDist(rng);
    const q = randDist(rng);
    assert(klAxis(p, q) >= -TOL, `klAxis(p,q) = ${klAxis(p, q)} < 0`);
    assert(klAxis(p, p) === 0, `klAxis(p,p) = ${klAxis(p, p)} ≠ 0 exactly`);
  }
});

check("0 ≤ entropyAxis ≤ ln 3, with one-hot→0 and uniform→ln 3 (§4.6)", () => {
  const rng = deriveStream(cfg.seedMaster, "ppc", "test", "entropy");
  for (let i = 0; i < 5000; i++) {
    const p = randDist(rng);
    const h = entropyAxis(p);
    assert(h >= -TOL, `entropyAxis = ${h} < 0`);
    assert(h <= LN3 + TOL, `entropyAxis = ${h} > ln 3`);
  }
  assert(entropyAxis([1, 0, 0]) === 0, "entropyAxis(one-hot) ≠ 0");
  assert(entropyAxis([0, 1, 0]) === 0, "entropyAxis(one-hot) ≠ 0");
  assertClose(entropyAxis([1 / 3, 1 / 3, 1 / 3]), LN3, TOL, "entropyAxis(uniform) ≠ ln 3");
});

check("factor-additivity of KL and entropy; klFactored(p,p)=0 (§4.3/§4.6)", () => {
  const rng = deriveStream(cfg.seedMaster, "ppc", "test", "factor");
  for (let i = 0; i < 2000; i++) {
    const p = randFactored(rng);
    const q = randFactored(rng);
    let klSum = 0;
    let hSum = 0;
    for (const id of AXIS_IDS) {
      klSum += klAxis(p[id], q[id]);
      hSum += entropyAxis(p[id]);
    }
    assertClose(klFactored(p, q), klSum, TOL, "klFactored ≠ Σ klAxis (not factor-additive)");
    assertClose(entropyFactored(p), hSum, TOL, "entropyFactored ≠ Σ entropyAxis");
    assert(klFactored(p, p) === 0, `klFactored(p,p) = ${klFactored(p, p)} ≠ 0 exactly`);

    // Untouched (identical) factor contributes exactly 0: replacing q's first axis by p's first
    // axis must drop klFactored by exactly that axis's old term.
    const q2: Record<AxisId, AxisPosterior> = { ...q };
    const a0 = AXIS_IDS[0]!;
    q2[a0] = p[a0];
    assertClose(klFactored(p, q2), klFactored(p, q) - klAxis(p[a0], q[a0]), TOL, "identical factor did not contribute 0");
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// §4.5 — EVSI ≥ 0, and EVSI = 0 EXACTLY ⇔ every answer yields the same IR.
// ═════════════════════════════════════════════════════════════════════════════

check("EVSI ≥ 0 and EVSI = 0 ⇔ no answer changes the IR (§4.5)", () => {
  const rng = deriveStream(cfg.seedMaster, "ppc", "test", "evsi");
  let sawSame = false;
  let sawChange = false;

  for (const family of cfg.families.map((f) => f.family)) {
    for (const ctx of SAMPLE_CTXS) {
      // (a) Random belief states — check ≥ 0 and the biconditional against the independent oracle.
      for (let i = 0; i < 200; i++) {
        const cc = randFactored(rng);
        const e = evsi(cfg, DUMMY_USER, cc, cc, family, ctx);
        const same = allAnswersSameIR(cc, family, ctx);
        assert(e >= -TOL, `EVSI = ${e} < 0 (family ${family})`);
        if (same) {
          assert(e === 0, `same-IR but EVSI = ${e} ≠ 0 (family ${family})`);
          sawSame = true;
        } else {
          assert(e > 1e-9, `changes-IR but EVSI = ${e} not > 0 (family ${family})`);
          sawChange = true;
        }
      }

      // (b) Forced same-IR: one-hot on every touched axis ⇒ only one answer ⇒ EVSI = 0 exactly.
      const touched = touchedOrdered(family);
      if (touched.length > 0) {
        const ccOneHot: Record<AxisId, AxisPosterior> = randFactored(rng) as Record<AxisId, AxisPosterior>;
        for (const ax of touched) ccOneHot[ax] = oneHot(1);
        const eSame = evsi(cfg, DUMMY_USER, ccOneHot, ccOneHot, family, ctx);
        assert(allAnswersSameIR(ccOneHot, family, ctx), "one-hot construction should be same-IR");
        assert(eSame === 0, `one-hot same-IR but EVSI = ${eSame} ≠ 0`);
        sawSame = true; // forced same-IR construction genuinely exercises the EVSI = 0 branch

        // (c) Forced changes-IR: split mass [0.5,0,0.5] on touched axes ⇒ answers 0 and 2 differ
        //     from the mean-level (1) silent IR ⇒ EVSI > 0.
        const ccSplit: Record<AxisId, AxisPosterior> = randFactored(rng) as Record<AxisId, AxisPosterior>;
        for (const ax of touched) ccSplit[ax] = [0.5, 0, 0.5];
        if (!allAnswersSameIR(ccSplit, family, ctx)) {
          const eChg = evsi(cfg, DUMMY_USER, ccSplit, ccSplit, family, ctx);
          assert(eChg > 1e-9, `split belief changes IR but EVSI = ${eChg} not > 0`);
        }
      }
    }
  }
  assert(sawSame, "test never exercised the EVSI = 0 (same-IR) branch");
  assert(sawChange, "test never exercised the EVSI > 0 (changes-IR) branch");
});

// ═════════════════════════════════════════════════════════════════════════════
// §7.4 — exact paired sign-flip permutation test: count = 2^N, granularity, monotonicity.
// ═════════════════════════════════════════════════════════════════════════════

check("exact enumeration count = 2^N and exact=true for N ≤ permExactMaxN (§7.4)", () => {
  const permRng = deriveStream(cfg.seedMaster, "permutation", "test", "count");
  for (const N of [8, 10, 12]) {
    assert(N <= cfg.permExactMaxN, `precondition N=${N} ≤ permExactMaxN`);
    const total = 2 ** N;

    // all-zero diffs ⇒ every sign-vector satisfies the ≥ test ⇒ count = 2^N ⇒ p = 1 (NOTES T2).
    const z = permutationTest(cfg, new Array<number>(N).fill(0), permRng);
    assert(z.exact === true, `expected exact enumeration at N=${N}`);
    assert(z.p === 1, `all-zero diffs: p = ${z.p} ≠ 1 (count ≠ 2^N) at N=${N}`);

    // all-equal-positive diffs ⇒ only the all-(+1) vector qualifies ⇒ count = 1 ⇒ p = 1/2^N.
    const o = permutationTest(cfg, new Array<number>(N).fill(1), permRng);
    assert(o.exact === true, `expected exact enumeration at N=${N}`);
    assertClose(o.p, 1 / total, 1e-15, `all-ones diffs: p = ${o.p} ≠ 1/2^${N}`);
  }
});

check("p-granularity = 1/4096 at N = 12 (every p is k/2^12) (§7.4)", () => {
  const permRng = deriveStream(cfg.seedMaster, "permutation", "test", "grain");
  const rng = deriveStream(cfg.seedMaster, "permutation", "test", "graindata");
  const G = 4096; // 2^12
  for (let trial = 0; trial < 200; trial++) {
    const diffs = new Array<number>(12);
    for (let u = 0; u < 12; u++) diffs[u] = rng.nextUnit() * 2 - 0.5; // arbitrary real magnitudes/signs
    const { p } = permutationTest(cfg, diffs, permRng);
    const scaled = p * G;
    assertClose(scaled, Math.round(scaled), 1e-7, `p = ${p} is not a multiple of 1/4096`);
    assert(p >= 1 / G - 1e-12 && p <= 1 + 1e-12, `p = ${p} outside (0,1]`);
  }
});

check("one-sided p is monotone non-increasing in D̄_obs (§7.4)", () => {
  const permRng = deriveStream(cfg.seedMaster, "permutation", "test", "mono");
  const N = 12;
  let prevP = Number.POSITIVE_INFINITY;
  for (let k = 0; k <= N; k++) {
    // k positives, (N−k) negatives, all unit magnitude ⇒ D̄_obs = (2k − N)/N strictly ↑ in k (NOTES T3).
    const diffs = new Array<number>(N);
    for (let u = 0; u < N; u++) diffs[u] = u < k ? 1 : -1;
    const { p, meanDiff } = permutationTest(cfg, diffs, permRng);
    assertClose(meanDiff, (2 * k - N) / N, 1e-12, "meanDiff mismatch");
    assert(p <= prevP + 1e-12, `p not non-increasing at k=${k}: ${p} > ${prevP}`);
    prevP = p;
  }
  // Anchors: k=0 (most extreme negative) ⇒ p=1; k=N (most extreme positive) ⇒ p=1/2^N.
  const allNeg = permutationTest(cfg, new Array<number>(N).fill(-1), permRng);
  const allPos = permutationTest(cfg, new Array<number>(N).fill(1), permRng);
  assert(allNeg.p === 1, `all-negative p = ${allNeg.p} ≠ 1`);
  assertClose(allPos.p, 1 / 2 ** N, 1e-15, `all-positive p = ${allPos.p} ≠ 1/2^N`);
});

// ═════════════════════════════════════════════════════════════════════════════
// §5.2 — the no-peeking wall: assertWall throws if any held-out cell appears in TRAIN.
// ═════════════════════════════════════════════════════════════════════════════

check("assertWall throws on held-out family OR held-out context leaking into TRAIN (§5.2)", () => {
  const partRng = deriveStream(cfg.seedMaster, "holdout-partition", "test");
  const partition = buildPartition(cfg, partRng);

  const mkTrainCase = (caseId: number, family: FamilyId, ctx: Context): ConsequenceCase => {
    const heldOut = tagHeldOut(partition, family, ctx);
    return {
      caseId,
      userId: 0,
      context: ctx,
      family,
      split: "train",
      heldOut,
      oracle: { worthSurfacing: 0, answerChangesIR: 0, negativeControl: true },
    };
  };

  // Clean TRAIN case: a TRAIN family in a non-held-out context — the wall must accept it.
  const cleanCtx: Context = { subdomain: "mixing", flow: "focused", genre: "clean-pop" };
  const trainFamily = cfg.trainFamilies[0]!;
  assert(!tagHeldOut(partition, trainFamily, cleanCtx).family, "fixture: train family must not be held-out");
  assert(!tagHeldOut(partition, trainFamily, cleanCtx).context, "fixture: clean ctx must not be held-out");
  assertWall([mkTrainCase(1, trainFamily, cleanCtx)], partition); // must NOT throw

  // Leak 1: a HELD-OUT family tagged as TRAIN.
  const heldFamily = cfg.heldOutFamilies[0]!;
  assertThrows(() => assertWall([mkTrainCase(2, heldFamily, cleanCtx)], partition), "held-out FAMILY in TRAIN must throw");

  // Leak 2: a TRAIN family in a HELD-OUT context cell (registered combo includes genre = lofi).
  const heldCtx: Context = { subdomain: "mixing", flow: "focused", genre: "lofi" };
  assert(tagHeldOut(partition, trainFamily, heldCtx).context, "fixture: lofi ctx must be a held-out cell");
  assertThrows(() => assertWall([mkTrainCase(3, trainFamily, heldCtx)], partition), "held-out CONTEXT in TRAIN must throw");

  // A non-train split passed to the wall is also a harness bug ⇒ throws.
  const evalLike: ConsequenceCase = { ...mkTrainCase(4, trainFamily, cleanCtx), split: "eval" };
  assertThrows(() => assertWall([evalLike], partition), "non-train split must throw");
});

// ═════════════════════════════════════════════════════════════════════════════
// §3.5 — ablation isolation: `factored-ablation` references no EVSI/EIG symbol.
// ═════════════════════════════════════════════════════════════════════════════

/** Strip `//` line comments and block comments so only real source symbols remain (NOTES T4). */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/** Extract a `class <name> { … }` body by brace-matching from the first `{` after the name. */
function extractClassBody(src: string, className: string): string {
  const idx = src.indexOf(`class ${className}`);
  if (idx < 0) throw new Error(`class ${className} not found in baselines.ts`);
  const open = src.indexOf("{", idx);
  if (open < 0) throw new Error(`no opening brace for class ${className}`);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  throw new Error(`unbalanced braces for class ${className}`);
}

check("factored-ablation references no EVSI/EIG symbol and never imports ssi (§3.5)", () => {
  const srcRaw = readFileSync(new URL("../baselines.ts", import.meta.url), "utf8");
  const src = stripComments(srcRaw);

  // (a) The whole ablation module must import nothing from ssi.ts.
  assert(
    !/import[\s\S]*?from\s*["'][^"']*ssi\.(?:js|ts)["']/.test(src),
    "baselines.ts must not import from ssi.ts (§3.5 ablation isolation)",
  );

  // (b) The FactoredAblation class body must contain no EVSI/EIG identifier (comments stripped).
  const body = extractClassBody(src, "FactoredAblation");
  assert(!/\bevsi\b/i.test(body), "FactoredAblation references an EVSI symbol (§3.5)");
  assert(!/\beig\b/i.test(body), "FactoredAblation references an EIG symbol (§3.5)");
});

// ═════════════════════════════════════════════════════════════════════════════
// §2.6 — oracle integrity: oracle labels are invariant to any method's decisions.
// ═════════════════════════════════════════════════════════════════════════════

check("oracle labels are computed from θ_u + ctx only, invariant to method decisions (§2.6)", () => {
  const usersRng = deriveStream(cfg.seedMaster, "users", "test");
  const user = sampleUser(cfg, usersRng, 0);

  for (const family of cfg.families.map((f) => f.family)) {
    for (const ctx of SAMPLE_CTXS) {
      const w0 = oracleWorthSurfacing(cfg, user.theta, ctx, family);
      const a0 = oracleAnswerChangesIR(cfg, user.theta, ctx, family);

      // Run the method under test (and feed it a case) — a correct harness cannot let this
      // influence the oracle, because the oracle takes no method output as input.
      const probe: ConsequenceCase = {
        caseId: 99,
        userId: user.id,
        context: ctx,
        family,
        split: "eval",
        heldOut: { family: false, context: false },
        oracle: { worthSurfacing: w0, answerChangesIR: a0, negativeControl: w0 === 0 },
      };
      const decisions = ssiDecide(cfg, user, [probe]);
      assert(decisions.length === 1, "ssiDecide must return one decision per case");

      const w1 = oracleWorthSurfacing(cfg, user.theta, ctx, family);
      const a1 = oracleAnswerChangesIR(cfg, user.theta, ctx, family);
      assert(w0 === w1 && a0 === a1, `oracle label changed after running a method (family ${family})`);

      // And the oracle ignores fossils entirely (θ-only): a fossil-free clone of the same θ agrees.
      const clone: SyntheticUser = { id: 1234, theta: user.theta, fossils: [] };
      assert(
        oracleWorthSurfacing(cfg, clone.theta, ctx, family) === w0 &&
          oracleAnswerChangesIR(cfg, clone.theta, ctx, family) === a0,
        "oracle depends on fossils/identity, not θ alone (§2.6 violation)",
      );
    }
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// §2.6 — generation writes oracle labels straight from the pure oracle (no method peeking).
// ═════════════════════════════════════════════════════════════════════════════

check("generated case oracle labels equal the pure θ+ctx oracle (§2.6)", () => {
  const partRng = deriveStream(cfg.seedMaster, "holdout-partition", "gen-test");
  const partition = buildPartition(cfg, partRng);
  const usersRng = deriveStream(cfg.seedMaster, "users", "gen-test");
  const evalRng = deriveStream(cfg.seedMaster, "evaluation", "gen-test");
  const fitRng = deriveStream(cfg.seedMaster, "fitting-data", "gen-test");

  const user = sampleUser(cfg, usersRng, 0);
  const { train, eval: evalCases } = generateCases(cfg, partition, evalRng, fitRng, user);

  for (const c of [...train, ...evalCases]) {
    const w = oracleWorthSurfacing(cfg, user.theta, c.context, c.family);
    const a = oracleAnswerChangesIR(cfg, user.theta, c.context, c.family);
    assert(c.oracle.worthSurfacing === w, `case ${c.caseId} worthSurfacing tag disagrees with pure oracle`);
    assert(c.oracle.answerChangesIR === a, `case ${c.caseId} answerChangesIR tag disagrees with pure oracle`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary + non-zero exit on failure (HARNESS-SPEC §16).
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
console.log(`G1B property/unit tests: ${passes} passed, ${failures} failed.`);
if (failures > 0) {
  console.error("RESULT: FAIL");
  process.exit(1);
} else {
  console.log("RESULT: PASS");
  process.exit(0);
}
