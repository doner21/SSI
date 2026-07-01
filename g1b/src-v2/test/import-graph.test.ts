// src-v2/test/import-graph.test.ts — [v2 CHANGE (1)] STATIC import-graph integrity test (HARNESS-SPEC-v2 §16).
//
// WHAT THIS PROVES (ablation-isolation invariant, §3.5/§4.5 TIGHTENED in v2; PRE-REG-v2 §3.5):
//   The SSI−(v) ablation delta must isolate ONLY EIG/VoI on a COMMON coupled belief model. For that
//   to hold, the coupled-ablation baseline (v) must:
//     (1) call the IDENTICAL shared `posterior.ts` coupling functions SSI uses
//         (`coupledPosterior`, `consequenceConditioned`, `klCoupled`/`s1Surprise`), AND
//     (2) make NO call into any EVSI/EIG function on `ssi.ts`'s surface
//         (`evsiAligned`, `irSilentAligned`, `eig`).
//   Equivalently: `baselines.ts` must import NO symbol from `ssi.ts`'s EVSI/EIG surface (ideally NO
//   symbol from `ssi.ts` at all), and MUST source its coupling from the shared `posterior.ts`.
//
// This is a PURELY STATIC source-text check — it parses the on-disk `baselines.ts` import statements
// and asserts the import graph. It introduces NO experiment parameter and runs with no external libs.
//
// HOW TO RUN (Node 24, native type-stripping, no build step):
//     node --experimental-strip-types g1b/src-v2/test/import-graph.test.ts
//   exit 0 = PASS (all import-graph invariants hold); exit 1 = FAIL (a violation was found).
//
// Discipline: strict TS, ES modules, Node standard library only (`node:fs`, `node:path`, `node:url`).

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, ".."); // g1b/src-v2

// The EVSI/EIG surface that the ablation must NEVER touch (HARNESS-SPEC-v2 §9/§16).
const FORBIDDEN_EVSI_EIG = ["evsiAligned", "irSilentAligned", "eig"] as const;

// The shared coupled-belief functions the ablation MUST source from `posterior.ts` (§4.0–§4.3).
const REQUIRED_COUPLING = ["coupledPosterior", "consequenceConditioned", "klCoupled"] as const;

/** One parsed `import ... from "<specifier>"` statement (covers single- and multi-line forms). */
interface ParsedImport {
  readonly specifier: string; // module specifier, e.g. "./posterior.js"
  readonly names: readonly string[]; // imported binding identifiers (named + default + namespace)
  readonly typeOnly: boolean; // `import type { ... }` (erased; carries no runtime call)
  readonly raw: string;
}

/**
 * Minimal ESM import parser sufficient for the locked source style (NodeNext `.js` specifiers, no
 * dynamic regex edge cases in these files). Captures every `import ... from "<spec>"` statement and
 * extracts the imported binding identifiers and whether the whole statement is `import type`.
 */
function parseImports(source: string): ParsedImport[] {
  const out: ParsedImport[] = [];
  // Match: import [type] <clause> from "<spec>";  — clause may span multiple lines.
  const re = /import\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const typeOnly = Boolean(m[1]);
    const clause = m[2]!.trim();
    const specifier = m[3]!;
    const names: string[] = [];

    // Named bindings: { a, b as c, type d }
    const braced = clause.match(/\{([\s\S]*?)\}/);
    if (braced) {
      for (const part of braced[1]!.split(",")) {
        const tok = part.trim();
        if (tok.length === 0) continue;
        // strip a leading inline `type ` (e.g. `{ type Foo }`); take the imported (left) name and any alias
        const cleaned = tok.replace(/^type\s+/, "");
        const [orig, alias] = cleaned.split(/\s+as\s+/).map((s) => s.trim());
        if (orig) names.push(orig);
        if (alias) names.push(alias);
      }
    }
    // Namespace: * as ns
    const ns = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (ns) names.push(ns[1]!);
    // Default: leading bareword before a comma or brace
    const def = clause.match(/^([A-Za-z_$][\w$]*)\s*(,|$)/);
    if (def && !ns) names.push(def[1]!);

    out.push({ specifier, names, typeOnly, raw: m[0]! });
  }
  return out;
}

