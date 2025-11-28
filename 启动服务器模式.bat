@echo off
title RAG Knowledge Server

cd /d "%~dp0"
start "API-Server" cmd /k "npm run dev"
timeout /t 5 /nobreak
cd web-client
start "Web-Client" cmd /k "python -m http.server 8081"
cd ..

echo Services started!
echo Web: http://localhost:8081 or http://10.216.186.24:8081
pause
