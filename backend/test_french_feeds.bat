@echo off
echo Testing French RSS feeds...
cd /d "%~dp0"
python test_health_api.py
pause 