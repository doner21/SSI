# TSan Reality Memo — G1A TSan/Linux Certification Pass

**Task:** task-2 (RESEARCH b — TSan reality)
**Date:** 2026-06-30  
**Status:** Planning/grounding only — NO code executed, NO measured results  
**Purpose:** Ground every ThreadSanitizer decision for the G1A TSan/Linux pre-registration and harness spec.

---

## 1. Invoking ThreadSanitizer on Linux x64

### 1.1 Clang invocation (preferred — primary target)

Clang has the most mature TSan implementation. Compile **and** link with the same flag:

```bash
# Compile (all translation units that participate in the harness)
clang++-18 -std=c++17 -fsanitize=thread -g -O1 \
  -I<cmajor-headers>/include \
  -DCMAJOR_DLL=1 \
  -c <source>.cpp -o <source>.o

# Link (TSan runtime linked automatically)
clang++-18 -fsanitize=thread -g -O1 \
  -o g1a_tsan_host \
  <object1>.o <object2>.o ... \
  -lpthread -ldl

# Verify TSan runtime is linked
ldd g1a_tsan_host | grep tsan
# Expected: libclang_rt.tsan-x86_64.so => ... (or equivalent)
```

**Key points:**
- `-fsanitize=thread` must be used for **both** compile and link stages.
- `-O1` is the recommended optimisation level for TSan — it provides enough instrumentation fidelity without the optimiser eliminating the instrumented loads/stores that TSan needs to observe. `-O2` and `-O3` risk false negatives (the optimiser may elide loads/stores TSan was tracking). `-O0` produces extremely noisy false positives.
- `-g` is essential — without debug info, TSan reports won't have source locations, making diagnosis impossible.
- `-lpthread` is required for any multi-threaded binary.
- `-ldl` may be needed if the binary uses `dlopen` (the Cmajor runtime loads `libCmajPerformer.so` dynamically).
- On some distributions, the TSan runtime needs to be installed separately. On Ubuntu 22.04/24.04 under WSL2: `apt install clang-18 libclang-rt-18-dev`.

### 1.2 GCC invocation (secondary target)

GCC 12+ ships TSan:

```bash
g++-12 -std=c++17 -fsanitize=thread -g -O1 \
  -I<cmajor-headers>/include \
  -DCMAJOR_DLL=1 \
  -c <source>.cpp -o <source>.o

g++-12 -fsanitize=thread -g -O1 \
  -o g1a_tsan_host \
  <object1>.o <object2>.o ... \
  -lpthread -ldl

lsan.suppressions  # Not needed for TSan — TSan uses its own suppression format
```

**Key GCC considerations:**
- GCC's TSan has historically been less mature than clang's. For some workloads, GCC TSan reports more false positives.
- The TSan runtime under GCC is `libtsan.so` (part of libgcc), not `libclang_rt.tsan-x86_64.so`.
- **Recommendation**: Use clang as the primary compiler for this certification pass. GCC is a secondary/validation target.

### 1.3 Required Ubuntu packages under WSL2

```bash
# For clang-18
sudo apt update
sudo apt install -y clang-18 llvm-18 llvm-18-dev libclang-rt-18-dev lld-18

# For GCC (alternative)
sudo apt install -y g++-12

# Build essentials
sudo apt install -y cmake ninja-build libpthread-stubs0-dev
```

### 1.4 Verifying TSan is functional at runtime

Set the TSan options environment variable:

```bash
export TSAN_OPTIONS="report_atomic_races=1:halt_on_error=0:history_size=7"
./g1a_tsan_host

# To halt on first data race (for CI/certification):
export TSAN_OPTIONS="halt_on_error=1:report_atomic_races=1:history_size=7"
```

**Suppression file (for known-safe races in the Cmajor runtime):**
```
# tsan.suppressions
race:libCmajPerformer.so
```

Invoke:
```bash
export TSAN_OPTIONS="suppressions=tsan.suppressions:report_atomic_races=1:history_size=7"
```

### 1.5 Build modes (for the harness spec)

