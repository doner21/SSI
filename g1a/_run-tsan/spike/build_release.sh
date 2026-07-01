#!/bin/bash
# build_release.sh — optional companion (HARNESS-SPEC §1): a NON-TSan functional
# baseline build (-O2 -DNDEBUG, no -fsanitize=thread) for a quick functional
# sanity render outside the TSan slowdown. NOT part of the certification gates;
# the certification uses build_tsan.sh exclusively.
set -uo pipefail

SPIKE_DIR="/mnt/c/Users/doner/SSI/g1a/_run-tsan/spike"
HDR_ROOT="/mnt/c/Users/doner/SSI/g1a/_run/cmajor-headers/include"
cd "$SPIKE_DIR" || exit 1

CXX=clang++-18
command -v "$CXX" >/dev/null 2>&1 || CXX=g++-12
command -v "$CXX" >/dev/null 2>&1 || CXX=g++

CXXFLAGS="-std=c++17 -O2 -DNDEBUG -DCMAJOR_DLL=1 -I$HDR_ROOT"
LDFLAGS="-lpthread -ldl"

echo "=== Release (no TSan) baseline build with $CXX ==="
for SRC in engine_setup bg_compiler swap rt_render crossfade perturb metrics proof main; do
    "$CXX" $CXXFLAGS -c "$SRC.cpp" -o "${SRC}_rel.o" || { echo "compile failed: $SRC"; exit 1; }
done
"$CXX" -o g1a_release_host \
    engine_setup_rel.o bg_compiler_rel.o swap_rel.o rt_render_rel.o \
    crossfade_rel.o perturb_rel.o metrics_rel.o proof_rel.o main_rel.o $LDFLAGS \
    || { echo "link failed"; exit 1; }
echo "=== Release baseline built: g1a_release_host (functional only, NOT a cert gate) ==="
