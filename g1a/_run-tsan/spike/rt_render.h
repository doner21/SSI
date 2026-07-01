// rt_render.h — the single RT thread render loop (RELOAD-GROUNDING §5).
//
// PORT NOTE: structurally identical to _run-reload/spike/rt_render.h; timing is
// ported QueryPerformanceCounter -> clock_gettime(CLOCK_MONOTONIC) and is
// INFORMATIVE ONLY under TSan (PRE-REG §4.4, §11). The -DTSAN_RT_PROBE build
// adds a planted unsynchronized sentinel on this render path for the T3b
// RT-thread-coverage witness (PRE-REG §5.3 T3b); the cert build does NOT define
// the macro and therefore contains NO planted race.
//
// Per block k = 0..N_BLOCKS-1:
//   idx = activeIndex.load(acquire);
//   k <  K_XFADE_START          -> advance performers[0] only (pure A).
//   K_XFADE_START <= k < K_SWAP -> advance BOTH, host-mix per-sample alpha.
//   k == K_SWAP                 -> activeIndex.store(1, release) (the swap), pure B.
//   k >  K_SWAP                 -> advance performers[idx] (= [1]) only (pure B).
// The RT thread spawns the worker (background compile of B) at K_COMPILE_START and
// joins it before returning. It NEVER touches Engine objects after createPerformer.
#pragma once
#include "swap.h"
#include <cstdint>
#include <vector>

namespace g1a {

struct RenderBuffers
{
    float* master  = nullptr;   // TOTAL_SAMPLES  (the master output)
    float* aStream = nullptr;   // A_STREAM_SAMPLES (A's output for blocks [0, K_SWAP))
    float* bStream = nullptr;   // B_STREAM_SAMPLES (B's output for blocks [K_XFADE_START, N))
    // Repeat-0 audit (optional; nullptr for repeats 1..4):
    std::vector<uint32_t>* writtenBlocks = nullptr;  // block-index audit (completeness)
    std::vector<uint64_t>* blockNs        = nullptr; // per-block compute time (ns)
};

// Runs the full N_BLOCKS render for one repeat. Spawns + joins the worker.
// 'timed' enables per-block timing capture (repeat 0). sineBSource/sessionIdB are
// forwarded to the worker.
//
// Under -DTSAN_RT_PROBE the loop length is capped to a short probe run and a
// side thread races the planted sentinel (for T3b only); 'maxBlocksOverride',
// when non-zero, additionally caps the loop (used by the probe entry point).
void rtRenderRun(ReloadState& st,
                 const RenderBuffers& bufs,
                 const char* sineBSource,
                 int32_t sessionIdB,
                 bool timed,
                 uint32_t maxBlocksOverride = 0);

} // namespace g1a
