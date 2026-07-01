// metrics.h — exact metric estimators for R1–R4 (HARNESS-SPEC §8 / PRE-REG §5).
// Goertzel single-bin magnitude, per-block timing reduction, crossfade
// mix-identity, click/slew bound, embedded SHA-256 (public-domain). No external
// dependencies.
#pragma once
#include <cstdint>
#include <string>
#include <vector>

namespace g1a {

// ── SHA-256 over a raw byte buffer → lowercase hex string ─────────
std::string sha256_hex(const void* data, size_t numBytes);
// Hash a float32 buffer's little-endian byte stream (HARNESS-SPEC §8).
std::string sha256_floats(const float* buf, uint64_t numFloats);

// ── Goertzel single-bin magnitude, normalised by sample count ─────
double goertzelMag(const float* x, uint64_t M, double freq, double fs);

// ── R3a: crossfade mix-identity ───────────────────────────────────
// max_m | xfade[m] - ((1-alpha(m))*a[m] + alpha(m)*b[m]) |  over XFADE_SAMPLES.
double mixError(const float* xfade, const float* a, const float* b, uint64_t M);
// alpha schedule monotone non-decreasing with alpha(0)==0 and alpha(M-1)==1.
bool alphaMonotone(uint64_t M);

// ── R3b: click / slew bound ───────────────────────────────────────
// max_{k=1..M-1} | x[k] - x[k-1] |  over the full master output.
double clickMax(const float* x, uint64_t M);

// ── Per-block timing reduction (R1/R2) ────────────────────────────
struct TimingStats
{
    uint64_t xrun_count = 0;   // blocks in the window with t_k > D_block
    uint64_t p50_ns = 0;
    uint64_t p99_ns = 0;
    uint64_t max_ns = 0;
};
// p50/p99/max over ALL blocks; xrun_count over blocks [winLo, winHi] (inclusive)
// whose compute time exceeds dBlockNs (the compile-window xrun for R1).
TimingStats reduceTimings(const std::vector<uint64_t>& blockNs,
                          uint32_t winLo, uint32_t winHi, uint64_t dBlockNs);

// ── Block-completeness audit (R4b) ────────────────────────────────
struct CompletenessStats
{
    uint64_t blocks_rendered = 0;
    uint64_t dropped_blocks = 0;
    uint64_t duplicated_blocks = 0;
};
// Audits a written-block-index sequence against the contiguous range 0..N-1.
CompletenessStats auditCompleteness(const std::vector<uint32_t>& writtenBlocks, uint32_t n);

// ── all-equal check (R4a) ─────────────────────────────────────────
bool allEqual(const std::vector<std::string>& hs);

} // namespace g1a
