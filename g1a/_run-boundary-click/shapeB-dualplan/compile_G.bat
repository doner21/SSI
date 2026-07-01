@echo off
REM G1A shapeB-dualplan Variant G — normal build. MSVC cl 19.50, C++17.
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if not exist objG mkdir objG
if not exist variantG\artifacts mkdir variantG\artifacts
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /DG1A_VARIANT_G ^
  /Fo:objG\ ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:variantG\g1a_boundary_click_G.exe ^
  main.cpp engine_setup.cpp event_schedule.cpp bg_prepare.cpp rt_render.cpp crossfade.cpp swap.cpp reference.cpp perturb.cpp metrics.cpp proof.cpp
@exit /b %ERRORLEVEL%
