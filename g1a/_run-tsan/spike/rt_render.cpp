// rt_render.cpp — the single RT thread render loop + worker dispatch + swap.
//
// PORT NOTE (Windows->Linux, PRE-REG §4.4 / §7.1 port table):
//   - QueryPerformanceCounter/QueryPerformanceFrequency -> clock_gettime(CLOCK_MONOTONIC).
//   - windows.h removed.
//   - The render/swap/crossfade logic is otherwise STRUCTURALLY IDENTICAL to
//     _run-reload/spike/rt_render.cpp (same call sequence, same memory ordering).
//   - Timing is INFORMATIVE ONLY under TSan (2-5x slowdown; not gated — §11).
//
// -DTSAN_RT_PROBE (T3b, PRE-REG §5.3): plants an UNSYNCHRONIZED sentinel counter
//   written by the RT thread inside the block loop and read by a side thread with
//   NO synchronisation — a deliberate data race ON THE RT RENDER PATH. The write
//   carries a std::atomic_signal_fence(seq_cst) compiler fence so TSan observes it
//   as a real memory access (TSAN-REALITY-MEMO §2.2: a register-promoted spin
//   without a fence is invisible to TSan). This proves TSan instruments the RT
//   render loop (the report names a frame inside this file). The macro is NOT
//   defined for the cert binary (g1a_tsan_host) — that binary has NO planted race.
#include "rt_render.h"
#include "bg_compiler.h"
#include "crossfade.h"
#include "host_config.h"
#include "perturb.h"

#include <chrono>
#include <thread>
#include <ctime>
#include <atomic>

namespace g1a {

namespace {

// High-resolution per-block compute timer (clock_gettime, PRE-REG §7.1 port).
struct MonotonicTimer
{
    long long now() const
    {
        struct timespec ts;
        clock_gettime(CLOCK_MONOTONIC, &ts);
        return (long long)ts.tv_sec * 1000000000ll + (long long)ts.tv_nsec;
    }
    uint64_t toNs(long long deltaNs) const
    {
        return (uint64_t)(deltaNs < 0 ? 0 : deltaNs);
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

#ifdef TSAN_RT_PROBE
// T3b planted race: a NON-ATOMIC sentinel touched by the RT thread (writer) and a
// side thread (reader) with NO synchronisation. File-scope so the optimiser cannot
// prove it private. It is declared `volatile` so BOTH the store and the load are
// emitted as real memory accesses that survive -O1 (TSAN-REALITY-MEMO §2.2: a
// register-promoted/dead access is invisible to TSan; the spec's
// `std::atomic_signal_fence(seq_cst)` compiler fence alone does NOT prevent
// dead-store / dead-load elimination at -O1 — `volatile` is the spec-sanctioned
// "or equivalent" that forces the access to be observable). `volatile` is NOT
// atomic, so TSan STILL reports the race — exactly what T3b requires. The seq_cst
// compiler fence is retained per the spec. `g_rtProbeSink` consumes the reader's
// accumulator so the read cannot be proven dead. Probe-only; the cert binary
// (no -DTSAN_RT_PROBE) contains NONE of this.
static volatile long g_rtProbeSentinel = 0;  // unsynchronized shared mutable state (BY DESIGN, probe only)
static std::atomic<bool> g_rtProbeStop{false};
static std::atomic<long> g_rtProbeSink{0};   // observable sink so the read is not dead

static void rtProbeReader()
{
    long acc = 0;
    while (!g_rtProbeStop.load(std::memory_order_acquire))
    {
        // Unsynchronized READ of the RT-written sentinel -> the racing access.
        acc += g_rtProbeSentinel;                            // <-- race partner (volatile: real load)
        std::atomic_signal_fence(std::memory_order_seq_cst);
        std::this_thread::yield();
    }
    g_rtProbeSink.store(acc, std::memory_order_relaxed);     // consume acc (read not dead)
}
#endif

} // anonymous namespace

void rtRenderRun(ReloadState& st,
                 const RenderBuffers& bufs,
                 const char* sineBSource,
                 int32_t sessionIdB,
                 bool timed,
                 uint32_t maxBlocksOverride)
{
    MonotonicTimer mono;

    // RT-thread perturbation stream (threadId = 0). Repeat 0 => disabled.
    PerturbSchedule perturb(st.perturbEnabled, st.seedMaster, st.repeat, /*threadId=*/0);

    std::thread worker;   // spawned at K_COMPILE_START, joined at the end

#ifdef TSAN_RT_PROBE
    // Spawn the side reader BEFORE the loop so it races the RT sentinel writes.
    g_rtProbeStop.store(false, std::memory_order_release);
    std::thread probeReader(rtProbeReader);
#endif

    float tmpA[BLOCK_SIZE];
    float tmpB[BLOCK_SIZE];

    const auto t0 = std::chrono::steady_clock::now();

    uint32_t loopBlocks = N_BLOCKS;
    if (maxBlocksOverride != 0 && maxBlocksOverride < loopBlocks)
        loopBlocks = maxBlocksOverride;

    for (uint32_t k = 0; k < loopBlocks; ++k)
    {
        st.currentBlock.store(k, std::memory_order_relaxed);

#ifdef TSAN_RT_PROBE
        // Planted UNSYNCHRONIZED write on the RT render path (the racing access).
        // Compiler fence so TSan sees it (TSAN-REALITY-MEMO §2.2).
        g_rtProbeSentinel = (long)k;                         // <-- race partner (rt_render.cpp)
        std::atomic_signal_fence(std::memory_order_seq_cst);
#endif

        // Dispatch the worker (background compile of B) at K_COMPILE_START.
        if (k == K_COMPILE_START)
            worker = std::thread(backgroundCompileB, std::ref(st), sineBSource, sessionIdB);

        const long long tStart = mono.now();

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

        const long long tEnd = mono.now();
        const uint64_t tk_ns = mono.toNs(tEnd - tStart);
        if (bufs.blockNs) bufs.blockNs->push_back(tk_ns);
        if (bufs.writtenBlocks) bufs.writtenBlocks->push_back(k);

        // RT-thread interleaving perturbation, concentrated around the swap
        // window [K_SWAP-2, K_SWAP+2] (repeats 1..4; changes interleaving only).
        if (st.perturbEnabled && k + 2 >= K_SWAP && k <= K_SWAP + 2)
            perturb.maybePerturb(k);

        // Real-time pacing UNTIL B is ready: keeps the worker's background compile
        // genuinely overlapping live RT advances. After bReady, render flat-out.
        // (Informative only under TSan; not gated — PRE-REG §11.)
        if (!st.bReady.load(std::memory_order_acquire))
        {
            const auto deadline = t0 + std::chrono::nanoseconds((uint64_t)(k + 1) * D_BLOCK_NS);
            std::this_thread::sleep_until(deadline);
        }
        (void)timed;
    }

    if (worker.joinable())
        worker.join();

#ifdef TSAN_RT_PROBE
    g_rtProbeStop.store(true, std::memory_order_release);
    if (probeReader.joinable())
        probeReader.join();
#endif
}

} // namespace g1a
