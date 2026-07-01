// crossfade.h — per-sample linear alpha schedule + host-side mix (PRE-REG §4.4).
//
// PORT NOTE: identical to _run-reload/spike/crossfade.h (pure computation).
//
// Over the crossfade window of XFADE_SAMPLES (= W_XFADE*BLOCK_SIZE = 16,384)
// samples, alpha(m) = m / (XFADE_SAMPLES - 1) for m = 0..16383, monotone
// non-decreasing with alpha(0)=0.0 and alpha(last)=1.0. The master output during
// the window is  out[m] = (1 - alpha(m))*A[m] + alpha(m)*B[m].  Per-sample (not
// per-block) interpolation guarantees there is no block-boundary step (click-free
// by construction; T4b/T4c verify it).
//
// NOTE on the "two-party barrier" (HARNESS-SPEC §1/§6): under the LOCKED
// single-RT-thread model (PRE-REG §4.4 — the RT thread advances BOTH performers
// inside [K_XFADE_START, K_SWAP) and host-mixes), BOTH performers are advanced by
// the SAME RT thread, so the optional two-party rendezvous barrier degenerates to
// a no-op and is NOT instantiated. This is the most falsifiable interpretation:
// no second rendering thread can mask a race; the genuine cross-thread
// synchronisation under test is the worker->RT publication (bReady) + the
// activeIndex swap, stressed by the seeded perturbations. No synchronisation
// beyond activeIndex / bReady is introduced (HARNESS-SPEC §11 static-audit honoured).
#pragma once
#include "host_config.h"
#include <cstdint>

namespace g1a {

// alpha(m) for m in [0, XFADE_SAMPLES). Exactly the locked schedule.
inline double alphaAt(uint64_t m)
{
    return static_cast<double>(m) / static_cast<double>(XFADE_SAMPLES - 1);
}

// Mix one crossfade block: a[BLOCK_SIZE], b[BLOCK_SIZE] -> out[BLOCK_SIZE].
// mBase is the global crossfade-sample offset of this block's first sample.
void mixCrossfadeBlock(const float* a, const float* b, float* out, uint64_t mBase);

} // namespace g1a
