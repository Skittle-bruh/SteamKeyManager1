@echo off
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
call npm run build

if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось собрать приложение!
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
call node dist/server/index.js