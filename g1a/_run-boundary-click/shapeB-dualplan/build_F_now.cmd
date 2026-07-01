@echo off
REM Build script for Variant F
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if errorlevel 1 (
    echo VC VARS FAILED
    exit /b 1
)
if not exist objF mkdir objF
if not exist variantF mkdir variantF
if not exist variantF\artifacts mkdir variantF\artifacts

echo [compile_F] Starting...
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /DG1A_VARIANT_F ^
  /Fo:objF\ ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:variantF\g1a_boundary_click_F.exe ^
  main.cpp engine_setup.cpp event_schedule.cpp bg_prepare.cpp rt_render.cpp crossfade.cpp swap.cpp reference.cpp perturb.cpp metrics.cpp proof.cpp > build_F_normal.log 2>&1
set RC=%ERRORLEVEL%
echo [compile_F] exit=%RC%
type build_F_normal.log
exit /b %RC%
