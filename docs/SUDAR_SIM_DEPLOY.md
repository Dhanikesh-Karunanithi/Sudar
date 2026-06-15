# SudarSim — Deployment (Oracle Cloud Free Tier)

Deploy the real-time voice service (`sudar-sim/`) on Oracle Cloud Always Free ARM, with LiveKit and Pipecat.

---

## 1. Oracle Cloud setup

Use the bootstrap script after SSH into a new VM:

```bash
curl -sSL https://raw.githubusercontent.com/Dhanikesh-Karunanithi/Sudar/main/sudar-sim/scripts/oci-bootstrap.sh | sudo bash
# Or clone repo and run sudar-sim/scripts/oci-bootstrap.sh
```

Security list ports: see `sudar-sim/scripts/oci-security-list.md`.

Manual steps:

1. Create OCI account → **Always Free** ARM Ampere VM (4 OCPU, 24 GB RAM recommended shape).
2. Ubuntu 22.04+ image; open security list ports:
   - `7880`, `7881` — LiveKit HTTP/WS
   - `50000-60000/udp` — WebRTC media
   - `3478/udp` — TURN (optional)
   - `8090` — sudar-sim FastAPI (or reverse proxy 443)
3. Assign elastic IP; point DNS e.g. `sim-voice.yourdomain.com`.

---

## 2. LiveKit (self-hosted)

```bash
curl -sSL https://get.livekit.io | bash
# Configure livekit.yaml with API key/secret
livekit-server --config livekit.yaml
```

Env for sudar-sim:

```env
LIVEKIT_URL=wss://sim-voice.yourdomain.com
LIVEKIT_API_KEY=…
LIVEKIT_API_SECRET=…
```

---

## 3. sudar-sim service

```bash
cd sudar-sim
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Set TOGETHER_API_KEY, DEEPGRAM_API_KEY, SUDAR_INTELLIGENCE_URL, SUPABASE_*
uvicorn main:app --host 0.0.0.0 --port 8090
```

Systemd unit example:

```ini
[Unit]
Description=SudarSim Voice Service
After=network.target

[Service]
WorkingDirectory=/opt/sudar/sudar-sim
EnvironmentFile=/opt/sudar/sudar-sim/.env
ExecStart=/opt/sudar/sudar-sim/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8090
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 4. Learn / Intelligence env

In `sudar-learn/.env`:

```env
SUDAR_SIM_URL=https://sim-voice.yourdomain.com
SUDAR_SIM_WS_URL=wss://sim-voice.yourdomain.com
```

Intelligence unchanged except sim routes mounted at `/api/sim`.

---

## 5. Provider keys (BYO)

| Variable | Purpose |
|----------|---------|
| `TOGETHER_API_KEY` | Persona LLM, coach, scenario gen |
| `DEEPGRAM_API_KEY` | Streaming STT (EN + multilingual Tamil) |
| `CARTESIA_API_KEY` or `ELEVENLABS_API_KEY` | Streaming TTS |
| `SARVAM_API_KEY` | Tamil TTS fallback |

---

## 6. Local dev (no Oracle)

```bash
# Terminal 1 — Intelligence
cd sudar-intelligence && uvicorn src.api.main:app --port 8001

# Terminal 2 — sudar-sim (WebSocket fallback mode)
cd sudar-sim && SIM_DEV_MODE=1 uvicorn main:app --port 8090

# Terminal 3 — Learn
cd sudar-learn && npm run dev
```

Set `SUDAR_SIM_URL=http://localhost:8090` on Learn.

---

## 7. Tamil proof checklist

- Scenario `locale: "ta"` or `ta-IN`
- STT: Deepgram `language=ta` or Whisper `ta`
- TTS: Sarvam voice or Edge `ta-IN-PallaviNeural` (dev fallback)
