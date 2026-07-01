// src/holdout.ts — G1B Falsifier "no-peeking wall" (HARNESS-SPEC §6 / PRE-REGISTRATION §5.1–§5.2).
//
// This module builds and guards the TRAIN / HELD-OUT partition. Its job is integrity, not
// inference: it commits the registered two-axis holdout (consequence FAMILIES × (axis-profile ×
// context) COMBINATIONS) BEFORE any fitting data exists, tags every generated case as single-
// or double-held-out, and hard-fails the run if any held-out cell ever leaked into the TRAIN
// split. No method (SSI or baseline) may be tuned on the evaluation distribution (§5.2).
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules, no `any` in public signatures, NO
// `Math.random` — the only randomness is the injected `holdout-partition` stream. This module
// introduces NO parameter: every partition value is read from the frozen CONFIG (§5.1 locked).
//
// NOTES (spec-ambiguity interpretations — no new parameters introduced):
//   H1. The partition CONTENTS are registered and frozen in PRE-REGISTRATION §5.1 / CONFIG
//       (TRAIN families {headroom-clip-risk, brightness-shift, routing-idiom-change}; HELD-OUT
//       families {inharmonic-artifact, added-latency, feedback-safety}; held-out context combos
//       grit×clean-mastering and clean×lofi). They are therefore NOT *derived* from randomness.
//       But HARNESS-SPEC §6 and PRE-REGISTRATION §7.3 require `buildPartition` to be the FIRST
//       consumer of the `holdout-partition` stream, drawn BEFORE any fitting data (the §5.2
//       ordering wall). We honour this literally: `buildPartition` pulls one deterministic
//       "commitment" draw from `partitionRng` to seal the partition first, then returns the
//       locked partition from CONFIG. The draw fixes stream consumption ORDER (enforcing §5.2);
//       it does not change the (already-registered) partition contents. This keeps the run
//       bit-reproducible and the wall ordering enforceable.
//   H2. `tagHeldOut(p, family, ctx)` receives only `family` and `ctx` (HARNESS-SPEC §6
//       signature) — not the user's latent axis-profile θ_u. The held-out CONTEXT combos are
//       registered as (axis-profile × context) cells, but a case's `context` tag can only be
//       decided from its context CELL here. We therefore tag `context: true` when `ctx` matches
//       the CONTEXT part of any registered combo (every specified context field equal). The
//       axis-profile dimension of a combo is honoured upstream at generation time
//       (generative.ts decides which users/cells populate a held-out combo); this guard's
//       contract is purely "did a held-out CONTEXT cell appear in the TRAIN split", which is
//       exactly what §5.2's no-peeking guarantee requires. A combo with an empty context part
//       matches nothing (it would otherwise tag every context as held-out).
//   H3. `assertWall` recomputes the held-out tags from CONFIG (via `tagHeldOut`) rather than
//       trusting each case's recorded `heldOut` tags, so a mis-tagged leak cannot slip through.
//       It also cross-checks that every recorded tag matches the recomputed tag (tag integrity)
//       and that every supplied case is actually marked `split === "train"`. Any violation
//       throws — per §5.2 a held-out label in the fitting set is a HARNESS BUG (an invalid run),
//       not a FAIL verdict.

import type {
  ConsequenceCase,
  Context,
  FamilyId,
  HeldOutContextCombo,
  HoldoutPartition,
  LockedConfig,
} from "./types.js";
import type { Rng } from "./prng.js";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers (pure; consume no randomness).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Does context `ctx` fall inside the CONTEXT cell of a held-out combo?
 *
 * A combo's `context` is a `Partial<Context>`: only the fields it pins matter (e.g. the
 * canonical grit×clean-mastering combo pins `subdomain="mastering", genre="clean-pop"` and
 * leaves `flow` free). `ctx` matches iff EVERY pinned field equals the corresponding field of
 * `ctx`. An empty context part matches NOTHING (NOTES H2) — it must never tag all contexts.
 */
