// reference.cpp — single-threaded reference (oracle) renders.
#include "reference.h"
#include "host_config.h"

namespace g1a {

// ── Deliver events in [lo, hi) to a performer (setInputValue) ──
static void deliverEventsAtBlock(cmaj::Performer& perf, uint32_t freqHandle,
                                 const EventSchedule& sched, uint32_t k,
                                 uint32_t& nextEventIdx)
{
    while (nextEventIdx < sched.events.size() && sched.events[nextEventIdx].block == k)
    {
        perf.setInputValue(freqHandle, (float)sched.events[nextEventIdx].freq, 0);
        ++nextEventIdx;
    }
}

// ── REF_A: events from schedule [0, K_SWAP), advance A ──
// Fresh performer, phase 0 at block 0.
std::vector<float> renderRefA(EngineCtx& ctx, const EventSchedule& sched)
{
    std::vector<float> out((uint64_t)K_SWAP * BLOCK_SIZE, 0.0f);

    cmaj::Performer perf = ctx.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

    uint32_t nextEventIdx = 0;
    for (uint32_t k = 0; k < K_SWAP; ++k)
    {
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx);
        perf.advance();
        perf.copyOutputFrames(ctx.outHandle, out.data() + (uint64_t)k * BLOCK_SIZE, BLOCK_SIZE);
    }

    return out;
}

// ── REF_Bxfade: start at K_XFADE_START, initial-latched to stateAt(K_XFADE_START) ──
// VARIANT B (PRE-REG §3): align the oracle to the live implementation. The live
// xfade path (rt_render.cpp) calls performers[1].reset() before the initial latch,
// so this oracle must ALSO reset() before its initial latch to model exactly what
// the live path does. This tests whether the reset()-based mechanism is internally
// self-consistent.
std::vector<float> renderRefBxfade(EngineCtx& ctx, const EventSchedule& sched)
{
    std::vector<float> out(XFADE_SAMPLES, 0.0f);

    cmaj::Performer perf = ctx.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

    // VARIANT B: reset() before the initial latch (models live rt_render.cpp path).
    perf.reset();

    // Initial latch (NOT a scheduled event, logged separately)
    perf.setInputValue(ctx.freqHandle, (float)sched.stateAt(K_XFADE_START), 0);

    uint32_t nextEventIdx = 0;
    for (uint64_t i = 0; i < W_XFADE; ++i)
    {
        uint32_t k = K_XFADE_START + (uint32_t)i;
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx);
        perf.advance();
        perf.copyOutputFrames(ctx.outHandle, out.data() + i * BLOCK_SIZE, BLOCK_SIZE);
    }

    return out;
}

// ── REF_Bpost: advance 0→K_SWAP, reset, latch-replay, continue to N ──
std::vector<float> renderRefBpost(EngineCtx& ctx, const EventSchedule& sched)
{
    uint64_t postSamples = (uint64_t)(N_BLOCKS - K_SWAP) * BLOCK_SIZE;
    std::vector<float> out(postSamples, 0.0f);

    cmaj::Performer perf = ctx.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

    // Phase 0 → advance through schedule to K_SWAP
    uint32_t nextEventIdx = 0;
    for (uint32_t k = 0; k < K_SWAP; ++k)
    {
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx);
        perf.advance();
        // Discard output (we only need internal state)
        float junk[BLOCK_SIZE];
        perf.copyOutputFrames(ctx.outHandle, junk, BLOCK_SIZE);
    }

    // reset() + latch-replay
    perf.reset();
    perf.setInputValue(ctx.freqHandle, (float)sched.stateAt(K_SWAP), 0);

    // Advance from K_SWAP to N
    for (uint32_t k = K_SWAP; k < N_BLOCKS; ++k)
    {
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx);
        perf.advance();
        uint64_t outIdx = (uint64_t)(k - K_SWAP) * BLOCK_SIZE;
        perf.copyOutputFrames(ctx.outHandle, out.data() + outIdx, BLOCK_SIZE);
    }

    return out;
}

// ── Solo presence refs: P_MEAS blocks at constant frequency ──
std::vector<float> renderSolo(EngineCtx& ctx, double freq)
{
    std::vector<float> out(MEAS_SAMPLES, 0.0f);

    cmaj::Performer perf = ctx.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

    perf.setInputValue(ctx.freqHandle, (float)freq, 0);

    for (uint32_t k = 0; k < P_MEAS; ++k)
    {
        perf.advance();
        perf.copyOutputFrames(ctx.outHandle, out.data() + (uint64_t)k * BLOCK_SIZE, BLOCK_SIZE);
    }

    return out;
}

} // namespace g1a
