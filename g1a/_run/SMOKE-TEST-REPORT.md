# G1A Step 0b — Single-Performer Smoke Test Report

**Date**: 2026-06-30  
**Machine**: Windows x64, MSVC VS18 BuildTools (cl.exe 19.50.35728), CMake 4.3.2  
**Scope**: DE-RISK ONLY — prove Cmajor C++ SDK + single Performer audio render.  
**No concurrent performers attempted.**

---

## 1. Header Acquisition

### Command
```powershell
git clone --depth 1 --filter=blob:none --sparse https://github.com/cmajor-lang/cmajor.git cmajor-headers
cd cmajor-headers
git sparse-checkout set include
```

### Submodule (choc) — SSH→HTTPS fix
The `.gitmodules` use SSH URLs (`git@github.com:…`) which fail without GitHub SSH keys on this machine. Fixed by editing `.gitmodules` to use HTTPS for the `include/choc` submodule:

```powershell
git submodule sync include/choc
git submodule update --depth 1 --init include/choc
```

### Result
Headers at `C:/Users/doner/SSI/g1a/_run/cmajor-headers/include/` with all necessary files:
- `include/cmajor/API/cmaj_Engine.h` ✅
- `include/cmajor/COM/cmaj_Library.h` ✅
- `include/choc/choc/platform/choc_DynamicLibrary.h` ✅

---

## 2. CmajPerformer.dll Acquisition

### Installer type
**CORRECTION vs Grounding**: The Windows installer is **Inno Setup**, NOT NSIS. The grounding document (§2) assumed NSIS.

### Method
Downloaded prerelease 1.0.3159 (newest, June 2026) and installed silently via Inno Setup flags:

```powershell
curl -L -o cmajor_win_x64.exe https://github.com/cmajor-lang/cmajor/releases/download/1.0.3159/cmajor_win_x64.exe
python3 extract_inno.py  # uses /VERYSILENT /SUPPRESSMSGBOXES /DIR=<path>
```

The Inno Setup flags used:
- `/VERYSILENT` — no wizard, no progress UI
- `/SUPPRESSMSGBOXES` — suppress all message boxes
- `/DIR=C:\Users\doner\SSI\g1a\_run\cmajor-bin`

NSIS flags (`/S /D=`) had no effect and the installer returned 0 without extracting anything. 7-Zip (`7z.exe`, `7za.exe` v9.20) could not open the installer as an archive.

### Result
`CmajPerformer.dll` (49,707,008 bytes, v1.0.3159) extracted and copied to `C:/Users/doner/SSI/g1a/_run/CmajPerformer.dll` (next to the test executable).

```
-rwxr-xr-x  CmajPerformer.dll  49,707,008  Jun  3 12:07
-rwxr-xr-x  cmaj.exe           65,092,608  Jun  3 12:15
```

---

## 3. Smoke Host Source

**File**: `C:/Users/doner/SSI/g1a/_run/smoke_host.cpp`

Uses the Gain processor (inline Cmajor source): DC=1.0 input → 50% gain → expect 0.5 output.

### API call sequence (matching grounding):
```
Library::initialise("CmajPerformer.dll")
→ Engine::create()
→ Program::parse(messages, "internal", source)
→ Engine::setBuildSettings(BuildSettings().setFrequency(44100)…)
→ Engine::load(messages, program, {}, {})
→ Engine::getEndpointHandle("in") / getEndpointHandle("out")
→ Engine::link(messages)
→ Engine::createPerformer()
→ Performer::setBlockSize(256)
→ Performer::setInputFrames(inputHandle, data, 256)
→ Performer::advance()
→ Performer::copyOutputFrames(outputHandle, dest, 256)
```

---

## 4. Header-Signature Corrections vs Grounding

| Grounding claim | Actual (real headers) | Fix applied |
|---|---|---|
| `inputBuf.data` gives raw pointer | `AllocatedBuffer` has no public `.data`; must use `.getView().data.data` | Fixed in smoke_host.cpp |
| `Result.getMessage()` exists | `Result` is `enum class : int32_t` {Ok=0, InvalidEndpointHandle=-1,…} | Simplified checkResult |
| `EndpointHandle.isValid()` exists | `EndpointHandle` = `uint32_t`; no methods | Check `!= 0` |
| `createInterleavedBuffer<float>(…)` | Template deduces Sample from lambda return; `<float>` bound to ChannelCountType | Removed explicit `<float>` |
| DLL search: NSIS `/S /D=` | Installer is Inno Setup, needs `/VERYSILENT /DIR=` | Used Inno flags |
| 7-Zip can extract NSIS installer | 7z v9.20 and 7zr v26.02 both failed; installer is Inno, not NSIS | Used silent install |

