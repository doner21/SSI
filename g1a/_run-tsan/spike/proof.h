// proof.h — the TSan-cert PROOF artifact writer (PRE-REG §6 / HARNESS-SPEC §9).
// Writes trace.log, the required .wav dumps (+ auxiliary references), and the
// machine-checkable metrics.json with the T1–T4 schema. WAV writer is identical
// to the Windows harness; the metrics struct/JSON is the TSan-pass schema.
#pragma once
#include <cstdint>
#include <string>
#include <vector>

namespace g1a {

// The full computed metric set + verdict (T1–T4, PRE-REG §6 metrics.json schema).
struct MetricResults
{
    // ── T1: Clean Linux TSan BUILD + feasibility sub-gate ──
    bool        host_build_ok = false;
    bool        control_build_ok = false;
    bool        rtprobe_build_ok = false;
    bool        link_ok = false;
    bool        tsan_enabled_in_binary = false;
    bool        linux_runtime_obtained = false;
    std::string runtime_arch = "unknown";       // expect "x86_64"
    std::string runtime_version = "unknown";    // expect "1.0.3159"
    bool        T1_pass = false;

    // ── T2: TSAN-CLEAN main run ──
    uint64_t nonsuppressed_race_reports = 0;
    uint64_t warning_reports = 0;
    uint64_t suppressed_race_count = 0;
    uint64_t host_suppressed_races = 0;
    uint64_t runs_completed = 0;
    uint64_t blocks_per_run = 0;
    bool     T2_pass = false;

    // ── T3: DETECTOR-LIVENESS (a control race; b RT-probe) ──
    bool control_race_caught = false;   // T3a
    bool rtprobe_race_caught = false;   // T3b (≥1 race report)
    bool rtprobe_frame_named = false;   // T3b (report names an RT-loop frame)
    bool detector_alive = false;
    bool rt_covered = false;
    bool T3_pass = false;

    // ── T4: FUNCTIONAL EQUIVALENCE + COMPLETENESS ──
    // (a) spectral endpoints
    double rel440_pre = 0.0;
    double rel880_post = 0.0;
    double leak880_pre = 0.0;
    double leak440_post = 0.0;
    double rel_ctl = 0.0;
    // (b) mix identity
    double mix_err = 0.0;
    bool   alpha_monotone = false;
    // (c) click-free
    double click_max = 0.0;
    // (d) completeness + swap
    uint64_t blocks_rendered = 0;
    uint32_t swap_block = 0;
    uint32_t swap_count = 0;
    uint64_t dropped_blocks = 0;
    uint64_t duplicated_blocks = 0;
    bool     old_perf_released_post_crossfade = false;
    // (e) within-Linux determinism
    std::vector<std::string> hashes_full;
    std::vector<std::string> hashes_A;
    std::vector<std::string> hashes_B;
    std::vector<std::string> hashes_xfade;
    bool     repro_ok = false;
    // (f) cross-platform equivalence (spectral + bounded short-prefix)
    double delta_rel440_pre = 0.0;
    double delta_rel880_post = 0.0;
    double delta_click_max = 0.0;
    double prefix_max_delta = 0.0;
    double win_ref_rel440_pre = 0.0;
    double win_ref_rel880_post = 0.0;
    double win_ref_click_max = 0.0;
    bool   T4_pass = false;

    // ── Informative timing (NOT gated under TSan) ──
    uint64_t p50_ns = 0, p99_ns = 0, max_ns = 0;
    uint64_t xrun_informative = 0;
    uint32_t k_compile_done = 0;
    bool     compile_result_ok = false;

    // ── Overall ──
    bool        tsan_clean = false;       // T2 nonsuppressed==0 ∧ warnings==0
    bool        proof_complete = false;
    std::string final_verdict;            // "PASS" | "FAIL"
};

// WAV (IEEE float32, mono) writer.
bool writeWavFloat(const std::string& path, const float* buf, uint64_t numSamples,
                   uint32_t sampleRate);

bool writeTraceLog(const std::string& path, const MetricResults& r);
bool writeMetricsJson(const std::string& path, const MetricResults& r);
bool writeLogicDiffWitness(const std::string& path);

} // namespace g1a
