@echo off
REM Start backend and frontend for web testing

echo.
echo ================================================
echo THE PHOTO APP - WEB TESTING STARTUP
echo ================================================
echo.

REM Start backend in new window
echo [1/2] Starting backend server...
start "Photo App Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait for backend to start
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak

REM Start frontend web in new window
echo [2/2] Starting web frontend...
start "Photo App Frontend (Web)" cmd /k "cd frontend && call npm install && expo start --web"

echo.
echo ================================================
echo STARTUP COMPLETE
echo ================================================
echo.
echo Backend: http://localhost:8000
echo Frontend Web: http://localhost:19006 (will open in browser)
echo.
echo Press Ctrl+C in any window to stop.
echo ================================================
echo.

pause
