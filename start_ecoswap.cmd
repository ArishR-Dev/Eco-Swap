@echo off
title EcoSwap Smart Launcher
color 0A

REM Always run from script location (portable)
cd /d "%~dp0"

cls
echo ============================================
echo           ECOSWAP LAUNCHER
echo ============================================
echo.

:: =========================
:: CHECK NODE
:: =========================
echo   [*] Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    color 0C
    echo   [X] Node.js not installed!
    pause
    exit
)
echo   [OK] Node OK

:: =========================
:: CHECK PYTHON
:: =========================
echo   [*] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo   [X] Python not installed!
    pause
    exit
)
echo   [OK] Python OK
echo.

:: =========================
:: SMART BUILD DETECTION
:: =========================
echo   [*] Checking frontend changes...

set "BUILD_FLAG_FILE=%~dp0frontend\.lastbuild"
set NEED_BUILD=

if not exist "%BUILD_FLAG_FILE%" (
    echo   [!] First run - building required...
    set NEED_BUILD=1
) else (
    REM Compare latest frontend/src timestamp against .lastbuild timestamp (recursive)
    for /r "%~dp0frontend\src" %%F in (*) do (
        if %%~tF GTR %%~t"%BUILD_FLAG_FILE%" set NEED_BUILD=1
    )
)

if defined NEED_BUILD (
    echo   [+] Changes detected - Building frontend...
    start "Frontend Build" cmd /c "cd /d ""%~dp0frontend"" && npm run build && echo done > .lastbuild"
) else (
    echo   [FAST] No changes - Skipping build
)

:: =========================
:: KILL PORT 8080
:: =========================
echo.
echo   [*] Cleaning port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do taskkill /F /PID %%a >nul 2>&1

:: =========================
:: START BACKEND
:: =========================
echo   [*] Starting backend...
start "EcoSwap Backend" cmd /k "cd /d ""%~dp0backend"" && call venv\Scripts\activate && set FLASK_RUN_PORT=8080 && flask run"

:: =========================
:: WAIT FOR SERVER
:: =========================
echo   [*] Waiting for server...
:waitloop
curl http://localhost:8080 >nul 2>&1
if errorlevel 1 (
    timeout /t 1 >nul
    goto waitloop
)

:: =========================
:: OPEN DEFAULT BROWSER
:: =========================
echo   [OPEN] Opening in default browser...

start "" http://localhost:8080

:: =========================
:: DONE
:: =========================
echo.
echo ============================================
echo   [OK] EcoSwap is LIVE!
echo ============================================

color 0B
echo   [INFO] Smart mode enabled (portable + auto-detect)
echo.

pause
exit