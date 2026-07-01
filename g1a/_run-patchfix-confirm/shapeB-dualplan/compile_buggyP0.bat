@echo off
REM G1A shapeB-dualplan Diag Buggy-P0 — normal build. MSVC cl 19.50, C++17.
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if not exist diag-buggy-P0\obj mkdir diag-buggy-P0\obj
if not exist diag-buggy-P0\artifacts mkdir diag-buggy-P0\artifacts
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 ^
  /Fo:diag-buggy-P0\obj\ ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:diag-buggy-P0\g1a_p0_buggy.exe ^
  diag-buggy-P0\p0_main.cpp diag-buggy-P0\engine_setup.cpp diag-buggy-P0\event_schedule.cpp diag-buggy-P0\metrics.cpp diag-buggy-P0\proof.cpp
@exit /b %ERRORLEVEL%
