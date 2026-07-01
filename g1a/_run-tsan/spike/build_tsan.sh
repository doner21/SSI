#!/bin/bash
# build_tsan.sh — locked build script for the G1A TSan/Linux certification
# (HARNESS-SPEC §7.2). Primary compiler clang++-18; pre-declared single-swap
# fallback g++-12 (only if clang++-18 cannot link the TSan runtime against
# libCmajPerformer.so). Captures build.log + ldd.txt + runtime_version.txt for
# the T1 proof (PRE-REG §5.1 / §6).
#
# Locked flags (do NOT change): -std=c++17 -fsanitize=thread -g -O1 -DCMAJOR_DLL=1
#                               link: -fsanitize=thread -lpthread -ldl
set -uo pipefail

SPIKE_DIR="/mnt/c/Users/doner/SSI/g1a/_run-tsan/spike"
ARTIFACTS_DIR="/mnt/c/Users/doner/SSI/g1a/_run-tsan/artifacts"
HDR_ROOT="/mnt/c/Users/doner/SSI/g1a/_run/cmajor-headers/include"
SO_NAME="libCmajPerformer.so"
SO_VERSION="1.0.3159"

mkdir -p "$ARTIFACTS_DIR"
BUILD_LOG="$ARTIFACTS_DIR/build.log"
: > "$BUILD_LOG"
log(){ echo "$@" | tee -a "$BUILD_LOG"; }
run(){ echo "+ $*" | tee -a "$BUILD_LOG"; "$@" 2>&1 | tee -a "$BUILD_LOG"; return "${PIPESTATUS[0]}"; }

cd "$SPIKE_DIR" || { echo "no spike dir"; exit 1; }

# ── 0. Toolchain check (environment is PRE-PROVISIONED — do NOT apt/sudo here) ──
# The orchestrator verified clang++-18 + TSan are live. We NEVER run sudo/apt in
# this build script (interactive sudo has no password and HANGS under WSL2). If a
# dependency is genuinely missing, install it out-of-band via `wsl -u root ...`.
# Runtime .so acquisition is a SEPARATE bounded step: fetch_runtime.sh.
log "=== Toolchain check (no sudo/apt; env pre-provisioned) ==="
command -v clang++-18 >/dev/null 2>&1 && log "clang++-18: present" || log "clang++-18: MISSING (run fetch/setup out-of-band)"
command -v g++        >/dev/null 2>&1 && log "g++:        present ($(g++ -dumpversion 2>/dev/null))" || log "g++: MISSING"

# ── 1. Linux runtime .so presence (obtained out-of-band by fetch_runtime.sh) ──
log "=== Linux Cmajor runtime ($SO_NAME v$SO_VERSION) ==="
if [ -f "$SPIKE_DIR/$SO_NAME" ]; then
    log "--- file $SO_NAME ---"
    file "$SPIKE_DIR/$SO_NAME" 2>&1 | tee -a "$BUILD_LOG"
    log "--- version strings ($SO_VERSION) ---"
    strings "$SPIKE_DIR/$SO_NAME" 2>/dev/null | grep -F "$SO_VERSION" | head -3 | tee -a "$BUILD_LOG" \
        | tee "$ARTIFACTS_DIR/runtime_version.txt" || true
else
    log "WARNING: $SO_NAME NOT obtained — T1 feasibility sub-gate will FAIL -> branch (ii)"
fi

# ── 2. Select compiler (clang++-18 primary; pre-declared gcc fallback) ──
# PRE-REG names g++-12 as the single-swap fallback; on this host the gcc path is
# g++ 13.3 (+ libtsan.so.2). clang++-18 is the PRIMARY and is used unless it
# cannot link the TSan runtime; the gcc fallback fires only in that case.
CXX=clang++-18
command -v "$CXX" >/dev/null 2>&1 || CXX=g++-12
command -v "$CXX" >/dev/null 2>&1 || CXX=g++
log "=== Compiler: $CXX ==="

# Locked sanitizer/opt/std flags (frozen): -std=c++17 -fsanitize=thread -g -O1.
# LINK adds -shared-libsan so the TSan runtime is a DYNAMIC dependency and the
# frozen T1 checks (`ldd|grep tsan`, `readelf -d ... tsan NEEDED`) literally pass
# (clang otherwise STATIC-links TSan -> empty ldd). Orchestrator-sanctioned; this
# changes only HOW the runtime is linked, not instrumentation or any threshold.
CXXFLAGS="-std=c++17 -fsanitize=thread -g -O1 -DCMAJOR_DLL=1 -I$HDR_ROOT"
LDFLAGS="-fsanitize=thread -shared-libsan -lpthread -ldl"

# Directory of the clang TSan runtime .so (needed on LD_LIBRARY_PATH to load the
# -shared-libsan binaries). Located via clang itself (NO filesystem crawl).
TSAN_RT_PATH=$("$CXX" -print-file-name=libclang_rt.tsan-x86_64.so 2>/dev/null || true)
TSAN_RT_DIR=$(dirname "$TSAN_RT_PATH" 2>/dev/null || true)
if [ -n "$TSAN_RT_DIR" ] && [ -f "$TSAN_RT_PATH" ]; then
    log "TSan runtime .so: $TSAN_RT_PATH"
    export LD_LIBRARY_PATH="$TSAN_RT_DIR:${LD_LIBRARY_PATH:-}"
