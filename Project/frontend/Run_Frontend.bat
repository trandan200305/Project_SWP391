@echo off
title LancerPro Frontend
echo =======================================================
echo   Starting LancerPro Frontend
echo =======================================================
cd /d "%~dp0"
call npm install
call npm run dev
pause
