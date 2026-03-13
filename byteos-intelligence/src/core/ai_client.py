"""
Provider-agnostic chat client for Sudar Intelligence.
Uses AI_CHAT_PROVIDER and corresponding env keys (OpenRouter, Together, OpenAI, Anthropic, custom).
Fallback order when AI_CHAT_PROVIDER unset: OpenRouter → Together → OpenAI → Anthropic.
"""
import os
from typing import Any

import httpx

# Provider ids (env: AI_CHAT_PROVIDER)
PROVIDER_OPENROUTER = "openrouter"
PROVIDER_TOGETHER = "together"
PROVIDER_OPENAI = "openai"
PROVIDER_ANTHROPIC = "anthropic"
PROVIDER_CUSTOM = "custom"

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
TOGETHER_URL = "https://api.together.xyz/v1/chat/completions"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

# Default models per provider (overridable via AI_CHAT_DEFAULT_MODEL)
DEFAULT_MODELS = {
    PROVIDER_OPENROUTER: "openai/gpt-4o-mini",
    PROVIDER_TOGETHER: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    PROVIDER_OPENAI: "gpt-4o-mini",
    PROVIDER_ANTHROPIC: "claude-3-5-sonnet-20241022",
    PROVIDER_CUSTOM: "gpt-4o-mini",
}


def _get_provider() -> str:
    env = (os.environ.get("AI_CHAT_PROVIDER") or "").strip().lower()
    if env in (PROVIDER_OPENROUTER, PROVIDER_TOGETHER, PROVIDER_OPENAI, PROVIDER_ANTHROPIC, PROVIDER_CUSTOM):
        return env
    if os.environ.get("OPENROUTER_API_KEY", "").strip():
        return PROVIDER_OPENROUTER
    if os.environ.get("TOGETHER_API_KEY", "").strip():
        return PROVIDER_TOGETHER
    if os.environ.get("OPENAI_API_KEY", "").strip():
        return PROVIDER_OPENAI
    if os.environ.get("ANTHROPIC_API_KEY", "").strip():
        return PROVIDER_ANTHROPIC
    return PROVIDER_TOGETHER


def get_chat_config_error() -> str | None:
    """Returns an error message if no provider is configured, else None."""
    p = _get_provider()
    if p == PROVIDER_OPENROUTER and not os.environ.get("OPENROUTER_API_KEY", "").strip():
        return "No AI chat provider configured. Set AI_CHAT_PROVIDER and one of OPENROUTER_API_KEY, TOGETHER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY."
    if p == PROVIDER_TOGETHER and not os.environ.get("TOGETHER_API_KEY", "").strip():
        return "No AI chat provider configured. Set AI_CHAT_PROVIDER and one of OPENROUTER_API_KEY, TOGETHER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY."
    if p == PROVIDER_OPENAI and not os.environ.get("OPENAI_API_KEY", "").strip():
        return "No AI chat provider configured. Set AI_CHAT_PROVIDER and one of OPENROUTER_API_KEY, TOGETHER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY."
    if p == PROVIDER_ANTHROPIC and not os.environ.get("ANTHROPIC_API_KEY", "").strip():
        return "No AI chat provider configured. Set AI_CHAT_PROVIDER and one of OPENROUTER_API_KEY, TOGETHER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY."
    if p == PROVIDER_CUSTOM:
        base = os.environ.get("AI_CHAT_BASE_URL", "").strip()
        key = os.environ.get("OPENAI_API_KEY", "").strip() or os.environ.get("TOGETHER_API_KEY", "").strip()
        if not base or not key:
            return "Custom provider requires AI_CHAT_BASE_URL and an API key."
    return None


def _get_model(provider: str) -> str:
    return (os.environ.get("AI_CHAT_DEFAULT_MODEL") or "").strip() or DEFAULT_MODELS.get(provider, "gpt-4o-mini")


async def chat_completion(
    messages: list[dict[str, str]],
    *,
    model: str | None = None,
    max_tokens: int = 1024,
    temperature: float = 0.7,
    org_id: str | None = None,
) -> dict[str, Any]:
    """
    Call the configured chat provider. Returns {"content": str, "raw": dict, "provider": str}.
    org_id reserved for future per-org encrypted keys.
    """
    provider = _get_provider()
    err = get_chat_config_error()
    if err:
        raise RuntimeError(err)

    model = (model or "").strip() or _get_model(provider)

    if provider == PROVIDER_ANTHROPIC:
        return await _chat_anthropic(messages, model=model, max_tokens=max_tokens, temperature=temperature)
    # OpenAI-compatible: OpenRouter, Together, OpenAI, custom
    return await _chat_openai_compatible(
        provider=provider,
        messages=messages,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
    )


async def _chat_openai_compatible(
    provider: str,
    messages: list[dict[str, str]],
    model: str,
    max_tokens: int,
    temperature: float,
) -> dict[str, Any]:
    if provider == PROVIDER_OPENROUTER:
        url = OPENROUTER_URL
        key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    elif provider == PROVIDER_TOGETHER:
        url = TOGETHER_URL
        key = os.environ.get("TOGETHER_API_KEY", "").strip()
    elif provider == PROVIDER_CUSTOM:
        base = os.environ.get("AI_CHAT_BASE_URL", "").strip().rstrip("/")
        url = f"{base}/v1/chat/completions" if "/v1/" not in base else base
        key = os.environ.get("OPENAI_API_KEY", "").strip() or os.environ.get("TOGETHER_API_KEY", "").strip()
    else:
        url = OPENAI_URL
        key = os.environ.get("OPENAI_API_KEY", "").strip()

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        r.raise_for_status()
        data = r.json()

    content = ""
    if isinstance(data.get("choices"), list) and data["choices"]:
        msg = data["choices"][0].get("message") or {}
        content = (msg.get("content") or "").strip()

    return {"content": content, "raw": data, "provider": provider}


async def _chat_anthropic(
    messages: list[dict[str, str]],
    model: str,
    max_tokens: int,
    temperature: float,
) -> dict[str, Any]:
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    # Convert to Anthropic format: system (optional) + messages (user/assistant)
    system = ""
    anthropic_messages: list[dict[str, str]] = []
    for m in messages:
        role = (m.get("role") or "user").lower()
        text = (m.get("content") or "").strip()
        if role == "system":
            system = text
        elif role in ("user", "assistant"):
            anthropic_messages.append({"role": role, "content": text})

    payload: dict[str, Any] = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": anthropic_messages,
    }
    if system:
        payload["system"] = system

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            ANTHROPIC_URL,
            headers={
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        r.raise_for_status()
        data = r.json()

    content = ""
    for block in (data.get("content") or []):
        if block.get("type") == "text":
            content += (block.get("text") or "").strip()
    content = content.strip()

    return {"content": content, "raw": data, "provider": PROVIDER_ANTHROPIC}