/** True iff the specifier resolves to the sibling `ssi` module (`./ssi`, `./ssi.js`, `./ssi.ts`). */
function isSsiSpecifier(spec: string): boolean {
  return /(^|\/)\.?\/?ssi(\.js|\.ts)?$/.test(spec) || spec === "./ssi.js" || spec === "./ssi";
}
/** True iff the specifier resolves to the sibling `posterior` module. */
function isPosteriorSpecifier(spec: string): boolean {
  return spec === "./posterior.js" || spec === "./posterior.ts" || spec === "./posterior";
}

// ─────────────────────────────────────────────────────────────────────────────
// The tests.
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
function check(name: string, fn: () => void): void {
  fn();
  passed++;
  // eslint-disable-next-line no-console
  console.log(`  ✓ ${name}`);
}

const baselinesSrc = readFileSync(resolve(SRC, "baselines.ts"), "utf8");
const imports = parseImports(baselinesSrc);

// eslint-disable-next-line no-console
console.log("[§16] static import-graph integrity — baselines.ts ablation isolation:");

// (1) baselines.ts imports NO symbol from ssi.ts at all (strongest form of the §16 invariant).
check("baselines.ts imports NOTHING from ssi.ts (no ./ssi import statement)", () => {
  const ssiImports = imports.filter((i) => isSsiSpecifier(i.specifier));
  assert.equal(
    ssiImports.length,
    0,
    `baselines.ts must not import from ssi.ts; found: ${ssiImports.map((i) => i.raw).join(" | ")}`,
  );
});

// (2) None of the forbidden EVSI/EIG identifiers are imported anywhere in baselines.ts.
check("baselines.ts imports NO EVSI/EIG symbol (evsiAligned, irSilentAligned, eig)", () => {
  const importedNames = new Set(imports.flatMap((i) => i.names));
  for (const sym of FORBIDDEN_EVSI_EIG) {
    assert.ok(
      !importedNames.has(sym),
      `baselines.ts must not import the EVSI/EIG symbol "${sym}" (§9/§16).`,
    );
  }
});

// (3) Defense in depth: the forbidden identifiers must not even appear as bare call sites in source
//     (guards against a re-export or a copy that bypasses the import statement).
check("baselines.ts contains NO call to evsiAligned/irSilentAligned/eig in source", () => {
  for (const sym of FORBIDDEN_EVSI_EIG) {
    // a call/usage like `eig(` or `evsiAligned(` — word-boundary + open paren
    const callRe = new RegExp(`\\b${sym}\\s*\\(`);
    assert.ok(
      !callRe.test(baselinesSrc),
      `baselines.ts must contain no call to the EVSI/EIG function "${sym}(" (§9/§16).`,
    );
  }
});

// (4) The ablation MUST source its coupling from the shared posterior.ts (so SSI−(v) shares one model).
check("baselines.ts imports the shared coupling from posterior.ts (coupledPosterior, consequenceConditioned, klCoupled)", () => {
  const posteriorImports = imports.filter((i) => isPosteriorSpecifier(i.specifier) && !i.typeOnly);
  assert.ok(
    posteriorImports.length > 0,
    "baselines.ts must value-import the shared coupling from ./posterior.js (§4.0–§4.3).",
  );
  const posteriorNames = new Set(posteriorImports.flatMap((i) => i.names));
  for (const sym of REQUIRED_COUPLING) {
    assert.ok(
      posteriorNames.has(sym),
      `baselines.ts must import the shared coupling function "${sym}" from posterior.ts (§16).`,
    );
  }
});

// (5) Symmetry sanity: ssi.ts DOES define the EVSI/EIG surface (so the isolation is meaningful — the
//     functions exist and are SSI-exclusive). This anchors that (1)–(3) are non-vacuous.
check("ssi.ts defines the EVSI/EIG surface that baselines.ts must avoid", () => {
  const ssiSrc = readFileSync(resolve(SRC, "ssi.ts"), "utf8");
  for (const sym of FORBIDDEN_EVSI_EIG) {
    const defRe = new RegExp(`export\\s+function\\s+${sym}\\b`);
    assert.ok(defRe.test(ssiSrc), `ssi.ts is expected to export "${sym}" (§8); isolation would be vacuous otherwise.`);
  }
});

// eslint-disable-next-line no-console
console.log(`\n[§16] PASS — ${passed} import-graph invariants hold (ablation isolates ONLY EIG/VoI).`);
