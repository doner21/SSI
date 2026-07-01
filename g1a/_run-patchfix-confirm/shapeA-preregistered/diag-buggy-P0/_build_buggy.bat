@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /DG1A_VARIANT_F /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:g1a_p0_buggy_host.exe p0_main.cpp engine_setup.cpp event_schedule.cpp bg_prepare.cpp rt_render.cpp crossfade.cpp swap.cpp reference.cpp perturb.cpp metrics.cpp proof.cpp > build_normal.log 2>&1
echo NORMAL_BUILD_EXIT=%ERRORLEVEL%
cl.exe /std:c++17 /EHsc /O2 /Zi /DCMAJOR_DLL=1 /DG1A_ASAN /DG1A_VARIANT_F /fsanitize=address /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:g1a_p0_buggy_host_asan.exe p0_main.cpp engine_setup.cpp event_schedule.cpp bg_prepare.cpp rt_render.cpp crossfade.cpp swap.cpp reference.cpp perturb.cpp metrics.cpp proof.cpp /link /DEBUG > build_asan.log 2>&1
echo ASAN_BUILD_EXIT=%ERRORLEVEL%
