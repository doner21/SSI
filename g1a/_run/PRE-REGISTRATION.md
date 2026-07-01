# G1A Falsifier — PRE-REGISTRATION (LOCKED)

**Track:** SSI DAW — Track 1A concurrency spike (bespoke real-time C++ audio host over the Cmajor native C++ API).
**Phase:** PRE-REGISTRATION LOCK. This document is written **before any spike result exists**. No spike is run, no C++ is shipped, no measured number appears in this document. Every numeric threshold below is a **pre-committed prediction / requirement**, not a measurement.
**Source of truth (verified toolchain + SDK reality):** `C:/Users/doner/SSI/g1a/_run/SDK-GROUNDING.md` (API call sequence, `CMAJOR_DLL=1`, header dependency chain, sanitizer matrix §6.2, per-Performer single-thread model §6.2) and `C:/Users/doner/SSI/g1a/_run/SMOKE-TEST-REPORT.md` (single-performer render PROVEN: Gain 0.5, XRuns 0; ASan available & clean; TSan absent on Windows; verified header-usage corrections).
**Decisions already made (NOT relitigated here):**
- **D-B DECIDED:** a **bespoke C++ harness** (our own real-time audio host) over Cmajor's **native C++ API** (`cmaj::Engine` → `load` → `link` → `createPerformer` → `cmaj::Performer`; `Performer::setBlockSize/setInputFrames/advance/copyOutputFrames` called synchronously on a real-time thread). **NOT** a JUCE plugin host, **NOT** cmaj standalone.
- The narrow-first-pass falsifiable question is **FIXED** (see §1.1).
- Out of scope for this pass (later passes): event-replay, transport-sync, latency-compensation, crossfade/atomic patch swap, malleable live-reload, and full TSan/Linux certification (§10).

**Claim labels used throughout:**
- **[ARCH]** — an architectural commitment of the spike (how the host is built / what is measured).
- **[SPIKE]** — a claim whose evidentiary standard is **pilot/spike-grade Windows-only** evidence; the heavier standard (true data-race certification) is a **separate later Linux/TSan pass** (§10), not this run.
- **[GATE]** — a binary, decision-forcing pass/fail criterion that this pre-registration locks.

**Integrity crux (non-negotiable, applies to every section):** It must be **structurally possible for this spike to FAIL.** The metrics below are constructed so that real defects produce real failures, not so that the spike is guaranteed to pass. Concrete failure paths that the metrics are designed to catch are enumerated in §2.4. A specification under which the spike **cannot** fail is a falsifier-defeating fraud and is explicitly out of bounds. See §2.

---

## 1. Hypotheses

### 1.1 Primary hypothesis H1 (the concurrency claim) [GATE][SPIKE]

> **H1 (directional).** Two **live** Cmajor `cmaj::Engine`/`cmaj::Performer` instances — each owning its own JIT-compiled program, each driven from **its own real-time thread** — can be **owned, fed, advanced, and have their outputs MIXED (summed) CONCURRENTLY** inside the bespoke C++ host, for **N = 10,000 blocks** of **256 frames** at **48,000 Hz**, **with zero host-detected corruption, zero missed real-time deadlines, a correct non-trivial mixed signal, and bit-exact determinism + isolation**, **AND** the run is **AddressSanitizer-clean**.

The directional prediction is: *concurrent two-performer ownership/advance/mix in the bespoke host is feasible AT ALL on this Windows host, to the locked tolerances of §5.*

### 1.2 Explicit FALSIFICATION condition (what would refute H1) [GATE]

> **H1 is FALSIFIED** if **any** of the following occurs under the locked run (§4–§5): (a) any `Performer` API call returns a non-`Ok` `Result`, or any ASan / CRT heap-check violation is reported during the concurrent run (**M1 fails**); or (b) one or more blocks exceed the per-block real-time budget `D_block` (**xrun > 0**, **M2 fails**); or (c) the mixed output does not contain **both** performers' signals within tolerance, or the mix is not the true per-sample sum of the two performers within `ε_mix` (**M3 fails**); or (d) the rendered output is **not** bit-identical across the `R = 5` seeded interleaving repeats, **or** performer A's concurrent output differs by even one sample from A's solo output (and likewise for B) — i.e. running B perturbs A, evidencing hidden shared/global JIT state (**M4 fails**).

