@echo off
set "ROOT=%~dp0"
cd /d "%ROOT%"

echo Root: %ROOT%
echo Starting services...

:: 1. Backend
echo [1/3] Starting Backend...
start "AI_Backend" /D "%ROOT%backend" cmd /k "..\.venv\Scripts\activate && python -m uvicorn main:app --reload --port 8000"

:: 2. Frontend
echo [2/3] Starting Frontend...
start "AI_Frontend" /D "%ROOT%backend\frontend" cmd /k "npm run dev"

:: 3. Browse
echo [3/3] Wait 7s to open browser...
timeout /t 7
start http://localhost:3000

echo Done. Check the new windows for errors.
pause
