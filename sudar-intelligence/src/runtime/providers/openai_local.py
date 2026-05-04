from __future__ import annotations

import os
from typing import Any

import httpx

from src.runtime.providers.base import ProviderHealth, RuntimeProviderError, ensure_openai_local_type
from src.runtime.schemas import RuntimeProviderConfig


class OpenAiCompatibleLocalProvider:
    def __init__(self, config: RuntimeProviderConfig):
        ensure_openai_local_type(config)
        self.config = config

    def _resolve_url(self) -> str:
        base = self.config.base_url.rstrip("/")
        return f"{base}/chat/completions" if base.endswith("/v1") else f"{base}/v1/chat/completions"

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.config.auth_mode == "bearer":
            token = (os.getenv("LOCAL_LLM_BEARER_TOKEN") or os.getenv("AI_CHAT_API_KEY") or "").strip()
            if not token:
                raise RuntimeProviderError(
                    "LOCAL_PROVIDER_UNREACHABLE",
                    "Bearer auth required but LOCAL_LLM_BEARER_TOKEN/AI_CHAT_API_KEY is missing.",
                )
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def health_check(self) -> ProviderHealth:
        url = self._resolve_url()
        payload = {
            "model": self.config.model,
            "messages": [{"role": "user", "content": "Reply with exactly: ok"}],
            "max_tokens": 8,
            "temperature": 0,
        }
        timeout = max(self.config.timeout_ms / 1000.0, 2.0)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                r = await client.post(url, headers=self._headers(), json=payload)
                body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
                if r.status_code >= 400:
                    return ProviderHealth(ok=False, code="LOCAL_PROVIDER_UNREACHABLE", message=f"{r.status_code}: {str(body)[:200]}")
                content = (
                    (((body.get("choices") or [{}])[0].get("message") or {}).get("content") or "").strip().lower()
                    if isinstance(body, dict)
                    else ""
                )
                return ProviderHealth(ok=True, code="ok", message=content or "ok")
        except Exception as exc:  # pragma: no cover - exercised via integration
            return ProviderHealth(ok=False, code="LOCAL_PROVIDER_UNREACHABLE", message=str(exc)[:200])

    async def chat(
        self,
        *,
        messages: list[dict[str, str]],
        max_tokens: int,
        temperature: float,
    ) -> str:
        url = self._resolve_url()
        payload: dict[str, Any] = {
            "model": self.config.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        timeout = max(self.config.timeout_ms / 1000.0, 2.0)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                r = await client.post(url, headers=self._headers(), json=payload)
                r.raise_for_status()
                data = r.json()
            content = (((data.get("choices") or [{}])[0].get("message") or {}).get("content") or "").strip()
            if not content:
                raise RuntimeProviderError("LOCAL_PROVIDER_UNREACHABLE", "Local provider returned empty response.")
            return content
        except RuntimeProviderError:
            raise
        except Exception as exc:
            raise RuntimeProviderError("LOCAL_PROVIDER_UNREACHABLE", str(exc)[:240]) from exc

