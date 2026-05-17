@echo off
cd /d "C:\AI Projects\The_Photo_app\backend"
call venv\Scripts\activate.bat
python -m pip install -q -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
