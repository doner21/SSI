@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
echo === CL VERSION ===
cl.exe 2>&1 | findstr /C:"Version"
echo === COMPILE NORMAL ===
cl.exe /std:c++17 /EHsc /O2 /DCMAJOR_DLL=1 /DG1A_VARIANT_F /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:g1a_p0_host.exe p0_main.cpp engine_setup.cpp event_schedule.cpp bg_prepare.cpp rt_render.cpp crossfade.cpp swap.cpp reference.cpp perturb.cpp metrics.cpp proof.cpp > build_normal.log 2>&1
echo COMPILE_NORMAL_EXIT=%ERRORLEVEL%
