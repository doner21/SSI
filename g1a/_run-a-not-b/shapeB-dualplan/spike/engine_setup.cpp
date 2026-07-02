// engine_setup.cpp — locked single-engine construction (HARNESS-SPEC §4).
//
// Creates ONE engine shared by all performers. The invariant: the engine is
// accessed by exactly ONE thread at a time. The main thread finishes all engine
// operations before any worker/RT thread accesses it. The worker calls
// createPerformer(B) solo. The RT thread never touches the engine.
#include "engine_setup.h"
#include "host_config.h"

namespace g1a {

bool initLibrary()
{
    // Once per process. DLL sits next to the .exe.
    return cmaj::Library::initialise(DLL_NAME);
}

EngineCtx buildFreqSineEngine(const char* source, int32_t sessionId)
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

    // Handles captured AFTER load, BEFORE link (SDK-GROUNDING §6.5, dossier §5).
    ctx.freqHandle = ctx.engine.getEndpointHandle("freq");
    if (ctx.freqHandle == 0) { ctx.error = "invalid freq handle"; return ctx; }

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

EngineCtx buildFM2opEngine(const char* source, int32_t sessionId)
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

    // Handles captured AFTER load, BEFORE link.
    ctx.carrierHzHandle = ctx.engine.getEndpointHandle("carrierHz");
    if (ctx.carrierHzHandle == 0) { ctx.error = "invalid carrierHz handle"; return ctx; }

    ctx.modIndexHandle = ctx.engine.getEndpointHandle("modIndex");
    if (ctx.modIndexHandle == 0) { ctx.error = "invalid modIndex handle"; return ctx; }

    ctx.ratioHandle = ctx.engine.getEndpointHandle("ratio");
    if (ctx.ratioHandle == 0) { ctx.error = "invalid ratio handle"; return ctx; }

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
