@echo off
echo Starting Steam Inventory Parser (Production Mode)...

REM Navigate to the project directory (change this path to your installation directory)
cd %~dp0

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check database file exists, if not create it
if not exist "data" (
    echo Creating data directory...
    mkdir data
)

REM Set environment variables for production
set NODE_ENV=production
set DB_PATH=data/inventory.db

REM Start the server in production mode
echo Starting server in production mode...
start node dist/server/index.js

REM Wait for the server to start
timeout /t 3 /nobreak

REM Open the application in the default browser
echo Opening application in browser...
start http://localhost:5000

echo Steam Inventory Parser is running in production mode.
echo Close this window when you're done using the application.
echo.
pause