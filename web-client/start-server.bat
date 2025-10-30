@echo off
cd /d "%~dp0"
cls

echo ================================================
echo   Knowledge Web Client Server
echo ================================================
echo.
echo [INFO] Starting Python HTTP Server...
echo [INFO] Port: 8081
echo.
echo Access from browser:
echo   http://localhost:8081
echo.
echo Press Ctrl+C to stop server
echo ================================================
echo.

python -m http.server 8081
