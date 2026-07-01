@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if errorlevel 1 (echo VC VARS FAILED && exit /b 1)
if not exist variantP1\obj mkdir variantP1\obj
if not exist variantP1\artifacts mkdir variantP1\artifacts
echo [compile_P1] Starting...
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /DG1A_VARIANT_F /Fo:variantP1\obj\ /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:variantP1\g1a_boundary_click_P1.exe variantP1\main.cpp variantP1\engine_setup.cpp variantP1\event_schedule.cpp variantP1\bg_prepare.cpp variantP1\rt_render.cpp variantP1\crossfade.cpp variantP1\swap.cpp variantP1\reference.cpp variantP1\perturb.cpp variantP1\metrics.cpp variantP1\proof.cpp > build_P1_normal.log 2>&1
set RC=%ERRORLEVEL%
echo [compile_P1] exit=%RC%
type build_P1_normal.log
exit /b %RC%
