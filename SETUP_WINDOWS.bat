@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo Enterprise Infrastructure Intelligence - First Time Setup
echo ============================================================

where py >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python launcher not found. Install Python 3.11 and enable Add Python to PATH.
  pause
  exit /b 1
)

py -3.11 --version >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python 3.11 is required for the tested setup instructions.
  echo Install Python 3.11, then run this file again.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed. Install Node.js 22 LTS, then run this file again.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo Creating backend virtual environment...
  py -3.11 -m venv .venv
  if errorlevel 1 goto :failed
)

echo Installing backend packages...
".venv\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 goto :failed
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :failed

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Created .env from .env.example.
  echo IMPORTANT: Edit .env and enter your MongoDB URL, database name, JWT secret, and OpenAI API key.
)

if not exist "frontend\package.json" (
  echo ERROR: frontend\package.json was not found.
  goto :failed
)

echo Installing frontend packages (this is a one-time setup)...
pushd frontend
call npm ci
if errorlevel 1 (
  popd
  goto :failed
)
popd

echo.
echo SETUP COMPLETED.
echo Next: edit .env, then run CREATE_ADMIN.bat once if you do not already have an Admin account.
echo Then run RUN_PROJECT.bat.
echo.
pause
exit /b 0

:failed
echo.
echo SETUP FAILED. Read the error above, correct it, and run SETUP_WINDOWS.bat again.
pause
exit /b 1
