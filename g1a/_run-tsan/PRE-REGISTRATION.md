# G1A TSan/Linux Certification — PRE-REGISTRATION (LOCKED)

**Track:** SSI DAW — Track 1A ThreadSanitizer certification pass. Cross-builds the proven Windows concurrency + reload-bridge harness logic for Linux x64 under `-fsanitize=thread` to certify **host-side** race-freedom that Windows (no TSan) could only approximate.
**Phase:** PRE-REGISTRATION LOCK. This document is written **before any TSan result exists**. No build is run, no C++ is shipped, no measured number appears in this document. Every numeric threshold below is a **pre-committed prediction / requirement**, not a measurement.
**Source of truth (verified):**
- `C:/Users/doner/SSI/g1a/_run/SDK-GROUNDING.md` (§4 API sequence, §6.2 TSan-unavailable-on-Windows)
- `C:/Users/doner/SSI/g1a/_run-reload/RELOAD-GROUNDING.md` (§1–§5 two-Engine pattern, atomic-index swap, safe release, host-side crossfade)
- `C:/Users/doner/SSI/g1a/_run/ATT_RUN_REPORT.md` — Windows concurrency pass = **FINAL PASS** (two performers proven: Gain 0.5, XRuns 0, ASan clean, bit-exact)
- `C:/Users/doner/SSI/g1a/_run-reload/ATT_RUN_REPORT.md` — Windows reload-bridge pass = **FINAL PASS** (background-compile → atomic swap → live click-free crossfade → safe release, ASan clean, bit-exact across R=5 seeded repeats)
- `C:/Users/doner/SSI/g1a/_run-tsan/RESEARCH-MEMO-FEASIBILITY.md` — Linux x64 `libCmajPerformer.so` v1.0.3159 ships in `cmajor.linux.x64.zip` on GitHub releases; headers identical; WSL2 Ubuntu present on this host
- `C:/Users/doner/SSI/g1a/_run-tsan/TSAN-REALITY-MEMO.md` — exact `clang++-18 -std=c++17 -fsanitize=thread -g -O1` invocation; `TSAN_OPTIONS`; control-race detector-liveness protocol; honest scoping (prebuilt `.so` + JIT-DSP not instrumented; atomics not reported; `-O1` accepted false-negative risk; WSL2 ≠ RTOS)

**Decisions inherited (NOT relitigated here):**
- **D-B DECIDED:** a **bespoke C++ host** over Cmajor's **native C++ API** (SDK-GROUNDING §4). **NOT** a JUCE plugin host, **NOT** cmaj standalone.
- **Concurrency is PROVEN** (first-pass FINAL PASS): two live performers can be owned, advanced, and mixed concurrently, ASan-clean, bit-exact, zero xruns.
- **Reload-bridge is PROVEN spike-grade on Windows** (reload-pass FINAL PASS): a live performer CAN be background-JIT-replaced, atomic-swapped, and live-crossfaded click-free with safe release, ASan-clean, bit-exact across R=5 seeded repeats.
- This pass does **not** re-test those results. It adds the **ThreadSanitizer host-side certification** — the stronger standard that Windows (no TSan in MSVC or clang-cl — SDK-GROUNDING §6.2) could only approximate via ASan + deterministic adversarial-interleaving stress + a static no-unsynchronized-shared-mutable-state audit. The Windows reload-bridge PASS already demonstrated the mechanism **works**; this pass certifies it is **host-side race-free** under a genuine thread-race certifier.
- Out of scope for this pass (later passes): event-replay, transport-sync, latency-compensation, multi-authority, macOS, production soak (§10).

**Claim labels used throughout:**
- **[ARCH]** — an architectural commitment of the pass (how the cert is built / what is measured).
- **[SPIKE]** — a claim whose evidentiary standard originated as Windows spike-grade; here promoted to a stronger TSan-cert standard.
- **[SPIKE→CERT]** — a claim whose evidence is upgraded from Windows spike-grade to Linux TSan-cert grade by this pass.
- **[GATE]** — a binary, decision-forcing pass/fail criterion that this pre-registration locks.

**Integrity crux (non-negotiable, applies to every section):** It must be **structurally possible for this certification to FAIL.** The metrics below are constructed so that real defects (TSan not actually linked; control race not caught; RT thread uninstrumented; genuine host race on the swap/crossfade/release path; stubbed/mocked performer instead of the real `.so`; a different code path certified than Windows; too-short a run hiding rare races; a host-file race hidden by an over-broad suppression) produce real failures, not so that the cert is guaranteed to pass. Concrete failure paths each metric catches are enumerated in §2.4. A specification under which the cert **cannot** fail is a falsifier-defeating fraud and is explicitly out of bounds. See §2.

---

## 1. Hypotheses

### 1.1 Primary hypothesis H1 (the TSan/Linux certification claim) [GATE][SPIKE→CERT]

> **H1 (directional).** The **SAME** concurrency + reload-bridge host logic that passed on Windows (two-performer concurrent ownership/advance/mix + background-JIT-compile → `std::atomic<uint32_t>` active-index swap → live per-sample `α`-linear crossfade → COM-atomic safe release after crossfade), **cross-built for Linux x64 under `clang++-18 -std=c++17 -fsanitize=thread -g -O1` and run under ThreadSanitizer with `history_size=7`**, produces **ZERO host-side nonsuppressed data-race reports AND ZERO warning reports** across **BOTH** the concurrent two-performer run **AND** the live hot-swap/crossfade — certifying the host-side race-freedom that Windows (no TSan) could only approximate.

The directional prediction is: *the host-side C++ harness (thread creation, atomic-index handoff, `bReady` publication, crossfade buffer access, safe-release ordering, and all supporting infrastructure) is free of data races as certified by ThreadSanitizer on Linux x64, with the detector proven live and covering the RT render path, and with functional equivalence to the Windows reference confirming the certified system is the real one, not a stub.*

### 1.2 Explicit FALSIFICATION condition (what would refute H1) [GATE]

