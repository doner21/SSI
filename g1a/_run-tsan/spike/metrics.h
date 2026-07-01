// metrics.h — exact metric estimators for T1–T4 (HARNESS-SPEC §8 / PRE-REG §5).
// Goertzel single-bin magnitude, crossfade mix-identity, click/slew bound,
// completeness audit, embedded SHA-256 (public-domain), plus the TSan-pass
// additions: WAV-read + bounded short-prefix cross-platform delta (T4f) and
// TSan-log parsing helpers (T2/T3 race-report counting). No external dependencies.
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

// ── T4b: crossfade mix-identity ───────────────────────────────────
// max_m | xfade[m] - ((1-alpha(m))*a[m] + alpha(m)*b[m]) |  over XFADE_SAMPLES.
double mixError(const float* xfade, const float* a, const float* b, uint64_t M);
// alpha schedule monotone non-decreasing with alpha(0)==0 and alpha(M-1)==1.
bool alphaMonotone(uint64_t M);

// ── T4c: click / slew bound ───────────────────────────────────────
// max_{k=1..M-1} | x[k] - x[k-1] |  over the full master output.
double clickMax(const float* x, uint64_t M);

// ── Per-block timing reduction (informative only under TSan) ──────
struct TimingStats
{
    uint64_t xrun_count = 0;   // blocks in the window with t_k > D_block (informative)
    uint64_t p50_ns = 0;
    uint64_t p99_ns = 0;
    uint64_t max_ns = 0;
};
TimingStats reduceTimings(const std::vector<uint64_t>& blockNs,
                          uint32_t winLo, uint32_t winHi, uint64_t dBlockNs);

// ── Block-completeness audit (T4d) ────────────────────────────────
struct CompletenessStats
{
    uint64_t blocks_rendered = 0;
    uint64_t dropped_blocks = 0;
    uint64_t duplicated_blocks = 0;
};
CompletenessStats auditCompleteness(const std::vector<uint32_t>& writtenBlocks, uint32_t n);

// ── all-equal check (T4e) ─────────────────────────────────────────
bool allEqual(const std::vector<std::string>& hs);

// ── T4f: cross-platform support ───────────────────────────────────
// Read a mono IEEE-float32 .wav into 'out'. Returns false on any failure
// (file missing / malformed / not float32). Used for the Windows reference.
bool readWavFloat(const std::string& path, std::vector<float>& out);
// max_{k=0..count-1} | a[k] - b[k] |  over the first 'count' samples of each.
// Returns a large sentinel (1e30) if either buffer is shorter than 'count'.
double prefixMaxDelta(const float* a, uint64_t aLen,
                      const float* b, uint64_t bLen, uint64_t count);

// ── TSan log parsing (T2 / T3a / T3b) ─────────────────────────────
// Count occurrences of 'needle' across all lines of the file at 'path'.
// Returns 0 if the file cannot be opened.
uint64_t countInFile(const std::string& path, const std::string& needle);
// True iff the file at 'path' contains at least one line with 'needle'.
bool fileContains(const std::string& path, const std::string& needle);
// True iff the file contains a "WARNING: ThreadSanitizer: data race" report AND
// at least one backtrace line naming 'frameNeedle' (e.g. "rt_render.cpp").
bool raceNamesFrame(const std::string& path, const std::string& frameNeedle);
// Parse the TSan summary "ThreadSanitizer: Suppressed N warnings" -> N (0 if none).
uint64_t parseSuppressedCount(const std::string& path);

} // namespace g1a
