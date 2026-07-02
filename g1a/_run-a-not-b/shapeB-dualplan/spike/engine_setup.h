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

// Per-engine context: the engine, endpoint handles, error info.
// For FreqSine: freqHandle + outHandle.
// For FM2op:     carrierHzHandle + modIndexHandle + ratioHandle + outHandle.
struct EngineCtx
{
    cmaj::Engine engine;
    // A-side (FreqSine) handles
    uint32_t     freqHandle = 0;   // "freq" input value endpoint handle
    // B-side (FM2op) handles
    uint32_t     carrierHzHandle = 0; // "carrierHz" input value endpoint handle
    uint32_t     modIndexHandle  = 0; // "modIndex" input value endpoint handle
    uint32_t     ratioHandle     = 0; // "ratio" input value endpoint handle
    // Shared output handle
    uint32_t     outHandle  = 0;   // "out" output stream endpoint handle
    bool         ok         = false;
    std::string  error;
};

// Initialise the Cmajor DLL once for the process. Returns false on failure.
bool initLibrary();

// Build a single engine for FreqSine. Returns handles for freq and out.
// sessionId distinguishes the engine session.
EngineCtx buildFreqSineEngine(const char* source, int32_t sessionId);

// Build a single engine for FM2op. Returns handles for carrierHz, modIndex, ratio, and out.
// sessionId distinguishes the engine session.
EngineCtx buildFM2opEngine(const char* source, int32_t sessionId);

} // namespace g1a
