@echo off
setlocal
cd /d "%~dp0"
if not exist ".env" (
  echo ERROR: .env is missing. Run SETUP_WINDOWS.bat and configure it first.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  echo ERROR: Backend environment is missing. Run SETUP_WINDOWS.bat first.
  pause
  exit /b 1
)
echo This optional demo loader only inserts missing sample rows.
echo It never deletes or overwrites existing MongoDB data.
echo It directly imports sample Golden Configurations and therefore bypasses the AI approval workflow.
choice /C YN /M "Continue with optional demo import"
if errorlevel 2 exit /b 0
".venv\Scripts\python.exe" scripts\load_demo_data.py
if errorlevel 1 echo Demo data import failed. Check MongoDB connectivity and the error above.
pause
