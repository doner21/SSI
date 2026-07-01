// proof.cpp — writes trace.log, .wav dumps, and metrics.json.
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

    f << "G1A RELOAD-BRIDGE SPIKE — trace.log\n";
    f << "=================================================\n";
    f << "Locked run parameters (PRE-REG §7):\n";
    f << "  fs=" << SAMPLE_RATE << " Hz, block=" << BLOCK_SIZE
      << " frames, N_blocks=" << N_BLOCKS << ", R_repeats=" << R_REPEATS << "\n";
    f << "  K_COMPILE_START=" << K_COMPILE_START << ", K_XFADE_START=" << K_XFADE_START
      << ", W_XFADE=" << W_XFADE << ", K_SWAP=" << K_SWAP << ", P_MEAS=" << P_MEAS << "\n";
    f << "  D_block=" << D_BLOCK_NS << " ns, seed_master=0x6121A0002\n";
    f << "  freq_A=440.0 Hz (Engine A, main thread, live), freq_B=880.0 Hz "
         "(Engine B, WORKER-thread runtime compile), freq_ctl=660.0 Hz\n";
    f << "  EPS_XFADE=1e-6, S_CLICK=0.15, REL_MIN=0.40, LEAK_MAX=0.10\n";
    f << "  DLL CmajPerformer.dll v" << DLL_VERSION << "\n";
    f << "  toolchain MSVC cl 19.50, C++17, /DCMAJOR_DLL=1\n\n";

    f << "── R1 background-compile non-disruption ──\n";
    f << "  xrun_during_compile = " << r.xrun_during_compile << " (gate: ==0)\n";
    f << "  compile_result = " << (r.compile_result_ok ? "Ok" : "Fail") << " (gate: Ok)\n";
    f << "  K_COMPILE_DONE = " << r.k_compile_done
      << " (informative headroom expectation: <=3900)\n";
    f << "  compile_completed_before_xfade = "
      << (r.compile_completed_before_xfade ? "true" : "false")
      << " (gate: K_COMPILE_DONE < " << K_XFADE_START << ")\n";
    f << "  R1 = " << (r.R1_pass ? "PASS" : "FAIL") << "\n\n";

    f << "── R2 atomic / lock-free swap safety ──\n";
    f << "  asan_violations = " << r.asan_violations << " (gate: ==0)\n";
    f << "  crt_heap_violations = " << r.crt_heap_violations << " (gate: ==0)\n";
    f << "  result_violations = " << r.result_violations << " (gate: ==0)\n";
    f << "  swap_block = " << r.swap_block << " (gate: ==" << K_SWAP << ")\n";
    f << "  swap_count = " << r.swap_count << " (gate: ==1)\n";
    f << "  old_perf_release_block = " << r.old_perf_release_block
      << " (gate: >= " << K_SWAP << ")\n";
    f << "  old_perf_released_post_crossfade = "
      << (r.old_perf_released_post_crossfade ? "true" : "false")
      << "  (release performed after the RT thread's first load(acquire)==1, "
         "i.e. provably post-crossfade and after the RT thread no longer "
         "references performers[0])\n";
    f << "  R2 = " << (r.R2_pass ? "PASS" : "FAIL") << "\n\n";

    f << std::setprecision(12);
    f << "── R3 click-free crossfade correctness ──\n";
    f << "  mix_err = " << r.mix_err << " (gate: <= 1e-6)\n";
    f << "  alpha_monotone = " << (r.alpha_monotone ? "true" : "false")
      << " (alpha(0)==0.0, alpha(last)==1.0, non-decreasing)\n";
    f << "  click_max = " << r.click_max << " (gate: <= 0.15)\n";
    f << "  rel440_pre = " << r.rel440_pre << " (gate: >= 0.40)\n";
    f << "  rel880_post = " << r.rel880_post << " (gate: >= 0.40)\n";
    f << "  leak880_pre = " << r.leak880_pre << " (gate: <= 0.10)\n";
    f << "  leak440_post = " << r.leak440_post << " (gate: <= 0.10)\n";
    f << "  rel_ctl = " << r.rel_ctl << " (gate: <= 0.10)\n";
    f << "  R3 = " << (r.R3_pass ? "PASS" : "FAIL") << "\n\n";

    f << "── R4 determinism + completeness (bit-exact) ──\n";
    f << "  repro_ok = " << (r.repro_ok ? "true" : "false")
      << " (all " << R_REPEATS << " per-stream SHA-256 identical)\n";
    f << "  blocks_rendered = " << r.blocks_rendered << " (gate: ==" << N_BLOCKS << ")\n";
    f << "  dropped_blocks = " << r.dropped_blocks << " (gate: ==0)\n";
    f << "  duplicated_blocks = " << r.duplicated_blocks << " (gate: ==0)\n";
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
         "\"k_compile_start\":100, \"k_xfade_start\":4000, \"w_xfade\":64, "
         "\"k_swap\":4064, \"p_meas\":512, \"r_repeats\":5, "
         "\"seed_master\":\"0x6121A0002\", \"dll_version\":\"1.0.3159\", "
         "\"freq_a\":440.0, \"freq_b\":880.0, \"freq_ctl\":660.0, "
         "\"eps_xfade\":1e-6, \"s_click\":0.15 },\n";

    o << "  \"R1\": { \"xrun_during_compile\":" << r.xrun_during_compile
      << ", \"compile_result\":\"" << (r.compile_result_ok ? "Ok" : "Fail") << "\""
      << ", \"k_compile_done\":" << r.k_compile_done
      << ", \"compile_completed_before_xfade\":" << b(r.compile_completed_before_xfade)
      << ", \"pass\":" << b(r.R1_pass)
      << ", \"threshold\":\"xrun==0 & result Ok & done<4000\" },\n";

    o << "  \"R2\": { \"asan_violations\":" << r.asan_violations
      << ", \"crt_heap_violations\":" << r.crt_heap_violations
      << ", \"result_violations\":" << r.result_violations
      << ", \"swap_block\":" << r.swap_block
      << ", \"swap_count\":" << r.swap_count
      << ", \"old_perf_release_block\":" << r.old_perf_release_block
      << ", \"old_perf_released_post_crossfade\":" << b(r.old_perf_released_post_crossfade)
      << ", \"pass\":" << b(r.R2_pass)
      << ", \"threshold\":\"asan==0 & crt==0 & result==0 & swap_block==4064 & "
         "swap_count==1 & released_post_crossfade\" },\n";

    o << "  \"R3\": { \"mix_err\":" << r.mix_err
      << ", \"alpha_monotone\":" << b(r.alpha_monotone)
      << ", \"click_max\":" << r.click_max
      << ", \"rel440_pre\":" << r.rel440_pre
      << ", \"rel880_post\":" << r.rel880_post
      << ", \"leak880_pre\":" << r.leak880_pre
      << ", \"leak440_post\":" << r.leak440_post
      << ", \"rel_ctl\":" << r.rel_ctl
      << ", \"pass\":" << b(r.R3_pass)
      << ", \"threshold\":\"mix_err<=1e-6 & monotone & click<=0.15 & rel>=0.40 & "
         "leak<=0.10 & ctl<=0.10\" },\n";

    o << "  \"R4\": { \"hashes_full\":";  writeHashArray(o, r.hashes_full);
    o << ", \"hashes_A\":";               writeHashArray(o, r.hashes_A);
    o << ", \"hashes_B\":";               writeHashArray(o, r.hashes_B);
    o << ", \"hashes_xfade\":";           writeHashArray(o, r.hashes_xfade);
    o << ", \"repro_ok\":" << b(r.repro_ok)
      << ", \"blocks_rendered\":" << r.blocks_rendered
      << ", \"dropped_blocks\":" << r.dropped_blocks
      << ", \"duplicated_blocks\":" << r.duplicated_blocks
      << ", \"swap_block\":" << r.swap_block
      << ", \"pass\":" << b(r.R4_pass)
      << ", \"threshold\":\"all R hashes equal per stream & blocks==10000 & "
         "dropped==0 & dup==0 & swap_block==4064\" },\n";

    o << "  \"p50_ns\":" << r.p50_ns << ", \"p99_ns\":" << r.p99_ns
      << ", \"max_ns\":" << r.max_ns << ",\n";
    o << "  \"asan_clean\":" << b(r.asan_clean) << ",\n";
    o << "  \"proof_complete\":" << b(r.proof_complete) << ",\n";
    o << "  \"final_verdict\":\"" << r.final_verdict << "\"\n";
    o << "}\n";
    return (bool)o;
}

} // namespace g1a
