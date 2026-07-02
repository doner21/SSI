// crossfade.cpp — per-block equal-power mix.
#include "crossfade.h"

namespace g1a {

void mixCrossfadeBlock(const float* a, const float* b, float* out,
                       uint32_t xfadeBlockIndex)
{
    const double alpha = equalPowerAlpha(xfadeBlockIndex);
    const double beta  = equalPowerBeta(xfadeBlockIndex);
    for (uint32_t j = 0; j < BLOCK_SIZE; ++j)
    {
        out[j] = static_cast<float>(alpha * static_cast<double>(a[j])
                                    + beta  * static_cast<double>(b[j]));
    }
}

} // namespace g1a
