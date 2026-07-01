// crossfade.cpp — per-sample linear alpha host-side mix.
#include "crossfade.h"

namespace g1a {

void mixCrossfadeBlock(const float* a, const float* b, float* out, uint64_t mBase)
{
    for (uint32_t j = 0; j < BLOCK_SIZE; ++j)
    {
        const uint64_t m = mBase + j;
        const double alpha = alphaAt(m);
        out[j] = static_cast<float>((1.0 - alpha) * static_cast<double>(a[j])
                                    + alpha * static_cast<double>(b[j]));
    }
}

} // namespace g1a
