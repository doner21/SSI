// proof.cpp — writes trace.log, the .wav dumps, metrics.json (T1–T4 schema),
// and logic_diff_witness.txt (PRE-REG §6 / HARNESS-SPEC §9).
#include "proof.h"
#include "host_config.h"
#include <fstream>
#include <iomanip>

namespace g1a {

// ── WAV (IEEE float32, mono) ── identical to the Windows harness writer ──
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

    f << "G1A TSan/Linux CERTIFICATION SPIKE — trace.log\n";
    f << "=================================================\n";
    f << "Locked run parameters (PRE-REG §8):\n";
    f << "  fs=" << SAMPLE_RATE << " Hz, block=" << BLOCK_SIZE
      << " frames, N_blocks=" << N_BLOCKS << ", R_repeats=" << R_REPEATS << "\n";
    f << "  K_COMPILE_START=" << K_COMPILE_START << ", K_XFADE_START=" << K_XFADE_START
      << ", W_XFADE=" << W_XFADE << ", K_SWAP=" << K_SWAP << ", P_MEAS=" << P_MEAS << "\n";
    f << "  D_block=" << D_BLOCK_NS << " ns (INFORMATIVE ONLY under TSan), seed_master=0x6121A0003\n";
    f << "  freq_A=440.0 Hz (Engine A, main thread, live), freq_B=880.0 Hz "
         "(Engine B, WORKER-thread runtime compile), freq_ctl=660.0 Hz\n";
    f << "  EPS_XFADE=1e-6, S_CLICK=0.15, REL_MIN=0.40, LEAK_MAX=0.10, "
         "EPS_SPECTRAL=0.05, EPS_PREFIX=1e-4\n";
    f << "  runtime " << DLL_NAME << " v" << DLL_VERSION << "\n";
    f << "  toolchain clang++-18 (g++-12 fallback), C++17, -fsanitize=thread -g -O1 -DCMAJOR_DLL=1\n\n";

    f << "── T1 Clean Linux TSan BUILD + feasibility ──\n";
    f << "  host_build_ok=" << (r.host_build_ok?"true":"false")
      << " control_build_ok=" << (r.control_build_ok?"true":"false")
      << " rtprobe_build_ok=" << (r.rtprobe_build_ok?"true":"false")
      << " link_ok=" << (r.link_ok?"true":"false")
      << " tsan_enabled_in_binary=" << (r.tsan_enabled_in_binary?"true":"false") << "\n";
    f << "  linux_runtime_obtained=" << (r.linux_runtime_obtained?"true":"false")
      << " runtime_arch=" << r.runtime_arch
      << " runtime_version=" << r.runtime_version << "\n";
    f << "  T1 = " << (r.T1_pass?"PASS":"FAIL")
      << " (gate: build ok & link ok & tsan linked & runtime v1.0.3159 x86_64 obtained)\n\n";

    f << "── T2 TSAN-CLEAN main run ──\n";
    f << "  nonsuppressed_race_reports=" << r.nonsuppressed_race_reports << " (gate: ==0)\n";
    f << "  warning_reports=" << r.warning_reports << " (gate: ==0)\n";
    f << "  suppressed_race_count=" << r.suppressed_race_count << " (logged)\n";
    f << "  host_suppressed_races=" << r.host_suppressed_races << " (gate: ==0)\n";
    f << "  runs_completed=" << r.runs_completed << " (gate: ==" << R_REPEATS << ")\n";
    f << "  blocks_per_run=" << r.blocks_per_run << " (gate: ==" << N_BLOCKS << ")\n";
    f << "  T2 = " << (r.T2_pass?"PASS":"FAIL") << "\n\n";

    f << "── T3 DETECTOR-LIVENESS ──\n";
    f << "  T3a control_race_caught=" << (r.control_race_caught?"true":"false") << " (gate: true)\n";
    f << "  T3b rtprobe_race_caught=" << (r.rtprobe_race_caught?"true":"false")
      << " rtprobe_frame_named=" << (r.rtprobe_frame_named?"true":"false") << " (gate: both true)\n";
    f << "  detector_alive=" << (r.detector_alive?"true":"false")
      << " rt_covered=" << (r.rt_covered?"true":"false") << "\n";
    f << "  T3 = " << (r.T3_pass?"PASS":"FAIL") << "\n\n";

