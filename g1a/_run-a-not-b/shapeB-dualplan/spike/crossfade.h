// crossfade.h — per-block equal-power crossfade (PRE-REG §4).
//
// Equal-power (constant-power) blend: over the crossfade window of W_XFADE=64
// blocks, the per-block coefficients are a=cos(θ), b=sin(θ),
// θ=(π/2)·(i+1)/W_XFADE for block ordinal i∈[0,W_XFADE).
// Within each block, a and b are CONSTANT (no per-sample ramp).
// The master output during the window is  out[j] = a*A[j] + b*B[j] for each sample j.
#pragma once
#include "host_config.h"
#include <cstdint>
#include <cmath>

namespace g1a {

// Per-block equal-power alpha coefficient for crossfade block ordinal i.
// Returns a=cos(θ) where θ=(π/2)·(i+1)/W_XFADE.
inline double equalPowerAlpha(uint32_t i)
{
    const double pi = 3.14159265358979323846;
    const double theta = (pi * 0.5) * static_cast<double>(i + 1) / static_cast<double>(W_XFADE);
    return std::cos(theta);
}

// b = sin(θ) = sqrt(1 - a²) — the complementary coefficient (mathematically exact via sin).
inline double equalPowerBeta(uint32_t i)
{
    const double pi = 3.14159265358979323846;
    const double theta = (pi * 0.5) * static_cast<double>(i + 1) / static_cast<double>(W_XFADE);
    return std::sin(theta);
}

// Mix one crossfade block: a[BLOCK_SIZE], b[BLOCK_SIZE] -> out[BLOCK_SIZE].
// xfadeBlockIndex is the crossfade block ordinal (0..63).
void mixCrossfadeBlock(const float* a, const float* b, float* out,
                       uint32_t xfadeBlockIndex);

} // namespace g1a
