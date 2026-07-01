// reference.h — single-threaded reference (oracle) renders (HARNESS-SPEC §5 step 3).
//
// Reference renders: single-threaded, no swap, no crossfade, separate performers.
//   REF_A:       single performer, phase 0, event model from schedule [0, K_SWAP)
//   REF_Bxfade:  single performer, phase 0 at K_XFADE_START, initial-latched
//                to stateAt(K_XFADE_START) before first advance.
//   REF_Bpost:   single performer, phase 0 at block 0, advanced through schedule
//                to K_SWAP, then reset() -> latch-replay -> continue.
//   Solo refs:   pure constant-frequency renders for Goertzel normalization.
#pragma once

#include "engine_setup.h"
#include "event_schedule.h"
#include <cstdint>
#include <vector>

namespace g1a {

// Render REF_A: events from schedule [0, K_SWAP), advance A.
// Returns K_SWAP * BLOCK_SIZE samples.
std::vector<float> renderRefA(EngineCtx& ctx, const EventSchedule& sched);

// Render REF_Bxfade: start at K_XFADE_START, initial-latched to stateAt(K_XFADE_START).
// Returns W_XFADE * BLOCK_SIZE samples.
std::vector<float> renderRefBxfade(EngineCtx& ctx, const EventSchedule& sched);

// Render REF_Bpost: advance from 0 to K_SWAP, then reset() + latch-replay + continue.
// Returns (N_BLOCKS - K_SWAP) * BLOCK_SIZE samples.
std::vector<float> renderRefBpost(EngineCtx& ctx, const EventSchedule& sched);

// Solo presence refs: P_MEAS blocks of constant frequency f Hz.
std::vector<float> renderSolo(EngineCtx& ctx, double freq);

} // namespace g1a