| Build mode | Flags | Purpose |
|---|---|---|
| **Release** (no TSan) | `-O2 -DNDEBUG` | Baseline functional run, timing reference |
| **TSan** (primary cert) | `-fsanitize=thread -O1 -g` | The certification run — TSan instrumentation |
| **Control-race** (detector liveness) | `-fsanitize=thread -O1 -g` | Separate binary with planted race — MUST be caught |

---

## 2. What ThreadSanitizer Instruments

### 2.1 Memory accesses instrumented

TSan intercepts **every memory load and store** in compiled C/C++ code, at the LLVM IR level:

| Access type | Instrumented? | Notes |
|---|---|---|
| Normal memory reads/writes (global, stack, heap) | ✅ YES | Every `load`/`store` IR instruction |
| `std::atomic` load/store (any memory order) | ✅ YES | But TSan does NOT report races on atomics — they are intentionally race-free by language semantics |
| Mutex lock/unlock operations | ✅ YES (via interception) | `pthread_mutex_lock`, `std::mutex::lock`, etc. |
| Condition variable wait/signal | ✅ YES (via interception) | |
| Barrier operations | ✅ YES (via interception) | |
| Thread creation/join | ✅ YES (via interception) | |
| Dynamic memory allocator | ✅ YES (via interception) | `malloc`/`free` — tracks which thread freed memory and flags use-after-free |

### 2.2 What TSan does NOT instrument (load-bearing for certification)

| Access type | NOT instrumented | Impact for G1A |
|---|---|---|
| **Opaque prebuilt `.so` (non-instrumented shared libraries)** | ❌ | **CRITICAL.** The Cmajor runtime (`libCmajPerformer.so`) is a prebuilt binary. TSan can only see its entry/exit points (function calls, returns). **All internal memory accesses inside the .so are invisible to TSan.** If the runtime has internal races (e.g. on its JIT code cache, or on its LLVM execution engine), TSan will NOT report them. **The certification covers host-side race-freedom only.** |
| JIT-compiled code (LLVM JIT emitted by the Cmajor performer) | ❌ | **CRITICAL.** The Cmajor engine JIT-compiles Cmajor source into x64 machine code at runtime. TSan has no instrumentation in the JIT output. Races inside the JIT-compiled DSP code (if any) are invisible. |
| Kernel code (syscalls, device driver) | ❌ | TSan only intercepts userspace memory accesses. |
| Inline assembly / compiler intrinsics | ❌ | If the harness uses any inline asm or MSVC-style intrinsics ported to GCC intrinsics, TSan may not see accesses there. |
| Vector/SIMD load/store (some cases) | ⚠️ Partial | Recent clang versions instrument most vectorised accesses, but corner cases exist. |
| Busy-loop spinning (no intervening memory access) | ❌ | A `while(spinFlag)` with no compiler fence may be optimised to a register read; TSan sees no memory access. Interpose a `std::atomic_thread_fence` or `std::this_thread::yield()` to make TSan observe the spin. |
| **`_CrtSetDbgFlag` / CRT debug heap** | ❌ (Linux) | The CRT debug heap is Windows-only. On Linux, use ASan if heap corruption detection is needed. TSan does NOT detect heap corruption — only data races. |

### 2.3 Atomics and TSan

**Critical distinction:** TSan correctly handles C++ `std::atomic` — it does NOT report races on atomic operations, regardless of memory order. This is intentional and correct: the C++ memory model guarantees that data-race-free programs have well-defined behaviour, and `std::atomic` operations (even `memory_order_relaxed`) are not data races.

**Implication for the harness:** The atomic-index swap (`std::atomic<uint32_t> activeIndex` with `memory_order_release`/`acquire`) should produce **zero TSan reports** when correctly implemented. A TSan report on an atomic access would indicate a **compiler bug** or a **same-thread ordering violation** (unlikely), not a real data race.

**But this also means:** If the harness's only RT↔background synchronisation is a correct `std::atomic<uint32_t>` index and a `std::atomic<bool> bReady`, TSan will confirm they are race-free — which is the correct, desired outcome.

---

## 3. How to PROVE Detector Liveness — The Control Race Binary

### 3.1 The problem

TSan reporting zero data races is meaningless unless we can **prove TSan is actually running and capable of detecting races**. Without this proof, a "clean" result could come from:
- TSan not being linked (`-fsanitize=thread` flag missing at link time)
- TSan runtime failing to initialise silently
- A suppressions file that suppresses all races
- The harness exhausting thread count limits (TSan has a compile-time thread limit)
- The test not exercising any concurrent access patterns

