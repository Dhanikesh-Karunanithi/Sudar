from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.core.ai_client import PROVIDER_HUGGINGFACE, _get_provider, get_chat_config_error
from src.core.hf_client import hf_api_key

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class HfChatSmokeResponse(BaseModel):
    ok: bool
    provider: str
    preview: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="Sudar Intelligence",
        version="1.0.0",
    )


@router.get("/health/hf-chat", response_model=HfChatSmokeResponse)
async def hf_chat_smoke():
    """Smoke-test Hugging Face chat when AI_CHAT_PROVIDER=huggingface."""
    if _get_provider() != PROVIDER_HUGGINGFACE:
        raise HTTPException(
            status_code=400,
            detail="Set AI_CHAT_PROVIDER=huggingface to use this endpoint.",
        )
    err = get_chat_config_error()
    if err:
        raise HTTPException(status_code=503, detail=err)
    if not hf_api_key():
        raise HTTPException(status_code=503, detail="HUGGINGFACE_API_KEY not configured")

    from src.core.hf_client import chat_completion_openai_compat

    result = await chat_completion_openai_compat(
        [{"role": "user", "content": "Reply with exactly: Sudar HF OK"}],
        max_tokens=32,
        temperature=0,
    )
    preview = (result.get("content") or "").strip()[:200]
    return HfChatSmokeResponse(ok=bool(preview), provider="huggingface", preview=preview)
