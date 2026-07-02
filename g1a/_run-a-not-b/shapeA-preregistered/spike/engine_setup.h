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

// Per-engine context for engineA (FreqSine): engine + freq/out handles.
struct EngineCtx
{
    cmaj::Engine engine;
    uint32_t     freqHandle = 0;   // "freq" input value endpoint handle
    uint32_t     outHandle  = 0;   // "out" output stream endpoint handle
    bool         ok         = false;
    std::string  error;
};

// Per-engine context for engineB (FM2op): engine + the DIFFERENT 3-input schema
// (carrierHz, modIndex, ratio) + out. This is the structural change under test:
// B has its own engine/program because its endpoint schema differs from A's.
struct EngineCtxB
{
    cmaj::Engine engine;
    uint32_t     carrierHzHandle = 0;  // "carrierHz" input value — PARAM-CARRY target
    uint32_t     modIndexHandle  = 0;  // "modIndex"  input value — declared default 1.0
    uint32_t     ratioHandle     = 0;  // "ratio"     input value — declared default 1.0
    uint32_t     outHandle       = 0;  // "out" output stream endpoint handle
    bool         ok              = false;
    std::string  error;
};

// Initialise the Cmajor DLL once for the process. Returns false on failure.
bool initLibrary();

// Build a single engine for FreqSine. Returns handles for freq and out.
// sessionId distinguishes the engine session.
EngineCtx buildFreqSineEngine(const char* source, int32_t sessionId);

// Build engineB for FM2op. Returns handles for carrierHz, modIndex, ratio, out.
// sessionId MUST differ from engineA's (distinct engine session). The engine is
// still accessed by exactly ONE thread at a time; the worker calls
// engineB.createPerformer() solo.
EngineCtxB buildFM2opEngine(const char* source, int32_t sessionId);

// The SINGLE B (FM2op) initial-latch primitive (PRE-REG §2.2 carry-across).
// Latches, in a FIXED order (carrierHz, then modIndex, then ratio), B's carried
// carrierHz plus its two declared-default inputs. Used IDENTICALLY by the live RT
// path and every B reference render, so the post-swap B stream is bit-exact to
// REF_Bpost (maxerr_reload_B==0). Order/values here are the bit-exactness contract.
inline void latchBInitial(cmaj::Performer& p,
                          uint32_t carrierHzHandle, uint32_t modIndexHandle,
                          uint32_t ratioHandle, double carrierHz,
                          double modIndex, double ratio)
{
    p.setInputValue(carrierHzHandle, (float)carrierHz, 0);
    p.setInputValue(modIndexHandle,  (float)modIndex,  0);
    p.setInputValue(ratioHandle,     (float)ratio,     0);
}

} // namespace g1a
