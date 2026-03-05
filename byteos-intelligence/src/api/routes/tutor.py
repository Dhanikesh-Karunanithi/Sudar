"""
ByteOS Intelligence — AI Tutor Routes
Handles reactive Q&A and proactive nudge generation for "Sudar", the AI tutor.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class TutorQueryRequest(BaseModel):
    user_id: str
    module_id: str
    course_id: str
    message: str
    context_text: str          # The module content for RAG context
    session_history: list[dict] = []  # Last N ai_interactions


class TutorQueryResponse(BaseModel):
    response: str
    confidence: float
    sources_used: list[str]
    suggested_modality_switch: Optional[str] = None


class NudgeRequest(BaseModel):
    user_id: str
    module_id: str
    course_id: str
    trigger: str               # 'inactivity' | 'quiz_fail' | 'low_engagement'
    context_text: str
    failed_quiz_question: Optional[str] = None


class NudgeResponse(BaseModel):
    message: str
    action_type: str           # 'explain_differently' | 'suggest_modality' | 'encourage'
    suggested_modality: Optional[str] = None


@router.post("/query", response_model=TutorQueryResponse)
async def tutor_query(request: TutorQueryRequest):
    """
    Handles a learner's question to Sudar.
    Uses RAG against the current module content.
    Reads recent ai_interactions for longitudinal context.
    """
    # TODO: Implement RAG pipeline
    # 1. Embed the user's question
    # 2. Retrieve relevant chunks from context_text
    # 3. Build prompt with context + session history
    # 4. Call AI provider (Together AI → OpenAI fallback)
    # 5. Log to Supabase ai_interactions table
    # 6. Return response

    return TutorQueryResponse(
        response="I'm still being set up! Check back soon.",
        confidence=1.0,
        sources_used=[],
    )


@router.post("/nudge", response_model=NudgeResponse)
async def generate_nudge(request: NudgeRequest):
    """
    Generates a proactive nudge from Sudar based on a trigger event.
    Triggers: inactivity (90s), quiz_fail (2x), low_engagement
    """
    # TODO: Implement nudge generation logic
    return NudgeResponse(
        message="Looks like you've been on this for a while — want me to explain it differently?",
        action_type="explain_differently",
    )
