Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Starting SmartSpend AI Platform" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

Write-Host "[1/3] Starting Python ML FastAPI Service (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ml-service; python main.py"

Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Node.js Backend Gateway (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Start-Sleep -Seconds 2

Write-Host "[3/3] Starting React Frontend Dashboard (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nAll services active!" -ForegroundColor Green
Write-Host "• Frontend:     http://localhost:3000" -ForegroundColor White
Write-Host "• Backend:      http://localhost:5000/api/health" -ForegroundColor White
Write-Host "• ML API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
