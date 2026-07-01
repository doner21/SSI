// engine_setup.cpp — locked Engine/Performer construction sequence (main thread).
// Realises SDK-GROUNDING §4 exactly: parse -> setBuildSettings -> load ->
// getEndpointHandle (after load, before link) -> link.
//
// PORT NOTE: structurally identical to _run-reload/spike/engine_setup.cpp; the
// only platform difference is DLL_NAME = "libCmajPerformer.so" (host_config.h).
#include "engine_setup.h"
#include "host_config.h"

namespace g1a {

bool initLibrary()
{
    // Once per process (not per performer). The .so is loaded from a directory
    // on LD_LIBRARY_PATH (the spike dir, set by run_tsan_cert.sh).
    return cmaj::Library::initialise(DLL_NAME);
}

EngineCtx buildSineEngine(const char* source, int32_t sessionId)
{
    EngineCtx ctx;

    ctx.engine = cmaj::Engine::create();
    if (!ctx.engine) { ctx.error = "Engine::create() failed"; return ctx; }

    cmaj::DiagnosticMessageList messages;
    cmaj::Program program;
    if (!program.parse(messages, "internal", source))
    {
        ctx.error = "parse failed: " + messages.toString();
        return ctx;
    }

    // Locked build settings: fs=48000, maxBlockSize=256, distinct sessionID.
    ctx.engine.setBuildSettings(cmaj::BuildSettings()
                                    .setFrequency(SAMPLE_RATE)
                                    .setMaxBlockSize(BLOCK_SIZE)
                                    .setSessionID(sessionId));

    messages.clear();
    if (!ctx.engine.load(messages, program, {}, {}) || messages.hasErrors())
    {
        ctx.error = "load failed: " + messages.toString();
        return ctx;
    }

    // Handle captured AFTER load, BEFORE link (SDK-GROUNDING §6.5).
    ctx.outHandle = ctx.engine.getEndpointHandle("out");
    if (ctx.outHandle == 0) { ctx.error = "invalid out handle"; return ctx; }

    messages.clear();
    if (!ctx.engine.link(messages) || messages.hasErrors())
    {
        ctx.error = "link failed: " + messages.toString();
        return ctx;
    }

    ctx.ok = true;
    return ctx;
}

} // namespace g1a
