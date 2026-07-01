// src/prng.ts — G1B Falsifier deterministic seeding (HARNESS-SPEC §4 / PRE-REGISTRATION §7.3).
//
// A splittable, stateless-DERIVATION PRNG so every sub-stream is reproducible and
// ORDER-INDEPENDENT across modules: a stream's identity is fixed entirely by hashing
// (seedMaster, label, ...salt), never by how many values some other stream pulled first.
//
// Discipline (HARNESS-SPEC §0): strict TS, ES modules, no `any` in public signatures,
// natural-log nats elsewhere (not relevant here). The whole run is bit-reproducible from
// SEED_MASTER = 0x5551B_0001 (§7.3). NO `Math.random` anywhere — all randomness flows
// through these seeded streams. All 64-bit mixing uses bigint arithmetic masked to 64 bits.
//
// NOTES (spec-ambiguity interpretations — no new parameters introduced):
//   N1. HARNESS-SPEC §4 declares `StreamLabel` as exactly EIGHT locked labels:
//       'holdout-partition','users','fitting-data','evaluation','permutation','bootstrap',
//       'ppc','loo'. PRE-REGISTRATION §7.3 enumerates the first six in consumption order and
//       §8.1 adds the 'ppc'/'loo' sub-streams (consumed by mv.ts, derived independently of
//       'evaluation'). The §4 type is authoritative for the label SET; we declare all eight.
//       (The task prose says "7 locked labels" but then lists eight items; the spec's §4
//       `StreamLabel` union is the frozen contract, so eight is preserved.)
//   N2. SplitMix64 constants are the canonical, well-known fixed mixing constants (golden-ratio
//       increment 0x9E3779B97F4A7C15 and the two finalizer multipliers). These are part of the
//       named "SplitMix64-style" algorithm registered by §7.3, not tunable parameters.
//   N3. `nextUnit()` uses the high 53 bits of a uint64 divided by 2^53 — the standard exact
//       construction of a uniform double in [0,1) with full mantissa precision.
//   N4. `nextInt(maxExclusive)` uses rejection sampling (Lemire-style high-bit rejection) to
//       remove modulo bias; this is a correctness property of a uniform integer draw, not a
//       registered parameter.
//   N5. `fork(subLabel)` derives the child from the stream's IMMUTABLE derivation seed (not its
//       mutable pull-state), guaranteeing order-independence: forking before or after pulling
//       values yields the identical child stream.

// 64-bit mask for wrapping bigint arithmetic into unsigned 64-bit space.
const MASK64 = (1n << 64n) - 1n;

// SplitMix64 canonical constants (NOTES N2).
const GOLDEN_GAMMA = 0x9e3779b97f4a7c15n; // increment (odd, golden-ratio derived)
const MIX_MULT_1 = 0xbf58476d1ce4e5b9n;
const MIX_MULT_2 = 0x94d049bb133111ebn;

// 2^53, used to construct a uniform double in [0,1) from the top 53 bits (NOTES N3).
const TWO_POW_53 = 9007199254740992; // 2 ** 53

/**
 * One SplitMix64 step. Given the current 64-bit `state`, advance the state by the
 * golden-ratio increment and run the finalizer mix on the advanced state.
 *
 * @returns `{ value, next }` — `value` is the mixed 64-bit output, `next` is the
 *          advanced raw state to feed into the subsequent call. Pure; no side effects.
 */
export function splitmix64(state: bigint): { value: bigint; next: bigint } {
  // Advance the additive state (wraps in 64-bit unsigned space).
  const next = (state + GOLDEN_GAMMA) & MASK64;
  // Finalizer avalanche on the advanced state.
  let z = next;
  z = ((z ^ (z >> 30n)) * MIX_MULT_1) & MASK64;
  z = ((z ^ (z >> 27n)) * MIX_MULT_2) & MASK64;
  z = z ^ (z >> 31n);
  return { value: z & MASK64, next };
}

/**
 * Fold an arbitrary string into a 64-bit bigint via repeated SplitMix64 mixing of its
 * UTF-16 code units. Deterministic and platform-independent (no locale/encoding sensitivity
 * because we mix `charCodeAt` units directly).
 */
function mixString(seed: bigint, s: string): bigint {
  let acc = seed & MASK64;
  // Length-prefix so "" and "\0" and prefixes hash distinctly.
  acc = splitmix64((acc ^ BigInt(s.length)) & MASK64).value;
  for (let i = 0; i < s.length; i++) {
    acc = (acc ^ BigInt(s.charCodeAt(i))) & MASK64;
    acc = splitmix64(acc).value;
  }
  return acc & MASK64;
}

