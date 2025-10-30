@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   LAN Connection Test
echo ========================================
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "ip=%%a"
    set "ip=!ip:~1!"
    if not "!ip!"=="127.0.0.1" (
        set "LOCAL_IP=!ip!"
        goto :got_ip
    )
)
:got_ip

if not defined LOCAL_IP (
    echo [ERROR] Cannot find valid IPv4 address
    pause
    exit /b 1
)

echo Local IP: %LOCAL_IP%
echo.

echo [1/3] Testing Web Server (localhost:8081)...
curl -s -o nul -w "%%{http_code}" http://localhost:8081 >temp_status.txt 2>nul
set /p WEB_STATUS=<temp_status.txt
del temp_status.txt 2>nul

if "%WEB_STATUS%"=="200" (
    echo   [OK] Web Server: Running
) else if "%WEB_STATUS%"=="000" (
    echo   [FAIL] Web Server: Not running
    echo      Please run start-server.bat
) else (
    echo   [WARN] Status code %WEB_STATUS%
)

echo.
echo [2/3] Testing LAN access (%LOCAL_IP%:8081)...
curl -s -o nul -w "%%{http_code}" http://%LOCAL_IP%:8081 >temp_status.txt 2>nul
set /p LAN_STATUS=<temp_status.txt
del temp_status.txt 2>nul

if "%LAN_STATUS%"=="200" (
    echo   [OK] LAN accessible
) else if "%LAN_STATUS%"=="000" (
    echo   [FAIL] LAN not accessible
    echo      Check firewall: run setup-firewall.bat as admin
) else (
    echo   [WARN] Status code %LAN_STATUS%
)

echo.
echo [3/3] Testing firewall rules...
netsh advfirewall firewall show rule name="Knowledge Web Client (8081)" >nul 2>&1
if %errorLevel% equ 0 (
    echo   [OK] Port 8081: Configured
) else (
    echo   [FAIL] Port 8081: Not configured
    echo      Run setup-firewall.bat as administrator
)

netsh advfirewall firewall show rule name="Knowledge API Server (8080)" >nul 2>&1
if %errorLevel% equ 0 (
    echo   [OK] Port 8080: Configured
) else (
    echo   [FAIL] Port 8080: Not configured
    echo      Run setup-firewall.bat as administrator
)

echo.
echo ========================================
echo   Summary
echo ========================================
echo.
echo Local IP: %LOCAL_IP%
echo Web URL: http://%LOCAL_IP%:8081
echo.

if "%WEB_STATUS%"=="000" (
    echo [!] Need to start Web Server
    echo     Run: start-server.bat
    echo.
)

if "%LAN_STATUS%"=="000" (
    if not "%WEB_STATUS%"=="000" (
        echo [!] Need to configure firewall
        echo     Run: setup-firewall.bat (as admin)
        echo.
    )
)

if "%WEB_STATUS%"=="200" if "%LAN_STATUS%"=="200" (
    echo [OK] Everything is working!
    echo.
    echo Share this URL with colleagues:
    echo http://%LOCAL_IP%:8081
    echo.
)

pause