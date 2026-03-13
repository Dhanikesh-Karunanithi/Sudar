"""
SudarPlay launch token endpoint.
Called by Learn app before redirecting to WorkAdventure. Returns short-lived JWT.
"""
import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

try:
    import jwt as pyjwt
except ImportError:
    pyjwt = None  # type: ignore

from fastapi import APIRouter, HTTPException

from .schemas import LaunchTokenRequest

router = APIRouter()


def _get_jwt_secret() -> str:
    secret = os.environ.get("SUDARPLAY_JWT_SECRET", "").strip()
    if not secret:
        raise HTTPException(
            status_code=503,
            detail="SudarPlay not configured (SUDARPLAY_JWT_SECRET)",
        )
    return secret


def _get_wa_base_url() -> str:
    url = os.environ.get("WA_INSTANCE_URL", "").strip() or "https://play.sudar.app"
    return url.rstrip("/")


async def _get_module_sudarplay_map_id(module_id: UUID) -> tuple[str | None, str | None]:
    """
    Fetch module's sudarplay_map_id and sudarplay_map_url from DB.
    Returns (map_id, map_url). Both None if no map.
    """
    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not supabase_url or not supabase_key:
        return None, None
    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)
        r = client.table("modules").select("sudarplay_map_id, sudarplay_map_url").eq("id", str(module_id)).limit(1).execute()
        if not r.data or len(r.data) == 0:
            return None, None
        row = r.data[0]
        return row.get("sudarplay_map_id"), row.get("sudarplay_map_url")
    except Exception:
        return None, None


async def _create_sudarplay_session(learner_id: UUID, map_id: UUID, module_id: UUID) -> UUID | None:
    """Insert a row into sudarplay_sessions; return session id."""
    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not supabase_url or not supabase_key:
        return None
    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)
        r = client.table("sudarplay_sessions").insert({
            "learner_id": str(learner_id),
            "map_id": str(map_id),
            "module_id": str(module_id),
        }).execute()
        if r.data and len(r.data) > 0:
            return UUID(r.data[0]["id"])
    except Exception:
        pass
    return None


@router.post("/launch-token")
async def launch_token(req: LaunchTokenRequest):
    """
    Issue a short-lived JWT for WorkAdventure → Sudar API calls.
    Learn app calls this (with Supabase session auth) then redirects to WA with token.
    """
    if pyjwt is None:
        raise HTTPException(
            status_code=503,
            detail="JWT support not installed (pip install pyjwt)",
        )
    map_id, map_url = await _get_module_sudarplay_map_id(req.module_id)
    if not map_id or not map_url:
        raise HTTPException(
            status_code=400,
            detail="No SudarPlay map for this module",
        )
    session_id = await _create_sudarplay_session(req.learner_id, UUID(str(map_id)), req.module_id)
    if not session_id:
        raise HTTPException(
            status_code=500,
            detail="Failed to create SudarPlay session",
        )
    wa_base = _get_wa_base_url()
    exp = datetime.now(timezone.utc) + timedelta(minutes=90)
    payload = {
        "learner_id": str(req.learner_id),
        "module_id": str(req.module_id),
        "map_id": str(map_id),
        "session_id": str(session_id),
        "exp": exp,
    }
    token = pyjwt.encode(payload, _get_jwt_secret(), algorithm="HS256")
    if hasattr(token, "decode"):
        token = token.decode("utf-8")
    wa_url = f"{wa_base}/maps/{map_id}"
    return {
        "token": token,
        "wa_url": wa_url,
        "session_id": str(session_id),
        "expires_at": exp.isoformat(),
    }
