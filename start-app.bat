@echo off
echo Starting Steam Inventory Parser...

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

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not installed.
    echo Please install Node.js with npm from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo Error installing dependencies.
        pause
        exit /b 1
    )
)

REM Set environment variables for Windows
REM We use set instead of NODE_ENV=development which doesn't work on Windows
set NODE_ENV=development

REM Start the application
echo Starting server...
start cmd /k npx tsx server/index.ts

REM Wait for the server to start
timeout /t 5 /nobreak

REM Open the application in the default browser
echo Opening application in browser...
start http://localhost:5000

echo Steam Inventory Parser is running.
echo Close this window when you're done using the application.
echo.
pause