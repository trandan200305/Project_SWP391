@echo off
echo Stopping all Java processes...
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul

set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%
set MAVEN_CMD=mvn

echo.
echo ============================================
echo   LancerPro Backend - Compile and Run
echo ============================================
"%MAVEN_CMD%" spring-boot:run
