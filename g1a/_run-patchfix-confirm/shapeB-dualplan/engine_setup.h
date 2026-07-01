// engine_setup.h — Single-engine construction (HARNESS-SPEC §4).
//
// The required sequence:
//   1. cmaj::Library::initialise(DLL_NAME) — once per process.
//   2. engine.create()
//   3. program.parse(messages, "internal", source)
//   4. engine.setBuildSettings(fs, maxBlockSize, sessionID)
//   5. engine.load(messages, program)
//   6. engine.getEndpointHandle("freq") — after load, before link
//   7. engine.getEndpointHandle("out")  — after load, before link
//   8. engine.link(messages)
//   9. engine.createPerformer() — Performer A
//
// Handles are obtained after load() and before link() (SDK-GROUNDING §6.5),
// and are valid for ALL performers created from this engine (dossier §5, §8).
#pragma once

#define CMAJOR_DLL 1
#include <cassert>
#undef CHOC_ASSERT
#define CHOC_ASSERT(x) assert(x)
#include "cmajor/API/cmaj_Engine.h"

#include <string>

namespace g1a {

// Per-engine context: the engine, both endpoint handles, error info.
struct EngineCtx
{
    cmaj::Engine engine;
    uint32_t     freqHandle = 0;   // "freq" input value endpoint handle
    uint32_t     outHandle  = 0;   // "out" output stream endpoint handle
    bool         ok         = false;
    std::string  error;
};

// Initialise the Cmajor DLL once for the process. Returns false on failure.
bool initLibrary();

// Build a single engine for FreqSine. Returns handles for freq and out.
// sessionId distinguishes the engine session.
EngineCtx buildFreqSineEngine(const char* source, int32_t sessionId);

} // namespace g1a
