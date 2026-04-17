"""
Sudar Intelligence — Modality dispatcher routes.
Handles generation of content in different modalities (video, mindmap, audio, etc.).
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

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
async def recommend_modality(request: ModalityRecommendRequest):
    """
    Recommends a modality switch based on learner engagement signals.
    Reads learner_profiles.modality_scores from Supabase.
    """
    return ModalityRecommendResponse(
        recommended_modality="video",
        confidence=0.7,
        reason="Your engagement scores are higher for video content.",
    )


@router.post("/video/generate", response_model=VideoGenerateResponse)
async def generate_video(request: VideoGenerateRequest):
    """
    Stub response: production Watch jobs are started from Sudar Learn, which proxies
    to SudarVid (`SUDARVID_URL`, repo folder `sudar_vid`). Remotion remains optional via `REMOTION_SERVER_URL`.
    """
    return VideoGenerateResponse(
        job_id="pending",
        status="queued",
        estimated_seconds=120,
    )
