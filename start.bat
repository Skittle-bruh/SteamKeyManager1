@echo off
chcp 65001 >nul
echo =====================================
echo Steam Inventory Parser - Запуск
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

echo Проверка зависимостей...
if not exist "node_modules" (
    echo ВНИМАНИЕ: Зависимости не установлены!
    echo Запускаю установку...
    call install.bat
    if %errorlevel% neq 0 (
        echo Ошибка установки зависимостей
        pause
        exit /b 1
    )
)

echo.
echo Создание базы данных...
if not exist "data" mkdir data

echo.
echo Запуск приложения...
echo.
echo Приложение будет доступно по адресу: http://localhost:5000
echo.
echo Для остановки нажмите Ctrl+C
echo.

set NODE_ENV=development
npx tsx server/index.ts
if %errorlevel% neq 0 (
    echo.
    echo ОШИБКА: Не удалось запустить приложение!
    echo Проверьте, что все зависимости установлены правильно.
    pause
    exit /b 1
)