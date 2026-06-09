@echo off
title LancerPro - Auto Start All Services (Safe and Ordered)
echo.
echo =======================================================
echo   LancerPro - Safe Startup Script (Ordered Launch)
echo =======================================================
echo.

REM 1. Free up Port 3000 (Frontend Vite) if occupied
echo [1/2] Freeing port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 /nobreak >nul
echo     Port 3000 is clean.

REM 2. Free up Port 8080 (Backend Spring Boot) if occupied
echo.
echo [2/2] Freeing port 8080 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 /nobreak >nul
echo     Port 8080 is clean.

REM Note: We do NOT kill java.exe globally to avoid breaking VS Code extensions.

REM 3. Start Backend
echo.
echo Launching Backend (Spring Boot)...
start "LancerPro Backend" cmd.exe /c "cd /d %~dp0backend && run_backend.bat"
echo     Backend compile/launch window opened.

REM 4. Loop to wait until Backend starts listening on Port 8080
echo.
echo Waiting for Backend to compile and start listening on port 8080...
:wait_loop
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_loop
)

echo.
echo [SUCCESS] Backend is now running on port 8080!

REM 5. Start Frontend
echo.
echo Launching Frontend (Vite React)...
start "LancerPro Frontend" cmd.exe /c "cd /d %~dp0frontend && npm.cmd run dev"
echo     Frontend is launching in a new window...

echo.
echo =======================================================
echo   SYSTEM IS READY!
echo   - Frontend: http://localhost:3000/
echo   - Backend API: http://localhost:8080/api/
echo =======================================================
echo.
echo Press any key to close this startup monitor window...
pause >nul
