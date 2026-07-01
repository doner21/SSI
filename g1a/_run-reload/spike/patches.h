// patches.h — the two locked Cmajor source strings (HARNESS-SPEC.md §3).
//
// Two self-oscillating sine processors an OCTAVE apart (440 Hz / 880 Hz) so the
// reload moves spectral energy from one DISTINCT DFT bin to another (the
// property R3 verifies: 440 present pre-window, 880 present post-window). They
// differ ONLY in the frequency constant, so SineB is a GENUINELY INDEPENDENT
// JIT compile — not a clone of SineA's program/IR (the §2.1 "B is really a
// different program" probe).
//
// Form follows SDK-GROUNDING.md §5 Option B:
//     out <- sin(phase);
//     phase = addModulo2Pi(phase, float(freq * processor.period * twoPi));
// Phase is fixed at 0 at the first advanced block (deterministic, no randomness
// in the DSP), amplitude 1.0.
#pragma once

namespace g1a {

// Performer A — SineA : 440 Hz (A4), self-oscillating, no input.
// Loaded into Engine A on the MAIN thread before any RT work (the live performer).
inline const char* SINE_A_SOURCE = R"cmajor(
processor SineA
{
    output stream float out;

    float phase;

    void main()
    {
        loop
        {
            out <- sin (phase);
            phase = addModulo2Pi (phase, float (440.0 * processor.period * twoPi));
            advance();
        }
    }
}
)cmajor";

// Performer B — SineB : 880 Hz (A5, one octave up), self-oscillating, no input.
// Compiled into Engine B on the WORKER thread at runtime while A is live
// (the background-compiled performer).
inline const char* SINE_B_SOURCE = R"cmajor(
processor SineB
{
    output stream float out;

    float phase;

    void main()
    {
        loop
        {
            out <- sin (phase);
            phase = addModulo2Pi (phase, float (880.0 * processor.period * twoPi));
            advance();
        }
    }
}
)cmajor";

} // namespace g1a
