@echo off
chcp 65001 >nul
cd /d "%~dp0"

cls
echo ========================================
echo   Knowledge AI System
echo ========================================
echo.
echo Starting all services...
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "ip=%%a"
    goto :found
)
:found
set "ip=%ip:~1%"

REM Clean port 8081 if occupied
netstat -ano | findstr ":8081" >nul
if %errorlevel% equ 0 (
    echo Cleaning port 8081...
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8081"') do taskkill /F /PID %%p >nul 2>&1
    timeout /t 1 /nobreak >nul
)

REM Check Python availability
echo [1/2] Starting Modern Web Client (port 8081)...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Using Python http.server
    start "Knowledge Web Server" /MIN cmd /c "cd /d "%~dp0\web-client" && python -m http.server 8081 --bind 0.0.0.0 || pause"
) else (
    echo [WARN] Python not found, trying npx http-server...
    start "Knowledge Web Server" /MIN cmd /c "cd /d "%~dp0\web-client" && npx http-server -p 8081 -a 0.0.0.0 || pause"
)

REM Wait 3 seconds for Web server to start
timeout /t 3 /nobreak >nul

REM Open browser with modern web client
start http://localhost:8081/index.html

echo.
echo ========================================
echo   Access URLs
echo ========================================
echo.
echo Modern Web Client:
echo   Local:  http://localhost:8081/index.html
echo   LAN:    http://%ip%:8081/index.html
echo.
echo Desktop App:
echo   Knowledge Electron will open automatically
echo.
echo API Server (auto-started by desktop app):
echo   Local:  http://localhost:8080
echo   LAN:    http://%ip%:8080
echo.
echo ========================================
echo   [2/2] Starting Knowledge Desktop App...
echo ========================================
echo.

REM Start main application (includes API server on port 8080)
yarn dev

