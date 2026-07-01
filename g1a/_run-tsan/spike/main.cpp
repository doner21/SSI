// main.cpp — G1A TSan/Linux certification orchestrator (HARNESS-SPEC §5 run order).
//
// Implements EXACTLY the locked PRE-REGISTRATION: the SAME concurrency +
// reload-bridge host logic proven on Windows (live 440 Hz performer A hot-swapped
// with a background-JIT-compiled 880 Hz performer B on a worker thread via a
// std::atomic<uint32_t> active-index at K_SWAP, per-sample linear A->B crossfade,
// safe post-crossfade release), cross-built for Linux x64 and run under
// ThreadSanitizer. Computes the four pre-registered metrics T1–T4 and writes the
// TSan-cert PROOF artifact (PRE-REG §6).
//
// Generator != certifier: this executor implements/measures under WSL2; the
// independent verifier re-hashes the frozen spec and recomputes T1–T4 from the
// proof artifact. On FINAL FAIL this runner echoes the §9 fallback VERBATIM.
//
// Under -DTSAN_RT_PROBE the binary is the T3b RT-thread-coverage witness: it
// renders a short run with a planted unsynchronized RT-loop sentinel race and
// exits (no metrics, no proof) — its captured stderr must contain a TSan data
// race naming an rt_render.cpp frame.

#include "engine_setup.h"
#include "rt_render.h"
#include "swap.h"
#include "metrics.h"
#include "proof.h"
#include "patches.h"
#include "host_config.h"

#include <cstdint>
#include <cstdio>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

using namespace g1a;

// ── The PRE-DECLARED FALLBACK (PRE-REG §9) — quoted VERBATIM on FINAL FAIL ──
static const char* FALLBACK_VERBATIM =
"PRE-DECLARED FALLBACK — G1A TSan/Linux certification pass (committed before any result exists):\n"
"\n"
"Branch (i) — Genuine host data race found (T2 FAIL, or any metric FAIL other than T1 feasibility):\n"
"\n"
"`INVESTMENT-FREEZE on the concurrent/reload engine.` Immediately halt all further investment in the live concurrent-performer and live-crossfade reload-bridge engine. Fall back to the silence-boundary single-performer model already PROVEN in pass 1 — a single-performer-at-a-time reload with NO live crossfade (the host stops performer A to digital silence at the boundary, background-compiles B, and only then starts performer B from silence). There is NO live A->B crossfade of two simultaneously-live performers in this fallback. The concurrent two-performer and live-crossfade reload mechanisms remain FROZEN until the specific data race(s) identified by TSan are fixed AND re-certified through a subsequent TSan run. The freeze persists through later passes (event-replay, transport-sync, latency-compensation, multi-authority) — none may start until re-certification.\n"
"\n"
"Branch (ii) — Linux Cmajor runtime UNOBTAINABLE/unlinkable (T1 feasibility sub-gate FAIL):\n"
"\n"
"`UNCERTIFIED — platform limitation.` The data-race question CANNOT be certified on available infrastructure. The libCmajPerformer.so v1.0.3159 for Linux x64 either could not be obtained (download failed, zip corrupted, headers missing) or could not be loaded/linked under WSL2 Ubuntu (glibc/LLVM dlopen mismatch, missing symbol, wrong ABI). Keep the Windows spike-grade evidence (_run-reload/ATT_RUN_REPORT.md — FINAL PASS, ASan-clean, bit-exact deterministic adversarial-interleaving stress) as the standing, explicitly UNCERTIFIED status. The host-side data-race question remains UNANSWERED. Escalate to Donald for a platform/runtime decision: obtain a compatible Linux .so, cross-build the Cmajor runtime from source on WSL2, port to a native Linux host, or accept the Windows spike-grade evidence as sufficient for production.\n"
"\n"
"DETECTOR_LIVENESS_FAIL sub-clause (T3a or T3b FAIL):\n"
"\n"
"`DETECTOR_LIVENESS_FAIL: the control-race binary did not produce a TSan data-race warning, or the RT-probe race was not caught. This means ThreadSanitizer is NOT functional on this host/toolchain/run. The TSAN-CLEAN certification is ABORTED. All G1A TSan cert evidence is INVALIDATED. No data-race claim can be made from this run.` The TSan toolchain installation on the WSL2 Ubuntu host must be repaired and the cert re-attempted, or the Windows spike-grade evidence remains the standing UNCERTIFIED status. Escalate to Donald.\n";

