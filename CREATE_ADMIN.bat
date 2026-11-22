@echo off
setlocal
cd /d "%~dp0"
if not exist ".env" (
  echo ERROR: .env is missing. Run SETUP_WINDOWS.bat and configure .env first.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  echo ERROR: Backend environment is missing. Run SETUP_WINDOWS.bat first.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" scripts\create_admin.py
if errorlevel 1 echo Admin creation failed. Check the message above and whether this email already exists.
pause
