// G1A Step 0b — Single-Performer Smoke Test
// Proves: Cmajor C++ SDK can load, parse, link, and render a block of audio.
// NO concurrent performers. DE-RISK ONLY.

#define CMAJOR_DLL 1

// CHOC_ASSERT -> standard assert (avoids platform dialogs in console app)
#include <cassert>
#undef CHOC_ASSERT
#define CHOC_ASSERT(x) assert(x)

#include "cmajor/API/cmaj_Engine.h"

#include <iostream>
#include <iomanip>
#include <cmath>

// ── Helper: print DiagnosticMessageList ──────────────────────────
static void printMessages(const cmaj::DiagnosticMessageList& messages,
                          const char* stage)
{
    if (messages.empty()) return;
    std::cerr << "[" << stage << "] " << messages.size() << " message(s):\n";
    std::cerr << messages.toString();
}

// ── Helper: check Result ─────────────────────────────────────────
static void checkResult(cmaj::Result r, const char* context)
{
    if (r != cmaj::Result::Ok)
    {
        std::cerr << "WARNING [" << context << "]: result="
                  << static_cast<int32_t>(r) << "\n";
    }
}

// ── main ─────────────────────────────────────────────────────────
int main()
{
    std::cout << "=== G1A Step 0b: Single-Performer Smoke Test ===\n\n";

    // ── STEP 0: Load DLL ─────────────────────────────────────────
    std::cout << "Loading CmajPerformer.dll... ";
    if (!cmaj::Library::initialise("CmajPerformer.dll")) {
        std::cerr << "FAILED — cannot load CmajPerformer.dll\n";
        return 1;
    }
    std::cout << "OK (version: " << cmaj::Library::getVersion() << ")\n\n";

    // ── STEP 1: Create Engine ────────────────────────────────────
    std::cout << "Creating engine... ";
    auto engine = cmaj::Engine::create();
    if (!engine) {
        std::cerr << "FAILED — Engine::create() returned null\n";
        return 2;
    }
    std::cout << "OK\n\n";

    // ── STEP 2: Parse Cmajor source ──────────────────────────────
    std::cout << "Parsing Gain processor... ";
    cmaj::DiagnosticMessageList messages;
    cmaj::Program program;

    // Use the Gain processor from the grounding: 50% gain, DC=1.0 → expect 0.5
    const char* cmajorSource = R"cmajor(
        processor Gain
        {
            input  stream float in;
            output stream float out;

            void main()
            {
                loop
                {
                    out <- in * 0.5f;
                    advance();
                }
            }
        }
    )cmajor";

    if (!program.parse(messages, "internal", cmajorSource)) {
        std::cerr << "FAILED\n";
        printMessages(messages, "parse");
        return 3;
    }
    std::cout << "OK\n";

    if (!messages.empty()) {
        printMessages(messages, "parse (warnings/notes)");
    }

    // ── STEP 3: Configure BuildSettings ──────────────────────────
    std::cout << "Configuring build settings... ";
    engine.setBuildSettings(cmaj::BuildSettings()
        .setFrequency(44100)
        .setMaxBlockSize(512)
        .setSessionID(123456));
    std::cout << "OK\n";

    // ── STEP 4: Load program into engine ─────────────────────────
    std::cout << "Loading program... ";
    messages.clear();
    if (!engine.load(messages, program, {}, {})) {
        std::cerr << "FAILED\n";
        printMessages(messages, "load");
        return 4;
    }
    printMessages(messages, "load");
    if (messages.hasErrors()) {
        std::cerr << "Load had errors\n";
        return 4;
    }
    std::cout << "OK\n";

    // ── STEP 5: Get endpoint handles (AFTER load, BEFORE link) ──
    std::cout << "Getting endpoint handles... ";
    auto inputHandle  = engine.getEndpointHandle("in");
    auto outputHandle = engine.getEndpointHandle("out");
    // EndpointHandle is uint32_t; 0 is invalid (no endpoint found)
    if (inputHandle == 0 || outputHandle == 0) {
        std::cerr << "FAILED — invalid handle(s)\n";
        return 5;
    }
    std::cout << "OK (in=" << inputHandle << ", out=" << outputHandle << ")\n";

    // ── STEP 6: Link ─────────────────────────────────────────────
    std::cout << "Linking... ";
    messages.clear();
    if (!engine.link(messages)) {
        std::cerr << "FAILED\n";
        printMessages(messages, "link");
        return 6;
    }
    printMessages(messages, "link");
    if (messages.hasErrors()) {
        std::cerr << "Link had errors\n";
        return 6;
    }
    std::cout << "OK\n";

    // ── STEP 7: Create Performer ─────────────────────────────────
    std::cout << "Creating performer... ";
    auto performer = engine.createPerformer();
    if (!performer) {
        std::cerr << "FAILED\n";
        return 7;
    }
    std::cout << "OK\n";

    // ── STEP 8: Set block size ───────────────────────────────────
    constexpr uint32_t BLOCK_SIZE = 256;
    std::cout << "Setting block size = " << BLOCK_SIZE << "... ";
    auto r = performer.setBlockSize(BLOCK_SIZE);
    checkResult(r, "setBlockSize");
    std::cout << "OK\n";

    // ── STEP 9: Set input frames (DC=1.0) ────────────────────────
    std::cout << "Setting input frames (DC=1.0)... ";
    // Create interleaved buffer: 1 channel × 256 frames, all 1.0
    auto inputBuf = choc::buffer::createInterleavedBuffer(
        1, BLOCK_SIZE, []() { return 1.0f; });

    // AllocatedBuffer has no public .data; use getView() to access layout
    r = performer.setInputFrames(inputHandle, inputBuf.getView().data.data, BLOCK_SIZE);
    checkResult(r, "setInputFrames");
    std::cout << "OK\n";

    // ── STEP 10: Advance (render one block) ──────────────────────
    std::cout << "Advancing (rendering one block)... ";
    r = performer.advance();
    checkResult(r, "advance");
    std::cout << "OK\n";

    // ── STEP 11: Copy output frames ──────────────────────────────
    std::cout << "Copying output frames... ";
    choc::buffer::InterleavedBuffer<float> outputBuf(1, BLOCK_SIZE, false);
    r = performer.copyOutputFrames(outputHandle,
                                   outputBuf.getView().data.data,
                                   BLOCK_SIZE);
    checkResult(r, "copyOutputFrames");
    std::cout << "OK\n\n";

    // ── VERIFY: Print first 8 samples, check they're ~0.5 ────────
    std::cout << "=== Output samples (first 8 of " << BLOCK_SIZE << ") ===\n";
    std::cout << std::fixed << std::setprecision(6);

    // AllocatedBuffer::getView() -> BufferView which has public Layout .data
    const float* samples = outputBuf.getView().data.data;
    bool allValid = true;
    bool allNonTrivial = true;
    for (uint32_t i = 0; i < 8 && i < BLOCK_SIZE; ++i) {
        float val = samples[i];
        std::cout << "  [" << i << "] = " << val;

        // Check within reasonable range of expected 0.5
        if (std::abs(val - 0.5f) > 0.01f) {
            std::cout << "  *** DEVIATION from 0.5";
            allValid = false;
        }

        if (std::isfinite(val) && val == 0.0f) {
            allNonTrivial = false;
        }

        std::cout << "\n";
    }

    std::cout << "\n=== VERDICT ===\n";
    if (allValid && allNonTrivial) {
        std::cout << "PASS: Single-performer audio render succeeded.\n";
        std::cout << "All output samples ~0.5 (Gain 50% applied to DC=1.0 input).\n";
    } else if (!allValid) {
        std::cout << "WARNING: Some output samples deviated from expected 0.5.\n";
        std::cout << "The performer DID render, but values are unexpected.\n";
    } else {
        std::cout << "WARNING: Output samples were all zero (non-trivial check failed).\n";
    }

    std::cout << "\nEngine version: " << cmaj::Library::getVersion() << "\n";
    std::cout << "XRuns: " << performer.getXRuns() << "\n";
    if (auto* err = performer.getRuntimeError())
        std::cout << "Runtime error: " << err << "\n";

    return allValid && allNonTrivial ? 0 : 1;
}
