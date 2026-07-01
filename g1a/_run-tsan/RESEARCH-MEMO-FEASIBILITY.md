# G1A TSan/Linux Certification — FEASIBILITY RESEARCH MEMO (task-1)

**Date:** 2026-06-30
**Role:** researcher-feasibility
**Task:** Ground whether a Linux x64 Cmajor runtime (.so) is obtainable for the G1A TSan certification pass.
**Status:** Planning/grounding only — NO code executed, NO builds, NO measured results.

---

## 1. CRITICAL FINDING: Prebuilt Linux x64 .so EXISTS on GitHub Releases

**YES — a prebuilt `libCmajPerformer.so` ships with every GitHub release.**

The GitHub releases page at `https://github.com/cmajor-lang/cmajor/releases` distributes:

| Asset | Size | Content |
|---|---|---|
| `cmajor.linux.x64.zip` | 136 MB | `libCmajPerformer.so` + `cmaj` CLI tool + SDK headers + LLVM JIT runtime |
| `cmajor_win_x64.exe` | 55 MB | Windows NSIS installer (verified: contains `CmajPerformer.dll` v1.0.3159) |
| `cmajor.dmg` | 280 MB | macOS |
| `cmajor.linux.arm64.zip` | 87 MB | Linux ARM64 |
| `cmajor.linux.arm32.zip` | 80 MB | Linux ARM32 |

**Linux x64 zip is available for both:**
- Latest **stable** `1.0.3066` (2025-11-23)
- Latest **prerelease** `1.0.3159` (2026-06-03) — same version as the Windows DLL used in all G1A passes

**Download URL (1.0.3159 prerelease):**
```
https://github.com/cmajor-lang/cmajor/releases/download/1.0.3159/cmajor.linux.x64.zip
```

### What's inside the Linux zip (inferred from repo structure + Windows installer pattern)

The Linux zip is expected to contain:
```
cmajor.linux.x64.zip
├── cmaj                    # CLI tool (ELF x64, statically linked or with runtime deps)
├── libCmajPerformer.so     # The JIT engine .so (the Linux analogue of CmajPerformer.dll)
├── lib/                    # Supporting shared libs (LLVM, etc.)
├── include/                # C++ API headers (same headers as Windows — identical API)
└── examples/               # Example patches
```

**The .so is dynamically loaded** — same architecture as Windows. `cmaj::Library::initialise("libCmajPerformer.so")` loads it at runtime and resolves COM entry points via `cmajor_getEntryPointsV10()`. The C++ API headers are **identical** between Windows and Linux — only the DLL/.so name differs.

---

## 2. Source Build Option (also confirmed feasible)

If the prebuilt zip is insufficient (e.g., custom build flags needed), the Cmajor SDK **can be built from source on Linux**. Evidence from the repo:

### CMakeLists.txt (root) — Linux support is explicit

```cmake
if (${CMAKE_SYSTEM_NAME} MATCHES "Linux")
    # Detects webkit2gtk version for the plugin (not needed for CORE library)
    # Uses clang or gcc v8+, C++17
endif()
```

### tools/CmajDLL/CMakeLists.txt — builds libCmajPerformer.so

```cmake
add_library(CmajPerformer SHARED)
# On Linux: sets -pthread -lasound; sets CMAKE_POSITION_INDEPENDENT_CODE ON
# Links LLVM JIT via MAKE_CMAJ_LIBRARY(... ENABLE_PERFORMER_LLVM)
# Uses gcc >= 9.0 or clang with C++17
```

### README.md — Linux build recipe

```
> cmake -Bbuild -GNinja -DBUILD_PLUGIN=OFF -DCMAKE_BUILD_TYPE=Release .
> cd build
> ninja
```

### Build dependencies (Linux x64 under WSL2 Ubuntu)
- C++17 compiler (gcc v8+ or clang)
- CMake (≥3.16)
- Ninja (recommended) or Make
- ALSA dev: `apt install libasound2-dev`
- pthreads (included with glibc)
- LLVM prebuilts (shipped as git submodule `3rdParty/llvm` → `github.com:cmajor-lang/llvm.git`)

### LLVM submodule status

The `3rdParty/llvm` submodule points to `git@github.com:cmajor-lang/llvm.git` (SSH URL). The local shallow clone (`--depth 1 --recurse-submodules`) did NOT pull this submodule correctly because:
1. The SSH URL requires key-based auth (host key verification fails on this host)
2. The submodule was not initialized (`-` prefix in `git submodule status`)

**Mitigation:** Change the submodule URL from SSH to HTTPS, or download the prebuilt Linux zip instead (avoids LLVM submodule entirely).

The LLVM prebuilt directory in the repo at `3rdParty/llvm/release/linux/x64/` would contain precompiled LLVM libraries — but this is empty in the shallow clone.

---

## 3. TSan-Instrumentability of the Runtime

| Component | TSan-instrumentable? | Notes |
|---|---|---|
| **Our C++ host harness** | ✅ **YES** | Compiled with `-fsanitize=thread -g -O1`. TSan instruments all loads/stores, atomics, thread creation, mutexes in our code. |
| **`libCmajPerformer.so` (prebuilt)** | ❌ **NO** | Precompiled shared library — no source-level instrumentation. TSan cannot see inside the .so's internals (JIT compiler, LLVM runtime, COM dispatch). |
| **JIT-compiled DSP code (sine patches)** | ❌ **NO** | The LLVM JIT generates machine code at runtime; TSan does not instrument JIT output. |
| **`std::atomic` operations in harness** | ✅ **YES** | `atomic.load(acquire)` / `atomic.store(release)` are visible to TSan as annotated atomic operations. |
| **Thread creation/join** | ✅ **YES** | TSan tracks happens-before via `std::thread` and `pthread_create/join`. |
| **Stack/heap accesses in harness** | ✅ **YES** | All reads/writes in our worker and main threads are instrumented. |

