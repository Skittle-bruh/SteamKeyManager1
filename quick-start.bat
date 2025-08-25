@echo off
if not exist "data" mkdir data
set NODE_ENV=development
npx tsx server/index.ts
pause