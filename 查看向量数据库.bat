@echo off
chcp 65001 >nul

echo ========================================
echo   🔍 Cherry Studio 向量数据库查看器
echo ========================================
echo.

set "DATA_DIR=%APPDATA%\CherryStudioDev\Data\KnowledgeBases"

if not exist "%DATA_DIR%" (
    echo ❌ 数据目录不存在: %DATA_DIR%
    echo 💡 提示: 请先创建至少一个知识库
    pause
    exit /b
)

echo 📍 数据库位置: %DATA_DIR%
echo.
echo 📊 已有的向量数据库:
echo.

powershell -Command "Get-ChildItem -Path '%DATA_DIR%' -Filter '*.db' | ForEach-Object { $size = [math]::Round($_.Length/1MB, 2); Write-Host \"  📦 $($_.Name)\" -NoNewline; Write-Host \" - $size MB\" -ForegroundColor Cyan }"

echo.
echo 📝 数据库内容示例:
echo.
echo   表名: embeddings_store
echo   字段:
echo     - id              (TEXT)      文档块ID
echo     - page_content    (TEXT)      文本内容
echo     - embedding       (F32_BLOB)  向量数据 [1536维]
echo     - metadata        (TEXT)      元数据 JSON
echo     - created_at      (TIMESTAMP) 创建时间
echo.

pause
