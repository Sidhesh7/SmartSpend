@echo off
echo ===================================================
echo   Starting SmartSpend Platform
echo ===================================================
echo [1/3] Starting Python ML FastAPI Service (Port 8000)...
start "SmartSpend ML Service" cmd /k "cd ml-service && python main.py"

timeout /t 2 >nul

echo [2/3] Starting Node.js / Express Backend (Port 5000)...
start "SmartSpend Backend" cmd /k "cd backend && npm run dev"

timeout /t 2 >nul

echo [3/3] Starting React Frontend (Port 3000)...
start "SmartSpend Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services launched!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000/api/health
echo ML FastAPI docs: http://localhost:8000/docs
echo ===================================================