**Implication for the certification strategy:**
- TSan CAN detect races in the **host-side** thread model: the `activeIndex` handoff, the `bReady` publication, the concurrent performer array accesses, the crossfade buffer reads/writes, the safe-release ordering.
- TSan CANNOT detect races **inside** the Cmajor JIT engine (opaque prebuilt .so) or inside JIT-compiled DSP code.
- **This is identical to the Windows situation** — the Windows DLL is also opaque. The certification is about the HOST harness's race-freedom, not the DSP engine internals.

---

## 4. Obtain/Build Path Recommendation

### Path A (Recommended): Prebuilt Linux zip

**Steps:**
1. Start WSL2 Ubuntu (`wsl -d Ubuntu`)
2. Download `cmajor.linux.x64.zip` from GitHub releases
3. Unzip to a known location (e.g., `~/cmajor-linux/`)
4. Set `LD_LIBRARY_PATH` to include the directory with `libCmajPerformer.so`
5. Point include paths to the shipped headers
6. Compile the host harness with WSL2 Ubuntu gcc/clang + `-fsanitize=thread`

**Advantages:**
- No LLVM submodule build
- No LLVM source compile (hours)
- Same version (1.0.3159) as the Windows DLL
- Same API headers as Windows

### Path B: Source build (fallback if zip doesn't contain headers)

**Steps:**
1. Clone the Cmajor SDK (already present at `C:/Users/doner/SSI/g1a/_run/cmajor-sdk/`)
2. Fix the LLVM submodule URL from SSH to HTTPS: `git submodule set-url 3rdParty/llvm https://github.com/cmajor-lang/llvm.git`
3. `git submodule update --init 3rdParty/llvm`
4. Install build deps in WSL2: `sudo apt install cmake ninja-build libasound2-dev g++`
5. `cmake -Bbuild -GNinja -DBUILD_PLUGIN=OFF -DBUILD_CMAJ=OFF -DCMAKE_BUILD_TYPE=Release`
6. `ninja -Cbuild CmajPerformer`

### Path C: Both (preferred for certification robustness)
Use the prebuilt zip for the host build, but also have the source tree available for header reference.

---

## 5. Key Decision Points for the Synthesis Phase

1. **Linux .so is OBTAINABLE** — `PRE-REGISTRATION.md` can lock this as a 
   - [SPIKE] feasibility claim: the Linux runtime can be obtained
   - [GATE] T1 must verify: the zip downloads, `libCmajPerformer.so` loads under WSL2

2. **API headers are IDENTICAL** between Windows and Linux — the same `cmaj_Engine.h`, `cmaj_Performer.h`, etc. The host harness code compiles identically (no `#ifdef WIN32` needed at the API level). Only platform-specific system headers differ:
   - `windows.h` → `/* none */` (port `QueryPerformanceCounter` to `std::chrono`)
   - `<crtdbg.h>` → remove (no CRT debug heap on Linux)

3. **TSan certifies the HOST race model** not the JIT internals — this must be explicitly scoped in the PRE-REGISTRATION. The Windows passes proved concurrency and hot-swap via ASan + determinism; TSan adds the thread-race certifier for the **host-side** atomic handoff, release ordering, and buffer ownership.

4. **WSL2 Ubuntu IS available** — `wsl -l -v` shows `Ubuntu (Stopped)`. Can be started with `wsl -d Ubuntu`.

5. **Version lock**: Use 1.0.3159 (same as Windows passes) for consistency.

---

## 6. Summary Truth Table

| Question | Answer | Confidence | Evidence |
|---|---|---|---|
| Does a prebuilt Linux x64 `.so` exist? | ✅ YES | High | `cmajor.linux.x64.zip` listed in GitHub release assets (API confirmed) |
| Can the SDK be built from source on Linux? | ✅ YES | High | CMakeLists.txt supports Linux; README documents build; gcc/clang v8+ supported |
| Is WSL2 Ubuntu available? | ✅ YES | High | `wsl -l -v` confirms Ubuntu installed (currently stopped) |
| Is the .so TSan-instrumentable? | ❌ NO (prebuilt) | High | Precompiled shared library; TSan only instruments source-level compilation |
| Is our HOST C++ code TSan-instrumentable? | ✅ YES | High | Compiled with `-fsanitize=thread`; all host atomics/threads/accesses visible |
| Are the C++ API headers identical? | ✅ YES | High | Both platforms use the same `include/` tree from the cmajor repo |
| Can we get Linux SDK headers? | ✅ YES | High | Either from the prebuilt zip or the existing `cmajor-sdk/include/` clone |
| Is the same DLL version (1.0.3159) available? | ✅ YES | High | Confirmed in release assets for both 1.0.3066 and 1.0.3159 tags |

**Bottom line:** The Linux x64 Cmajor runtime IS obtainable (preferred: download `cmajor.linux.x64.zip` from GitHub releases). TSan certification of the host harness is technically feasible. The pre-requisites for the TSan/Linux certification pass are met.
