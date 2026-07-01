@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
cl.exe /std:c++17 /EHsc /DCMAJOR_DLL=1 /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:smoke_host.exe smoke_host.cpp
