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

// ── REF_Bxfade: warm-up, then reset, latch, then W_XFADE blocks ──
// Fresh performer, phase 0. Warm-up W_WARM blocks (output discarded),
// then reset(), then initial-latched to stateAt(K_XFADE_START), then W_XFADE blocks.
std::vector<float> renderRefBxfade(EngineCtx& ctx, const EventSchedule& sched)
{
    std::vector<float> out(XFADE_SAMPLES, 0.0f);

    cmaj::Performer perf = ctx.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

    // Warm-up: advance W_WARM blocks, discard output
    float junk[BLOCK_SIZE];
    for (uint32_t w = 0; w < W_WARM; ++w)
    {
        perf.advance();
        perf.copyOutputFrames(ctx.outHandle, junk, BLOCK_SIZE);
    }

    // Reset to phase-0, then initial-latch
    perf.reset();
    perf.setInputValue(ctx.freqHandle, (float)sched.stateAt(K_XFADE_START), 0);

    // Advance eventIdx past all events with block < K_XFADE_START
    uint32_t nextEventIdx = 0;
    while (nextEventIdx < sched.events.size() && sched.events[nextEventIdx].block < K_XFADE_START)
        ++nextEventIdx;

    for (uint64_t i = 0; i < W_XFADE; ++i)
    {
        uint32_t k = K_XFADE_START + (uint32_t)i;
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx);
        perf.advance();
        perf.copyOutputFrames(ctx.outHandle, out.data() + i * BLOCK_SIZE, BLOCK_SIZE);
    }

    return out;
}

// ── REF_Bpost: oracle for the post-swap reference ──
// Variant F: fresh → warm W_WARM → reset → latch(K_XFADE_START) → advance
//            W_XFADE blocks (in-window events) → continue without reset
//            delivering post-swap events to N; capture from K_SWAP.
// Variant G: fresh → warm → reset → latch(K_XFADE_START) → W_XFADE blocks
//            → at K_SWAP reset() + latch(K_SWAP) → advance to N;
//            capture from K_SWAP (pure NEW).
std::vector<float> renderRefBpost(EngineCtx& ctx, const EventSchedule& sched)
{
    uint64_t postSamples = (uint64_t)(N_BLOCKS - K_SWAP) * BLOCK_SIZE;
    std::vector<float> out(postSamples, 0.0f);

    cmaj::Performer perf = ctx.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

    float junk[BLOCK_SIZE];

    // Phase 0 → advance to K_XFADE_START delivering events [0, K_XFADE_START)
    uint32_t nextEventIdx = 0;
    for (uint32_t k = 0; k < K_XFADE_START; ++k)
    {
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx);
        perf.advance();
        perf.copyOutputFrames(ctx.outHandle, junk, BLOCK_SIZE);
    }

    // Warm-up: advance W_WARM blocks (output discarded)
    for (uint32_t w = 0; w < W_WARM; ++w)
    {
        perf.advance();
        perf.copyOutputFrames(ctx.outHandle, junk, BLOCK_SIZE);
    }

    // Reset + latch at K_XFADE_START
    perf.reset();
    perf.setInputValue(ctx.freqHandle, (float)sched.stateAt(K_XFADE_START), 0);

    // Advance eventIdx past events before K_XFADE_START (oracle-cursor fix)
    while (nextEventIdx < sched.events.size() && sched.events[nextEventIdx].block < K_XFADE_START)
        ++nextEventIdx;

    // Advance W_XFADE blocks delivering in-window events
    for (uint32_t k = K_XFADE_START; k < K_SWAP; ++k)
    {
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx);
        perf.advance();
        perf.copyOutputFrames(ctx.outHandle, junk, BLOCK_SIZE);
    }

#if defined(G1A_VARIANT_F)
    // Variant F: continue without reset, delivering post-swap events
    for (uint32_t k = K_SWAP; k < N_BLOCKS; ++k)
    {
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx);
        perf.advance();
        uint64_t outIdx = (uint64_t)(k - K_SWAP) * BLOCK_SIZE;
        perf.copyOutputFrames(ctx.outHandle, out.data() + outIdx, BLOCK_SIZE);
    }

#elif defined(G1A_VARIANT_G)
    // Variant G: reset + latch-replay at K_SWAP
    perf.reset();
    perf.setInputValue(ctx.freqHandle, (float)sched.stateAt(K_SWAP), 0);

    for (uint32_t k = K_SWAP; k < N_BLOCKS; ++k)
    {
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx);
        perf.advance();
        uint64_t outIdx = (uint64_t)(k - K_SWAP) * BLOCK_SIZE;
        perf.copyOutputFrames(ctx.outHandle, out.data() + outIdx, BLOCK_SIZE);
    }

#else
    // Base: advance K_XFADE_START→K_SWAP (no capture), then reset+latch-replay at K_SWAP
    for (uint32_t k = K_XFADE_START; k < K_SWAP; ++k)
    {
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx);
        perf.advance();
        perf.copyOutputFrames(ctx.outHandle, junk, BLOCK_SIZE);
    }

    // reset() + latch-replay at K_SWAP
    perf.reset();
    perf.setInputValue(ctx.freqHandle, (float)sched.stateAt(K_SWAP), 0);

    for (uint32_t k = K_SWAP; k < N_BLOCKS; ++k)
    {
        deliverEventsAtBlock(perf, ctx.freqHandle, sched, k, nextEventIdx);
        perf.advance();
        uint64_t outIdx = (uint64_t)(k - K_SWAP) * BLOCK_SIZE;
        perf.copyOutputFrames(ctx.outHandle, out.data() + outIdx, BLOCK_SIZE);
    }
#endif

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
