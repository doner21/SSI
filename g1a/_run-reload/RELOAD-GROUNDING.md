# G1A RELOAD-BRIDGE Grounding — Hot-Swap Cmajor Performer

**Date**: 2026-06-30  
**Source**: Real Cmajor C++ SDK headers v1.0.3159 at `C:/Users/doner/SSI/g1a/_run/cmajor-headers/include/`  
**Precedent**: Single-performer render proven in SMOKE-TEST-REPORT.md; API call sequence validated in SDK-GROUNDING.md.  
**Purpose**: Ground every API decision for the RELOAD-BRIDGE harness — hot-swap live performers with crossfade, click-free.

---

## 1. BACKGROUND COMPILE

### Finding: ❌ No async / background-build API exists in these headers.

There is **no** `cmaj::Patch` class, no `buildOnBackgroundThread()`, no async compile API, no incremental link API. The available headers are:

```
API/  → cmaj_Engine.h, cmaj_Performer.h, cmaj_Program.h,
        cmaj_BuildSettings.h, cmaj_DiagnosticMessages.h,
        cmaj_Endpoints.h, cmaj_ExternalVariables.h, cmaj_SourceFiles.h
COM/  → cmaj_EngineInterface.h, cmaj_PerformerInterface.h,
        cmaj_EngineFactoryInterface.h, cmaj_ProgramInterface.h,
        cmaj_Library.h, cmaj_Result.h, cmaj_CacheDatabaseInterface.h
```

None define a `Patch` type. (Checked: `C:/Users/doner/SSI/g1a/_run/cmajor-headers/include/cmajor/API/` — full `ls` above.)

### What EXISTS: synchronous compile on a separate `cmaj::Engine`.

The only path to produce a new performer (from new Cmajor source) is the same synchronous sequence proven in the smoke test, run on a **separate `cmaj::Engine`** object on a background thread:

```cpp
// cmaj_Engine.h, line ~85
static Engine create (const std::string& engineType = {},
                      const choc::value::Value* engineCreationOptions = nullptr);

// cmaj_Engine.h, line ~100
void setBuildSettings (const BuildSettings&);

// cmaj_Engine.h, line ~115
bool load (DiagnosticMessageList& messages,
           const Program& programToLoad,
           ExternalVariableProviderFn getExternalVariable,
           ExternalFunctionProviderFn getExternalFunction);

// cmaj_Engine.h, line ~133 — getEndpointHandle() MUST come AFTER load(), BEFORE link()
EndpointHandle getEndpointHandle (const char* endpointID) const;

// cmaj_Engine.h, line ~140
bool link (DiagnosticMessageList&, CacheDatabaseInterface* optionalCache = nullptr);

// cmaj_Engine.h, line ~150
Performer createPerformer();
```

The `Engine` comment at cmaj_Engine.h:30 confirms: *"This is basically a smart-pointer to an EngineInterface object, so bear in mind that copying an Engine is just copying a (ref-counted) pointer."*

**Workaround for RELOAD-BRIDGE**: Two `Engine` objects, each on its own full load/link/createPerformer pipeline. Engine A with old patch → live; Engine B with new patch → built on background thread. No shared mutable state between the two engines. Each Engine owns its own Performer. The `CacheDatabaseInterface` (optional arg to `link()`, defined in `cmaj_CacheDatabaseInterface.h`) could be used to cache JIT output between builds, but is NOT required for correctness.

### Key constraint — Engine::load/link/createPerformer are NOT RT-thread-safe

The `load/link/createPerformer` sequence on Engine B happens on a non-realtime background thread. The RT thread only touches `Performer::advance()` and its associated frame methods. The `Engine` object is NOT touched on the RT thread after `createPerformer()`. (The Engine is not involved in the render loop — confirmed by Performer methods being entirely self-contained in `cmaj_PerformerInterface.h`.)

---

## 2. ATOMIC SWAP — Lock-Free Handoff at Block Boundary

