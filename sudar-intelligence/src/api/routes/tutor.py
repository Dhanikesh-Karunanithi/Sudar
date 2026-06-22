"""
Sudar Intelligence — AI Tutor Routes
Handles reactive Q&A and proactive nudge generation for "Sudar", the AI tutor.
Uses provider-agnostic AI client (see src.core.ai_client).
All endpoints require Supabase JWT or X-Intelligence-Service-Secret; body.user_id must match JWT sub when JWT is used.
"""
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, field_validator
from src.api.auth import require_learner_match, verify_supabase_jwt_or_service
from src.api.limiter import limiter
from src.runtime.router import ModelRouter, parse_runtime_policy
from src.runtime.schemas import RuntimeRoutingMetadata

router = APIRouter()

MAX_MESSAGE_LENGTH = 2000
MAX_CONTEXT_TEXT_LENGTH = 15000


class TutorQueryRequest(BaseModel):
    user_id: str
    module_id: str
    course_id: str
    message: str
    context_text: str          # The module content for RAG context
    session_history: list[dict] = []  # Last N ai_interactions
    org_settings: dict[str, Any] | None = None

    @field_validator("message")
    @classmethod
    def message_max_length(cls, v: str) -> str:
        if len(v) > MAX_MESSAGE_LENGTH:
            raise ValueError(f"message must be at most {MAX_MESSAGE_LENGTH} characters")
        return v

    @field_validator("context_text")
    @classmethod
    def context_text_max_length(cls, v: str) -> str:
        if len(v) > MAX_CONTEXT_TEXT_LENGTH:
            return v[:MAX_CONTEXT_TEXT_LENGTH]
        return v


class TutorQueryResponse(BaseModel):
    response: str
    confidence: float
    sources_used: list[str]
    suggested_modality_switch: Optional[str] = None
    routing: RuntimeRoutingMetadata


class NudgeRequest(BaseModel):
    user_id: str
    module_id: str
    course_id: str
    trigger: str               # 'inactivity' | 'quiz_fail' | 'low_engagement'
    context_text: str
    failed_quiz_question: Optional[str] = None


class NudgeChoice(BaseModel):
    """Optional multiple-choice replies for LMS clients (tap-to-reply)."""
    id: str
    label: str
    follow_up_message: Optional[str] = None


class NudgeResponse(BaseModel):
    message: str
    action_type: str           # 'explain_differently' | 'suggest_modality' | 'encourage'
    suggested_modality: Optional[str] = None
    choices: Optional[list[NudgeChoice]] = None


@router.post("/query", response_model=TutorQueryResponse)
@limiter.limit("120/minute")
async def tutor_query(
    request: Request,
    body: TutorQueryRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    """
    Handles a learner's question to Sudar (ALP / external LMS path).
    Full RAG + pgvector retrieval runs in Sudar Learn (/api/tutor/query); this route
    forwards a placeholder until Intelligence tutor parity is implemented.
    """
    require_learner_match(request, body.user_id)
    policy = parse_runtime_policy(body.org_settings)
    resolved = await ModelRouter(policy, body.org_settings).resolve("chat")
    # TODO: Implement RAG pipeline
    # 1. Embed the user's question
    # 2. Retrieve relevant chunks from context_text
    # 3. Build prompt with context + session history
    # 4. Call src.core.ai_client.chat_completion() (provider-agnostic)
    # 5. Log to Supabase ai_interactions table
    # 6. Return response

    return TutorQueryResponse(
        response=(
            "I cannot complete that tutor answer from Intelligence yet. "
            "Please retry in Sudar Learn chat, where the full tutor pipeline is currently active."
        ),
        confidence=0.2,
        sources_used=[],
        routing=resolved.routing,
    )


@router.post("/nudge", response_model=NudgeResponse)
@limiter.limit("120/minute")
async def generate_nudge(
    request: Request,
    body: NudgeRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    """
    Generates a proactive nudge from Sudar based on a trigger event.
    Triggers: inactivity (90s), quiz_fail (2x), low_engagement
    """
    require_learner_match(request, body.user_id)
    # TODO: Implement nudge generation logic
    return NudgeResponse(
        message="Looks like you've been on this for a while — want me to explain it differently?",
        action_type="explain_differently",
        choices=[
            NudgeChoice(
                id="hint",
                label="Give me a hint",
                follow_up_message="Give me a short hint on this section.",
            ),
            NudgeChoice(
                id="dismiss",
                label="I'm good",
                follow_up_message="",
            ),
        ],
    )