else
    log "NOTE: clang TSan runtime .so not resolved via -print-file-name (gcc path uses libtsan.so.2)"
fi

compile(){ run "$CXX" $CXXFLAGS -c "$1" -o "$2" || { log "COMPILE FAILED: $1"; exit 1; }; }

# ── 3. Main harness (g1a_tsan_host) ──
log "=== Building main harness (g1a_tsan_host) ==="
compile engine_setup.cpp engine_setup.o
compile bg_compiler.cpp  bg_compiler.o
compile swap.cpp         swap.o
compile rt_render.cpp    rt_render.o
compile crossfade.cpp    crossfade.o
compile perturb.cpp      perturb.o
compile metrics.cpp      metrics.o
compile proof.cpp        proof.o
compile main.cpp         main.o
run "$CXX" $LDFLAGS -o g1a_tsan_host \
    engine_setup.o bg_compiler.o swap.o rt_render.o \
    crossfade.o perturb.o metrics.o proof.o main.o || { log "LINK FAILED: g1a_tsan_host"; exit 1; }

# ── 4. Control-race binary (T3a) ──
log "=== Building control-race binary (tsan_control_race) ==="
compile tsan_control_race.cpp tsan_control_race.o
run "$CXX" $LDFLAGS -o tsan_control_race tsan_control_race.o || { log "LINK FAILED: tsan_control_race"; exit 1; }

# ── 5. RT-probe binary (T3b) — same sources + -DTSAN_RT_PROBE ──
log "=== Building RT-probe binary (g1a_tsan_rtprobe) ==="
run "$CXX" $CXXFLAGS -DTSAN_RT_PROBE -c rt_render.cpp -o rt_render_probe.o || { log "COMPILE FAILED: rt_render(probe)"; exit 1; }
run "$CXX" $CXXFLAGS -DTSAN_RT_PROBE -c main.cpp      -o main_probe.o      || { log "COMPILE FAILED: main(probe)"; exit 1; }
run "$CXX" $LDFLAGS -o g1a_tsan_rtprobe \
    engine_setup.o bg_compiler.o swap.o rt_render_probe.o \
    crossfade.o perturb.o metrics.o proof.o main_probe.o || { log "LINK FAILED: g1a_tsan_rtprobe"; exit 1; }

# ── 6. Verify TSan runtime linked + instrumentation symbols in all binaries ──
# IMPORTANT: capture command output into variables and grep the VARIABLES. Do NOT
# pipe a large producer (nm/ldd) into `grep -q` under `set -o pipefail`: grep -q
# closes the pipe on first match, the producer gets SIGPIPE (141), and pipefail
# then reports the whole pipeline as FAILED even though the match was found.
log "=== Verifying TSan linkage (ldd / nm __tsan_ / readelf -d) ==="
: > "$ARTIFACTS_DIR/ldd.txt"
ALL_OK=1
for BIN in g1a_tsan_host tsan_control_race g1a_tsan_rtprobe; do
    log "--- $BIN ---"
    LDD_OUT=$(ldd "$BIN" 2>/dev/null || true)
    NM_OUT=$( { nm "$BIN" 2>/dev/null; nm -D "$BIN" 2>/dev/null; } | grep '__tsan_' || true)
    RELF_OUT=$(readelf -d "$BIN" 2>/dev/null | grep -Ei 'tsan|NEEDED' || true)

    { echo "=== ldd $BIN ==="; echo "$LDD_OUT"; } | tee -a "$BUILD_LOG" >> "$ARTIFACTS_DIR/ldd.txt"
    { echo "=== nm __tsan_ (first 5) $BIN ==="; echo "$NM_OUT" | head -5; } | tee -a "$BUILD_LOG" >/dev/null
    { echo "=== readelf -d $BIN (NEEDED) ==="; echo "$RELF_OUT"; } | tee -a "$BUILD_LOG" >/dev/null

    # ldd OR readelf naming the tsan runtime satisfies the dynamic-link check.
    if echo "$LDD_OUT" | grep -Eqi 'tsan' || echo "$RELF_OUT" | grep -Eqi 'libclang_rt.tsan|libtsan'; then
        log "  ldd/readelf: TSan runtime is a NEEDED dynamic dependency OK"
    else
        log "  ldd/readelf: TSan runtime NOT a dynamic dependency in $BIN — BUILD FAILED"; ALL_OK=0
    fi
    if [ -n "$NM_OUT" ]; then
        log "  nm: __tsan_ instrumentation symbols present"
    else
        log "  nm: no __tsan_ symbols in $BIN — BUILD FAILED"; ALL_OK=0
    fi
done

if [ "$ALL_OK" = "1" ]; then
    log "=== Build complete — TSan linked in all binaries ==="
else
    log "=== Build INCOMPLETE — TSan linkage verification failed ==="
    exit 1
fi
