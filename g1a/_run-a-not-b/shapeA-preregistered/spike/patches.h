// patches.h — Cmajor patch sources for the G1A "A ≠ B" live-swap spike.
//
// A = FreqSine (canonical, UNCHANGED): input value float freq, AMP=0.25.
// B = FM2op (2-operator FM voice): a STRUCTURALLY DIFFERENT processor with its
//     own input-endpoint schema (carrierHz, modIndex, ratio, out). Added VERBATIM
//     from PRE-REGISTRATION-A-NOT-B.md §2 so the verifier's recomputed B-patch
//     SHA-256 (over the §2 fenced block) matches the SHA the harness emits into
//     metrics.json.
//
// A and B can no longer share one engine/program (their schemas differ): the
// harness builds engineA from FREQ_SINE_SOURCE and engineB from FM2OP_SOURCE.
//
// NOTE: Cmajor's sin() returns float64; it is explicitly cast to float32 for the
// `output stream float out` in both patches.
#pragma once

namespace g1a {

// FreqSine — amplitude AMP=0.25, phase 0 at first advance(), input value float freq.
// DSP: out <= float(AMP * sin(phase));   // PATCH-FIX (canonical): doubled-twoPi removed
//      phase = addModulo2Pi(phase, float(twoPi * freq * processor.period));  // UNCHANGED
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

// FM2op — B PATCH. Added VERBATIM from PRE-REGISTRATION-A-NOT-B.md §2 (the fenced
// `cmajor` block, byte-for-byte incl. its leading comment lines and trailing
// newline). The in-process SHA-256 over exactly these bytes is emitted to
// metrics.json as b_source_sha256 and recomputed by the verifier against §2.
inline const char* FM2OP_SOURCE = R"cmajor(// B PATCH — LOCKED. 2-operator FM voice. AMP=0.25. Harmonic (ratio default 1.0),
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