A single failing metric ⇒ **FINAL FAIL** ⇒ the pre-declared fallback (§8) fires verbatim. There is no partial pass.

### 1.3 What is explicitly NOT claimed by G1A [SPIKE]

- G1A does **not** claim a certified **absence of data races**. TSan does not exist on Windows under MSVC or clang-cl (SDK-GROUNDING §6.2; SMOKE-TEST §7). The Windows-feasible concurrency-correctness strategy here is **ASan-clean + deterministic high-iteration adversarial-interleaving stress with a bit-reproducibility invariant + a static no-unsynchronized-shared-mutable-state audit** (§3, §5). A **full TSan certification is pre-declared as a SEPARATE LATER Linux pass and is OUT OF SCOPE here** (§10). This Windows pass is **not** gated on that impossible-on-Windows measurement.
- G1A does **not** claim event-replay, transport-sync, latency-compensation, atomic/crossfade patch swap, or live-reload work concurrently. Those are **later passes** (§10).
- G1A is **pilot/spike-grade**: `N` is small (10,000 blocks ≈ 53.3 s of audio), `R = 5`, Windows-only, two trivial patches. A PASS clears the *cheap concurrency falsifier* so heavier bespoke-host investment may proceed; it is not a production concurrency guarantee.

---

## 2. Integrity crux — why this spike can genuinely FAIL

### 2.1 The hidden-global-state hypothesis (the thing that can break) [ARCH]

The SDK reality (SDK-GROUNDING §6.2) states the DLL is *believed* safe for "multiple Engines / Performers from separate threads," but flags this as **UNVERIFIED** — "the DLL may have hidden global JIT/LLVM state." The whole point of this spike is to test exactly that. Two **separate** `cmaj::Engine` instances, each JIT-compiling a **different** program (a 440 Hz sine and an 880 Hz sine — see §4.3), running on two threads, is the **strongest cheap probe** of hidden global JIT/LLVM state: if the LLVM JIT, a global allocator, a static symbol table, or a shared codegen buffer inside `CmajPerformer.dll` is not thread-isolated, the second performer can corrupt the first.

### 2.2 The spike is NOT rigged to pass [ARCH]

- **M4 isolation can genuinely differ.** A_concurrent is compared **bit-for-bit** against A_solo. Hidden global state ⇒ they differ ⇒ FAIL. Nothing in the host forces them equal.
- **M2 xruns can genuinely appear.** If a global JIT lock or allocator contention serializes `advance()`, per-block compute time can exceed the real-time budget `D_block = 5.333 ms` ⇒ xrun > 0 ⇒ FAIL.
- **M1 corruption/ASan can genuinely fire.** Concurrent use-after-free, buffer overrun, or a non-`Ok` `Result` from `advance`/`copyOutputFrames` ⇒ FAIL. ASan is verified working on this host (SMOKE-TEST §7) and is a real detector.
- **M3 mix can genuinely be wrong.** If one performer's buffer is clobbered, the DFT/Goertzel test will fail to find both 440 Hz and 880 Hz, or the per-sample sum identity will break.

### 2.3 No metric is auto-satisfied [GATE]

Each of the four metrics has a concrete, pre-committed numeric threshold (§5) and at least one named real-world failure path (§2.4). The single-performer baseline being already PROVEN (SMOKE-TEST §8) does **not** imply the concurrent case passes — that is precisely the unverified gap this spike exists to close.

### 2.4 Enumerated failure paths (each maps to a metric) [ARCH]

| # | Failure path | Caught by |
|---|---|---|
| F1 | Hidden global JIT/LLVM state: second Engine's compile/run corrupts first → A_concurrent ≠ A_solo | **M4** (isolation, bit-exact) |
| F2 | Data race on shared host buffer / allocator → output varies by interleaving | **M4** (bit-repro across R seeded interleavings) + **M1** (ASan) |
| F3 | Memory error (overrun / use-after-free / double-free) under concurrency | **M1** (ASan + CRT heap check) |
| F4 | Global lock / allocator contention serializes advance → per-block time > budget | **M2** (xrun count) |
| F5 | Buffer clobber / mixer error → a performer's signal missing or mix ≠ A+B | **M3** (Goertzel both-present + sum identity) |
| F6 | API-level failure under concurrency (`Result != Ok`) | **M1** (Result-code audit) |

