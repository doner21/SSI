// patches.h — the single locked Cmajor patch (HARNESS-SPEC §3).
//
// FreqSine: an event-reactive sine with `input value float freq` (a latching
// frequency endpoint, driven per-block via setInputValue). All performers (A, B,
// reference performers, solo refs) are created from this same patch via
// engine.createPerformer().
//
// NOTE: Cmajor's sin() returns float64. It must be explicitly cast to float32
// for assignment to `output stream float out`.
#pragma once

namespace g1a {

// FreqSine — amplitude AMP=0.25, phase 0 at first advance(), input value float freq.
// DSP: out <= float(AMP * sin(phase));   // PATCH-FIX (PRE-REG §2): doubled-twoPi removed
//      phase = addModulo2Pi(phase, float(twoPi * freq * processor.period));  // accumulator UNCHANGED
inline const char* FREQ_SINE_SOURCE = R"cmajor(
processor FreqSine
{
    input value float freq;
    output stream float out;

    void main()
    {
        float phase = 0.0f;

        loop
        {
            out <- float (0.25 * sin (twoPi * phase));
            phase = addModulo2Pi (phase, float (twoPi * freq * processor.period));
            advance();
        }
    }
}
)cmajor";

} // namespace g1a
