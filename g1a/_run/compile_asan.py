"""Compile smoke_host.cpp with ASan."""
import subprocess, os

base = r"C:\Users\doner\SSI\g1a\_run"
include = os.path.join(base, "cmajor-headers", "include")
source = os.path.join(base, "smoke_host.cpp")
exe = os.path.join(base, "smoke_host_asan.exe")

batch_content = f'''@echo off
call "C:\\Program Files (x86)\\Microsoft Visual Studio\\18\\BuildTools\\VC\\Auxiliary\\Build\\vcvars64.bat" > nul 2>&1
"C:\\Program Files (x86)\\Microsoft Visual Studio\\18\\BuildTools\\VC\\Tools\\MSVC\\14.50.35717\\bin\\Hostx64\\x64\\cl.exe" /std:c++17 /EHsc /DCMAJOR_DLL=1 /fsanitize=address /I"{include}" /Fe:"{exe}" "{source}"
exit /b %ERRORLEVEL%
'''

batch_path = os.path.join(base, "_compile_asan.bat")
with open(batch_path, 'w') as f:
    f.write(batch_content)

result = subprocess.run(
    ["cmd", "/c", batch_path],
    capture_output=True, text=True, timeout=120, cwd=base
)
print(f"ASan returncode: {result.returncode}")
if result.stdout:
    print("STDOUT:", result.stdout.strip())
if result.stderr:
    print("STDERR:", result.stderr.strip())
