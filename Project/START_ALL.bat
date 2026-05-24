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

REM 4. Khởi động Backend
echo.
echo [3/3] Đang khởi động Backend (Spring Boot)...
start "LancerPro Backend" cmd.exe /c "cd /d %~dp0backend && run_backend.bat"
echo     Backend đang được khởi chạy trong cửa sổ mới...

REM 5. Đợi backend khởi động hoàn tất (tầm 5 giây để Spring Boot bắt đầu lắng nghe)
echo.
echo Đang đợi Backend khởi tạo kết nối Database (5s)...
timeout /t 5 /nobreak >nul

REM 6. Khởi động Frontend
echo.
echo Đang khởi động Frontend (Vite React)...
start "LancerPro Frontend" cmd.exe /c "cd /d %~dp0frontend && npm.cmd run dev"
echo     Frontend đang được khởi chạy trong cửa sổ mới...

echo.
echo =======================================================
echo   HỆ THỐNG ĐÃ SẴN SÀNG!
echo   - Frontend: http://localhost:3000/
echo   - Backend API: http://localhost:8080/api/
echo =======================================================
echo.
echo Nhấn phím bất kỳ để đóng cửa sổ giám sát khởi động này...
pause >nul
