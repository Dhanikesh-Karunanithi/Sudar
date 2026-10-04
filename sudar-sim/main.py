"""

SudarSim — Real-time voice orchestration service.

Pipecat/LiveKit in production; WebSocket turn loop in SIM_DEV_MODE.

"""

from __future__ import annotations



import asyncio

import hmac

import json

import logging

import os

import uuid

from contextlib import asynccontextmanager



import httpx

from dotenv import load_dotenv

from fastapi import FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, Field



load_dotenv()

load_dotenv(".env.local")



logger = logging.getLogger(__name__)



INTELLIGENCE_URL = (os.getenv("SUDAR_INTELLIGENCE_URL") or "http://localhost:8001").rstrip("/")

INTEL_SECRET = os.getenv("INTELLIGENCE_SERVICE_SECRET", "").strip()

_ENV = (os.getenv("ENV") or os.getenv("NODE_ENV") or "").strip().lower()

_IS_PROD = _ENV in {"production", "prod"}

_SIM_DEV_RAW = os.getenv("SIM_DEV_MODE")

if _SIM_DEV_RAW is None:

    SIM_DEV_MODE = not _IS_PROD

else:

    SIM_DEV_MODE = _SIM_DEV_RAW.strip() == "1"

LIVEKIT_URL = os.getenv("LIVEKIT_URL", "").strip()

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "").strip()

LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "").strip()

SIM_SERVICE_SECRET = os.getenv("SUDAR_SIM_SERVICE_SECRET", "").strip()



_cors_raw = (

    os.getenv("SUDAR_LEARN_ORIGINS")

    or os.getenv("SUDAR_LEARN_ORIGIN")

    or "http://localhost:3001"

)

CORS_ORIGINS = [o.strip() for o in _cors_raw.split(",") if o.strip()]



_active_agents: dict[str, asyncio.Task] = {}





class CreateRoomRequest(BaseModel):

    session_id: str

    user_id: str

    locale: str = "en"

    scenario_id: str | None = None





class CreateRoomResponse(BaseModel):

    room_name: str

    livekit_url: str | None = None

    token: str | None = None

    dev_ws_url: str | None = None

    agent_dispatched: bool = False





class JoinRoomRequest(BaseModel):

    session_id: str

    user_id: str

    room_name: str





class VoiceTurnRequest(BaseModel):

    session_id: str

    user_text: str

    persona_state: dict = Field(default_factory=dict)

    scenario_id: str | None = None

    locale: str = "en"





def _livekit_configured() -> bool:

    return bool(LIVEKIT_URL and LIVEKIT_API_KEY and LIVEKIT_API_SECRET)





def _generate_participant_token(room_name: str, identity: str, *, agent: bool = False) -> str:

    from livekit import api



    grant = api.VideoGrants(

        room_join=True,

        room=room_name,

        can_publish=True,

        can_subscribe=True,

        agent=agent,

    )

    return (

        api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

        .with_identity(identity)

        .with_name(identity)

        .with_grants(grant)

        .to_jwt()

    )





def _dispatch_agent(room_name: str, session_id: str, user_id: str, locale: str) -> bool:

    if not _livekit_configured():

        return False

    if room_name in _active_agents and not _active_agents[room_name].done():

        return True



    async def _run() -> None:

        from agent.pipeline import run_voice_agent



        agent_identity = f"sim-agent-{session_id[:8]}"

        agent_token = _generate_participant_token(room_name, agent_identity, agent=True)

        try:

            await run_voice_agent(

                livekit_url=LIVEKIT_URL,

                agent_token=agent_token,

                room_name=room_name,

                session_id=session_id,

                user_id=user_id,

                locale=locale,

            )

        except asyncio.CancelledError:

            raise

        except Exception:

            logger.exception("sim voice agent failed for room %s (session %s)", room_name, session_id)

        finally:

            _active_agents.pop(room_name, None)



    task = asyncio.create_task(_run(), name=f"sim-agent-{room_name}")

    _active_agents[room_name] = task

    return True





