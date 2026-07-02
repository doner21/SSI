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
            out <- float (0.25 * sin (phase));
            phase = addModulo2Pi (phase, float (twoPi * freq * processor.period));
            advance();
        }
    }
}
)cmajor";

// FM2op — 2-operator FM voice.  A genuinely different Cmajor processor with
// its own input-endpoint schema (carrierHz, modIndex, ratio, out).
// AMP=0.25, modIndex default 1.0, ratio default 1.0.
// sin() returns float64 → cast to float32 for the stream.
inline const char* FM2OP_SOURCE = R"cmajor(
// B PATCH — LOCKED. 2-operator FM voice. AMP=0.25. Harmonic (ratio default 1.0),
// modIndex default 1.0 → peak instantaneous frequency = 2·carrierHz (band-limited enough
// to plausibly satisfy the S_CLICK=0.05 whole-output slew gate at the top palette freq 660 Hz:
// 0.25·2π·1320/48000 ≈ 0.0432 ≤ 0.05). sin() returns float64 → cast to float32 for the stream.
processor FM2op
{
    input value float carrierHz;   // carrier fundamental Hz — PARAM-CARRY target (A.freq -> B.carrierHz)
    input value float modIndex;    // FM modulation index          — DECLARED DEFAULT 1.0
    input value float ratio;       // modulator:carrier freq ratio  — DECLARED DEFAULT 1.0
    output stream float out;

    void main()
    {
        float cphase = 0.0f;   // carrier phase accumulator
        float mphase = 0.0f;   // modulator phase accumulator

        loop
        {
            float m = modIndex * sin (mphase);
            out <- float (0.25 * sin (cphase + m));
            cphase = addModulo2Pi (cphase, float (twoPi * carrierHz * processor.period));
            mphase = addModulo2Pi (mphase, float (twoPi * carrierHz * ratio * processor.period));
            advance();
        }
    }
}
)cmajor";

} // namespace g1a
