"""
Sudar Agents gateway — task-oriented runs (learner + admin teams).
Auth: Supabase JWT (preferred) or X-Intelligence-Service-Secret for learner_team only.
"""

import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from src.api.agent_auth import verify_org_staff
from src.api.auth import require_learner_match, verify_supabase_jwt_or_service
from src.api.limiter import limiter
from src.agents.orchestrator import execute_run, stream_run_events
from src.agents.schemas import AgentRunRequest, AgentRunResponse

router = APIRouter()


def _normalize_request(request: Request, body: AgentRunRequest) -> AgentRunRequest:
    if body.team == "learner":
        require_learner_match(request, body.actor_user_id)
        uid = body.user_id or body.actor_user_id
        if body.user_id and body.user_id != body.actor_user_id:
            raise HTTPException(status_code=403, detail="user_id must match actor_user_id for learner_team")
        return body.model_copy(update={"user_id": uid})

    if body.team == "admin":
        if getattr(request.state, "auth_method", None) == "service":
            raise HTTPException(
                status_code=403,
                detail="admin_team runs require an end-user JWT (not service secret alone)",
            )
        if not body.org_id:
            raise HTTPException(status_code=400, detail="org_id required for admin_team")
        auth_uid = getattr(request.state, "auth_user_id", None)
        if auth_uid and auth_uid != body.actor_user_id:
            raise HTTPException(status_code=403, detail="actor_user_id must match JWT sub")
        if not verify_org_staff(body.actor_user_id, body.org_id):
            raise HTTPException(status_code=403, detail="requires org admin or manager")
        return body

    raise HTTPException(status_code=400, detail="invalid team")


class AgentSkillsResponse(BaseModel):
    """Catalog of v1 logical tools for ALP / integrators."""

    tools: list[dict]


@router.post("/runs", response_model=AgentRunResponse)
@limiter.limit("60/minute")
async def post_agent_run(
    request: Request,
    body: AgentRunRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    normalized = _normalize_request(request, body)
    return await execute_run(normalized)


@router.post("/runs/stream")
@limiter.limit("30/minute")
async def post_agent_run_stream(
    request: Request,
    body: AgentRunRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    normalized = _normalize_request(request, body)

    async def gen():
        async for line in stream_run_events(normalized):
            yield line

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.get("/skills")
@limiter.limit("120/minute")
async def list_skills(
    request: Request,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    return AgentSkillsResponse(
        tools=[
            {
                "id": "get_twin_snapshot",
                "team_allow": ["learner"],
                "description": "Read anonymized-ish twin signals (goals/struggles summary).",
            },
            {
                "id": "get_recent_learning_events",
                "team_allow": ["learner"],
                "description": "Recent telemetry tail for pacing and modality hints.",
            },
            {
                "id": "compute_next_best_action_via_learn",
                "team_allow": ["learner"],
                "description": "Delegates NBA scoring to Sudar Learn (canonical implementation).",
            },
            {
                "id": "get_path_rollups",
                "team_allow": ["admin"],
                "description": "Path enrollment + progress aggregates for org.",
            },
            {
                "id": "get_org_risk_snippets",
                "team_allow": ["admin"],
                "description": "Latest analytics_risk_signals lines for humane cohort pulse.",
            },
        ]
    )


@router.get("/alp-openapi.json")
async def alp_agent_descriptor():
    """
    Lightweight OpenAPI-ish descriptor for LMS integrators (ALP hook).
    """
    return {
        "service": "SudarAgents",
        "runs_post": "/api/agents/runs",
        "runs_stream_post": "/api/agents/runs/stream",
        "skills_get": "/api/agents/skills",
        "auth_note": "Authorization: Bearer Supabase JWT; admin_team rejects service-only auth.",
    }