### 3.2 The control-race binary design concept

A **separate binary** (`tsan_control_race`) that deliberately contains a provable data race and is built and run under the **exact same TSan invocation** as the main harness. The race MUST be caught.

**Design:**

```cpp
// tsan_control_race.cpp
// DELIBERATE DATA RACE — used ONLY to prove TSan detector liveness.
// This file is NEVER part of the main harness.

#include <atomic>
#include <thread>
#include <cstdio>

int shared_bad = 0;  // NOT atomic — deliberate race
std::atomic<bool> go{false};

int main() {
    std::thread t1([] {
        while (!go.load(std::memory_order_acquire)) {}
        for (int i = 0; i < 1000000; ++i)
            shared_bad++;  // intentional race with t2
    });
    std::thread t2([] {
        while (!go.load(std::memory_order_acquire)) {}
        for (int i = 0; i < 1000000; ++i)
            shared_bad++;  // intentional race with t1
    });

    go.store(true, std::memory_order_release);
    t1.join();
    t2.join();
    printf("result = %d (expected != 2000000)\n", shared_bad);
    return 0;
}
```

**Build and run:**
```bash
clang++-18 -std=c++17 -fsanitize=thread -g -O1 \
  -o tsan_control_race tsan_control_race.cpp -lpthread

export TSAN_OPTIONS="halt_on_error=0"  # allow run to continue after report
./tsan_control_race 2>&1 | tee control_race_tsan.log

# Verify TSan caught the race:
grep -c "WARNING: ThreadSanitizer: data race" control_race_tsan.log
# Expected: >= 1 (TSan reports the race)
```

### 3.3 What makes this proof load-bearing

1. **Same compiler, same TSan runtime, same invocation flags** as the main harness. The proof is that **this specific TSan installation on this specific host, invoked this way, CAN catch a data race**.
2. **The race must be structurally impossible to miss.** Two threads incrementing the same non-atomic `int` with no synchronisation — TSan will always detect this if it is running.
3. **The absence of a TSan report on the control binary = TSan is not functional** → the entire "TSAN-CLEAN" metric is meaningless. The cert run MUST be FAILED.

### 3.4 Additional liveness check: TSan runtime initialisation verification

```bash
# Check the binary actually links TSan
ldd tsan_control_race | grep tsan || echo "TSan NOT linked — FAIL"

# Run with verbose TSan initialisation logging
export TSAN_OPTIONS="verbosity=1"
./tsan_control_race 2>&1 | head -5
# Should show: "ThreadSanitizer: started"
```

### 3.5 Coupling to the main harness

**Critical requirement:** The control-race binary must be built with the **same compiler, same `-fsanitize=thread` invocation, and run on the same host as the main harness**. It is NOT sufficient to run a pre-compiled control binary from another system. The proof is that **this toolchain, on this host, right now, has a live TSan detector**.

**Proposed coupling mechanism in the harness spec:**
- The build script for the main harness first builds and runs `tsan_control_race`.
- If TSan does NOT catch the race → abort the entire cert run with `DETECTOR_LIVENESS_FAIL`.
- If TSan DOES catch the race → proceed to the main harness run.
- The control-race build/run log is saved as part of the proof artifact.

---

## 4. Known TSan Limitations Relevant to an RT Audio Harness

### 4.1 Shadow memory and memory overhead

TSan requires ~2–4× memory overhead for shadow state tracking. For each 8-byte memory location, TSan stores a shadow cell tracking thread ID, epoch, and access type. On a host with 16 GB RAM (typical WSL2 Ubuntu limit), a harness that allocates large audio buffers (e.g. WAV dumps of 10M samples ≈ 40 MB per buffer) is fine — the overhead is proportional to the working set, not the file output.

**Implication:** The harness should not allocate enormous working sets (e.g. multi-GB offline rendering). The proven first-pass parameters (N=10000 blocks of 256 frames = 2,560,000 samples ≈ 10 MB per WAV) are well within TSan's memory budget.

### 4.2 Thread count limit

