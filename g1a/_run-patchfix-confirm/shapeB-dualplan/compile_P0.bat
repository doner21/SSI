@echo off
REM G1A shapeB-dualplan P0 Variant — normal build. MSVC cl 19.50, C++17.
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if not exist variantP0\obj mkdir variantP0\obj
if not exist variantP0\artifacts mkdir variantP0\artifacts
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 ^
  /Fo:variantP0\obj\ ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:variantP0\g1a_p0_corrected.exe ^
  variantP0\p0_main.cpp variantP0\engine_setup.cpp variantP0\event_schedule.cpp variantP0\metrics.cpp variantP0\proof.cpp
@exit /b %ERRORLEVEL%
