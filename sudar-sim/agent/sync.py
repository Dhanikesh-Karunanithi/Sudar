"""Sync voice turns from the agent to Learn BFF."""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)

LEARN_URL = (os.getenv("SUDAR_LEARN_URL") or "http://localhost:3001").rstrip("/")
LEARN_SECRET = os.getenv("SUDAR_LEARN_INTERNAL_SECRET") or os.getenv("SUDAR_SIM_SERVICE_SECRET", "")


def _learn_headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if LEARN_SECRET.strip():
        headers["X-Sudar-Sim-Secret"] = LEARN_SECRET.strip()
    return headers


async def sync_turn(
    session_id: str,
    *,
    learner_text: str | None = None,
    customer_text: str | None = None,
    persona_state: dict[str, float] | None = None,
    channel: str = "phone",
    latency_ms: int | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {"channel": channel}
    if learner_text:
        payload["learner_text"] = learner_text
    if customer_text:
        payload["customer_text"] = customer_text
    if persona_state:
        payload["persona_state"] = persona_state
    if latency_ms is not None:
        payload["latency_ms"] = latency_ms

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{LEARN_URL}/api/sim/session/{session_id}?action=sync_turn",
            headers=_learn_headers(),
            json=payload,
        )
        if not res.is_success:
            logger.warning("sync_turn failed %s: %s", res.status_code, res.text[:200])
            return {"success": False}
        return res.json()


async def emit_voice_event(
    session_id: str,
    event_type: str,
    payload: dict[str, Any] | None = None,
) -> None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        await client.post(
            f"{LEARN_URL}/api/sim/session/{session_id}?action=voice_event",
            headers=_learn_headers(),
            json={"event_type": event_type, "payload": payload or {}},
        )
