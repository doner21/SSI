@echo off
REM G1A shapeB-dualplan Variant F — ASan build. Adds /fsanitize=address, /Zi /DEBUG, /DG1A_ASAN.
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if not exist objF_asan mkdir objF_asan
if not exist variantF\artifacts mkdir variantF\artifacts
cl.exe /std:c++17 /EHsc /O2 /Zi /DCMAJOR_DLL=1 /DG1A_VARIANT_F /DG1A_ASAN /fsanitize=address ^
  /Fo:objF_asan\ ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:variantF\g1a_boundary_click_F_asan.exe ^
  main.cpp engine_setup.cpp event_schedule.cpp bg_prepare.cpp rt_render.cpp crossfade.cpp swap.cpp reference.cpp perturb.cpp metrics.cpp proof.cpp ^
  /link /DEBUG
@exit /b %ERRORLEVEL%