    f << std::setprecision(12);
    f << "── T4 FUNCTIONAL EQUIVALENCE + COMPLETENESS ──\n";
    f << "  (a) rel440_pre=" << r.rel440_pre << " (gate: >=0.40)\n";
    f << "      rel880_post=" << r.rel880_post << " (gate: >=0.40)\n";
    f << "      leak880_pre=" << r.leak880_pre << " (gate: <=0.10)\n";
    f << "      leak440_post=" << r.leak440_post << " (gate: <=0.10)\n";
    f << "      rel_ctl=" << r.rel_ctl << " (gate: <=0.10)\n";
    f << "  (b) mix_err=" << r.mix_err << " (gate: <=1e-6)  alpha_monotone="
      << (r.alpha_monotone?"true":"false") << "\n";
    f << "  (c) click_max=" << r.click_max << " (gate: <=0.15)\n";
    f << "  (d) blocks_rendered=" << r.blocks_rendered << " (gate: ==" << N_BLOCKS << ")"
      << " swap_block=" << r.swap_block << " (gate: ==" << K_SWAP << ")"
      << " swap_count=" << r.swap_count << " (gate: ==1)\n";
    f << "      dropped=" << r.dropped_blocks << " dup=" << r.duplicated_blocks
      << " old_perf_released_post_crossfade=" << (r.old_perf_released_post_crossfade?"true":"false") << "\n";
    f << "  (e) repro_ok=" << (r.repro_ok?"true":"false")
      << " (all " << R_REPEATS << " per-stream SHA-256 identical)\n";
    for (size_t i = 0; i < r.hashes_full.size(); ++i)
        f << "      hash_full[" << i << "]  = " << r.hashes_full[i] << "\n";
    for (size_t i = 0; i < r.hashes_A.size(); ++i)
        f << "      hash_A[" << i << "]     = " << r.hashes_A[i] << "\n";
    for (size_t i = 0; i < r.hashes_B.size(); ++i)
        f << "      hash_B[" << i << "]     = " << r.hashes_B[i] << "\n";
    for (size_t i = 0; i < r.hashes_xfade.size(); ++i)
        f << "      hash_xfade[" << i << "] = " << r.hashes_xfade[i] << "\n";
    f << "  (f) cross-platform (vs Windows reload reference):\n";
    f << "      delta_rel440_pre=" << r.delta_rel440_pre << " (gate: <=0.05)\n";
    f << "      delta_rel880_post=" << r.delta_rel880_post << " (gate: <=0.05)\n";
    f << "      delta_click_max=" << r.delta_click_max << " (gate: <=0.05)\n";
    f << "      prefix_max_delta=" << r.prefix_max_delta << " (gate: <=1e-4, first "
      << PREFIX_SAMPLES << " samples; full-output per-sample bit-exact DISCLAIMED §11)\n";
    f << "      win_ref_rel440_pre=" << r.win_ref_rel440_pre
      << " win_ref_rel880_post=" << r.win_ref_rel880_post
      << " win_ref_click_max=" << r.win_ref_click_max << "\n";
    f << "  T4 = " << (r.T4_pass?"PASS":"FAIL") << "\n\n";

    f << "── Informative (NOT gated under TSan) ──\n";
    f << "  p50=" << r.p50_ns << " ns, p99=" << r.p99_ns << " ns, max=" << r.max_ns
      << " ns; xrun(informative)=" << r.xrun_informative
      << "; k_compile_done=" << r.k_compile_done
      << "; compile_result=" << (r.compile_result_ok?"Ok":"Fail") << "\n\n";

    f << "── Verdict ──\n";
    f << "  T1=" << (r.T1_pass?"PASS":"FAIL")
      << " T2=" << (r.T2_pass?"PASS":"FAIL")
      << " T3=" << (r.T3_pass?"PASS":"FAIL")
      << " T4=" << (r.T4_pass?"PASS":"FAIL")
      << " tsan_clean=" << (r.tsan_clean?"true":"false")
      << " proof_complete=" << (r.proof_complete?"true":"false") << "\n";
    f << "  FINAL_VERDICT = " << r.final_verdict << "\n";
    return (bool)f;
}

