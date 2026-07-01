// bg_compiler.cpp — synchronous Engine B build on the worker thread, with
// per-build-step seeded perturbation (HARNESS-SPEC §4 Engine B / §7).
#include "bg_compiler.h"
#include "host_config.h"
#include "perturb.h"

namespace g1a {

void backgroundCompileB(ReloadState& st, const char* sineBSource, int32_t sessionIdB)
{
    // Worker-thread perturbation stream (threadId = 1). Repeat 0 => disabled.
    PerturbSchedule perturb(st.perturbEnabled, st.seedMaster, st.repeat, /*threadId=*/1);
    uint32_t step = 0;

    bool ok = true;
    cmaj::Engine engineB = cmaj::Engine::create();
    if (!engineB) { st.compileError = "Engine::create() failed"; ok = false; }
    perturb.maybePerturb(step++);

    cmaj::DiagnosticMessageList messages;
    cmaj::Program programB;
    if (ok && !programB.parse(messages, "internal", sineBSource))
    {
        st.compileError = "parse failed: " + messages.toString();
        ok = false;
    }
    perturb.maybePerturb(step++);

    if (ok)
    {
        engineB.setBuildSettings(cmaj::BuildSettings()
                                     .setFrequency(SAMPLE_RATE)
                                     .setMaxBlockSize(BLOCK_SIZE)
                                     .setSessionID(sessionIdB));
        perturb.maybePerturb(step++);

        messages.clear();
        if (!engineB.load(messages, programB, {}, {}) || messages.hasErrors())
        {
            st.compileError = "load failed: " + messages.toString();
            ok = false;
        }
    }
    perturb.maybePerturb(step++);

    uint32_t outHandleB = 0;
    if (ok)
    {
        // Handle captured AFTER load, BEFORE link; per-engine handle (§7.1).
        outHandleB = engineB.getEndpointHandle("out");
        if (outHandleB == 0) { st.compileError = "invalid out handle (B)"; ok = false; }
    }
    perturb.maybePerturb(step++);

    if (ok)
    {
        messages.clear();
        if (!engineB.link(messages) || messages.hasErrors())
        {
            st.compileError = "link failed: " + messages.toString();
            ok = false;
        }
    }
    perturb.maybePerturb(step++);

    cmaj::Performer perfB;
    if (ok)
    {
        perfB = engineB.createPerformer();
        if (!perfB) { st.compileError = "createPerformer() failed"; ok = false; }
    }
    perturb.maybePerturb(step++);

    if (ok)
    {
        // setBlockSize on B happens-before publication (no concurrent RT access).
        auto r = perfB.setBlockSize(BLOCK_SIZE);
        if (r != cmaj::Result::Ok)
        {
            st.resultViolations.fetch_add(1, std::memory_order_relaxed);
            st.compileError = "setBlockSize(B) != Ok";
            ok = false;
        }
    }

    if (ok)
    {
        // Publish B's resources. These stores happen-before bReady.store(release),
        // so the RT thread's bReady.load(acquire) observes a fully-built B.
        st.engineB = std::move(engineB);
        st.outHandle_B = outHandleB;
        st.performers[1] = std::move(perfB);
        st.kCompileDone = st.currentBlock.load(std::memory_order_relaxed);
        st.compileOk.store(true, std::memory_order_relaxed);
        st.bReady.store(true, std::memory_order_release);   // <-- publication fence
    }
    else
    {
        st.kCompileDone = st.currentBlock.load(std::memory_order_relaxed);
        st.compileOk.store(false, std::memory_order_relaxed);
        // Do NOT publish bReady on failure: the RT thread will detect a missing B
        // at K_XFADE_START and the run FAILS R1 (compile_result != Ok), as intended.
    }
}

} // namespace g1a
