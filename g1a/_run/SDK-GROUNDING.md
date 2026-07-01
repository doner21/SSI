# Cmajor C++ SDK — Grounding Recipe for G1A Spike

> **Target**: Working Cmajor SDK on `C:/Users/doner/SSI`, preferring prebuilt binaries over source builds.
> **Machine**: Windows x64, MSVC VS18 BuildTools (cl.exe 14.50), CMake 4.3.2, Git.
> **Spike Goal**: Compile + link a trivial C++ host that creates a `cmaj::Engine`, loads Cmajor source, links, creates a `cmaj::Performer`, advances one block, reads output frames — all via the Cmajor C++ API and `CmajPerformer.dll`.

---

## 1. Obtaining the Headers (from GitHub)

The public API headers live in the main repo. The `include/` directory is **not** header-only in the sense that it includes the CHOC library as a git submodule (`include/choc` → `github.com/Tracktion/choc`). A shallow clone with submodules is the simplest approach that guarantees all headers resolve.

### Recommended: Shallow clone with submodules

```powershell
cd C:\Users\doner\SSI
git clone --depth 1 --recurse-submodules https://github.com/cmajor-lang/cmajor.git cmajor-sdk
```

**Why `--recurse-submodules`**: `include/choc` is a submodule pointing to `github.com/Tracktion/choc`. Without it, `#include "../../choc/choc/platform/choc_DynamicLibrary.h"` (needed for DLL loading) will fail. The full repo is ~200MB with submodules; `--depth 1 --recurse-submodules` keeps it to ~30MB.

### Alternative: Sparse checkout of `include/` only

If you truly want to minimise disk use:

```powershell
git clone --depth 1 --filter=blob:none --sparse https://github.com/cmajor-lang/cmajor.git cmajor-sdk
cd cmajor-sdk
git sparse-checkout set include
git submodule init
git submodule update --depth 1
```

However, the examples directory is useful reference, so the full shallow clone is preferred.

**Reference**: https://github.com/cmajor-lang/cmajor — repo root, all API headers at `include/cmajor/API/` and `include/cmajor/COM/`.

---

## 2. Prebuilt CmajPerformer.dll for Windows x64

### YES — a prebuilt DLL exists and is obtained via the NSIS installer.

The GitHub Releases distribute `cmajor_win_x64.exe` which is an NSIS installer. Running it installs:

| Component | Install path (typical) |
|---|---|
| `cmaj.exe` | The CLI compiler/tool |
| `CmajPerformer.dll` | The JIT engine DLL (the one we need) |
| VST3/AU plugin | Optional, for DAW use |

### Latest stable release

| Tag | Date | Release URL | Installer URL | Status |
|---|---|---|---|---|
| `1.0.3066` | 2025-11-23 | https://github.com/cmajor-lang/cmajor/releases/tag/1.0.3066 | https://github.com/cmajor-lang/cmajor/releases/download/1.0.3066/cmajor_win_x64.exe | Latest **stable** |
| `1.0.3159` | 2026-06-03 | https://github.com/cmajor-lang/cmajor/releases/tag/1.0.3159 | https://github.com/cmajor-lang/cmajor/releases/download/1.0.3159/cmajor_win_x64.exe | **Pre-release** (newest) |

**Recommendation for G1A**: Use `1.0.3159` — it's the newest (June 2026). It's marked prerelease but is the most up-to-date.

### Where `CmajPerformer.dll` lands

After running the installer, the DLL is placed at the **install location you choose**. Default is typically:

```
C:\Program Files\Cmajor\CmajPerformer.dll  (OR similar)
```

For our spike, we will **copy** `CmajPerformer.dll` into the same directory as the test executable (next to the `.exe`) to avoid DLL search-path issues. Alternatively, we add the install dir to `PATH`.

### Also check: `cmaj.exe` bundle

The installer also optionally places `cmaj.exe` which is useful for CLI tasks (`cmaj play`, `cmaj generate`, `cmaj test`), but is not required for the C++ API.

### Does the installer ship headers?

**No.** The installer only ships `cmaj.exe`, `CmajPerformer.dll`, and VST/AU plugins. The C++ API headers must come from the GitHub repository clone (see §1 above).

