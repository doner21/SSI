// perturb.cpp — SplitMix64-based deterministic interleaving perturbation.
// PORT NOTE: identical to _run-reload/spike/perturb.cpp (pure computation +
// std::this_thread::yield(), both portable).
#include "perturb.h"
#include <thread>

namespace g1a {

// SplitMix64 finalizer / generator (public-domain algorithm).
static inline uint64_t splitmix64(uint64_t& x)
{
    uint64_t z = (x += 0x9E3779B97F4A7C15ull);
    z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ull;
    z = (z ^ (z >> 27)) * 0x94D049BB133111EBull;
    return z ^ (z >> 31);
}

PerturbSchedule::PerturbSchedule(bool enabled, uint64_t seedMaster,
                                 uint32_t repeat, int threadId)
    : enabled_(enabled)
{
    // Derive a per-(seed,repeat,thread) seed deterministically.
    uint64_t s = seedMaster;
    s ^= (uint64_t)repeat   * 0xD1B54A32D192ED03ull;
    s ^= (uint64_t)threadId * 0xA0761D6478BD642Full + 0x9E3779B97F4A7C15ull;
    state_ = splitmix64(s);   // one mixing step so the state is well-diffused
}

uint64_t PerturbSchedule::next()
{
    return splitmix64(state_);
}

void PerturbSchedule::maybePerturb(uint32_t /*step*/)
{
    if (!enabled_) return;

    uint64_t r = next();

    // ~50% of calls: inject a yield to force a reschedule.
    if (r & 1ull)
        std::this_thread::yield();

    // ~25% of calls: additionally inject a bounded busy-spin (deterministic
    // length, capped small — these repeats are NOT timed; only interleaving
    // matters for the determinism invariant).
    if ((r & 0x6ull) == 0x6ull)
    {
        volatile uint64_t sink = 0;
        uint32_t spins = (uint32_t)((r >> 8) & 0xFFull);
        for (uint32_t i = 0; i < spins; ++i)
            sink += i;
        (void)sink;
    }
}

} // namespace g1a
