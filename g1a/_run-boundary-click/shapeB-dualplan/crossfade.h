// crossfade.h — per-sample linear alpha schedule + host-side mix (HARNESS-SPEC §6).
//
// Over the crossfade window of XFADE_SAMPLES (= W_XFADE*BLOCK_SIZE = 16,384)
// samples, alpha(m) = m / (XFADE_SAMPLES - 1) for m = 0..16383, monotone
// non-decreasing with alpha(0)=0.0 and alpha(last)=1.0. The master output during
// the window is  out[m] = (1 - alpha(m))*A[m] + alpha(m)*B[m]. Per-sample (not
// per-block) interpolation guarantees no block-boundary step.
//
// Under the locked single-RT-thread model, BOTH performers are advanced by the
// SAME RT thread, so a two-party rendezvous barrier is a no-op. The genuine
// cross-thread synchronisation under test is worker->RT publication (bReady) +
// the activeIndex swap.
#pragma once
#include "host_config.h"
#include <cmath>
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

// Equal-power (constant-power) boundary sample: oldv*cos(theta) + newv*sin(theta).
// theta = (pi/2) * (j + 0.5) / W, half-sample-centered, cos^2+sin^2=1.
// j in [0, W), W = window length in samples.
inline float equalPowerBoundarySample(float oldv, float newv, uint32_t j, uint32_t W)
{
    const double theta = (3.14159265358979323846 / 2.0) * ((double)j + 0.5) / (double)W;
    return (float)((double)oldv * cos(theta) + (double)newv * sin(theta));
}

} // namespace g1a
