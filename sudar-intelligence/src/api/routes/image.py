"""
Sudar Intelligence — image generation via Together AI (FLUX) or Hugging Face Inference.
Set IMAGE_PROVIDER=together|huggingface. Requires TOGETHER_API_KEY or HUGGINGFACE_API_KEY.
"""
import os
from typing import Annotated, Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.api.auth import verify_supabase_jwt_or_service
from src.core.hf_client import generate_image_bytes, image_provider

router = APIRouter()

TOGETHER_IMAGE_URL = "https://api.together.xyz/v1/images/generations"


class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., max_length=2000)
    model: str = "black-forest-labs/FLUX.1-schnell-Free"
    language: str | None = None
    culture_context: str | None = None
    style: str | None = None


def _build_prompt(body: ImageGenerateRequest) -> str:
    parts: list[str] = []
    if body.language:
        parts.append(f"Locale: {body.language}.")
    if body.culture_context:
        parts.append(str(body.culture_context).strip())
    if body.style:
        parts.append(f"Style: {body.style}.")
    parts.append(body.prompt.strip())
    return " ".join(p for p in parts if p)[:2000]


async def _generate_together(full_prompt: str, model: str) -> dict[str, Any]:
    key = os.environ.get("TOGETHER_API_KEY", "").strip()
    if not key:
        raise HTTPException(status_code=501, detail="TOGETHER_API_KEY not configured")

    payload: dict[str, Any] = {
        "model": model.strip() or "black-forest-labs/FLUX.1-schnell-Free",
        "prompt": full_prompt,
        "n": 1,
        "response_format": "b64_json",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            TOGETHER_IMAGE_URL,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json=payload,
        )
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=r.text or "Together image request failed")

    data = r.json()
    items = data.get("data") or []
    if not items:
        raise HTTPException(status_code=502, detail="Together returned no image data")

    first = items[0] if isinstance(items[0], dict) else {}
    return {
        "b64_json": first.get("b64_json"),
        "url": first.get("url"),
        "model": payload["model"],
    }


@router.post("/generate")
async def generate_image(
    body: ImageGenerateRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    full_prompt = _build_prompt(body)
    provider = image_provider()

    if provider == "huggingface":
        try:
            result = await generate_image_bytes(full_prompt, model=body.model)
            return result
        except RuntimeError as e:
            raise HTTPException(status_code=502, detail=str(e)) from e

    model = body.model.strip() or "black-forest-labs/FLUX.1-schnell-Free"
    return await _generate_together(full_prompt, model)
