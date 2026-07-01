@echo off
REM G1A shapeB-dualplan Variant G — locked run order.
REM 1) Run ASan build first; capture stdout+stderr to artifacts/asan_run.log.
REM 2) Run normal build; ingests asan_run.log, writes metrics.json/trace.log/WAVs.
setlocal
cd /d "%~dp0"

if not exist variantG\artifacts mkdir variantG\artifacts

REM Place DLLs next to exes in variantG
copy /Y CmajPerformer.dll variantG\ > nul 2>&1
copy /Y clang_rt.asan_dynamic-x86_64.dll variantG\ > nul 2>&1

echo [run G] ASan build...
pushd variantG
g1a_boundary_click_G_asan.exe > artifacts\asan_run.log 2>&1
echo [run G] ASan exit=%ERRORLEVEL%

echo [run G] normal build (certifying run)...
g1a_boundary_click_G.exe > artifacts\cert_run.log 2>&1
echo [run G] normal exit=%ERRORLEVEL%
popd

echo --- cert_run.log (Variant G) ---
type variantG\artifacts\cert_run.log
endlocal
