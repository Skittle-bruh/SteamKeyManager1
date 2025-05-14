@echo off
echo Building Steam Inventory Parser for Windows...

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

REM Install dependencies if not already installed
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo Error installing dependencies.
        pause
        exit /b 1
    )
)

REM Build the application
echo Building application...
npm run build

echo.
echo Build completed successfully!
echo The application can now be run with start-app.bat
echo.
pause