// rt_render.cpp — the single RT thread render loop + worker dispatch + event
// delivery + crossfade + swap (HARNESS-SPEC §6 three mutually exclusive branches).
#include "rt_render.h"
#include "bg_prepare.h"
#include "crossfade.h"
#include "host_config.h"
#include "perturb.h"

#include <chrono>
#include <thread>

#ifdef _WIN32
  #ifndef WIN32_LEAN_AND_MEAN
    #define WIN32_LEAN_AND_MEAN
  #endif
  #include <windows.h>
#endif

namespace g1a {

namespace {

// High-resolution per-block timer (QueryPerformanceCounter).
struct QpcTimer
{
    long long freq = 1;
    QpcTimer()
    {
#ifdef _WIN32
        LARGE_INTEGER f; QueryPerformanceFrequency(&f); freq = f.QuadPart;
#endif
    }
    long long now() const
    {
#ifdef _WIN32
        LARGE_INTEGER c; QueryPerformanceCounter(&c); return c.QuadPart;
#else
        return 0;
#endif
    }
    uint64_t toNs(long long ticks) const
    {
        return (uint64_t)((double)ticks * 1e9 / (double)freq);
    }
};

// Advance a performer for one block and copy its output frames.
// Records Result violations. Returns false on != Ok.
inline bool advanceOne(EventReplayState& st, cmaj::Performer& p, uint32_t outHandle,
                       float* dst)
{
    bool ok = true;
    auto r1 = p.advance();
    if (r1 != cmaj::Result::Ok) { st.resultViolations.fetch_add(1, std::memory_order_relaxed); ok = false; }
    auto r2 = p.copyOutputFrames(outHandle, dst, BLOCK_SIZE);
    if (r2 != cmaj::Result::Ok) { st.resultViolations.fetch_add(1, std::memory_order_relaxed); ok = false; }
    return ok;
}

// Deliver a scheduled event to a performer at a given block. Records in log.
inline void deliverEvent(EventReplayState& st, cmaj::Performer& p, uint32_t freqHandle,
                         double freq, uint32_t block,
                         std::vector<std::pair<uint32_t, double>>* log)
{
    auto r = p.setInputValue(freqHandle, (float)freq, 0);
    if (r != cmaj::Result::Ok)
        st.resultViolations.fetch_add(1, std::memory_order_relaxed);
    if (log)
        log->push_back({block, freq});
}

} // anonymous namespace

void rtEventReplayRun(EventReplayState& st,
                      const EventReplayBuffers& bufs,
                      const EventSchedule& sched,
                      bool timed)
{
    QpcTimer qpc;

    // RT-thread perturbation stream (threadId = 0). Repeat 0 => disabled.
    PerturbSchedule perturb(st.perturbEnabled, st.seedMaster, st.repeat, /*threadId=*/0);

    std::thread worker;   // spawned at K_PREPARE_START, joined at the end

    float tmpA[BLOCK_SIZE];
    float tmpB[BLOCK_SIZE];

    // Event schedule cursor
    uint32_t eventIdx = 0;

    const auto t0 = std::chrono::steady_clock::now();

    for (uint32_t k = 0; k < N_BLOCKS; ++k)
    {
        st.currentBlock.store(k, std::memory_order_relaxed);

        // Dispatch the worker at K_PREPARE_START.
        if (k == K_PREPARE_START)
            worker = std::thread(backgroundPrepareB, std::ref(st));

        const long long tStart = qpc.now();

        const uint32_t idx = st.activeIndex.load(std::memory_order_acquire);
        if (idx == 1 && !st.rtSawIndexOne.load(std::memory_order_relaxed))
        {
            st.rtConfirmedIndexOneBlock = k;
            st.rtSawIndexOne.store(true, std::memory_order_release);
        }

        float* outBlock = bufs.master + (uint64_t)k * BLOCK_SIZE;

        // ──────────────────────────────────────────────────────────────
        // Branch 1 — Pre-crossfade: A only (k < K_XFADE_START)
        // ──────────────────────────────────────────────────────────────
        if (k < K_XFADE_START)
        {
            // Deliver scheduled events to A
            while (eventIdx < sched.events.size() && sched.events[eventIdx].block == k)
            {
                deliverEvent(st, st.performers[0], st.freqHandle,
                             sched.events[eventIdx].freq, k,
                             st.eventLogA.empty() ? nullptr : &st.eventLogA);
                st.eventsAppliedA.fetch_add(1, std::memory_order_relaxed);
                ++eventIdx;
            }

            advanceOne(st, st.performers[0], st.outHandle, outBlock);

            // A-stream capture (blocks [0, K_SWAP))
            for (uint32_t j = 0; j < BLOCK_SIZE; ++j)
                bufs.aStream[(uint64_t)k * BLOCK_SIZE + j] = outBlock[j];

            // Also capture A-stream for crossfade window (if we're in the XFADE region)
            // but we're not in crossfade yet, so just the aStream buffer.
        }

        // ──────────────────────────────────────────────────────────────
        // Branch 2 — Crossfade: advance both A and B (K_XFADE_START ≤ k < K_SWAP)
        // ──────────────────────────────────────────────────────────────
        else if (k < K_SWAP)
        {
            // B must be ready before crossfade may begin
            while (!st.bReady.load(std::memory_order_acquire))
                std::this_thread::yield();

            // At k == K_XFADE_START: Variant-E warm-up (advance B by W_WARM blocks
            // into a local scratch buffer with NO events, then reset, then latch).
            // The warm advance output is discarded — never written to any capture
            // buffer or hash input. This normalises B's phase to the crossfade start.
            if (k == K_XFADE_START)
            {
                // Warm-up: advance B W_WARM blocks into scratch
                for (uint32_t w = 0; w < W_WARM; ++w)
                {
                    advanceOne(st, st.performers[1], st.outHandle, tmpB);
                    // Discard tmpB — output never captured
                }

                // Reset B to ensure clean phase-0 state before the initial latch.
                auto rr = st.performers[1].reset();
                if (rr != cmaj::Result::Ok)
                    st.resultViolations.fetch_add(1, std::memory_order_relaxed);

                double initFreq = sched.stateAt(k);
                auto r = st.performers[1].setInputValue(st.freqHandle, (float)initFreq, 0);
                if (r != cmaj::Result::Ok)
                    st.resultViolations.fetch_add(1, std::memory_order_relaxed);
                st.bXfadeInitialLatchCount.fetch_add(1, std::memory_order_relaxed);
                if (!st.xfadeInitialLatchLog.empty())
                    st.xfadeInitialLatchLog.push_back({k, initFreq});
            }

            // Deliver scheduled events to BOTH A and B
            while (eventIdx < sched.events.size() && sched.events[eventIdx].block == k)
            {
                double freq = sched.events[eventIdx].freq;
                // Deliver to A
                deliverEvent(st, st.performers[0], st.freqHandle, freq, k,
                             st.eventLogA.empty() ? nullptr : &st.eventLogA);
                st.eventsAppliedA.fetch_add(1, std::memory_order_relaxed);

                // Deliver to B
                deliverEvent(st, st.performers[1], st.freqHandle, freq, k,
                             st.eventLogBPre.empty() ? nullptr : &st.eventLogBPre);
                st.eventsAppliedBPre.fetch_add(1, std::memory_order_relaxed);

                ++eventIdx;
            }

            advanceOne(st, st.performers[0], st.outHandle, tmpA);
            advanceOne(st, st.performers[1], st.outHandle, tmpB);

            // Per-performer crossfade capture into A/B xfade buffers
            uint64_t xfadeOffset = (uint64_t)(k - K_XFADE_START) * BLOCK_SIZE;
            for (uint32_t j = 0; j < BLOCK_SIZE; ++j)
            {
                bufs.aXfade[xfadeOffset + j] = tmpA[j];
                bufs.bXfade[xfadeOffset + j] = tmpB[j];
                bufs.aStream[(uint64_t)k * BLOCK_SIZE + j] = tmpA[j];
                bufs.bStream[xfadeOffset + j] = tmpB[j];
            }

            // Host crossfade mix
            mixCrossfadeBlock(tmpA, tmpB, outBlock, xfadeOffset);
        }

        // ──────────────────────────────────────────────────────────────
        // Branch 3 — Post-swap: B only (k ≥ K_SWAP)
        // Variant F: no-reset continuation (warmed B keeps running).
        // Variant G: one-block equal-power micro-fade bridge.
        // ──────────────────────────────────────────────────────────────
        else
        {
            if (k == K_SWAP)
            {
                // Step 1: atomic index swap (RT thread is sole writer)
                st.activeIndex.store(1, std::memory_order_release);
                st.swapBlock = k;
                st.swapCount += 1;

                // Ensure rtSawIndexOne is set at K_SWAP
                const uint32_t idx2 = st.activeIndex.load(std::memory_order_acquire);
                if (idx2 == 1 && !st.rtSawIndexOne.load(std::memory_order_relaxed))
                {
                    st.rtConfirmedIndexOneBlock = k;
                    st.rtSawIndexOne.store(true, std::memory_order_release);
                }

#if defined(G1A_VARIANT_F)
                // Variant F — no-reset continuation.
                // The already-warmed, phase-correct B continues without reset()/re-latch.
                // swap_count==1, post-swap A released, ASan-clean, post-swap bit-exact.
                st.resetCalledOnB = false;
                st.latchReplayCalled = false;
                (void)sched; // stateAt() not needed for latch

#elif defined(G1A_VARIANT_G)
                // Variant G — equal-power boundary micro-fade (one-block bridge).
                // W_BND_SAMPLES == BLOCK_SIZE == 256, so we realise exactly one block.
                // (a) Advance the un-reset B once → capture oldBlk[256]
                float oldBlk[BLOCK_SIZE];
                advanceOne(st, st.performers[1], st.outHandle, oldBlk);

                // (b) Reset + Latch B to stateAt(K_SWAP)
                {
                    auto rReset = st.performers[1].reset();
                    if (rReset != cmaj::Result::Ok)
                        st.resultViolations.fetch_add(1, std::memory_order_relaxed);
                    st.resetCalledOnB = true;

                    double replayFreq = sched.stateAt(k);
                    auto rLatch = st.performers[1].setInputValue(st.freqHandle, (float)replayFreq, 0);
                    if (rLatch != cmaj::Result::Ok)
                        st.resultViolations.fetch_add(1, std::memory_order_relaxed);
                    st.latchReplayCalled = true;
                    st.latchReplayCount.fetch_add(1, std::memory_order_relaxed);
                    if (!st.latchReplayLog.empty())
                        st.latchReplayLog.push_back({k, replayFreq});
                }

                // (c) Deliver K_SWAP post-swap events, advance → newBlk[256]
                float newBlk[BLOCK_SIZE];
                while (eventIdx < sched.events.size() && sched.events[eventIdx].block == k)
                {
                    deliverEvent(st, st.performers[1], st.freqHandle,
                                 sched.events[eventIdx].freq, k,
                                 st.eventLogBPost.empty() ? nullptr : &st.eventLogBPost);
                    st.eventsAppliedBPost.fetch_add(1, std::memory_order_relaxed);
                    ++eventIdx;
                }
                advanceOne(st, st.performers[1], st.outHandle, newBlk);

                // (d) equalPowerBoundarySample: oldBlk → newBlk over W_BND_SAMPLES
                for (uint32_t j = 0; j < BLOCK_SIZE; ++j)
                    outBlock[j] = equalPowerBoundarySample(oldBlk[j], newBlk[j], j, W_BND_SAMPLES);

                // (e) Store PURE newBlk into bStream (keeps hashes_B faithful)
                for (uint32_t j = 0; j < BLOCK_SIZE; ++j)
                    bufs.bStream[(uint64_t)(k - K_XFADE_START) * BLOCK_SIZE + j] = newBlk[j];

                // Skip the normal per-block delivery+advance+capture for this block
                // (already done above). Fall through to post-block bookkeeping.
                goto post_block_bookkeeping;

#else
                // Base: reset + latch-replay (no variant selected).
                {
                    auto rReset = st.performers[1].reset();
                    if (rReset != cmaj::Result::Ok)
                        st.resultViolations.fetch_add(1, std::memory_order_relaxed);
                    st.resetCalledOnB = true;

                    double replayFreq = sched.stateAt(k);
                    auto rLatch = st.performers[1].setInputValue(st.freqHandle, (float)replayFreq, 0);
                    if (rLatch != cmaj::Result::Ok)
                        st.resultViolations.fetch_add(1, std::memory_order_relaxed);
                    st.latchReplayCalled = true;
                    st.latchReplayCount.fetch_add(1, std::memory_order_relaxed);
                    if (!st.latchReplayLog.empty())
                        st.latchReplayLog.push_back({k, replayFreq});
                }
#endif
            }

            // Deliver scheduled events to B (post-swap)
            while (eventIdx < sched.events.size() && sched.events[eventIdx].block == k)
            {
                deliverEvent(st, st.performers[1], st.freqHandle,
                             sched.events[eventIdx].freq, k,
                             st.eventLogBPost.empty() ? nullptr : &st.eventLogBPost);
                st.eventsAppliedBPost.fetch_add(1, std::memory_order_relaxed);
                ++eventIdx;
            }

            advanceOne(st, st.performers[1], st.outHandle, outBlock);

            // B-stream capture (post-swap region)
            for (uint32_t j = 0; j < BLOCK_SIZE; ++j)
                bufs.bStream[(uint64_t)(k - K_XFADE_START) * BLOCK_SIZE + j] = outBlock[j];
        }

#if defined(G1A_VARIANT_G)
        post_block_bookkeeping:
#endif
        (void)0;

        const long long tEnd = qpc.now();
        const uint64_t tk_ns = qpc.toNs(tEnd - tStart);
        if (bufs.blockNs) bufs.blockNs->push_back(tk_ns);
        if (bufs.writtenBlocks) bufs.writtenBlocks->push_back(k);

        // Record K_SWAP block timing for xrun_at_swap
        if (k == K_SWAP)
            st.xrunAtSwap = tk_ns;

        // RT-thread interleaving perturbation around swap window (repeats 1..4)
        if (st.perturbEnabled && k + 2 >= K_SWAP && k <= K_SWAP + 2)
            perturb.maybePerturb(k);

        // Real-time pacing UNTIL B is ready
        if (!st.bReady.load(std::memory_order_acquire))
        {
            const auto deadline = t0 + std::chrono::nanoseconds((uint64_t)(k + 1) * D_BLOCK_NS);
            std::this_thread::sleep_until(deadline);
        }
    }

    if (worker.joinable())
        worker.join();
}

} // namespace g1a
