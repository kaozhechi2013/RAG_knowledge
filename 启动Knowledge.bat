@echo off
chcp 65001 >nul 2>&1
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

REM Check Ollama and GPU
echo [INFO] Checking Ollama status...
ollama --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Ollama is installed
    
    REM Check if Ollama is using GPU
    nvidia-smi >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] NVIDIA GPU detected
        echo.
        echo 💡 建议: 如果 Ollama 运行缓慢，请运行 "强制Ollama使用GPU.bat"
    ) else (
        echo [WARN] NVIDIA GPU not detected or nvidia-smi not available
    )
) else (
    echo [WARN] Ollama not installed
    echo      如需使用本地模型，请安装: https://ollama.com
)
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "ip=%%a"
    goto :found
)
:found
set "ip=%ip:~1%"

echo ========================================
echo   Starting All Services
echo ========================================
echo.
echo [1/2] Starting Desktop App in background...

REM Start Electron app in background
start /B cmd /c "yarn dev >nul 2>&1"

echo [2/2] Starting Web Server (port 8081)...
echo.

REM Clean port 8081 if occupied
netstat -ano | findstr ":8081" >nul
if %errorlevel% equ 0 (
    echo Cleaning port 8081...
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8081"') do taskkill /F /PID %%p >nul 2>&1
    timeout /t 1 /nobreak >nul
)

REM Start Web server using Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Web Server with Python...
    cd /d "%~dp0\web-client"
    start /B cmd /c "python -m http.server 8081 --bind 0.0.0.0 >nul 2>&1"
    cd /d "%~dp0"
) else (
    echo Starting Web Server with Node.js...
    cd /d "%~dp0\web-client"
    start /B cmd /c "npx http-server -p 8081 -a 0.0.0.0 >nul 2>&1"
    cd /d "%~dp0"
)

REM Wait for services to start
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   All Services Started!
echo ========================================
echo.
echo Desktop App:  Opening automatically...
echo.
echo Web Client (推荐使用局域网地址):
echo   LAN:   http://%ip%:8081
echo   Local: http://localhost:8081
echo.
echo API Server (需在桌面应用设置中启用):
echo   LAN:   http://%ip%:23333
echo   Local: http://localhost:23333
echo.
echo ========================================
echo [重要] 使用 Web 客户端请访问: http://%ip%:8081
echo        这样才能正确连接到 API 服务器
echo ========================================
echo.

REM Open Web Client with LAN address for better compatibility
start http://%ip%:8081

echo Services running in background...
echo Press any key to stop all services and exit...
pause >nul

REM Stop all services
echo.
echo Stopping all services...

REM Force close processes by name
taskkill /F /IM electron.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

REM Clean up ports
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8081"') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":23333"') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173"') do taskkill /F /PID %%p >nul 2>&1

echo All services stopped.
timeout /t 2 /nobreak >nul