@asynccontextmanager

async def lifespan(_app: FastAPI):

    yield

    for task in list(_active_agents.values()):

        task.cancel()

    if _active_agents:

        await asyncio.gather(*_active_agents.values(), return_exceptions=True)





app = FastAPI(title="SudarSim Voice", version="0.2.0", lifespan=lifespan)

app.add_middleware(

    CORSMiddleware,

    allow_origins=CORS_ORIGINS,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)





def _require_sim_secret(header_value: str | None) -> None:

    if not SIM_SERVICE_SECRET:

        if _IS_PROD or not SIM_DEV_MODE:

            raise HTTPException(

                status_code=503,

                detail="SUDAR_SIM_SERVICE_SECRET is not configured",

            )

        return

    provided = (header_value or "").strip()

    if (

        not provided

        or len(provided) != len(SIM_SERVICE_SECRET)

        or not hmac.compare_digest(provided, SIM_SERVICE_SECRET)

    ):

        raise HTTPException(status_code=401, detail="Unauthorized")





@app.get("/")

def root():

    return {

        "service": "SudarSim",

        "dev_mode": SIM_DEV_MODE,

        "livekit_configured": _livekit_configured(),

        "active_agents": len(_active_agents),

    }





@app.get("/health")

def health():

    return {

        "ok": True,

        "livekit_configured": _livekit_configured(),

        "deepgram_configured": bool(os.getenv("DEEPGRAM_API_KEY", "").strip()),

        "cartesia_configured": bool(os.getenv("CARTESIA_API_KEY", "").strip()),

    }





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

async def create_room(

    body: CreateRoomRequest,

    x_sudar_sim_secret: str | None = Header(default=None, alias="X-Sudar-Sim-Secret"),

):

    _require_sim_secret(x_sudar_sim_secret)

    room_name = f"sim-{body.session_id[:8]}-{uuid.uuid4().hex[:6]}"

    token = None

    livekit_url = LIVEKIT_URL or None

    agent_dispatched = False



    if _livekit_configured():

        try:

            token = _generate_participant_token(room_name, body.user_id, agent=False)

            agent_dispatched = _dispatch_agent(room_name, body.session_id, body.user_id, body.locale)

        except Exception as exc:

            raise HTTPException(status_code=500, detail=f"LiveKit token failed: {exc}") from exc



    dev_ws = f"/ws/session/{body.session_id}" if SIM_DEV_MODE else None

    return CreateRoomResponse(

        room_name=room_name,

        livekit_url=livekit_url,

        token=token,

        dev_ws_url=dev_ws,

        agent_dispatched=agent_dispatched,

    )





@app.post("/rooms/join")

async def join_room(

    body: JoinRoomRequest,

    x_sudar_sim_secret: str | None = Header(default=None, alias="X-Sudar-Sim-Secret"),

):

    """Mint a fresh learner token for an existing room (page reload)."""

    _require_sim_secret(x_sudar_sim_secret)

    if not _livekit_configured():

        raise HTTPException(status_code=503, detail="LiveKit not configured")

    token = _generate_participant_token(body.room_name, body.user_id, agent=False)

    return {

        "room_name": body.room_name,

        "livekit_url": LIVEKIT_URL,

        "token": token,

    }





@app.post("/voice/turn")

async def voice_turn(

    body: VoiceTurnRequest,

    x_sudar_sim_secret: str | None = Header(default=None, alias="X-Sudar-Sim-Secret"),

):

    """HTTP turn for dev / chat fallback."""

    _require_sim_secret(x_sudar_sim_secret)

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

    """Dev-mode bidirectional text turn loop."""

    secret = websocket.headers.get("x-sudar-sim-secret") or websocket.query_params.get("secret")

    try:

        _require_sim_secret(secret)

    except HTTPException:

        await websocket.close(code=4401)

        return



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

                    "audio_base64": result.get("audio_base64"),

                    "audio_mime": result.get("audio_mime"),

                }

            )

    except WebSocketDisconnect:

        return


