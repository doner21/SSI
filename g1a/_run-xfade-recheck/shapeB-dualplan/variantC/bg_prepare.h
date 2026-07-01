// bg_prepare.h — the worker (off-RT prepare) thread (HARNESS-SPEC §4, Performer B).
//
// Runs on a worker thread dispatched at K_PREPARE_START while performer A is
// live on the RT thread. Calls engine.createPerformer() + setBlockSize(256) on
// the SHARED engine (HARNESS-SPEC §0 single-thread engine-access invariant: the
// worker calls createPerformer(B) solo; RT thread never touches the engine).
// On success, publishes performers[1] and signals bReady with release semantics.
//
// The worker NEVER touches performers[0], the master buffer, or activeIndex.
#pragma once
#include "swap.h"

namespace g1a {

// Runs on the worker thread. Uses st.sharedEngine (already initialised by main).
// Records all results into st.
void backgroundPrepareB(EventReplayState& st);

} // namespace g1a
