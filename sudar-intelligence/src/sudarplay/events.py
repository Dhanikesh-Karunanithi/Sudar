"""
SudarPlay learning events endpoint.
WA scripts call this to log room_enter, room_exit, npc_interaction, etc.
"""
import os

from fastapi import APIRouter, Depends

from .auth import verify_sudarplay_jwt
from .schemas import EventRequest

router = APIRouter()


async def _log_learning_event(
    learner_id: str,
    module_id: str,
    event_type: str,
    payload: dict,
    modality: str = "sudarplay",
) -> bool:
    """Write one row to learning_events. Returns True on success."""
    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not supabase_url or not supabase_key:
        return False
    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)
        client.table("learning_events").insert({
            "user_id": learner_id,
            "module_id": module_id,
            "event_type": event_type,
            "payload": payload,
            "modality": modality,
        }).execute()
        return True
    except Exception:
        return False


@router.post("/event")
async def log_event(req: EventRequest, claims: dict = Depends(verify_sudarplay_jwt)):
    """Log a learning event from WorkAdventure. JWT required."""
    learner_id = claims.get("learner_id")
    module_id = claims.get("module_id")
    session_id = claims.get("session_id")
    if not learner_id or not module_id:
        return {"ok": False}
    payload = {"session_id": session_id, **req.payload}
    await _log_learning_event(
        learner_id=str(learner_id),
        module_id=str(module_id),
        event_type=req.event_type,
        payload=payload,
    )
    return {"ok": True}