---

## 3. Concurrency-correctness strategy (Windows-feasible, locked) [ARCH][SPIKE]

Because TSan is unavailable on Windows (SDK-GROUNDING §6.2), concurrency correctness is established by the **conjunction** of three Windows-feasible mechanisms, each independently checkable by the verifier:

1. **ASan-clean across the concurrent run** (`/fsanitize=address`, verified available — SMOKE-TEST §7), plus MSVC CRT debug-heap corruption checking (`_CrtSetDbgFlag(_CRTDBG_ALLOC_MEM_DF | _CRTDBG_CHECK_ALWAYS_DF)`). Detects memory corruption, overruns, use-after-free in the host-side code paths exercised concurrently.
2. **Deterministic high-iteration adversarial-interleaving stress with a bit-reproducibility invariant.** The two RT threads are run `R = 5` times; each repeat applies a **seeded** schedule of interleaving perturbations (yields/spins — §4.5, §5.4) to force different thread interleavings. The audio output **must be bit-identical across all `R` repeats**. A data race on shared state would make output interleaving-dependent → caught as a determinism failure. This is the Windows-feasible stand-in for TSan: races manifest as non-determinism.
3. **Static no-unsynchronized-shared-mutable-state audit (locked design constraint).** The host design (§4.4, and `HARNESS-SPEC.md`) is constrained so that **no shared mutable host state is touched by both threads without explicit synchronization**: each performer writes **only** its own pre-allocated output slot; the mixer reads a block's two slots **only after** a per-block barrier confirms both threads have written. The verifier checks the implementation honors this design (the only cross-thread synchronization is the locked barrier; no shared non-atomic mutable buffer is written by both threads). Cmajor's own model is respected: **each `Performer` is used from exactly one thread; `Engine` load/link happen single-threaded on the main thread before any RT thread starts** (SDK-GROUNDING §6.2).

**This conjunction is the locked concurrency-correctness metric for this pass. "TSan-clean" is NOT a pass requirement here** and is pre-declared as a separate later Linux pass (§10).

---

## 4. The locked run design (what is executed)

> Full buildable detail is in the companion `HARNESS-SPEC.md`. This section locks the parameters the verifier checks against; the spec implements **these and only these**.

### 4.1 Toolchain (locked, from verified reality) [ARCH]
- Compiler **MSVC `cl.exe` 19.50** (VS18 BuildTools), invoked under `vcvars64.bat`; **C++17** (`/std:c++17 /EHsc`).
- `/DCMAJOR_DLL=1`; include root `C:/Users/doner/SSI/g1a/_run/cmajor-headers/include`; single include `cmajor/API/cmaj_Engine.h`.
- DLL: `C:/Users/doner/SSI/g1a/_run/CmajPerformer.dll` (**v1.0.3159**), loaded via `cmaj::Library::initialise(...)`; copied next to the host `.exe`.
- ASan build adds `/fsanitize=address`; runtime needs `clang_rt.asan_dynamic-x86_64.dll` (present at `g1a/_run/`).

### 4.2 Audio parameters (locked) [ARCH]
- Sample rate **`fs = 48,000` Hz**; block size **`B_block = 256` frames** (mono, 1 channel each); blocks per performer **`N = 10,000`** (≈ 53.333 s).
- Per-block real-time budget **`D_block = B_block / fs = 256 / 48000 = 5.33333… ms`** (the deadline an xrun is measured against — §5.2).
- Repeats **`R = 5`** seeded interleaving repeats (§3.2, §5.4).
- Master seed **`SEED_MASTER = 0x6121A_0001`** (fixed registered constant; drives only the interleaving-perturbation schedule — the audio itself is deterministic).

### 4.3 The two concurrent Cmajor patches (locked) [ARCH] — *music register is load-bearing here*
Two **self-oscillating sine** processors, chosen so their mix is **unambiguously distinguishable** in the frequency domain (the musical register is load-bearing: the two tones are an **octave apart — A4 = 440 Hz and A5 = 880 Hz** — which places them in **distinct DFT bins**, so M3 can prove *both* signals survive the concurrent mix):
- **Performer A — `SineA` :** a 440 Hz sine (A4), self-oscillating, no input stream. Output endpoint `out` (stream float).
- **Performer B — `SineB` :** an 880 Hz sine (A5, one octave up), self-oscillating, no input stream. Output endpoint `out` (stream float).

