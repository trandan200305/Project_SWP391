@echo off
title LancerPro - Auto Start All Services
echo.
echo =======================================================
echo   LancerPro - Tối ưu hóa khởi động hệ thống tự động
echo =======================================================
echo.

REM 1. Giải phóng Port 3000 (Frontend Vite) nếu bị chiếm
echo [1/3] Đang giải phóng port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 /nobreak >nul
echo     Cổng 3000 đã sạch.

REM 2. Giải phóng Port 8080 (Backend Spring Boot) nếu bị chiếm
echo.
echo [2/3] Đang giải phóng port 8080 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 /nobreak >nul
echo     Cổng 8080 đã sạch.

REM 3. Đảm bảo Java process cũ bị tắt sạch để tránh tranh chấp bộ nhớ/database
taskkill /F /IM java.exe 2>nul
timeout /t 1 /nobreak >nul
