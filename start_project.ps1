# Start AI English Learning Assistant (Backend + Frontend)

Write-Host "🚀 Initializing AI Learning Environment..." -ForegroundColor Cyan

# --- Smart Port Cleanup ---
function Stop-PortProcess([int]$port) {
    try {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            $target_pid = $connection.OwningProcess
            Write-Host "⚠️  Cleaning up zombie process on port $port (PID: $target_pid)..." -ForegroundColor Yellow
            Stop-Process -Id $target_pid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        }
    } catch { }
}

Write-Host "🧹 Pre-launch cleanup..." -ForegroundColor Gray
Stop-PortProcess 8000
Stop-PortProcess 8080
Stop-PortProcess 3000

# --- Validation ---
if (-Not (Test-Path ".env")) {
    Write-Warning ".env file not found. System might fail to load API keys."
}

# --- Launch Services ---
Write-Host "⚡ Launching Services..." -ForegroundColor Cyan

# Start Backend (FastAPI)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload"

# Start Frontend (Next.js)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/frontend; npm run dev"

# --- Wait and Open Browser ---
Write-Host "`n⏳ Waiting for the interface to wake up..." -ForegroundColor Yellow
$count = 0
while ($count -lt 30) {
    if (Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet) {
        Write-Host "✅ Portal detected! Opening browser..." -ForegroundColor Green
        Start-Process "http://localhost:3000/dashboard"
        break
    }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 1
    $count++
}

Write-Host "`n✅ Success! The Ethereal Scholar is ready." -ForegroundColor Green
Write-Host "Backend API: http://localhost:8080"
Write-Host "Frontend UI:  http://localhost:3000"
Write-Host "`n(Tip: Please USE the browser window that just opened automatically.)" -ForegroundColor Gray
Write-Host "(DANGER: Never open the .js or .html files directly via file://)" -ForegroundColor Red
