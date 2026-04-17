"""
ByteOS Intelligence — Learner Profile Routes
Handles Digital Learner Twin updates and Next Best Action computation.
All endpoints require Supabase JWT or X-Intelligence-Service-Secret; body.user_id must match JWT sub when JWT is used.

**Canonical twin rollups (modality affinity, engagement aggregates)** are implemented in **Sudar Learn**:
`POST /api/learner/twin-rollup` (see sudar-learn). These Python routes remain for ALP contracts
and future consolidation; production Learn does not depend on them for rollups or course NBA.
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, field_validator
from src.api.auth import require_learner_match, verify_supabase_jwt_or_service
from src.api.limiter import limiter

router = APIRouter()


class ProfileUpdateRequest(BaseModel):
    user_id: str
    session_events: list[dict]  # learning_events from the session


class ProfileUpdateResponse(BaseModel):
    modality_scores_updated: dict
    engagement_score: float
    streak_days: int


class NextActionRequest(BaseModel):
    user_id: str
    current_enrollment_ids: list[str]

    @field_validator("current_enrollment_ids")
    @classmethod
    def enrollment_ids_max(cls, v: list[str]) -> list[str]:
        if len(v) > 500:
            raise ValueError("current_enrollment_ids must have at most 500 items")
        return v


class NextActionResponse(BaseModel):
    action_type: str   # 'continue_course' | 'start_new' | 'try_modality' | 'review_skill'
    target_id: str
    reason: str
    confidence: float


class AnalyticsNextActionRequest(BaseModel):
    user_id: str
    focus_ratio: float
    drop_off_count_14d: int = 0
    completed_modules_14d: int = 0
    quiz_attempts_14d: int = 0


class AnalyticsNextActionResponse(BaseModel):
    action_type: str
    target: dict
    recommended_duration_mins: int
    reason: str
    confidence: float


@router.post("/profile", response_model=ProfileUpdateResponse)
async def update_learner_profile(
    request: Request,
    body: ProfileUpdateRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    """
    Processes session events and updates the Digital Learner Twin.
    Called at end of each learning session from sudar-learn.
    Updates: modality_scores, engagement_score, streak_days in Supabase.
    """
    require_learner_match(request, body.user_id)
    # TODO: Implement adaptive scoring algorithm
    # 1. Parse session_events
    # 2. Compute modality engagement scores (time, completion, replay rates)
    # 3. Update learner_profiles in Supabase
    # 4. Trigger skill gap analysis if quiz events present

    return ProfileUpdateResponse(
        modality_scores_updated={},
        engagement_score=0.5,
        streak_days=1,
    )


@router.post("/next-action", response_model=NextActionResponse)
@limiter.limit("60/minute")
async def compute_next_action(
    request: Request,
    body: NextActionRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    """
    Computes the learner's Next Best Action.
    Reads learner_profiles, enrollments, skill_gaps from Supabase.
    """
    require_learner_match(request, body.user_id)
    # TODO: Implement Next Best Action algorithm
    return NextActionResponse(
        action_type="continue_course",
        target_id="",
        reason="You're making great progress — keep going!",
        confidence=0.8,
    )


@router.post("/next-action-analytics", response_model=AnalyticsNextActionResponse)
@limiter.limit("90/minute")
async def compute_next_action_analytics(
    request: Request,
    body: AnalyticsNextActionRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    """
    Rule + score NBA response for analytics-driven recommendations.
    The Learn API can call this endpoint using aggregated rollup features.
    """
    require_learner_match(request, body.user_id)

    action_type = "continue_module"
    reason = "Keep building momentum with your current module."
    duration = 20
    confidence = 0.72

    if body.focus_ratio < 0.45:
        action_type = "recovery_session"
        reason = "A shorter focused session can help rebuild momentum."
        duration = 12
        confidence = 0.84
    elif body.drop_off_count_14d >= 3:
        action_type = "switch_modality"
        reason = "Switching modality can reduce drop-off and improve completion."
        duration = 15
        confidence = 0.81
    elif body.quiz_attempts_14d >= 4 and body.completed_modules_14d < 2:
        action_type = "retry_quiz"
        reason = "A guided retry can lock in key concepts before moving on."
        duration = 18
        confidence = 0.76
    elif body.completed_modules_14d >= 4:
        action_type = "continue_module"
        reason = "Your consistency is strong — continue with the next module."
        duration = 28
        confidence = 0.78

    return AnalyticsNextActionResponse(
        action_type=action_type,
        target={},
        recommended_duration_mins=duration,
        reason=reason,
        confidence=confidence,
    )
