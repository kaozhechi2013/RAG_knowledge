@echo off
chcp 65001 >nul
cd /d "%~dp0"

cls
echo ========================================
echo   Knowledge AI System
echo ========================================
echo.
echo Starting all services...
echo API Key: sk-knowledge-internal-2024
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "ip=%%a"
    goto :found
)
:found
set "ip=%ip:~1%"

REM Start NextChat Web Server (Development Mode) in background
echo [1/2] Starting NextChat Web Client (port 3000)...
cd /d "%~dp0\web-client\NextChat-2.16.1"
start /B yarn dev >nul 2>&1
cd /d "%~dp0"

REM Wait 5 seconds for web server to start
echo     Waiting for web server to initialize...
timeout /t 5 /nobreak >nul

REM Start main application (includes API server on port 8080)
echo [2/2] Starting Knowledge Desktop App (API on port 8080)...
echo.
echo ========================================
echo   Access URLs
echo ========================================
echo.
echo Web Client (Modern UI):
echo   Local:  http://localhost:3000
echo   LAN:    http://%ip%:3000
echo.
echo API Server:
echo   Local:  http://localhost:8080
echo   LAN:    http://%ip%:8080
echo.
echo Desktop App:
echo   Knowledge Electron will open automatically
echo.
echo ========================================
echo.

yarn dev
