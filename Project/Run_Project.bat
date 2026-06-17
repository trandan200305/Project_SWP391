@echo off
title LancerPro - Auto Start All Services
echo =======================================================
echo   LancerPro - Run Project
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

REM 3. Start Backend
echo.
echo Launching Backend (Spring Boot)...
start "LancerPro Backend" cmd.exe /c "cd /d "%~dp0backend" && Run_Backend.bat"
echo     Backend window opened.

REM Wait for a few seconds before starting frontend
timeout /t 5 /nobreak >nul

REM 4. Start Frontend
echo.
echo Launching Frontend (Vite React)...
start "LancerPro Frontend" cmd.exe /c "cd /d "%~dp0frontend" && Run_Frontend.bat"
echo     Frontend window opened.

echo.
echo =======================================================
echo   SYSTEM IS STARTING UP!
echo   - Frontend: http://localhost:3000/
echo   - Backend API: http://localhost:8080/api/
echo =======================================================
echo.
echo Press any key to close this startup monitor window...
pause >nul
