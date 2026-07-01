// patches.h — the two locked Cmajor source strings (HARNESS-SPEC.md §3).
//
// Two self-oscillating sine processors an OCTAVE apart (440 Hz / 880 Hz) so the
// mixed spectrum has energy in two DISTINCT DFT bins (the property M3 verifies).
// They differ ONLY in the frequency constant, so the two JIT compiles are
// genuinely independent programs (the §2.1 hidden-global-state probe).
//
// Form follows SDK-GROUNDING.md §5 Option B:
//     out <- sin(phase);
//     phase = addModulo2Pi(phase, float(freq * processor.period * twoPi));
// Phase is fixed at 0 at block 0 (deterministic, no randomness in the DSP).
#pragma once

namespace g1a {

// Performer A — SineA : 440 Hz (A4), self-oscillating, no input.
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

// Performer B — SineB : 880 Hz (A5), self-oscillating, no input.
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

// ── Control configuration patches (HARNESS-SPEC.md §6, the "fed" clause) ──
// Passthrough processors driven by a deterministic per-block input buffer via
// setInputFrames -> advance -> copyOutputFrames. Exercises the full concurrent
// input-fed path; gated M3 distinguishability stays on the sine pair above.
inline const char* PASS_A_SOURCE = R"cmajor(
processor PassA
{
    input  stream float in;
    output stream float out;

    void main()
    {
        loop
        {
            out <- in;
            advance();
        }
    }
}
)cmajor";

inline const char* PASS_B_SOURCE = R"cmajor(
processor PassB
{
    input  stream float in;
    output stream float out;

    void main()
    {
        loop
        {
            out <- in;
            advance();
        }
    }
}
)cmajor";

} // namespace g1a
