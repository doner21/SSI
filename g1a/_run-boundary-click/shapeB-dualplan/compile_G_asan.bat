@echo off
REM G1A shapeB-dualplan Variant G — ASan build. Adds /fsanitize=address, /Zi /DEBUG, /DG1A_ASAN.
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if not exist objG_asan mkdir objG_asan
if not exist variantG\artifacts mkdir variantG\artifacts
cl.exe /std:c++17 /EHsc /O2 /Zi /DCMAJOR_DLL=1 /DG1A_VARIANT_G /DG1A_ASAN /fsanitize=address ^
  /Fo:objG_asan\ ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:variantG\g1a_boundary_click_G_asan.exe ^
  main.cpp engine_setup.cpp event_schedule.cpp bg_prepare.cpp rt_render.cpp crossfade.cpp swap.cpp reference.cpp perturb.cpp metrics.cpp proof.cpp ^
  /link /DEBUG
@exit /b %ERRORLEVEL%
