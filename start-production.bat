@echo off
chcp 65001 >nul
echo =====================================
echo Steam Inventory Parser - Продакшн
echo =====================================
echo.

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
echo Сборка приложения...
npx vite build
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось собрать фронтенд!
    pause
    exit /b 1
)

npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось собрать сервер!
    pause
    exit /b 1
)

echo.
echo Запуск продакшн сервера...
echo.
echo Приложение будет доступно по адресу: http://localhost:5000
echo.
echo Для остановки нажмите Ctrl+C
echo.

set NODE_ENV=production
node dist/index.js
if %errorlevel% neq 0 (
    echo.
    echo ОШИБКА: Не удалось запустить продакшн сервер!
    pause
    exit /b 1
)