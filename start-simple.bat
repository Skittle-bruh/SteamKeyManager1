@echo off
echo Steam Inventory Parser - Quick Start
echo.
echo Application will be available at: http://localhost:5000
echo.

set NODE_ENV=development
npx tsx server/index.ts

pause