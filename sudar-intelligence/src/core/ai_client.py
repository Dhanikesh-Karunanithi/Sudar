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
PROVIDER_HUGGINGFACE = "huggingface"
PROVIDER_SUDAR_PLATFORM = "sudar_platform"

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
    PROVIDER_CUSTOM: "gemma3:4b",
    PROVIDER_HUGGINGFACE: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    PROVIDER_SUDAR_PLATFORM: "auto",
}


def _is_org_platform_ai_feature_enabled() -> bool:
    return os.environ.get("ALLOW_ORG_PLATFORM_AI", "").strip().lower() == "true"


def _is_freellmapi_configured() -> bool:
    return bool(os.environ.get("FREELLMAPI_API_KEY", "").strip())


def _parse_org_ai_platform(settings: Any) -> dict[str, Any]:
    if not isinstance(settings, dict):
        return {"enabled": False, "model": "auto"}
    raw = settings.get("ai_platform")
    if not isinstance(raw, dict):
        return {"enabled": False, "model": "auto"}
    model = raw.get("model")
    return {
        "enabled": raw.get("enabled") is True,
        "model": model.strip() if isinstance(model, str) and model.strip() else "auto",
    }


def _is_org_platform_ai_active(org_settings: Any) -> bool:
    if not _is_org_platform_ai_feature_enabled() or not _is_freellmapi_configured():
        return False
    return _parse_org_ai_platform(org_settings).get("enabled") is True


def _get_freellmapi_config() -> tuple[str, str] | None:
    key = os.environ.get("FREELLMAPI_API_KEY", "").strip()
    if not key:
        return None
    base = os.environ.get("FREELLMAPI_BASE_URL", "http://localhost:3001/v1").strip().rstrip("/")
    return base, key


def _resolve_provider(org_settings: Any | None = None) -> str:
    if _is_org_platform_ai_active(org_settings):
        return PROVIDER_SUDAR_PLATFORM
    return _get_provider()


def _cloud_provider_chain() -> list[str]:
    preferred = (os.environ.get("AI_CHAT_PROVIDER") or "").strip().lower()
    order = [PROVIDER_OPENROUTER, PROVIDER_TOGETHER, PROVIDER_OPENAI, PROVIDER_ANTHROPIC]
    if preferred in order:
        return [preferred] + [p for p in order if p != preferred]
    configured: list[str] = []
    if os.environ.get("OPENROUTER_API_KEY", "").strip():
        configured.append(PROVIDER_OPENROUTER)
    if os.environ.get("TOGETHER_API_KEY", "").strip():
        configured.append(PROVIDER_TOGETHER)
    if os.environ.get("OPENAI_API_KEY", "").strip():
        configured.append(PROVIDER_OPENAI)
    if os.environ.get("ANTHROPIC_API_KEY", "").strip():
        configured.append(PROVIDER_ANTHROPIC)
    return configured


def _get_provider() -> str:
    env = (os.environ.get("AI_CHAT_PROVIDER") or "").strip().lower()
    if env in (
        PROVIDER_OPENROUTER,
        PROVIDER_TOGETHER,
        PROVIDER_OPENAI,
        PROVIDER_ANTHROPIC,
        PROVIDER_CUSTOM,
        PROVIDER_HUGGINGFACE,
    ):
        return env
    if os.environ.get("OPENROUTER_API_KEY", "").strip():
        return PROVIDER_OPENROUTER
    if os.environ.get("TOGETHER_API_KEY", "").strip():
        return PROVIDER_TOGETHER
    if os.environ.get("OPENAI_API_KEY", "").strip():
        return PROVIDER_OPENAI
    if os.environ.get("ANTHROPIC_API_KEY", "").strip():
        return PROVIDER_ANTHROPIC
    if os.environ.get("AI_CHAT_BASE_URL", "").strip():
        return PROVIDER_CUSTOM
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
        key = (
            os.environ.get("AI_CHAT_API_KEY", "").strip()
            or os.environ.get("OPENAI_API_KEY", "").strip()
            or os.environ.get("TOGETHER_API_KEY", "").strip()
        )
        if not base or not key:
            return "Custom/local provider requires AI_CHAT_BASE_URL and AI_CHAT_API_KEY (or OPENAI_API_KEY / TOGETHER_API_KEY). Use any non-empty string for Ollama."
    if p == PROVIDER_HUGGINGFACE and not os.environ.get("HUGGINGFACE_API_KEY", "").strip():
        return "Hugging Face chat requires HUGGINGFACE_API_KEY and AI_CHAT_PROVIDER=huggingface."
    return None


def _get_model(provider: str) -> str:
    if provider == PROVIDER_HUGGINGFACE:
        from src.core.hf_client import hf_chat_model

        return (os.environ.get("AI_CHAT_DEFAULT_MODEL") or "").strip() or hf_chat_model()
    return (os.environ.get("AI_CHAT_DEFAULT_MODEL") or "").strip() or DEFAULT_MODELS.get(provider, "gpt-4o-mini")


