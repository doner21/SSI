@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if errorlevel 1 (echo VC VARS FAILED && exit /b 1)
echo [rebuild_buggy] Starting...
copy /Y "C:\Users\doner\SSI\g1a\_run-boundary-click\shapeB-dualplan\variantF\g1a_boundary_click_F.exe" "diag-buggy-P0\g1a_p0_buggy.exe" > nul 2>&1
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /Fo:diag-buggy-P0\obj\ /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:diag-buggy-P0\g1a_p0_buggy.exe diag-buggy-P0\p0_main.cpp diag-buggy-P0\engine_setup.cpp diag-buggy-P0\event_schedule.cpp diag-buggy-P0\metrics.cpp diag-buggy-P0\proof.cpp /link /INCREMENTAL:NO > build_buggyP0_normal.log 2>&1
set RC=%ERRORLEVEL%
echo [rebuild_buggy] exit=%RC%
type build_buggyP0_normal.log
exit /b %RC%
