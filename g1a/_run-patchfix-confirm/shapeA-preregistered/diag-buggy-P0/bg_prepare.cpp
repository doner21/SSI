// bg_prepare.cpp — synchronous Performer B creation on the worker thread
// (HARNESS-SPEC §4, Performer B).
#include "bg_prepare.h"
#include "host_config.h"
#include "perturb.h"

namespace g1a {

void backgroundPrepareB(EventReplayState& st)
{
    // Worker-thread perturbation stream (threadId = 1). Repeat 0 => disabled.
    PerturbSchedule perturb(st.perturbEnabled, st.seedMaster, st.repeat, /*threadId=*/1);
    uint32_t step = 0;

    bool ok = true;

    // createPerformer(B) from the shared engine — solo access (RT thread
    // never touches the engine). This is the invariant from HARNESS-SPEC §0.
    cmaj::Performer perfB = st.sharedEngine.createPerformer();
    if (!perfB) { st.prepareError = "createPerformer(B) failed"; ok = false; }
    perturb.maybePerturb(step++);

    if (ok)
    {
        auto r = perfB.setBlockSize(BLOCK_SIZE);
        if (r != cmaj::Result::Ok)
        {
            st.resultViolations.fetch_add(1, std::memory_order_relaxed);
            st.prepareError = "setBlockSize(B) != Ok";
            ok = false;
        }
    }

    perturb.maybePerturb(step++);

    if (ok)
    {
        // Publish B's performer. These stores happen-before bReady.store(release),
        // so the RT thread's bReady.load(acquire) observes a fully-initialised B.
        st.performers[1] = std::move(perfB);
        st.kPrepareDone = st.currentBlock.load(std::memory_order_relaxed);
        st.compileOk.store(true, std::memory_order_relaxed);
        st.bReady.store(true, std::memory_order_release);   // <-- publication fence
    }
    else
    {
        st.kPrepareDone = st.currentBlock.load(std::memory_order_relaxed);
        st.compileOk.store(false, std::memory_order_relaxed);
        // Do NOT publish bReady on failure: the RT thread will fail at K_XFADE_START.
    }
}

} // namespace g1a
