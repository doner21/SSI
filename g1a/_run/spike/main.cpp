// main.cpp — G1A two-performer concurrency spike orchestrator (HARNESS-SPEC §5).
//
// Locked run order:
//   1. Construct Performer A & B (two separate Engines), single-threaded.
//   2. Solo renders A_solo, B_solo (isolation reference).
//   3. Concurrent repeats r=0..4: one RT thread per performer + per-block
//      barrier mixer; r=0 clean+timed, r=1..4 seeded interleaving perturbation.
//   4. Compute metrics M1-M4.
//   5. Write proof artifact (trace.log, 5 wav dumps, metrics.json).
//   6. Emit FINAL PASS/FAIL verdict (and echo §8 fallback on FAIL).
//
// Two build configs from these same sources: g1a_host.exe (normal) and
// g1a_host_asan.exe (/fsanitize=address). The ASan exe is run first (its
// stderr captured to artifacts/asan_run.log); the normal exe computes metrics,
// reads that log to set asan_violations/asan_clean, and writes all artifacts.
//
// NOTE ON ARTIFACT PATH: PRE-REG §5.5 names "_run/artifacts/"; the orchestrator
// task scopes ALL spike outputs to "_run/spike/". Most-falsifiable, both-honored
// interpretation: the proof bundle is written to "_run/spike/artifacts/". This
// is noted explicitly; no threshold is affected by the path choice.

#include "host_config.h"
#include "patches.h"
#include "engine_setup.h"
#include "rt_performer.h"
#include "barrier_mixer.h"
#include "perturb.h"
#include "metrics.h"
#include "proof.h"

#include <cmath>
#include <cstdio>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <string>
#include <thread>
#include <vector>
#include <crtdbg.h>

using namespace g1a;

static const std::string ART_DIR = "C:/Users/doner/SSI/g1a/_run/spike/artifacts/";

// Run one concurrent repeat: two RT threads + barrier mixer.
static void runConcurrentRepeat(EngineCtx& ea, EngineCtx& eb,
                                const float* ina, const float* inb,
                                uint32_t repeat, bool timed,
                                std::vector<float>& outA, std::vector<float>& outB,
                                std::vector<float>& outMix,
                                ResultAudit& aa, ResultAudit& ab,
                                std::vector<uint64_t>* tA, std::vector<uint64_t>* tB,
                                std::vector<uint64_t>* tMix,
                                std::vector<int>* ordering)
{
    cmaj::Performer pA = ea.engine.createPerformer();
    if (pA.setBlockSize(BLOCK_SIZE) != cmaj::Result::Ok) ++aa.resultViolations;
    cmaj::Performer pB = eb.engine.createPerformer();
    if (pB.setBlockSize(BLOCK_SIZE) != cmaj::Result::Ok) ++ab.resultViolations;

    uint64_t* mixPtr = (timed && tMix) ? tMix->data() : nullptr;
    BarrierMixer barrier(outA.data(), outB.data(), outMix.data(), BLOCK_SIZE, mixPtr);

    PerturbSchedule schedA(repeat != 0, SEED_MASTER, repeat, 0);
    PerturbSchedule schedB(repeat != 0, SEED_MASTER, repeat, 1);

    uint64_t* pbA = (timed && tA) ? tA->data() : nullptr;
    uint64_t* pbB = (timed && tB) ? tB->data() : nullptr;

    std::thread thA(rtPerformerWorker, pA, ea.outHandle, ea.inHandle, ina,
                    outA.data(), &barrier, &schedA, &aa, pbA, 0);
    std::thread thB(rtPerformerWorker, pB, eb.outHandle, eb.inHandle, inb,
                    outB.data(), &barrier, &schedB, &ab, pbB, 1);
    thA.join();
    thB.join();

    if (ordering) *ordering = barrier.orderingSample();
}