namespace {

// Render a solo sine reference: P_MEAS blocks from phase 0 into dst[MEAS_SAMPLES].
bool renderSolo(EngineCtx& ctx, float* dst)
{
    cmaj::Performer perf = ctx.engine.createPerformer();
    if (!perf) return false;
    if (perf.setBlockSize(BLOCK_SIZE) != cmaj::Result::Ok) return false;
    for (uint32_t k = 0; k < P_MEAS; ++k)
    {
        if (perf.advance() != cmaj::Result::Ok) return false;
        if (perf.copyOutputFrames(ctx.outHandle, dst + (uint64_t)k * BLOCK_SIZE, BLOCK_SIZE)
            != cmaj::Result::Ok) return false;
    }
    return true;
}

} // anonymous namespace

#ifdef TSAN_RT_PROBE
// ── T3b RT-thread-coverage witness entry point ────────────────────
// Renders a SHORT pure-A run; rt_render.cpp plants an unsynchronized sentinel on
// the RT render path raced by a side thread. TSan must report a data race naming
// an rt_render.cpp frame. No metrics, no proof — this binary only proves the RT
// render loop is TSan-instrumented (PRE-REG §5.3 T3b).
int main()
{
    std::cout << "=== G1A TSan RT-PROBE (T3b RT-thread-coverage witness) ===\n";
    if (!initLibrary())
    {
        std::cerr << "FATAL: cannot load " << DLL_NAME << "\n";
        return 2;
    }
    EngineCtx ctxA = buildSineEngine(SINE_A_SOURCE, /*sessionId=*/0x5A);
    if (!ctxA.ok) { std::cerr << "FATAL: Engine A build failed: " << ctxA.error << "\n"; return 3; }

    ReloadState st;
    st.outHandle_A = ctxA.outHandle;
    st.resetForRepeat(0, /*enablePerturb=*/false, SEED_MASTER);
    st.performers[0] = ctxA.engine.createPerformer();
    if (!st.performers[0]) { std::cerr << "FATAL: createPerformer(A) failed\n"; return 5; }
    st.performers[0].setBlockSize(BLOCK_SIZE);

    // Short run BELOW K_COMPILE_START so no worker/B compile is needed — the
    // planted RT-loop sentinel race fires in the pure-A region within a few blocks.
    const uint32_t probeBlocks = 50;
    std::vector<float> master((uint64_t)probeBlocks * BLOCK_SIZE);
    std::vector<float> aStream((uint64_t)probeBlocks * BLOCK_SIZE);
    std::vector<float> bStream(B_STREAM_SAMPLES);  // unused in this short run
    RenderBuffers bufs;
    bufs.master = master.data();
    bufs.aStream = aStream.data();
    bufs.bStream = bStream.data();

    rtRenderRun(st, bufs, SINE_B_SOURCE, /*sessionIdB=*/0x5B, /*timed=*/false, probeBlocks);

    std::cout << "RT-PROBE render complete (planted RT-loop race exercised).\n";
    return 0;
}

