@echo off
REM G1A shapeB-dualplan Diag Buggy-P0 — ASan build. MSVC cl 19.50, C++17.
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if not exist diag-buggy-P0\obj_asan mkdir diag-buggy-P0\obj_asan
if not exist diag-buggy-P0\artifacts mkdir diag-buggy-P0\artifacts
cl.exe /std:c++17 /EHsc /O2 /Zi /DCMAJOR_DLL=1 /DG1A_ASAN /fsanitize=address ^
  /Fo:diag-buggy-P0\obj_asan\ ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:diag-buggy-P0\g1a_p0_buggy_asan.exe ^
  diag-buggy-P0\p0_main.cpp diag-buggy-P0\engine_setup.cpp diag-buggy-P0\event_schedule.cpp diag-buggy-P0\metrics.cpp diag-buggy-P0\proof.cpp ^
  /link /DEBUG
@exit /b %ERRORLEVEL%