Each is a separate program loaded into a **separate `cmaj::Engine`** (Engine A loads `SineA`; Engine B loads `SineB`) — deliberately two independent JIT compiles, to maximally probe hidden global JIT/LLVM state (§2.1). Exact patch source is locked in `HARNESS-SPEC.md`. Phase initialisation is fixed (phase 0 at block 0) so both renders are deterministic. (A "feed input" path is also exercised on a parallel control configuration — §4.6 — to honor the "fed" clause of the question without changing the primary signal-distinguishability design.)

### 4.4 Thread + mixer model (locked) [ARCH]
- **Main thread:** loads `Library`, creates Engine A and Engine B, parses/loads/links each program, creates Performer A and Performer B, calls `setBlockSize(256)` on each. **All `Engine` load/link is done here, single-threaded, before any RT thread starts** (SDK-GROUNDING §6.2).
- **RT thread A:** owns Performer A exclusively; per block: (optionally `setInputFrames`), `advance()`, `copyOutputFrames(out, slotA[k])`, signal barrier.
- **RT thread B:** owns Performer B exclusively; per block: same against `slotB[k]`.
- **Per-block barrier (the only cross-thread sync):** both threads rendezvous after writing block `k`; the **mixer** (main thread or a designated mixer step) then computes `mixed[k] = slotA[k] + slotB[k]` and advances both threads to block `k+1`. Each performer writes **only its own slot**; the mixer reads both slots **only after** the barrier. **No other shared mutable host state is written by both threads** (§3.3).

### 4.5 Adversarial-interleaving stress (locked) [ARCH]
- Repeat `r = 0`: **clean / timing-reference** run — **no** perturbation injected. M1 and **M2 (deadline/xrun) are measured on repeat 0 only** (perturbations would inflate timings; the deadline metric must reflect real compute cost, not injected sleeps).
- Repeats `r = 1..4`: each derives a deterministic perturbation schedule from `hash(SEED_MASTER, r)` and injects bounded yields/short spins at scheduled points in each RT thread to **force varied interleavings**. The audio output of every repeat (per performer and the mix) must be **bit-identical to repeat 0** (§5.4).

### 4.6 The isolation (solo) renders (locked) [ARCH]
Independently, render **A_solo** and **B_solo** single-threaded (no concurrency, same patch, same phase init, same N). M4 isolation compares A_concurrent (from repeat 0) **bit-for-bit** to A_solo, and B_concurrent to B_solo (§5.4). This is the decisive hidden-global-state probe.

---

## 5. The four pre-registered concurrency metrics + the concurrency-PROOF artifact

Each metric has an **exact, deterministic, computable estimator** and a **concrete pre-committed PASS threshold**. All thresholds are predictions/requirements fixed now, never measurements.

### 5.1 M1 — Concurrent advance completeness + memory-safety (ASan-clean) [GATE]
**Estimator.** Over the full concurrent run (both performers, `N = 10,000` blocks each, across all `R` repeats):
- `result_violations` = count of `Performer` API calls (`setBlockSize`, `setInputFrames`, `advance`, `copyOutputFrames`) returning a `Result` ≠ `Ok` (Result is `enum class : int32_t`, `Ok = 0` — SMOKE-TEST §4).
- `blocks_completed_A`, `blocks_completed_B` = number of successfully advanced+copied blocks per performer.
- `asan_violations` = count of AddressSanitizer reports during the ASan-build concurrent run; `crt_heap_violations` = count of CRT debug-heap corruption reports.

**PASS threshold (all must hold):** `result_violations = 0` **AND** `blocks_completed_A = 10,000` **AND** `blocks_completed_B = 10,000` (per repeat) **AND** `asan_violations = 0` **AND** `crt_heap_violations = 0`.
**Falsifies via:** F3, F6 (§2.4).

### 5.2 M2 — Real-time deadline integrity (zero xruns) [GATE]
**Estimator.** On the **clean repeat 0** only: for each block `k` and each performer, measure wall-clock compute time `t_k` (high-resolution `QueryPerformanceCounter`) for the `advance()` + `copyOutputFrames()` of that block, plus the per-block mixer-sum cost attributed to that block. Define an **xrun** as any block whose end-to-end per-block processing time exceeds the real-time budget: `xrun(k) ≡ t_k > D_block` where `D_block = 5.33333 ms` (§4.2). Report `xrun_count`, and the per-block distribution `p50`, `p99`, `max` (reported, not gated, except `max` enters the xrun count).

