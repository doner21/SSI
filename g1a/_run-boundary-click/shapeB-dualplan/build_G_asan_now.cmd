@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if errorlevel 1 (echo VC VARS FAILED & exit /b 1)
if not exist objG_asan mkdir objG_asan
if not exist variantG mkdir variantG
if not exist variantG\artifacts mkdir variantG\artifacts
echo [compile_G_asan] Starting...
cl.exe /std:c++17 /EHsc /O2 /Zi /DCMAJOR_DLL=1 /DG1A_VARIANT_G /DG1A_ASAN /fsanitize=address /Fo:objG_asan\ /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:variantG\g1a_boundary_click_G_asan.exe main.cpp engine_setup.cpp event_schedule.cpp bg_prepare.cpp rt_render.cpp crossfade.cpp swap.cpp reference.cpp perturb.cpp metrics.cpp proof.cpp /link /DEBUG > build_G_asan.log 2>&1
set RC=%ERRORLEVEL%
echo [compile_G_asan] exit=%RC%
type build_G_asan.log
exit /b %RC%