// ── metrics.json (PRE-REG §6 / HARNESS-SPEC §9 schema) ────────────
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
         "\"seed_master\":\"0x6121A0003\", "
         "\"freq_a\":440.0, \"freq_b\":880.0, \"freq_ctl\":660.0, "
         "\"eps_xfade\":1e-6, \"s_click\":0.15, "
         "\"eps_spectral\":0.05, \"eps_prefix\":1e-4, "
         "\"dll_name\":\"libCmajPerformer.so\", \"dll_version\":\"1.0.3159\", "
         "\"compiler\":\"clang++-18\", "
         "\"tsan_options\":\"report_atomic_races=1:halt_on_error=0:history_size=7:"
         "suppressions=tsan.suppressions:second_deadlock_stack=1\" },\n";

    o << "  \"T1\": { \"host_build_ok\":" << b(r.host_build_ok)
      << ", \"control_build_ok\":" << b(r.control_build_ok)
      << ", \"rtprobe_build_ok\":" << b(r.rtprobe_build_ok)
      << ", \"link_ok\":" << b(r.link_ok)
      << ", \"tsan_enabled_in_binary\":" << b(r.tsan_enabled_in_binary)
      << ", \"linux_runtime_obtained\":" << b(r.linux_runtime_obtained)
      << ", \"runtime_arch\":\"" << r.runtime_arch << "\""
      << ", \"runtime_version\":\"" << r.runtime_version << "\""
      << ", \"pass\":" << b(r.T1_pass)
      << ", \"threshold\":\"build ok & link ok & tsan linked & runtime v1.0.3159 x86_64 obtained\" },\n";

    o << "  \"T2\": { \"nonsuppressed_race_reports\":" << r.nonsuppressed_race_reports
      << ", \"warning_reports\":" << r.warning_reports
      << ", \"suppressed_race_count\":" << r.suppressed_race_count
      << ", \"host_suppressed_races\":" << r.host_suppressed_races
      << ", \"runs_completed\":" << r.runs_completed
      << ", \"blocks_per_run\":" << r.blocks_per_run
      << ", \"pass\":" << b(r.T2_pass)
      << ", \"threshold\":\"nonsuppressed==0 & warnings==0 & runs==R & blocks==N & host_suppressed==0\" },\n";

    o << "  \"T3\": { \"T3a\": { \"control_race_caught\":" << b(r.control_race_caught) << " }"
      << ", \"T3b\": { \"rtprobe_race_caught\":" << b(r.rtprobe_race_caught)
      << ", \"rt_frame_named\":" << b(r.rtprobe_frame_named) << " }"
      << ", \"detector_alive\":" << b(r.detector_alive)
      << ", \"rt_covered\":" << b(r.rt_covered)
      << ", \"pass\":" << b(r.T3_pass)
      << ", \"threshold\":\"control caught & rtprobe caught naming RT frame\" },\n";

    o << "  \"T4\": { \"rel440_pre\":" << r.rel440_pre
      << ", \"rel880_post\":" << r.rel880_post
      << ", \"leak880_pre\":" << r.leak880_pre
      << ", \"leak440_post\":" << r.leak440_post
      << ", \"rel_ctl\":" << r.rel_ctl
      << ", \"mix_err\":" << r.mix_err
      << ", \"alpha_monotone\":" << b(r.alpha_monotone)
      << ", \"click_max\":" << r.click_max
      << ", \"blocks_rendered\":" << r.blocks_rendered
      << ", \"swap_block\":" << r.swap_block
      << ", \"swap_count\":" << r.swap_count
      << ", \"dropped_blocks\":" << r.dropped_blocks
      << ", \"duplicated_blocks\":" << r.duplicated_blocks
      << ", \"old_perf_released_post_crossfade\":" << b(r.old_perf_released_post_crossfade)
      << ", \"hashes_full\":"; writeHashArray(o, r.hashes_full);
    o << ", \"hashes_A\":";    writeHashArray(o, r.hashes_A);
    o << ", \"hashes_B\":";    writeHashArray(o, r.hashes_B);
    o << ", \"hashes_xfade\":";writeHashArray(o, r.hashes_xfade);
    o << ", \"repro_ok\":" << b(r.repro_ok)
      << ", \"cross_platform\": { "
      << "\"delta_rel440_pre\":" << r.delta_rel440_pre
      << ", \"delta_rel880_post\":" << r.delta_rel880_post
      << ", \"delta_click_max\":" << r.delta_click_max
      << ", \"prefix_max_delta\":" << r.prefix_max_delta
      << ", \"windows_reference_rel440_pre\":" << r.win_ref_rel440_pre
      << ", \"windows_reference_rel880_post\":" << r.win_ref_rel880_post
      << ", \"windows_reference_click_max\":" << r.win_ref_click_max << " }"
      << ", \"pass\":" << b(r.T4_pass)
      << ", \"threshold\":\"spectral ok & mix<=1e-6 & monotone & click<=0.15 & complete & "
         "swap ok & repro ok & cross-platform delta<=0.05 & prefix<=1e-4\" },\n";

    o << "  \"informative\": { \"p50_ns\":" << r.p50_ns << ", \"p99_ns\":" << r.p99_ns
      << ", \"max_ns\":" << r.max_ns << ", \"xrun_informative\":" << r.xrun_informative
      << ", \"k_compile_done\":" << r.k_compile_done
      << ", \"compile_result\":\"" << (r.compile_result_ok?"Ok":"Fail") << "\" },\n";
    o << "  \"tsan_clean\":" << b(r.tsan_clean) << ",\n";
    o << "  \"proof_complete\":" << b(r.proof_complete) << ",\n";
    o << "  \"final_verdict\":\"" << r.final_verdict << "\"\n";
    o << "}\n";
    return (bool)o;
}

