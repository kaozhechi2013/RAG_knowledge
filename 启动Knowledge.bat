@echo off
chcp 65001 >nul
cd /d "%~dp0"

cls
echo ========================================
echo   Knowledge Development Server
echo ========================================
echo.
echo Project: %CD%
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "ip=%%a"
    goto :found
)
:found
set "ip=%ip:~1%"

echo ========================================
echo   Access URLs
echo ========================================
echo.
echo Desktop App:
echo   - Knowledge Electron App will open automatically
echo.
echo Web Client (Browser):
echo   Local Access:
echo     http://localhost:8081
echo     http://127.0.0.1:8081
echo.
echo   LAN Access (for colleagues):
echo     http://%ip%:8081
echo.
echo API Server:
echo   http://localhost:8080
echo   http://%ip%:8080
echo.
echo ========================================
echo   Starting Services...
echo ========================================
echo.

REM Start Web server in background (hidden)
echo [1/2] Starting Web Server (port 8081)...
start /B "" cmd /c "cd /d "%~dp0\web-client" && python -m http.server 8081 --bind 0.0.0.0 >nul 2>&1"

REM Wait 2 seconds for Web server to start
timeout /t 2 /nobreak >nul

REM Start main application
echo [2/2] Starting Knowledge Desktop App...
echo.
yarn dev

