@echo off
cd /d C:\Users\doner\SSI\g1a\_run-patchfix-confirm\shapeB-dualplan\variantP0
echo [run P0 corrected] Starting...
g1a_p0_corrected.exe > run_P0_normal.log 2>&1
set RC=%ERRORLEVEL%
echo [run P0 corrected] exit=%RC%
type run_P0_normal.log
exit /b %RC%