**Reference**:
- https://github.com/cmajor-lang/cmajor/releases (release assets)
- https://cmajor-lang.github.io/docs-dev/docs/GettingStarted ("On the Github releases page, you'll find downloadable binaries for Mac and Windows... The redistributable libraries (CmajPerformer.dll or libCmajPerformer.so) which are needed if you're building your own native app which embeds the Cmajor JIT engine.")

---

## 3. Minimal Include Paths + DLL Linkage

### Architecture: Runtime DLL loading (no import .lib needed)

The Cmajor C++ API uses **dynamic library loading at runtime** — `cmaj::Library::initialise("path/to/CmajPerformer.dll")` loads the DLL and resolves the COM entry points. There is **no import library** needed. Compilation is purely header-based; the only runtime requirement is that the DLL can be found.

### Headers needed for a minimal JIT host

```cpp
// The one main include needed — it pulls in Performer, Program, Library, BuildSettings etc. transitively
#include "cmajor/API/cmaj_Engine.h"
```

This single include drags in the following dependency chain:

```
cmaj_Engine.h
  └── cmaj_Performer.h          → cmaj_Program.h, cmaj_Endpoints.h, cmaj_ExternalVariables.h
      └── cmaj_Program.h        → ../COM/cmaj_Library.h
          └── cmaj_Library.h    → choc/choc/platform/choc_DynamicLibrary.h  (submodule)
                                 → choc/choc/platform/choc_Platform.h        (submodule)
                                 → cmaj_EngineFactoryInterface.h
```

### Critical: Define `CMAJOR_DLL=1` before any includes

```cpp
#define CMAJOR_DLL 1          // Must be defined BEFORE any cmajor includes
#include "cmajor/API/cmaj_Engine.h"
```

This is checked inside `cmaj_Library.h`:

```cpp
#ifndef CMAJOR_DLL
 #define CMAJOR_DLL 0         // default is STATIC link (no DLL loading)
#endif
```

When `CMAJOR_DLL=0`, `Library::initialise()` is a no-op and `Library::SharedLibraryPtr` is an empty struct. The engine functions must be linked statically (which requires building the cmaj library from source — exactly what we want to avoid).

When `CMAJOR_DLL=1`, the library loads `CmajPerformer.dll` at runtime, calls its `cmajor_getEntryPointsV10()` function, and obtains all engine factory entry points.

### Minimal include paths for compilation

```
-I<repo>/include
```

Because `include/cmajor/API/cmaj_Engine.h` uses relative `#include "../../choc/choc/..."` paths, the compiler must see the `include/` directory on its search path. The header relationships use relative paths from the `include/` root, so:

```
/I"C:\Users\doner\SSI\cmajor-sdk\include"
```

is sufficient. No per-subdirectory -I flags needed.

### DLL initialization sequence

```cpp
#define CMAJOR_DLL 1
#include "cmajor/API/cmaj_Engine.h"

int main() {
    // MUST call this before any cmaj::Engine::create() or cmaj::Program
    std::string dllPath = "CmajPerformer.dll";   // next to exe, or full absolute path
    if (!cmaj::Library::initialise(dllPath)) {
        // DLL not found or entry point missing
        return 1;
    }

    // Now safe to use the API:
    auto engine = cmaj::Engine::create();
    // ...
}
```

**Reference**:
- `include/cmajor/COM/cmaj_Library.h` — defines `Library::initialise()`, `Library::shutdown()`, DLL entry point symbol `cmajor_getEntryPointsV10`.
- `include/cmajor/API/cmaj_Engine.h` — the main `Engine` struct with all methods.

---

## 4. Exact Native API Call Sequence

Copied directly from the `HelloCmajor` example at `examples/native_apps/HelloCmajor/Main.cpp`, validated against the header declarations.

### Complete call sequence

