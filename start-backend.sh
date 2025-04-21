#!/bin/bash

echo "Starting MedAI Backend..."

# Check if Python is installed
python --version 2>&1 >/dev/null
if [ $? -ne 0 ]; then
  echo "Error: Python is not installed or not in PATH"
  exit 1
fi

# Check if pip is installed
pip --version 2>&1 >/dev/null
if [ $? -ne 0 ]; then
  echo "Error: pip is not installed or not in PATH"
  exit 1
fi

# Go to backend directory
cd backend || exit

# Install dependencies if needed
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python -m venv venv
  if [ $? -ne 0 ]; then
    echo "Error: Failed to create virtual environment"
    exit 1
  fi
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

if [ $? -ne 0 ]; then
  echo "Error: Failed to activate virtual environment"
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt || pip install flask flask_cors flask_jwt_extended flask_sqlalchemy

# Start the backend
echo "Starting Flask server on port 5000..."
export FLASK_APP=app.py
export FLASK_ENV=development
export FLASK_DEBUG=1

# Kill any process running on port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null
netstat -ano | findstr :5000 | awk '{print $5}' | xargs taskkill /F /PID 2>/dev/null

# Start the server
python -m flask run --host=0.0.0.0 --port=5000

echo "Backend stopped." 