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
echo [INFO] Starting API Server and Electron...
echo [INFO] Please wait for API initialization...
echo.

REM Start main application (includes API server on port 8080)
echo [INFO] Starting Electron and API Server in background...
start /B cmd /c "yarn dev >nul 2>&1"

REM Wait for API server to be ready (check every 2 seconds, max 30 seconds)
echo.
echo [INFO] Waiting for API Server to be ready...
set /a counter=0
:wait_api
waitfor /t 2 SignalThatWillNeverCome >nul 2>&1
curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] API Server is ready!
    goto :api_ready
)
set /a counter+=1
if %counter% lss 15 (
    echo [INFO] Still waiting... (%counter%/15^)
    goto :wait_api
)
echo.
echo [ERROR] API Server failed to start!
echo.
echo Possible causes:
echo   1. Electron needs a graphical environment (use RDP on server)
echo   2. Node.js version too old (check: node --version)
echo   3. Port 8080 already in use (check: netstat -ano ^| findstr ":8080")
echo.
echo Continuing anyway (Web Client only mode)...
waitfor /t 2 SignalThatWillNeverCome >nul 2>&1

:api_ready
echo.
echo ========================================
echo   [2/2] Starting Modern Web Client (port 8081)...
echo ========================================
echo.

REM Clean port 8081 if occupied
netstat -ano | findstr ":8081" >nul
if %errorlevel% equ 0 (
    echo Cleaning port 8081...
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8081"') do taskkill /F /PID %%p >nul 2>&1
    waitfor /t 1 SignalThatWillNeverCome >nul 2>&1
)

REM Check Python availability
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Using Python http.server
    start /B cmd /c "cd /d "%~dp0\web-client" && python -m http.server 8081 --bind 0.0.0.0 >nul 2>&1"
) else (
    echo [WARN] Python not found, using Node.js http-server...
    start /B cmd /c "cd /d "%~dp0\web-client" && npx http-server -p 8081 -a 0.0.0.0 >nul 2>&1"
)

REM Wait 2 seconds for Web server to start
waitfor /t 2 SignalThatWillNeverCome >nul 2>&1

echo.
echo ========================================
echo   All Services Started!
echo ========================================
echo.
echo Modern Web Client:
echo   Local:  http://localhost:8081/index.html
echo   LAN:    http://%ip%:8081/index.html
echo.
echo Desktop App:
echo   Knowledge Electron is running
echo.
echo API Server:
echo   Local:  http://localhost:8080
echo   LAN:    http://%ip%:8080
echo.
echo ========================================

REM Open browser with modern web client
start http://localhost:8081/index.html

echo.
echo Press any key to stop all services...
pause >nul

REM Stop all background services
echo.
echo Stopping services...
taskkill /F /IM electron.exe >nul 2>&1
taskkill /F /IM python.exe /FI "WINDOWTITLE eq python -m http.server*" >nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npx http-server*" >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080"') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8081"') do taskkill /F /PID %%p >nul 2>&1
echo All services stopped.
waitfor /t 2 SignalThatWillNeverCome >nul 2>&1

