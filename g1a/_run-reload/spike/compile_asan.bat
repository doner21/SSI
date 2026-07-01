@echo off
REM G1A RELOAD-BRIDGE — ASan build (HARNESS-SPEC §7). Adds /fsanitize=address,
REM /Zi /DEBUG for better ASan reporting (SMOKE-TEST §7), /DG1A_ASAN tag.
REM Requires clang_rt.asan_dynamic-x86_64.dll next to the .exe at runtime.
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
cl.exe /std:c++17 /EHsc /O2 /Zi /DCMAJOR_DLL=1 /DG1A_ASAN /fsanitize=address ^
  /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" ^
  /Fe:g1a_reload_host_asan.exe ^
  main.cpp engine_setup.cpp bg_compiler.cpp swap.cpp rt_render.cpp crossfade.cpp perturb.cpp metrics.cpp proof.cpp ^
  /link /DEBUG
exit /b %ERRORLEVEL%
