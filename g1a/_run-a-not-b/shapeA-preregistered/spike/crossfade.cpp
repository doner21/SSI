// crossfade.cpp — equal-power (constant-power) per-block host-side mix.
#include "crossfade.h"

namespace g1a {

void mixCrossfadeBlock(const float* a, const float* b, float* out, uint32_t k)
{
    const double ca = xfadeCoeffA(k);   // cos θ(k) — A weight
    const double cb = xfadeCoeffB(k);   // sin θ(k) — B weight
    for (uint32_t j = 0; j < BLOCK_SIZE; ++j)
        out[j] = static_cast<float>(ca * (double)a[j] + cb * (double)b[j]);
}

} // namespace g1a
