@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
if errorlevel 1 (echo VC VARS FAILED && exit /b 1)
if not exist diag-buggy-P0\obj mkdir diag-buggy-P0\obj
if not exist diag-buggy-P0\artifacts mkdir diag-buggy-P0\artifacts
echo [compile_buggy] Starting...
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /Fo:diag-buggy-P0\obj\ /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:diag-buggy-P0\g1a_p0_buggy.exe diag-buggy-P0\p0_main.cpp diag-buggy-P0\engine_setup.cpp diag-buggy-P0\event_schedule.cpp diag-buggy-P0\metrics.cpp diag-buggy-P0\proof.cpp > build_buggyP0_normal.log 2>&1
set RC=%ERRORLEVEL%
echo [compile_buggy] exit=%RC%
type build_buggyP0_normal.log
exit /b %RC%
