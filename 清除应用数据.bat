@echo off
chcp 65001 >nul
echo ========================================
echo   Clear Knowledge App Data
echo ========================================
echo.
echo This will delete all application data including:
echo - Settings
echo - Cache
echo - Preprocess provider configurations
echo.
echo Location: %APPDATA%\knowledgeDev
echo.
pause

if exist "%APPDATA%\knowledgeDev" (
    echo Deleting application data...
    rd /s /q "%APPDATA%\knowledgeDev"
    echo.
    echo Application data cleared successfully!
    echo.
    echo Please restart the application.
) else (
    echo Application data folder not found.
    echo Location checked: %APPDATA%\knowledgeDev
)

echo.
pause