TSan has a **compile-time maximum thread count**, typically 1024 or 4096 depending on the `history_size` option. Exceeding this limit produces a fatal error:
```
FATAL: ThreadSanitizer: thread limit (1024) exceeded
```

**Implication for G1A:** The harness uses 2–3 threads (RT render + background compile + optionally main). This is trivially within limits. **No concern.**

### 4.3 TSan + `fork()` / `dlopen()`

**`dlopen()` note:** TSan intercepts `dlopen` but may miss races involving globals inside a dynamically loaded library. The Cmajor runtime is loaded via `cmaj::Library::initialise()` which calls `dlopen()` internally (on Linux) — the CLANG TSan runtime does intercept `dlopen` for shared libraries, so accesses to the `Library::SharedLibraryPtr` and COM entry point resolution ARE instrumented. However, **accesses inside the opened .so itself are NOT instrumented** (see §2.2).

**`fork()` is not used** in the G1A harness — no concern.

### 4.4 False positives (benign races)

TSan may report races on:
- **Reference-counted COM objects** — `addRef`/`release` use atomic operations internally, but if the compiler inlines them, TSan may see the ref-count variable access and the pointer access as separate, possibly racey events. On clang with `-fsanitize=thread`, atomic operations are recognised correctly in most cases, but `choc::com::Ptr`'s ref-count manipulation may trigger benign TSan reports if the `.so` wasn't compiled with TSan.
- **Signal handlers** — if the harness installs signal handlers, TSan may report races between the signal handler and the main thread. The G1A harness does not use signal handlers.
- **Double-checked locking / static local initialisation** — TSan reports races on `static` local variables initialised concurrently. The G1A harness should ensure no `static` locals on hot paths (which is already the practice for RT safety).

**Mitigation:** A carefully curated `tsan.suppressions` file with explanations for each suppressed race (e.g. known-safe COM ref-count patterns in the runtime). Every suppression must be documented in the pre-registration so the verifier can audit it.

### 4.5 `-O1` and false negatives

At `-O1`, TSan misses some races that `-O0` would detect because:
- The optimiser may eliminate redundant loads/stores that were the only observable race manifestation.
- `-O1` may promote a memory access to a register, removing the instrumentation point.

**Trade-off accepted:** `-O1` is the standard recommendation for TSan builds. `-O0` produces too many false positives (un-initialised reads, excessive instrumentation slowing the binary by 10–20×, making the RT audio deadline impossible to meet). The chosen `-O1` is the standard certification practice.

### 4.6 TSan + real-time audio deadlines

TSan can slow execution by **2–5×** (typical 3× slowdown for CPU-bound code). For the G1A harness running at `D_block = 5.33 ms` per block, a 3× slowdown would inflate per-block processing to ~15 ms, which exceeds the deadline and produces xruns.

**However**, the G1A certification pass does NOT gate on xrun-freedom under TSan — it gates on **TSAN-CLEAN** (zero data race reports). The TSan run is a correctness pass, not a performance pass. The performance pass (xrun-free under normal conditions) is already proven by the Windows passes.

**Design resolution for the harness spec:** The TSan cert run runs the harness with **no timing deadline enforcement**. The blocks advance as fast as TSan allows. The ONLY gated metric is whether TSan reports any data races. A companion non-TSan release build verifies functional equivalence (the audio output matches the Windows bit-exact baseline within float-platform tolerance).

### 4.7 `history_size` and race detection depth

TSan uses a "happens-before" model with vector clocks. The `history_size` option controls how many prior accesses are stored per memory location:

| `history_size` | Memory overhead | Race detection depth |
|---|---|---|
| `0` | Minimal | Least reliable — may miss races with long gaps between accesses |
| `1` | Low | Short window |
| `2` | Medium (default) | Good — recommended for most workloads |
| `3` | Moderate | Better for long-lived threads |
| `4` | High | Maximum — catches races across very long access intervals |
| `5` | Very High | Overkill for most |
| `6` | Extreme | |
| `7` | Maximum | Maximum depth |

**Recommendation for G1A:** `history_size=7` (the max). The RT audio threads run for ~53 seconds (N=10000 blocks). A race whose two accesses are 50 seconds apart could be missed with default history_size. We maximise to avoid false negatives. The memory overhead is acceptable for the harness size.

