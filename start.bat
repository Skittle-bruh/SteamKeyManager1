@echo off
echo =====================================
echo Steam Inventory Parser - Запуск
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
echo Запуск приложения...
echo.
echo Приложение будет доступно по адресу: http://localhost:5000
echo.
echo Для остановки нажмите Ctrl+C
echo.

call npm run dev