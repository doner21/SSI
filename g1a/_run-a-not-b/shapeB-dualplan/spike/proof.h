// proof.h — the event-replay PROOF artifact writer (HARNESS-SPEC §9 / PRE-REG §5.5).
// Writes trace.log, schedule.json, events_applied.log, sample dumps (.wav),
// and metrics.json under artefacts/.
#pragma once
#include <cstdint>
#include <string>
#include <vector>
#include <utility>

#include "host_config.h"
#include "event_schedule.h"

namespace g1a {

// The full computed metric set + verdict (R1–R4).
struct MetricResults
{
    // ── R1: event-delivery & prepare non-disruption ──
    uint64_t xrun_during_prepare = 0;
    bool     createPerformer_result_ok = false;
    bool     engineB_link_ok = false;
    uint32_t k_prepare_done = 0;
    bool     b_ready_before_xfade = false;
    uint64_t events_delivered_A_prepare = 0;
    uint64_t events_expected_A_prepare = 0;
    uint64_t events_dropped_in_window = 0;
    uint64_t b_xfade_initial_latch_count = 0;
    bool     R1_pass = false;

    // ── R2: atomic/lock-free swap safety + reset + latch-replay ──
    uint64_t asan_violations = 0;
    uint64_t crt_heap_violations = 0;
    uint64_t result_violations = 0;
    uint32_t swap_block = 0;
    uint32_t swap_count = 0;
    bool     reset_called_on_B = false;
    bool     latch_replay_called = false;
    uint64_t xrun_at_swap = 0;
    uint32_t old_perf_release_block = 0;
    bool     old_perf_released_post_crossfade = false;
    bool     R2_pass = false;

    // ── R3: event-response correctness + click-free ──
    double maxerr_reload_A = 0.0;   // A[0,K_XFADE_START) vs REF_A
    double mix_err = 0.0;
    bool   alpha_monotone = false;
    double maxerr_B_xfade = 0.0;   // B_xfade vs REF_Bxfade
    double maxerr_reload_B = 0.0;  // B[K_SWAP,N) vs REF_Bpost
    double rel_expected_Bpost = 0.0;   // Goertzel normalised to solo ref
    double rel_expected_Apre = 0.0;
    double click_max = 0.0;
    double click_max_Bsolo = 0.0;
    bool   click_boundary_excluded = true;
    bool   param_carry_audit_ok = false;
    bool   R3_pass = false;

    // ── R4: determinism + completeness + event audit ──
    std::vector<std::string> hashes_full;    // R per-stream SHA-256
    std::vector<std::string> hashes_A;
    std::vector<std::string> hashes_B;
    std::vector<std::string> hashes_xfade;
    bool     repro_ok = false;
    uint64_t blocks_rendered = 0;
    uint64_t dropped_blocks = 0;
    uint64_t duplicated_blocks = 0;
    uint64_t events_applied_A = 0;
    uint64_t events_scheduled_pre_swap = 0;
    uint64_t events_applied_B_pre = 0;
    uint64_t events_scheduled_xfade = 0;
    uint64_t events_applied_B_post = 0;
    uint64_t events_scheduled_post_swap = 0;
    uint64_t latch_count_b_xfade = 0;
    uint64_t latch_replay_count = 0;
    bool     R4_pass = false;

    // ── Timing (informative) ──
    uint64_t p50_ns = 0, p99_ns = 0, max_ns = 0;

    // ── Overall ──
    bool        asan_clean = false;
    bool        proof_complete = false;
    std::string asan_log_excerpt;
    std::string final_verdict;   // "PASS" | "FAIL"

    // ── B-patch source integrity ──
    std::string b_patch_sha;
    std::string b_patch_sha_convention;

    // ── Locked constants (for verifier cross-reference) ──
    double mod_index = 0.0;
    double ratio = 0.0;

    // ── Per-repeat hash record (all 5 repeats) ──
    struct PerRepeat { std::string hash_full; std::string hash_A; std::string hash_B; std::string hash_xfade; };
    std::vector<PerRepeat> per_repeat;

    // ── Crossfade convention ──
    std::string xfade_convention = "per-block equal-power a=cos(theta) b=sin(theta) theta=(pi/2)*(i+1)/64";

    // ── 64 per-block (a,b) pairs for verifier ──
    std::vector<std::pair<double, double>> xfade_coeffs;
};

// WAV (IEEE float32, mono) writer.
bool writeWavFloat(const std::string& path, const float* buf, uint64_t numSamples,
                   uint32_t sampleRate);

bool writeTraceLog(const std::string& path, const MetricResults& r);
bool writeEventsAppliedLog(const std::string& path,
                           const std::vector<std::pair<uint32_t, double>>& evA,
                           const std::vector<std::pair<uint32_t, double>>& evBPre,
                           const std::vector<std::pair<uint32_t, double>>& evBPost,
                           const std::vector<std::pair<uint32_t, double>>& xfadeInitLatch,
                           const std::vector<std::pair<uint32_t, double>>& latchReplay,
                           const MetricResults& r);
bool writeScheduleJson(const std::string& path, const EventSchedule& sched, uint64_t seedMaster);
bool writeMetricsJson(const std::string& path, const MetricResults& r);

} // namespace g1a