```cpp
#define CMAJOR_DLL 1
#include "cmajor/API/cmaj_Engine.h"
#include <iostream>

// ──────────────────────────────────────────────────────────────
// STEP 0: Load the DLL
// ──────────────────────────────────────────────────────────────
cmaj::Library::initialise("CmajPerformer.dll");

// ──────────────────────────────────────────────────────────────
// STEP 1: Create an Engine
// ──────────────────────────────────────────────────────────────
// Engine::create() accepts an optional engine type string.
// Default (empty string) == "LLVM JIT engine" on x64 Windows.
auto engine = cmaj::Engine::create();

// ──────────────────────────────────────────────────────────────
// STEP 2: Parse Cmajor source into a Program
// ──────────────────────────────────────────────────────────────
cmaj::DiagnosticMessageList messages;
cmaj::Program program;

program.parse(messages, "internal", R"(
    processor Gain {
        input  stream float in;
        output stream float out;
        void main() {
            loop {
                out <- in * 0.5f;   // apply 50% gain
                advance();
            }
        }
    }
)");

// ──────────────────────────────────────────────────────────────
// STEP 3: Configure BuildSettings (optional but recommended)
// ──────────────────────────────────────────────────────────────
engine.setBuildSettings(cmaj::BuildSettings()
    .setFrequency(44100)           // sample rate
    .setMaxBlockSize(512)
    .setSessionID(123456));

// ──────────────────────────────────────────────────────────────
// STEP 4: Load the program into the engine
// ──────────────────────────────────────────────────────────────
// bool Engine::load(DiagnosticMessageList&, const Program&,
//                    ExternalVariableProviderFn, ExternalFunctionProviderFn)
// Returns true on success. External resolvers can be {} if not needed.
engine.load(messages, program, {}, {});

// ──────────────────────────────────────────────────────────────
// STEP 5: Get endpoint handles (BEFORE linking)
// ──────────────────────────────────────────────────────────────
// EndpointHandle Engine::getEndpointHandle(const char* endpointID)
auto inputHandle  = engine.getEndpointHandle("in");
auto outputHandle = engine.getEndpointHandle("out");

// ──────────────────────────────────────────────────────────────
// STEP 6: Link the program
// ──────────────────────────────────────────────────────────────
// bool Engine::link(DiagnosticMessageList&, CacheDatabaseInterface* = nullptr)
engine.link(messages);

// ──────────────────────────────────────────────────────────────
// STEP 7: Create a Performer instance
// ──────────────────────────────────────────────────────────────
// Performer Engine::createPerformer()
auto performer = engine.createPerformer();

// ──────────────────────────────────────────────────────────────
// STEP 8: Set block size
// ──────────────────────────────────────────────────────────────
// Result Performer::setBlockSize(uint32_t numFramesForNextBlock)
performer.setBlockSize(256);

// ──────────────────────────────────────────────────────────────
// STEP 9: Set input frames
// ──────────────────────────────────────────────────────────────
// Creates a buffer of 256 floats, all = 1.0 (DC test signal)
auto inputBuf = choc::buffer::createInterleavedBuffer(1, 256, []{ return 1.0f; });

// Result Performer::setInputFrames(EndpointHandle, const void*, uint32_t numFrames)
performer.setInputFrames(inputHandle, inputBuf.data, 256);

// ──────────────────────────────────────────────────────────────
// STEP 10: Advance (render one block)
// ──────────────────────────────────────────────────────────────
// Result Performer::advance()
performer.advance();

// ──────────────────────────────────────────────────────────────
// STEP 11: Copy output frames
// ──────────────────────────────────────────────────────────────
auto outputBuf = choc::buffer::InterleavedBuffer<float>(1, 256, false);  // pre-allocate

// Result Performer::copyOutputFrames(EndpointHandle, void* dest, uint32_t numFrames)
performer.copyOutputFrames(outputHandle, outputBuf.getFrame(0), 256);

// Output frames are now in outputBuf — each sample should be ~0.5 (1.0 * 0.5 gain)
```

### Method signatures from headers (verified)

