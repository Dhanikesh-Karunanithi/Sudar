"""
SudarSim — Real-time voice orchestration service.
Pipecat/LiveKit in production; WebSocket turn loop in SIM_DEV_MODE.
"""
from __future__ import annotations

import json
import os
import uuid
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()
load_dotenv(".env.local")

INTELLIGENCE_URL = (os.getenv("SUDAR_INTELLIGENCE_URL") or "http://localhost:8001").rstrip("/")
INTEL_SECRET = os.getenv("INTELLIGENCE_SERVICE_SECRET", "").strip()
SIM_DEV_MODE = os.getenv("SIM_DEV_MODE", "1") == "1"
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "").strip()
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "").strip()
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "").strip()


class CreateRoomRequest(BaseModel):
    session_id: str
    user_id: str
    locale: str = "en"


class CreateRoomResponse(BaseModel):
    room_name: str
    livekit_url: str | None = None
    token: str | None = None
    dev_ws_url: str | None = None


class VoiceTurnRequest(BaseModel):
    session_id: str
    user_text: str
    persona_state: dict = Field(default_factory=dict)
    scenario_id: str | None = None
    locale: str = "en"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(title="SudarSim Voice", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "SudarSim", "dev_mode": SIM_DEV_MODE, "livekit_configured": bool(LIVEKIT_URL)}


@app.get("/health")
def health():
    return {"ok": True}


def _intel_headers() -> dict[str, str]:
    h = {"Content-Type": "application/json"}
    if INTEL_SECRET:
        h["X-Intelligence-Service-Secret"] = INTEL_SECRET
    return h


async def persona_turn(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            f"{INTELLIGENCE_URL}/api/sim/persona/turn",
            headers=_intel_headers(),
            json=payload,
        )
        if not res.is_success:
            raise HTTPException(status_code=502, detail=res.text)
        return res.json()


@app.post("/rooms", response_model=CreateRoomResponse)
async def create_room(body: CreateRoomRequest):
    room_name = f"sim-{body.session_id[:8]}-{uuid.uuid4().hex[:6]}"
    token = None
    livekit_url = LIVEKIT_URL or None

    if LIVEKIT_URL and LIVEKIT_API_KEY and LIVEKIT_API_SECRET:
        try:
            from livekit import api

            grant = api.VideoGrants(room_join=True, room=room_name, can_publish=True, can_subscribe=True)
            token = (
                api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
                .with_identity(body.user_id)
                .with_grants(grant)
                .to_jwt()
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"LiveKit token failed: {exc}") from exc

    dev_ws = f"/ws/session/{body.session_id}" if SIM_DEV_MODE else None
    return CreateRoomResponse(
        room_name=room_name,
        livekit_url=livekit_url,
        token=token,
        dev_ws_url=dev_ws,
    )


@app.post("/voice/turn")
async def voice_turn(body: VoiceTurnRequest):
    """HTTP turn for dev / chat fallback."""
    result = await persona_turn(
        {
            "session_id": body.session_id,
            "user_message": body.user_text,
            "persona_state": body.persona_state,
            "scenario_id": body.scenario_id,
            "locale": body.locale,
            "channel": "phone",
        }
    )
    return result


@app.websocket("/ws/session/{session_id}")
async def ws_session(websocket: WebSocket, session_id: str):
    """Dev-mode bidirectional text/voice turn loop."""
    await websocket.accept()
    persona_state: dict = {"mood": 0.5, "difficulty": 0.5, "trust": 0.5}
    locale = "en"
    scenario_id: str | None = None
    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            if msg.get("type") == "config":
                locale = msg.get("locale") or locale
                scenario_id = msg.get("scenario_id")
                persona_state = msg.get("persona_state") or persona_state
                await websocket.send_json({"type": "ready", "session_id": session_id})
                continue
            if msg.get("type") != "user_turn":
                continue
            user_text = (msg.get("text") or "").strip()
            if not user_text:
                continue
            result = await persona_turn(
                {
                    "session_id": session_id,
                    "user_message": user_text,
                    "persona_state": persona_state,
                    "scenario_id": scenario_id,
                    "locale": locale,
                    "channel": "phone",
                }
            )
            persona_state = result.get("persona_state") or persona_state
            await websocket.send_json(
                {
                    "type": "customer_turn",
                    "reply": result.get("reply", ""),
                    "persona_state": persona_state,
                    "audio_hint": result.get("audio_hint"),
                }
            )
    except WebSocketDisconnect:
        return
