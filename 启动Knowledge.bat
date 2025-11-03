@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   Knowledge Development Server
echo ========================================
echo.
echo Project: %CD%
echo Electron: %CD%\node_modules\electron\dist\electron.exe
echo Dev Server: http://localhost:5173/
echo.
echo Starting...
echo.

yarn dev

