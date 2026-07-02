// crossfade.h — EQUAL-POWER (constant-power) host-side crossfade (PRE-REG §4).
//
// A ≠ B: A (FreqSine) and B (FM2op) are uncorrelated / different waveforms, so a
// linear (amplitude) crossfade would dip in perceived power. The pre-registration
// LOCKS an EQUAL-POWER crossfade instead:
//
//   θ(k) = (π/2) · (k − K_XFADE_START + 1) / W_XFADE   for k ∈ [K_XFADE_START, K_SWAP)
//   a(k) = cos θ(k)   (A weight, ↓ from ~1 to 0)
//   b(k) = sin θ(k)   (B weight, ↑ from ~0 to 1)
//   mix(k) = a(k)·A + b(k)·B      with a(k)² + b(k)² ≡ 1 (constant power)
//
// The coefficients are per-BLOCK constants (θ uses the block index k), matching
// the pre-registered formula exactly. At the last crossfade block k=K_SWAP−1:
// θ=(π/2)·W_XFADE/W_XFADE=π/2 ⇒ a=0, b=1 (fully B) just before the K_SWAP swap.
#pragma once
#include "host_config.h"
#include <cstdint>
#include <cmath>

namespace g1a {

constexpr double G1A_PI = 3.14159265358979323846;

// θ(k) for a crossfade block index k ∈ [K_XFADE_START, K_SWAP).
inline double xfadeTheta(uint32_t k)
{
    const uint32_t i = k - K_XFADE_START;            // 0 .. W_XFADE-1
    return (G1A_PI * 0.5) * (double)(i + 1) / (double)W_XFADE;
}

// Equal-power weights for crossfade block k.
inline double xfadeCoeffA(uint32_t k) { return std::cos(xfadeTheta(k)); }  // A weight
inline double xfadeCoeffB(uint32_t k) { return std::sin(xfadeTheta(k)); }  // B weight

// Equal-power boundary micro-fade sample (Variant G only; unused in Variant F).
inline float equalPowerBoundarySample(float oldS, float newS, uint32_t s, uint32_t W)
{
    const double theta = (G1A_PI * 0.5) * ((double)s + 0.5) / (double)W;
    const double wOld = std::cos(theta);
    const double wNew = std::sin(theta);
    return static_cast<float>(wOld * (double)oldS + wNew * (double)newS);
}

// Mix one crossfade block: out[j] = a(k)·A[j] + b(k)·B[j], computed in double.
// k is the absolute block index in [K_XFADE_START, K_SWAP).
void mixCrossfadeBlock(const float* a, const float* b, float* out, uint32_t k);

} // namespace g1a
