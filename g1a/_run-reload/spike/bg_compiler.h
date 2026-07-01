// bg_compiler.h — the worker (background-compile) thread (RELOAD-GROUNDING §1, §4).
//
// There is NO async build API: background compile is the full synchronous
// Engine::create -> Program::parse -> setBuildSettings -> load ->
// getEndpointHandle -> link -> createPerformer on a SECOND cmaj::Engine (Engine
// B) on a non-RT worker thread, WHILE performer A is live on the RT thread. On
// success it publishes performers[1] + outHandle_B + engineB, records
// K_COMPILE_DONE (= the current RT block index), then signals bReady with release
// semantics. The worker NEVER touches performers[0], the master buffer, or
// activeIndex.
#pragma once
#include "swap.h"

namespace g1a {

// Runs on the worker thread. sineBSource is the SineB (880 Hz) source string;
// sessionIdB distinguishes Engine B's session. Records all results into st.
void backgroundCompileB(ReloadState& st, const char* sineBSource, int32_t sessionIdB);

} // namespace g1a
