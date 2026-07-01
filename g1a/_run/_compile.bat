@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1
"C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Tools\MSVC\14.50.35717\bin\Hostx64\x64\cl.exe" /std:c++17 /EHsc /DCMAJOR_DLL=1 /I"C:\Users\doner\SSI\g1a\_run\cmajor-headers\include" /Fe:"C:\Users\doner\SSI\g1a\_run\smoke_host.exe" "C:\Users\doner\SSI\g1a\_run\smoke_host.cpp"
exit /b %ERRORLEVEL%
