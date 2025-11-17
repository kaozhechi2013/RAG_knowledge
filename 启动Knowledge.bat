@echo off
cd /d "%~dp0"

cls
echo ========================================
echo   Knowledge AI System
echo ========================================
echo.

REM Check Node.js version
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js v22+ from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [WARN] Dependencies not installed!
    echo Running: yarn install
    echo.
    call yarn install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Clear Vite cache to prevent "504 Outdated Optimize Dep" errors
if exist "node_modules\.vite\" (
    echo [INFO] Cleaning Vite cache...
    rd /s /q "node_modules\.vite" >nul 2>&1
    echo [INFO] Vite cache cleared
    echo.
)

echo Starting all services...
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "ip=%%a"
    goto :found
)
:found
set "ip=%ip:~1%"

echo ========================================
echo   [1/2] Starting Knowledge Desktop App...
echo ========================================
echo.
echo [INFO] Starting Electron Desktop App...
echo [INFO] Wait 30-60 seconds for first launch
echo.

REM Start app and wait for it to finish
yarn dev

