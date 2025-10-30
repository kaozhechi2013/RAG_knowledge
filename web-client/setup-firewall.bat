@echo off
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Need administrator privileges
    echo.
    echo Please right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo ========================================
echo   Configure Firewall Rules
echo ========================================
echo.

echo [1/4] Removing old rules...
netsh advfirewall firewall delete rule name="Knowledge Web Client (8081)" >nul 2>&1
netsh advfirewall firewall delete rule name="Knowledge API Server (8080)" >nul 2>&1
echo Done

echo.
echo [2/4] Adding rule: Web Client (port 8081)...
netsh advfirewall firewall add rule name="Knowledge Web Client (8081)" dir=in action=allow protocol=TCP localport=8081
if %errorLevel% equ 0 (
    echo Done
) else (
    echo Failed
)

echo.
echo [3/4] Adding rule: API Server (port 8080)...
netsh advfirewall firewall add rule name="Knowledge API Server (8080)" dir=in action=allow protocol=TCP localport=8080
if %errorLevel% equ 0 (
    echo Done
) else (
    echo Failed
)

echo.
echo [4/4] Verifying rules...
netsh advfirewall firewall show rule name="Knowledge Web Client (8081)"
netsh advfirewall firewall show rule name="Knowledge API Server (8080)"

echo.
echo ========================================
echo   Configuration Complete!
echo ========================================
echo.
echo Now colleagues can access via LAN
echo   - Web UI: http://YOUR_IP:8081
echo   - API Service: http://YOUR_IP:8080
echo.
pause