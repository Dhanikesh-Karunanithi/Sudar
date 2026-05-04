from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from src.runtime.router import ModelRouter, parse_runtime_policy
from src.runtime.schemas import ResolveRuntimeRequest, RuntimeRoutingMetadata

router = APIRouter()


class ResolveRuntimeBody(ResolveRuntimeRequest):
    org_settings: dict[str, Any] | None = None


class ResolveRuntimeResponse(BaseModel):
    success: bool = True
    data: RuntimeRoutingMetadata


@router.post("/resolve", response_model=ResolveRuntimeResponse)
async def resolve_runtime(body: ResolveRuntimeBody):
    policy = parse_runtime_policy(body.org_settings)
    resolved = await ModelRouter(policy).resolve(body.capability_required)
    return ResolveRuntimeResponse(data=resolved.routing)