> **H1 is FALSIFIED** if **any** of the following occurs under the locked run (§4–§5):
> **(a) Feasibility sub-gate fails (T1):** the Linux Cmajor runtime `libCmajPerformer.so` v1.0.3159 is unobtainable, unloadable, wrong architecture, or fails to link against the host harness — **branch (ii) falls back** (§9).
> **(b) TSan build fails (T1):** the harness or control-race or RT-probe binary fails to compile/link under `-fsanitize=thread`, or `ldd|grep tsan` shows no TSan runtime linked — **T1 FAIL**.
> **(c) Detector not live (T3a):** the **control-race binary** (deliberate non-atomic-int race, two threads, no sync — built on the same host/toolchain/run with the **identical** `-fsanitize=thread` invocation **and with the suppressions file active**) does **not** produce `≥1` `WARNING: ThreadSanitizer: data race` report — the TSAN-CLEAN metric is **meaningless**, the cert run is **invalidated**, **DETECTOR_LIVENESS_FAIL** (§9 sub-clause).
> **(d) RT thread uncovered (T3b):** the **RT-probe binary** (separate `-DTSAN_RT_PROBE` build planting an unsynchronized sentinel write on the RT render path + a side thread, fenced so TSan observes it) does **not** produce a data-race report naming a frame **inside** the RT render loop — the RT thread is **uninstrumented**, the TSAN-CLEAN metric is **meaningless**, **DETECTOR_LIVENESS_FAIL** (§9 sub-clause).
> **(e) Genuine host race (T2):** the main TSan certification run reports **any** nonsuppressed data-race or warning, or a suppressed race whose stack trace includes a host translation unit — **T2 FAIL → branch (i) falls back** (§9).
> **(f) Stubbed/mocked performer (T4):** `ldd`/`nm`/version capture does **not** confirm the real `libCmajPerformer.so` v1.0.3159 was loaded, or the spectral endpoint shows the synthesized output of a fake tone generator instead of the real Cmajor-performed 440/880 Hz sines — **T4 FAIL** (anti-stub).
> **(g) Different code path certified (T4):** the module-by-module logic-diff witness shows the Linux port **diverges** from the Windows harness (different thread/swap/crossfade/release logic), or the spectral cross-platform equivalence recompute fails — **T4 FAIL** (anti-divergence).
> **(h) Run incomplete / too-short (T4):** `runs_completed < R` or `blocks_per_run ≠ N` — **T4 FAIL**.
> **(i) Over-broad suppression hiding a host race (T2 sup):** the frozen `tsan.suppressions` file suppresses a frame inside any host translation unit, or the suppressed-race count in a host TU is `> 0` at verifier audit — **T2 FAIL** (§2.4 FT-supp).

A single failing metric ⇒ **FINAL FAIL** ⇒ the pre-declared fallback (§9) fires verbatim. There is no partial pass.

### 1.3 What is explicitly NOT claimed by this pass [ARCH]

- This pass certifies **host-side** race-freedom only. ThreadSanitizer does **not** instrument the prebuilt `libCmajPerformer.so` or the JIT-compiled DSP code emitted by the Cmajor engine at runtime (TSAN-REALITY-MEMO §2.2). The `.so` and JIT output are opaque to TSan. This is stated as a first-class honest limitation in §11.
- TSan does **not** report races on `std::atomic` operations (by design — TSAN-REALITY-MEMO §2.3). The atomic-index handoff (`std::atomic<uint32_t>` with `release`/`acquire`) is expected to produce zero TSan reports when correctly implemented; this is **desired**, not an evasion.
- This pass does **not** certify heap corruption, memory leaks, or undefined behaviour (those need ASan, UBSan — TSan only detects data races). The Windows ASan passes already covered heap safety.
- Timing/xrun certification under TSan is **explicitly disclaimed** (TSan imposes 2–5× slowdown — TSAN-REALITY-MEMO §4.6; xrun is informative-only, not gated). The xrun gate was already passed on Windows.
- This pass is **not** a production soak, not a statistical guarantee against rare-event races, not a macOS/WSL2-RTOS certification.

---

## 2. Integrity crux — why this certification can genuinely FAIL

### 2.1 The TSan certification stacks new failure surfaces on top of the proven Windows results [ARCH]

The TSan/Linux pass introduces **five** new failure surfaces beyond Windows, each independently capable of breaking the certification:

1. **Feasibility: Linux runtime unobtainable or unlinkable.** The harness requires `libCmajPerformer.so` v1.0.3159 (Linux x64) to load and link. RESEARCH-MEMO-FEASIBILITY confirms it **ships** in `cmajor.linux.x64.zip`; T1 **verifies** it actually downloads, loads under WSL2 glibc, and links. A glibc/LLVM mismatch or `dlopen` failure at runtime is a real failure — **T1** exists to catch this, with a pre-declared branch (ii) if it fires.
2. **TSan build or link failure.** The harness + control-race + RT-probe binaries must compile under `-fsanitize=thread` and link the TSan runtime. A missing TSan runtime on the WSL2 Ubuntu host is a real failure — **T1** exists to catch this.
3. **TSan silently non-functional (detector-liveness gap).** TSan may be absent from the linked binary, suppressed globally, or the run may exercise no concurrent access patterns — **T3a** (control race) + **T3b** (RT-probe) exist to catch this. If either is not caught, the TSAN-CLEAN metric is meaningless and the cert is aborted with `DETECTOR_LIVENESS_FAIL`.
4. **Genuine host-side data race on the swap/crossfade/release path.** The harness exercises two threads concurrently (RT render + background compile) and hot-swaps performers via the atomic-index handoff. A race on the `activeIndex` transition, on the `bReady` publication, on the crossfade host buffers, on the `performers[2]` array, or on the safe-release ordering produces a real TSan report — **T2** exists to catch this, with branch (i) if it fires.
5. **Anti-fraud: certified the wrong system.** A stubbed `SineGenerator` instead of the real `.so`, a port that silently changed the thread/swap logic, or a suppression that hides a host-file race — **T4** (anti-stub), **T4** (logic-diff witness), and **T2 sup** (suppression discipline verifier check) exist to catch this.

### 2.2 The cert is NOT rigged to pass [ARCH]

- **T1 can genuinely fail.** If `libCmajPerformer.so` v1.0.3159 is the wrong glibc ABI for the WSL2 Ubuntu install, the `dlopen` inside `cmaj::Library::initialise()` will fail → T1 FAIL → branch (ii). The memo's HIGH confidence is NOT a guarantee; T1 is the honest verification gate.
- **T3a can genuinely fail.** If TSan is not linked (missing `-fsanitize=thread` at link), or the TSan runtime library is not installed in WSL2, the control binary will run without any data-race report (the program still "works" — just with a corrupted `shared_bad` counter) → T3a FAIL → `DETECTOR_LIVENESS_FAIL`. The verifier's `ldd|grep tsan` check also catches this.
- **T3b can genuinely fail.** If the RT render thread is compiled without TSan instrumentation (e.g., a separate translation unit missing `-fsanitize=thread`), or if TSan's `-O1` promotion elides the planted sentinel write, the probe race will not be caught → T3b FAIL → `DETECTOR_LIVENESS_FAIL`.
- **T2 can genuinely fire.** A torn read on the `activeIndex` handoff, a use-after-free on the old performer released too early, a concurrent write to a crossfade host buffer by both the RT and worker threads without `bReady`/`activeIndex` mediating → real TSan report → T2 FAIL → branch (i).
- **T4 can genuinely fail.** A logic-diff witness that shows the RT render loop changed, or a spectral endpoint that shows a synthetic sine instead of a Cmajor-performed one → T4 FAIL.

### 2.3 No metric is auto-satisfied [GATE]

Each of the four metrics has a concrete, pre-committed numeric threshold (§5) and at least one named real-world failure path (§2.4). The Windows PASSes do **not** imply the TSan certification passes — TSan correctness, detector liveness, .so linkability, and Linux port fidelity are **four new gates** not exercised by the Windows passes.

### 2.4 Enumerated failure paths (each maps to a metric) [ARCH]

