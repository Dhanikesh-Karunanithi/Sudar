"""Calls Sudar Learn internal agent-tool endpoints (NBA parity)."""

import os

import httpx


def _learn_base() -> str:
    return (
        os.environ.get("LEARN_INTERNAL_URL")
        or os.environ.get("SUDAR_LEARN_URL")
        or os.environ.get("NEXT_PUBLIC_LEARN_APP_URL")
        or ""
    ).strip().rstrip("/")


def learn_secret_headers() -> dict[str, str]:
    secret = os.environ.get("INTELLIGENCE_SERVICE_SECRET", "").strip()
    h = {"Content-Type": "application/json"}
    if secret:
        h["X-Intelligence-Service-Secret"] = secret
        h["Authorization"] = f"Bearer {secret}"
    return h


async def invoke_next_best_action(user_id: str, force: bool = False) -> dict:
    base = _learn_base()
    secret = os.environ.get("INTELLIGENCE_SERVICE_SECRET", "").strip()
    if not base or not secret:
        return {"error": "LEARN_INTERNAL_URL_and_INTELLIGENCE_SERVICE_SECRET_required"}
    url = f"{base}/api/internal/agent-tools/next-best-action"
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            url,
            headers=learn_secret_headers(),
            json={"user_id": user_id, "force": force},
        )
        try:
            data = r.json()
        except Exception:
            data = {"error": "invalid_json", "status": r.status_code}
        if r.status_code >= 400:
            data.setdefault("status", r.status_code)
        return data
