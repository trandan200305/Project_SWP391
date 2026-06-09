@echo off
title Remake Project - Startup Script

echo ==================================================
echo       KHOI DONG DU AN REMAKE (FULL-STACK)
echo ==================================================
echo.

echo [1/2] Dang khoi dong Backend (Spring Boot)...
start "Backend - Spring Boot" cmd /k "cd /d D:\PRJ301\newweb\Remake\backend && mvn clean spring-boot:run"

echo [2/2] Dang khoi dong Frontend (React - Vite)...
start "Frontend - React" cmd /k "cd /d D:\PRJ301\newweb\Remake\frontend && npm run dev"

echo.
echo ==================================================
echo Chuc mung! Ca hai server dang duoc mo trong 2 cua so moi.
echo - Frontend se chay o: http://localhost:5173
echo - Backend se chay o: http://localhost:8081
echo ==================================================
pause