| # | Failure path | Caught by |
|---|---|---|
| FT1 | Linux Cmajor runtime unobtainable / wrong architecture (arm64 not x86_64) / wrong glibc ABI / missing headers | **T1** feasibility sub-gate → branch (ii) |
| FT2 | TSan build fails to compile or link against the runtime (missing `libclang_rt.tsan-x86_64.so`, missing `-lpthread -ldl`) | **T1** (`build_ok ∧ link_ok ∧ tsan_enabled_in_binary`) |
| FT3 | TSan silently off — not linked at all, or globally suppressed so every race is hidden — but the main run appears "clean" | **T3a** (control race not caught) ⇒ `DETECTOR_LIVENESS_FAIL` |
| FT4 | TSan instruments non-RT threads only; the RT render path is uninstrumented (separate TU, missing `-fsanitize=thread`) | **T3b** (RT-probe race not caught) ⇒ `DETECTOR_LIVENESS_FAIL` |
| FT5 | Genuine host race on the `activeIndex` handoff, the `bReady` publication, or the safe-release ordering | **T2** (nonsuppressed race report > 0) → branch (i) |
| FT6 | Stubbed/mocked performer — a synthetic sine generator instead of the real `libCmajPerformer.so` rendering `SineA`/`SineB` | **T4** (anti-stub: `ldd`/`nm`/version showing real `.so` + spectral 880-present post-window) |
| FT7 | Certified a **different** code path than the Windows harness — port silently changed the thread/swap/crossfade/release logic | **T4** (logic-diff witness module-for-module + spectral cross-platform equivalence) |
| FT8 | Run too short to surface a rare race — e.g., N=100 instead of N=10000, or R=1 instead of R=5 | **T4** (`blocks_rendered==N`; `runs_completed==R`) + **T2** (`history_size=7` + R seeded interleaving stress) |
| FT-supp | A host-file data race hidden by an over-broad suppression entry matching a host translation unit | **T2 sup** (verifier check: `tsan.suppressions` matches **only** `libCmajPerformer.so` frames; any suppressed race in a host TU = FAIL; suppressed-race count logged) |

---

## 3. TSan certification strategy (the conjunction) [ARCH]

The Windows reload-bridge PASS established feasibility with ASan + deterministic adversarial-interleaving stress + a static no-unsynchronized-shared-mutable-state audit. The TSan/Linux pass upgrades this to **host-side thread-race certification** via the conjunction of four sub-proofs:

**(A) T3a — Detector-liveness (control race).** A separate binary with a deliberate non-atomic race (two threads, no sync) built and run under the **identical** `-fsanitize=thread` invocation — proving TSan is **alive** on this host/toolchain/run. Without this, a clean main run is meaningless.

**(B) T3b — RT-thread-coverage witness.** A separate `-DTSAN_RT_PROBE` build that plants an unsynchronized sentinel write on the RT render path — proving TSan **covers the RT thread's render loop** (the exact code path whose race-freedom is being certified). Without this, a clean main run could mean TSan only instrumented non-RT code.

**(C) T2 — TSAN-CLEAN main run (the certification gate).** Zero nonsuppressed data-race or warning reports across the full concurrent two-performer + hot-swap/crossfade run, all `R=5` seeded interleaving repeats, under `history_size=7`. This is the **primary certification metric** — but it is **meaningful only given (A)∧(B)**. A clean run without a proven-live detector is a non-result.

**(D) T4 — Functional equivalence + completeness (anti-stub, anti-divergence).** The Linux run reproduces the Windows audio invariants (spectral presence of the correct tones, mix identity within tolerance, click-free crossfade, within-Linux bit-exact determinism across R repeats, bounded cross-platform spectral equivalence, correct block completeness and swap location) — proving the certified system is the **SAME** one as proven on Windows, not a stub or a divergent port.

**The conjunction is: T3a ∧ T3b make T2 meaningful; T2 is the certification gate; T4 confirms it's the right system.** All four must pass. The TSan-cert proof artifact (§6) must exist and be internally consistent.

### 3.1 Host-side scope is explicit and honest

This certification covers **host-side** C++ code only — the harness's thread creation, atomic-index handoff, `bReady` publication, `performers[2]` array access, crossfade host buffer reads/writes, Performer API call ordering, safe-release protocol, and all supporting infrastructure (metrics, proof writing, main.cpp orchestration). It does **not** cover races inside the prebuilt `libCmajPerformer.so` or inside JIT-compiled Cmajor DSP code (TSAN-REALITY-MEMO §2.2, §7). This scoping is stated in §11 and in the `TSAN_OPTIONS` suppressions discipline (§4.5).

---

## 4. The locked run design (what is executed)

> Full buildable detail is in the companion `HARNESS-SPEC.md`. This section locks the parameters the verifier checks against; the spec implements **these and only these**.

### 4.1 Toolchain (locked) [ARCH]
- **Primary compiler: clang++-18** under **WSL2 Ubuntu** on this host. C++17 (`-std=c++17`).
- **TSan flags: `-fsanitize=thread -g -O1`** (both compile and link; `-O1` is the TSan-recommended optimisation level — TSAN-REALITY-MEMO §1.1, §4.5).
- **Preprocessor: `-DCMAJOR_DLL=1`**. Include root `C:/Users/doner/SSI/g1a/_run/cmajor-headers/include` (mapped via WSL2 `/mnt/c/Users/doner/SSI/g1a/_run/cmajor-headers/include`); single include `cmajor/API/cmaj_Engine.h`.
- **Runtime: `libCmajPerformer.so` v1.0.3159** from `cmajor.linux.x64.zip` (GitHub releases — RESEARCH-MEMO-FEASIBILITY §1), loaded via `cmaj::Library::initialise("libCmajPerformer.so")`. **`LD_LIBRARY_PATH`** must include the directory containing the `.so`. The `.so` is NOT TSan-instrumented (prebuilt binary — honest limitation §11).
- **Link: `-lpthread -ldl`**. `-fsanitize=thread` at link time auto-links the TSan runtime (verify via `ldd|grep tsan`).
- **Pre-declared single-swap fallback compiler: g++-12** — only if clang++-18 fails to link the TSan runtime against `libCmajPerformer.so`. Declared now as the **only** allowed toolchain deviation.
- **Header-usage corrections are mandatory** (inherited from Windows): `AllocatedBuffer` has no public `.data` → use `.getView().data.data`; `Result` is `enum class : int32_t {Ok = 0, …}`; `EndpointHandle` is `uint32_t` (check `!= 0`); redefine `CHOC_ASSERT(x)` to `assert(x)`.