### Finding: `cmaj::Performer` is a thin struct containing a ref-counted pointer. It is copyable and movable but NOT a trivial value — you cannot hold it in `std::atomic<cmaj::Performer>`.

**Exact type definition** (cmaj_Performer.h, lines 32–69):

```cpp
struct Performer
{
    Performer() = default;
    ~Performer();

    Performer (const Performer&) = default;   // ref-counted pointer copy
    Performer (Performer&&) = default;
    Performer& operator= (const Performer&) = default;
    Performer& operator= (Performer&&) = default;
    Performer (PerformerPtr);                  // wraps the COM smart-pointer

    operator bool() const            { return performer; }
    bool operator!= (decltype (nullptr)) const { return performer; }
    bool operator== (decltype (nullptr)) const { return ! performer; }

    // ... render methods ...

    /// The underlying COM performer pointer
    PerformerPtr performer;          // <-- THIS is the actual handle

private:
    Library::SharedLibraryPtr library;
};
```

**`PerformerPtr`** (cmaj_PerformerInterface.h, line ~118):
```cpp
using PerformerPtr = choc::com::Ptr<PerformerInterface>;
```

**`choc::com::Ptr<Type>`** (choc_COM.h, lines 80–117): stores a single raw `Type* pointer` member. Copy constructor calls `inc()` (atomic `addRef()` on the COM object). Destructor calls `dec()` (atomic `release()`). Copy assignment = inc other + dec self. Move = swap pointers, no ref-count change.

**Implication for lock-free handoff**: `Performer` is not a lock-free type — its copy constructor mutates ref-counts and copies two pointers (performer + library). You CANNOT use `std::atomic<cmaj::Performer>`. But `PerformerPtr` internally stores a raw pointer; the COM object it points to (`PerformerInterface` in the DLL) uses `std::atomic<int> referenceCount` (choc_COM.h:147) for its ref-count.

### Recommended atomic handoff for RELOAD-BRIDGE

**Approach: Atomic index into two pre-created performers, each backed by its own engine on its own thread.**

```
Performers[2]   ← cmaj::Performer[2], pre-created on Engine[0] and Engine[1]
std::atomic<uint32_t> activeIndex { 0 };

RT thread (every block):
    auto idx = activeIndex.load(std::memory_order_acquire);
    perf = &performers[idx];
    perf->setBlockSize(...);
    perf->setInputFrames(...);
    perf->advance();
    perf->copyOutputFrames(...);
    // (crossfade logic in host buffers between perf A's output and perf B's output)

Background thread (after new Engine B is loaded/linked):
    performers[1] = engineB.createPerformer();  // synchronous, may block
    // new performer ready — signal crossfade start
    // ... during crossfade, both performers advance() ...
    activeIndex.store(1, std::memory_order_release);
    // RT thread now reads index=1; no longer touches performers[0]
    // Safe to destroy engine 0 / performer 0 (or keep for next reload)
```

**Rationale**: The atomic `uint32_t` is trivially lock-free on all Windows x64 compilers. The RT thread path is: load index (one atomic load), index into array (one LEA + MOV), then the same Performer call sequence as the proven smoke test. No pointer chasing, no ref-count manipulation on the RT thread during the swap.

**Alternative considered — atomic pointer to heap-allocated Performer**: `std::atomic<cmaj::Performer*>` is possible but requires heap-allocation + manual lifetime management of the Performer struct itself (not just its ref-counted internals). The atomic-index approach is simpler and avoids heap allocation of the wrapper.

---

## 3. SAFE RELEASE — Lifetime Semantics

### Both `cmaj::Engine` and `cmaj::Performer` are ref-counted via `choc::com::Ptr` with atomic reference counts.

**Engine** (cmaj_Engine.h, line 38: *"copying an Engine is just copying a (ref-counted) pointer"*):
```cpp
// cmaj_Engine.h, line 37
EnginePtr engine;        // the underlying COM smart-pointer

// destructor (cmaj_Engine.h, line ~160)
inline Engine::~Engine()
{
    engine = {};   // explicitly release the engine before the library
    library = {};
}
```

