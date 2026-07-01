@echo off
REM G1A spike — NORMAL build (HARNESS-SPEC.md §7).
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
cd /d "C:\Users\doner\SSI\g1a\_run\spike"
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:g1a_host.exe ^
  main.cpp engine_setup.cpp rt_performer.cpp barrier_mixer.cpp perturb.cpp metrics.cpp proof.cpp
exit /b %ERRORLEVEL%
