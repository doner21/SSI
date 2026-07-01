// rt_render.cpp — the single RT thread render loop + worker dispatch + swap.
#include "rt_render.h"
#include "bg_compiler.h"
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

// High-resolution per-block compute timer (QueryPerformanceCounter, PRE-REG §5.1).
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

// Helper: advance one performer for one block and copy its 'out' frames.
// Records Result violations into st. Returns false if a call != Ok.
inline bool advanceOne(ReloadState& st, cmaj::Performer& p, uint32_t outHandle,
                       float* dst)
{
    bool ok = true;
    auto r1 = p.advance();
    if (r1 != cmaj::Result::Ok) { st.resultViolations.fetch_add(1, std::memory_order_relaxed); ok = false; }
    auto r2 = p.copyOutputFrames(outHandle, dst, BLOCK_SIZE);
    if (r2 != cmaj::Result::Ok) { st.resultViolations.fetch_add(1, std::memory_order_relaxed); ok = false; }
    return ok;
}

} // anonymous namespace

void rtRenderRun(ReloadState& st,
                 const RenderBuffers& bufs,
                 const char* sineBSource,
                 int32_t sessionIdB,
                 bool timed)
{
    QpcTimer qpc;

    // RT-thread perturbation stream (threadId = 0). Repeat 0 => disabled.
    PerturbSchedule perturb(st.perturbEnabled, st.seedMaster, st.repeat, /*threadId=*/0);

    std::thread worker;   // spawned at K_COMPILE_START, joined at the end

    float tmpA[BLOCK_SIZE];
    float tmpB[BLOCK_SIZE];

    const auto t0 = std::chrono::steady_clock::now();

    for (uint32_t k = 0; k < N_BLOCKS; ++k)
    {
        st.currentBlock.store(k, std::memory_order_relaxed);

        // Dispatch the worker (background compile of B) at K_COMPILE_START.
        if (k == K_COMPILE_START)
            worker = std::thread(backgroundCompileB, std::ref(st), sineBSource, sessionIdB);

        const long long tStart = qpc.now();

        const uint32_t idx = st.activeIndex.load(std::memory_order_acquire);
        if (idx == 1 && !st.rtSawIndexOne.load(std::memory_order_relaxed))
        {
            // First block at which the RT thread observes the swapped index.
            st.rtConfirmedIndexOneBlock = k;
            st.rtSawIndexOne.store(true, std::memory_order_release);
        }

        float* outBlock = bufs.master + (uint64_t)k * BLOCK_SIZE;

        if (k < K_XFADE_START)
        {
            // ── Pure A ──
            advanceOne(st, st.performers[0], st.outHandle_A, outBlock);
            // A-stream capture (blocks [0, K_SWAP)).
            for (uint32_t j = 0; j < BLOCK_SIZE; ++j)
                bufs.aStream[(uint64_t)k * BLOCK_SIZE + j] = outBlock[j];
        }
        else if (k < K_SWAP)
        {
            // ── Live crossfade: advance BOTH performers, host-mix ──
            // Safety: B must be published before the crossfade may begin.
            while (!st.bReady.load(std::memory_order_acquire))
                std::this_thread::yield();

            advanceOne(st, st.performers[0], st.outHandle_A, tmpA);
            advanceOne(st, st.performers[1], st.outHandle_B, tmpB);

            const uint64_t mBase = (uint64_t)(k - K_XFADE_START) * BLOCK_SIZE;
            mixCrossfadeBlock(tmpA, tmpB, outBlock, mBase);

            // Per-performer crossfade capture into the A/B streams.
            for (uint32_t j = 0; j < BLOCK_SIZE; ++j)
            {
                bufs.aStream[(uint64_t)k * BLOCK_SIZE + j] = tmpA[j];
                bufs.bStream[(uint64_t)(k - K_XFADE_START) * BLOCK_SIZE + j] = tmpB[j];
            }
        }
        else
        {
            // k >= K_SWAP — pure B.
            if (k == K_SWAP)
            {
                // ── The atomic swap (RT thread is the sole writer) ──
                st.activeIndex.store(1, std::memory_order_release);
                st.swapBlock = k;
                st.swapCount += 1;
                // Re-read so rtSawIndexOne / rtConfirmedIndexOneBlock are set at K_SWAP.
                const uint32_t idx2 = st.activeIndex.load(std::memory_order_acquire);
                if (idx2 == 1 && !st.rtSawIndexOne.load(std::memory_order_relaxed))
                {
                    st.rtConfirmedIndexOneBlock = k;
                    st.rtSawIndexOne.store(true, std::memory_order_release);
                }
            }
            advanceOne(st, st.performers[1], st.outHandle_B, outBlock);
            for (uint32_t j = 0; j < BLOCK_SIZE; ++j)
                bufs.bStream[(uint64_t)(k - K_XFADE_START) * BLOCK_SIZE + j] = outBlock[j];
        }

        const long long tEnd = qpc.now();
        const uint64_t tk_ns = qpc.toNs(tEnd - tStart);
        if (bufs.blockNs) bufs.blockNs->push_back(tk_ns);
        if (bufs.writtenBlocks) bufs.writtenBlocks->push_back(k);

        // RT-thread interleaving perturbation, concentrated around the swap
        // window [K_SWAP-2, K_SWAP+2] (repeats 1..4; changes interleaving only).
        if (st.perturbEnabled && k + 2 >= K_SWAP && k <= K_SWAP + 2)
            perturb.maybePerturb(k);

        // Real-time pacing UNTIL B is ready: keeps the worker's background compile
        // genuinely overlapping live RT advances (so an xrun from a JIT global
        // lock is observable, and K_COMPILE_DONE lands at a small RT block index
        // < K_XFADE_START). After bReady, render flat-out.
        if (!st.bReady.load(std::memory_order_acquire))
        {
            const auto deadline = t0 + std::chrono::nanoseconds((uint64_t)(k + 1) * D_BLOCK_NS);
            std::this_thread::sleep_until(deadline);
        }
        (void)timed;
    }

    if (worker.joinable())
        worker.join();
}

} // namespace g1a
