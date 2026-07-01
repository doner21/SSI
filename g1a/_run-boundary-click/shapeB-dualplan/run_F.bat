@echo off
REM G1A shapeB-dualplan Variant F — locked run order.
REM 1) Run ASan build first; capture stdout+stderr to artifacts/asan_run.log.
REM 2) Run normal build; ingests asan_run.log, writes metrics.json/trace.log/WAVs.
setlocal
cd /d "%~dp0"

if not exist variantF\artifacts mkdir variantF\artifacts

REM Place DLLs next to exes in variantF
copy /Y CmajPerformer.dll variantF\ > nul 2>&1
copy /Y clang_rt.asan_dynamic-x86_64.dll variantF\ > nul 2>&1

echo [run F] ASan build...
pushd variantF
g1a_boundary_click_F_asan.exe > artifacts\asan_run.log 2>&1
echo [run F] ASan exit=%ERRORLEVEL%

echo [run F] normal build (certifying run)...
g1a_boundary_click_F.exe > artifacts\cert_run.log 2>&1
echo [run F] normal exit=%ERRORLEVEL%
popd

echo --- cert_run.log (Variant F) ---
type variantF\artifacts\cert_run.log
endlocal
