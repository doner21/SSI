"""Compile via temp batch file."""
import subprocess, os, tempfile

base = r"C:\Users\doner\SSI\g1a\_run"
include = os.path.join(base, "cmajor-headers", "include")
source = os.path.join(base, "smoke_host.cpp")
exe = os.path.join(base, "smoke_host.exe")

batch_content = f'''@echo off
call "C:\\Program Files (x86)\\Microsoft Visual Studio\\18\\BuildTools\\VC\\Auxiliary\\Build\\vcvars64.bat" > nul 2>&1
"C:\\Program Files (x86)\\Microsoft Visual Studio\\18\\BuildTools\\VC\\Tools\\MSVC\\14.50.35717\\bin\\Hostx64\\x64\\cl.exe" /std:c++17 /EHsc /DCMAJOR_DLL=1 /I"{include}" /Fe:"{exe}" "{source}"
exit /b %ERRORLEVEL%
'''

batch_path = os.path.join(base, "_compile.bat")
with open(batch_path, 'w') as f:
    f.write(batch_content)

print(f"Batch file written to {batch_path}")
result = subprocess.run(
    ["cmd", "/c", batch_path],
    capture_output=True, text=True, timeout=120, cwd=base
)
print(f"returncode: {result.returncode}")
if result.stdout:
    print("STDOUT:", result.stdout[-5000:])
if result.stderr:
    print("STDERR:", result.stderr[-5000:])
