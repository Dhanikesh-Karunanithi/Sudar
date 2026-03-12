# Run ByteOS Intelligence (Edge-TTS, etc.)

**From project root:**
```bash
cd byteos-intelligence
pip install -r requirements.txt   # first time only
```

**Start server (pick one):**
- **Windows:** `run.bat`
- **Any OS:** `python -m uvicorn src.api.main:app --port 8000`

Then set `BYTEOS_INTELLIGENCE_URL=http://localhost:8000` in Studio `.env.local`. Audio (Edge-TTS) will work without any API keys.
