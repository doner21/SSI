// host_config.h — G1A spike: the single locked-parameter header.
// EVERY constant here traces to PRE-REGISTRATION.md §7 / HARNESS-SPEC.md §2.
// There are NO tunable parameters anywhere else in the harness.
//
// Locked by the frozen pre-registration; the implement phase reproduces these
// values verbatim and may NOT change them.
#pragma once
#include <cstdint>

namespace g1a {

// ── Audio parameters (PRE-REG §4.2) ──────────────────────────────
constexpr uint32_t SAMPLE_RATE = 48000;     // Hz
constexpr uint32_t BLOCK_SIZE  = 256;       // frames, mono
constexpr uint32_t N_BLOCKS    = 10000;     // blocks per performer
constexpr uint32_t R_REPEATS   = 5;         // seeded interleaving repeats

// Total rendered samples per stream = 10000 * 256 = 2,560,000
constexpr uint64_t TOTAL_SAMPLES =
    static_cast<uint64_t>(N_BLOCKS) * static_cast<uint64_t>(BLOCK_SIZE);

// Per-block real-time budget (PRE-REG §5.2): 256/48000 s = 5.33333... ms.
// Expressed in nanoseconds = 5,333,333 ns (the locked integer value).
constexpr uint64_t D_BLOCK_NS = 5333333ull;

// Master seed (PRE-REG §4.2) — drives ONLY the interleaving-perturbation
// schedule; the audio itself is fully deterministic.
constexpr uint64_t SEED_MASTER = 0x6121A0001ull;

// ── Frequencies (PRE-REG §4.3, §5.3) ─────────────────────────────
constexpr double FREQ_A   = 440.0;  // SineA, A4
constexpr double FREQ_B   = 880.0;  // SineB, A5 (one octave up)
constexpr double FREQ_CTL = 660.0;  // control bin (present in neither performer)

// ── Tolerances / thresholds (PRE-REG §5.3, §7) ───────────────────
constexpr double EPS_MIX     = 1e-6;  // max |mixed - (A+B)| allowed
constexpr double REL_MIN     = 0.40;  // rel440, rel880 floor
constexpr double REL_CTL_MAX = 0.10;  // control-bin leakage ceiling

// ── Toolchain / DLL (PRE-REG §4.1) ───────────────────────────────
constexpr const char* DLL_NAME     = "CmajPerformer.dll";   // v1.0.3159
constexpr const char* DLL_VERSION  = "1.0.3159";

} // namespace g1a
