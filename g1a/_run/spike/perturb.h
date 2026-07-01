// perturb.h — deterministic seeded interleaving-perturbation schedule
// (HARNESS-SPEC §7 / PRE-REG §4.5).
//
// A SplitMix64 PRNG seeded by hash(SEED_MASTER, r, threadId) decides, per block,
// whether to inject a bounded yield/short-spin at that block's perturbation hook.
// The schedule is FIXED by (SEED_MASTER, r, threadId), so each repeat's
// interleaving pressure is reproducible. The perturbation changes interleaving
// ONLY — never inputs or phase — so a correct, race-free implementation must
// produce bit-identical audio across all repeats (M4a).
//
// Repeat r = 0 injects NOTHING (clean timing reference for M2).
#pragma once
#include <cstdint>

namespace g1a {

class PerturbSchedule
{
public:
    // enabled=false for repeat 0 (no perturbation). For r>=1, seed the stream
    // from (SEED_MASTER, r, threadId).
    PerturbSchedule(bool enabled, uint64_t seedMaster, uint32_t repeat, int threadId);

    // Called at each block's perturbation hook. For enabled schedules, may inject
    // a bounded yield or short spin depending on the deterministic draw.
    void maybePerturb(uint32_t blockIndex);

    bool enabled() const { return enabled_; }

private:
    bool     enabled_;
    uint64_t state_;
    uint64_t next();
};

} // namespace g1a
