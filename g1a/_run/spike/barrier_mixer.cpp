// barrier_mixer.cpp — two-party reusable barrier + per-block mixer sum.
#include "barrier_mixer.h"
#include <windows.h>

namespace g1a {

static inline uint64_t qpcNow()
{
    LARGE_INTEGER c; QueryPerformanceCounter(&c); return (uint64_t)c.QuadPart;
}
static inline uint64_t qpcFreq()
{
    static uint64_t f = []{ LARGE_INTEGER q; QueryPerformanceFrequency(&q); return (uint64_t)q.QuadPart; }();
    return f;
}

BarrierMixer::BarrierMixer(const float* slotA, const float* slotB, float* mixed,
                           uint32_t blockSize, uint64_t* measureMixTime)
    : slotA_(slotA), slotB_(slotB), mixed_(mixed),
      blockSize_(blockSize), mixTime_(measureMixTime) {}

void BarrierMixer::doMix(uint32_t blockIndex)
{
    const uint64_t base = (uint64_t)blockIndex * blockSize_;
    uint64_t t0 = mixTime_ ? qpcNow() : 0;
    for (uint32_t j = 0; j < blockSize_; ++j)
        mixed_[base + j] = slotA_[base + j] + slotB_[base + j];
    if (mixTime_)
    {
        uint64_t t1 = qpcNow();
        // ns = ticks * 1e9 / freq
        mixTime_[blockIndex] = (uint64_t)((t1 - t0) * 1000000000.0 / (double)qpcFreq());
    }
}

void BarrierMixer::arrive(uint32_t blockIndex, int threadId)
{
    std::unique_lock<std::mutex> lk(m_);
    uint64_t myGen = generation_;

    if (++count_ == 2)
    {
        // Second (last) arriver — record that the OTHER thread arrived first.
        if (blockIndex < 32) firstArriver_.push_back(threadId == 0 ? 1 : 0);
        // Last arriver for this block: both slots are now written. Mix, then
        // release both threads to the next block.
        doMix(blockIndex);
        count_ = 0;
        ++generation_;
        cv_.notify_all();
    }
    else
    {
        // First arriver: wait until the block's generation advances.
        cv_.wait(lk, [&]{ return generation_ != myGen; });
    }
}

} // namespace g1a
