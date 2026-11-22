@echo off
setlocal
set "ROOT=%~dp0"
if not exist "%ROOT%.env" (
  echo ERROR: .env is missing. Run SETUP_WINDOWS.bat and configure .env first.
  pause
  exit /b 1
)
if not exist "%ROOT%.venv\Scripts\python.exe" (
  echo ERROR: Backend environment is missing. Run SETUP_WINDOWS.bat first.
  pause
  exit /b 1
)
if not exist "%ROOT%frontend\node_modules" (
  echo ERROR: Frontend dependencies are missing. Run SETUP_WINDOWS.bat first.
  pause
  exit /b 1
)

echo Starting backend and frontend in separate terminal windows...
start "InfraMind - FastAPI Backend" /D "%ROOT%" cmd /k ".venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 2 /nobreak >nul
start "InfraMind - React Frontend" /D "%ROOT%frontend" cmd /k "npm run dev -- --host 127.0.0.1"
echo.
echo Backend:  http://127.0.0.1:8000
echo API docs: http://127.0.0.1:8000/docs
echo Frontend: check the Vite URL in the frontend terminal (normally http://127.0.0.1:5173)
echo Keep both terminal windows open while using the application.
echo.
pause
