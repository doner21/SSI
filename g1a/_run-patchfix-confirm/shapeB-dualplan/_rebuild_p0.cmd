@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if errorlevel 1 (echo VC VARS FAILED && exit /b 1)
echo [rebuild_P0] Starting...
REM Copy trusted exe first, then build over it
copy /Y "C:\Users\doner\SSI\g1a\_run-boundary-click\shapeB-dualplan\variantF\g1a_boundary_click_F.exe" "variantP0\g1a_p0_corrected.exe" > nul 2>&1
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /Fo:variantP0\obj\ /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:variantP0\g1a_p0_corrected.exe variantP0\p0_main.cpp variantP0\engine_setup.cpp variantP0\event_schedule.cpp variantP0\metrics.cpp variantP0\proof.cpp /link /INCREMENTAL:NO > build_P0_normal.log 2>&1
set RC=%ERRORLEVEL%
echo [rebuild_P0] exit=%RC%
type build_P0_normal.log
exit /b %RC%
