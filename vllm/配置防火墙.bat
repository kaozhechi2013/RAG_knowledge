@echo off
chcp 65001 >nul
title Configure Firewall for BGE API
color 0E
echo ============================================================
echo  Configure Windows Firewall for BGE API (Port 8001)
echo ============================================================
echo.
echo Adding firewall rule...
echo.

netsh advfirewall firewall add rule name="BGE API Server" dir=in action=allow protocol=TCP localport=8001

echo.
echo ============================================================
echo Firewall rule added successfully!
echo ============================================================
echo.
echo Now other computers can access your API at:
echo   http://10.216.186.24:8001
echo.
pause
