// proof.cpp — writes trace.log, events_applied.log, schedule.json, .wav dumps, and metrics.json.
#include "proof.h"
#include "host_config.h"
#include <fstream>
#include <iomanip>

namespace g1a {

// ── WAV (IEEE float32, mono) ──────────────────────────────────────
bool writeWavFloat(const std::string& path, const float* buf, uint64_t numSamples,
                   uint32_t sampleRate)
{
    std::ofstream f(path, std::ios::binary);
    if (!f) return false;

    const uint16_t channels      = 1;
    const uint16_t bitsPerSample = 32;
    const uint16_t audioFormat   = 3;   // IEEE float
    const uint32_t byteRate      = sampleRate * channels * (bitsPerSample / 8);
    const uint16_t blockAlign    = channels * (bitsPerSample / 8);
    const uint64_t dataBytes64   = numSamples * (bitsPerSample / 8);
    const uint32_t dataBytes     = (uint32_t)dataBytes64;
    const uint32_t riffSize      = 36 + dataBytes;

    auto w32 = [&](uint32_t v){ f.write(reinterpret_cast<const char*>(&v), 4); };
    auto w16 = [&](uint16_t v){ f.write(reinterpret_cast<const char*>(&v), 2); };

    f.write("RIFF", 4); w32(riffSize); f.write("WAVE", 4);
    f.write("fmt ", 4); w32(16); w16(audioFormat); w16(channels);
    w32(sampleRate); w32(byteRate); w16(blockAlign); w16(bitsPerSample);
    f.write("data", 4); w32(dataBytes);
    f.write(reinterpret_cast<const char*>(buf), (std::streamsize)dataBytes64);
    return (bool)f;
}

// ── trace.log ─────────────────────────────────────────────────────
bool writeTraceLog(const std::string& path, const MetricResults& r)
{
    std::ofstream f(path);
    if (!f) return false;

    f << "G1A EVENT-REPLAY SPIKE — trace.log\n";
    f << "=================================================\n";
    f << "Locked run parameters (PRE-REG §7):\n";
    f << "  fs=" << SAMPLE_RATE << " Hz, block=" << BLOCK_SIZE
      << " frames, N_blocks=" << N_BLOCKS << ", R_repeats=" << R_REPEATS << "\n";
    f << "  K_PREPARE_START=" << K_PREPARE_START << ", K_XFADE_START=" << K_XFADE_START
      << ", W_XFADE=" << W_XFADE << ", K_SWAP=" << K_SWAP << ", P_MEAS=" << P_MEAS << "\n";
    f << "  D_block=" << D_BLOCK_NS << " ns, seed_master=0x" << std::hex << SEED_MASTER << std::dec << "\n";
    f << "  AMP=" << AMP << ", freq_palette = {220, 330, 440, 550, 660} Hz\n";
    f << "  EPS_XFADE=1e-6, S_CLICK=" << S_CLICK << ", REL_MIN=" << REL_MIN << ", LEAK_MAX=" << LEAK_MAX << "\n";
    f << "  DLL CmajPerformer.dll v" << DLL_VERSION << "\n";
    f << "  toolchain MSVC cl 19.50, C++17, /DCMAJOR_DLL=1\n\n";

    f << "── R1 event-delivery & prepare non-disruption ──\n";
    f << "  xrun_during_prepare = " << r.xrun_during_prepare << " (gate: ==0)\n";
    f << "  createPerformer_result = " << (r.createPerformer_result_ok ? "Ok" : "Fail") << " (gate: Ok)\n";
    f << "  K_PREPARE_DONE = " << r.k_prepare_done << "\n";
    f << "  b_ready_before_xfade = " << (r.b_ready_before_xfade ? "true" : "false")
      << " (gate: K_PREPARE_DONE < " << K_XFADE_START << ")\n";
    f << "  events_delivered_A_prepare = " << r.events_delivered_A_prepare
      << " (expected: " << r.events_expected_A_prepare << " gate: ==expected)\n";
    f << "  events_dropped_in_window = " << r.events_dropped_in_window << " (gate: ==0)\n";
    f << "  b_xfade_initial_latch_count = " << r.b_xfade_initial_latch_count << " (gate: ==1)\n";
    f << "  R1 = " << (r.R1_pass ? "PASS" : "FAIL") << "\n\n";

    f << "── R2 atomic/lock-free swap safety + reset + latch-replay ──\n";
    f << "  asan_violations = " << r.asan_violations << " (gate: ==0)\n";
    f << "  crt_heap_violations = " << r.crt_heap_violations << " (gate: ==0)\n";
    f << "  result_violations = " << r.result_violations << " (gate: ==0)\n";
    f << "  swap_block = " << r.swap_block << " (gate: ==" << K_SWAP << ")\n";
    f << "  swap_count = " << r.swap_count << " (gate: ==1)\n";
    f << "  reset_called_on_B = " << (r.reset_called_on_B ? "true" : "false") << " (gate: true)\n";
    f << "  latch_replay_called = " << (r.latch_replay_called ? "true" : "false") << " (gate: true)\n";
    f << "  xrun_at_swap = " << r.xrun_at_swap << " (ns, gate: <= " << D_BLOCK_NS << ")\n";
    f << "  old_perf_release_block = " << r.old_perf_release_block << " (gate: >= " << K_SWAP << ")\n";
    f << "  old_perf_released_post_crossfade = "
      << (r.old_perf_released_post_crossfade ? "true" : "false") << "\n";
    f << "  R2 = " << (r.R2_pass ? "PASS" : "FAIL") << "\n\n";

    f << std::setprecision(12);
    f << "── R3 event-response correctness + click-free ──\n";
    f << "  maxerr_reload_A = " << r.maxerr_reload_A << " (gate: ==0)\n";
    f << "  mix_err = " << r.mix_err << " (gate: <= 1e-6)\n";
    f << "  alpha_monotone = " << (r.alpha_monotone ? "true" : "false") << "\n";
    f << "  maxerr_B_xfade = " << r.maxerr_B_xfade << " (gate: ==0)\n";
    f << "  maxerr_reload_B = " << r.maxerr_reload_B << " (gate: ==0)\n";
    f << "  rel_expected_Bpost = " << r.rel_expected_Bpost << " (gate: >= 0.40)\n";
    f << "  rel_expected_Apre = " << r.rel_expected_Apre << " (gate: >= 0.40)\n";
    f << "  click_max = " << r.click_max << " (gate: <= " << S_CLICK << ", K_SWAP boundary excluded)\n";
    f << "  R3 = " << (r.R3_pass ? "PASS" : "FAIL") << "\n\n";

    f << "── R4 determinism + completeness + event-application audit ──\n";
    f << "  repro_ok = " << (r.repro_ok ? "true" : "false")
      << " (all " << R_REPEATS << " per-stream SHA-256 identical)\n";
    f << "  blocks_rendered = " << r.blocks_rendered << " (gate: ==" << N_BLOCKS << ")\n";
    f << "  dropped_blocks = " << r.dropped_blocks << " (gate: ==0)\n";
    f << "  duplicated_blocks = " << r.duplicated_blocks << " (gate: ==0)\n";
    f << "  swap_block = " << r.swap_block << " (gate: ==" << K_SWAP << ")\n";
    f << "  events_applied_A = " << r.events_applied_A << " (scheduled: " << r.events_scheduled_pre_swap << ")\n";
    f << "  events_applied_B_pre = " << r.events_applied_B_pre << " (scheduled: " << r.events_scheduled_xfade << ")\n";
    f << "  events_applied_B_post = " << r.events_applied_B_post << " (scheduled: " << r.events_scheduled_post_swap << ")\n";
    f << "  b_xfade_initial_latch_count = " << r.latch_count_b_xfade << " (gate: ==1)\n";
    f << "  latch_replay_count = " << r.latch_replay_count << " (gate: ==1)\n";
    for (size_t i = 0; i < r.hashes_full.size(); ++i)
        f << "  hash_full[" << i << "]  = " << r.hashes_full[i] << "\n";
    for (size_t i = 0; i < r.hashes_A.size(); ++i)
        f << "  hash_A[" << i << "]     = " << r.hashes_A[i] << "\n";
    for (size_t i = 0; i < r.hashes_B.size(); ++i)
        f << "  hash_B[" << i << "]     = " << r.hashes_B[i] << "\n";
    for (size_t i = 0; i < r.hashes_xfade.size(); ++i)
        f << "  hash_xfade[" << i << "] = " << r.hashes_xfade[i] << "\n";
    f << "  R4 = " << (r.R4_pass ? "PASS" : "FAIL") << "\n\n";

    f << "── Repeat-0 per-block timing distribution ──\n";
    f << "  p50 = " << r.p50_ns << " ns, p99 = " << r.p99_ns
      << " ns, max = " << r.max_ns << " ns (D_block = " << D_BLOCK_NS << " ns)\n\n";

    f << "── ASan / CRT run log ──\n";
    if (r.asan_log_excerpt.empty())
        f << "ASAN: no reports\n";
    else
        f << r.asan_log_excerpt << "\n";
    f << "\n";

    f << "── Verdict ──\n";
    f << "  R1=" << (r.R1_pass?"PASS":"FAIL")
      << " R2=" << (r.R2_pass?"PASS":"FAIL")
      << " R3=" << (r.R3_pass?"PASS":"FAIL")
      << " R4=" << (r.R4_pass?"PASS":"FAIL")
      << " asan_clean=" << (r.asan_clean?"true":"false")
      << " proof_complete=" << (r.proof_complete?"true":"false") << "\n";
    f << "  FINAL_VERDICT = " << r.final_verdict << "\n";
    return (bool)f;
}

// ── events_applied.log ─────────────────────────────────────────────
bool writeEventsAppliedLog(const std::string& path,
                           const std::vector<std::pair<uint32_t, double>>& evA,
                           const std::vector<std::pair<uint32_t, double>>& evBPre,
                           const std::vector<std::pair<uint32_t, double>>& evBPost,
                           const std::vector<std::pair<uint32_t, double>>& xfadeInitLatch,
                           const std::vector<std::pair<uint32_t, double>>& latchReplay,
                           const MetricResults& r)
{
    std::ofstream f(path);
    if (!f) return false;
    f << std::setprecision(8);

    f << "# EVENTS_APPLIED_A (scheduled change blocks, performer A, blocks [0, K_SWAP))\n";
    for (const auto& e : evA)
        f << "block=" << e.first << " freq=" << e.second << " result=Ok\n";

    f << "\n# EVENTS_APPLIED_B_PRE (scheduled change blocks, performer B, blocks [K_XFADE_START, K_SWAP))\n";
    for (const auto& e : evBPre)
        f << "block=" << e.first << " freq=" << e.second << " result=Ok\n";

    f << "\n# EVENTS_APPLIED_B_POST (scheduled change blocks, performer B, blocks [K_SWAP, N))\n";
    for (const auto& e : evBPost)
        f << "block=" << e.first << " freq=" << e.second << " result=Ok\n";

    f << "\n# X_FADE_INITIAL_LATCH (B's initial latch at K_XFADE_START, NOT a scheduled event)\n";
    for (const auto& e : xfadeInitLatch)
        f << "block=" << e.first << " freq=" << e.second << " result=Ok\n";

    f << "\n# LATCH_REPLAY (B's re-latch after reset at K_SWAP, NOT a scheduled event)\n";
    for (const auto& e : latchReplay)
        f << "block=" << e.first << " freq=" << e.second << " result=Ok\n";

    f << "\n# SUMMARY\n";
    f << "events_applied_A=" << r.events_applied_A << "\n";
    f << "events_applied_B_pre=" << r.events_applied_B_pre << "\n";
    f << "events_applied_B_post=" << r.events_applied_B_post << "\n";
    f << "b_xfade_initial_latch_count=" << r.latch_count_b_xfade << "\n";
    f << "latch_replay_count=" << r.latch_replay_count << "\n";

    return (bool)f;
}

bool writeScheduleJson(const std::string& path, const EventSchedule& sched, uint64_t seedMaster)
{
    // Reuse the JSON builder from event_schedule.cpp
    std::ofstream f(path);
    if (!f) return false;
    f << scheduleJson(sched, seedMaster);
    return (bool)f;
}

// ── metrics.json ──────────────────────────────────────────────────
static void writeHashArray(std::ostream& o, const std::vector<std::string>& hs)
{
    o << "[";
    for (size_t i = 0; i < hs.size(); ++i)
    {
        o << "\"" << hs[i] << "\"";
        if (i + 1 < hs.size()) o << ", ";
    }
    o << "]";
}

bool writeMetricsJson(const std::string& path, const MetricResults& r)
{
    std::ofstream o(path);
    if (!o) return false;
    o << std::setprecision(17);
    auto b = [](bool v){ return v ? "true" : "false"; };

    o << "{\n";
    o << "  \"run_params\": { \"fs\":48000, \"block\":256, \"n_blocks\":10000, "
         "\"k_prepare_start\":100, \"k_xfade_start\":4000, \"w_xfade\":64, "
         "\"k_swap\":4064, \"p_meas\":512, \"r_repeats\":5, "
         "\"seed_master\":\"0x6121A0003\", \"dll_version\":\"1.0.3159\", "
         "\"amp\":0.25, \"freq_palette\":[220.0,330.0,440.0,550.0,660.0], "
         "\"eps_xfade\":1e-6, \"s_click\":0.05 },\n";

    o << "  \"R1\": { \"xrun_during_prepare\":" << r.xrun_during_prepare
      << ", \"createPerformer_result\":\"" << (r.createPerformer_result_ok ? "Ok" : "Fail") << "\""
      << ", \"k_prepare_done\":" << r.k_prepare_done
      << ", \"b_ready_before_xfade\":" << b(r.b_ready_before_xfade)
      << ", \"events_delivered_A_prepare\":" << r.events_delivered_A_prepare
      << ", \"events_expected_A_prepare\":" << r.events_expected_A_prepare
      << ", \"events_dropped_in_window\":" << r.events_dropped_in_window
      << ", \"b_xfade_initial_latch_count\":" << r.b_xfade_initial_latch_count
      << ", \"pass\":" << b(r.R1_pass)
      << ", \"threshold\":\"xrun==0 & result Ok & done<4000 & delivered==expected & dropped==0 & b_xfade_initial_latch==1\" },\n";

    o << "  \"R2\": { \"asan_violations\":" << r.asan_violations
      << ", \"crt_heap_violations\":" << r.crt_heap_violations
      << ", \"result_violations\":" << r.result_violations
      << ", \"swap_block\":" << r.swap_block
      << ", \"swap_count\":" << r.swap_count
      << ", \"reset_called_on_B\":" << b(r.reset_called_on_B)
      << ", \"latch_replay_called\":" << b(r.latch_replay_called)
      << ", \"xrun_at_swap\":" << r.xrun_at_swap
      << ", \"old_perf_release_block\":" << r.old_perf_release_block
      << ", \"old_perf_released_post_crossfade\":" << b(r.old_perf_released_post_crossfade)
      << ", \"pass\":" << b(r.R2_pass)
      << ", \"threshold\":\"asan==0 & crt==0 & result==0 & swap_block==4064 & swap_count==1 & reset_called & latch_replay_called & xrun_at_swap==0 & released_post_crossfade\" },\n";

    o << "  \"R3\": { \"maxerr_reload_A\":" << r.maxerr_reload_A
      << ", \"mix_err\":" << r.mix_err
      << ", \"alpha_monotone\":" << b(r.alpha_monotone)
      << ", \"maxerr_B_xfade\":" << r.maxerr_B_xfade
      << ", \"maxerr_reload_B\":" << r.maxerr_reload_B
      << ", \"rel_expected_Bpost\":" << r.rel_expected_Bpost
      << ", \"rel_expected_Apre\":" << r.rel_expected_Apre
      << ", \"click_max\":" << r.click_max
      << ", \"click_boundary_excluded\":" << b(r.click_boundary_excluded)
      << ", \"pass\":" << b(r.R3_pass)
      << ", \"threshold\":\"maxerr_A==0 & mix_err<=1e-6 & monotone & maxerr_Bxfade==0 & maxerr_B==0 & rel_Bpost>=0.40 & rel_Apre>=0.40 & click<=0.05\" },\n";

    o << "  \"R4\": { \"hashes_full\":";  writeHashArray(o, r.hashes_full);
    o << ", \"hashes_A\":";               writeHashArray(o, r.hashes_A);
    o << ", \"hashes_B\":";               writeHashArray(o, r.hashes_B);
    o << ", \"hashes_xfade\":";           writeHashArray(o, r.hashes_xfade);
    o << ", \"repro_ok\":" << b(r.repro_ok)
      << ", \"blocks_rendered\":" << r.blocks_rendered
      << ", \"dropped_blocks\":" << r.dropped_blocks
      << ", \"duplicated_blocks\":" << r.duplicated_blocks
      << ", \"swap_block\":" << r.swap_block
      << ", \"events_applied_A\":" << r.events_applied_A
      << ", \"events_scheduled_pre_swap\":" << r.events_scheduled_pre_swap
      << ", \"events_applied_B_pre\":" << r.events_applied_B_pre
      << ", \"events_scheduled_xfade\":" << r.events_scheduled_xfade
      << ", \"events_applied_B_post\":" << r.events_applied_B_post
      << ", \"events_scheduled_post_swap\":" << r.events_scheduled_post_swap
      << ", \"b_xfade_initial_latch_count\":" << r.latch_count_b_xfade
      << ", \"latch_replay_count\":" << r.latch_replay_count
      << ", \"pass\":" << b(r.R4_pass)
      << ", \"threshold\":\"repro_ok & blocks==10000 & dropped==0 & dup==0 & swap_block==4064 & applied_A==scheduled_pre_swap & applied_B_pre==scheduled_xfade & applied_B_post==scheduled_post_swap & b_xfade_initial_latch==1 & latch_replay==1\" },\n";

    o << "  \"p50_ns\":" << r.p50_ns << ", \"p99_ns\":" << r.p99_ns
      << ", \"max_ns\":" << r.max_ns << ",\n";
    o << "  \"asan_clean\":" << b(r.asan_clean) << ",\n";
    o << "  \"proof_complete\":" << b(r.proof_complete) << ",\n";
    o << "  \"final_verdict\":\"" << r.final_verdict << "\"\n";
    o << "}\n";
    return (bool)o;
}

} // namespace g1a