**No API signature mismatches** — all method names, parameter types, and return types match the grounding document. The corrections were all about C++ wrapper details (struct vs typedef, template deduction, member access paths).

---

## 5. Compile Command

```bat
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
cl.exe /std:c++17 /EHsc /DCMAJOR_DLL=1 ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:smoke_host.exe smoke_host.cpp
```

Compiler: Microsoft (R) C/C++ Optimizing Compiler Version 19.50.35728 for x64  
Linker: Microsoft (R) Incremental Linker Version 14.50.35728.0  

---

## 6. Program Output (stdout)

```
=== G1A Step 0b: Single-Performer Smoke Test ===

Loading CmajPerformer.dll... OK (version: 1.0.3159)

Creating engine... OK

Parsing Gain processor... OK
Configuring build settings... OK
Loading program... OK
Getting endpoint handles... OK (in=1, out=2)
Linking... OK
Creating performer... OK
Setting block size = 256... OK
Setting input frames (DC=1.0)... OK
Advancing (rendering one block)... OK
Copying output frames... OK

=== Output samples (first 8 of 256) ===
  [0] = 0.500000
  [1] = 0.500000
  [2] = 0.500000
  [3] = 0.500000
  [4] = 0.500000
  [5] = 0.500000
  [6] = 0.500000
  [7] = 0.500000

=== VERDICT ===
PASS: Single-performer audio render succeeded.
All output samples ~0.5 (Gain 50% applied to DC=1.0 input).

Engine version: 1.0.3159
XRuns: 0
```

---

## 7. ASan Availability

**ASan**: ✅ Available and functional on this host.

```bat
cl.exe /std:c++17 /EHsc /DCMAJOR_DLL=1 /fsanitize=address ^
  /I"…" /Fe:smoke_host_asan.exe smoke_host.cpp
```

Compiled with warnings (missing `/DEBUG` for better error reporting — cosmetic only). Requires `clang_rt.asan_dynamic-x86_64.dll` at runtime (available at `VC/Tools/MSVC/14.50.35717/bin/Hostx64/x64/`). ASan build produced identical output (0.500000 × 8 frames, XRuns: 0, no sanitizer violations).

**TSan**: ❌ Not available on Windows (as documented in grounding §6.2). Concurrency proving requires Linux.

---

## 8. Final Verdict

| Check | Result |
|---|---|
| Header SDK obtained | ✅ PASS |
| CmajPerformer.dll obtained | ✅ PASS (Inno Setup silent install) |
| Compilation succeeds | ✅ PASS (with 5 header-usage corrections) |
| DLL loads at runtime | ✅ PASS (version 1.0.3159) |
| Engine::create() | ✅ PASS |
| Program::parse() | ✅ PASS |
| Engine::load() | ✅ PASS |
| Engine::link() | ✅ PASS |
| Performer::advance() + copyOutputFrames() | ✅ PASS |
| Output samples match expectation (Gain 0.5) | ✅ PASS (all 0.500000) |
| ASan available | ✅ PASS |
| TSan available | ❌ Not on Windows |

**OVERALL: PASS** — Cmajor C++ SDK is operational on this Windows host for single-performer rendering.

---

## 9. Artifacts

| Artifact | Path |
|---|---|
| SDK headers | `C:/Users/doner/SSI/g1a/_run/cmajor-headers/` |
| CmajPerformer.dll | `C:/Users/doner/SSI/g1a/_run/CmajPerformer.dll` |
| Smoke host source | `C:/Users/doner/SSI/g1a/_run/smoke_host.cpp` |
| Smoke host binary | `C:/Users/doner/SSI/g1a/_run/smoke_host.exe` |
| ASan binary | `C:/Users/doner/SSI/g1a/_run/smoke_host_asan.exe` |
| Python extraction script | `C:/Users/doner/SSI/g1a/_run/extract_inno.py` |
