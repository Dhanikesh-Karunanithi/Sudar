"""Load session + scenario context for the voice agent."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any

import httpx

LEARN_URL = (os.getenv("SUDAR_LEARN_URL") or "http://localhost:3001").rstrip("/")
LEARN_SECRET = os.getenv("SUDAR_LEARN_INTERNAL_SECRET") or os.getenv("SUDAR_SIM_SERVICE_SECRET", "")


@dataclass
class AgentSessionContext:
    session_id: str
    user_id: str
    scenario_id: str
    locale: str
    persona_state: dict[str, float]
    scenario: dict[str, Any]
    history: list[dict[str, str]] = field(default_factory=list)
    opening_spoken: bool = False


def _learn_headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if LEARN_SECRET.strip():
        headers["X-Sudar-Sim-Secret"] = LEARN_SECRET.strip()
    return headers


async def fetch_session_context(session_id: str, user_id: str) -> AgentSessionContext:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{LEARN_URL}/api/sim/session/{session_id}/agent",
            headers=_learn_headers(),
            params={"user_id": user_id},
        )
        if not res.is_success:
            raise RuntimeError(f"Failed to load session context ({res.status_code}): {res.text[:300]}")
        data = res.json()
        if not data.get("success"):
            raise RuntimeError(data.get("error") or "session context failed")

    scenario = data.get("scenario") or {}
    persona_state = data.get("persona_state") or {"mood": 0.5, "difficulty": 0.5, "trust": 0.5}
    transcript = data.get("transcript") or []
    history = [
        {"role": t["role"], "text": t["text"]}
        for t in transcript
        if isinstance(t, dict) and t.get("role") in ("learner", "customer") and t.get("text")
    ]

    return AgentSessionContext(
        session_id=session_id,
        user_id=user_id,
        scenario_id=str(data.get("scenario_id") or scenario.get("id") or ""),
        locale=str(scenario.get("locale") or "en"),
        persona_state={
            "mood": float(persona_state.get("mood", 0.5)),
            "difficulty": float(persona_state.get("difficulty", 0.5)),
            "trust": float(persona_state.get("trust", 0.5)),
        },
        scenario=scenario,
        history=history,
    )


def build_scenario_context(scenario: dict[str, Any]) -> dict[str, Any]:
    persona = scenario.get("persona") if isinstance(scenario.get("persona"), dict) else {}
    objectives = persona.get("objectives") if isinstance(persona.get("objectives"), list) else []
    return {
        "persona": persona,
        "objectives": [str(o) for o in objectives],
        "title": scenario.get("title"),
        "locale": scenario.get("locale"),
        "channels": scenario.get("channels"),
        "channel_config": scenario.get("channel_config"),
    }


def voice_id_from_scenario(scenario: dict[str, Any]) -> str | None:
    persona = scenario.get("persona")
    if not isinstance(persona, dict):
        return None
    voice_id = persona.get("voice_id")
    return voice_id.strip() if isinstance(voice_id, str) and voice_id.strip() else None