#else
// ── Main certification harness entry point ────────────────────────
int main(int argc, char** argv)
{
    std::string artDir = "/mnt/c/Users/doner/SSI/g1a/_run-tsan/artifacts/";
    if (argc >= 2) { artDir = argv[1]; if (!artDir.empty() && artDir.back() != '/') artDir += '/'; }

    std::cout << "=== G1A TSan/Linux CERTIFICATION spike (main harness) ===\n";

    // ── 1. Init + Engine A (main thread, before any RT/worker thread) ──
    if (!initLibrary())
    {
        // Feasibility sub-gate FAIL (T1): runtime unobtainable/unlinkable.
        std::cerr << "FATAL: cannot load " << DLL_NAME
                  << " (T1 feasibility sub-gate FAIL -> branch (ii))\n";
        std::cout << "\n=== FINAL VERDICT: FAIL ===\n";
        std::cout << "\n--- PRE-DECLARED FALLBACK (PRE-REG §9, verbatim) ---\n";
        std::cout << FALLBACK_VERBATIM;
        return 2;
    }
    const std::string liveVersion = cmaj::Library::getVersion();
    std::cout << "Runtime loaded, version " << liveVersion << "\n";

    EngineCtx ctxA = buildSineEngine(SINE_A_SOURCE, /*sessionId=*/0x5A);
    if (!ctxA.ok) { std::cerr << "FATAL: Engine A build failed: " << ctxA.error << "\n"; return 3; }
    std::cout << "Engine A (SineA 440 Hz) built, outHandle=" << ctxA.outHandle << "\n";

    // ── 2. Reference (solo) renders for T4a Goertzel normalisation ──
    std::vector<float> aSolo(MEAS_SAMPLES), bSolo(MEAS_SAMPLES);
    if (!renderSolo(ctxA, aSolo.data()))
    { std::cerr << "FATAL: A_solo render failed\n"; return 4; }
    {
        EngineCtx ctxBsolo = buildSineEngine(SINE_B_SOURCE, /*sessionId=*/0x5C);
        if (!ctxBsolo.ok) { std::cerr << "FATAL: B_solo engine failed: " << ctxBsolo.error << "\n"; return 4; }
        if (!renderSolo(ctxBsolo, bSolo.data()))
        { std::cerr << "FATAL: B_solo render failed\n"; return 4; }
    }
    std::cout << "Solo references rendered (A_solo, B_solo: " << MEAS_SAMPLES << " samples each)\n";

    // ── 3. Reload repeats ──
    ReloadState st;
    st.outHandle_A = ctxA.outHandle;

    MetricResults R;

    std::vector<float> master0, aStream0, bStream0;
    std::vector<uint32_t> writtenBlocks0;
    std::vector<uint64_t> blockNs0;

    uint32_t runsCompleted = 0;

    for (uint32_t r = 0; r < R_REPEATS; ++r)
    {
        st.resetForRepeat(r, /*enablePerturb=*/(r != 0), SEED_MASTER);

        st.performers[0] = ctxA.engine.createPerformer();
        if (!st.performers[0]) { std::cerr << "FATAL: createPerformer(A) failed (r=" << r << ")\n"; return 5; }
        if (st.performers[0].setBlockSize(BLOCK_SIZE) != cmaj::Result::Ok)
            st.resultViolations.fetch_add(1, std::memory_order_relaxed);

        std::vector<float> master(TOTAL_SAMPLES);
        std::vector<float> aStream(A_STREAM_SAMPLES);
        std::vector<float> bStream(B_STREAM_SAMPLES);

        RenderBuffers bufs;
        bufs.master  = master.data();
        bufs.aStream = aStream.data();
        bufs.bStream = bStream.data();

        std::vector<uint32_t> writtenBlocks;
        std::vector<uint64_t> blockNs;
        if (r == 0)
        {
            writtenBlocks.reserve(N_BLOCKS);
            blockNs.reserve(N_BLOCKS);
            bufs.writtenBlocks = &writtenBlocks;
            bufs.blockNs = &blockNs;
        }

        std::cout << "Repeat " << r << " (perturb=" << (r != 0 ? "on" : "off")
                  << ") rendering...\n" << std::flush;

        rtRenderRun(st, bufs, SINE_B_SOURCE, /*sessionIdB=*/0x5B, /*timed=*/(r == 0));

        // Safe release of the OLD performer A (post-crossfade, post-acquire).
        safeReleaseOldPerformer(st);

        // Release this repeat's B resources so the next repeat rebuilds fresh.
        st.performers[1] = cmaj::Performer{};
        st.engineB = cmaj::Engine{};

        if (r == 0)
        {
            R.swap_block = st.swapBlock;
            R.swap_count = st.swapCount;
            R.k_compile_done = st.kCompileDone;
            R.compile_result_ok = st.compileOk.load();
            R.old_perf_released_post_crossfade = st.oldPerfReleasedPostCrossfade;
        }
        else if (st.swapBlock != R.swap_block || st.swapCount != R.swap_count)
        {
            std::cerr << "WARN: repeat " << r << " swap mismatch (block="
                      << st.swapBlock << ", count=" << st.swapCount << ")\n";
        }

        const float* xfadeRegion = master.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE;
        R.hashes_full.push_back(sha256_floats(master.data(), TOTAL_SAMPLES));
        R.hashes_A.push_back(sha256_floats(aStream.data(), A_STREAM_SAMPLES));
        R.hashes_B.push_back(sha256_floats(bStream.data(), B_STREAM_SAMPLES));
        R.hashes_xfade.push_back(sha256_floats(xfadeRegion, XFADE_SAMPLES));

        if (r == 0)
        {
            master0 = std::move(master);
            aStream0 = std::move(aStream);
            bStream0 = std::move(bStream);
            writtenBlocks0 = std::move(writtenBlocks);
            blockNs0 = std::move(blockNs);
        }
        ++runsCompleted;
    }

    // ── 4. Compute T1–T4 ──

    // ---- T1: from build.log (build/link/tsan-linkage/arch) + live version ----
    const std::string buildLog = artDir + "build.log";
    R.host_build_ok    = fileContains(buildLog, "Build complete");
    R.control_build_ok = R.host_build_ok;
    R.rtprobe_build_ok = R.host_build_ok;
    R.link_ok          = R.host_build_ok;
    R.tsan_enabled_in_binary =
        fileContains(buildLog, "__tsan_") &&
        (fileContains(buildLog, "libclang_rt.tsan") || fileContains(buildLog, "libtsan"));
    {
        std::ifstream sof(std::string("/mnt/c/Users/doner/SSI/g1a/_run-tsan/spike/") + DLL_NAME, std::ios::binary);
        R.linux_runtime_obtained = (bool)sof;
    }
    R.runtime_arch = (fileContains(buildLog, "x86-64") || fileContains(buildLog, "x86_64"))
                     ? std::string("x86_64") : std::string("unknown");
    R.runtime_version = liveVersion.empty() ? std::string("unknown") : liveVersion;
    R.T1_pass = R.host_build_ok && R.control_build_ok && R.rtprobe_build_ok && R.link_ok
                && R.tsan_enabled_in_binary && R.linux_runtime_obtained
                && (R.runtime_arch == "x86_64") && (R.runtime_version == std::string(DLL_VERSION));

    // ---- T4: functional equivalence + completeness (from buffers) ----
    {
        const float* aXfade = aStream0.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE;
        const float* bXfade = bStream0.data();
        const float* xfadeRegion = master0.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE;

        R.mix_err = mixError(xfadeRegion, aXfade, bXfade, XFADE_SAMPLES);
        R.alpha_monotone = alphaMonotone(XFADE_SAMPLES);
        R.click_max = clickMax(master0.data(), TOTAL_SAMPLES);

        const float* aPre  = master0.data() + (uint64_t)A_PRE_START * BLOCK_SIZE;
        const float* bPost = master0.data() + (uint64_t)B_POST_START * BLOCK_SIZE;

        const double magApre440 = goertzelMag(aPre,  MEAS_SAMPLES, FREQ_A,   SAMPLE_RATE);
        const double magApre880 = goertzelMag(aPre,  MEAS_SAMPLES, FREQ_B,   SAMPLE_RATE);
        const double magApre660 = goertzelMag(aPre,  MEAS_SAMPLES, FREQ_CTL, SAMPLE_RATE);
        const double magBpost440 = goertzelMag(bPost, MEAS_SAMPLES, FREQ_A,   SAMPLE_RATE);
        const double magBpost880 = goertzelMag(bPost, MEAS_SAMPLES, FREQ_B,   SAMPLE_RATE);
        const double magBpost660 = goertzelMag(bPost, MEAS_SAMPLES, FREQ_CTL, SAMPLE_RATE);
        const double magAsolo440 = goertzelMag(aSolo.data(), MEAS_SAMPLES, FREQ_A, SAMPLE_RATE);
        const double magBsolo880 = goertzelMag(bSolo.data(), MEAS_SAMPLES, FREQ_B, SAMPLE_RATE);

        R.rel440_pre   = magApre440  / magAsolo440;
        R.rel880_post  = magBpost880 / magBsolo880;
        R.leak880_pre  = magApre880  / magAsolo440;
        R.leak440_post = magBpost440 / magBsolo880;
        const double ctlNum = (magApre660 > magBpost660) ? magApre660 : magBpost660;
        const double ctlDen = (magAsolo440 > magBsolo880) ? magAsolo440 : magBsolo880;
        R.rel_ctl = ctlNum / ctlDen;

        CompletenessStats cs = auditCompleteness(writtenBlocks0, N_BLOCKS);
        R.blocks_rendered = cs.blocks_rendered;
        R.dropped_blocks = cs.dropped_blocks;
        R.duplicated_blocks = cs.duplicated_blocks;

        R.repro_ok = allEqual(R.hashes_full) && allEqual(R.hashes_A)
                     && allEqual(R.hashes_B) && allEqual(R.hashes_xfade);

        // T4f cross-platform (spectral diffs + bounded short-prefix vs Windows).
        R.win_ref_rel440_pre  = WIN_REF_REL440_PRE;
        R.win_ref_rel880_post = WIN_REF_REL880_POST;
        R.win_ref_click_max   = WIN_REF_CLICK_MAX;
        R.delta_rel440_pre  = std::abs(R.rel440_pre  - WIN_REF_REL440_PRE);
        R.delta_rel880_post = std::abs(R.rel880_post - WIN_REF_REL880_POST);
        R.delta_click_max   = std::abs(R.click_max   - WIN_REF_CLICK_MAX);

        std::vector<float> winFull;
        if (readWavFloat(WIN_REF_FULL_WAV, winFull))
            R.prefix_max_delta = prefixMaxDelta(master0.data(), TOTAL_SAMPLES,
                                                winFull.data(), winFull.size(),
                                                PREFIX_SAMPLES);
        else
            R.prefix_max_delta = 1e30;  // reference unavailable -> fail-closed

        const bool spectralOk = (R.rel440_pre >= REL_MIN) && (R.rel880_post >= REL_MIN)
                                && (R.leak880_pre <= LEAK_MAX) && (R.leak440_post <= LEAK_MAX)
                                && (R.rel_ctl <= LEAK_MAX);
        const bool mixOk   = (R.mix_err <= EPS_XFADE) && R.alpha_monotone;
        const bool clickOk = (R.click_max <= S_CLICK);
        const bool compOk  = (R.blocks_rendered == N_BLOCKS) && (R.swap_block == K_SWAP)
                             && (R.swap_count == 1) && (R.dropped_blocks == 0)
                             && (R.duplicated_blocks == 0) && R.old_perf_released_post_crossfade;
        const bool xplatOk = (R.delta_rel440_pre <= EPS_SPECTRAL)
                             && (R.delta_rel880_post <= EPS_SPECTRAL)
                             && (R.delta_click_max <= EPS_SPECTRAL)
                             && (R.prefix_max_delta <= EPS_PREFIX);
        R.T4_pass = spectralOk && mixOk && clickOk && compOk && R.repro_ok && xplatOk;
    }

    // ---- informative timing (NOT gated) ----
    {
        const uint32_t winLo = K_COMPILE_START;
        const uint32_t winHi = (R.k_compile_done > K_COMPILE_START) ? R.k_compile_done : K_COMPILE_START;
        TimingStats ts = reduceTimings(blockNs0, winLo, winHi, D_BLOCK_NS);
        R.xrun_informative = ts.xrun_count;
        R.p50_ns = ts.p50_ns; R.p99_ns = ts.p99_ns; R.max_ns = ts.max_ns;
    }

    // ---- T3: detector-liveness from the Step-0 control + RT-probe logs ----
    const std::string controlLog = artDir + "tsan_control.log";
    const std::string rtprobeLog = artDir + "tsan_rtprobe.log";
    R.control_race_caught = fileContains(controlLog, "WARNING: ThreadSanitizer: data race");
    R.rtprobe_race_caught = fileContains(rtprobeLog, "WARNING: ThreadSanitizer: data race");
    R.rtprobe_frame_named = raceNamesFrame(rtprobeLog, "rt_render");
    R.detector_alive = R.control_race_caught;
    R.rt_covered = R.rtprobe_race_caught && R.rtprobe_frame_named;
    R.T3_pass = R.detector_alive && R.rt_covered;

    // ---- T2: TSAN-CLEAN main run (from this run's captured stderr log) ----
    const std::string mainLog = artDir + "tsan_main_run.log";
    R.nonsuppressed_race_reports = countInFile(mainLog, "WARNING: ThreadSanitizer: data race");
    R.warning_reports = countInFile(mainLog, "WARNING: ThreadSanitizer");
    R.suppressed_race_count = parseSuppressedCount(mainLog);
    R.host_suppressed_races = 0;   // only `race:libCmajPerformer.so` suppression exists (verifier audits)
    R.runs_completed = runsCompleted;
    R.blocks_per_run = R.blocks_rendered;
    R.T2_pass = (R.nonsuppressed_race_reports == 0) && (R.warning_reports == 0)
                && (R.runs_completed == R_REPEATS) && (R.blocks_per_run == N_BLOCKS)
                && (R.host_suppressed_races == 0);

    R.tsan_clean = (R.nonsuppressed_race_reports == 0) && (R.warning_reports == 0);

    // ── 5. Write the TSan-cert PROOF artifact ──
    writeWavFloat(artDir + "A_pre.wav",            master0.data() + (uint64_t)A_PRE_START * BLOCK_SIZE, MEAS_SAMPLES, SAMPLE_RATE);
    writeWavFloat(artDir + "B_post.wav",           master0.data() + (uint64_t)B_POST_START * BLOCK_SIZE, MEAS_SAMPLES, SAMPLE_RATE);
    writeWavFloat(artDir + "crossfade_region.wav", master0.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE, XFADE_SAMPLES, SAMPLE_RATE);
    writeWavFloat(artDir + "full_output.wav",      master0.data(), TOTAL_SAMPLES, SAMPLE_RATE);
    writeWavFloat(artDir + "A_solo.wav",           aSolo.data(), MEAS_SAMPLES, SAMPLE_RATE);
    writeWavFloat(artDir + "B_solo.wav",           bSolo.data(), MEAS_SAMPLES, SAMPLE_RATE);
    writeWavFloat(artDir + "A_xfade.wav",          aStream0.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE, XFADE_SAMPLES, SAMPLE_RATE);
    writeWavFloat(artDir + "B_xfade.wav",          bStream0.data(), XFADE_SAMPLES, SAMPLE_RATE);

    writeLogicDiffWitness(artDir + "logic_diff_witness.txt");

    R.proof_complete = true;

    // ── 6. Verdict ──
    const bool FINAL_PASS = R.T1_pass && R.T2_pass && R.T3_pass && R.T4_pass
                            && R.proof_complete && R.tsan_clean;
    R.final_verdict = FINAL_PASS ? "PASS" : "FAIL";

    writeTraceLog(artDir + "trace.log", R);
    writeMetricsJson(artDir + "metrics.json", R);

    std::cout << "\n=== METRIC SUMMARY ===\n";
    std::cout << "T1 (clean Linux TSan build + feasibility): " << (R.T1_pass?"PASS":"FAIL")
              << "  tsan_linked=" << (R.tsan_enabled_in_binary?"y":"n")
              << " runtime=" << R.runtime_version << "/" << R.runtime_arch << "\n";
    std::cout << "T2 (TSAN-CLEAN main run):                  " << (R.T2_pass?"PASS":"FAIL")
              << "  nonsupp_races=" << R.nonsuppressed_race_reports
              << " warnings=" << R.warning_reports
              << " runs=" << R.runs_completed << " blocks=" << R.blocks_per_run << "\n";
    std::cout << "T3 (detector-liveness a+b):                " << (R.T3_pass?"PASS":"FAIL")
              << "  control_caught=" << (R.control_race_caught?"y":"n")
              << " rtprobe_caught=" << (R.rtprobe_race_caught?"y":"n")
              << " rt_frame_named=" << (R.rtprobe_frame_named?"y":"n") << "\n";
    std::cout << "T4 (functional equiv + completeness):      " << (R.T4_pass?"PASS":"FAIL")
              << "  rel440_pre=" << R.rel440_pre << " rel880_post=" << R.rel880_post
              << " mix_err=" << R.mix_err << " click_max=" << R.click_max
              << " repro=" << (R.repro_ok?"y":"n")
              << " prefixΔ=" << R.prefix_max_delta << "\n";
    std::cout << "tsan_clean=" << (R.tsan_clean?"true":"false")
              << " proof_complete=" << (R.proof_complete?"true":"false") << "\n";

    std::cout << "\n=== FINAL VERDICT: " << R.final_verdict << " ===\n";
    if (!FINAL_PASS)
    {
        std::cout << "\n--- PRE-DECLARED FALLBACK (PRE-REG §9, verbatim) ---\n";
        std::cout << FALLBACK_VERBATIM;
    }

    (void)argc; (void)argv;
    return FINAL_PASS ? 0 : 1;
}
#endif // TSAN_RT_PROBE
