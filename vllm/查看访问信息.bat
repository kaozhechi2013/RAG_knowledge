@echo off
chcp 65001 >nul
title BGE API Access Info
color 0B
echo ============================================================
echo  BGE API Service - Access Information
echo ============================================================
echo.
echo Your API is accessible at:
echo.
echo [Local Access]
echo   http://localhost:8001
echo   http://127.0.0.1:8001
echo.
echo [LAN Access - Other Computers]
echo   http://10.216.186.24:8001
echo.
echo [API Documentation]
echo   http://10.216.186.24:8001/docs
echo.
echo ============================================================
echo  API Endpoints:
echo ============================================================
echo   POST /embed        - Text embedding (1024-dim vectors)
echo   POST /rerank       - Document reranking
echo   GET  /status       - Service status and GPU memory
echo   GET  /             - Health check
echo.
echo ============================================================
echo  Python Example (from other computer):
echo ============================================================
echo.
echo import requests
echo.
echo # Embedding
echo response = requests.post(
echo     "http://10.216.186.24:8001/embed",
echo     json={"texts": ["Hello world"], "normalize": True}
echo )
echo.
echo # Reranking
echo response = requests.post(
echo     "http://10.216.186.24:8001/rerank",
echo     json={
echo         "query": "What is AI?",
echo         "documents": ["AI is...", "Weather is..."],
echo         "top_k": 1
echo     }
echo )
echo.
echo ============================================================
echo.
pause