### 4.8 Stacks and TSan

TSan tracks stack frames for each access, allowing it to report both the prior and current access locations. The default stack depth is usually sufficient. If stack traces are truncated in TSan reports:
```bash
export TSAN_OPTIONS="history_size=7:stack_trace_format='  #%n %S':second_deadlock_stack=1"
```

---

## 5. The TSan/Linux Invocation Shape (locked for harness spec)

### 5.1 Exact build invocation (locked)

```bash
#!/bin/bash
# Build the main harness with TSan (clang-18, primary)
CLANG=clang++-18
CXXFLAGS="-std=c++17 -fsanitize=thread -g -O1"
CXXFLAGS="$CXXFLAGS -DCMAJOR_DLL=1"
CXXFLAGS="$CXXFLAGS -I<cmajor-headers>/include"
LDFLAGS="-fsanitize=thread -lpthread -ldl"

# Compile each translation unit
$CLANG $CXXFLAGS -c host_config.cpp -o host_config.o
$CLANG $CXXFLAGS -c engine_setup.cpp -o engine_setup.o
$CLANG $CXXFLAGS -c rt_performer.cpp -o rt_performer.o
$CLANG $CXXFLAGS -c barrier_mixer.cpp -o barrier_mixer.o
$CLANG $CXXFLAGS -c reload_bridge.cpp -o reload_bridge.o
$CLANG $CXXFLAGS -c crossfade.cpp -o crossfade.o
$CLANG $CXXFLAGS -c perturb.cpp -o perturb.o
$CLANG $CXXFLAGS -c metrics.cpp -o metrics.o
$CLANG $CXXFLAGS -c proof.cpp -o proof.o
$CLANG $CXXFLAGS -c main.cpp -o main.o

# Link
$CLANG $LDFLAGS -o g1a_tsan_host \
    host_config.o engine_setup.o rt_performer.o \
    barrier_mixer.o reload_bridge.o crossfade.o \
    perturb.o metrics.o proof.o main.o

# Verify TSan linked
ldd g1a_tsan_host | grep tsan || { echo "TSan NOT linked — build FAILED"; exit 1; }
```

### 5.2 Exact run invocation (locked)

```bash
#!/bin/bash
# Step 0: Verify TSan runtime exists on this host
ldd g1a_tsan_host | grep tsan > /dev/null || { echo "FATAL: TSan not linked"; exit 1; }

# Step 1: Control-race liveness check (build + run)
$CLANG -std=c++17 -fsanitize=thread -g -O1 \
    -o tsan_control_race tsan_control_race.cpp -lpthread

export TSAN_OPTIONS="halt_on_error=0:history_size=7"
./tsan_control_race 2> control_race_stderr.txt
if ! grep -q "WARNING: ThreadSanitizer: data race" control_race_stderr.txt; then
    echo "DETECTOR_LIVENESS_FAIL: TSan did NOT catch planted race"
    exit 1
fi
echo "DETECTOR_LIVENESS_PASS: TSan caught planted race"

# Step 2: Main harness (TSan disabled suppression — we WANT to see all races)
./g1a_tsan_host 2> tsan_reports.txt
RET=$?

# Step 3: Check for TSan reports
if [ -s tsan_reports.txt ]; then
    # Check if any actual races (not just warnings/notes)
    RACE_COUNT=$(grep -c "WARNING: ThreadSanitizer: data race" tsan_reports.txt 2>/dev/null || echo 0)
    echo "TSan reports found: $RACE_COUNT potential data races"
else
    echo "TSAN_CLEAN: zero TSan reports"
    RACE_COUNT=0
fi

exit $RET
```

### 5.3 TSan options locked for certification

```
TSAN_OPTIONS =
  report_atomic_races=1
  halt_on_error=0           # Do NOT halt — we want to see ALL reports
  history_size=7            # Maximum race detection depth
  suppressions=<path>/tsan.suppressions  # Documented suppressions only
  second_deadlock_stack=1   # Show both stacks in race reports
```

**Justification for `halt_on_error=0`:** We want to see ALL data races in a single run, not fail on the first one. The final verdict checks whether the count is zero. If any race is found, the run is FAILED.

---

## 6. Detector-Liveness Proof Protocol (exact shape for harness spec)

