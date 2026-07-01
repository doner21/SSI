// barrier_mixer.h — the per-block two-party barrier + mixer (HARNESS-SPEC §6).
//
// This barrier is THE ONLY cross-thread synchronization primitive in the host
// (the static no-unsynchronized-shared-mutable-state audit target, PRE-REG
// §3.3 / §9.5). Thread A writes only slotA, thread B writes only slotB; the
// mixer writes only `mixed` and reads slotA/slotB STRICTLY AFTER both threads
// have arrived for that block. No shared mutable buffer is written by both
// threads.
//
// Implemented with std::mutex + std::condition_variable + a generation counter
// (C++17; std::barrier is C++20 and unavailable here). The mixer-sum for block
// k is executed by the LAST thread to arrive, under the barrier lock, before
// either thread is released — guaranteeing the mix happens-after both writes
// and happens-before the next block.
#pragma once
#include <cstdint>
#include <mutex>
#include <condition_variable>
#include <vector>

namespace g1a {

class BarrierMixer
{
public:
    // slotA/slotB: per-performer output storage (TOTAL_SAMPLES floats each).
    // mixed: the mix destination (TOTAL_SAMPLES floats).
    // blockSize: frames per block. measureMixTime: if non-null, the per-block
    // mixer-sum wall-clock cost (ns) is recorded into measureMixTime[k].
    BarrierMixer(const float* slotA, const float* slotB, float* mixed,
                 uint32_t blockSize, uint64_t* measureMixTime);

    // Called by each RT thread after it has written its slot for block k.
    // Exactly two arrivals per block. The second (last) arriver runs the mix.
    // threadId (0=A, 1=B) is recorded for the first few blocks to document
    // barrier-arrival ordering in the proof (trace.log).
    void arrive(uint32_t blockIndex, int threadId);

    // First-arriver thread id for the first few blocks (proof evidence).
    const std::vector<int>& orderingSample() const { return firstArriver_; }

private:
    const float* slotA_;
    const float* slotB_;
    float*       mixed_;
    uint32_t     blockSize_;
    uint64_t*    mixTime_;

    std::mutex              m_;
    std::condition_variable cv_;
    int                     count_ = 0;       // arrivals for current block
    uint64_t                generation_ = 0;  // released-block generation
    std::vector<int>        firstArriver_;    // first-arriver thread id, first blocks

    void doMix(uint32_t blockIndex);
};

} // namespace g1a
