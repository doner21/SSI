// main.cpp — G1A RELOAD-BRIDGE spike orchestrator (HARNESS-SPEC §5 run order).
//
// Implements EXACTLY the locked PRE-REGISTRATION: a live 440 Hz performer A is
// hot-swapped with a background-JIT-compiled 880 Hz performer B (compiled on a
// non-RT worker thread via a second cmaj::Engine while A is live), swapped via a
// std::atomic<uint32_t> active-index at the pre-committed block boundary K_SWAP,
// crossfaded A->B click-free, with safe post-crossfade release of A. Measures the
// four pre-registered metrics R1–R4 and writes the reload-PROOF artifact.
//
// Generator != certifier: this executor implements/measures; the independent
// verifier re-hashes the frozen spec and recomputes R1–R4 from the proof artifact.

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
#include <sstream>
#include <string>
#include <vector>

#ifdef _WIN32
  #include <crtdbg.h>
#endif

using namespace g1a;

// The PRE-DECLARED FALLBACK (PRE-REG §8) — quoted VERBATIM on FINAL FAIL.
static const char* FALLBACK_VERBATIM =
"PRE-DECLARED FALLBACK — G1A reload-bridge pass (committed before any result exists):\n"
"\n"
"On FINAL FAIL of the G1A reload-bridge spike, the verdict is: `investment-freeze on fail -> silence-boundary reload fallback`.\n"
"\n"
"(1) Investment-freeze means: immediately HALT all further investment in the live crossfade reload bridge. No additional engineering is spent on background-compiled atomic-swap live-crossfade hot-reload of cmaj::Performer instances. The later reload-bridge passes (event-replay across reload, transport-sync, latency-compensation, multi-authority) are NOT started. The live-crossfade-swap question is escalated to Donald for a platform decision. The freeze persists until the swap/release path is certified on a TSan-capable platform (Linux x64, -fsanitize=thread) — the separate later pass declared OUT OF SCOPE in §10.\n"
"\n"
"(2) Silence-boundary reload fallback means: the SSI DAW ships, in the interim, the reload model already PROVEN in pass 1 — a single-performer-at-a-time reload with no live crossfade. To reload from patch A to a freshly compiled patch B, the host stops performer A to digital silence at the boundary (advance A to the boundary block, then hold the output at zero samples), background-compiles B as in pass 1's proven concurrency model, and only then starts performer B from silence. There is NO live A->B crossfade of two simultaneously-live performers in this fallback — the click-free live-crossfade reload remains blocked until the reload bridge is proven on a TSan-capable platform (§10). This trades the seamless live-crossfade reload for the already-PROVEN correctness of pass 1 (concurrent ownership + single-performer render: Gain 0.5, XRuns 0, ASan clean, bit-exact).\n";

namespace {

const std::string ART_DIR = "artifacts/";

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

// Ingest the ASan-build run log (captured stderr+stdout). Counts AddressSanitizer
// and CRT-heap reports. Returns an excerpt of the first matching lines.
void ingestAsanLog(const std::string& path, MetricResults& r)
{
    std::ifstream f(path);
    if (!f)
    {
        // No ASan log present => cannot certify ASan-clean => proof incomplete.
        r.asan_violations = 0;
        r.crt_heap_violations = 0;
        r.asan_clean = false;
        r.asan_log_excerpt = "ASAN: log file '" + path + "' NOT FOUND (asan run not captured)";
        return;
    }
    std::string line, excerpt;
    int excerptLines = 0;
    while (std::getline(f, line))
    {
        // Match the actual ASan REPORT signatures only (not incidental mentions
        // of the tool name in our own clean-exit marker).
        const bool asan =
            line.find("ERROR: AddressSanitizer") != std::string::npos ||
            line.find("SUMMARY: AddressSanitizer") != std::string::npos ||
            line.find("heap-buffer-overflow") != std::string::npos ||
            line.find("heap-use-after-free") != std::string::npos ||
            line.find("stack-buffer-overflow") != std::string::npos ||
            line.find("attempting double-free") != std::string::npos;
        const bool crt =
            line.find("CRT detected") != std::string::npos ||
            line.find("_CrtIsValidHeapPointer") != std::string::npos ||
            line.find("HEAP CORRUPTION") != std::string::npos ||
            line.find("Invalid allocation size") != std::string::npos;
        if (asan) ++r.asan_violations;
        if (crt)  ++r.crt_heap_violations;
        if ((asan || crt) && excerptLines < 20)
        {
            excerpt += line; excerpt += "\n"; ++excerptLines;
        }
        // Also capture an explicit clean marker emitted by the ASan run.
        if (line.find("ASAN_RUN_CLEAN_EXIT") != std::string::npos && excerptLines < 20)
        {
            excerpt += line; excerpt += "\n"; ++excerptLines;
        }
    }
    r.asan_clean = (r.asan_violations == 0 && r.crt_heap_violations == 0);
    r.asan_log_excerpt = excerpt.empty() ? std::string("ASAN: no reports") : excerpt;
}

} // anonymous namespace