**PASS threshold:** `xrun_count = 0` over all `N = 10,000` blocks of both performers (i.e. `max per-block time ≤ D_block`). *(Reported alongside, not gated: `p99 ≤ 0.5 · D_block` is the registered headroom expectation — informative, not a gate, so a single non-corrupting near-budget block does not falsely fail; only an actual budget breach is an xrun.)*
**Falsifies via:** F4 (§2.4).

### 5.3 M3 — Mixed-output correctness (both signals present AND mix = true sum) [GATE]
**Estimator (two independent checks, both required):**
- **(a) Both-signals-present (Goertzel).** Compute the Goertzel magnitude of the concurrent **mixed** buffer (repeat 0, full `N·256 = 2,560,000` samples) at the two target frequencies `440 Hz` and `880 Hz`, and at a **control** frequency `660 Hz` (present in neither performer). Normalise each target by the magnitude obtained from the corresponding **solo** render at the same frequency: `rel440 = mag_mixed(440)/mag_Asolo(440)`, `rel880 = mag_mixed(880)/mag_Bsolo(880)`, `relCtl = mag_mixed(660)/max(mag_Asolo(440), mag_Bsolo(880))`.
- **(b) Mix-is-true-sum (per-sample identity).** Compute `mix_err = max_k |mixed[k] − (A_concurrent[k] + B_concurrent[k])|` over all `2,560,000` samples.

**PASS threshold (all must hold):** `rel440 ≥ 0.40` **AND** `rel880 ≥ 0.40` **AND** `relCtl ≤ 0.10` **AND** `mix_err ≤ ε_mix = 1e-6`.
**Falsifies via:** F5 (§2.4). *(A clobbered performer drops its `rel`; a mixer error or buffer cross-talk breaks `mix_err`.)*

### 5.4 M4 — Determinism + isolation (bit-exact) [GATE]
**Estimator (two independent checks, both required):**
- **(a) Interleaving determinism.** For each performer and the mix, compute the SHA-256 of the full rendered float buffer for **every** repeat `r = 0..4`. `repro_ok ≡` all `R` hashes are identical for A, identical for B, and identical for the mix (i.e. output is invariant under the seeded adversarial interleavings of §4.5).
- **(b) Isolation (no cross-performer perturbation).** `iso_A_err = max_k |A_concurrent[k] − A_solo[k]|`; `iso_B_err = max_k |B_concurrent[k] − B_solo[k]|` (repeat-0 concurrent vs §4.6 solo renders).

**PASS threshold (all must hold):** `repro_ok = true` (all `R = 5` per-stream hashes bit-identical) **AND** `iso_A_err = 0.0` **AND** `iso_B_err = 0.0` (exact float equality — running B must not change A by even one ULP, and vice versa).
**Falsifies via:** F1, F2 (§2.4) — the decisive hidden-global-state / data-race probes.

### 5.5 The concurrency-PROOF artifact (must exist and be machine-checkable) [GATE]
A concrete saved bundle under `C:/Users/doner/SSI/g1a/_run/artifacts/` that the verifier can inspect without re-running the spike:
1. **`trace.log`** — per-block, per-performer records: thread id, block index, `Result` code, per-block compute time (repeat 0), barrier-arrival ordering; plus the ASan/CRT run logs (stderr capture) for the ASan build.
2. **Rendered sample dumps** — `A_solo.wav`, `B_solo.wav`, `A_concurrent.wav`, `B_concurrent.wav`, `mixed.wav` (or raw `float32` `.pcm` dumps with a sidecar describing `fs`, channels, sample count). Mono, `fs = 48,000`, `N·256` samples each.
3. **`metrics.json`** — machine-checkable JSON containing, for each metric M1–M4: the computed estimator values, the locked threshold, and a boolean pass; plus `asan_clean` (bool), `result_violations`, `xrun_count`, `p50/p99/max` per-block times, `rel440/rel880/relCtl`, `mix_err`, the `R` per-stream SHA-256 hashes, `iso_A_err`, `iso_B_err`, the locked run parameters (`fs`, `B_block`, `N`, `R`, `SEED_MASTER`, DLL version `1.0.3159`), and the final verdict.

