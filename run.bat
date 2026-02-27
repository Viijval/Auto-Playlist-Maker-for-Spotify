@echo off

echo Starting Backend...
start cmd /k "cd autoplaylist-backend && uvicorn main:app --reload --port 8888"

timeout /t 3 > nul

echo Starting Frontend...
start cmd /k "cd autoplaylist-frontend && npm run dev"

timeout /t 5 > nul

echo Opening Browser...
start http://localhost:5173

echo All systems running.