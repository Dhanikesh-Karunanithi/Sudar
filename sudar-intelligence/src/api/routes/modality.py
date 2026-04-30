"""
Sudar Intelligence — Modality dispatcher routes.
Handles generation of content in different modalities (video, mindmap, audio, etc.).
All routes require Supabase JWT or X-Intelligence-Service-Secret (see auth.py).
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from src.api.auth import require_learner_match, verify_supabase_jwt_or_service

router = APIRouter()


class ModalityRecommendRequest(BaseModel):
    user_id: str
    module_id: str
    current_modality: str


class ModalityRecommendResponse(BaseModel):
    recommended_modality: str
    confidence: float
    reason: str


class VideoGenerateRequest(BaseModel):
    module_id: str
    content: dict        # Module content object
    voice: str = "en-US-GuyNeural"


class VideoGenerateResponse(BaseModel):
    job_id: str
    status: str          # 'queued' | 'processing' | 'complete' | 'failed'
    estimated_seconds: int


@router.post("/recommend", response_model=ModalityRecommendResponse)
async def recommend_modality(
    req: Request,
    body: ModalityRecommendRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    """
    Reserved for affinity-driven modality switching. Canonical behaviour today
    lives in Sudar Learn (twin rollups / UX); this endpoint returns 501 until wired.
    """
    require_learner_match(req, body.user_id)
    raise HTTPException(
        status_code=501,
        detail="Not implemented: use Sudar Learn for modality-aware recommendations.",
    )


@router.post("/video/generate", response_model=VideoGenerateResponse)
async def generate_video(
    _req: Request,
    _body: VideoGenerateRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    """
    Stub response: production Watch jobs are started from Sudar Learn, which proxies
    to SudarVid (`SUDARVID_URL`, repo folder `sudar_vid`). Remotion remains optional via `REMOTION_SERVER_URL`.
    """
    return VideoGenerateResponse(
        job_id="pending",
        status="queued",
        estimated_seconds=120,
    )