**Performer** (cmaj_Performer.h, line 39: *"copying a Performer is just copying a (ref-counted) pointer"*):
```cpp
// cmaj_Performer.h, line 68
PerformerPtr performer;  // the underlying COM smart-pointer

// destructor (cmaj_Performer.h, line ~85)
inline Performer::~Performer()
{
    performer = {};  // explicitly release the performer before the library
    library = {};
}
```

**The COM ref-count is atomic** (choc_COM.h:147):
```cpp
struct ObjectWithAtomicRefCount ... {
    std::atomic<int> referenceCount { 1 };
    int addRef() noexcept override { return ++referenceCount; }
    int release() noexcept override {
        auto count = --referenceCount;
        if (count > 0) return count;
        delete static_cast<DerivedClass*>(this);
        return 0;
    }
};
```

### Safe release protocol after swap

After `activeIndex.store(1, memory_order_release)`:

1. The RT thread is guaranteed to perform its next index `load(acquire)` and see index=1. It will use `performers[1]` for all subsequent blocks. It will NOT touch `performers[0]`.
2. The OLD performer (`performers[0]`) is still alive in the array. Its ref-count is 1 (only held by our host-side `performers[0]` variable). The RT thread has no pointer to it.
3. It is safe to `performers[0] = {};` (or `performers[0] = cmaj::Performer{};`) which triggers the destructor/decrement. The `PerformerInterface` COM object will be deleted if ref-count reaches 0.
4. It is also safe to destroy the old `cmaj::Engine[0]` object, which will release its `EnginePtr`.

**Safety guarantee**: The COM ref-count operations (`addRef`/`release`) ARE atomic. The raw pointer inside `choc::com::Ptr` is only touched by one thread at a time after the atomic index handoff. No data race.

**Corner case — RT thread mid-`advance()` during swap**: Since the swap is driven by the RT thread's own block loop (it reads `activeIndex` at the start of each block), the swap only takes effect at block boundaries. There is no pre-emption concern because the RT thread is the *only* consumer of the performer. The background thread never touches the performer while the RT thread might be mid-block.

---

## 4. RENDER LOOP — Crossfading Two Live Performers

Confirmed: the per-block call sequence is identical to the proven first-pass smoke test. For crossfading, the host runs BOTH performers` advance()` for the duration of the crossfade window (e.g. N blocks).

### Per-block sequence (per performer) — from cmaj_PerformerInterface.h

```cpp
// cmaj_PerformerInterface.h, line 40 — setBlockSize
virtual Result setBlockSize (uint32_t numFramesForNextBlock) = 0;

// cmaj_PerformerInterface.h, line 53 — setInputFrames (for each input stream endpoint)
virtual Result setInputFrames (EndpointHandle, const void* frameData, uint32_t numFrames) = 0;

// cmaj_PerformerInterface.h, line 93 — advance
virtual Result advance() = 0;

// cmaj_PerformerInterface.h, line 68 — copyOutputFrames (for each output stream endpoint)
virtual Result copyOutputFrames (EndpointHandle, void* dest, uint32_t numFramesToCopy) = 0;
```

`Result` is an `enum class : int32_t` (cmaj_Result.h): `Ok=0`, `InvalidEndpointHandle=-1`, `InvalidBlockSize=-2`, `TypeIndexOutOfRange=-3`. Not an error-string type — checked with `== cmaj::Result::Ok`.

### Crossfade loop structure (host-side, not in Cmajor API)

```
For each audio block during crossfade window:
    // Advance both performers with same input
    performerA.setBlockSize(N); performerA.setInputFrames(...);
    performerB.setBlockSize(N); performerB.setInputFrames(...);
    performerA.advance(); performerB.advance();
    performerA.copyOutputFrames(outHandle, bufA, N);
    performerB.copyOutputFrames(outHandle, bufB, N);

    // Crossfade: output = bufA * (1 - t) + bufB * t,  t in [0,1]
    // (increment t linearly across the crossfade window)

After crossfade: atomic swap activeIndex.

Note: both performers share the same input data, so they process identically
during the crossfade period. The crossfade is purely a host-side mixing operation.
```

