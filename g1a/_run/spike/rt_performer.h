// rt_performer.h — the per-performer render worker (HARNESS-SPEC §6).
//
// One thread per performer; each thread owns exactly one cmaj::Performer
// (SDK-GROUNDING §6.2). Per block: (optionally setInputFrames) -> advance ->
// copyOutputFrames into its OWN slot -> perturbation hook -> barrier arrival.
#pragma once

#include "engine_setup.h"   // cmaj::Performer
#include "barrier_mixer.h"
#include "perturb.h"
#include <cstdint>

namespace g1a {

// Per-performer Result-audit (M1). Written by exactly one thread (no sharing).
struct ResultAudit
{
    uint64_t resultViolations = 0;   // count of API calls returning Result != Ok
    uint64_t blocksCompleted  = 0;   // count of fully advanced+copied blocks
};

// Concurrent RT worker. `performer` is this thread's exclusive performer.
// inHandle != 0 and inputBlock != nullptr ⇒ the fed/control config (setInputFrames
// each block). `slot` is this performer's own TOTAL_SAMPLES output region.
// `perBlockNs` (or nullptr) receives per-block advance+copy wall-clock time (ns).
void rtPerformerWorker(cmaj::Performer performer,
                       uint32_t outHandle,
                       uint32_t inHandle,
                       const float* inputBlock,
                       float* slot,
                       BarrierMixer* barrier,
                       PerturbSchedule* sched,
                       ResultAudit* audit,
                       uint64_t* perBlockNs,
                       int threadId);

// Single-threaded solo render (no barrier, no concurrency) — the isolation
// reference (PRE-REG §4.6). Renders N_BLOCKS blocks into `dest`.
void renderSolo(cmaj::Performer performer,
                uint32_t outHandle,
                uint32_t inHandle,
                const float* inputBlock,
                float* dest,
                ResultAudit* audit);

} // namespace g1a
