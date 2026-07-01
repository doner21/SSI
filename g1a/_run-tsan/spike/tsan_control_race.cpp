// tsan_control_race.cpp — T3a DETECTOR-LIVENESS binary (PRE-REG §5.3 T3a).
//
// A STANDALONE binary (not part of the main harness) containing a DELIBERATE
// data race: two threads incrementing a shared NON-ATOMIC int with NO
// synchronisation. Built on the SAME WSL2 host with the IDENTICAL
// `-fsanitize=thread -g -O1 -std=c++17` invocation and run with the SAME
// TSAN_OPTIONS INCLUDING the suppressions file active (PRE-REG §4.6 rule 3).
//
// TSan MUST report `WARNING: ThreadSanitizer: data race` for this binary. If it
// does NOT, ThreadSanitizer is not functional on this host/toolchain/run and the
// whole certification is INVALIDATED (DETECTOR_LIVENESS_FAIL). Because the only
// suppression entry is `race:libCmajPerformer.so` (which never matches this
// binary), the race here is caught WITH the suppressions file active — proving
// the suppressions are scoped, not a global mask.
//
// A compiler fence on each access ensures the optimiser does not register-promote
// the shared counter at -O1 (TSAN-REALITY-MEMO §2.2) — the race stays observable.

#include <atomic>
#include <cstdio>
#include <thread>

// Deliberately NON-atomic shared mutable state with NO synchronisation.
static long shared_bad = 0;

static void hammer()
{
    for (int i = 0; i < 1000000; ++i)
    {
        // Unsynchronized read-modify-write of shared_bad -> the data race.
        long v = shared_bad;
        std::atomic_signal_fence(std::memory_order_seq_cst);
        shared_bad = v + 1;
        std::atomic_signal_fence(std::memory_order_seq_cst);
    }
}

int main()
{
    std::printf("=== tsan_control_race (T3a detector-liveness) ===\n");
    std::thread t1(hammer);
    std::thread t2(hammer);
    t1.join();
    t2.join();
    // The final value is meaningless (corrupted by the race); the POINT is that
    // TSan must have emitted a data-race warning to stderr during the run.
    std::printf("control-race done, shared_bad=%ld (value is intentionally corrupt)\n", shared_bad);
    return 0;
}
