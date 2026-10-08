@echo off
title Lumina FX Studio - 4K/8K Upscaler & Image Studio
echo ===================================================================
echo   Lumina FX Studio - Starting Application...
echo ===================================================================

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js detected. Launching local studio server...
    node serve.js
) else (
    echo [INFO] Node.js not detected in PATH. Opening index.html directly...
    start "" index.html
)
pause
