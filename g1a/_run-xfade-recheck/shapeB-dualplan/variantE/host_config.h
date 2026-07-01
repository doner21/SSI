// host_config.h — G1A EVENT-REPLAY spike: the single locked-parameter header.
// EVERY constant here traces to PRE-REGISTRATION.md §7 / HARNESS-SPEC.md §2.
// There are NO tunable parameters anywhere else in the harness.
//
// Locked by the frozen pre-registration; the implement phase reproduces these
// values verbatim and may NOT change them.
#pragma once
#include <cstdint>
#include <vector>

namespace g1a {

// ── Audio + timeline parameters (PRE-REG §4.2) ───────────────────
constexpr uint32_t SAMPLE_RATE     = 48000;    // Hz
constexpr uint32_t BLOCK_SIZE      = 256;      // frames, mono
constexpr uint32_t N_BLOCKS        = 10000;    // total master blocks (~53.333 s)
constexpr uint32_t K_PREPARE_START = 100;      // block to dispatch worker prepare of B
constexpr uint32_t K_XFADE_START   = 4000;     // first crossfaded block
constexpr uint32_t W_XFADE         = 64;       // crossfade window length, blocks
constexpr uint32_t K_SWAP          = 4064;     // = K_XFADE_START + W_XFADE; activeIndex 0->1
constexpr uint32_t P_MEAS          = 512;      // pre/post measurement window, blocks

// ── Warm-up normalization (PRE-REG XFADE-THREAD §4) ──────────────
constexpr uint32_t W_WARM          = 1;        // warm-up advance blocks before reset+latch
constexpr uint32_t R_REPEATS       = 5;        // seeded interleaving repeats

// Per-block real-time budget (PRE-REG §5.1): 256/48000 s = 5.33333... ms.
constexpr uint64_t D_BLOCK_NS = 5333333ull;

// Master seed (PRE-REG §4.2) — drives event schedule + perturbation.
constexpr uint64_t SEED_MASTER = 0x6121A0003ull;

// ── Frequencies (PRE-REG §4.3, §5.3) ─────────────────────────────
constexpr double AMP = 0.25;  // sine amplitude

// Frequency palette from which events are drawn (PRE-REG §4.6).
constexpr double FREQ_PALETTE_RAW[] = { 220.0, 330.0, 440.0, 550.0, 660.0 };
inline std::vector<double> freqPalette() {
    return { 220.0, 330.0, 440.0, 550.0, 660.0 };
}

// ── Tolerances / thresholds (PRE-REG §5.3, §7) ───────────────────
constexpr double EPS_XFADE = 1e-6;   // crossfade mix-identity tolerance
constexpr double S_CLICK   = 0.05;   // max allowed per-sample slew (K_SWAP excluded)
constexpr double REL_MIN   = 0.40;   // Goertzel relative magnitude floor
constexpr double LEAK_MAX  = 0.10;   // cross-leakage ceiling

// ── Toolchain / DLL (PRE-REG §4.1) ───────────────────────────────
constexpr const char* DLL_NAME    = "CmajPerformer.dll";   // v1.0.3159
constexpr const char* DLL_VERSION = "1.0.3159";

// ── Derived (computed once, not separately tunable) ──────────────
constexpr uint64_t XFADE_SAMPLES = static_cast<uint64_t>(W_XFADE) * BLOCK_SIZE;        // 16,384
constexpr uint64_t TOTAL_SAMPLES  = static_cast<uint64_t>(N_BLOCKS) * BLOCK_SIZE;      // 2,560,000
constexpr uint64_t A_STREAM_SAMPLES = static_cast<uint64_t>(K_SWAP) * BLOCK_SIZE;      // 1,040,384
constexpr uint64_t B_STREAM_SAMPLES = static_cast<uint64_t>(N_BLOCKS - K_XFADE_START) * BLOCK_SIZE; // 1,536,000
constexpr uint64_t MEAS_SAMPLES   = static_cast<uint64_t>(P_MEAS) * BLOCK_SIZE;        // 131,072

// Window ranges (block indices)
constexpr uint32_t A_PRE_START = K_XFADE_START - P_MEAS;  // 3488
constexpr uint32_t A_PRE_END   = K_XFADE_START;           // 4000
constexpr uint32_t B_POST_START = K_SWAP;                 // 4064
constexpr uint32_t B_POST_END   = K_SWAP + P_MEAS;        // 4576

// Number of frequencies in palette
constexpr uint32_t FREQ_PALETTE_COUNT = 5;

} // namespace g1a
