@echo off
chcp 65001 >nul
title Stop BGE API Service
color 0C
echo ============================================================
echo  Stop BGE API Service
echo ============================================================
echo.
echo Stopping service...

wsl -d Ubuntu pkill -f bge_api_server

timeout /t 2 /nobreak >nul

echo.
echo Service stopped!
echo.
pause
