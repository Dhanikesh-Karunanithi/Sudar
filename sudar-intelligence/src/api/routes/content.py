"""
Sudar Intelligence — Content Generation Routes
Handles course content generation requests from Sudar Studio.
Uses provider-agnostic AI client (OpenRouter, Together, OpenAI, Anthropic, custom).
"""
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from src.api.limiter import limiter

from src.api.auth import verify_supabase_jwt_or_service
from src.core.ai_client import _get_provider, chat_completion
from src.runtime.router import ModelRouter, parse_runtime_policy
from src.runtime.schemas import RuntimeRoutingMetadata

router = APIRouter()


class ContentGenerateRequest(BaseModel):
    source_text: str = Field(..., max_length=400_000)
    topic: str
    audience: str
    difficulty: str  # 'beginner' | 'intermediate' | 'advanced'
    num_modules: int = 5
    include_quiz: bool = True
    provider: str = "together"  # 'together' | 'openai' | 'anthropic'
    org_settings: dict[str, Any] | None = None
    # BCP-47 / ISO-style language for generated titles and module copy (e.g. en, es, hi-IN).
    language: str = "en"


class ContentGenerateResponse(BaseModel):
    course_title: str
    modules: list[dict]
    generation_time_ms: int
    provider_used: str
    completeness_score: float
    routing: RuntimeRoutingMetadata


@router.post("/generate", response_model=ContentGenerateResponse)
@limiter.limit('30/minute')
async def generate_content(
    request: Request,
    _body: ContentGenerateRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    """
    Legacy Intelligence content route — full course generation runs on Sudar Studio
    and LMS-facing Sudar Create on Learn (`POST /api/alp/create/*`).
    See docs/SUDAR_CREATE_API.md. This endpoint returns a title stub and directs
    callers to Learn ALP Create for module bodies.
    """
    policy = parse_runtime_policy(_body.org_settings)
    router = ModelRouter(policy)
    resolved = await router.resolve("rewrite")
    provider_used = _get_provider()
    lang = (_body.language or "en").strip() or "en"
    if resolved.routing.decision == "local" and resolved.provider:
        try:
            sample = await resolved.provider.chat(
                messages=[
                    {
                        "role": "user",
                        "content": f"Create a concise course title for topic '{_body.topic}' and audience '{_body.audience}'. Write in language/locale: {lang}.",
                    }
                ],
                max_tokens=48,
                temperature=0.2,
            )
            course_title = sample.strip().split("\n")[0][:120] or "Generated Course"
        except Exception:
            course_title = "Generated Course"
    else:
        try:
            chat = await chat_completion(
                messages=[
                    {
                        "role": "user",
                        "content": f"Generate a short course title for: {_body.topic}. Use language/locale: {lang}.",
                    }
                ],
                max_tokens=32,
                temperature=0.2,
            )
            course_title = (chat.get("content") or "").strip()[:120] or "Generated Course"
        except Exception:
            course_title = "Generated Course"

    return ContentGenerateResponse(
        course_title=course_title,
        modules=[],
        generation_time_ms=0,
        provider_used=provider_used,
        completeness_score=0.0,
        routing=resolved.routing,
    )


@router.get("/create-openapi-hint")
async def create_openapi_hint():
    """Points integrators to Sudar Create on Learn (docs/SUDAR_CREATE_API.md)."""
    return {
        "create_api": "POST {LEARN_URL}/api/alp/create/quiz|interactive|flashcards|outline|from-document|media",
        "docs": "docs/SUDAR_CREATE_API.md",
        "delegation": "Use Sudar Learn ALP Create proxies; Studio JWT routes for in-product authoring.",
    }
