@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if errorlevel 1 (echo VC VARS FAILED && exit /b 1)

echo [rebuild_P1_normal] Starting...
copy /Y "C:\Users\doner\SSI\g1a\_run-boundary-click\shapeB-dualplan\variantF\g1a_boundary_click_F.exe" "variantP1\g1a_boundary_click_P1.exe" > nul 2>&1
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /DG1A_VARIANT_F /Fo:variantP1\obj\ /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:variantP1\g1a_boundary_click_P1.exe variantP1\main.cpp variantP1\engine_setup.cpp variantP1\event_schedule.cpp variantP1\bg_prepare.cpp variantP1\rt_render.cpp variantP1\crossfade.cpp variantP1\swap.cpp variantP1\reference.cpp variantP1\perturb.cpp variantP1\metrics.cpp variantP1\proof.cpp /link /INCREMENTAL:NO > build_P1_normal.log 2>&1
set RC=%ERRORLEVEL%
echo [rebuild_P1_normal] exit=%RC%
type build_P1_normal.log

echo.
echo [rebuild_P1_ASAN] Starting...
copy /Y "C:\Users\doner\SSI\g1a\_run-boundary-click\shapeB-dualplan\variantF\g1a_boundary_click_F_asan.exe" "variantP1\g1a_boundary_click_P1_asan.exe" > nul 2>&1
cl.exe /std:c++17 /EHsc /O2 /Zi /DCMAJOR_DLL=1 /DG1A_VARIANT_F /DG1A_ASAN /fsanitize=address /Fo:variantP1\obj_asan\ /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:variantP1\g1a_boundary_click_P1_asan.exe variantP1\main.cpp variantP1\engine_setup.cpp variantP1\event_schedule.cpp variantP1\bg_prepare.cpp variantP1\rt_render.cpp variantP1\crossfade.cpp variantP1\swap.cpp variantP1\reference.cpp variantP1\perturb.cpp variantP1\metrics.cpp variantP1\proof.cpp /link /DEBUG /INCREMENTAL:NO > build_P1_asan.log 2>&1
set RC2=%ERRORLEVEL%
echo [rebuild_P1_ASAN] exit=%RC2%
type build_P1_asan.log
exit /b %RC2%