**PASS threshold:** all three components exist, are well-formed, and `metrics.json` is internally consistent with the dumps (e.g. its hashes match the dumped buffers).

---

## 6. Decision rule — FINAL PASS / FINAL FAIL (locked) [GATE]

The verdict is a **deterministic function** of §5, fixed before any result exists:

> **FINAL PASS** iff **all four metrics clear their thresholds** — `M1 ∧ M2 ∧ M3 ∧ M4` — **AND** the concurrency-PROOF artifact (§5.5) exists and is well-formed **AND** ASan is clean (`asan_violations = 0`, already part of M1, restated as an independent gate).
>
> **FINAL FAIL** otherwise — i.e. **any** metric fails its threshold, **or** the proof artifact is missing/malformed, **or** any ASan/CRT violation is reported.

There is **no partial pass**. On **FINAL FAIL**, the pre-declared fallback (§8) fires verbatim. The verifier (§9) independently recomputes the four metrics from the proof artifact; if any threshold was tuned, or either frozen file's SHA-256 changed, the run is FAILED regardless of the computed metrics.

| Condition | Verdict | Action |
|---|---|---|
| `M1 ∧ M2 ∧ M3 ∧ M4` all pass **and** proof artifact exists **and** ASan clean | **FINAL PASS** (pilot/spike-grade, Windows-only) | Concurrent two-performer mixing feasible AT ALL; bespoke-host investment may proceed to later passes (§10). Full TSan/Linux certification still owed (§10). |
| any metric fails, **or** proof artifact missing/malformed, **or** any ASan/CRT violation | **FINAL FAIL** | Fire §8 verbatim: investment-freeze → silence-boundary fallback. |

---

## 7. Locked-parameter summary [GATE]

Fixed at this pre-registration; may **not** change after any result exists: `fs = 48,000 Hz`; `B_block = 256` frames; `N = 10,000` blocks/performer; `D_block = 5.33333 ms`; `R = 5` repeats; `SEED_MASTER = 0x6121A_0001`; patches `SineA = 440 Hz`, `SineB = 880 Hz` (control bin `660 Hz`); two **separate** `cmaj::Engine` instances; one RT thread per performer + per-block barrier mixer; tolerances `ε_mix = 1e-6`, `iso_*_err = 0.0` (exact), `rel440 ≥ 0.40`, `rel880 ≥ 0.40`, `relCtl ≤ 0.10`, `xrun_count = 0`, `result_violations = 0`, `asan_violations = 0`; DLL `CmajPerformer.dll v1.0.3159`; toolchain MSVC `cl 19.50`, C++17, `/DCMAJOR_DLL=1`, `/fsanitize=address` for the ASan build. The companion `HARNESS-SPEC.md` implements these **and only these**. Any deviation observed during execution **invalidates the run under this seed**; it does **not** license post-hoc re-tuning.

---

## 8. PRE-DECLARED FALLBACK (committed BEFORE results — quotable verbatim on FINAL FAIL) [GATE]

> **PRE-DECLARED FALLBACK — G1A narrow first pass (committed before any result exists):**
>
> **On FINAL FAIL of the G1A concurrency spike, the verdict is: `investment-freeze on fail → silence-boundary fallback`.**
>
> **(1) Investment-freeze** means: **immediately HALT all further investment in the bespoke concurrent two-performer C++ host.** No additional engineering is spent on concurrent `cmaj::Performer` ownership/advance/mixing. The later passes (event-replay, transport-sync, latency-compensation, crossfade/atomic patch swap, malleable live-reload) are **NOT started**. The concurrency question is **escalated to Donald** for a platform decision. The freeze **persists until the concurrency-safety question is resolved on a TSan-capable platform** (Linux x64, `-fsanitize=thread`) — the separate later pass declared OUT OF SCOPE in §10.
>
> **(2) Silence-boundary fallback** means: the SSI DAW ships, in the interim, a **single-performer-at-a-time** execution model. **At most one `cmaj::Performer` is live and advancing at any instant.** Switching from one patch/instance to another **crosses a SILENCE BOUNDARY**: the outgoing performer is advanced to completion and released, the output is **held at digital silence (zero samples) across the boundary**, and only then is the incoming performer created/linked/advanced. **There is NO true concurrent mixing of two live performers** in this fallback — concurrent mixing remains blocked until the concurrency question passes on a TSan-capable platform (§10). This trades the concurrent-mix capability for the **already-PROVEN** single-performer correctness (SMOKE-TEST §8: Gain 0.5, XRuns 0).
>
> This block is quotable **verbatim** by the shape's verdict phase on FINAL FAIL.

