@echo off
echo Starting MedAI Backend...

REM Check if Python is installed
python --version 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in PATH
    exit /b 1
)

REM Check if pip is installed
pip --version 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: pip is not installed or not in PATH
    exit /b 1
)

REM Go to backend directory
cd backend || exit /b 1

REM Install dependencies if needed
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to create virtual environment
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate.bat
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to activate virtual environment
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt 2>nul || pip install flask flask_cors flask_jwt_extended flask_sqlalchemy

REM Kill any process running on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5000
    taskkill /F /PID %%a 2>nul
)

REM Start the backend
echo Starting Flask server on port 5000...
set FLASK_APP=app.py
set FLASK_ENV=development
set FLASK_DEBUG=1

REM Start the server
python -m flask run --host=0.0.0.0 --port=5000

echo Backend stopped. 