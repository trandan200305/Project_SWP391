@echo off
title LancerPro - Khoi dong du an
echo =======================================================
echo   LancerPro - Dang khoi dong Backend va Frontend...
echo =======================================================
echo.
echo Khoi dong Backend (Spring Boot) tren cong 8080...
start "LancerPro - Backend" cmd /k "cd /d %~dp0backend && .\mvnw spring-boot:run"
echo Khoi dong Frontend (React/Vite)...
start "LancerPro - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Da gui lenh khoi dong! Vui long xem chi tiet o 2 cua so CMD moi mo.
pause
