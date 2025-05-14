@echo off
echo Steam Inventory Parser - Database Backup Tool

REM Navigate to the project directory
cd %~dp0

REM Create backup directory if it doesn't exist
if not exist "backups" (
    echo Creating backups directory...
    mkdir backups
)

REM Get current date and time in format YYYY-MM-DD_HH-MM-SS
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

REM Define backup file path
set "backup_file=backups\inventory_backup_%timestamp%.db"

REM Check if the database file exists
if not exist "data\inventory.db" (
    echo.
    echo Error: Database file not found.
    echo Please run the application at least once before creating a backup.
    goto end
)

REM Create the backup 
echo.
echo Creating backup: %backup_file%
copy "data\inventory.db" "%backup_file%" >nul

REM Check if backup was successful
if exist "%backup_file%" (
    echo.
    echo Backup successful!
    echo.
    echo Backup saved to: %cd%\%backup_file%
) else (
    echo.
    echo Error: Backup failed!
)

:end
echo.
pause