@echo off
title Senang Invoice - Dev Server
color 0A

:: Run from repo root regardless of where this .bat lives
cd /d "%~dp0.."

echo ============================================
echo   Senang Invoice - Startup
echo ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [FAIL] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Node.js %NODE_VER%

:: Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [FAIL] npm not found.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo [OK] npm %NPM_VER%

:: Check Python and start OCR
where python >nul 2>&1
if %errorlevel% neq 0 (
    color 0E
    echo [WARN] Python not found - OCR will not work.
) else (
    python --version 2>&1
    echo [OK] Python

    if exist "scripts\ocr_requirements.txt" (
        python -c "import rapidocr_onnxruntime" >nul 2>&1
        if !errorlevel! neq 0 (
            echo [INFO] Installing RapidOCR...
            pip install -r scripts\ocr_requirements.txt
        ) else (
            echo [OK] RapidOCR installed
        )
    )
    echo [INFO] Starting RapidOCR on :8502
    start "Senang RapidOCR" python scripts\ocr_server.py
)

:: Check .env.local
if not exist ".env.local" (
    color 0E
    echo [WARN] .env.local not found. Copying from .env.local.example...
    if exist ".env.local.example" (
        copy ".env.local.example" ".env.local" >nul
        echo [INFO] Created .env.local - edit it with your API keys before use.
    ) else (
        echo [WARN] No .env.local.example found either. App may not work correctly.
    )
) else (
    echo [OK] .env.local exists
)

:: Check node_modules
if not exist "node_modules" (
    echo.
    echo [INFO] node_modules not found. Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [FAIL] npm install failed.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] node_modules exists
)

:: Start dev server
echo.
echo ============================================
echo   Starting Next.js dev server...
echo   Press Ctrl+C to stop.
echo ============================================
echo.
npm run dev
