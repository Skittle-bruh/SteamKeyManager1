@echo off
chcp 65001 >nul
echo =====================================
echo Steam Inventory Parser - Установка
echo =====================================
echo.

echo Проверка Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не установлен!
    echo Пожалуйста, установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js найден, версия:
node --version

echo.
echo Установка зависимостей...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ОШИБКА: Не удалось установить зависимости!
    pause
    exit /b 1
)

echo.
echo =====================================
echo Установка завершена успешно!
echo =====================================
echo.
echo Для запуска приложения используйте start.bat
echo.
pause