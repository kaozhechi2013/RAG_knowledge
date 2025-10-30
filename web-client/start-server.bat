@echo off
cd /d "%~dp0"
cls

echo ================================================
echo   Knowledge Web Client Server
echo ================================================
echo.
echo [INFO] Starting Python HTTP Server...
echo [INFO] Port: 8081
echo [INFO] Binding to 0.0.0.0 (LAN access enabled)
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "ip=%%a"
    goto :found
)
:found
set "ip=%ip:~1%"

echo Access URLs:
echo   Local: http://localhost:8081
echo   LAN: http://%ip%:8081
echo.
echo Press Ctrl+C to stop server
echo ================================================
echo.

python -m http.server 8081 --bind 0.0.0.0