// host_config.h — G1A TSan/Linux certification: the single locked-parameter header.
// EVERY constant here traces to PRE-REGISTRATION.md §8 / HARNESS-SPEC.md §2.
// There are NO tunable parameters anywhere else in the harness.
//
// Locked by the frozen pre-registration (sha256 verified before build); the
// implement phase reproduces these values verbatim and may NOT change them.
#pragma once
#include <cstdint>

namespace g1a {

// ── Audio + timeline parameters (PRE-REG §4.2 / §8) ──────────────
constexpr uint32_t SAMPLE_RATE     = 48000;   // Hz
constexpr uint32_t BLOCK_SIZE      = 256;     // frames, mono
constexpr uint32_t N_BLOCKS        = 10000;   // total master blocks (~53.333 s)
constexpr uint32_t K_COMPILE_START = 100;     // block to dispatch worker compile of B
constexpr uint32_t K_XFADE_START   = 4000;    // first crossfaded block
constexpr uint32_t W_XFADE         = 64;      // crossfade window length, blocks
constexpr uint32_t K_SWAP          = 4064;    // = K_XFADE_START + W_XFADE; activeIndex 0->1
constexpr uint32_t P_MEAS          = 512;     // pre/post measurement window, blocks
constexpr uint32_t R_REPEATS       = 5;       // seeded interleaving repeats

// Per-block real-time budget (PRE-REG §5.1): 256/48000 s = 5.33333... ms.
// Expressed in nanoseconds = 5,333,333 ns. INFORMATIVE ONLY under TSan
// (TSan 2-5x slowdown => RT deadline not gated — PRE-REG §1.3, §11).
constexpr uint64_t D_BLOCK_NS = 5333333ull;

// Master seed (PRE-REG §4.2 / §8) — drives ONLY the interleaving-perturbation
// schedule; the audio itself is fully deterministic by block-indexed schedule.
// DISTINCT from pass 1 (0x6121A0001) and the reload pass (0x6121A0002).
constexpr uint64_t SEED_MASTER = 0x6121A0003ull;

// ── Frequencies (PRE-REG §4.3, §5.4) ─────────────────────────────
constexpr double FREQ_A   = 440.0;  // SineA, A4 (live, Engine A main thread)
constexpr double FREQ_B   = 880.0;  // SineB, A5 (octave up, Engine B worker compile)
constexpr double FREQ_CTL = 660.0;  // control bin (present in neither patch)

// ── Tolerances / thresholds (PRE-REG §5.4, §8) ───────────────────
constexpr double EPS_XFADE     = 1e-6;  // crossfade mix-identity tolerance
constexpr double S_CLICK       = 0.15;  // max allowed per-sample slew (click bound)
constexpr double REL_MIN       = 0.40;  // rel440_pre, rel880_post floor
constexpr double LEAK_MAX      = 0.10;  // cross-leak + control ceiling
constexpr double EPS_SPECTRAL  = 0.05;  // cross-platform spectral diff tolerance (T4f)
constexpr double EPS_PREFIX    = 1e-4;  // cross-platform short-prefix max delta (T4f)
constexpr uint32_t PREFIX_SAMPLES = 256; // cross-platform prefix length (first block)

// ── Toolchain / runtime (PRE-REG §4.1, §8) ───────────────────────
// Linux x64 prebuilt runtime from cmajor.linux.x64.zip (GitHub releases,
// v1.0.3159). Loaded via cmaj::Library::initialise(DLL_NAME); LD_LIBRARY_PATH
// must contain its directory. The .so is NOT TSan-instrumented (PRE-REG §11).
constexpr const char* DLL_NAME    = "libCmajPerformer.so";  // v1.0.3159
constexpr const char* DLL_VERSION = "1.0.3159";

// ── Windows reference values for the T4f cross-platform gate ─────
// Frozen from _run-reload/spike/artifacts/metrics.json (the Windows reload-bridge
// FINAL PASS). Used only for |rel_linux - rel_windows| <= EPS_SPECTRAL and the
// bounded short-prefix per-sample check. NOT a tunable; a captured reference.
constexpr double WIN_REF_REL440_PRE  = 0.99999170767142731;
constexpr double WIN_REF_REL880_POST = 0.99999367722426435;
constexpr double WIN_REF_CLICK_MAX   = 0.11512808501720428;
// Windows reference full_output.wav (for the first-256-sample prefix delta).
constexpr const char* WIN_REF_FULL_WAV =
    "/mnt/c/Users/doner/SSI/g1a/_run-reload/spike/artifacts/full_output.wav";

// ── Derived (computed once, not separately tunable) ──────────────
constexpr uint64_t XFADE_SAMPLES = static_cast<uint64_t>(W_XFADE) * BLOCK_SIZE;       // 16,384
constexpr uint64_t TOTAL_SAMPLES = static_cast<uint64_t>(N_BLOCKS) * BLOCK_SIZE;      // 2,560,000
constexpr uint64_t A_STREAM_SAMPLES = static_cast<uint64_t>(K_SWAP) * BLOCK_SIZE;     // 1,040,384
constexpr uint64_t B_STREAM_SAMPLES = static_cast<uint64_t>(N_BLOCKS - K_XFADE_START) * BLOCK_SIZE; // 1,536,000
constexpr uint64_t MEAS_SAMPLES  = static_cast<uint64_t>(P_MEAS) * BLOCK_SIZE;        // 131,072

// Window ranges (block indices)
constexpr uint32_t A_PRE_START  = K_XFADE_START - P_MEAS;  // 3488
constexpr uint32_t A_PRE_END    = K_XFADE_START;           // 4000
constexpr uint32_t B_POST_START = K_SWAP;                  // 4064
constexpr uint32_t B_POST_END   = K_SWAP + P_MEAS;         // 4576

} // namespace g1a
