"""Pydantic models for Sudar Agents gateway."""

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


AgentTeam = Literal["learner", "admin"]
GoalKind = Literal["week_plan", "remediation", "path_health", "spacing_digest", "custom"]
RunStatus = Literal["running", "completed", "failed"]


class AgentRunRequest(BaseModel):
    """POST /api/agents/runs body."""

    team: AgentTeam
    actor_user_id: str = Field(description="JWT sub initiating the run; must match Bearer for learner_team.")
    org_id: Optional[str] = None
    user_id: Optional[str] = None
    """Learner subject; for learner_team must match actor_user_id when using JWT."""

    goal_kind: GoalKind = "custom"
    goal: Optional[str] = None
    path_id: Optional[str] = None
    force_nba_refresh: bool = False
    policy_pack_id: str = "default"


class AgentRunResponse(BaseModel):
    run_id: str
    team: AgentTeam
    status: RunStatus
    plan: list[dict[str, Any]]
    tool_calls: list[dict[str, Any]]
    artifact: Optional[dict[str, Any]] = None
    error: Optional[str] = None


class AgentRunStreamEvent(BaseModel):
    phase: str
    detail: dict[str, Any] = Field(default_factory=dict)
