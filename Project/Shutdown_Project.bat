@echo off
title LancerPro - Shutdown All Services
echo =======================================================
echo   LancerPro - Shutdown Script
echo =======================================================
echo.

echo [1/2] Killing process on Port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
echo     Frontend port 3000 is now free.

echo.
echo [2/2] Killing process on Port 8080 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
echo     Backend port 8080 is now free.

echo.
echo =======================================================
echo   PROJECT PORTS HAVE BEEN FREED SUCCESSFULLY!
echo =======================================================
echo.
pause
