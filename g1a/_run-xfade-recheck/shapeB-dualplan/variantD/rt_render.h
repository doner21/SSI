// rt_render.h — the single RT thread render loop (HARNESS-SPEC §6).
//
// Three mutually exclusive branches:
//   Branch 1 — Pre-crossfade (k < K_XFADE_START): advance A only, deliver events to A.
//   Branch 2 — Crossfade (K_XFADE_START ≤ k < K_SWAP): advance both A and B,
//              initial-latch B at K_XFADE_START, deliver events to both, host-mix.
//   Branch 3 — Post-swap (k ≥ K_SWAP): swap activeIndex, reset B, latch-replay B,
//              advance B only, deliver events to B.
//
// The RT thread spawns the worker (bg_prepare) at K_PREPARE_START and joins it
// before returning. It NEVER touches the Engine object after createPerformer.
#pragma once
#include "swap.h"
#include "event_schedule.h"
#include <cstdint>
#include <vector>

namespace g1a {

struct EventReplayBuffers
{
    float* master  = nullptr;   // TOTAL_SAMPLES (master output)
    float* aStream = nullptr;   // A_STREAM_SAMPLES (A output for blocks [0, K_SWAP))
    float* bStream = nullptr;   // B_STREAM_SAMPLES (B output for blocks [K_XFADE_START, N))
    // Crossfade per-performer buffers
    float* aXfade  = nullptr;   // XFADE_SAMPLES (A in crossfade window)
    float* bXfade  = nullptr;   // XFADE_SAMPLES (B in crossfade window)

    // Repeat-0 audit
    std::vector<uint32_t>* writtenBlocks = nullptr;
    std::vector<uint64_t>* blockNs       = nullptr;
};

// Runs the full N_BLOCKS render for one repeat. Spawns + joins the worker.
// 'timed' enables real-time pacing + per-block timing (repeat 0).
// sched is the frozen event schedule.
void rtEventReplayRun(EventReplayState& st,
                      const EventReplayBuffers& bufs,
                      const EventSchedule& sched,
                      bool timed);

} // namespace g1a
