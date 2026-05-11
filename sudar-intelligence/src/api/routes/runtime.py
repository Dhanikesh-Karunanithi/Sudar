from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from src.api.auth import verify_supabase_jwt_or_service
from src.api.limiter import limiter
from src.runtime.router import ModelRouter, parse_runtime_policy
from src.runtime.schemas import ResolveRuntimeRequest, RuntimeRoutingMetadata

router = APIRouter()


class ResolveRuntimeBody(ResolveRuntimeRequest):
    org_settings: dict[str, Any] | None = None


class ResolveRuntimeResponse(BaseModel):
    success: bool = True
    data: RuntimeRoutingMetadata


@router.post("/resolve", response_model=ResolveRuntimeResponse)
@limiter.limit("60/minute")
async def resolve_runtime(
    request: Request,
    body: ResolveRuntimeBody,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    """Resolves BYOM routing; may probe local providers. Must not be public — body URLs are attacker-controlled."""
    policy = parse_runtime_policy(body.org_settings)
    resolved = await ModelRouter(policy).resolve(body.capability_required)
    return ResolveRuntimeResponse(data=resolved.routing)

