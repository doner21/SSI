// rt_performer.cpp — concurrent RT worker + single-threaded solo render.
#include "rt_performer.h"
#include "host_config.h"
#include <windows.h>

namespace g1a {

static inline uint64_t qpcNow()
{
    LARGE_INTEGER c; QueryPerformanceCounter(&c); return (uint64_t)c.QuadPart;
}
static inline uint64_t qpcFreqHz()
{
    static uint64_t f = []{ LARGE_INTEGER q; QueryPerformanceFrequency(&q); return (uint64_t)q.QuadPart; }();
    return f;
}
static inline uint64_t ticksToNs(uint64_t ticks)
{
    return (uint64_t)(ticks * 1000000000.0 / (double)qpcFreqHz());
}

void rtPerformerWorker(cmaj::Performer performer,
                       uint32_t outHandle,
                       uint32_t inHandle,
                       const float* inputBlock,
                       float* slot,
                       BarrierMixer* barrier,
                       PerturbSchedule* sched,
                       ResultAudit* audit,
                       uint64_t* perBlockNs,
                       int threadId)
{
    for (uint32_t k = 0; k < N_BLOCKS; ++k)
    {
        uint64_t t0 = perBlockNs ? qpcNow() : 0;

        // (control/fed config only) feed this block's deterministic input.
        if (inHandle != 0 && inputBlock != nullptr)
        {
            cmaj::Result ri = performer.setInputFrames(inHandle, inputBlock, BLOCK_SIZE);
            if (ri != cmaj::Result::Ok) ++audit->resultViolations;
        }

        cmaj::Result ra = performer.advance();
        if (ra != cmaj::Result::Ok) ++audit->resultViolations;

        cmaj::Result rc = performer.copyOutputFrames(outHandle,
                                                     &slot[(uint64_t)k * BLOCK_SIZE],
                                                     BLOCK_SIZE);
        if (rc != cmaj::Result::Ok) ++audit->resultViolations;

        if (perBlockNs)
            perBlockNs[k] = ticksToNs(qpcNow() - t0);

        ++audit->blocksCompleted;

        // (repeats r>=1) inject the seeded interleaving perturbation.
        sched->maybePerturb(k);

        // Rendezvous at the per-block barrier; last arriver mixes this block.
        barrier->arrive(k, threadId);
    }
}

void renderSolo(cmaj::Performer performer,
                uint32_t outHandle,
                uint32_t inHandle,
                const float* inputBlock,
                float* dest,
                ResultAudit* audit)
{
    for (uint32_t k = 0; k < N_BLOCKS; ++k)
    {
        if (inHandle != 0 && inputBlock != nullptr)
        {
            cmaj::Result ri = performer.setInputFrames(inHandle, inputBlock, BLOCK_SIZE);
            if (ri != cmaj::Result::Ok) ++audit->resultViolations;
        }

        cmaj::Result ra = performer.advance();
        if (ra != cmaj::Result::Ok) ++audit->resultViolations;

        cmaj::Result rc = performer.copyOutputFrames(outHandle,
                                                     &dest[(uint64_t)k * BLOCK_SIZE],
                                                     BLOCK_SIZE);
        if (rc != cmaj::Result::Ok) ++audit->resultViolations;

        ++audit->blocksCompleted;
    }
}

} // namespace g1a
