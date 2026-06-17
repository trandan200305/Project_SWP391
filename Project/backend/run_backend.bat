@echo off
title LancerPro Backend
echo Starting LancerPro Backend via PowerShell Compile Script...
powershell -ExecutionPolicy Bypass -File "%~dp0run_backend.ps1"
pause
