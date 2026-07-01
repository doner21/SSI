// src/test/resolve-ts.ts — minimal in-repo ESM resolution hook (NO external libs).
//
// WHY THIS EXISTS (test-infrastructure only; introduces NO experiment parameter):
//   The G1B source modules follow the locked NodeNext convention and value-import each other
//   with `.js` specifiers (e.g. `import { klFactored } from "./posterior.js"`). Node 24's
//   *native* type-stripping (`node --experimental-strip-types file.ts`) runs `.ts` source
//   directly but does NOT rewrite a `./x.js` specifier to the on-disk `./x.ts` file. This tiny
//   `resolve` customization hook performs exactly that rewrite — and ONLY when the sibling
//   `.ts` file actually exists — so the real, unmodified source modules load under native
//   type-stripping with no build step and no third-party tooling. It changes resolution only;
//   it never alters module contents, so every property below is tested against the genuine
//   implementation in `src/*.ts`.
//
// Discipline: strict TS, ES modules, Node standard library only (`node:fs`, `node:url`).
//
// NOTES (spec-ambiguity interpretations — no new parameters):
//   R1. The hook rewrites only RELATIVE (`./` or `../`) specifiers ending in `.js`, and only
//       falls back to the default resolver when the `.ts` sibling is absent — so genuine `.js`
//       artifacts (if ever compiled) and bare/node: specifiers are untouched.

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Minimal structural types for the Node module-customization `resolve` hook (no @types needed).
interface ResolveContext {
  readonly conditions: readonly string[];
  readonly importAttributes: Record<string, string>;
  readonly parentURL?: string;
}
interface ResolveResult {
  readonly url: string;
  readonly format?: string | null;
  readonly shortCircuit?: boolean;
  readonly importAttributes?: Record<string, string>;
}
type NextResolve = (specifier: string, context: ResolveContext) => Promise<ResolveResult>;

export async function resolve(
  specifier: string,
  context: ResolveContext,
  nextResolve: NextResolve,
): Promise<ResolveResult> {
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && specifier.endsWith(".js")) {
    const tsSpecifier = `${specifier.slice(0, -3)}.ts`;
    try {
      const resolved = await nextResolve(tsSpecifier, context);
      if (resolved.url.startsWith("file:") && existsSync(fileURLToPath(resolved.url))) {
        return resolved; // the `.ts` sibling exists — use it
      }
    } catch {
      // No `.ts` sibling resolvable — fall through to the default `.js` resolution (R1).
    }
  }
  return nextResolve(specifier, context);
}
