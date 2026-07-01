// rt_render.h — the single RT thread render loop (RELOAD-GROUNDING §5).
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
// 'timed' enables real-time pacing measurement + per-block timing capture
// (repeat 0). sineBSource/sessionIdB are forwarded to the worker.
void rtRenderRun(ReloadState& st,
                 const RenderBuffers& bufs,
                 const char* sineBSource,
                 int32_t sessionIdB,
                 bool timed);

} // namespace g1a
