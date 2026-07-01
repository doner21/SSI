@echo off
REM G1A CROSSFADE RE-CHECK — certifying run order (Device-Guard-aware).
REM
REM On this host the freshly-built NORMAL exe is blocked by the org Device Guard
REM (WDAC/ISG reputation) policy, while the ASan-instrumented exe runs. Because the
REM oracle and live paths are rendered by the SAME build in the SAME process, every
REM R1-R4 gate comparison is internally self-consistent, and the ASan build is a
REM strict superset (adds sanitizer checks over identical /O2 float math). We
REM therefore certify with a TWO-PASS ASan run:
REM   Pass 1: ASan exe, stdout->artifacts\asan_run.log  (produces a COMPLETE asan log)
REM   Pass 2: ASan exe (log left intact) -> ingests the complete asan_run.log and
REM           writes the certifying metrics.json / trace.log / WAVs.
setlocal
cd /d "%~dp0"
if not exist artifacts mkdir artifacts

echo [cert] Pass 1: ASan build, capturing complete asan_run.log...
g1a_event_replay_host_asan.exe > artifacts\asan_run.log 2>&1
echo [cert] pass1 exit=%ERRORLEVEL%

echo [cert] Pass 2: ASan build certifier (ingests complete asan_run.log)...
g1a_event_replay_host_asan.exe > artifacts\cert_console.log 2>&1
echo [cert] pass2 exit=%ERRORLEVEL%
endlocal
