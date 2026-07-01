@echo off
REM G1A PATCH-FIX CONFIRM — Variant P0 run order.
REM 1) ASan build first -> artifacts\asan_run.log.
REM 2) Normal build (certifying render) writes metrics.json/trace.log/WAVs + verdict.
setlocal
cd /d "%~dp0"
if not exist artifacts mkdir artifacts

echo [p0] ASan build render...
g1a_p0_host_asan.exe > artifacts\asan_run.log 2>&1
echo [p0] ASan exit=%ERRORLEVEL%

echo [p0] normal (certifying) render...
g1a_p0_host.exe
echo [p0] normal exit=%ERRORLEVEL%
endlocal