### 4.2 Audio + timeline parameters (locked, inherited verbatim from `_run-reload §4.2` except for SEED_MASTER) [ARCH]
- Sample rate **`fs = 48,000` Hz**; block size **`B_block = 256` frames** (mono, 1 channel); **`N = 10,000`** total blocks rendered to the master output (≈ 53.333 s).
- Per-block real-time budget **`D_block = B_block / fs = 256 / 48000 = 5.33333… ms`** — **informative only under TSan** (TSan 2–5× slowdown; timing is NOT gated in this pass).
- **`K_COMPILE_START = 100`** — the block on A's RT timeline at which the worker thread is dispatched to background-compile B.
- **`K_XFADE_START = 4000`** — the pre-committed block at which the live A→B crossfade begins.
- **`W_XFADE = 64`** blocks — the locked crossfade window length.
- **`K_SWAP = K_XFADE_START + W_XFADE = 4064`** — the pre-committed block at which the crossfade completes, `activeIndex` is `store`d `0→1`, and output becomes pure B.
- **`P_MEAS = 512`** blocks — pre/post measurement-window length. Pre-window `A_PRE = [K_XFADE_START − P_MEAS, K_XFADE_START) = [3488, 4000)`; post-window `B_POST = [K_SWAP, K_SWAP + P_MEAS) = [4064, 4576)`.
- Repeats **`R = 5`** seeded interleaving repeats.
- Master seed **`SEED_MASTER = 0x6121A_0003`** (fixed registered constant, **distinct** from the first pass's `0x6121A_0001` and the reload pass's `0x6121A_0002`; drives only the interleaving-perturbation schedule).

Timeline phases on the master output: blocks `[0, 4000)` pure A; blocks `[4000, 4064)` live crossfade; blocks `[4064, 10000)` pure B.

### 4.3 The two reload patches (locked, identical to `_run-reload §4.3`) [ARCH] — *music register is load-bearing here*
Two **self-oscillating sine** processors, an **octave apart** (A4=440 Hz → A5=880 Hz) in **distinct DFT bins** for the endpoint-presence test:
- **Performer A — `SineA` :** a `440` Hz sine (A4), self-oscillating, no input stream. Output endpoint `out` (stream float). Loaded into **Engine A on the main thread before any RT work**.
- **Performer B — `SineB` :** an `880` Hz sine (A5, one octave up), self-oscillating, no input stream. Output endpoint `out` (stream float). Loaded into a **second `cmaj::Engine` (Engine B) on the WORKER thread at runtime** while A is live.
- Control bin **`660` Hz** (present in neither patch) for leakage/false-positive test.

