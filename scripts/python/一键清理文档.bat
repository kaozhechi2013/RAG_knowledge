@echo off
chcp 65001 >nul
echo ============================================================
echo           Word文档图片清理工具 - 一键执行
echo ============================================================
echo.
echo 正在处理当前文件夹内的所有Word文档...
echo 将删除所有图片，只保留文字内容
echo 自动创建备份文件（.backup后缀）
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请确保已安装Python并添加到PATH环境变量中
    echo.
    pause
    exit /b 1
)

echo [信息] Python环境检查通过
echo.
echo 开始处理文档...
echo ============================================================
echo.

REM 获取当前脚本所在目录
set "CURRENT_DIR=%~dp0"

REM 运行文档处理脚本，处理当前目录
python "%CURRENT_DIR%document_processor.py" "%CURRENT_DIR%"

echo.
echo ============================================================
echo 处理完成！
echo.
echo 提示：
echo - 原始文件已备份（.backup后缀）
echo - 可以删除备份文件以节省空间
echo - 请检查处理后的文档内容是否正确
echo ============================================================
echo.
pause
