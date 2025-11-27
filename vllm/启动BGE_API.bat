@echo off
chcp 65001 >nul
title BGE API Server
color 0A
echo ============================================================
echo            BGE Model API Service
echo ============================================================
echo.
echo [1/2] Starting service...
echo       Service URL: http://localhost:8001
echo       API Docs: http://localhost:8001/docs
echo.
echo [2/2] Loading models, please wait (about 15 seconds)...
echo.
echo ============================================================
echo  IMPORTANT:
echo  - Keep this window open! Closing it will stop the service.
echo  - Press Ctrl+C to stop the service.
echo ============================================================
echo.

wsl -d Ubuntu python3 /mnt/e/Project/RAG_knowledge/vllm/bge_api_server.py

pause