### EndpointHandle stability

`EndpointHandle` is `uint32_t` (cmaj_PerformerInterface.h, line ~21). Handles are obtained from **the Engine** via `Engine::getEndpointHandle(const char*)` — called AFTER `load()` and BEFORE `link()`. They are baked into the performer at link time. Since each performer comes from a different Engine with different source code, the endpoint handles may differ between engines even for the same logical endpoint name.

**Workaround**: Store endpoint handles per-engine/performer pair. Do not assume handle value portability across engines. If the old and new patches have the same endpoint ID names, the handle values are likely (but not guaranteed) to be 1, 2, 3... — but still, store them against each performer.

---

## 5. Threading Model Summary

| Thread | What it touches | APIs used |
|---|---|---|
| **RT thread** | `activeIndex` (atomic load), `performers[idx]` (read-only index), Performer methods | `setBlockSize`, `setInputFrames`, `advance`, `copyOutputFrames` |
| **BG compile thread** | `Engine::create()`, `Program::parse()`, `Engine::load/link/createPerformer` on Engine B | The full load→link→createPerformer sequence |
| **Never on RT thread** | `Engine::load()`, `Engine::link()`, `Engine::createPerformer()`, `Program::parse()` | All heavy compile/link work |

Confirmed: per-Performer single-thread model (cmaj_Performer.h:53: *"This function must only be called on the rendering thread"* on `setInputFrames`, `advance`, `copyOutputFrames`). Multiple Performers can be advanced from the same RT thread — each is independent.

---

## 6. Verdict — Can the Harness Be Built?

| Requirement | Feasible? | Grounding |
|---|---|---|
| Background JIT compile of new patch | ✅ YES — synchronous `Engine::create→load→link→createPerformer` on a bg thread with a **separate Engine** object | §1 — two-Engine pattern required; no async API exists |
| Atomic swap at block boundary | ✅ YES — `std::atomic<uint32_t>` index into `cmaj::Performer[2]` array | §2 — Performer is ref-counted, not value-atomic; index swap is the clean lock-free path |
| Safe release of old performer | ✅ YES — after `activeIndex.store(release)`, RT reads `acquire` and sees new index; old performer can be released | §3 — COM ref-counts are atomic; no RT data race |
| Click-free crossfade | ✅ YES — host-side mixing of both performers' outputs during a linear crossfade window | §4 — both performers advance independently; host sums weighted outputs |
| Per-block render loop | ✅ YES — same `setBlockSize→setInputFrames→advance→copyOutputFrames` proven in SMOKE-TEST-REPORT.md | §4 — exact header signatures cited |

**Overall**: The RELOAD-BRIDGE is buildable with the proven API surface. The only architectural implication is the **two-Engine design** (no single-Engine hot-reload). This is an established pattern in live-audio hot-swap systems (e.g. JUCE's `AudioProcessorGraph`).

---

## 7. Open Risks

1. **EndpointHandle stability across engines**: handles are opaque uint32_t values from the COM layer. If two different Cmajor patches define different endpoint layouts, the handle-to-semantic-name mapping may differ. The harness must store handles per-engine, not assume `in=1, out=2` globally.
2. **Crossfade window length**: not an API constraint — a host tuning parameter. The Cmajor API imposes no extra latency beyond `getLatency()` on each performer.
3. **No TSan on Windows**: concurrency correctness relies on the atomic-index pattern being correct by construction. Move to Linux for TSan if needed. See SDK-GROUNDING.md §6.2.
4. **DLL search path**: `cmaj::Library::initialise("CmajPerformer.dll")` must resolve; safest is full absolute path. See SMOKE-TEST-REPORT.md §4.
