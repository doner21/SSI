// proof.h — the reload-PROOF artifact writer (PRE-REG §5.5 / HARNESS-SPEC §9).
// Writes trace.log, the four required .wav dumps (+ auxiliary references), and
// metrics.json under g1a/_run-reload/spike/artifacts/.
#pragma once
#include <cstdint>
#include <string>
#include <vector>

namespace g1a {

// The full computed metric set + verdict (R1–R4).
struct MetricResults
{
    // ── R1: background-compile non-disruption ──
    uint64_t xrun_during_compile = 0;
    bool     compile_result_ok = false;
    uint32_t k_compile_done = 0;
    bool     compile_completed_before_xfade = false;
    bool     R1_pass = false;

    // ── R2: atomic / lock-free swap safety ──
    uint64_t asan_violations = 0;
    uint64_t crt_heap_violations = 0;
    uint64_t result_violations = 0;
    uint32_t swap_block = 0;
    uint32_t swap_count = 0;
    uint32_t old_perf_release_block = 0;
    bool     old_perf_released_post_crossfade = false;
    bool     R2_pass = false;

    // ── R3: click-free crossfade correctness ──
    double mix_err = 0.0;
    bool   alpha_monotone = false;
    double click_max = 0.0;
    double rel440_pre = 0.0;
    double rel880_post = 0.0;
    double leak880_pre = 0.0;
    double leak440_post = 0.0;
    double rel_ctl = 0.0;
    bool   R3_pass = false;

    // ── R4: determinism + completeness ──
    std::vector<std::string> hashes_full;   // R per-stream SHA-256
    std::vector<std::string> hashes_A;
    std::vector<std::string> hashes_B;
    std::vector<std::string> hashes_xfade;
    bool     repro_ok = false;
    uint64_t blocks_rendered = 0;
    uint64_t dropped_blocks = 0;
    uint64_t duplicated_blocks = 0;
    bool     R4_pass = false;

    // ── Repeat-0 timing distribution (informative) ──
    uint64_t p50_ns = 0, p99_ns = 0, max_ns = 0;

    // ── Overall ──
    bool        asan_clean = false;
    bool        proof_complete = false;
    std::string asan_log_excerpt;
    std::string final_verdict;   // "PASS" | "FAIL"
};

// WAV (IEEE float32, mono) writer.
bool writeWavFloat(const std::string& path, const float* buf, uint64_t numSamples,
                   uint32_t sampleRate);

bool writeTraceLog(const std::string& path, const MetricResults& r);
bool writeMetricsJson(const std::string& path, const MetricResults& r);

} // namespace g1a