| Method | Header | Signature |
|---|---|---|
| `Library::initialise` | `cmaj_Library.h` | `static bool initialise(std::string_view pathToDLL)` |
| `Engine::create` | `cmaj_Engine.h` | `static Engine create(const std::string& engineType = {}, const choc::value::Value* options = nullptr)` |
| `Engine::setBuildSettings` | `cmaj_Engine.h` | `void setBuildSettings(const BuildSettings&)` |
| `Program::parse` | `cmaj_Program.h` | `bool parse(DiagnosticMessageList&, const std::string& filename, const std::string& fileContent)` |
| `Engine::load` | `cmaj_Engine.h` | `bool load(DiagnosticMessageList&, const Program&, ExternalVariableProviderFn, ExternalFunctionProviderFn)` |
| `Engine::getEndpointHandle` | `cmaj_Engine.h` | `EndpointHandle getEndpointHandle(const char* endpointID)` |
| `Engine::link` | `cmaj_Engine.h` | `bool link(DiagnosticMessageList&, CacheDatabaseInterface* = nullptr)` |
| `Engine::createPerformer` | `cmaj_Engine.h` | `Performer createPerformer()` |
| `Performer::setBlockSize` | `cmaj_Performer.h` | `Result setBlockSize(uint32_t)` |
| `Performer::setInputFrames` | `cmaj_Performer.h` | `Result setInputFrames(EndpointHandle, const void*, uint32_t)` |
| `Performer::advance` | `cmaj_Performer.h` | `Result advance()` |
| `Performer::copyOutputFrames` | `cmaj_Performer.h` | `Result copyOutputFrames(EndpointHandle, void*, uint32_t)` |

**Reference**:
- https://github.com/cmajor-lang/cmajor/blob/main/examples/native_apps/HelloCmajor/Main.cpp — complete working example
- https://github.com/cmajor-lang/cmajor/blob/main/include/cmajor/API/cmaj_Engine.h — Engine class + all methods
- https://github.com/cmajor-lang/cmajor/blob/main/include/cmajor/API/cmaj_Performer.h — Performer class + all methods
- https://github.com/cmajor-lang/cmajor/blob/main/include/cmajor/API/cmaj_Program.h — Program class
- https://github.com/cmajor-lang/cmajor/blob/main/include/cmajor/API/cmaj_BuildSettings.h — BuildSettings

---

## 5. Trivial Cmajor Patch Source for Smoke Test

### Option A: Inline `Gain` processor (simplest — used in HelloCmajor example)

```cmajor
processor Gain
{
    input  stream float in;
    output stream float out;

    void main()
    {
        loop
        {
            out <- in * 0.5f;    // 50% gain
            advance();
        }
    }
}
```

**Smoke test**: Feed DC = 1.0 → expect output = 0.5 for each frame.

### Option B: Self-oscillating 440Hz sine (no input needed)

```cmajor
processor Sine440 [[ main ]]
{
    output stream float out;

    float phase;

    void main()
    {
        loop
        {
            out <- sin(phase);
            phase = addModulo2Pi(phase, float(440.0 * processor.period * twoPi));
            advance();
        }
    }
}
```

This produces a 440Hz sine wave **without any input stream**. It uses `processor.period` (1/sampleRate) and `twoPi` (built-in constant). For a smoke test, you can call `performer.advance()` without setting input frames, then read `out` — expect alternating positive/negative floats.

### Option C: Pass-through (for physical input testing)

```cmajor
processor Passthrough
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
```

**Reference**: https://github.com/cmajor-lang/cmajor/blob/main/examples/patches/HelloWorld/HelloWorld.cmajor — the official "Hello World" patch (plays a guitar melody)
https://github.com/cmajor-lang/cmajor/blob/main/examples/patches/SineSynth/SineSynth.cmajor — complete sine synth with voice allocation

---

## 6. Gotchas

### 6.1 DLL Search Path

`cmaj::Library::initialise(path)` — if `path` is a relative path, it is resolved against the current working directory (not the exe directory). The library code tries:

1. The exact path provided
2. The same path with `getDLLName()` appended (if a dir was given)

**Safe approach**: Copy `CmajPerformer.dll` to the same directory as your `.exe`, or pass the full absolute path. The DLL is always named `CmajPerformer.dll` on Windows (defined in `cmaj_Library.h:constexpr const char* getDLLName() { return "CmajPerformer.dll"; }`).

```cpp
// Either: DLL next to exe
cmaj::Library::initialise("CmajPerformer.dll");

// Or: full path
cmaj::Library::initialise("C:\\Program Files\\Cmajor\\CmajPerformer.dll");
```

### 6.2 Sanitizers under MSVC — TSan/UBSan NOT available

