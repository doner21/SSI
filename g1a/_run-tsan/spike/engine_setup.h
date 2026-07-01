// engine_setup.h — Engine/Performer construction (HARNESS-SPEC §4).
//
// The SDK-GROUNDING §4 sequence (parse -> setBuildSettings -> load ->
// getEndpointHandle[after load, before link] -> link -> createPerformer). Used
// for Engine A on the MAIN thread (this file) and, with per-step perturbation,
// for Engine B on the WORKER thread (bg_compiler).
//
// PORT NOTE (Windows->Linux): the ONLY change from _run-reload/spike/engine_setup.h
// is the runtime name (libCmajPerformer.so vs CmajPerformer.dll), carried in
// host_config.h::DLL_NAME. The cmaj API contract is identical (headers shared).
#pragma once

#define CMAJOR_DLL 1
#include <cassert>
#undef CHOC_ASSERT
#define CHOC_ASSERT(x) assert(x)
#include "cmajor/API/cmaj_Engine.h"

#include <string>

namespace g1a {

// One engine's persistent context (engine kept alive; fresh performers minted
// from it on demand so every render starts from identical phase-0 state).
struct EngineCtx
{
    cmaj::Engine engine;
    uint32_t     outHandle = 0;   // "out" handle (captured after load, before link)
    bool         ok        = false;
    std::string  error;
};

// Initialise the Cmajor runtime once for the process. Returns false on failure.
// On Linux this dlopen's libCmajPerformer.so (LD_LIBRARY_PATH must include its dir).
bool initLibrary();

// Build an engine for a self-oscillating sine patch (no input).
// sessionId distinguishes the engines' sessions. Synchronous (main thread).
EngineCtx buildSineEngine(const char* source, int32_t sessionId);

} // namespace g1a
