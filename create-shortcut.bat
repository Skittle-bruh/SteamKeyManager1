@echo off
echo Creating desktop shortcut for Steam Inventory Parser...

REM Get the current directory
set "currentDir=%~dp0"

REM Determine the Windows desktop path
for /f "tokens=3* delims= " %%a in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" /v Desktop') do set "desktopPath=%%a"

REM Create VBScript to generate the shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%desktopPath%\Steam Inventory Parser.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%currentDir%start-app.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%currentDir%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "Track CS:GO case prices across multiple Steam accounts" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.IconLocation = "%currentDir%generated-icon.png" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"

REM Run the VBScript
cscript //nologo "%TEMP%\CreateShortcut.vbs"

REM Clean up the temporary VBScript file
del "%TEMP%\CreateShortcut.vbs"

echo Desktop shortcut created successfully.
echo.
pause