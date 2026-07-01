#!/bin/bash
# run_tsan_cert.sh — locked run script for the G1A TSan/Linux certification
# (HARNESS-SPEC §7.3). Runs the detector-liveness preconditions (T3a control race,
# T3b RT-probe) FIRST, then the main certification run, capturing each binary's
# stderr (TSan diagnostics) to a separate log under artifacts/.
#
# Locked TSAN_OPTIONS (PRE-REG §4.5): report_atomic_races=1, halt_on_error=0,
# history_size=7, suppressions=tsan.suppressions, second_deadlock_stack=1.
set -uo pipefail

SPIKE_DIR="/mnt/c/Users/doner/SSI/g1a/_run-tsan/spike"
ARTIFACTS_DIR="/mnt/c/Users/doner/SSI/g1a/_run-tsan/artifacts"
SUPPRESSIONS="$SPIKE_DIR/tsan.suppressions"
mkdir -p "$ARTIFACTS_DIR"

export TSAN_OPTIONS="report_atomic_races=1:halt_on_error=0:history_size=7:suppressions=$SUPPRESSIONS:second_deadlock_stack=1"

# LD_LIBRARY_PATH must include (a) the spike dir holding libCmajPerformer.so, and
# (b) the clang TSan runtime dir (the binaries are linked -shared-libsan, so
# libclang_rt.tsan-x86_64.so must be loadable). The TSan dir is resolved via
# clang itself (NO filesystem crawl); harmless if clang is absent (gcc path
# static-links libtsan or uses libtsan.so.2 from the default loader path).
TSAN_RT_PATH=$(clang++-18 -print-file-name=libclang_rt.tsan-x86_64.so 2>/dev/null || true)
TSAN_RT_DIR=$(dirname "$TSAN_RT_PATH" 2>/dev/null || true)
export LD_LIBRARY_PATH="$SPIKE_DIR:${TSAN_RT_DIR:-}:${LD_LIBRARY_PATH:-}"

cd "$SPIKE_DIR" || exit 1

# Freeze the suppressions file into the proof bundle (verifier audits it).
cp -f "$SUPPRESSIONS" "$ARTIFACTS_DIR/tsan.suppressions"

# ── Step 0a: Control-race liveness (T3a) ──
echo "=== T3a: Control-race detector liveness ==="
./tsan_control_race > /dev/null 2> "$ARTIFACTS_DIR/tsan_control.log" || true
if grep -q "WARNING: ThreadSanitizer: data race" "$ARTIFACTS_DIR/tsan_control.log"; then
    echo "T3a PASS: TSan caught planted control race (detector alive, with suppressions active)"
else
    echo "T3a FAIL: DETECTOR_LIVENESS_FAIL — TSan did NOT catch the planted control race"
    echo "ABORTING — the TSAN-CLEAN metric would be meaningless."
    exit 1
fi

# ── Step 0b: RT-probe coverage (T3b) ──
echo "=== T3b: RT-thread-coverage witness ==="
./g1a_tsan_rtprobe > /dev/null 2> "$ARTIFACTS_DIR/tsan_rtprobe.log" || true
if grep -q "WARNING: ThreadSanitizer: data race" "$ARTIFACTS_DIR/tsan_rtprobe.log" \
   && grep -q "rt_render" "$ARTIFACTS_DIR/tsan_rtprobe.log"; then
    echo "T3b PASS: TSan caught the RT-probe race naming an rt_render.cpp frame (RT thread covered)"
else
    echo "T3b FAIL: DETECTOR_LIVENESS_FAIL — RT-probe race not caught / not naming an RT frame"
    echo "ABORTING — TSan does not instrument the RT render path."
    exit 1
fi

# ── Step 1: Main certification run (stderr -> tsan_main_run.log) ──
echo "=== Main TSan certification run (R=5 seeded repeats, N=10000 blocks) ==="
./g1a_tsan_host "$ARTIFACTS_DIR" 2> "$ARTIFACTS_DIR/tsan_main_run.log"
RET=$?

# ── Verdict summary (the harness already wrote metrics.json / trace.log) ──
RACE_COUNT=$(grep -c "WARNING: ThreadSanitizer: data race" "$ARTIFACTS_DIR/tsan_main_run.log" 2>/dev/null || echo 0)
WARN_COUNT=$(grep -c "WARNING: ThreadSanitizer" "$ARTIFACTS_DIR/tsan_main_run.log" 2>/dev/null || echo 0)
echo "TSan data-race WARNING count (main run): $RACE_COUNT"
echo "TSan total WARNING count (main run):     $WARN_COUNT"
echo "Host harness return code: $RET"
echo "Proof artifacts written under: $ARTIFACTS_DIR/"
exit $RET
