@echo off
REM G1A EVENT-REPLAY — Certification run (shapeB-dualplan §8 two-pass).
REM
REM Two-pass strategy: (1) ASan build run first, captures to asan_run.log
REM for R2 safety ingestion AND to cert_run.log for audit.
REM (2) Normal (certifying) run second, ingests asan_run.log for R2 safety
REM counts and writes the full proof artifact set (WAVs, metrics.json,
REM trace.log, schedule.json, events_applied.log, verdict).
REM
REM WDAC/Device Guard fallback: if the normal exe is blocked, the ASan
REM path is acceptable as the sole cert run (recorded in cert_run.log).
setlocal
cd /d "%~dp0"
if not exist artifacts mkdir artifacts
set FAILFLAG=0

echo ===== CERT RUN STARTED %date% %time% =====
echo ===== CERT RUN STARTED %date% %time% ===== > artifacts\cert_run.log 2>&1

echo [cert] Building ASan binary...
call compile_asan.bat >> artifacts\cert_run.log 2>&1
if %ERRORLEVEL% neq 0 (
  echo [cert] FAIL: ASan build failed >> artifacts\cert_run.log 2>&1
  set FAILFLAG=1
  goto cert_label_done
)

echo [cert] Building normal binary...
call compile.bat >> artifacts\cert_run.log 2>&1
if %ERRORLEVEL% neq 0 (
  echo [cert] FAIL: normal build failed >> artifacts\cert_run.log 2>&1
  set FAILFLAG=1
  goto cert_label_done
)

echo [cert] Running ASan build... >> artifacts\cert_run.log 2>&1
g1a_event_replay_host_asan.exe > artifacts\asan_run.log 2>&1
set ASAN_EXIT=%ERRORLEVEL%
echo [cert] ASan exit=%ASAN_EXIT% >> artifacts\cert_run.log 2>&1

echo [cert] Running normal build (certifying run)... >> artifacts\cert_run.log 2>&1
g1a_event_replay_host.exe >> artifacts\cert_run.log 2>&1
set NORM_EXIT=%ERRORLEVEL%
echo [cert] Normal exit=%NORM_EXIT% >> artifacts\cert_run.log 2>&1

:cert_label_done
echo ===== CERT RUN FINISHED %date% %time% (failflag=%FAILFLAG%) =====
echo ===== CERT RUN FINISHED %date% %time% (failflag=%FAILFLAG%) ===== >> artifacts\cert_run.log 2>&1
endlocal
exit /b %FAILFLAG%