/**
 * Fold a single salt component (string or number) into the accumulator. Strings and numbers
 * are mixed through distinct domain tags so the salt `1` and the salt `"1"` never collide.
 */
function mixSalt(seed: bigint, part: string | number): bigint {
  if (typeof part === "number") {
    if (!Number.isInteger(part)) {
      // Non-integer salt is out of contract for this harness; fail loudly rather than
      // silently truncate (would otherwise break bit-reproducibility guarantees).
      throw new Error(`prng salt must be an integer or string; got non-integer ${part}`);
    }
    // Domain tag 0x01 for numeric salt; mix the integer (handle negatives via 64-bit wrap).
    const tagged = splitmix64((seed ^ 0x01n) & MASK64).value;
    return splitmix64((tagged ^ (BigInt(part) & MASK64)) & MASK64).value;
  }
  // Domain tag 0x02 for string salt.
  const tagged = splitmix64((seed ^ 0x02n) & MASK64).value;
  return mixString(tagged, part);
}

/**
 * Derive a deterministic 64-bit seed from (seedMaster, label, salt[]). Order-DEPENDENT within
 * the salt array (salt is an ordered tuple), but INDEPENDENT of any other stream's activity.
 * The same inputs always yield the same seed — the basis of the §7.3 reproducibility guarantee.
 */
export function hashLabel(seedMaster: bigint, label: string, salt: (string | number)[]): bigint {
  let acc = mixString(seedMaster & MASK64, label);
  for (const part of salt) {
    acc = mixSalt(acc, part);
  }
  // Final avalanche so the derived seed is well-distributed before it becomes a stream state.
  return splitmix64(acc).value;
}

/**
 * A pull-based deterministic stream. `fork` produces a deterministic, order-independent child.
 */
export interface Rng {
  /** Next raw 64-bit unsigned value. */
  nextUint64(): bigint;
  /** Next uniform double in [0,1) with full 53-bit mantissa precision. */
  nextUnit(): number;
  /** Next uniform integer in [0, maxExclusive) via unbiased rejection sampling. */
  nextInt(maxExclusive: number): number;
  /** Deterministic child stream keyed by `subLabel`; independent of pull-state (NOTES N5). */
  fork(subLabel: string | number): Rng;
}

/**
 * Concrete Rng. Holds an IMMUTABLE derivation `seed` (used for forking, NOTES N5) and a
 * MUTABLE `state` that advances on each pull. SplitMix64 is the underlying generator.
 */
class SplitMixRng implements Rng {
  private state: bigint;
  private readonly seed: bigint;

  constructor(seed: bigint) {
    this.seed = seed & MASK64;
    this.state = this.seed;
  }

  nextUint64(): bigint {
    const { value, next } = splitmix64(this.state);
    this.state = next;
    return value;
  }

  nextUnit(): number {
    // Top 53 bits → uniform in [0,1). Number() of a <=53-bit bigint is exact.
    const bits53 = this.nextUint64() >> 11n;
    return Number(bits53) / TWO_POW_53;
  }

  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error(`nextInt requires a positive integer bound; got ${maxExclusive}`);
    }
    const m = BigInt(maxExclusive);
    // Unbiased rejection: discard the top region of 2^64 that would skew the modulo (NOTES N4).
    // limit = largest multiple of m that is <= 2^64.
    const limit = ((MASK64 + 1n) / m) * m;
    let x = this.nextUint64();
    while (x >= limit) {
      x = this.nextUint64();
    }
    return Number(x % m);
  }

  fork(subLabel: string | number): Rng {
    // Derive from the immutable seed (NOT the mutable state) so forks are order-independent.
    const childSeed = hashLabel(this.seed, "fork", [subLabel]);
    return new SplitMixRng(childSeed);
  }
}

/**
 * The eight locked stream labels (HARNESS-SPEC §4; see NOTES N1). Their consumption order is
 * enforced by run.ts (§7.3); `permutation` is recorded-unused when N ≤ permExactMaxN, and
 * `ppc`/`loo` are consumed by mv.ts independently of `evaluation` (§8.1).
 */
export type StreamLabel =
  | "holdout-partition"
  | "users"
  | "fitting-data"
  | "evaluation"
  | "permutation"
  | "bootstrap"
  | "ppc"
  | "loo";

/**
 * Derive a top-level stream by hashing (seedMaster, label, ...salt) — SplitMix64 mixing.
 * The returned stream is reproducible and independent of every other stream's activity.
 */
export function deriveStream(
  seedMaster: bigint,
  label: StreamLabel,
  ...salt: (string | number)[]
): Rng {
  const seed = hashLabel(seedMaster, label, salt);
  return new SplitMixRng(seed);
}
