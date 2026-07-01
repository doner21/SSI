@echo off
REM G1A spike — driver: stage DLLs, run ASan exe (capture log), then normal exe (writes artifacts).
setlocal
cd /d "C:\Users\doner\SSI\g1a\_run\spike"

REM Stage runtime DLLs next to the executables (SDK-GROUNDING §6.1).
copy /y "C:\Users\doner\SSI\g1a\_run\CmajPerformer.dll" . > nul
copy /y "C:\Users\doner\SSI\g1a\_run\clang_rt.asan_dynamic-x86_64.dll" . > nul

if not exist "artifacts" mkdir "artifacts"

echo === Running ASan build (memory-safety exercise) ===
"g1a_host_asan.exe" asan > "artifacts\asan_run.log" 2>&1
echo ASan exe exit code: %ERRORLEVEL%
type "artifacts\asan_run.log"

echo.
echo === Running normal build (metrics + proof artifact) ===
"g1a_host.exe"
echo Normal exe exit code: %ERRORLEVEL%

endlocal
