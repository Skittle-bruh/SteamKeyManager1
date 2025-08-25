@echo off
echo Starting Steam Inventory Parser...
echo.

if not exist "node_modules" (
    echo Dependencies not found! Running install...
    call install.bat
    if %errorlevel% neq 0 (
        echo Installation failed!
        pause
        exit /b 1
    )
)

if not exist "data" mkdir data

echo.
echo Application will be available at: http://localhost:5000
echo Press Ctrl+C to stop
echo.

set NODE_ENV=development
npx tsx server/index.ts