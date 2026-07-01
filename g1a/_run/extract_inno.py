"""Extract INNO Setup installer silently (not NSIS!)."""
import subprocess, os, time

base = os.path.dirname(__file__)
installer = os.path.join(base, "cmajor_win_x64.exe")
dest = os.path.join(base, "cmajor-bin")

# Clean up any previous partial
if os.path.exists(dest):
    import shutil
    shutil.rmtree(dest)
os.makedirs(dest, exist_ok=True)

# Inno Setup flags:
# /VERYSILENT  - no wizard, no progress, no restart prompt
# /SUPPRESSMSGBOXES - suppress all message boxes
# /DIR=<path>  - installation directory
# /LOG=<file>  - log to file
cmd = [
    installer,
    "/VERYSILENT",
    "/SUPPRESSMSGBOXES",
    f"/DIR={dest}",
    "/LOG=install.log",
]
print(f"Running: {cmd}", flush=True)

result = subprocess.run(cmd, capture_output=True, text=True, timeout=180, cwd=base)
print(f"returncode: {result.returncode}")
print(f"stdout ({len(result.stdout)} bytes): {repr(result.stdout[:500])}")
print(f"stderr ({len(result.stderr)} bytes): {repr(result.stderr[:500])}")

# Check log
log_path = os.path.join(base, "install.log")
if os.path.exists(log_path):
    with open(log_path, 'r', encoding='utf-8', errors='replace') as lf:
        log_content = lf.read()
    print(f"\nLog ({len(log_content)} bytes):")
    print(log_content[:2000])

time.sleep(1)
print("\nFiles extracted:")
count = 0
for root, dirs, files in os.walk(dest):
    for f in files:
        full = os.path.join(root, f)
        size = os.path.getsize(full)
        print(f"  {full} ({size} bytes)")
        count += 1
print(f"\nTotal: {count} files")
