// p0_main.cpp — G1A PATCH-FIX CONFIRMATION, Variant P0 (PRE-REG PATCHFIX §3/§5).
//
// P0 = "patch-fix isolation, plain no-swap render". Renders the CORRECTED
// FreqSine patch through the single no-swap oracle path (REF_A-equivalent):
//   * one performer, phase 0 at block 0
//   * ALL scheduled events applied at their blocks (setInputValue)
//   * NO swap / reset / latch-replay / crossfade
//   * rendered over the FULL timeline [0, N_BLOCKS) — the most falsifiable window,
//     covering the block-3352 region where the buggy patch produced click=0.247.
//
// Gate (PRE-REG §5, P0): click_max <= 0.05 on this plain render. Also report
// argmax block + median/p95/p99 per-sample slew.
//
// Click metric here uses NO boundary exclusion (there is no swap), which is the
// strictest / most-falsifiable reading of the frozen definition for a plain render.
//
// Generator != certifier: this executor renders + measures; the independent
// verifier re-hashes the frozen spec and recomputes the P0 gate from artifacts.

#include "engine_setup.h"
#include "metrics.h"
#include "proof.h"
#include "patches.h"
#include "host_config.h"
#include "event_schedule.h"

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

#ifdef _WIN32
  #include <crtdbg.h>
#endif

using namespace g1a;

namespace {

const std::string ART_DIR = "artifacts/";

// Deliver all scheduled events whose block == k to the performer.
static void deliverEventsAtBlock(cmaj::Performer& perf, uint32_t freqHandle,
                                 const EventSchedule& sched, uint32_t k,
                                 uint32_t& nextEventIdx, uint64_t& appliedCount)
{
    while (nextEventIdx < sched.events.size() && sched.events[nextEventIdx].block == k)
    {
        perf.setInputValue(freqHandle, (float)sched.events[nextEventIdx].freq, 0);
        ++nextEventIdx;
        ++appliedCount;
    }
}

} // anonymous namespace

