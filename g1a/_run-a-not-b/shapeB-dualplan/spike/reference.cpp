// reference.cpp — single-threaded reference (oracle) renders for FreqSine and FM2op.
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

// ── REF_A: events from schedule [0, K_SWAP), advance A (FreqSine ctx) ──
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

// ── REF_Bxfade: FM2op ctx, start at K_XFADE_START, initial-latch all three B inputs ──
std::vector<float> renderRefBxfade(EngineCtx& fmCtx, const EventSchedule& sched)
{
    std::vector<float> out(XFADE_SAMPLES, 0.0f);

    cmaj::Performer perf = fmCtx.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

    // Initial latch on all three B inputs
    perf.setInputValue(fmCtx.carrierHzHandle, (float)sched.stateAt(K_XFADE_START), 0);
    perf.setInputValue(fmCtx.modIndexHandle, (float)MOD_INDEX, 0);
    perf.setInputValue(fmCtx.ratioHandle, (float)RATIO, 0);

    uint32_t nextEventIdx = 0;
    while (nextEventIdx < sched.events.size() && sched.events[nextEventIdx].block < K_XFADE_START)
        ++nextEventIdx;

    for (uint64_t i = 0; i < W_XFADE; ++i)
    {
        uint32_t k = K_XFADE_START + (uint32_t)i;
        deliverEventsAtBlock(perf, fmCtx.carrierHzHandle, sched, k, nextEventIdx);
        perf.advance();
        perf.copyOutputFrames(fmCtx.outHandle, out.data() + i * BLOCK_SIZE, BLOCK_SIZE);
    }

    return out;
}

// ── REF_Bpost: FM2op ctx, canonical Variant-F oracle ──
// Fresh performer, initial latch at K_XFADE_START (carrierHz=stateAt, modIndex=1.0, ratio=1.0),
// advance [K_XFADE_START, N) delivering freq→carrierHz events,
// NO reset at K_SWAP. Output is [K_SWAP, N) only.
std::vector<float> renderRefBpost(EngineCtx& fmCtx, const EventSchedule& sched)
{
    uint64_t postSamples = (uint64_t)(N_BLOCKS - K_SWAP) * BLOCK_SIZE;
    std::vector<float> out(postSamples, 0.0f);

    cmaj::Performer perf = fmCtx.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

#if defined(G1A_VARIANT_F)
    // Variant F oracle: initial latch at K_XFADE_START on ALL THREE B inputs,
    // advance through the crossfade and CONTINUE across K_SWAP with NO reset/re-latch.
    // Bit-exact target over [K_SWAP, N).
    perf.setInputValue(fmCtx.carrierHzHandle, (float)sched.stateAt(K_XFADE_START), 0);
    perf.setInputValue(fmCtx.modIndexHandle, (float)MOD_INDEX, 0);
    perf.setInputValue(fmCtx.ratioHandle, (float)RATIO, 0);

    uint32_t nextEventIdx = 0;
    while (nextEventIdx < sched.events.size() && sched.events[nextEventIdx].block < K_XFADE_START)
        ++nextEventIdx;

    for (uint32_t k = K_XFADE_START; k < N_BLOCKS; ++k)
    {
        deliverEventsAtBlock(perf, fmCtx.carrierHzHandle, sched, k, nextEventIdx);
        perf.advance();
        float blk[BLOCK_SIZE];
        perf.copyOutputFrames(fmCtx.outHandle, blk, BLOCK_SIZE);
        if (k >= K_SWAP)
        {
            uint64_t outIdx = (uint64_t)(k - K_SWAP) * BLOCK_SIZE;
            for (uint32_t j = 0; j < BLOCK_SIZE; ++j) out[outIdx + j] = blk[j];
        }
    }
    return out;
#else
    // Variant E/G: advance 0→K_SWAP, reset()+latch-replay, continue to N.
    uint32_t nextEventIdx = 0;
    for (uint32_t k = 0; k < K_SWAP; ++k)
    {
        deliverEventsAtBlock(perf, fmCtx.carrierHzHandle, sched, k, nextEventIdx);
        perf.advance();
        float junk[BLOCK_SIZE];
        perf.copyOutputFrames(fmCtx.outHandle, junk, BLOCK_SIZE);
    }
    perf.reset();
    perf.setInputValue(fmCtx.carrierHzHandle, (float)sched.stateAt(K_SWAP), 0);
    perf.setInputValue(fmCtx.modIndexHandle, (float)MOD_INDEX, 0);
    perf.setInputValue(fmCtx.ratioHandle, (float)RATIO, 0);
    for (uint32_t k = K_SWAP; k < N_BLOCKS; ++k)
    {
        deliverEventsAtBlock(perf, fmCtx.carrierHzHandle, sched, k, nextEventIdx);
        perf.advance();
        uint64_t outIdx = (uint64_t)(k - K_SWAP) * BLOCK_SIZE;
        perf.copyOutputFrames(fmCtx.outHandle, out.data() + outIdx, BLOCK_SIZE);
    }
    return out;
#endif
}

// ── Solo presence refs: P_MEAS blocks at constant frequency (FreqSine ctx) ──
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

// ── B-solo ref: P_MEAS blocks at constant carrierHz (FM2op ctx) ──
std::vector<float> renderSoloB(EngineCtx& fmCtx, double carrierHz)
{
    std::vector<float> out(MEAS_SAMPLES, 0.0f);

    cmaj::Performer perf = fmCtx.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

    perf.setInputValue(fmCtx.carrierHzHandle, (float)carrierHz, 0);
    perf.setInputValue(fmCtx.modIndexHandle, (float)MOD_INDEX, 0);
    perf.setInputValue(fmCtx.ratioHandle, (float)RATIO, 0);

    for (uint32_t k = 0; k < P_MEAS; ++k)
    {
        perf.advance();
        perf.copyOutputFrames(fmCtx.outHandle, out.data() + (uint64_t)k * BLOCK_SIZE, BLOCK_SIZE);
    }

    return out;
}

} // namespace g1a
