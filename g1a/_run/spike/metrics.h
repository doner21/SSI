// metrics.h — exact metric estimators (HARNESS-SPEC §8 / PRE-REG §5).
// Goertzel single-bin magnitude, per-block timing reduction, bit-compare,
// embedded SHA-256 (public-domain). No external dependencies.
#pragma once
#include <cstdint>
#include <string>
#include <vector>

namespace g1a {

// ── SHA-256 over a raw byte buffer → lowercase hex string ─────────
std::string sha256_hex(const void* data, size_t numBytes);

// Convenience: hash a float32 buffer's little-endian byte stream (HARNESS-SPEC §8).
std::string sha256_floats(const float* buf, uint64_t numFloats);

// ── Goertzel single-bin magnitude, normalised by sample count ─────
// Standard recurrence at w = 2*pi*f/fs; magnitude / M.
double goertzelMag(const float* x, uint64_t M, double freq, double fs);

// ── Per-block timing reduction (M2) ───────────────────────────────
struct TimingStats
{
    uint64_t xrun_count = 0;
    uint64_t p50_ns = 0;
    uint64_t p99_ns = 0;
    uint64_t max_ns = 0;
};
// Combines the two performers' per-block (advance+copy) times with the per-block
// mixer cost, per PRE-REG §5.2: t_k(perf) = perfNs[k] + mixNs[k]. xrun if
// t_k > dBlockNs. Distribution over all 2*N samples.
TimingStats reduceTimings(const std::vector<uint64_t>& perfA_ns,
                          const std::vector<uint64_t>& perfB_ns,
                          const std::vector<uint64_t>& mix_ns,
                          uint64_t dBlockNs);

// ── Bit/abs comparison ────────────────────────────────────────────
// Max |a[k] - b[k]| over M samples (exact float arithmetic).
double maxAbsDiff(const float* a, const float* b, uint64_t M);

} // namespace g1a
