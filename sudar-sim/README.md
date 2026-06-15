# SudarSim Voice Service

Real-time voice orchestration for SudarSim roleplay (Pipecat/LiveKit in production, WebSocket dev mode).

```bash
pip install -r requirements.txt
cp .env.example .env
SIM_DEV_MODE=1 uvicorn main:app --port 8090
```

See [docs/SUDAR_SIM_DEPLOY.md](../docs/SUDAR_SIM_DEPLOY.md).
