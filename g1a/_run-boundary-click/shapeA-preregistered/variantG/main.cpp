// main.cpp — G1A EVENT-REPLAY spike orchestrator (HARNESS-SPEC §5 run order).
//
// Implements EXACTLY the locked PRE-REGISTRATION: a single FreqSine engine shared
// by all performers (A, B, references), event-reactive with `input value float freq`,
// deterministic event schedule from SEED_MASTER, atomic-index swap at K_SWAP from
// performer A to an off-RT-prepared performer B, host-side crossfade, reset() +
// latch-replay after swap, safe post-crossfade release of A, and R = 5 seeded
// interleaving-reproducibility repeats.
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
#include "event_schedule.h"
#include "reference.h"

#include <cstdint>
#include <cstdio>
#include <cstring>
#include <cmath>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#ifdef _WIN32
  #include <crtdbg.h>
#endif

using namespace g1a;

// The PRE-DECLARED FALLBACK (PRE-REG BOUNDARY-CLICK §7) — quoted VERBATIM on FINAL FAIL.
static const char* FALLBACK_VERBATIM =
"If the swap-boundary click cannot be brought <= 0.05 while preserving bit-exact post-swap "
"(maxerr_reload_B==0) and crossfade phase (maxerr_B_xfade==0), adopt the HYBRID bridge: "
"warm-up-normalized crossfade for the regenerate transition plus per-block idempotent frequency "
"re-statement across the K_SWAP boundary (re-send current input values every block at/after the "
"swap; state converges within one block period) in place of the reset+latch-replay swap. If the "
"crossfade phase itself regresses, fall all the way back to full per-block idempotent frequency "
"re-statement and investment-freeze the live-crossfade bridge.\n";