function contextMatchesCombo(ctx: Context, combo: HeldOutContextCombo): boolean {
  const pinned = Object.keys(combo.context) as (keyof Context)[];
  if (pinned.length === 0) {
    return false; // empty cell pins nothing → matches nothing (guard against over-tagging)
  }
  for (const key of pinned) {
    if (combo.context[key] !== ctx[key]) {
      return false;
    }
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// §5.1 / §5.2 public API.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the registered TRAIN / HELD-OUT partition (§5.1) and commit it FIRST.
 *
 * MUST be the first consumer of the `holdout-partition` stream and run BEFORE any fitting data
 * is drawn (PRE-REGISTRATION §7.3 ordering / §5.2 no-peeking wall). The partition contents are
 * registered constants read from `cfg` (NOTES H1); `partitionRng` supplies one deterministic
 * commitment draw that seals stream-consumption order. The returned object is the immutable
 * contract every downstream module (generation, fitting, the wall guard) reads.
 */
export function buildPartition(cfg: LockedConfig, partitionRng: Rng): HoldoutPartition {
  // Commitment draw (NOTES H1): seals the holdout-partition stream as the first consumer of
  // randomness so the §5.2 wall ordering is enforceable. The value is intentionally unused —
  // the partition itself is the registered §5.1 lock, not a sampled quantity.
  void partitionRng.nextUint64();

  // Sanity: the registered partition must be disjoint (no family both TRAIN and HELD-OUT).
  // assertConfigInvariants (config.ts) already checks this at load; we re-assert defensively
  // because a leaked family here would silently break the wall.
  const trainFamilies = new Set<FamilyId>(cfg.trainFamilies);
  const heldOutFamilies = new Set<FamilyId>(cfg.heldOutFamilies);
  for (const f of heldOutFamilies) {
    if (trainFamilies.has(f)) {
      throw new Error(
        `holdout: registered partition is not disjoint — family "${f}" is both TRAIN and HELD-OUT (§5.1).`,
      );
    }
  }

  return Object.freeze({
    trainFamilies: trainFamilies as ReadonlySet<FamilyId>,
    heldOutFamilies: heldOutFamilies as ReadonlySet<FamilyId>,
    heldOutContextCombos: cfg.heldOutContextCombos,
  });
}

/**
 * Tag a (family, context) case along the two holdout axes (§5.1).
 *
 * - `family`  — true iff `family` is a HELD-OUT consequence family.
 * - `context` — true iff `ctx` falls inside a registered held-out CONTEXT cell (NOTES H2).
 *
 * A case is single-held-out if exactly one flag is true and doubly-held-out if both are true,
 * which keeps the two generalization demands separable in analysis (§5.1).
 */
export function tagHeldOut(
  p: HoldoutPartition,
  family: FamilyId,
  ctx: Context,
): { family: boolean; context: boolean } {
  const familyHeldOut = p.heldOutFamilies.has(family);
  let contextHeldOut = false;
  for (const combo of p.heldOutContextCombos) {
    if (contextMatchesCombo(ctx, combo)) {
      contextHeldOut = true;
      break;
    }
  }
  return { family: familyHeldOut, context: contextHeldOut };
}

/**
 * The no-peeking guard (§5.2): assert NO held-out cell entered the TRAIN split.
 *
 * Called by run.ts after fitting-data generation and before any method fits/decides. For every
 * supplied train case it (a) requires `split === "train"`, (b) recomputes the held-out tags
 * from the registered partition and FAILS THE RUN if either is true (a held-out family or a
 * held-out context cell in the fitting set), and (c) cross-checks the case's recorded `heldOut`
 * tags against the recomputed tags (tag integrity). Any violation throws — per §5.2 this is a
 * HARNESS BUG / invalid run, not a FAIL verdict (NOTES H3).
 */
export function assertWall(train: readonly ConsequenceCase[], p: HoldoutPartition): void {
  for (const c of train) {
    if (c.split !== "train") {
      throw new Error(
        `holdout wall: case ${c.caseId} passed to assertWall is not a TRAIN case (split="${c.split}") (§5.2).`,
      );
    }

    const tag = tagHeldOut(p, c.family, c.context);

    if (tag.family) {
      throw new Error(
        `holdout wall: HELD-OUT family "${c.family}" leaked into TRAIN split (case ${c.caseId}) (§5.2 no-peeking).`,
      );
    }
    if (tag.context) {
      const ctx = c.context;
      throw new Error(
        `holdout wall: HELD-OUT context cell (subdomain=${ctx.subdomain}, genre=${ctx.genre}, flow=${ctx.flow}) ` +
          `leaked into TRAIN split (case ${c.caseId}) (§5.2 no-peeking).`,
      );
    }

    // Tag integrity: the recorded single/double-held-out tags must agree with recomputation.
    if (c.heldOut.family !== tag.family || c.heldOut.context !== tag.context) {
      throw new Error(
        `holdout wall: case ${c.caseId} recorded heldOut tags ` +
          `{family:${c.heldOut.family}, context:${c.heldOut.context}} disagree with recomputed ` +
          `{family:${tag.family}, context:${tag.context}} (§5.1 tag integrity).`,
      );
    }
  }
}
