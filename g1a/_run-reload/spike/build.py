"""Compile the G1A RELOAD-BRIDGE spike via a temp batch file (proven pass-1 method)."""
import subprocess, os, sys

base = r"C:\Users\doner\SSI\g1a\_run-reload\spike"
include = r"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include"
vcvars = r"C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
sources = "main.cpp engine_setup.cpp bg_compiler.cpp swap.cpp rt_render.cpp crossfade.cpp perturb.cpp metrics.cpp proof.cpp"

asan = "--asan" in sys.argv
if asan:
    exe = "g1a_reload_host_asan.exe"
    extra = "/Zi /DG1A_ASAN /fsanitize=address"
    link = " /link /DEBUG"
else:
    exe = "g1a_reload_host.exe"
    extra = ""
    link = ""

batch = f'''@echo off
call "{vcvars}" > nul 2>&1
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 {extra} /I"{include}" /Fe:{exe} {sources}{link}
exit /b %ERRORLEVEL%
'''
bp = os.path.join(base, "_build_tmp.bat")
with open(bp, "w") as f:
    f.write(batch)

r = subprocess.run(["cmd", "/c", bp], capture_output=True, text=True, timeout=600, cwd=base)
print("returncode:", r.returncode)
if r.stdout: print("STDOUT:\n", r.stdout[-8000:])
if r.stderr: print("STDERR:\n", r.stderr[-8000:])
print("EXE exists:", os.path.exists(os.path.join(base, exe)))
