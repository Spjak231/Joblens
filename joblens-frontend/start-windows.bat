@echo off
echo ==========================================
echo    JobLens - CCPDMS Full Stack Launcher
echo ==========================================
echo.

:: Check Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Install from https://nodejs.org
    pause & exit /b 1
)

:: Backend
echo [1/3] Starting Backend (Express + MongoDB)...
cd /d "%~dp0CCPDMS_FINAL"
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
)
start "JobLens Backend" cmd /k "npm start"
timeout /t 3 /nobreak >nul

:: Frontend
echo [2/3] Setting up Frontend...
cd /d "%~dp0joblens-frontend"
if not exist node_modules (
    echo Installing frontend dependencies (this may take 2-3 mins)...
    npm install
)

echo [3/3] Starting Frontend (React)...
start "JobLens Frontend" cmd /k "npm start"

echo.
echo ==========================================
echo  JobLens is launching!
echo  Backend:  http://localhost:5000/api/health
echo  Frontend: http://localhost:3000
echo ==========================================
echo.
echo Login Credentials (after seeding):
echo   Coordinator: coordinator@college.edu / Test@123
echo   Student:     student@college.edu / Test@123
echo.
pause