---

## 9. Verifier contract (falsifier-first) [GATE]

The orchestrator SHA-256-**freezes** `PRE-REGISTRATION.md` and `HARNESS-SPEC.md` immediately after they are written. An independent verifier later:
1. **FAILS the run if either frozen file's SHA-256 changed** (any threshold tuned, any parameter edited post-lock).
2. **FAILS the run if any §5 threshold present in the executed run differs** from the value locked here (threshold tuning after results).
3. **Recomputes M1–M4 independently from the proof artifact** (§5.5) — not from the implementer's narrative — and confirms each boolean.
4. **Confirms ASan-clean** from the captured ASan run log.
5. **Confirms the no-unsynchronized-shared-mutable-state design** (§3.3) is honored by the implementation (only the locked barrier synchronizes the two threads; no shared non-atomic mutable buffer is written by both).
6. Issues **FINAL PASS** only if §6's conjunction holds; otherwise **FINAL FAIL** and quotes §8 verbatim.

---

## 10. OUT OF SCOPE (explicit — these are LATER passes) [ARCH]

The following are **NOT** part of this narrow first pass and are **not** gated here:
- **Event-replay** (sample-accurate event/MIDI replay across performers).
- **Transport-sync** (shared tempo/playhead/transport across performers).
- **Latency-compensation** (aligning differing performer latencies in the mix).
- **Crossfade / atomic patch swap** (hot-swapping a performer's program without silence; atomic IR swap).
- **Malleable live-reload** (recompiling/reloading a live performer while running).
- **Full ThreadSanitizer / data-race certification** — TSan does **not** exist on Windows under MSVC or clang-cl (SDK-GROUNDING §6.2; SMOKE-TEST §7). A certified absence of data races requires **cross-compiling this same harness for Linux x64 and running it under `-fsanitize=thread`**. That is a **separate later Linux pass** and is **explicitly out of scope here**; this Windows pass uses the §3 Windows-feasible conjunction instead and must **not** be gated on TSan.

---

## 11. Honest limitations (locked) [SPIKE]

- **Windows-only.** All evidence here is from one Windows x64 host with MSVC `cl 19.50` and `CmajPerformer.dll v1.0.3159`. Results may not transfer to other platforms/DLL versions.
- **No TSan.** Concurrency correctness rests on ASan + determinism-under-adversarial-interleaving + a static synchronization audit (§3), **not** on a thread-race certifier. A subtle race that happens to produce identical output under the `R = 5` sampled interleavings could escape detection; the load-bearing certification is the later Linux/TSan pass (§10).
- **Pilot/spike-grade, N small.** `N = 10,000` blocks (≈ 53.3 s) and `R = 5` repeats are deliberately small to make the falsifier cheap; they are not a soak test or a statistical concurrency guarantee.
- **Two trivial patches.** Two self-oscillating sines exercise concurrent JIT-compiled DSP execution but not the full surface of real patches (no inputs-driven feedback paths, no events). The "fed/advanced" clause is honored (§4.6) but the primary signal design favours frequency-domain distinguishability over input complexity.
- **Determinism assumes deterministic DSP.** The sine patches are deterministic by construction; if the DLL introduced nondeterministic fast-math/denormal handling, M4 would (correctly) flag it as a failure rather than a tolerance — this is intentional (exact-equality is the strict, honest bar).

---

## 12. Lock statement [GATE]

Every parameter, threshold, tolerance, patch, seed, thread-model, and decision branch in §1–§11 is **fixed at this pre-registration and may not be changed after any result exists.** This document contains **no result, no measured number, and no code.** The companion `HARNESS-SPEC.md` (implementation blueprint, no code this phase) must implement **these and only these**. The orchestrator will SHA-256-freeze both files immediately; the verifier (§9) FAILS the run if any hash changed or any threshold was tuned. **No spike is run and no results are produced in this phase.**
