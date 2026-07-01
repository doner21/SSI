@echo off
REM G1A RELOAD-BRIDGE — normal build (HARNESS-SPEC §7). MSVC cl 19.50, C++17.
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:g1a_reload_host.exe ^
  main.cpp engine_setup.cpp bg_compiler.cpp swap.cpp rt_render.cpp crossfade.cpp perturb.cpp metrics.cpp proof.cpp
exit /b %ERRORLEVEL%
