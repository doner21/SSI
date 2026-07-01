// swap.h — the std::atomic<uint32_t> active-index handoff + the shared reload
// state + the post-crossfade safe-release protocol (RELOAD-GROUNDING §2, §3).
//
// PORT NOTE: std::atomic and cmaj wrappers are portable — this file is
// STRUCTURALLY IDENTICAL to _run-reload/spike/swap.h (PRE-REG §4.4 "std::atomic
// is portable — no change"). This is the host-side synchronisation that TSan
// certifies.
//
// The ONLY cross-thread synchronisation between the RT thread and the worker
// thread is:
//   - activeIndex (std::atomic<uint32_t>): the swap index into performers[2].
//   - bReady      (std::atomic<bool>)    : the worker's publication of B.
//   - currentBlock(std::atomic<uint32_t>): RT block progress (relaxed beacon).
//   - rtSawIndexOne(std::atomic<bool>)   : RT has load(acquire)'d index==1.
// performers[1] is published by the worker and observed by the RT thread via the
// bReady release/acquire pair (publication happens-before). cmaj::Performer is a
// ref-counted COM-style wrapper — NEVER held in std::atomic<cmaj::Performer>;
// the ref-count itself is internally atomic, making the safe release race-free.
#pragma once

#define CMAJOR_DLL 1
#include <cassert>
#undef CHOC_ASSERT
#define CHOC_ASSERT(x) assert(x)
#include "cmajor/API/cmaj_Engine.h"

#include <atomic>
#include <cstdint>
#include <string>

namespace g1a {

struct ReloadState
{
    // ── The 2-element performer array + the lock-free index handoff ──
    cmaj::Performer       performers[2];      // [0]=A (live), [1]=B (background-compiled)
    std::atomic<uint32_t> activeIndex { 0 };  // 0 -> 1 swap at K_SWAP
    std::atomic<bool>     bReady      { false };
    std::atomic<uint32_t> currentBlock{ 0 };  // RT block progress beacon (worker reads it)
    std::atomic<bool>     rtSawIndexOne{ false };

    // ── Engine B (kept alive; built fresh each repeat by the worker) ──
    cmaj::Engine engineB;
    uint32_t     outHandle_B { 0 };
    uint32_t     outHandle_A { 0 };

    // ── Worker (background-compile) result audit ──
    std::atomic<bool> compileOk { false };
    uint32_t          kCompileDone { 0 };     // RT block index when bReady published
    std::string       compileError;

    // ── Swap / safe-release records ──
    uint32_t swapBlock { 0 };
    uint32_t swapCount { 0 };
    uint32_t rtConfirmedIndexOneBlock { 0 };  // first RT block where load(acquire)==1
    uint32_t oldPerfReleaseBlock { 0 };
    bool     oldPerfReleasedPostCrossfade { false };

    // ── Performer-API Result audit: count of != Ok across the whole run ──
    std::atomic<uint64_t> resultViolations { 0 };

    // ── Perturbation config for this repeat (interleaving stress) ──
    bool     perturbEnabled { false };
    uint64_t seedMaster { 0 };
    uint32_t repeat { 0 };

    void resetForRepeat(uint32_t r, bool enablePerturb, uint64_t seed)
    {
        activeIndex.store(0, std::memory_order_relaxed);
        bReady.store(false, std::memory_order_relaxed);
        currentBlock.store(0, std::memory_order_relaxed);
        rtSawIndexOne.store(false, std::memory_order_relaxed);
        compileOk.store(false, std::memory_order_relaxed);
        kCompileDone = 0;
        compileError.clear();
        swapBlock = 0;
        swapCount = 0;
        rtConfirmedIndexOneBlock = 0;
        oldPerfReleaseBlock = 0;
        oldPerfReleasedPostCrossfade = false;
        outHandle_B = 0;
        repeat = r;
        perturbEnabled = enablePerturb;
        seedMaster = seed;
        // resultViolations accumulates across the whole run (NOT reset here).
    }
};

// Post-crossfade safe release of the OLD performer (performers[0]) + its repeat
// resources. Preconditions (RELOAD-GROUNDING §3): the crossfade window has fully
// elapsed (block >= K_SWAP) AND the RT thread has performed at least one
// load(acquire) returning 1 (rtSawIndexOne). Records oldPerfReleaseBlock and
// oldPerfReleasedPostCrossfade. Performed on the main thread after the RT thread
// has joined (so performers[0] is provably untouched by the RT thread).
void safeReleaseOldPerformer(ReloadState& st);

} // namespace g1a
