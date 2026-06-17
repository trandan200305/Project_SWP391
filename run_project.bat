@echo off
title LancerPro - Khoi dong du an
echo =======================================================
echo   LancerPro - Dang khoi dong Backend va Frontend...
echo =======================================================
echo.

REM 1. Giai phong Port 5173 / 3000 (Vite)
echo [1/3] Dang giai phong port cho Frontend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 /nobreak >nul

REM 2. Giai phong Port 8080 (Spring Boot)
echo [2/3] Dang giai phong port 8080 cho Backend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 /nobreak >nul

REM 3. Khoi dong Backend (Spring Boot)
echo.
echo [3/3] Khoi dong Backend (Spring Boot)...
start "LancerPro - Backend" cmd /k "cd /d %~dp0Project\backend && mvnw spring-boot:run"

REM 4. Cho backend khoi dong (5s)
echo Dang cho Backend khoi tao (5s)...
timeout /t 5 /nobreak >nul

REM 5. Khoi dong Frontend (React/Vite)
echo.
echo Khoi dong Frontend (React/Vite)...
start "LancerPro - Frontend" cmd /k "cd /d %~dp0Project\frontend && npm run dev"

echo.
echo =======================================================
echo   DA GUI LENH KHOI DONG!
echo   Vui long xem chi tiet o 2 cua so CMD moi mo.
echo =======================================================
echo.
pause
