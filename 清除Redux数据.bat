@echo off
chcp 65001 >nul
echo ========================================
echo Clear Redux Persist Data
echo ========================================
echo.
echo WARNING: This will clear all app data!
echo Including: chat history, assistant settings, provider configs, etc.
echo.
pause

echo.
echo Clearing data...

set "APP_DATA=%APPDATA%\knowledgeDev"
if exist "%APP_DATA%" (
    echo Deleting: %APP_DATA%
    rmdir /s /q "%APP_DATA%"
    echo [OK] App data folder deleted
) else (
    echo [INFO] App data folder not found
)

echo.
echo ========================================
echo Done!
echo Please restart the app to initialize with new default config
echo ========================================
pause
