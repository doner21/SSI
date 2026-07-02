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

// ── B carry-across event delivery: deliver A.freq events as B.carrierHz ──
static void deliverCarrierAtBlock(cmaj::Performer& perf, uint32_t carrierHzHandle,
                                  const EventSchedule& sched, uint32_t k,
                                  uint32_t& nextEventIdx)
{
    while (nextEventIdx < sched.events.size() && sched.events[nextEventIdx].block == k)
    {
        perf.setInputValue(carrierHzHandle, (float)sched.events[nextEventIdx].freq, 0);
        ++nextEventIdx;
    }
}

// ── REF_Bxfade (engineB): warm-up-normalized, initial-latched to ──
// stateAt(K_XFADE_START) on carrierHz (defaults on modIndex/ratio), W_XFADE blocks.
// Envelope/presence ONLY (retired as a bit-exact A<->B compare for A ≠ B).
std::vector<float> renderRefBxfade(EngineCtxB& ctxB, const EventSchedule& sched)
{
    std::vector<float> out(XFADE_SAMPLES, 0.0f);

    cmaj::Performer perf = ctxB.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

    // Warm-up-normalize B's OWN phase (W_WARM), then reset, then initial latch —
    // mirrors the live crossfade path so the presence envelope matches.
    float warmScratch[BLOCK_SIZE];
    for (uint32_t w = 0; w < W_WARM; ++w)
    {
        perf.advance();
        perf.copyOutputFrames(ctxB.outHandle, warmScratch, BLOCK_SIZE);
    }
    perf.reset();

    // Initial latch: carrierHz carried, modIndex/ratio declared defaults.
    latchBInitial(perf, ctxB.carrierHzHandle, ctxB.modIndexHandle, ctxB.ratioHandle,
                  sched.stateAt(K_XFADE_START), MOD_INDEX_DEFAULT, RATIO_DEFAULT);

    // Advance cursor past pre-window events so in-window events are delivered.
    uint32_t nextEventIdx = 0;
    while (nextEventIdx < sched.events.size() && sched.events[nextEventIdx].block < K_XFADE_START)
        ++nextEventIdx;

    for (uint64_t i = 0; i < W_XFADE; ++i)
    {
        uint32_t k = K_XFADE_START + (uint32_t)i;
        deliverCarrierAtBlock(perf, ctxB.carrierHzHandle, sched, k, nextEventIdx);
        perf.advance();
        perf.copyOutputFrames(ctxB.outHandle, out.data() + i * BLOCK_SIZE, BLOCK_SIZE);
    }

    return out;
}

// ── REF_Bpost ── post-swap oracle. Variant-specific:
//   Variant F: NO reset()/re-latch at K_SWAP — the B initial-latched at
//              K_XFADE_START simply CONTINUES through the swap (PRE-REG §3 F).
//   Variant G / E: advance 0→K_SWAP, reset(), latch-replay, continue to N.
std::vector<float> renderRefBpost(EngineCtxB& ctxB, const EventSchedule& sched)
{
    uint64_t postSamples = (uint64_t)(N_BLOCKS - K_SWAP) * BLOCK_SIZE;
    std::vector<float> out(postSamples, 0.0f);

    cmaj::Performer perf = ctxB.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

#if defined(G1A_VARIANT_F)
    // Variant F oracle (B's OWN patch): initial normalization latch at
    // K_XFADE_START (carrierHz carried, modIndex/ratio defaults) — matching the
    // live warm-up+reset+latch state — then advance through the crossfade and
    // CONTINUE across K_SWAP with NO reset/re-latch. Bit-exact target over
    // [K_SWAP, N). B compared to itself (maxerr_reload_B==0).
    latchBInitial(perf, ctxB.carrierHzHandle, ctxB.modIndexHandle, ctxB.ratioHandle,
                  sched.stateAt(K_XFADE_START), MOD_INDEX_DEFAULT, RATIO_DEFAULT);

    uint32_t nextEventIdx = 0;
    while (nextEventIdx < sched.events.size() && sched.events[nextEventIdx].block < K_XFADE_START)
        ++nextEventIdx;

    for (uint32_t k = K_XFADE_START; k < N_BLOCKS; ++k)
    {
        deliverCarrierAtBlock(perf, ctxB.carrierHzHandle, sched, k, nextEventIdx);
        perf.advance();
        float blk[BLOCK_SIZE];
        perf.copyOutputFrames(ctxB.outHandle, blk, BLOCK_SIZE);
        if (k >= K_SWAP)
        {
            uint64_t outIdx = (uint64_t)(k - K_SWAP) * BLOCK_SIZE;
            for (uint32_t j = 0; j < BLOCK_SIZE; ++j) out[outIdx + j] = blk[j];
        }
    }
    return out;
#else
    // Variant E/G oracle: advance 0->K_SWAP, reset(), latch-replay (carry-across), continue.
    uint32_t nextEventIdx = 0;
    for (uint32_t k = 0; k < K_SWAP; ++k)
    {
        deliverCarrierAtBlock(perf, ctxB.carrierHzHandle, sched, k, nextEventIdx);
        perf.advance();
        float junk[BLOCK_SIZE];
        perf.copyOutputFrames(ctxB.outHandle, junk, BLOCK_SIZE);
    }

    perf.reset();
    latchBInitial(perf, ctxB.carrierHzHandle, ctxB.modIndexHandle, ctxB.ratioHandle,
                  sched.stateAt(K_SWAP), MOD_INDEX_DEFAULT, RATIO_DEFAULT);

    for (uint32_t k = K_SWAP; k < N_BLOCKS; ++k)
    {
        deliverCarrierAtBlock(perf, ctxB.carrierHzHandle, sched, k, nextEventIdx);
        perf.advance();
        uint64_t outIdx = (uint64_t)(k - K_SWAP) * BLOCK_SIZE;
        perf.copyOutputFrames(ctxB.outHandle, out.data() + outIdx, BLOCK_SIZE);
    }

    return out;
#endif
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

// ── renderSolo_B: constant carrierHz FM2op (defaults on modIndex/ratio) ──
std::vector<float> renderSoloB(EngineCtxB& ctxB, double carrierHz)
{
    std::vector<float> out(MEAS_SAMPLES, 0.0f);

    cmaj::Performer perf = ctxB.engine.createPerformer();
    if (!perf) return out;
    perf.setBlockSize(BLOCK_SIZE);

    latchBInitial(perf, ctxB.carrierHzHandle, ctxB.modIndexHandle, ctxB.ratioHandle,
                  carrierHz, MOD_INDEX_DEFAULT, RATIO_DEFAULT);

    for (uint32_t k = 0; k < P_MEAS; ++k)
    {
        perf.advance();
        perf.copyOutputFrames(ctxB.outHandle, out.data() + (uint64_t)k * BLOCK_SIZE, BLOCK_SIZE);
    }

    return out;
}

} // namespace g1a
