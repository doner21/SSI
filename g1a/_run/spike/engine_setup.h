// engine_setup.h — main-thread Engine/Performer construction (HARNESS-SPEC §4).
//
// Each performer gets its OWN cmaj::Engine (two independent JIT compiles). All
// load/link happens here, single-threaded on the main thread, BEFORE any RT
// thread is spawned (SDK-GROUNDING §6.2). Performers are created fresh per
// render so every render starts from identical phase-0 state.
#pragma once

#define CMAJOR_DLL 1
#include <cassert>
#undef CHOC_ASSERT
#define CHOC_ASSERT(x) assert(x)
#include "cmajor/API/cmaj_Engine.h"

#include <string>

namespace g1a {

// One performer's persistent engine context (engine kept alive; fresh
// performers minted from it on demand).
struct EngineCtx
{
    cmaj::Engine engine;
    uint32_t     outHandle = 0;   // "out" endpoint handle (captured after load, before link)
    uint32_t     inHandle  = 0;   // "in" handle for the control/fed config (0 if none)
    bool         ok        = false;
    std::string  error;
};

// Initialise the Cmajor DLL once for the process. Returns false on failure.
bool initLibrary();

// Build an engine for a self-oscillating sine patch (no input).
// sessionId distinguishes the two engines' sessions.
EngineCtx buildSineEngine(const char* source, int32_t sessionId);

// Build an engine for a passthrough patch (input-fed control config).
EngineCtx buildPassEngine(const char* source, int32_t sessionId);

} // namespace g1a
