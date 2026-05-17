@echo off
setlocal enabledelayedexpansion

if "%1"=="" (
    echo Usage: run backend   - Start backend server
    echo        run frontend  - Start frontend app
    echo        run dev       - Start both backend and frontend
    exit /b 1
)

if /i "%1"=="backend" (
    echo Starting Backend...
    cd backend
    call venv\Scripts\activate.bat
    uvicorn app.main:app --reload
    exit /b 0
)

if /i "%1"=="frontend" (
    echo Starting Frontend...
    cd frontend
    npx expo start --clear
    exit /b 0
)

if /i "%1"=="dev" (
    echo Starting Backend and Frontend in separate windows...
    start "Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn app.main:app --reload"
    start "Frontend" cmd /k "cd frontend && npx expo start --clear"
    exit /b 0
)

echo Unknown command: %1
echo Usage: run backend   - Start backend server
echo        run frontend  - Start frontend app
echo        run dev       - Start both backend and frontend
exit /b 1
