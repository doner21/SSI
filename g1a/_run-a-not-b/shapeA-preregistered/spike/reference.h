// reference.h — single-threaded reference (oracle) renders (PRE-REG §5).
//
// A-side refs use engineA (FreqSine, `freq`); B-side refs use engineB (FM2op,
// `carrierHz`/`modIndex`/`ratio`) with the IDENTICAL PARAM-CARRY mapping used in
// the live path (A.freq -> B.carrierHz; modIndex/ratio = declared defaults 1.0):
//   REF_A:       A, phase 0, events from schedule [0, K_SWAP).
//   REF_Bpost:   B, Variant-F: initial-latch at K_XFADE_START, carry-across
//                carrierHz through K_SWAP, then no-reset continuation to N.
//                Bit-exact target for the live post-swap B (maxerr_reload_B==0).
//   REF_Bxfade:  B, warm-up-normalized, initial-latched to stateAt(K_XFADE_START);
//                envelope/presence ONLY (NOT a bit-exact A<->B compare; retired).
//   renderSolo_B: constant-carrierHz B render (defaults), P_MEAS blocks, for the
//                B-solo click sanity gate + Goertzel presence normalization.
//   Solo A refs: pure constant-frequency FreqSine renders for A-side Goertzel.
#pragma once

#include "engine_setup.h"
#include "event_schedule.h"
#include <cstdint>
#include <vector>

namespace g1a {

// Render REF_A: events from schedule [0, K_SWAP), advance A (engineA).
// Returns K_SWAP * BLOCK_SIZE samples.
std::vector<float> renderRefA(EngineCtx& ctx, const EventSchedule& sched);

// Render REF_Bxfade (engineB): warm-up-normalized, initial-latched to
// stateAt(K_XFADE_START) on carrierHz (defaults on modIndex/ratio).
// Returns W_XFADE * BLOCK_SIZE samples. Envelope/presence only.
std::vector<float> renderRefBxfade(EngineCtxB& ctxB, const EventSchedule& sched);

// Render REF_Bpost (engineB): Variant-F carry-across continuation across K_SWAP.
// Returns (N_BLOCKS - K_SWAP) * BLOCK_SIZE samples. Bit-exact B-vs-B target.
std::vector<float> renderRefBpost(EngineCtxB& ctxB, const EventSchedule& sched);

// Solo A presence refs: P_MEAS blocks of constant frequency f Hz (engineA).
std::vector<float> renderSolo(EngineCtx& ctx, double freq);

// renderSolo_B: P_MEAS blocks of constant carrierHz (engineB, defaults on
// modIndex/ratio). Used for B-solo click sanity + B-fundamental Goertzel norm.
std::vector<float> renderSoloB(EngineCtxB& ctxB, double carrierHz);

} // namespace g1a