// ── logic_diff_witness.txt (PRE-REG §6.4 / anti-divergence FT7) ───
bool writeLogicDiffWitness(const std::string& path)
{
    std::ofstream f(path);
    if (!f) return false;
    f <<
"G1A TSan/Linux — logic_diff_witness.txt\n"
"========================================\n"
"Module-by-module mapping of the Linux port to the Windows reload-bridge harness\n"
"(_run-reload/spike/). The thread/swap/crossfade/release LOGIC is structurally\n"
"identical; ONLY platform-primitive substitutions per HARNESS-SPEC §7.1 were made.\n"
"\n"
"host_config.h    : IDENTICAL params; SEED_MASTER 0x6121A0002 -> 0x6121A0003 (locked\n"
"                   distinct seed, PRE-REG §4.2); DLL_NAME CmajPerformer.dll ->\n"
"                   libCmajPerformer.so; added EPS_SPECTRAL/EPS_PREFIX + Windows\n"
"                   reference spectral constants for the T4f cross-platform gate.\n"
"patches.h        : IDENTICAL (Cmajor source is platform-agnostic; SineA 440 / SineB 880).\n"
"engine_setup.*   : IDENTICAL call sequence (parse->setBuildSettings->load->\n"
"                   getEndpointHandle[after load,before link]->link->createPerformer);\n"
"                   only Library::initialise(\"libCmajPerformer.so\").\n"
"bg_compiler.*    : IDENTICAL worker logic; synchronous Engine B build, bReady\n"
"                   release publication; no CRT debug heap.\n"
"swap.*           : IDENTICAL (std::atomic<uint32_t> activeIndex + std::atomic<bool>\n"
"                   bReady handoff; post-crossfade safe release). std::atomic is portable.\n"
"rt_render.*      : IDENTICAL render/swap/crossfade logic; QueryPerformanceCounter ->\n"
"                   clock_gettime(CLOCK_MONOTONIC) (timing INFORMATIVE ONLY under TSan);\n"
"                   windows.h removed; -DTSAN_RT_PROBE adds the T3b planted RT-loop race\n"
"                   ONLY in the probe binary (the cert binary has NO planted race).\n"
"crossfade.*      : IDENTICAL per-sample linear alpha host mix.\n"
"perturb.*        : IDENTICAL SplitMix64 seeded interleaving perturbation; only SEED_MASTER differs.\n"
"metrics.*        : IDENTICAL Goertzel/mix/click/completeness/SHA-256; ADDED WAV-read +\n"
"                   bounded prefix-delta (T4f) + TSan-log parsing (T2/T3). No threshold change.\n"
"proof.*          : IDENTICAL WAV writer; metrics.json upgraded R1-R4 -> T1-T4 schema (PRE-REG §6).\n"
"main.cpp         : IDENTICAL orchestration order; ASan ingestion replaced by TSan-log\n"
"                   ingestion (T2/T3a/T3b) + T1 build-log ingestion + T4f cross-platform.\n"
"\n"
"NO synchronisation beyond activeIndex / bReady / crossfade-window was introduced\n"
"(HARNESS-SPEC §11 static-audit constraint). The swap lands at K_SWAP=4064; the old\n"
"performer is released only post-crossfade and post-acquire-load.\n";
    return (bool)f;
}

} // namespace g1a
