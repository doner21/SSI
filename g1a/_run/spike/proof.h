// proof.h — the concurrency-PROOF artifact writer (HARNESS-SPEC §9 / PRE-REG §5.5).
// Writes trace.log, the five .wav dumps, and metrics.json under artifacts/.
#pragma once
#include <cstdint>
#include <string>
#include <vector>

namespace g1a {

// All computed estimator values + booleans for the proof bundle.
struct MetricResults
{
    // M1 — completeness + memory safety
    uint64_t result_violations = 0;
    uint64_t blocks_A = 0, blocks_B = 0;     // per repeat (all repeats equal N_BLOCKS)
    uint64_t asan_violations = 0;
    uint64_t crt_heap_violations = 0;
    bool     M1_pass = false;

    // M2 — real-time deadline integrity (repeat 0)
    uint64_t xrun_count = 0, p50_ns = 0, p99_ns = 0, max_ns = 0;
    bool     M2_pass = false;

    // M3 — mixed-output correctness
    double rel440 = 0, rel880 = 0, rel_ctl = 0, mix_err = 0;
    bool   M3_pass = false;

    // M4 — determinism + isolation
    std::vector<std::string> hashes_A, hashes_B, hashes_mixed;  // R hashes each
    bool   repro_ok = false;
    double iso_A_err = 0, iso_B_err = 0;
    bool   M4_pass = false;

    // overall
    bool        asan_clean = false;
    bool        proof_complete = false;
    std::string final_verdict = "FAIL";
    std::string asan_log_excerpt;

    // ── control_config (the "fed" passthrough path, HARNESS-SPEC §6) ──
    uint64_t ctl_result_violations = 0, ctl_blocks_A = 0, ctl_blocks_B = 0;
    bool     ctl_M1_pass = false;
    uint64_t ctl_xrun_count = 0, ctl_p50_ns = 0, ctl_p99_ns = 0, ctl_max_ns = 0;
    bool     ctl_M2_pass = false;
    std::vector<std::string> ctl_hashes_A, ctl_hashes_B, ctl_hashes_mixed;
    bool     ctl_repro_ok = false;
    double   ctl_iso_A_err = 0, ctl_iso_B_err = 0;
    bool     ctl_M4_pass = false;
};

// Write a mono 32-bit-float WAV (audioFormat=3) at the locked fs.
bool writeWavFloat(const std::string& path, const float* buf, uint64_t numSamples,
                   uint32_t sampleRate);

// Write the human-readable trace.log.
bool writeTraceLog(const std::string& path, const MetricResults& r,
                   const std::string& barrierOrderingSample);

// Write the machine-checkable metrics.json.
bool writeMetricsJson(const std::string& path, const MetricResults& r);

} // namespace g1a