int main()
{
#ifdef _WIN32
    _CrtSetDbgFlag(_CRTDBG_ALLOC_MEM_DF | _CRTDBG_CHECK_ALWAYS_DF | _CRTDBG_LEAK_CHECK_DF);
#endif

#ifdef G1A_ASAN
    const bool isAsanBuild = true;
#else
    const bool isAsanBuild = false;
#endif

    std::cout << "=== G1A PATCH-FIX CONFIRM — Variant P0 (plain no-swap render, "
              << (isAsanBuild ? "ASan" : "normal") << " build) ===\n";

    // ── Step 1: Init + Engine (CORRECTED patch) ──
    if (!initLibrary())
    {
        std::cerr << "FATAL: cannot load " << DLL_NAME << "\n";
        return 2;
    }
    std::cout << "DLL loaded, version " << cmaj::Library::getVersion() << "\n";

    EngineCtx ctx = buildFreqSineEngine(FREQ_SINE_SOURCE, /*sessionId=*/0x5A);
    if (!ctx.ok) { std::cerr << "FATAL: Engine build failed: " << ctx.error << "\n"; return 3; }
    std::cout << "Engine (FreqSine, corrected patch) built: freqHandle=" << ctx.freqHandle
              << " outHandle=" << ctx.outHandle << "\n";

    // ── Step 2: Event schedule from SEED_MASTER (same as parents) ──
    EventSchedule sched = generateEventSchedule(SEED_MASTER);
    std::cout << "Event schedule: " << sched.events.size() << " events\n";

    // ── Step 3: Plain no-swap render over the full timeline ──
    std::vector<float> out(TOTAL_SAMPLES, 0.0f);

    cmaj::Performer perf = ctx.engine.createPerformer();
    if (!perf) { std::cerr << "FATAL: createPerformer failed\n"; return 4; }
    if (perf.setBlockSize(BLOCK_SIZE) != cmaj::Result::Ok)
    { std::cerr << "FATAL: setBlockSize failed\n"; return 5; }

    uint32_t nextEventIdx = 0;
    uint64_t appliedCount = 0;
    for (uint32_t k = 0; k < N_BLOCKS; ++k)
    {
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx, appliedCount);
        perf.advance();
        perf.copyOutputFrames(ctx.outHandle, out.data() + (uint64_t)k * BLOCK_SIZE, BLOCK_SIZE);
    }
    std::cout << "Rendered " << N_BLOCKS << " blocks (" << TOTAL_SAMPLES
              << " samples), events applied = " << appliedCount << "\n";

    // ── Step 4: Slew statistics over the full output (no boundary exclusion) ──
    // slew[n] = |x[n] - x[n-1]| for n in [1, TOTAL_SAMPLES).
    const uint64_t nSlew = TOTAL_SAMPLES - 1;
    std::vector<double> slew;
    slew.reserve(nSlew);
    double click_max = 0.0;
    uint64_t argmax_sample = 0;
    for (uint64_t n = 1; n < TOTAL_SAMPLES; ++n)
    {
        double d = std::fabs((double)out[n] - (double)out[n - 1]);
        slew.push_back(d);
        if (d > click_max) { click_max = d; argmax_sample = n; }
    }
    uint32_t argmax_block = (uint32_t)(argmax_sample / BLOCK_SIZE);
    uint32_t argmax_offset = (uint32_t)(argmax_sample % BLOCK_SIZE);

    std::vector<double> sorted = slew;
    std::sort(sorted.begin(), sorted.end());
    auto pct = [&](double p) -> double {
        if (sorted.empty()) return 0.0;
        size_t idx = (size_t)(p * (double)(sorted.size() - 1));
        return sorted[idx];
    };
    double slew_median = pct(0.50);
    double slew_p95    = pct(0.95);
    double slew_p99    = pct(0.99);

    // Determinism cross-check: SHA-256 of the full output.
    std::string outHash = sha256_floats(out.data(), TOTAL_SAMPLES);

    const bool P0_pass = (click_max <= S_CLICK);

    std::cout << std::setprecision(12);
    std::cout << "\n=== P0 METRICS (corrected patch, plain no-swap render) ===\n";
    std::cout << "  click_max          = " << click_max << "  (gate: <= " << S_CLICK << ")\n";
    std::cout << "  argmax block       = " << argmax_block
              << " (sample " << argmax_sample << ", offset " << argmax_offset << ")\n";
    std::cout << "  slew median (p50)  = " << slew_median << "\n";
    std::cout << "  slew p95           = " << slew_p95 << "\n";
    std::cout << "  slew p99           = " << slew_p99 << "\n";
    std::cout << "  events_applied     = " << appliedCount << "\n";
    std::cout << "  output sha256      = " << outHash << "\n";
    std::cout << "  P0 = " << (P0_pass ? "PASS" : "FAIL") << "\n";

    // ── Step 5: Emit artifacts ──
    writeWavFloat(ART_DIR + "P0_full_output.wav", out.data(), TOTAL_SAMPLES, SAMPLE_RATE);
    // Focused WAV around the buggy-patch argmax block (3352) for A/B listening.
    {
        uint64_t lo = (uint64_t)3300 * BLOCK_SIZE;
        uint64_t hi = (uint64_t)3400 * BLOCK_SIZE;
        if (hi <= TOTAL_SAMPLES)
            writeWavFloat(ART_DIR + "P0_region_3300_3400.wav",
                          out.data() + lo, hi - lo, SAMPLE_RATE);
    }

    // trace.log (P0)
    {
        std::ofstream f(ART_DIR + "trace.log");
        f << std::setprecision(17);
        f << "G1A PATCH-FIX CONFIRM — Variant P0 trace.log\n";
        f << "=================================================\n";
        f << "Corrected patch: out <- float(0.25 * sin(phase));  (doubled-twoPi removed)\n";
        f << "Render: single performer, phase 0, ALL scheduled events applied,\n";
        f << "        NO swap/reset/latch/crossfade, full [0," << N_BLOCKS << ") timeline.\n\n";
        f << "Locked params (PRE-REG PATCHFIX §4): fs=" << SAMPLE_RATE
          << ", block=" << BLOCK_SIZE << ", N_blocks=" << N_BLOCKS
          << ", seed_master=0x" << std::hex << SEED_MASTER << std::dec
          << ", AMP=" << AMP << ", S_CLICK=" << S_CLICK
          << ", DLL v" << DLL_VERSION << "\n\n";
        f << "── P0 measurements (full output, NO boundary exclusion) ──\n";
        f << "  click_max      = " << click_max << " (gate: <= " << S_CLICK << ")\n";
        f << "  argmax_block   = " << argmax_block << "\n";
        f << "  argmax_sample  = " << argmax_sample << "\n";
        f << "  argmax_offset  = " << argmax_offset << "\n";
        f << "  slew_median    = " << slew_median << "\n";
        f << "  slew_p95       = " << slew_p95 << "\n";
        f << "  slew_p99       = " << slew_p99 << "\n";
        f << "  events_applied = " << appliedCount << "\n";
        f << "  output_sha256  = " << outHash << "\n";
        f << "  P0 = " << (P0_pass ? "PASS" : "FAIL") << "\n";
    }

    // metrics.json (P0 schema)
    {
        std::ofstream o(ART_DIR + "metrics.json");
        o << std::setprecision(17);
        auto bstr = [](bool v){ return v ? "true" : "false"; };
        o << "{\n";
        o << "  \"variant\": \"P0\",\n";
        o << "  \"description\": \"patch-fix isolation: corrected patch, plain no-swap render, full timeline\",\n";
        o << "  \"run_params\": { \"fs\":48000, \"block\":256, \"n_blocks\":10000, "
             "\"seed_master\":\"0x6121A0003\", \"amp\":0.25, \"s_click\":0.05, "
             "\"w_warm\":" << W_WARM << ", \"dll_version\":\"1.0.3159\", "
             "\"patch\":\"out <- float(0.25 * sin(phase))\" },\n";
        o << "  \"click_max\": " << click_max << ",\n";
        o << "  \"click_boundary_excluded\": false,\n";
        o << "  \"argmax_block\": " << argmax_block << ",\n";
        o << "  \"argmax_sample\": " << argmax_sample << ",\n";
        o << "  \"argmax_offset\": " << argmax_offset << ",\n";
        o << "  \"slew_median\": " << slew_median << ",\n";
        o << "  \"slew_p95\": " << slew_p95 << ",\n";
        o << "  \"slew_p99\": " << slew_p99 << ",\n";
        o << "  \"events_applied\": " << appliedCount << ",\n";
        o << "  \"output_sha256\": \"" << outHash << "\",\n";
        o << "  \"gate\": \"click_max <= 0.05\",\n";
        o << "  \"P0_pass\": " << bstr(P0_pass) << ",\n";
        o << "  \"asan_build\": " << bstr(isAsanBuild) << "\n";
        o << "}\n";
    }

    if (isAsanBuild)
        std::cout << "ASAN_RUN_CLEAN_EXIT (P0 sanitized render completed without a sanitizer report)\n";

    std::cout << "\n=== P0 VERDICT: " << (P0_pass ? "PASS" : "FAIL") << " ===\n";
    return P0_pass ? 0 : 1;
}
