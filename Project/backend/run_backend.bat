@echo off
set JAVA_HOME=C:\Program Files\Java\jdk-17
title LancerPro Backend
echo =======================================================
echo   Starting LancerPro Backend
echo =======================================================
cd /d "%~dp0"
call mvnw.cmd clean spring-boot:run
pause
