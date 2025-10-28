@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   🌐 Knowledge Web 客户端服务器
echo ========================================
echo.
echo 📍 当前目录: %CD%
echo.

REM 检查 Python 是否安装
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 检测到 Python
    echo 🚀 启动 Web 服务器...
    echo.
    echo 📱 访问地址:
    echo    - 本机: http://localhost:8081
    echo    - 局域网: http://你的IP地址:8081
    echo.
    echo 💡 提示: 按 Ctrl+C 停止服务器
    echo.
    python -m http.server 8081
) else (
    echo ❌ 未检测到 Python
    echo.
    echo 请选择以下方式之一:
    echo.
    echo 方式 1: 安装 Python
    echo   下载: https://www.python.org/downloads/
    echo.
    echo 方式 2: 直接双击 index.html 文件
    echo   （只能本机访问，不能局域网访问）
    echo.
    pause
)
