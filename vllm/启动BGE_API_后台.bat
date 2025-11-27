@echo off
chcp 65001 >nul
echo ============================================================
echo  BGE API Service (Background Mode)
echo ============================================================
echo.
echo Starting service...
echo.

REM Start WSL Python process in background
start /B wsl -d Ubuntu python3 /mnt/e/Project/RAG_knowledge/vllm/bge_api_server.py

echo Waiting for service to start (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo ============================================================
echo Service Started!
echo ============================================================
echo.
echo Service URL: http://localhost:8001
echo API Docs: http://localhost:8001/docs
echo.
echo Test service:
echo   wsl -d Ubuntu python3 /mnt/e/Project/RAG_knowledge/vllm/test_api_client.py
echo.
echo Stop service:
echo   wsl -d Ubuntu pkill -f bge_api_server
echo.
pause
