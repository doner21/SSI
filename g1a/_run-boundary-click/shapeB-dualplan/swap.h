// swap.h — the std::atomic<uint32_t> active-index handoff + event-replay state
// + post-crossfade safe-release protocol (HARNESS-SPEC §6 / RELOAD-GROUNDING §2,§3).
//
// Locked synchronisation primitives:
//   - activeIndex (std::atomic<uint32_t>): swap index into performers[2]
//   - bReady      (std::atomic<bool>):     worker's publication that B is ready
//   - currentBlock(std::atomic<uint32_t>): RT block progress (relaxed beacon)
//   - rtSawIndexOne(std::atomic<bool>):    RT has load(acquire)'d index==1
//
// Engine-access invariant (dossier §8, HARNESS-SPEC §0):
//   The shared engine is accessed by exactly ONE thread at a time.
//   Main thread finishes all engine ops before worker touches it.
//   Worker calls createPerformer(B) solo.
//   RT thread never touches the engine.
#pragma once

#define CMAJOR_DLL 1
#include <cassert>
#undef CHOC_ASSERT
#define CHOC_ASSERT(x) assert(x)
#include "cmajor/API/cmaj_Engine.h"

#include <atomic>
#include <cstdint>
#include <string>
#include <vector>

namespace g1a {

struct EventReplayState
{
    // ── The 2-element performer array + lock-free index handoff ──
    cmaj::Performer       performers[2];      // [0]=A (live), [1]=B (prepared)
    std::atomic<uint32_t> activeIndex { 0 };  // 0 -> 1 swap at K_SWAP (sole writer: RT thread)
    std::atomic<bool>     bReady      { false };
    std::atomic<uint32_t> currentBlock{ 0 };  // RT block progress beacon (worker reads it)
    std::atomic<bool>     rtSawIndexOne{ false };

    // ── Shared engine reference (owning reference) ──
    // The engine is KEPT ALIVE here. The main thread sets it once.
    // The worker calls createPerformer(B) on it. The RT thread never touches it.
    cmaj::Engine sharedEngine;
    uint32_t     freqHandle { 0 };   // "freq" handle from the shared engine
    uint32_t     outHandle  { 0 };   // "out" handle from the shared engine

    // ── Worker (bg_prepare) result audit (R1) ──
    std::atomic<bool> compileOk { false };
    uint32_t          kPrepareDone { 0 };     // RT block index when bReady published
    std::string       prepareError;

    // ── Swap / reset / latch-replay / safe-release records (R2) ──
    uint32_t swapBlock { 0 };
    uint32_t swapCount { 0 };
    uint32_t rtConfirmedIndexOneBlock { 0 };
    uint32_t oldPerfReleaseBlock { 0 };
    bool     oldPerfReleasedPostCrossfade { false };
    bool     resetCalledOnB { false };
    bool     latchReplayCalled { false };
    uint64_t xrunAtSwap { 0 };      // block compute time at K_SWAP (0 if within budget)

    // ── Performer-API Result audit (R2) ──
    std::atomic<uint64_t> resultViolations { 0 };

    // ── Perturbation config for this repeat (R4 stress) ──
    bool     perturbEnabled { false };
    uint64_t seedMaster { 0 };
    uint32_t repeat { 0 };

    // ── Event application audit (accumulated per repeat) ──
    std::atomic<uint64_t> eventsAppliedA      { 0 };  // A events in [0, K_SWAP)
    std::atomic<uint64_t> eventsAppliedBPre   { 0 };  // B events in [K_XFADE_START, K_SWAP)
    std::atomic<uint64_t> eventsAppliedBPost  { 0 };  // B events in [K_SWAP, N)
    std::atomic<uint64_t> bXfadeInitialLatchCount { 0 };  // should be 1
    std::atomic<uint64_t> latchReplayCount    { 0 };  // should be 1

    // Per-block event application log (repeat 0 only)
    // Format: pair<block, freq>
    std::vector<std::pair<uint32_t, double>> eventLogA;       // A events
    std::vector<std::pair<uint32_t, double>> eventLogBPre;    // B pre-swap events
    std::vector<std::pair<uint32_t, double>> eventLogBPost;   // B post-swap events
    std::vector<std::pair<uint32_t, double>> xfadeInitialLatchLog;  // B initial latch at K_XFADE_START
    std::vector<std::pair<uint32_t, double>> latchReplayLog;       // latch-replay at K_SWAP

    void resetForRepeat(uint32_t r, bool enablePerturb, uint64_t seed)
    {
        activeIndex.store(0, std::memory_order_relaxed);
        bReady.store(false, std::memory_order_relaxed);
        currentBlock.store(0, std::memory_order_relaxed);
        rtSawIndexOne.store(false, std::memory_order_relaxed);
        compileOk.store(false, std::memory_order_relaxed);
        kPrepareDone = 0;
        prepareError.clear();
        swapBlock = 0;
        swapCount = 0;
        rtConfirmedIndexOneBlock = 0;
        oldPerfReleaseBlock = 0;
        oldPerfReleasedPostCrossfade = false;
        resetCalledOnB = false;
        latchReplayCalled = false;
        xrunAtSwap = 0;
        repeat = r;
        perturbEnabled = enablePerturb;
        seedMaster = seed;
        // Event audit counters - accumulated across repeats
        eventsAppliedA.store(0, std::memory_order_relaxed);
        eventsAppliedBPre.store(0, std::memory_order_relaxed);
        eventsAppliedBPost.store(0, std::memory_order_relaxed);
        bXfadeInitialLatchCount.store(0, std::memory_order_relaxed);
        latchReplayCount.store(0, std::memory_order_relaxed);
        // Clear event logs (repeat 0 only)
        eventLogA.clear();
        eventLogBPre.clear();
        eventLogBPost.clear();
        xfadeInitialLatchLog.clear();
        latchReplayLog.clear();
    }
};

// Post-crossfade safe release of the OLD performer (performers[0]).
// Preconditions: the crossfade window has fully elapsed (block >= K_SWAP)
// AND the RT thread has performed at least one load(acquire) returning 1
// (rtSawIndexOne). Performed on the main thread after the RT thread joins.
void safeReleaseOldPerformer(EventReplayState& st);

} // namespace g1a
