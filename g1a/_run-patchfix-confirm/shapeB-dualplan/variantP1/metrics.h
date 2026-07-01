// metrics.h — exact metric estimators for R1–R4 (HARNESS-SPEC §8 / PRE-REG §5).
// Goertzel, timing reduction, mix-identity, click/slew bound, embedded SHA-256,
// completeness audit, event-application audit.
#pragma once
#include <cstdint>
#include <string>
#include <vector>
#include <utility>

namespace g1a {

// ── SHA-256 over raw byte buffer / float32 stream ──
std::string sha256_hex(const void* data, size_t numBytes);
std::string sha256_floats(const float* buf, uint64_t numFloats);

// ── Goertzel single-bin magnitude, normalised by sample count ──
double goertzelMag(const float* x, uint64_t M, double freq, double fs);

// ── R3a: crossfade mix-identity ──
double mixError(const float* xfade, const float* a, const float* b, uint64_t M);
bool alphaMonotone(uint64_t M);

// ── R3f: click / slew bound ──
// Computed over full output EXCEPT the K_SWAP boundary sample pair.
double clickMaxExcludeBoundary(const float* x, uint64_t M, uint64_t boundarySample);

// Extended click analysis: returns argmax sample + per-sample slew percentiles.
struct ClickAnalysis {
    double click_max = 0.0;
    uint64_t argmax_sample = 0;
    uint64_t argmax_block = 0;
    uint32_t argmax_offset = 0;
    float argmax_prev = 0.0f;
    float argmax_cur = 0.0f;
    bool is_K_SWAP = false;          // argmax lies at the K_SWAP boundary pair
    double slew_median = 0.0;
    double slew_p95 = 0.0;
    double slew_p99 = 0.0;
    double slew_mean = 0.0;
};
ClickAnalysis clickAnalyze(const float* x, uint64_t M, uint64_t boundarySample, uint32_t kSwap);

// ── Per-block timing reduction (R1/R2) ──
struct TimingStats
{
    uint64_t xrun_count = 0;
    uint64_t p50_ns = 0;
    uint64_t p99_ns = 0;
    uint64_t max_ns = 0;
};
TimingStats reduceTimings(const std::vector<uint64_t>& blockNs,
                          uint32_t winLo, uint32_t winHi, uint64_t dBlockNs);

// ── Block-completeness audit (R4) ──
struct CompletenessStats
{
    uint64_t blocks_rendered = 0;
    uint64_t dropped_blocks = 0;
    uint64_t duplicated_blocks = 0;
};
CompletenessStats auditCompleteness(const std::vector<uint32_t>& writtenBlocks, uint32_t n);

// ── all-equal check (R4a) ──
bool allEqual(const std::vector<std::string>& hs);

} // namespace g1a