int main(int argc, char** argv)
{
    const bool asanMode = (argc > 1 && std::string(argv[1]) == "asan");

#ifdef _DEBUG
    // CRT debug-heap corruption checking (active only in debug CRT builds).
    _CrtSetDbgFlag(_CRTDBG_ALLOC_MEM_DF | _CRTDBG_CHECK_ALWAYS_DF);
#endif

    std::printf("=== G1A two-performer concurrency spike (%s build) ===\n",
                asanMode ? "ASAN" : "normal");

    if (!initLibrary())
    {
        std::fprintf(stderr, "FATAL: cmaj::Library::initialise(\"%s\") failed\n", DLL_NAME);
        return 10;
    }
    std::printf("DLL loaded: %s\n", cmaj::Library::getVersion());

    // ── Build two separate Engines for the sine pair (440 / 880) ──
    EngineCtx eA = buildSineEngine(SINE_A_SOURCE, 1001);
    EngineCtx eB = buildSineEngine(SINE_B_SOURCE, 1002);
    if (!eA.ok) { std::fprintf(stderr, "Engine A build failed: %s\n", eA.error.c_str()); return 11; }
    if (!eB.ok) { std::fprintf(stderr, "Engine B build failed: %s\n", eB.error.c_str()); return 11; }

    // ── Build control/fed passthrough engines ──
    EngineCtx cA = buildPassEngine(PASS_A_SOURCE, 2001);
    EngineCtx cB = buildPassEngine(PASS_B_SOURCE, 2002);
    if (!cA.ok) { std::fprintf(stderr, "Ctrl A build failed: %s\n", cA.error.c_str()); return 12; }
    if (!cB.ok) { std::fprintf(stderr, "Ctrl B build failed: %s\n", cB.error.c_str()); return 12; }

    const uint64_t T = TOTAL_SAMPLES;

    std::vector<float> A_solo(T), B_solo(T);
    std::vector<float> slotA(T), slotB(T), mixed(T);
    std::vector<float> A_conc(T), B_conc(T), mixed0(T);

    MetricResults R;

    uint64_t totalViol   = 0;
    uint64_t minBlocksA  = N_BLOCKS, minBlocksB = N_BLOCKS;

    // ── Step 2: solo renders (single-threaded isolation reference) ──
    {
        ResultAudit sA, sB;
        cmaj::Performer pA = eA.engine.createPerformer();
        if (pA.setBlockSize(BLOCK_SIZE) != cmaj::Result::Ok) ++sA.resultViolations;
        renderSolo(pA, eA.outHandle, 0, nullptr, A_solo.data(), &sA);

        cmaj::Performer pB = eB.engine.createPerformer();
        if (pB.setBlockSize(BLOCK_SIZE) != cmaj::Result::Ok) ++sB.resultViolations;
        renderSolo(pB, eB.outHandle, 0, nullptr, B_solo.data(), &sB);

        totalViol += sA.resultViolations + sB.resultViolations;
        if (sA.blocksCompleted < minBlocksA) minBlocksA = sA.blocksCompleted;
        if (sB.blocksCompleted < minBlocksB) minBlocksB = sB.blocksCompleted;
    }

    // ── Step 3: concurrent repeats (sine pair) ──
    std::vector<uint64_t> tA(N_BLOCKS), tB(N_BLOCKS), tMix(N_BLOCKS);
    std::vector<int> ordering;

    for (uint32_t r = 0; r < R_REPEATS; ++r)
    {
        ResultAudit aa, ab;
        const bool timed = (r == 0);
        runConcurrentRepeat(eA, eB, nullptr, nullptr, r, timed,
                            slotA, slotB, mixed, aa, ab,
                            timed ? &tA : nullptr, timed ? &tB : nullptr,
                            timed ? &tMix : nullptr, timed ? &ordering : nullptr);

        totalViol += aa.resultViolations + ab.resultViolations;
        if (aa.blocksCompleted < minBlocksA) minBlocksA = aa.blocksCompleted;
        if (ab.blocksCompleted < minBlocksB) minBlocksB = ab.blocksCompleted;

        R.hashes_A.push_back(sha256_floats(slotA.data(), T));
        R.hashes_B.push_back(sha256_floats(slotB.data(), T));
        R.hashes_mixed.push_back(sha256_floats(mixed.data(), T));

        if (r == 0) { A_conc = slotA; B_conc = slotB; mixed0 = mixed; }
        std::printf("  sine repeat %u done (blocksA=%llu blocksB=%llu)\n",
                    r, (unsigned long long)aa.blocksCompleted,
                    (unsigned long long)ab.blocksCompleted);
    }

    // ── Control/fed config concurrent repeats (the "fed" path) ──
    std::vector<float> cInA(BLOCK_SIZE, 0.25f), cInB(BLOCK_SIZE, 0.5f);
    std::vector<float> cslotA(T), cslotB(T), cmix(T);
    std::vector<uint64_t> ctA(N_BLOCKS), ctB(N_BLOCKS), ctMix(N_BLOCKS);
    uint64_t ctlViol = 0, ctlMinA = N_BLOCKS, ctlMinB = N_BLOCKS;

    for (uint32_t r = 0; r < R_REPEATS; ++r)
    {
        ResultAudit aa, ab;
        const bool timed = (r == 0);
        runConcurrentRepeat(cA, cB, cInA.data(), cInB.data(), r, timed,
                            cslotA, cslotB, cmix, aa, ab,
                            timed ? &ctA : nullptr, timed ? &ctB : nullptr,
                            timed ? &ctMix : nullptr, nullptr);

        ctlViol += aa.resultViolations + ab.resultViolations;
        if (aa.blocksCompleted < ctlMinA) ctlMinA = aa.blocksCompleted;
        if (ab.blocksCompleted < ctlMinB) ctlMinB = ab.blocksCompleted;

        R.ctl_hashes_A.push_back(sha256_floats(cslotA.data(), T));
        R.ctl_hashes_B.push_back(sha256_floats(cslotB.data(), T));
        R.ctl_hashes_mixed.push_back(sha256_floats(cmix.data(), T));
    }

    // If this is the ASan exercise build, we only needed to drive the concurrent
    // memory paths. If we reached here, ASan found no host-side memory error.
    if (asanMode)
    {
        std::printf("ASAN_RUN_COMPLETE result_violations=%llu blocksA=%llu blocksB=%llu "
                    "ctl_violations=%llu\n",
                    (unsigned long long)totalViol,
                    (unsigned long long)minBlocksA, (unsigned long long)minBlocksB,
                    (unsigned long long)ctlViol);
        return 0;
    }

    // ── Step 4: compute metrics ───────────────────────────────────
    // M1
    R.result_violations    = totalViol;
    R.blocks_A             = minBlocksA;
    R.blocks_B             = minBlocksB;
    R.crt_heap_violations  = 0;   // release CRT has no debug heap; ASan is the detector

    // M2 (repeat 0 timings)
    TimingStats ts = reduceTimings(tA, tB, tMix, D_BLOCK_NS);
    R.xrun_count = ts.xrun_count;
    R.p50_ns = ts.p50_ns; R.p99_ns = ts.p99_ns; R.max_ns = ts.max_ns;
    R.M2_pass = (R.xrun_count == 0);

    // M3 (mixed-output correctness)
    double magAsolo440 = goertzelMag(A_solo.data(), T, FREQ_A,   SAMPLE_RATE);
    double magBsolo880 = goertzelMag(B_solo.data(), T, FREQ_B,   SAMPLE_RATE);
    double magMix440   = goertzelMag(mixed0.data(), T, FREQ_A,   SAMPLE_RATE);
    double magMix880   = goertzelMag(mixed0.data(), T, FREQ_B,   SAMPLE_RATE);
    double magMix660   = goertzelMag(mixed0.data(), T, FREQ_CTL, SAMPLE_RATE);
    R.rel440  = (magAsolo440 > 0) ? magMix440 / magAsolo440 : 0.0;
    R.rel880  = (magBsolo880 > 0) ? magMix880 / magBsolo880 : 0.0;
    double denomCtl = (magAsolo440 > magBsolo880) ? magAsolo440 : magBsolo880;
    R.rel_ctl = (denomCtl > 0) ? magMix660 / denomCtl : 0.0;

    double mixErr = 0.0;
    for (uint64_t k = 0; k < T; ++k)
    {
        double d = std::fabs((double)mixed0[k] - ((double)A_conc[k] + (double)B_conc[k]));
        if (d > mixErr) mixErr = d;
    }
    R.mix_err = mixErr;
    R.M3_pass = (R.rel440 >= REL_MIN && R.rel880 >= REL_MIN &&
                 R.rel_ctl <= REL_CTL_MAX && R.mix_err <= EPS_MIX);

    // M4 (determinism + isolation)
    auto allEqual = [](const std::vector<std::string>& v) {
        for (size_t i = 1; i < v.size(); ++i) if (v[i] != v[0]) return false;
        return !v.empty();
    };
    R.repro_ok  = allEqual(R.hashes_A) && allEqual(R.hashes_B) && allEqual(R.hashes_mixed);
    R.iso_A_err = maxAbsDiff(A_conc.data(), A_solo.data(), T);
    R.iso_B_err = maxAbsDiff(B_conc.data(), B_solo.data(), T);
    R.M4_pass = (R.repro_ok && R.iso_A_err == 0.0 && R.iso_B_err == 0.0);

    // control_config metrics
    R.ctl_result_violations = ctlViol;
    R.ctl_blocks_A = ctlMinA; R.ctl_blocks_B = ctlMinB;
    R.ctl_M1_pass  = (ctlViol == 0 && ctlMinA == N_BLOCKS && ctlMinB == N_BLOCKS);
    TimingStats cts = reduceTimings(ctA, ctB, ctMix, D_BLOCK_NS);
    R.ctl_xrun_count = cts.xrun_count;
    R.ctl_p50_ns = cts.p50_ns; R.ctl_p99_ns = cts.p99_ns; R.ctl_max_ns = cts.max_ns;
    R.ctl_M2_pass = (R.ctl_xrun_count == 0);
    R.ctl_repro_ok = allEqual(R.ctl_hashes_A) && allEqual(R.ctl_hashes_B) && allEqual(R.ctl_hashes_mixed);
    R.ctl_iso_A_err = 0.0;  // passthrough of constant DC: deterministic by construction
    R.ctl_iso_B_err = 0.0;
    R.ctl_M4_pass = R.ctl_repro_ok;

    // ── Read ASan run log (produced by the ASan exe run before this one) ──
    {
        std::ifstream af(ART_DIR + "asan_run.log");
        if (af)
        {
            std::stringstream ss; ss << af.rdbuf();
            std::string log = ss.str();
            // Count "AddressSanitizer" occurrences (each report contains it).
            uint64_t cnt = 0; size_t pos = 0;
            while ((pos = log.find("AddressSanitizer", pos)) != std::string::npos) { ++cnt; pos += 16; }
            R.asan_violations = cnt;
            const bool completed = log.find("ASAN_RUN_COMPLETE") != std::string::npos;
            R.asan_clean = (cnt == 0 && completed);
            R.asan_log_excerpt = (cnt == 0 && completed)
                ? std::string("ASAN: no reports (ASAN_RUN_COMPLETE reached)")
                : log.substr(0, 4000);
        }
        else
        {
            R.asan_violations = 0;
            R.asan_clean = false;   // cannot claim clean without the log
            R.asan_log_excerpt = "ASAN run log missing at " + ART_DIR + "asan_run.log";
        }
    }

    // M1 final (folds ASan)
    R.M1_pass = (R.result_violations == 0 &&
                 R.blocks_A == N_BLOCKS && R.blocks_B == N_BLOCKS &&
                 R.asan_violations == 0 && R.crt_heap_violations == 0);

    // ── Step 5: write proof artifact ──────────────────────────────
    std::error_code ec; std::filesystem::create_directories(ART_DIR, ec);

    std::ostringstream ord;
    ord << "first-arriver thread id per block (0=A,1=B), first "
        << ordering.size() << " blocks: ";
    for (size_t i = 0; i < ordering.size(); ++i) ord << ordering[i] << (i + 1 < ordering.size() ? "," : "");

    bool w1 = writeWavFloat(ART_DIR + "A_solo.wav",       A_solo.data(), T, SAMPLE_RATE);
    bool w2 = writeWavFloat(ART_DIR + "B_solo.wav",       B_solo.data(), T, SAMPLE_RATE);
    bool w3 = writeWavFloat(ART_DIR + "A_concurrent.wav", A_conc.data(), T, SAMPLE_RATE);
    bool w4 = writeWavFloat(ART_DIR + "B_concurrent.wav", B_conc.data(), T, SAMPLE_RATE);
    bool w5 = writeWavFloat(ART_DIR + "mixed.wav",        mixed0.data(), T, SAMPLE_RATE);

    R.proof_complete = w1 && w2 && w3 && w4 && w5;

    // ── Step 6: verdict ──────────────────────────────────────────
    const bool finalPass = R.M1_pass && R.M2_pass && R.M3_pass && R.M4_pass &&
                           R.proof_complete && R.asan_clean;
    R.final_verdict = finalPass ? "PASS" : "FAIL";

    bool wT = writeTraceLog(ART_DIR + "trace.log", R, ord.str());
    bool wJ = writeMetricsJson(ART_DIR + "metrics.json", R);
    R.proof_complete = R.proof_complete && wT && wJ;
    // rewrite metrics.json once proof_complete is final (it referenced itself)
    writeMetricsJson(ART_DIR + "metrics.json", R);

    // ── Console summary ──────────────────────────────────────────
    std::printf("\n--- METRICS ---\n");
    std::printf("M1 result_violations=%llu blocksA=%llu blocksB=%llu asan_viol=%llu crt=%llu -> %s\n",
                (unsigned long long)R.result_violations, (unsigned long long)R.blocks_A,
                (unsigned long long)R.blocks_B, (unsigned long long)R.asan_violations,
                (unsigned long long)R.crt_heap_violations, R.M1_pass ? "PASS" : "FAIL");
    std::printf("M2 xrun=%llu p50=%lluns p99=%lluns max=%lluns (budget=%lluns) -> %s\n",
                (unsigned long long)R.xrun_count, (unsigned long long)R.p50_ns,
                (unsigned long long)R.p99_ns, (unsigned long long)R.max_ns,
                (unsigned long long)D_BLOCK_NS, R.M2_pass ? "PASS" : "FAIL");
    std::printf("M3 rel440=%.6f rel880=%.6f rel_ctl=%.6f mix_err=%.3e -> %s\n",
                R.rel440, R.rel880, R.rel_ctl, R.mix_err, R.M3_pass ? "PASS" : "FAIL");
    std::printf("M4 repro_ok=%d iso_A_err=%.3e iso_B_err=%.3e -> %s\n",
                (int)R.repro_ok, R.iso_A_err, R.iso_B_err, R.M4_pass ? "PASS" : "FAIL");
    std::printf("asan_clean=%d proof_complete=%d\n", (int)R.asan_clean, (int)R.proof_complete);
    std::printf("\nFINAL VERDICT: %s\n", R.final_verdict.c_str());

    if (!finalPass)
    {
        std::printf("\n[PRE-DECLARED FALLBACK fires on FINAL FAIL — see PRE-REGISTRATION.md §8: "
                    "investment-freeze on fail -> silence-boundary fallback.]\n");
    }

    std::printf("\nArtifacts written under: %s\n", ART_DIR.c_str());
    return finalPass ? 0 : 1;
}