| Sanitizer | MSVC (cl.exe) | Clang-cl (clang-cl.exe) |
|---|---|---|
| AddressSanitizer (ASan) | ✅ `/fsanitize=address` (VS16.9+, VS18 BuildTools has it) | ✅ |
| UndefinedBehaviorSanitizer (UBSan) | ❌ Not available | ✅ `-fsanitize=undefined` |
| ThreadSanitizer (TSan) | ❌ **Not available** | ✅ `-fsanitize=thread` (but only on Linux/macOS) |
| MemorySanitizer (MSan) | ❌ Not available | ❌ Not available on Windows |
| LeakSanitizer | ❌ Not available | ❌ Not available on Windows |

**Implication for G1A concurrency proving**: TSan does not exist on Windows under any compiler (MSVC or clang-cl). Clang-cl on Windows supports UBSan but NOT TSan. The only way to get ThreadSanitizer is to build and run on **Linux**.

**Recommended concurrency proving strategy**:
- **On Windows (this spike)**: Use AddressSanitizer (`/fsanitize=address`) only. Verify no buffer overruns / use-after-free in the C++ host code. Use `_CrtSetDbgFlag(_CRTDBG_CHECK_ALWAYS)` for heap corruption detection.
- **For full concurrency safety (later)**: Cross-compile the same harness for Linux x64 and run under TSan (`-fsanitize=thread`). The Cmajor JIT engine itself (inside the DLL) uses its own LLVM JIT; TSan cannot see inside the JIT-compiled code, but it can detect races in the host-side API calls.

**Thread safety of the Cmajor API itself**:
- `cmaj::Engine` (load, link) — NOT thread-safe; single-threaded use only.
- `cmaj::Performer` — `setBlockSize`, `setInputFrames`, `advance`, `copyOutputFrames` are designed to be called from a **single real-time thread**.
- The DLL itself is safe for multiple Engines / Performers from separate threads, but each Performer must be used from only one thread.

### 6.3 The `CMAJOR_DLL` flag must be consistent

If you define `CMAJOR_DLL=1` in one translation unit but not another, you'll get linker errors because the class layouts differ. Define it globally in CMake or as a `/DCMAJOR_DLL=1` compiler flag.

### 6.4 CHOC assert macros

The HelloCmajor example does this:
```cpp
#undef CHOC_ASSERT
#define CHOC_ASSERT(x) assert(x)
```

Without this, the default `CHOC_ASSERT` may call platform-specific assert dialogs. For a console app, redefine to `assert(x)`.

### 6.5 Pre-link endpoint handle capture

`Engine::getEndpointHandle()` MUST be called AFTER `load()` and BEFORE `link()`. After linking, the handles are baked into the performer.

### 6.6 MSVC runtime DLL dependency

`CmajPerformer.dll` was compiled against a specific MSVC CRT version. If the CRT DLLs aren't on the system, the load will fail. VS18 BuildTools installs the redistributable runtime; ensure the MSVC redist is installed or the DLLs are deployable.

---

## Summary: Recommended Fast Path

```
1. git clone --depth 1 --recurse-submodules https://github.com/cmajor-lang/cmajor.git cmajor-sdk
   ↳ Headers land at cmajor-sdk/include/

2. Download https://github.com/cmajor-lang/cmajor/releases/download/1.0.3066/cmajor_win_x64.exe
   (or 1.0.3159 prerelease) → run installer → copy CmajPerformer.dll to your working dir

3. Write a .cpp with:
   #define CMAJOR_DLL 1
   #include "cmajor/API/cmaj_Engine.h"
   cmaj::Library::initialise("CmajPerformer.dll");
   → Engine::create() → Program::parse() → Engine::load() → getEndpointHandle() → Engine::link() → createPerformer() → setBlockSize() → setInputFrames() → advance() → copyOutputFrames()

4. Compile with MSVC:
   cl.exe /std:c++17 /EHsc /DCMAJOR_DLL=1 /I<repo>/include /Fe:test.exe test.cpp

5. Run: test.exe (with CmajPerformer.dll in same dir)

6. For TSan/concurrency proving: move to Linux; TSan does not exist on Windows.
```

### Prebuilt DLL status: ✅ EXISTS
CmajPerformer.dll ships inside the `cmajor_win_x64.exe` NSIS installer on every GitHub release. The installer places it alongside `cmaj.exe`. No source build of LLVM or Cmajor from source is required. The DLL is loaded dynamically via `cmaj::Library::initialise()` — no import library needed.