async def chat_completion(
    messages: list[dict[str, str]],
    *,
    model: str | None = None,
    max_tokens: int = 1024,
    temperature: float = 0.7,
    org_id: str | None = None,
    org_settings: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Call the configured chat provider. Returns {"content": str, "raw": dict, "provider": str}.
    When org_settings.ai_platform.enabled and FREELLMAPI_* env are set, uses Sudar AI platform tier first.
    """
    _ = org_id
    provider = _resolve_provider(org_settings)
    platform = _parse_org_ai_platform(org_settings) if org_settings else {"enabled": False, "model": "auto"}

    if provider == PROVIDER_SUDAR_PLATFORM:
        cfg = _get_freellmapi_config()
        if cfg:
            base, key = cfg
            platform_model = (model or "").strip() or platform.get("model") or _get_model(PROVIDER_SUDAR_PLATFORM)
            url = base if base.endswith("/chat/completions") else f"{base}/chat/completions"
            try:
                return await _chat_openai_compatible_url(
                    url=url,
                    key=key,
                    messages=messages,
                    model=platform_model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    provider=PROVIDER_SUDAR_PLATFORM,
                )
            except Exception:
                pass

    err = get_chat_config_error()
    if err:
        raise RuntimeError(err)

    last_error: Exception | None = None
    for cloud_provider in _cloud_provider_chain() or [_get_provider()]:
        try:
            resolved_model = (model or "").strip() or _get_model(cloud_provider)
            if cloud_provider == PROVIDER_ANTHROPIC:
                return await _chat_anthropic(messages, model=resolved_model, max_tokens=max_tokens, temperature=temperature)
            if cloud_provider == PROVIDER_HUGGINGFACE:
                from src.core.hf_client import chat_completion_openai_compat

                return await chat_completion_openai_compat(
                    messages,
                    model=resolved_model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
            return await _chat_openai_compatible(
                provider=cloud_provider,
                messages=messages,
                model=resolved_model,
                max_tokens=max_tokens,
                temperature=temperature,
            )
        except Exception as exc:
            last_error = exc

    if last_error:
        raise last_error
    raise RuntimeError("No AI chat provider configured.")


async def _chat_openai_compatible_url(
    *,
    url: str,
    key: str,
    messages: list[dict[str, str]],
    model: str,
    max_tokens: int,
    temperature: float,
    provider: str,
) -> dict[str, Any]:
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

    usage = _parse_openai_compatible_usage(data.get("usage"))
    return {
        "content": content,
        "raw": data,
        "provider": provider,
        "model": model,
        "usage": usage,
    }


async def _chat_openai_compatible(
    provider: str,
    messages: list[dict[str, str]],
    model: str,
    max_tokens: int,
    temperature: float,
) -> dict[str, Any]:
    if provider == PROVIDER_SUDAR_PLATFORM:
        cfg = _get_freellmapi_config()
        if not cfg:
            raise RuntimeError("FREELLMAPI_API_KEY not set")
        base, key = cfg
        url = base if base.endswith("/chat/completions") else f"{base}/chat/completions"
        return await _chat_openai_compatible_url(
            url=url,
            key=key,
            messages=messages,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            provider=provider,
        )
    if provider == PROVIDER_OPENROUTER:
        url = OPENROUTER_URL
        key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    elif provider == PROVIDER_TOGETHER:
        url = TOGETHER_URL
        key = os.environ.get("TOGETHER_API_KEY", "").strip()
    elif provider == PROVIDER_CUSTOM:
        base = os.environ.get("AI_CHAT_BASE_URL", "").strip().rstrip("/")
        url = f"{base}/v1/chat/completions" if "/v1/" not in base else base
        key = (
            os.environ.get("AI_CHAT_API_KEY", "").strip()
            or os.environ.get("OPENAI_API_KEY", "").strip()
            or os.environ.get("TOGETHER_API_KEY", "").strip()
        )
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

    usage = _parse_openai_compatible_usage(data.get("usage"))
    return {
        "content": content,
        "raw": data,
        "provider": provider,
        "model": model,
        "usage": usage,
    }


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

    usage = _parse_anthropic_usage(data.get("usage"))
    return {
        "content": content,
        "raw": data,
        "provider": PROVIDER_ANTHROPIC,
        "model": model,
        "usage": usage,
    }


def _parse_openai_compatible_usage(raw: Any) -> dict[str, int] | None:
    if not isinstance(raw, dict):
        return None
    prompt = raw.get("prompt_tokens")
    completion = raw.get("completion_tokens")
    if not isinstance(prompt, (int, float)) and not isinstance(completion, (int, float)):
        return None
    p = int(prompt or 0)
    c = int(completion or 0)
    cached = 0
    details = raw.get("prompt_tokens_details")
    if isinstance(details, dict) and isinstance(details.get("cached_tokens"), (int, float)):
        cached = int(details["cached_tokens"])
    total = int(raw.get("total_tokens") or (p + c))
    return {
        "prompt_tokens": p,
        "completion_tokens": c,
        "cached_tokens": cached,
        "total_tokens": total,
    }


def _parse_anthropic_usage(raw: Any) -> dict[str, int] | None:
    if not isinstance(raw, dict):
        return None
    inp = raw.get("input_tokens")
    out = raw.get("output_tokens")
    if not isinstance(inp, (int, float)) and not isinstance(out, (int, float)):
        return None
    cache_read = int(raw.get("cache_read_input_tokens") or 0)
    cache_create = int(raw.get("cache_creation_input_tokens") or 0)
    p = int(inp or 0) + cache_create
    c = int(out or 0)
    return {
        "prompt_tokens": p,
        "completion_tokens": c,
        "cached_tokens": cache_read,
        "total_tokens": p + c,
    }
