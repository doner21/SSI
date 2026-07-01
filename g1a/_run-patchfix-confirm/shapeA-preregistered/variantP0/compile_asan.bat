@echo off
REM G1A PATCH-FIX CONFIRM — Variant P0 ASan build. Corrected patch, p0_main.cpp driver.
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
cl.exe /std:c++17 /EHsc /O2 /Zi /DCMAJOR_DLL=1 /DG1A_ASAN /DG1A_VARIANT_F /fsanitize=address ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:g1a_p0_host_asan.exe ^
  p0_main.cpp engine_setup.cpp event_schedule.cpp bg_prepare.cpp rt_render.cpp crossfade.cpp swap.cpp reference.cpp perturb.cpp metrics.cpp proof.cpp ^
  /link /DEBUG ^
  > build_asan.log 2>&1
exit /b %ERRORLEVEL%