The proof that TSan is live must be **five-fold**:

1. **Build-time verification:** `ldd g1a_tsan_host | grep tsan` confirms the TSan runtime is linked into the binary.

2. **Runtime initialisation confirmation:** TSan outputs its startup log. The harness run stderr is captured and must contain TSan diagnostic markers (the libtsan banner).

3. **Control-race binary:** A SEPARATE, independently compiled binary (`tsan_control_race`) that contains a deliberate, provable data race (two threads, no synchronisation on a non-atomic `int`). Built with the **same** `-fsanitize=thread -O1 -g` flags. Run immediately before the main harness. TSan MUST report `WARNING: ThreadSanitizer: data race`.

4. **Control-race binary built fresh on the same host, same invocation:** The control binary is NOT pre-compiled. It is compiled in the same build script, on the same WSL2 Ubuntu host, with the same compiler invocation. This proves the toolchain, not a pre-existing binary from another environment.

5. **Absence of the control-race catch = automatic FAIL:** If the control binary does not produce a TSan data-race warning, the certification run is ABORTED with `DETECTOR_LIVENESS_FAIL`. The main harness is NOT run (it would be meaningless). The proof artifact captures the control-race build log and run stderr.

**Pre-declared FAIL branch (quotable verbatim):**
> DETECTOR_LIVENESS_FAIL: the control-race binary did not produce a TSan data-race warning. This means ThreadSanitizer is NOT functional on this host/toolchain/run. The TSAN-CLEAN certification is aborted. All G1A TSan cert evidence is invalidated. No data-race claim can be made from this run.

---

## 7. Summary: What TSan Can and Cannot Certify for G1A

| Claim | Certifiable by TSan? | Notes |
|---|---|---|
| **Host-side C++ code is race-free** (engine_setup, rt_performer, reload_bridge, crossfade, barrier_mixer, metrics, proof, main) | ✅ YES | All host CPP code built with `-fsanitize=thread -O1 -g` is instrumented. Every load/store, mutex operation, thread join, and atomic access is monitored. Zero reports = host-side race-free at the C++ level. |
| **The `std::atomic<uint32_t>` active-index handoff is race-free** | ✅ YES | Atomics are correctly handled — TSan will not report false positives on the release/acquire handoff. Zero reports on the handoff confirms correct use of the C++ memory model. |
| **The Cmajor runtime (`libCmajPerformer.so`) is race-free** | ❌ NO | The .so is a prebuilt binary. Its internal memory accesses are NOT instrumented. TSan sees only the function call boundary. Internal races in the runtime DLL would be invisible. |
| **The JIT-compiled DSP code (Sine patch output) is race-free** | ❌ NO | JIT output is machine code emitted at runtime. TSan has no instrumentation in JIT output. Internal DSP races (if any) are invisible. But DSP code is single-threaded per performer (by design) — there is no concurrent access to DSP state. |
| **The `choc::com::Ptr` ref-count pattern is race-free** | ⚠️ With caveats | TSan sees the atomic ref-count operations. It should not report them as races if the compiler/clang correctly identifies them as atomic. If benign reports appear, they go into a documented suppression. |
| **The control-race detector proof is sound** | ✅ YES | A deliberately planted race on a non-atomic `int` is always caught by live TSan. This is the most reliable detector-liveness test in the literature. |

### Honest conclusion

A **TSAN-CLEAN** result on the G1A harness proves:
- The host C++ harness code is data-race-free (thread creation, performer handoff, crossfade buffers, release ordering).
- The `std::atomic<uint32_t>` handoff is correctly synchronised.
- TSan is demonstrably functional on this host.

A **TSAN-CLEAN** result does NOT prove:
- The Cmajor runtime `.so` is internally race-free.
- The JIT-compiled DSP code is internally race-free.
- The harness is free of heap corruption, memory leaks, or undefined behaviour (those need ASan, UBSan, MSan — TSan only detects data races).

For the G1A certification, TSAN-CLEAN establishes that the **host-side orchestration of concurrent audio rendering** is race-free — which is the exact claim the Windows passes could only approximate with ASan + deterministic adversarial stress. The TSan certification is the stronger standard for the host-side claim, but it does NOT extend to the runtime/JIT internals.
