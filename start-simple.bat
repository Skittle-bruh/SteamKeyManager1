@echo off
chcp 65001 >nul
echo =====================================
echo Steam Inventory Parser - Простой запуск
echo =====================================
echo.

echo Запуск приложения...
echo Приложение будет доступно по адресу: http://localhost:5000
echo.

set NODE_ENV=development
npx tsx server/index.ts

pause