@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   🍒 Knowledge 开发服务器
echo ========================================
echo.
echo 📍 项目位置: %CD%
echo 💻 Electron: %CD%\node_modules\electron\dist\electron.exe
echo 🌐 开发服务器: http://localhost:5173/
echo.
echo ⏱️ 正在启动，请稍等...
echo.

yarn dev
