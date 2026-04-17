@echo off
cd /d "%~dp0"
python -m uvicorn src.api.main:app --port 8000 --reload
