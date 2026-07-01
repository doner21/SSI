@echo off
REM G1A EVENT-REPLAY — locked run order (HARNESS-SPEC §5).
REM 1) Run the ASan build first; capture stdout+stderr to artifacts/asan_run.log.
REM 2) Run the normal build; it ingests asan_run.log for the R2 safety counts and
REM    writes the proof artifact (trace.log, wavs, metrics.json, schedule.json,
REM    events_applied.log) + the verdict.
setlocal
cd /d "%~dp0"
if not exist artifacts mkdir artifacts

echo [run] ASan build...
g1a_event_replay_host_asan.exe > artifacts\asan_run.log 2>&1
echo [run] ASan exit=%ERRORLEVEL%

echo [run] normal build (certifying run)...
g1a_event_replay_host.exe
echo [run] normal exit=%ERRORLEVEL%
endlocal
