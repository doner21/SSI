@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
cd /d "C:\Users\doner\SSI\g1a\_run-patchfix-confirm\shapeB-dualplan"
echo === BUILD P0 CORRECTED NORMAL ===
if not exist variantP0\obj mkdir variantP0\obj
if not exist variantP0\artifacts mkdir variantP0\artifacts
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /Fo:variantP0\obj\ /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:variantP0\g1a_p0_corrected.exe variantP0\p0_main.cpp variantP0\engine_setup.cpp variantP0\event_schedule.cpp variantP0\metrics.cpp variantP0\proof.cpp > build_P0_normal.log 2>&1
echo P0 CORRECTED NORMAL: exit=%ERRORLEVEL%

if %ERRORLEVEL% neq 0 goto :err

echo === RUN P0 CORRECTED NORMAL ===
cd variantP0
g1a_p0_corrected.exe > artifacts\run_normal.log 2>&1
echo P0 CORRECTED RUN: exit=%ERRORLEVEL%
cd ..

echo === BUILD P0 BUGGY NORMAL ===
if not exist diag-buggy-P0\obj mkdir diag-buggy-P0\obj
if not exist diag-buggy-P0\artifacts mkdir diag-buggy-P0\artifacts
del /q diag-buggy-P0\obj\*.obj 2>nul
del /q diag-buggy-P0\g1a_p0_buggy.exe 2>nul
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /Fo:diag-buggy-P0\obj\ /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:diag-buggy-P0\g1a_p0_buggy.exe diag-buggy-P0\p0_main.cpp diag-buggy-P0\engine_setup.cpp diag-buggy-P0\event_schedule.cpp diag-buggy-P0\metrics.cpp diag-buggy-P0\proof.cpp > build_buggyP0_normal.log 2>&1
echo P0 BUGGY NORMAL: exit=%ERRORLEVEL%

if %ERRORLEVEL% neq 0 goto :err

echo === RUN P0 BUGGY NORMAL ===
cd diag-buggy-P0
g1a_p0_buggy.exe > artifacts\run_normal.log 2>&1
echo P0 BUGGY RUN: exit=%ERRORLEVEL%
cd ..

echo === BUILD P0 CORRECTED ASAN ===
if not exist variantP0\obj_asan mkdir variantP0\obj_asan
del /q variantP0\obj_asan\*.obj 2>nul
del /q variantP0\g1a_p0_corrected_asan.exe 2>nul
cl.exe /std:c++17 /EHsc /O2 /Zi /DCMAJOR_DLL=1 /DG1A_ASAN /fsanitize=address /Fo:variantP0\obj_asan\ /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:variantP0\g1a_p0_corrected_asan.exe variantP0\p0_main.cpp variantP0\engine_setup.cpp variantP0\event_schedule.cpp variantP0\metrics.cpp variantP0\proof.cpp /link /DEBUG > build_P0_asan.log 2>&1
echo P0 CORRECTED ASAN: exit=%ERRORLEVEL%

if %ERRORLEVEL% neq 0 goto :err

echo === RUN P0 CORRECTED ASAN ===
cd variantP0
g1a_p0_corrected_asan.exe > artifacts\asan_run.log 2>&1
echo P0 CORRECTED ASAN RUN: exit=%ERRORLEVEL%
cd ..

echo === BUILD P0 BUGGY ASAN ===
if not exist diag-buggy-P0\obj_asan mkdir diag-buggy-P0\obj_asan
del /q diag-buggy-P0\obj_asan\*.obj 2>nul
del /q diag-buggy-P0\g1a_p0_buggy_asan.exe 2>nul
cl.exe /std:c++17 /EHsc /O2 /Zi /DCMAJOR_DLL=1 /DG1A_ASAN /fsanitize=address /Fo:diag-buggy-P0\obj_asan\ /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:diag-buggy-P0\g1a_p0_buggy_asan.exe diag-buggy-P0\p0_main.cpp diag-buggy-P0\engine_setup.cpp diag-buggy-P0\event_schedule.cpp diag-buggy-P0\metrics.cpp diag-buggy-P0\proof.cpp /link /DEBUG > build_buggyP0_asan.log 2>&1
echo P0 BUGGY ASAN: exit=%ERRORLEVEL%

if %ERRORLEVEL% neq 0 goto :err

echo === RUN P0 BUGGY ASAN ===
cd diag-buggy-P0
g1a_p0_buggy_asan.exe > artifacts\asan_run.log 2>&1
echo P0 BUGGY ASAN RUN: exit=%ERRORLEVEL%
cd ..

echo === ALL REBUILDS COMPLETE ===
exit /b 0

:err
echo FATAL BUILD ERROR
exit /b 1
