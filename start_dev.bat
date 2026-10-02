@echo off
echo Starting SmartMap Backend and Frontend Services...
start "SmartMap Backend (Flask :5000)" cmd /k "cd /d %~dp0backend && python run.py"
start "SmartMap Frontend (Vite :5173)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both servers started in dedicated terminal windows!
pause
