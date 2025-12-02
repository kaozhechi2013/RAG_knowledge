@echo off
chcp 65001 >nul
echo 正在启动Word文档图片清理工具...
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请确保已安装Python并添加到PATH环境变量中
    pause
    exit /b 1
)

REM 运行文档处理脚本
python process_documents.py

echo.
echo 处理完成，按任意键退出...
pause >nul