Exact patch source shapes are locked in `HARNESS-SPEC.md`. Phase initialisation is fixed (phase 0 at each performer's first advanced block).

### 4.4 Thread + swap + crossfade model (locked, identical to `_run-reload §4.4`, ported to Linux primitives) [ARCH]
- **Main thread:** loads `Library`; creates Engine A; parses/loads/links `SineA`; creates Performer A; allocates the 2-element `cmaj::Performer performers[2]` array, `std::atomic<uint32_t> activeIndex{0}`, and host crossfade buffers. Starts the RT thread and (at `K_COMPILE_START`) the worker thread.
- **RT thread (single, owns the render loop):** for each block `k = 0..N−1`: `idx = activeIndex.load(acquire)`; render the active performer(s) and write the master output for block `k`. Outside the crossfade window only `performers[idx]` is advanced; inside `[K_XFADE_START, K_SWAP)` **both** performers are advanced and host-mixed. Uses `clock_gettime(CLOCK_MONOTONIC)` for per-block timing (informative only).
- **Worker (BG compile) thread:** dispatched at `K_COMPILE_START`. Runs the full synchronous `Engine::create → Program::parse(SineB) → setBuildSettings → load → getEndpointHandle("out") → link → createPerformer` on **Engine B**. On success, publishes `performers[1]` and signals `bReady.store(true, release)` — **all before `K_XFADE_START`**.
- **The atomic swap:** at block `K_SWAP`, after the crossfade window has fully elapsed, the RT thread performs `activeIndex.store(1, release)`.
- **Safe release:** the old performer `performers[0]` is released (`performers[0] = {}`) **only after** (i) block ≥ `K_SWAP` **and** (ii) the RT thread has performed at least one `load(acquire)` returning `1`.
- **Crossfade math:** per-sample linear `α(n) = n / (W_XFADE · B_block − 1)`, `α(0)=0.0`, `α(last)=1.0`. `out[n] = (1 − α(n)) · A[n] + α(n) · B[n]`. Both A and B advance every crossfade block.
- **No `std::atomic<cmaj::Performer>`:** the swap uses an `std::atomic<uint32_t>` index.
- **Fence/`yield` on spin:** any spin barrier or RT-probe sentinel access carries a compiler fence or `std::this_thread::yield()` so TSan observes the memory access (TSAN-REALITY-MEMO §2.2).

### 4.5 ThreadSanitizer options (locked) [ARCH][GATE]

```bash
TSAN_OPTIONS=report_atomic_races=1:halt_on_error=0:history_size=7:suppressions=<path>/tsan.suppressions:second_deadlock_stack=1
```

- `report_atomic_races=1` — report even atomic-vs-non-atomic races (conservative).
- `halt_on_error=0` — do **not** halt on first report; capture **all** races in one run.
- `history_size=7` — maximum race detection depth (TSAN-REALITY-MEMO §4.7; the RT audio run spans ~53 s; deep history avoids false negatives across long intervals).
- `suppressions=<path>/tsan.suppressions` — the frozen suppressions file (§4.6).
- `second_deadlock_stack=1` — show both stacks in race reports.

### 4.6 Suppressions discipline (locked) [ARCH][GATE]

The frozen `tsan.suppressions` file must observe these rules, enforced by the verifier:
1. Suppression entries match **only** frames inside `libCmajPerformer.so` — never host translation units.
2. The entry must use the `race:libCmajPerformer.so` pattern (suppress races where **at least one** access is inside the prebuilt `.so`).
3. The control-race binary (§5.3 T3a) and the RT-probe binary (§5.3 T3b) must be caught **with the suppressions file active** — proving the suppressions do not mask genuine host races.
4. Any suppressed race whose stack trace includes a host translation unit = **T2 FAIL**.
5. The `suppressed_race_count` is logged in `metrics.json`. The verifier cross-checks that no suppressed race involves a host TU.

---

## 5. The four pre-registered TSan certification metrics + the TSan-cert PROOF artifact

Each metric has an **exact, deterministic, computable estimator** and a **concrete pre-committed PASS threshold**. All thresholds are predictions/requirements fixed now, never measurements.

### 5.1 T1 — Clean Linux TSan BUILD [GATE]

**Estimator.** Under WSL2 Ubuntu with clang++-18 (or the pre-declared gcc-12 fallback), the following must all succeed:
- `host_build_ok` — the main harness binary (`g1a_tsan_host`) compiles and links under `-fsanitize=thread -g -O1 -std=c++17`.
- `control_build_ok` — the control-race binary (`tsan_control_race`) compiles and links under the **identical** TSan invocation.
- `rtprobe_build_ok` — the RT-probe binary (`g1a_tsan_rtprobe`) compiles and links under the identical TSan invocation plus `-DTSAN_RT_PROBE`.
- `link_ok` — all binaries link without errors, with `-lpthread -ldl`.
- `tsan_enabled_in_binary` — verified via **both** `ldd <binary> \| grep tsan` (TSan runtime dynamically linked) **and** `nm <binary> \| grep __tsan_` (TSan instrumentation symbols present) **and** `readelf -d <binary> \| grep tsan` (TSan shared library in NEEDED entries).

**Feasibility sub-gate [GATE]:**
- `linux_runtime_obtained` — `libCmajPerformer.so` is downloaded from `cmajor.linux.x64.zip` (GitHub releases, v1.0.3159) and placed in a path accessible to WSL2.
- `runtime_arch == x86_64` — verified via `file libCmajPerformer.so` (ELF 64-bit LSB shared object, x86-64).
- `runtime_version == 1.0.3159` — the `.so` version matches the Windows DLL version. Closest-version deviation (e.g., `1.0.3066` instead of `1.0.3159`) must be **escalated** and the run downgraded to **spike-grade** (explicitly UNCERTIFIED); it is never silently accepted.

**PASS threshold (all must hold):** `host_build_ok ∧ control_build_ok ∧ rtprobe_build_ok ∧ link_ok ∧ tsan_enabled_in_binary ∧ linux_runtime_obtained ∧ runtime_arch==x86_64 ∧ runtime_version==1.0.3159` (closest-version-deviation → escalate, never silent).
**Falsifies via:** FT1, FT2 (§2.4).

### 5.2 T2 — TSAN-CLEAN main run [GATE] (the certification gate, meaningful only given T3a∧T3b)

**Estimator.** The main harness binary (`g1a_tsan_host`) is executed under the locked `TSAN_OPTIONS` (§4.5) for all `R=5` seeded interleaving repeats. The full `stderr` output (TSan diagnostics) and the `metrics.json` summary are captured.
- `nonsuppressed_race_reports` — count of `WARNING: ThreadSanitizer: data race` reports whose stack trace does **not** include a frame inside `libCmajPerformer.so` (i.e., the reported race involves only host TUs, or host-vs-host with no `.so` frame). Gated: **must be 0**.
- `warning_reports` — count of all TSan WARNING lines of any kind (data race, lock-order-inversion, signal-unsafe, etc.). Gated: **must be 0**.
- `runs_completed` — number of repeats that ran to completion. Gated: **`== R`**.
- `blocks_per_run` — number of master-output blocks written per repeat. Gated: **`== N`**.
- `suppressed_race_count` — count of suppressed races (those exclusively inside `libCmajPerformer.so`). Logged in `metrics.json`.
- **Suppression discipline verifier check:** `host_suppressed_races == 0` — no suppressed race involves a host TU. Enforced by the verifier inspecting the TSan run log.

**PASS threshold (all must hold):** `nonsuppressed_race_reports == 0 ∧ warning_reports == 0 ∧ runs_completed == R ∧ blocks_per_run == N ∧ host_suppressed_races == 0` (suppressed-race count logged). Any nonzero → **FINAL FAIL → branch (i)**.
**Falsifies via:** FT5, FT8, FT-supp (§2.4).

### 5.3 T3 — DETECTOR-LIVENESS [GATE] (anti-fraud core — two sub-gates, BOTH required)

#### T3a — Control-race binary (detector alive)

**Estimator.** A **separate** binary (`tsan_control_race`) containing a deliberate data race (two threads, shared non-atomic `int`, no synchronisation) is built on the same WSL2 Ubuntu host with the **identical** `-fsanitize=thread -g -O1 -std=c++17` invocation **and run with the same `TSAN_OPTIONS` including the suppressions file active**. The `stderr` output is captured.

- `control_race_caught` — `true` iff `stderr` contains `≥1` occurrence of `WARNING: ThreadSanitizer: data race`.

**PASS threshold:** `control_race_caught == true`.

#### T3b — RT-thread-coverage witness (RT render path instrumented)

**Estimator.** A **separate** build of the harness sources with `-DTSAN_RT_PROBE` that plants an **unsynchronized write** on the RT render path (a sentinel counter incremented by the RT thread inside the block loop, read by a side thread with no synchronisation — a deliberate race). The sentinel write carries a **compiler fence** (`std::atomic_signal_fence(std::memory_order_seq_cst)` or equivalent) so TSan observes it as a memory access (TSAN-REALITY-MEMO §2.2: a register-promoted spin without a fence is invisible to TSan). The binary is built and run once; `stderr` is captured.

- `rtprobe_race_caught` — `true` iff `stderr` contains `≥1` occurrence of `WARNING: ThreadSanitizer: data race` **and** the race report names a frame **inside the RT render loop** (e.g., `rt_render.cpp` or equivalent).

**PASS threshold:** `rtprobe_race_caught == true`.

#### T3 composite PASS: `T3a ∧ T3b`

**DETECTOR_LIVENESS_FAIL:** if either T3a or T3b fails → the TSAN-CLEAN metric (T2) is **meaningless** → the cert run is **invalidated** → **FINAL FAIL** with the quotable sub-clause (§9).
**Falsifies via:** FT3, FT4 (§2.4).

### 5.4 T4 — FUNCTIONAL EQUIVALENCE + COMPLETENESS [GATE] (anti-stub, anti-divergence)

**Estimator (six independent checks, all required):**

- **(a) Spectral endpoint (re-locked spectral thresholds, inheriting the Windows reload pass's R3c model).** Goertzel magnitude at `440`, `880`, `660` over `A_PRE` and `B_POST`, normalised by solo references: `rel440_pre = mag_Apre(440)/mag_Asolo(440)`; `rel880_post = mag_Bpost(880)/mag_Bsolo(880)`; `leak880_pre = mag_Apre(880)/mag_Asolo(440)`; `leak440_post = mag_Bpost(440)/mag_Bsolo(880)`; `relCtl = max(mag_Apre(660), mag_Bpost(660)) / max(mag_Asolo(440), mag_Bsolo(880))`. PASS: `rel440_pre ≥ 0.40 ∧ rel880_post ≥ 0.40 ∧ leak880_pre ≤ 0.10 ∧ leak440_post ≤ 0.10 ∧ relCtl ≤ 0.10`.

- **(b) Mix identity (within Linux).** Over the `W_XFADE · B_block = 16,384` crossfade-window samples: `mix_err = max_n |master_crossfade[n] − ((1 − α(n)) · A_xfade[n] + α(n) · B_xfade[n])|`. `alpha_monotone = true` iff `α` is non-decreasing with `α(0)==0.0` and `α(last)==1.0`. PASS: `mix_err ≤ 1e-6 ∧ alpha_monotone == true`.

- **(c) Click-free.** `click_max = max_{k=1..TOTAL_SAMPLES-1} |master[k] − master[k−1]|`. PASS: `click_max ≤ S_click = 0.15` (sits above the natural 880 Hz per-sample slew `2π·880/48000 ≈ 0.115` and below a real click).

- **(d) Completeness + swap location.** `blocks_rendered == N (= 10000)`; `swap_block == K_SWAP (= 4064)`; `swap_count == 1`; `dropped_blocks == 0`; `duplicated_blocks == 0`; `old_perf_released_post_crossfade == true`.

- **(e) Within-Linux bit-exact determinism.** All `R=5` per-stream SHA-256 hashes (full master, A-stream, B-stream, crossfade region) are **identical** across repeats. `repro_ok == true`.

- **(f) Cross-platform equivalence (bounded, anti-stub — NOT full per-sample bit-exact).** Spectral magnitudes from the Linux run match the Windows reference (from `_run-reload` artifacts) within `EPS_SPECTRAL`:
  - `|rel440_pre_linux − rel440_pre_windows| ≤ EPS_SPECTRAL = 0.05`
  - `|rel880_post_linux − rel880_post_windows| ≤ EPS_SPECTRAL = 0.05`
  - `|click_max_linux − click_max_windows| ≤ 0.05`
  **Plus** a short-prefix per-sample cross-platform sanity check over the **first 256 samples only** (before phase-drift between the different JIT/libm backends dominates): `max_{k=0..255} |master_linux[k] − master_windows[k]| ≤ EPS_PREFIX = 1e-4`. **Full-output per-sample bit-exactness across platforms is EXPLICITLY DISCLAIMED** (§11) — the Linux Cmajor JIT and `libm` differ from Windows by ULPs; phase accumulation over 2.56M samples will diverge for benign, non-race reasons.

**PASS threshold (all must hold):** (a) spectral endpoints pass; (b) `mix_err ≤ 1e-6 ∧ alpha_monotone`; (c) `click_max ≤ 0.15`; (d) completeness + swap; (e) `repro_ok == true`; (f) `|rel_linux − rel_windows| ≤ 0.05` for each spectral metric **and** short-prefix `≤ 1e-4`.
**Falsifies via:** FT6, FT7, FT8 (§2.4).

### 5.5 Cross-platform equivalence tolerance justification [ARCH]

The Linux Cmajor JIT compiler backend (LLVM JIT under Linux glibc `libm`) differs from Windows (LLVM JIT under MSVC CRT) at the ULP level for trigonometric functions. Over `N · B_block = 2,560,000` samples, per-sample phase accumulation will cause benign drift exceeding `1e-5` in later samples — this is NOT a data race and NOT a bug. The cross-platform gate is therefore **spectral** (frequency-domain — the tones are at the right frequencies with the right relative magnitudes) plus a **bounded short-prefix** per-sample check (before drift dominates), NOT a full-output per-sample bit-exactness gate. This is the honest engineering choice: a full-output per-sample `1e-5` gate would produce a **false FAIL** on a genuine, correct system.

---

## 6. TSan-cert PROOF artifact (must exist and be machine-checkable) [GATE]

A concrete saved bundle under `C:/Users/doner/SSI/g1a/_run-tsan/artifacts/` (WSL2 path: `/mnt/c/Users/doner/SSI/g1a/_run-tsan/artifacts/`) that the verifier can inspect without re-running the cert:

1. **`build.log`** — the exact build invocation (compiler, flags, link line), `ldd` output for each binary showing TSan runtime linked, `nm __tsan_*` output showing instrumentation symbols for each binary, `readelf -d` NEEDED entries showing TSan `.so`, `file libCmajPerformer.so` output confirming arch=x86_64, version capture (`strings libCmajPerformer.so | grep "1.0.3159"` or equivalent).

2. **`tsan.suppressions`** — the frozen suppressions file (must match only `libCmajPerformer.so` frames — verifier audit).

3. **`ldd.txt`** + **`runtime_version.txt`** — evidence the real `libCmajPerformer.so` v1.0.3159, x86_64 was loaded (anti-stub — FT6).

4. **`logic_diff_witness.txt`** — a module-by-module mapping of the Linux port to the Windows harness: for each source module (`engine_setup.*`, `swap.*`, `rt_render.*`, `crossfade.*`, `bg_compiler.*`, `perturb.*`, `metrics.*`, `proof.*`, `main.cpp`), describe the exact porting changes made (Windows→Linux primitives only: `QueryPerformanceCounter`→`clock_gettime`, `_CrtSetDbgFlag`→n/a, MSVC-specific→libc/pthreads, `std::atomic`/Cmajor API unchanged) — proving the thread/swap/crossfade/release logic is structurally identical (anti-divergence — FT7).

5. **`tsan_main_run.log`** — the full `stderr` output of the main harness TSan run (all `R` repeats), parsed for: `nonsuppressed_race_reports==0`, `warning_reports==0`, suppressed-race count, and suppression-frame audit (no host-TU in suppressed races).

6. **`tsan_control.log`** — the `stderr` output of the control-race binary, confirming `WARNING: ThreadSanitizer: data race` is present (T3a).

7. **`tsan_rtprobe.log`** — the `stderr` output of the RT-probe binary, confirming a data-race report naming a frame inside the RT render loop (T3b).

8. **Audio dumps:** the four required — `A_pre.wav` (pre-window pure-A, `P_MEAS·256` samples), `B_post.wav` (post-window pure-B, `P_MEAS·256` samples), `crossfade_region.wav` (`W_XFADE·256 = 16,384` samples), `full_output.wav` (entire `N·256 = 2,560,000` master output) — plus `A_solo.wav`, `B_solo.wav` (T4 normalisation references) and `A_xfade.wav`, `B_xfade.wav` (T4 mix-identity inputs). Each mono, `fs=48000`, 32-bit float `.wav`, or raw `float32 .pcm` with a `.json` sidecar.

9. **`metrics.json`** — machine-checkable JSON containing:
   - `run_params`: all locked parameters (§7) plus the exact build invocation string, `TSAN_OPTIONS` string, and the Windows reference spectral values used for T4f.
   - `T1`: `host_build_ok`, `control_build_ok`, `rtprobe_build_ok`, `link_ok`, `tsan_enabled_in_binary`, `linux_runtime_obtained`, `runtime_arch`, `runtime_version`, `pass` (bool), threshold string.
   - `T2`: `nonsuppressed_race_reports`, `warning_reports`, `suppressed_race_count`, `host_suppressed_races`, `runs_completed`, `blocks_per_run`, `pass` (bool), threshold string.
   - `T3`: `T3a` (`control_race_caught`), `T3b` (`rtprobe_race_caught`), `detector_alive` (bool), `rt_covered` (bool), `pass` (bool), threshold string.
   - `T4`: `rel440_pre`, `rel880_post`, `leak880_pre`, `leak440_post`, `relCtl`, `mix_err`, `alpha_monotone`, `click_max`, `blocks_rendered`, `swap_block`, `swap_count`, `dropped_blocks`, `duplicated_blocks`, `old_perf_released_post_crossfade`, `repro_ok` + the `R` per-stream SHA-256 hashes, `EPS_SPECTRAL` cross-platform diffs, `EPS_PREFIX` prefix max delta, Windows reference values, `pass` (bool), threshold string.
   - `tsan_clean`: bool (`T2 nonsuppressed==0 ∧ T2 warnings==0`).
   - `proof_complete`: bool.
   - `final_verdict`: `"PASS"` or `"FAIL"`.

**PASS threshold:** all nine components exist, are well-formed, and `metrics.json` is internally consistent with the dumps (its hashes match the dumped buffers; its verdict matches the conjunction).

---

## 7. Decision rule — FINAL PASS / FINAL FAIL (locked) [GATE]

The verdict is a **deterministic function** of §5, fixed before any result exists:

> **FINAL PASS** iff **all four metrics clear their thresholds** — `T1 ∧ T2 ∧ T3(a∧b) ∧ T4` — **AND** the TSan-cert proof artifact (§6) exists and is well-formed **AND** `tsan_clean == true` (restated as an independent gate).
>
> **FINAL FAIL** otherwise — i.e. **any** metric fails its threshold, **or** the proof artifact is missing/malformed, **or** `tsan_clean == false`, **or** `DETECTOR_LIVENESS_FAIL` (T3a or T3b not caught).

There is **no partial pass**. On **FINAL FAIL**, the pre-declared fallback (§9) fires verbatim. The verifier (§12) independently recomputes all metrics from the proof artifact; if any threshold was tuned, or either frozen file's SHA-256 changed, the run is FAILED regardless of the computed metrics.

| Condition | Verdict | Action |
|---|---|---|
| `T1 ∧ T2 ∧ T3(a∧b) ∧ T4` all pass **and** proof artifact exists **and** `tsan_clean == true` | **FINAL PASS** | Host-side race-freedom of the concurrency + reload-bridge engine is **TSan-certified** on Linux x64. The Windows spike-grade evidence is upgraded to certified status for the host-side claim. Investment in the reload bridge may proceed. Remaining un-certified surfaces: prebuilt `.so` internals, JIT-DSP internals, full TSan+xrun timing, later passes (§10). |
| T1 feasibility sub-gate fails (runtime unobtainable/unlinkable) | **FINAL FAIL → branch (ii)** | §9 branch (ii) fires verbatim. |
| Any metric fails (T1 build, T2 race, T3 liveness, T4 equivalence), **or** proof artifact missing/malformed, **or** `tsan_clean == false`, **or** `DETECTOR_LIVENESS_FAIL` | **FINAL FAIL → branch (i)** (genuine host race) **or** `DETECTOR_LIVENESS_FAIL` sub-clause | §9 fires verbatim for the appropriate branch. |

---

## 8. Locked-parameter summary [GATE]

Fixed at this pre-registration; may **not** change after any result exists: `fs = 48,000 Hz`; `B_block = 256` frames; `N = 10,000` blocks; `D_block = 5.33333 ms` (informative only under TSan); `K_COMPILE_START = 100`; `K_XFADE_START = 4000`; `W_XFADE = 64` blocks; `K_SWAP = 4064`; `P_MEAS = 512` blocks; `R = 5` repeats; `SEED_MASTER = 0x6121A_0003`; patches `SineA = 440 Hz` (Engine A, main thread, live), `SineB = 880 Hz` (Engine B, worker-thread runtime compile), control bin `660 Hz`; `std::atomic<uint32_t>` active-index swap; per-sample linear `α` crossfade; toolchain **clang++-18** primary, **g++-12** pre-declared single-swap fallback (only if clang TSan fails to link); `-std=c++17 -fsanitize=thread -g -O1 -DCMAJOR_DLL=1`; `-lpthread -ldl`; `TSAN_OPTIONS=report_atomic_races=1:halt_on_error=0:history_size=7:suppressions=tsan.suppressions:second_deadlock_stack=1`; suppressions match only `libCmajPerformer.so` frames; tolerances `rel440_pre ≥ 0.40`, `rel880_post ≥ 0.40`, `leak880_pre ≤ 0.10`, `leak440_post ≤ 0.10`, `relCtl ≤ 0.10`, `mix_err ≤ 1e-6`, `click_max ≤ 0.15`, `EPS_SPECTRAL = 0.05`, `EPS_PREFIX = 1e-4`; `nonsuppressed_race_reports == 0`, `warning_reports == 0`, `host_suppressed_races == 0`, `control_race_caught == true`, `rtprobe_race_caught == true`; runtime `libCmajPerformer.so v1.0.3159`, `x86_64`. The companion `HARNESS-SPEC.md` implements these **and only these**. Any deviation observed during execution **invalidates the run under this seed**; it does **not** license post-hoc re-tuning.

---

## 9. PRE-DECLARED FALLBACK (committed BEFORE results — quotable verbatim on FINAL FAIL) [GATE]

> **PRE-DECLARED FALLBACK — G1A TSan/Linux certification pass (committed before any result exists):**
>
> **Branch (i) — Genuine host data race found (T2 FAIL, or any metric FAIL other than T1 feasibility):**
>
> **`INVESTMENT-FREEZE on the concurrent/reload engine.`** Immediately halt all further investment in the live concurrent-performer and live-crossfade reload-bridge engine. Fall back to the **silence-boundary single-performer model** already PROVEN in pass 1 — a single-performer-at-a-time reload with NO live crossfade (the host stops performer A to digital silence at the boundary, background-compiles B, and only then starts performer B from silence). There is NO live A→B crossfade of two simultaneously-live performers in this fallback. The concurrent two-performer and live-crossfade reload mechanisms remain **FROZEN** until the specific data race(s) identified by TSan are **fixed AND re-certified** through a subsequent TSan run. The freeze **persists** through later passes (event-replay, transport-sync, latency-compensation, multi-authority — §10) — none may start until re-certification.
>
> **Branch (ii) — Linux Cmajor runtime UNOBTAINABLE/unlinkable (T1 feasibility sub-gate FAIL):**
>
> **`UNCERTIFIED — platform limitation.`** The data-race question CANNOT be certified on available infrastructure. The `libCmajPerformer.so` v1.0.3159 for Linux x64 either could not be obtained (download failed, zip corrupted, headers missing) or could not be loaded/linked under WSL2 Ubuntu (glibc/LLVM `dlopen` mismatch, missing symbol, wrong ABI). Keep the **Windows spike-grade evidence** (`_run-reload/ATT_RUN_REPORT.md` — FINAL PASS, ASan-clean, bit-exact deterministic adversarial-interleaving stress) as the **standing, explicitly UNCERTIFIED status**. The host-side data-race question remains **UNANSWERED**. **Escalate to Donald** for a platform/runtime decision: obtain a compatible Linux `.so`, cross-build the Cmajor runtime from source on WSL2, port to a native Linux host, or accept the Windows spike-grade evidence as sufficient for production.
>
> **DETECTOR_LIVENESS_FAIL sub-clause (T3a or T3b FAIL):**
>
> **`DETECTOR_LIVENESS_FAIL: the control-race binary did not produce a TSan data-race warning, or the RT-probe race was not caught. This means ThreadSanitizer is NOT functional on this host/toolchain/run. The TSAN-CLEAN certification is ABORTED. All G1A TSan cert evidence is INVALIDATED. No data-race claim can be made from this run.`** The TSan toolchain installation on the WSL2 Ubuntu host must be repaired and the cert re-attempted, or the Windows spike-grade evidence remains the standing UNCERTIFIED status. Escalate to Donald.
>
> These blocks are quotable **verbatim** by the shape's verdict phase on FINAL FAIL.

---

## 10. OUT OF SCOPE (explicit — these are LATER passes) [ARCH]

The following are **NOT** part of this TSan/Linux certification pass and are **not** gated here:
- **Event-replay across reload** (sample-accurate event/MIDI state carried from A to B across the swap).
- **Transport-sync** (shared tempo/playhead/transport preserved across the reload).
- **Latency-compensation** (aligning differing performer latencies across the swap).
- **Multi-authority** (more than one writer of `activeIndex` / multiple concurrent reload authorities).
- **macOS certification** (ThreadSanitizer on macOS is a separate pass).
- **Production soak** (extended run, thermal/paging stress, statistical rare-race hunting beyond R=5 seeded repeats).
- **Races inside `libCmajPerformer.so` internals** — the prebuilt `.so` is opaque and uninstrumented (TSAN-REALITY-MEMO §2.2).
- **Races inside JIT-compiled DSP code** — TSan does not instrument runtime-generated machine code (TSAN-REALITY-MEMO §2.2).
- **Heap corruption / memory leaks** — TSan ≠ ASan/UBSan (TSAN-REALITY-MEMO §7).
- **Hard-realtime/xrun certification under TSan** — TSan imposes 2–5× slowdown making the RT deadline impossible (TSAN-REALITY-MEMO §4.6); xrun is informative only in this pass.

---

## 11. Honest limitations (locked) [ARCH]

- **Host-side-only certification.** ThreadSanitizer certifies the host C++ harness code. The prebuilt `libCmajPerformer.so` and the JIT-compiled Cmajor DSP code are **not** instrumented. The certification covers the atomic-index handoff, the `bReady` publication, the `performers[2]` array access, the crossfade host buffer reads/writes, the safe-release ordering, and all supporting infrastructure. It does **not** certify the internals of the Cmajor runtime `.so` or the JIT output. (TSAN-REALITY-MEMO §2.2, §7)
- **Atomics not reported.** `std::atomic` operations are race-free by language semantics; TSan correctly does **not** report races on them. A clean report on the atomic-index handoff confirms **correct use** of the C++ memory model, not a detection gap. (TSAN-REALITY-MEMO §2.3)
- **`-O1` accepted false-negative risk.** `-O1` may promote some memory accesses to registers, removing TSan instrumentation. This is the standard TSan certification practice (`-O0` produces excessive false positives and 10–20× slowdown; `-O2`/`-O3` have higher false-negative risk). The `-O1` choice is a deliberate, documented trade-off. (TSAN-REALITY-MEMO §4.5)
- **WSL2 ≠ RTOS.** The Linux kernel under WSL2 is not a real-time OS; timing behaviour differs from bare-metal Linux and from Windows. Timing/xrun is explicitly not gated in this pass.
- **Cross-platform float divergence is expected and tolerated.** The Linux Cmajor JIT backend and `libm` differ from Windows at the ULP level. Per-sample phase accumulation over 2.56M samples will cause benign drift. The cross-platform gate is therefore **spectral + structural + bounded short-prefix**, not full-output per-sample bit-exact. This is the honest engineering choice. (TSAN-REALITY-MEMO §4 — implicit in JIT/math differences)
- **Rare-race residual.** `N = 10,000` blocks (≈ 53.3 s), `R = 5` seeded repeats with adversarial interleaving perturbations, and `history_size=7` maximise race-detection depth but do not provide a statistical guarantee against races with a period longer than the run or an interleaving not sampled by the `R=5` perturbation schedule. A production soak is out of scope (§10).
- **Single reload event.** One A→B reload per repeat. Not a repeated rapid-reload stress test.
- **No TSan+ASan combined run.** TSan and ASan are **incompatible** (cannot be used together). The Windows passes already covered heap safety (ASan). This pass covers data races only.

---

## 12. Verifier contract (falsifier-first) [GATE]

The orchestrator SHA-256-**freezes** `PRE-REGISTRATION.md` and `HARNESS-SPEC.md` immediately after they are written. An independent verifier later:

1. **FAILS the run if either frozen file's SHA-256 changed** (any threshold tuned, any parameter edited post-lock, any claim label altered).

2. **FAILS the run if any §5 threshold present in the executed run differs** from the value locked here (threshold tuning after results).

3. **Recomputes T1–T4 independently from the proof artifact** (§6) — not from the implementer's narrative:
   - Re-checks `build.log`: `ldd|grep tsan`, `nm __tsan_*`, `readelf -d`, `file libCmajPerformer.so`, version string — confirming TSan was linked and the real `.so` v1.0.3159 x86_64 was loaded.
   - Re-checks `tsan_control.log` — confirms `WARNING: ThreadSanitizer: data race` present (T3a).
   - Re-checks `tsan_rtprobe.log` — confirms data-race report naming an RT-loop frame (T3b).
   - Parses `tsan_main_run.log` — confirms `nonsuppressed_race_reports == 0`, `warning_reports == 0`, and no suppressed race involves a host TU (cross-reference with `tsan.suppressions`).
   - Re-runs Goertzel on `A_pre.wav`/`B_post.wav`/`A_solo.wav`/`B_solo.wav` for T4a.
   - Recomputes `mix_err` from `crossfade_region.wav`/`A_xfade.wav`/`B_xfade.wav` for T4b.
   - Recomputes `click_max` from `full_output.wav` for T4c.
   - Re-hashes every dumped buffer to confirm the `R` per-stream SHA-256 values and bit-reproducibility (T4e).
   - Recomputes the T4f cross-platform spectral diffs and short-prefix max delta against the Windows reference dumps (from `_run-reload/artifacts/`).

4. **Confirms the no-unsynchronized-shared-mutable-state design** on the swap/release path is honored: the only RT↔worker synchronization is `activeIndex` (+ `bReady` publication); the worker never touches the live performer; old-performer release is provably post-crossfade and post-acquire-load. Verifier inspects the `logic_diff_witness.txt` and cross-references against the TSan main run log.

5. **Audits the suppressions file** (`tsan.suppressions`): every entry matches only `libCmajPerformer.so` frames; no host TU is suppressed. FAILS if any suppression covers a host file.

6. **Confirms the control-race binary was caught WITH the suppressions file active** — proof that the suppressions do not globally mask all races.

7. **Confirms the RT-probe race was caught naming an RT-loop frame** — proof that the RT render path is TSan-instrumented.

8. **Confirms B was a genuinely different runtime compile** (T4a: 880 Hz present post-window in its distinct bin, absent pre-window; 440 Hz strong pre-window, weak post-window) and that the swap landed at the locked block (`swap_block == 4064`, `swap_count == 1`).

9. Issues **FINAL PASS** only if §7's conjunction holds; otherwise **FINAL FAIL** and quotes §9 verbatim (the appropriate branch).

---

## 13. Lock statement [GATE]

Every parameter, threshold, tolerance, patch, seed, thread/swap/crossfade model, decision branch, toolchain, `TSAN_OPTIONS` string, suppressions discipline, and verifier contract in §1–§12 is **fixed at this pre-registration and may not be changed after any result exists.** This document contains **no result, no measured number, and no code.** The companion `HARNESS-SPEC.md` (buildable blueprint, no actual code) must implement **these and only these.** The orchestrator will SHA-256-freeze both files immediately; the verifier (§12) FAILS the run if any hash changed or any threshold was tuned. **No TSan run is executed and no results are produced in this phase.**
