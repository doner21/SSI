@echo off
REM G1A shapeB-dualplan Variant P0 — ASan build. MSVC cl 19.50, C++17.
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if not exist variantP0\obj_asan mkdir variantP0\obj_asan
if not exist variantP0\artifacts mkdir variantP0\artifacts
cl.exe /std:c++17 /EHsc /O2 /Zi /DCMAJOR_DLL=1 /DG1A_ASAN /fsanitize=address ^
  /Fo:variantP0\obj_asan\ ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:variantP0\g1a_p0_corrected_asan.exe ^
  variantP0\p0_main.cpp variantP0\engine_setup.cpp variantP0\event_schedule.cpp variantP0\metrics.cpp variantP0\proof.cpp ^
  /link /DEBUG
@exit /b %ERRORLEVEL%
