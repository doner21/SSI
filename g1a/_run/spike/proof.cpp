// proof.cpp — writes trace.log, .wav dumps, and metrics.json.
#include "proof.h"
#include "host_config.h"
#include <cstdio>
#include <cstring>
#include <fstream>
#include <iomanip>
#include <sstream>

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
bool writeTraceLog(const std::string& path, const MetricResults& r,
                   const std::string& barrierOrderingSample)
{
    std::ofstream f(path);
    if (!f) return false;

    f << "G1A CONCURRENCY SPIKE — trace.log\n";
    f << "=================================================\n";
    f << "Locked run parameters (PRE-REG §7):\n";
    f << "  fs=" << SAMPLE_RATE << " Hz, block=" << BLOCK_SIZE
      << " frames, N_blocks=" << N_BLOCKS << ", R_repeats=" << R_REPEATS << "\n";
    f << "  D_block=" << D_BLOCK_NS << " ns, seed_master=0x6121A0001\n";
    f << "  freq_A=440.0 Hz, freq_B=880.0 Hz, freq_ctl=660.0 Hz\n";
    f << "  DLL CmajPerformer.dll v" << DLL_VERSION << "\n";
    f << "  toolchain MSVC cl 19.50, C++17, /DCMAJOR_DLL=1\n\n";

    f << "── Per-performer Result audit (M1) ──\n";
    f << "  result_violations = " << r.result_violations << "\n";
    f << "  blocks_completed_A (per repeat) = " << r.blocks_A << " (expect " << N_BLOCKS << ")\n";
    f << "  blocks_completed_B (per repeat) = " << r.blocks_B << " (expect " << N_BLOCKS << ")\n";
    f << "  crt_heap_violations = " << r.crt_heap_violations << "\n";
    f << "  asan_violations = " << r.asan_violations << "\n\n";

    f << "── Repeat-0 per-block timing summary (M2) ──\n";
    f << "  p50 = " << r.p50_ns << " ns, p99 = " << r.p99_ns
      << " ns, max = " << r.max_ns << " ns\n";
    f << "  D_block budget = " << D_BLOCK_NS << " ns\n";
    f << "  xrun_count = " << r.xrun_count << "\n";
    f << "  (reported headroom expectation, not gated: p99 <= 0.5*D_block = "
      << (D_BLOCK_NS / 2) << " ns)\n\n";

    f << "── Barrier-arrival ordering sample ──\n";
    f << barrierOrderingSample << "\n\n";

    f << "── M3 mixed-output correctness ──\n";
    f << std::setprecision(10);
    f << "  rel440 = " << r.rel440 << " (>= 0.40)\n";
    f << "  rel880 = " << r.rel880 << " (>= 0.40)\n";
    f << "  rel_ctl = " << r.rel_ctl << " (<= 0.10)\n";
    f << "  mix_err = " << r.mix_err << " (<= 1e-6)\n\n";

    f << "── M4 determinism + isolation ──\n";
    f << "  repro_ok = " << (r.repro_ok ? "true" : "false") << "\n";
    f << "  iso_A_err = " << r.iso_A_err << " (== 0.0)\n";
    f << "  iso_B_err = " << r.iso_B_err << " (== 0.0)\n";
    for (size_t i = 0; i < r.hashes_A.size(); ++i)
        f << "  hashA[" << i << "] = " << r.hashes_A[i] << "\n";
    for (size_t i = 0; i < r.hashes_B.size(); ++i)
        f << "  hashB[" << i << "] = " << r.hashes_B[i] << "\n";
    for (size_t i = 0; i < r.hashes_mixed.size(); ++i)
        f << "  hashMixed[" << i << "] = " << r.hashes_mixed[i] << "\n";
    f << "\n";

    f << "── control_config (fed/passthrough path) ──\n";
    f << "  ctl_result_violations = " << r.ctl_result_violations << "\n";
    f << "  ctl_blocks_A/B = " << r.ctl_blocks_A << "/" << r.ctl_blocks_B << "\n";
    f << "  ctl_xrun_count = " << r.ctl_xrun_count << "\n";
    f << "  ctl_repro_ok = " << (r.ctl_repro_ok ? "true" : "false")
      << ", ctl_iso_A_err=" << r.ctl_iso_A_err
      << ", ctl_iso_B_err=" << r.ctl_iso_B_err << "\n\n";

    f << "── ASan / CRT run log ──\n";
    if (r.asan_log_excerpt.empty())
        f << "ASAN: no reports\n";
    else
        f << r.asan_log_excerpt << "\n";
    f << "\n";

    f << "── Verdict ──\n";
    f << "  M1=" << (r.M1_pass?"PASS":"FAIL")
      << " M2=" << (r.M2_pass?"PASS":"FAIL")
      << " M3=" << (r.M3_pass?"PASS":"FAIL")
      << " M4=" << (r.M4_pass?"PASS":"FAIL")
      << " asan_clean=" << (r.asan_clean?"true":"false") << "\n";
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
         "\"r_repeats\":5, \"seed_master\":\"0x6121A0001\", "
         "\"dll_version\":\"1.0.3159\", \"freq_a\":440.0, \"freq_b\":880.0, "
         "\"freq_ctl\":660.0 },\n";

    o << "  \"M1\": { \"result_violations\":" << r.result_violations
      << ", \"blocks_A\":" << r.blocks_A << ", \"blocks_B\":" << r.blocks_B
      << ", \"asan_violations\":" << r.asan_violations
      << ", \"crt_heap_violations\":" << r.crt_heap_violations
      << ", \"pass\":" << b(r.M1_pass)
      << ", \"threshold\":\"all zero; blocks==10000\" },\n";

    o << "  \"M2\": { \"xrun_count\":" << r.xrun_count
      << ", \"p50_ns\":" << r.p50_ns << ", \"p99_ns\":" << r.p99_ns
      << ", \"max_ns\":" << r.max_ns << ", \"d_block_ns\":5333333"
      << ", \"pass\":" << b(r.M2_pass)
      << ", \"threshold\":\"xrun_count==0\" },\n";

    o << "  \"M3\": { \"rel440\":" << r.rel440 << ", \"rel880\":" << r.rel880
      << ", \"rel_ctl\":" << r.rel_ctl << ", \"mix_err\":" << r.mix_err
      << ", \"pass\":" << b(r.M3_pass)
      << ", \"threshold\":\"rel440>=0.40 & rel880>=0.40 & rel_ctl<=0.10 & mix_err<=1e-6\" },\n";

    o << "  \"M4\": { \"hashes_A\":";  writeHashArray(o, r.hashes_A);
    o << ", \"hashes_B\":";            writeHashArray(o, r.hashes_B);
    o << ", \"hashes_mixed\":";        writeHashArray(o, r.hashes_mixed);
    o << ", \"repro_ok\":" << b(r.repro_ok)
      << ", \"iso_A_err\":" << r.iso_A_err << ", \"iso_B_err\":" << r.iso_B_err
      << ", \"pass\":" << b(r.M4_pass)
      << ", \"threshold\":\"all R hashes equal per stream & iso_*_err==0.0\" },\n";

    o << "  \"asan_clean\":" << b(r.asan_clean) << ",\n";
    o << "  \"proof_complete\":" << b(r.proof_complete) << ",\n";
    o << "  \"final_verdict\":\"" << r.final_verdict << "\",\n";

    o << "  \"control_config\": { ";
    o << "\"M1\": { \"result_violations\":" << r.ctl_result_violations
      << ", \"blocks_A\":" << r.ctl_blocks_A << ", \"blocks_B\":" << r.ctl_blocks_B
      << ", \"pass\":" << b(r.ctl_M1_pass) << " }, ";
    o << "\"M2\": { \"xrun_count\":" << r.ctl_xrun_count
      << ", \"p50_ns\":" << r.ctl_p50_ns << ", \"p99_ns\":" << r.ctl_p99_ns
      << ", \"max_ns\":" << r.ctl_max_ns
      << ", \"pass\":" << b(r.ctl_M2_pass) << " }, ";
    o << "\"M4\": { \"hashes_A\":"; writeHashArray(o, r.ctl_hashes_A);
    o << ", \"hashes_B\":";         writeHashArray(o, r.ctl_hashes_B);
    o << ", \"hashes_mixed\":";     writeHashArray(o, r.ctl_hashes_mixed);
    o << ", \"repro_ok\":" << b(r.ctl_repro_ok)
      << ", \"iso_A_err\":" << r.ctl_iso_A_err
      << ", \"iso_B_err\":" << r.ctl_iso_B_err
      << ", \"pass\":" << b(r.ctl_M4_pass) << " }";
    o << " }\n";

    o << "}\n";
    return (bool)o;
}

} // namespace g1a
