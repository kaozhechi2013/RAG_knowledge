@echo off
setlocal enabledelayedexpansion

REM Check admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Need Administrator privileges
    echo Right-click and select "Run as administrator"
    pause
    exit /B 1
)

title BGE API Service
color 0E

echo ============================================================
echo  BGE API Service
echo ============================================================
echo.

REM Get WSL IP - Method 1: Direct parsing
echo Getting WSL IP...
for /f "tokens=*" %%i in ('wsl -d Ubuntu hostname -I') do set WSL_IP=%%i
set WSL_IP=%WSL_IP: =%

if "%WSL_IP%"=="" (
    echo ERROR: Cannot get WSL IP
    pause
    exit /B 1
)

echo WSL IP: %WSL_IP%
echo.

REM Configure port forwarding
echo Configuring port forwarding...
netsh interface portproxy delete v4tov4 listenport=8001 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=8001 listenaddress=0.0.0.0 connectport=8001 connectaddress=%WSL_IP%
echo Done: 0.0.0.0:8001 -^> %WSL_IP%:8001
echo.

REM Check firewall
echo Checking firewall...
netsh advfirewall firewall show rule name="BGE API Server" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="BGE API Server" dir=in action=allow protocol=TCP localport=8001 >nul
    echo Firewall rule added
) else (
    echo Firewall OK
)
echo.

echo ============================================================
echo  Service Info:
echo ============================================================
echo   Local:   http://localhost:8001
echo   Network: http://10.216.186.24:8001
echo   Docs:    http://localhost:8001/docs
echo ============================================================
echo.
echo Press Ctrl+C to stop
echo.

REM Start service
wsl -d Ubuntu -- sh -c "cd /mnt/e/Project/RAG_knowledge/vllm && python3 bge_api_server.py"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Service failed
    pause
)