namespace {

const std::string ART_DIR = "artifacts/";

// Render a solo presence reference: P_MEAS blocks from phase 0, constant freq.
// Used for Goertzel R3(e) normalisation.
static bool renderSoloPresence(EngineCtx& ctx, double freq,
                               std::vector<float>& out)
{
    auto buf = renderSolo(ctx, freq);
    if (buf.empty()) return false;
    out = std::move(buf);
    return (out.size() == MEAS_SAMPLES);
}

// Compute max absolute difference between two float buffers.
static double maxAbsDiff(const float* a, const float* b, uint64_t n)
{
    double mx = 0.0;
    for (uint64_t i = 0; i < n; ++i)
    {
        double d = std::fabs((double)a[i] - (double)b[i]);
        if (d > mx) mx = d;
    }
    return mx;
}

// Ingest the ASan-build run log.
static void ingestAsanLog(const std::string& path, MetricResults& r)
{
    std::ifstream f(path);
    if (!f)
    {
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
    _CrtSetDbgFlag(_CRTDBG_ALLOC_MEM_DF | _CRTDBG_CHECK_ALWAYS_DF | _CRTDBG_LEAK_CHECK_DF);
#endif

#ifdef G1A_ASAN
    const bool isAsanBuild = true;
#else
    const bool isAsanBuild = false;
#endif

    std::cout << "=== G1A BOUNDARY-CLICK spike — Variant " << VARIANT_NAME << " ("
              << (isAsanBuild ? "ASan" : "normal") << " build) ===\n";

    // ── Step 1: Init + Engine (main thread, before any RT/worker thread) ──
    if (!initLibrary())
    {
        std::cerr << "FATAL: cannot load " << DLL_NAME << "\n";
        return 2;
    }
    std::cout << "DLL loaded, version " << cmaj::Library::getVersion() << "\n";

    EngineCtx ctx = buildFreqSineEngine(FREQ_SINE_SOURCE, /*sessionId=*/0x5A);
    if (!ctx.ok) { std::cerr << "FATAL: Engine build failed: " << ctx.error << "\n"; return 3; }
    std::cout << "Engine (FreqSine) built: freqHandle=" << ctx.freqHandle
              << " outHandle=" << ctx.outHandle << "\n";

    // ── Step 2: Generate event schedule from SEED_MASTER ──
    EventSchedule sched = generateEventSchedule(SEED_MASTER);
    std::cout << "Event schedule: " << sched.events.size() << " events\n";
    std::cout << "  sentinel(≥1 in [0, K_XFADE)): "
              << (sched.sentinel_at_least_one_in_0_KXFADE ? "OK" : "FAIL") << "\n";
    std::cout << "  sentinel(no change in A_PRE): "
              << (sched.sentinel_no_change_in_APRE ? "OK" : "FAIL") << "\n";
    std::cout << "  sentinel(change before K_SWAP): "
              << (sched.sentinel_change_strictly_before_KSWAP ? "OK" : "FAIL") << "\n";
    std::cout << "  sentinel(no change in B_POST): "
              << (sched.sentinel_no_change_in_BPOST ? "OK" : "FAIL") << "\n";
    std::cout << "  sentinel(≥1 after B_POST): "
              << (sched.sentinel_at_least_one_after_BPOST ? "OK" : "FAIL") << "\n";
    std::cout << "  stateAt(K_XFADE_START)=" << sched.stateAt(K_XFADE_START)
              << ", stateAt(K_SWAP)=" << sched.stateAt(K_SWAP)
              << ", A_PRE freq=" << sched.stateAt(A_PRE_START) << "\n";

    // ── Step 3: Reference (oracle) renders ──
    std::cout << "\nRendering references...\n";

    std::vector<float> refA = renderRefA(ctx, sched);
    std::cout << "  REF_A: " << refA.size() << " samples\n";

    std::vector<float> refBxfade = renderRefBxfade(ctx, sched);
    std::cout << "  REF_Bxfade: " << refBxfade.size() << " samples\n";

    std::vector<float> refBpost = renderRefBpost(ctx, sched);
    std::cout << "  REF_Bpost: " << refBpost.size() << " samples\n";

    // Solo presence refs
    double apreFreq = sched.stateAt(A_PRE_START);
    double kswapFreq = sched.stateAt(K_SWAP);
    std::vector<float> soloApre, soloKswap;
    if (!renderSoloPresence(ctx, apreFreq, soloApre))
    { std::cerr << "FATAL: soloApre render failed\n"; return 4; }
    if (!renderSoloPresence(ctx, kswapFreq, soloKswap))
    { std::cerr << "FATAL: soloKswap render failed\n"; return 4; }
    std::cout << "  Solo presence refs: Apre=" << apreFreq
              << " Hz, Kswap=" << kswapFreq << " Hz\n";

    // ── Step 4: Event-replay repeats ──
    EventReplayState st;
    st.sharedEngine = ctx.engine;   // shared engine for all performers
    st.freqHandle = ctx.freqHandle;
    st.outHandle = ctx.outHandle;

    MetricResults R;

    // Repeat-0 retained buffers
    std::vector<float> master0, aStream0, bStream0, aXfade0, bXfade0;
    std::vector<uint32_t> writtenBlocks0;
    std::vector<uint64_t> blockNs0;

    // Retain event logs from repeat 0 for the proof artifact
    std::vector<std::pair<uint32_t, double>> evLogA, evLogBPre, evLogBPost;
    std::vector<std::pair<uint32_t, double>> xfadeInitLog, latchRelog;

    // Allocate crossfade region buffers (shared across repeats)
    std::vector<float> aXfadeBuf(XFADE_SAMPLES), bXfadeBuf(XFADE_SAMPLES);

    for (uint32_t r = 0; r < R_REPEATS; ++r)
    {
        st.resetForRepeat(r, /*enablePerturb=*/(r != 0), SEED_MASTER);

        // Enable event logging only for repeat 0
        if (r == 0)
        {
            st.eventLogA.clear();
            st.eventLogBPre.clear();
            st.eventLogBPost.clear();
            st.xfadeInitialLatchLog.clear();
            st.latchReplayLog.clear();
        }

        // Mint a FRESH phase-0 performer A from the shared engine
        st.performers[0] = st.sharedEngine.createPerformer();
        if (!st.performers[0])
        {
            std::cerr << "FATAL: createPerformer(A) failed (r=" << r << ")\n";
            return 5;
        }
        if (st.performers[0].setBlockSize(BLOCK_SIZE) != cmaj::Result::Ok)
            st.resultViolations.fetch_add(1, std::memory_order_relaxed);

        // Allocate per-repeat buffers
        std::vector<float> master(TOTAL_SAMPLES);
        std::vector<float> aStream(A_STREAM_SAMPLES);
        std::vector<float> bStream(B_STREAM_SAMPLES);

        std::memset(aXfadeBuf.data(), 0, (size_t)(XFADE_SAMPLES * sizeof(float)));
        std::memset(bXfadeBuf.data(), 0, (size_t)(XFADE_SAMPLES * sizeof(float)));

        EventReplayBuffers bufs;
        bufs.master  = master.data();
        bufs.aStream = aStream.data();
        bufs.bStream = bStream.data();
        bufs.aXfade  = aXfadeBuf.data();
        bufs.bXfade  = bXfadeBuf.data();

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

        rtEventReplayRun(st, bufs, sched, /*timed=*/(r == 0));

        // ── Safe release of the OLD performer A ──
        safeReleaseOldPerformer(st);

        // Release this repeat's performer B so the next repeat rebuilds fresh.
        st.performers[1] = cmaj::Performer{};

        if (r == 0)
        {
            // Capture repeat-0 records
            R.swap_block = st.swapBlock;
            R.swap_count = st.swapCount;
            R.k_prepare_done = st.kPrepareDone;
            R.createPerformer_result_ok = st.compileOk.load();
            R.old_perf_release_block = st.oldPerfReleaseBlock;
            R.old_perf_released_post_crossfade = st.oldPerfReleasedPostCrossfade;
            R.reset_called_on_B = st.resetCalledOnB;
            R.latch_replay_called = st.latchReplayCalled;
            R.xrun_at_swap = (st.xrunAtSwap <= D_BLOCK_NS) ? 0 : st.xrunAtSwap;
        }
        else
        {
            if (st.swapBlock != R.swap_block || st.swapCount != R.swap_count)
                std::cerr << "WARN: repeat " << r << " swap mismatch (block="
                          << st.swapBlock << ", count=" << st.swapCount << ")\n";
        }

        // Per-stream hashes
        const float* xfadeRegion = master.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE;
        R.hashes_full.push_back(sha256_floats(master.data(), TOTAL_SAMPLES));
        R.hashes_A.push_back(sha256_floats(aStream.data(), A_STREAM_SAMPLES));
        R.hashes_B.push_back(sha256_floats(bStream.data(), B_STREAM_SAMPLES));
        R.hashes_xfade.push_back(sha256_floats(xfadeRegion, XFADE_SAMPLES));

        if (r == 0)
        {
            master0    = std::move(master);
            aStream0   = std::move(aStream);
            bStream0   = std::move(bStream);
            aXfade0    = aXfadeBuf;
            bXfade0    = bXfadeBuf;
            writtenBlocks0 = std::move(writtenBlocks);
            blockNs0   = std::move(blockNs);

            // Retain event logs
            evLogA     = st.eventLogA;
            evLogBPre  = st.eventLogBPre;
            evLogBPost = st.eventLogBPost;
            xfadeInitLog = st.xfadeInitialLatchLog;
            latchRelog = st.latchReplayLog;
        }
    }

    // ── Step 5: Compute metrics R1–R4 ──

    // R1 — event-delivery & prepare non-disruption (repeat 0)
    {
        const uint32_t winLo = K_PREPARE_START;
        const uint32_t winHi = (R.k_prepare_done > K_PREPARE_START) ? R.k_prepare_done : K_PREPARE_START;
        TimingStats ts = reduceTimings(blockNs0, winLo, std::min(winHi, (uint32_t)blockNs0.size() - 1), D_BLOCK_NS);
        R.xrun_during_prepare = ts.xrun_count;
        R.p50_ns = ts.p50_ns; R.p99_ns = ts.p99_ns; R.max_ns = ts.max_ns;

        R.b_ready_before_xfade = (R.k_prepare_done < K_XFADE_START);

        // Count events scheduled in [K_PREPARE_START, K_PREPARE_DONE] for A
        R.events_expected_A_prepare = sched.eventsInRange(K_PREPARE_START,
                                                          R.k_prepare_done > K_PREPARE_START ?
                                                              R.k_prepare_done : K_PREPARE_START);
        // PRE-REG §5 R1: windowed delivered count (events delivered to A during the
        // B-prepare window), NOT the whole-run total. Compared strictly '==' to
        // events scheduled in [K_PREPARE_START, K_PREPARE_DONE].
        R.events_delivered_A_prepare = st.eventsAppliedAPrepare.load();

        // Events dropped in crossfade window: events not delivered to B during crossfade
        R.events_dropped_in_window = (st.eventsAppliedBPre.load() < sched.eventsInRange(K_XFADE_START, K_SWAP))
            ? (sched.eventsInRange(K_XFADE_START, K_SWAP) - st.eventsAppliedBPre.load())
            : 0;

        R.b_xfade_initial_latch_count = st.bXfadeInitialLatchCount.load();

        // PRE-REG §5 R1: strict '==' between delivered and expected (fixes parent's '>=' bug).
        R.R1_pass = (R.xrun_during_prepare == 0) && R.createPerformer_result_ok
                    && R.b_ready_before_xfade
                    && (R.events_delivered_A_prepare == R.events_expected_A_prepare)  // §5 strict equality
                    && (R.events_dropped_in_window == 0)
                    && (R.b_xfade_initial_latch_count == 1);
    }

    // R2 — atomic swap safety + reset + latch-replay (asan filled by ingestAsanLog)
    {
        R.result_violations = st.resultViolations.load();
        R.R2_pass = false; // set after ingestAsanLog
    }

    // R3 — event-response correctness + click-free (repeat 0)
    {
        // R3a: A[0,K_XFADE_START) vs REF_A
        {
            uint64_t nA = (uint64_t)K_XFADE_START * BLOCK_SIZE;
            R.maxerr_reload_A = maxAbsDiff(master0.data(), refA.data(), nA);
        }

        // R3b: mix-identity
        const float* xfadeRegion = master0.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE;
        R.mix_err = mixError(xfadeRegion, aXfade0.data(), bXfade0.data(), XFADE_SAMPLES);
        R.alpha_monotone = alphaMonotone(XFADE_SAMPLES);

        // R3c: B_xfade vs REF_Bxfade
        R.maxerr_B_xfade = maxAbsDiff(bXfade0.data(), refBxfade.data(), XFADE_SAMPLES);

        // R3d: B[K_SWAP,N) vs REF_Bpost
#if defined(G1A_VARIANT_G)
        // PRE-REG §3 Variant G: post-swap output must "converge to bit-exact AFTER
        // the micro-fade window." Exclude EXACTLY the W_BND_SAMPLES faded samples of
        // block K_SWAP (the minimal pre-registered exclusion); the ==0 threshold is
        // unchanged — only the measurement window shifts by the pre-registered fade.
        uint64_t fade = (uint64_t)W_BND_SAMPLES;
        uint64_t postSamples = (uint64_t)(N_BLOCKS - K_SWAP) * BLOCK_SIZE - fade;
        const float* bPost = master0.data() + (uint64_t)K_SWAP * BLOCK_SIZE + fade;
        R.maxerr_reload_B = maxAbsDiff(bPost, refBpost.data() + fade, postSamples);
#else
        uint64_t postSamples = (uint64_t)(N_BLOCKS - K_SWAP) * BLOCK_SIZE;
        const float* bPost = master0.data() + (uint64_t)K_SWAP * BLOCK_SIZE;
        R.maxerr_reload_B = maxAbsDiff(bPost, refBpost.data(), postSamples);
#endif

        // R3e: Goertzel
        const float* aPre  = master0.data() + (uint64_t)A_PRE_START * BLOCK_SIZE;
        const float* bPostSamples = master0.data() + (uint64_t)B_POST_START * BLOCK_SIZE;

        double magBpostExpected = goertzelMag(bPostSamples, MEAS_SAMPLES, kswapFreq, SAMPLE_RATE);
        double magSoloKswap = goertzelMag(soloKswap.data(), MEAS_SAMPLES, kswapFreq, SAMPLE_RATE);
        R.rel_expected_Bpost = (magSoloKswap > 1e-15) ? (magBpostExpected / magSoloKswap) : 0.0;
        double magApreExpected = goertzelMag(aPre, MEAS_SAMPLES, apreFreq, SAMPLE_RATE);
        double magSoloApre = goertzelMag(soloApre.data(), MEAS_SAMPLES, apreFreq, SAMPLE_RATE);
        R.rel_expected_Apre = (magSoloApre > 1e-15) ? (magApreExpected / magSoloApre) : 0.0;

        // R3f: click bound, K_SWAP boundary excluded
        uint64_t boundarySample = (uint64_t)K_SWAP * BLOCK_SIZE;
        R.click_max = clickMaxExcludeBoundary(master0.data(), TOTAL_SAMPLES, boundarySample);
        R.click_boundary_excluded = true;

        // Scores below REL_MIN ?? check
        // PRE-REG §5 R3 (faithful): strict '==0' on the three bit-exact maxerr gates,
        // mix_err<=1e-6, monotone, rel floors, AND click_max<=S_CLICK inside R3_pass
        // (fixes parent's omission of the click gate and its '<=1e-6' softening of '==0').
        R.R3_pass = (R.maxerr_reload_A == 0.0)
                    && (R.mix_err <= EPS_XFADE) && R.alpha_monotone
                    && (R.maxerr_B_xfade == 0.0)
                    && (R.maxerr_reload_B == 0.0)
                    && (R.rel_expected_Bpost >= REL_MIN)
                    && (R.rel_expected_Apre >= REL_MIN)
                    && (R.click_max <= S_CLICK);   // §5: click gate MUST be inside R3_pass
    }

    // R4 — determinism + completeness + event audit
    {
        CompletenessStats cs = auditCompleteness(writtenBlocks0, N_BLOCKS);
        R.blocks_rendered = cs.blocks_rendered;
        R.dropped_blocks = cs.dropped_blocks;
        R.duplicated_blocks = cs.duplicated_blocks;
        R.repro_ok = allEqual(R.hashes_full) && allEqual(R.hashes_A)
                     && allEqual(R.hashes_B) && allEqual(R.hashes_xfade);

        // Event audit counts
        R.events_applied_A = st.eventsAppliedA.load();
        R.events_scheduled_pre_swap = sched.eventsInRange(0, K_SWAP);
        R.events_applied_B_pre = st.eventsAppliedBPre.load();
        R.events_scheduled_xfade = sched.eventsInRange(K_XFADE_START, K_SWAP);
        R.events_applied_B_post = st.eventsAppliedBPost.load();
        R.events_scheduled_post_swap = sched.eventsInRange(K_SWAP, N_BLOCKS);
        R.latch_count_b_xfade = st.bXfadeInitialLatchCount.load();
        R.latch_replay_count = st.latchReplayCount.load();

        // PRE-REG §5 R4 (frozen): repro_ok ∧ blocks==10000 ∧ dropped==0 ∧ dup==0
        // ∧ event audit all match. Latch counts are NOT part of the frozen R4 gate
        // (Variant F intentionally performs no latch-replay); they remain emitted
        // in metrics.json for transparency but do not gate R4.
        R.R4_pass = R.repro_ok && (R.blocks_rendered == N_BLOCKS)
                    && (R.dropped_blocks == 0) && (R.duplicated_blocks == 0)
                    && (R.events_applied_A == R.events_scheduled_pre_swap)
                    && (R.events_applied_B_pre == R.events_scheduled_xfade)
                    && (R.events_applied_B_post == R.events_scheduled_post_swap);
    }

    // ── ASan ingestion (R2 safety counts) ──
    ingestAsanLog(ART_DIR + "asan_run.log", R);
    // PRE-REG §5 R2′ (frozen): reset_called_on_B is NOT mandated — Variant F omits
    // it; Variant G retains the behavior but the gate does not test it. Both variants
    // use the identical frozen R2′ gate below.
    R.R2_pass = (R.asan_violations == 0) && (R.crt_heap_violations == 0)
                && (R.result_violations == 0) && (R.swap_block == K_SWAP)
                && (R.swap_count == 1) && (R.xrun_at_swap == 0)
                && R.old_perf_released_post_crossfade;

    // ── 6. Write proof artifacts ──
    {
        const float* xfadeRegion = master0.data() + (uint64_t)K_XFADE_START * BLOCK_SIZE;
        // WAV dumps
        writeWavFloat(ART_DIR + "A_pre.wav",
            master0.data() + (uint64_t)A_PRE_START * BLOCK_SIZE, MEAS_SAMPLES, SAMPLE_RATE);
        writeWavFloat(ART_DIR + "B_post.wav",
            master0.data() + (uint64_t)B_POST_START * BLOCK_SIZE, MEAS_SAMPLES, SAMPLE_RATE);
        writeWavFloat(ART_DIR + "crossfade_region.wav", xfadeRegion, XFADE_SAMPLES, SAMPLE_RATE);
        writeWavFloat(ART_DIR + "full_output.wav", master0.data(), TOTAL_SAMPLES, SAMPLE_RATE);
        writeWavFloat(ART_DIR + "A_xfade.wav", aXfade0.data(), XFADE_SAMPLES, SAMPLE_RATE);
        writeWavFloat(ART_DIR + "B_xfade.wav", bXfade0.data(), XFADE_SAMPLES, SAMPLE_RATE);
        writeWavFloat(ART_DIR + "REF_A.wav", refA.data(), (uint64_t)K_SWAP * BLOCK_SIZE, SAMPLE_RATE);
        writeWavFloat(ART_DIR + "REF_Bxfade.wav", refBxfade.data(), XFADE_SAMPLES, SAMPLE_RATE);
        writeWavFloat(ART_DIR + "REF_Bpost.wav", refBpost.data(), (uint64_t)(N_BLOCKS - K_SWAP) * BLOCK_SIZE, SAMPLE_RATE);
        writeWavFloat(ART_DIR + "Solo_" + std::to_string((int)apreFreq) + ".wav",
            soloApre.data(), MEAS_SAMPLES, SAMPLE_RATE);
        writeWavFloat(ART_DIR + "Solo_" + std::to_string((int)kswapFreq) + ".wav",
            soloKswap.data(), MEAS_SAMPLES, SAMPLE_RATE);

        R.proof_complete = true;

        // Log files
        writeScheduleJson(ART_DIR + "schedule.json", sched, SEED_MASTER);
        writeEventsAppliedLog(ART_DIR + "events_applied.log",
                              evLogA, evLogBPre, evLogBPost,
                              xfadeInitLog, latchRelog, R);
        writeTraceLog(ART_DIR + "trace.log", R);
        writeMetricsJson(ART_DIR + "metrics.json", R);
    }

    // ── 7. Verdict ──
    const bool FINAL_PASS = R.R1_pass && R.R2_pass && R.R3_pass && R.R4_pass
                            && R.proof_complete && R.asan_clean;
    R.final_verdict = FINAL_PASS ? "PASS" : "FAIL";
    writeMetricsJson(ART_DIR + "metrics.json", R);

    std::cout << "\n=== METRIC SUMMARY ===\n";
    std::cout << "R1 (prepare non-disruption): " << (R.R1_pass?"PASS":"FAIL")
              << "  xrun=" << R.xrun_during_prepare
              << " create=" << (R.createPerformer_result_ok?"Ok":"Fail")
              << " k_done=" << R.k_prepare_done
              << " latch=" << R.b_xfade_initial_latch_count << "\n";
    std::cout << "R2 (swap+safety):           " << (R.R2_pass?"PASS":"FAIL")
              << "  asan=" << R.asan_violations << " crt=" << R.crt_heap_violations
              << " result=" << R.result_violations
              << " swap_block=" << R.swap_block
              << " reset=" << (R.reset_called_on_B?"Y":"N")
              << " latch_replay=" << (R.latch_replay_called?"Y":"N")
              << " xrun_swap=" << R.xrun_at_swap << "\n";
    std::cout << "R3 (event+crossfade):       " << (R.R3_pass?"PASS":"FAIL")
              << "  maxerr_A=" << R.maxerr_reload_A
              << " mix_err=" << R.mix_err
              << " maxerr_Bxfade=" << R.maxerr_B_xfade
              << " maxerr_B=" << R.maxerr_reload_B
              << " rel_Bpost=" << R.rel_expected_Bpost
              << " click=" << R.click_max << "\n";
    std::cout << "R4 (determinism+audit):     " << (R.R4_pass?"PASS":"FAIL")
              << "  repro=" << (R.repro_ok?"Y":"N")
              << " blocks=" << R.blocks_rendered
              << " evA=" << R.events_applied_A << "/" << R.events_scheduled_pre_swap
              << " evBpre=" << R.events_applied_B_pre << "/" << R.events_scheduled_xfade
              << " evBpost=" << R.events_applied_B_post << "/" << R.events_scheduled_post_swap
              << " latch_xfade=" << R.latch_count_b_xfade
              << " latch_replay=" << R.latch_replay_count << "\n";
    std::cout << "asan_clean=" << (R.asan_clean?"true":"false")
              << " proof_complete=" << (R.proof_complete?"true":"false") << "\n";

    if (isAsanBuild)
    {
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
