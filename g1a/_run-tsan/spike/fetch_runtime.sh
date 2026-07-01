#!/bin/bash
# fetch_runtime.sh — bounded acquisition of the Linux Cmajor runtime
# libCmajPerformer.so v1.0.3159 (T1 feasibility sub-gate, PRE-REG §5.1).
#
# SEPARATED from build_tsan.sh so the build script stays pure (HARNESS-SPEC §7.2)
# and so every network/file op here is BOUNDED (anti-stall rule):
#   - curl -L -m 120 (hard 120 s cap) to the pre-registered GitHub release asset;
#   - unzip into a WSL-NATIVE /tmp dir (fast; never over the 9p /mnt bridge);
#   - locate the .so with `find` restricted to that small /tmp extract dir
#     (NEVER `find /` or `find /mnt/...` — those crawl the Windows C: drive and hang);
#   - copy the .so into the spike dir (so LD_LIBRARY_PATH picks it up at run time).
# NO sudo/apt anywhere. If curl/unzip are missing, install them out-of-band via
# `wsl -u root bash -lc 'apt-get install -y curl unzip'`.
set -uo pipefail

SPIKE_DIR="/mnt/c/Users/doner/SSI/g1a/_run-tsan/spike"
ARTIFACTS_DIR="/mnt/c/Users/doner/SSI/g1a/_run-tsan/artifacts"
SO_NAME="libCmajPerformer.so"
SO_VERSION="1.0.3159"
SO_URL="https://github.com/cmajor-lang/cmajor/releases/download/1.0.3159/cmajor.linux.x64.zip"

TMPDIR_LOCAL="/tmp/g1a-cmajor-linux"        # WSL-native, NOT under /mnt (fast, safe)
TMPZ="/tmp/cmajor.linux.x64.zip"

mkdir -p "$ARTIFACTS_DIR" "$TMPDIR_LOCAL"

if [ -f "$SPIKE_DIR/$SO_NAME" ]; then
    echo "[fetch] $SO_NAME already present in spike dir — nothing to do."
else
    echo "[fetch] downloading cmajor.linux.x64.zip (bounded: curl -L -m 120) ..."
    curl -L -m 120 -o "$TMPZ" "$SO_URL" || { echo "[fetch] curl FAILED/timed out — T1 feasibility -> branch (ii)"; exit 2; }
    echo "[fetch] unzip into $TMPDIR_LOCAL (native /tmp) ..."
    unzip -o "$TMPZ" -d "$TMPDIR_LOCAL" >/dev/null || { echo "[fetch] unzip FAILED (zip corrupt?) -> branch (ii)"; exit 2; }
    # `find` restricted to the small local extract dir ONLY (never /mnt or /).
    FOUND=$(find "$TMPDIR_LOCAL" -name "$SO_NAME" -type f 2>/dev/null | head -1)
    if [ -z "$FOUND" ]; then
        echo "[fetch] $SO_NAME not found in the extracted zip -> branch (ii)"; exit 2
    fi
    cp "$FOUND" "$SPIKE_DIR/$SO_NAME"
    echo "[fetch] copied $FOUND -> $SPIKE_DIR/$SO_NAME"
fi

# T1 feasibility evidence capture (arch + version) into the proof bundle.
echo "=== file $SO_NAME ==="              | tee "$ARTIFACTS_DIR/runtime_version.txt"
file "$SPIKE_DIR/$SO_NAME"                | tee -a "$ARTIFACTS_DIR/runtime_version.txt"
echo "=== version strings ($SO_VERSION) ===" | tee -a "$ARTIFACTS_DIR/runtime_version.txt"
strings "$SPIKE_DIR/$SO_NAME" 2>/dev/null | grep -F "$SO_VERSION" | head -3 | tee -a "$ARTIFACTS_DIR/runtime_version.txt" \
    || echo "(version string $SO_VERSION not found via strings — escalate, do NOT silently accept)" | tee -a "$ARTIFACTS_DIR/runtime_version.txt"

echo "[fetch] runtime acquisition complete."
