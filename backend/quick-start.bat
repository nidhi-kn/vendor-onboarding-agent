@echo off
REM Quick Start Script for Windows
REM Runs both backend and connectors

echo ===============================================
echo Vendor Onboarding AI Agent - Quick Start
echo ===============================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo.
    echo Please create .env file with:
    echo   DATABASE_URL="file:./prisma/dev.db"
    echo   GROQ_API_KEY=your_groq_api_key
    echo   PORT=3000
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if Prisma client is generated
echo Checking Prisma setup...
call npx prisma generate
echo.

REM Check if database is migrated
echo Running database migrations...
call npx prisma migrate deploy
echo.

echo ===============================================
echo Starting Backend Server...
echo ===============================================
echo.
echo Backend will start on http://localhost:3000
echo.
echo To start connectors, open another terminal and run:
echo   cd backend
echo   node start-connectors.js
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

node src\server.js
