// perturb.h — deterministic seeded interleaving perturbation (HARNESS-SPEC §7).
//
// PORT NOTE: identical to _run-reload/spike/perturb.h; std::this_thread::yield()
// is portable. ONLY change is SEED_MASTER value, which lives in host_config.h.
//
// SplitMix64-based splittable PRNG seeded by hash(SEED_MASTER, repeat, threadId).
// Produces bounded yields/short spins that change INTERLEAVING ONLY — never
// inputs, never phase, never the K_XFADE_START / K_SWAP block indices. A correct,
// race-free implementation must therefore produce bit-identical audio across all
// repeats (T4e) even though the wall-clock moment of compile completion varies.
#pragma once
#include <cstdint>

namespace g1a {

class PerturbSchedule
{
public:
    // enabled=false => no perturbation (repeat 0, the clean reference).
    PerturbSchedule(bool enabled, uint64_t seedMaster, uint32_t repeat, int threadId);

    // Advance the PRNG and (if enabled) inject a bounded yield / short spin.
    // step is the call-site index (block index on the RT thread, build-step
    // index on the worker thread).
    void maybePerturb(uint32_t step);

    uint64_t next();

private:
    bool     enabled_;
    uint64_t state_;
};

} // namespace g1a
