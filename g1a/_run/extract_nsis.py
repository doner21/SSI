"""Extract NSIS installer silently using Python subprocess."""
import subprocess, os, sys, time

installer = os.path.join(os.path.dirname(__file__), "cmajor_win_x64.exe")
dest = os.path.join(os.path.dirname(__file__), "cmajor-bin")

os.makedirs(dest, exist_ok=True)

# NSIS: /S = silent, /D=<path> must be the LAST argument
cmd = [installer, "/S", f"/D={dest}"]
print(f"Running: {cmd}", flush=True)

result = subprocess.run(cmd, capture_output=True, text=True, timeout=120, cwd=os.path.dirname(__file__))
print(f"returncode: {result.returncode}")
print(f"stdout ({len(result.stdout)} bytes): {repr(result.stdout[:300])}")
print(f"stderr ({len(result.stderr)} bytes): {repr(result.stderr[:300])}")

time.sleep(2)
print("\nFiles extracted:")
count = 0
for root, dirs, files in os.walk(dest):
    for f in files:
        full = os.path.join(root, f)
        size = os.path.getsize(full)
        print(f"  {full} ({size} bytes)")
        count += 1
print(f"\nTotal: {count} files")