int main(int argc, char** argv)
{
#ifdef _WIN32
    // MSVC CRT debug-heap corruption checking (active in debug-CRT builds).
    // ASan is the operative detector for release builds (HARNESS-SPEC §3.1).
    _CrtSetDbgFlag(_CRTDBG_ALLOC_MEM_DF | _CRTDBG_CHECK_ALWAYS_DF | _CRTDBG_LEAK_CHECK_DF);
#endif

#ifdef G1A_ASAN
    const bool isAsanBuild = true;
#else
    const bool isAsanBuild = false;
#endif

    std::cout << "=== G1A RELOAD-BRIDGE spike ("
              << (isAsanBuild ? "ASan" : "normal") << " build) ===\n";

    // ── 1. Init + Engine A (main thread, before any RT/worker thread) ──
    if (!initLibrary())
    {
        std::cerr << "FATAL: cannot load " << DLL_NAME << "\n";
        return 2;
    }
    std::cout << "DLL loaded, version " << cmaj::Library::getVersion() << "\n";

    EngineCtx ctxA = buildSineEngine(SINE_A_SOURCE, /*sessionId=*/0x5A);
    if (!ctxA.ok) { std::cerr << "FATAL: Engine A build failed: " << ctxA.error << "\n"; return 3; }
    std::cout << "Engine A (SineA 440 Hz) built, outHandle=" << ctxA.outHandle << "\n";

    // ── 2. Reference (solo) renders for R3 Goertzel normalisation (§4.6) ──
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

    // Repeat-0 retained buffers (for dumps + R3 computation).
    std::vector<float> master0, aStream0, bStream0;
    std::vector<uint32_t> writtenBlocks0;
    std::vector<uint64_t> blockNs0;

    for (uint32_t r = 0; r < R_REPEATS; ++r)
    {
        st.resetForRepeat(r, /*enablePerturb=*/(r != 0), SEED_MASTER);

        // Mint a FRESH phase-0 performer A from Engine A for this repeat.
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

        // ── Safe release of the OLD performer A (post-crossfade, post-acquire) ──
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
            R.old_perf_release_block = st.oldPerfReleaseBlock;
            R.old_perf_released_post_crossfade = st.oldPerfReleasedPostCrossfade;
        }
        else
        {
            // Cross-check the swap landed at the locked block in every repeat.
            if (st.swapBlock != R.swap_block || st.swapCount != R.swap_count)
                std::cerr << "WARN: repeat " << r << " swap mismatch (block="
                          << st.swapBlock << ", count=" << st.swapCount << ")\n";
        }

        // Per-stream hashes (the crossfade region = master slice [K_XFADE_START*256, K_SWAP*256)).
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
    }

    // Engine A no longer needed after the final repeat's performer A released.
    // (ctxA.engine is released at scope exit.)

    // ── 4. Compute metrics R1–R4 from repeat-0 buffers + records + hashes ──

    // R1 — background-compile non-disruption (repeat 0).
    {
        const uint32_t winLo = K_COMPILE_START;
        const uint32_t winHi = (R.k_compile_done > K_COMPILE_START) ? R.k_compile_done : K_COMPILE_START;
        TimingStats ts = reduceTimings(blockNs0, winLo, winHi, D_BLOCK_NS);
        R.xrun_during_compile = ts.xrun_count;
        R.p50_ns = ts.p50_ns; R.p99_ns = ts.p99_ns; R.max_ns = ts.max_ns;
        R.compile_completed_before_xfade = (R.k_compile_done < K_XFADE_START);
        R.R1_pass = (R.xrun_during_compile == 0) && R.compile_result_ok
                    && R.compile_completed_before_xfade;
    }

    // R2 — atomic / lock-free swap safety. (asan_* filled by ingestAsanLog below.)
    R.result_violations = st.resultViolations.load();

    // R3 — click-free crossfade correctness (repeat 0).
    {
        const float* aXfade = aStream0.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE; // A's xfade output
        const float* bXfade = bStream0.data();                                        // B's xfade output (starts at K_XFADE_START)
        const float* xfadeRegion = master0.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE;

        R.mix_err = mixError(xfadeRegion, aXfade, bXfade, XFADE_SAMPLES);
        R.alpha_monotone = alphaMonotone(XFADE_SAMPLES);
        R.click_max = clickMax(master0.data(), TOTAL_SAMPLES);

        const float* aPre  = master0.data() + (uint64_t)A_PRE_START * BLOCK_SIZE;  // pure A
        const float* bPost = master0.data() + (uint64_t)B_POST_START * BLOCK_SIZE; // pure B

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

        R.R3_pass = (R.mix_err <= EPS_XFADE) && R.alpha_monotone
                    && (R.click_max <= S_CLICK)
                    && (R.rel440_pre >= REL_MIN) && (R.rel880_post >= REL_MIN)
                    && (R.leak880_pre <= LEAK_MAX) && (R.leak440_post <= LEAK_MAX)
                    && (R.rel_ctl <= LEAK_MAX);
    }

    // R4 — determinism + completeness.
    {
        CompletenessStats cs = auditCompleteness(writtenBlocks0, N_BLOCKS);
        R.blocks_rendered = cs.blocks_rendered;
        R.dropped_blocks = cs.dropped_blocks;
        R.duplicated_blocks = cs.duplicated_blocks;
        R.repro_ok = allEqual(R.hashes_full) && allEqual(R.hashes_A)
                     && allEqual(R.hashes_B) && allEqual(R.hashes_xfade);
        R.R4_pass = R.repro_ok && (R.blocks_rendered == N_BLOCKS)
                    && (R.dropped_blocks == 0) && (R.duplicated_blocks == 0)
                    && (R.swap_block == K_SWAP);
    }

    // ── ASan ingestion (R2 safety counts) ──
    ingestAsanLog(ART_DIR + "asan_run.log", R);
    R.R2_pass = (R.asan_violations == 0) && (R.crt_heap_violations == 0)
                && (R.result_violations == 0) && (R.swap_block == K_SWAP)
                && (R.swap_count == 1) && R.old_perf_released_post_crossfade;

    // ── 5. Write the reload-PROOF artifact ──
    writeWavFloat(ART_DIR + "A_pre.wav",            master0.data() + (uint64_t)A_PRE_START * BLOCK_SIZE, MEAS_SAMPLES, SAMPLE_RATE);
    writeWavFloat(ART_DIR + "B_post.wav",           master0.data() + (uint64_t)B_POST_START * BLOCK_SIZE, MEAS_SAMPLES, SAMPLE_RATE);
    writeWavFloat(ART_DIR + "crossfade_region.wav", master0.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE, XFADE_SAMPLES, SAMPLE_RATE);
    writeWavFloat(ART_DIR + "full_output.wav",      master0.data(), TOTAL_SAMPLES, SAMPLE_RATE);
    writeWavFloat(ART_DIR + "A_solo.wav",           aSolo.data(), MEAS_SAMPLES, SAMPLE_RATE);
    writeWavFloat(ART_DIR + "B_solo.wav",           bSolo.data(), MEAS_SAMPLES, SAMPLE_RATE);
    writeWavFloat(ART_DIR + "A_xfade.wav",          aStream0.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE, XFADE_SAMPLES, SAMPLE_RATE);
    writeWavFloat(ART_DIR + "B_xfade.wav",          bStream0.data(), XFADE_SAMPLES, SAMPLE_RATE);

    R.proof_complete = true;

    // ── 6. Verdict ──
    const bool FINAL_PASS = R.R1_pass && R.R2_pass && R.R3_pass && R.R4_pass
                            && R.proof_complete && R.asan_clean;
    R.final_verdict = FINAL_PASS ? "PASS" : "FAIL";

    writeTraceLog(ART_DIR + "trace.log", R);
    writeMetricsJson(ART_DIR + "metrics.json", R);

    std::cout << "\n=== METRIC SUMMARY ===\n";
    std::cout << "R1 (bg-compile non-disruption): " << (R.R1_pass?"PASS":"FAIL")
              << "  xrun=" << R.xrun_during_compile
              << " compile=" << (R.compile_result_ok?"Ok":"Fail")
              << " k_done=" << R.k_compile_done << "\n";
    std::cout << "R2 (atomic swap safety):        " << (R.R2_pass?"PASS":"FAIL")
              << "  asan=" << R.asan_violations << " crt=" << R.crt_heap_violations
              << " result=" << R.result_violations
              << " swap_block=" << R.swap_block << " swap_count=" << R.swap_count
              << " released_post=" << (R.old_perf_released_post_crossfade?"true":"false") << "\n";
    std::cout << "R3 (click-free crossfade):      " << (R.R3_pass?"PASS":"FAIL")
              << "  mix_err=" << R.mix_err << " click_max=" << R.click_max
              << " rel440_pre=" << R.rel440_pre << " rel880_post=" << R.rel880_post
              << " leak880_pre=" << R.leak880_pre << " leak440_post=" << R.leak440_post
              << " rel_ctl=" << R.rel_ctl << "\n";
    std::cout << "R4 (determinism+completeness):  " << (R.R4_pass?"PASS":"FAIL")
              << "  repro_ok=" << (R.repro_ok?"true":"false")
              << " blocks=" << R.blocks_rendered
              << " dropped=" << R.dropped_blocks << " dup=" << R.duplicated_blocks << "\n";
    std::cout << "asan_clean=" << (R.asan_clean?"true":"false")
              << " proof_complete=" << (R.proof_complete?"true":"false") << "\n";

    if (isAsanBuild)
    {
        // The ASan build's job is to run the suite clean; its captured stderr is
        // ingested by the normal build. Emit an explicit clean-exit marker.
        std::cout << "ASAN_RUN_CLEAN_EXIT (sanitized suite completed without a sanitizer report)\n";
    }

    std::cout << "\n=== FINAL VERDICT: " << R.final_verdict << " ===\n";
    if (!FINAL_PASS)
    {
        std::cout << "\n--- PRE-DECLARED FALLBACK (PRE-REG §8, verbatim) ---\n";
        std::cout << FALLBACK_VERBATIM;
    }

    (void)argc; (void)argv;
    return FINAL_PASS ? 0 : 1;
}
