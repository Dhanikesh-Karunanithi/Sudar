"""Sudar Agents orchestrator (plans + bounded tool traces)."""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Callable

from src.agents.learn_client import invoke_next_best_action
from src.agents.policy_packs import load_policy_pack
from src.agents.schemas import AgentRunRequest, AgentRunResponse
from src.agents.tools import (
    tool_get_org_risk_snippets,
    tool_get_path_rollups,
    tool_get_recent_learning_events,
    tool_get_twin_snapshot,
)
from src.api.agent_auth import create_service_supabase, learner_org_id


async def run_in_thread(fn: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
    return await asyncio.to_thread(lambda: fn(*args, **kwargs))


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


async def persist_run_row(row: dict[str, Any]) -> None:

    async def ins() -> None:
        sb = create_service_supabase()
        if sb and row.get("org_id"):
            await run_in_thread(lambda: sb.table("agent_runs").insert(row).execute())

    try:
        await ins()
    except Exception:
        pass


async def execute_run(req: AgentRunRequest) -> AgentRunResponse:
    run_id = str(uuid.uuid4())
    policy = await run_in_thread(load_policy_pack, req.policy_pack_id)
    plan_steps: list[dict[str, Any]] = [{"step": "load_policy_pack", "pack_id": req.policy_pack_id}]
    tools_log: list[dict[str, Any]] = []

    subject = req.user_id or req.actor_user_id
    org_for_row = req.org_id or learner_org_id(subject) or ""

    try:
        if req.team == "learner":
            artifact = await _run_learner_team(req.goal_kind, subject, req, policy, plan_steps, tools_log)
            subj = subject
        else:
            if not req.org_id:
                raise ValueError("org_id required for admin_team runs")
            artifact = await _run_admin_team(req.goal_kind, req, policy, plan_steps, tools_log)
            subj = None

        row = {
            "id": run_id,
            "org_id": org_for_row,
            "actor_user_id": req.actor_user_id,
            "subject_user_id": subj,
            "team": req.team,
            "goal": req.goal or req.goal_kind,
            "goal_kind": req.goal_kind,
            "status": "completed",
            "plan": plan_steps,
            "tool_calls": tools_log,
            "artifact": artifact,
            "policy_pack_id": req.policy_pack_id,
            "completed_at": now_iso(),
        }
        await persist_run_row(row)

        return AgentRunResponse(
            run_id=run_id,
            team=req.team,
            status="completed",
            plan=plan_steps,
            tool_calls=tools_log,
            artifact=artifact,
        )
    except Exception as e:
        err = str(e)
        row = {
            "id": run_id,
            "org_id": org_for_row,
            "actor_user_id": req.actor_user_id,
            "subject_user_id": subject if req.team == "learner" else None,
            "team": req.team,
            "goal": req.goal or req.goal_kind,
            "goal_kind": req.goal_kind,
            "status": "failed",
            "plan": plan_steps,
            "tool_calls": tools_log,
            "artifact": None,
            "policy_pack_id": req.policy_pack_id,
            "error": err[:2000],
            "completed_at": now_iso(),
        }
        await persist_run_row(row)
        return AgentRunResponse(
            run_id=run_id,
            team=req.team,
            status="failed",
            plan=plan_steps,
            tool_calls=tools_log,
            artifact=None,
            error=err[:500],
        )


async def stream_run_events(req: AgentRunRequest) -> AsyncGenerator[str, None]:
    """SSE-style lines: Server-Sent Events `data:` JSON payloads."""

    async def emit(phase: str, detail: dict[str, Any] | None = None):
        chunk = {"phase": phase, "detail": detail or {}}
        yield f"data: {json.dumps(chunk)}\n\n"

    async for line in emit("start", {"goal_kind": req.goal_kind, "team": req.team}):
        yield line

    res = await execute_run(req)

    async for line in emit("final", {"response": res.model_dump()}):
        yield line


async def _run_learner_team(
    goal_kind: str,
    user_id: str,
    req: AgentRunRequest,
    policy: dict[str, Any],
    plan_steps: list[dict[str, Any]],
    tools_log: list[dict[str, Any]],
) -> dict[str, Any]:
    week_cfg = policy.get("week_plan") or {}
    default_mins = int(week_cfg.get("default_session_minutes_fallback") or 20)

    twin = await run_in_thread(tool_get_twin_snapshot, user_id)
    tools_log.append({"tool": "get_twin_snapshot", "ok": True, "snippet_count": len(twin.get("summary_snippets") or [])})
    plan_steps.append({"step": "gather_twin", "signals": twin.get("summary_snippets") or []})

    ev = await run_in_thread(tool_get_recent_learning_events, user_id)
    tools_log.append({"tool": "get_recent_learning_events", "n": len(ev.get("events") or [])})
    plan_steps.append({"step": "recent_events", "condensed_head": (ev.get("condensed") or [])[:8]})

    nba_payload = await invoke_next_best_action(user_id, req.force_nba_refresh)
    tools_log.append({"tool": "compute_next_best_action_via_learn", "ok": "error" not in nba_payload})
    plan_steps.append({"step": "next_best_action", "payload_preview": _nba_preview(nba_payload)})

    rm = policy.get("remediation") or {}
    drop_thr = int(rm.get("suggest_modality_when_dropoffs_14d_gte") or 3)
    modality_hint = _modality_hint_from_events(ev.get("events") or [], drop_thr)

    goal_line = []
    goal_line.append("Short sprint based on your recent activity and Sudar profile signals.")
    if twin.get("summary_snippets"):
        goal_line.extend(twin["summary_snippets"][:3])
    nba_sentence = ""
    if isinstance(nba_payload, dict):
        action = nba_payload.get("action")
        if isinstance(action, dict) and action.get("reason"):
            nba_sentence = action["reason"]
        elif isinstance(action, dict) and action.get("course_title"):
            nba_sentence = f"Sudar recommends exploring: {action.get('course_title')}"
        if nba_payload.get("skipped"):
            goal_line.append(f"(NBA status: {nba_payload.get('skipped')})")
    if modality_hint:
        goal_line.append(modality_hint)

    artifact = {
        "headline": "Your learning plan from Sudar",
        "sessions": [
            {
                "day": "Today",
                "minutes": default_mins,
                "focus": nba_sentence or "Continue your path with one focused micro-session.",
                "actions": ["Open your next enrolled module.", "Ask Sudar for a quick recap if needed."],
            }
        ],
        "goal_line": goal_line,
        "modality_tip": modality_hint,
        "next_best_action_preview": _nba_preview(nba_payload),
    }

    return artifact


async def _run_admin_team(
    goal_kind: str,
    req: AgentRunRequest,
    policy: dict[str, Any],
    plan_steps: list[dict[str, Any]],
    tools_log: list[dict[str, Any]],
) -> dict[str, Any]:
    oid = req.org_id or ""

    rollup = await run_in_thread(tool_get_path_rollups, oid, req.path_id)
    tools_log.append({"tool": "get_path_rollups", "paths": rollup.get("paths_reviewed")})
    plan_steps.append({"step": "path_rollups", "summary_tail": rollup.get("summaries", [])[-3:]})

    risks = await run_in_thread(tool_get_org_risk_snippets, oid, 18)
    tools_log.append({"tool": "get_org_risk_snippets", "rows": risks.get("risk_rows")})
    plan_steps.append({"step": "risk_snippets", "lines": risks.get("lines") or []})

    bullets = []
    for s in rollup.get("summaries") or []:
        avg = s.get("avg_progress_pct", 0)
        title = s.get("title") or "Path"
        bullets.append(f"{title}: avg progress ~{avg}%, enrollment {s.get('enrollment_n', 0)}")

    if risks.get("lines"):
        bullets.append("Risk signals:")
        bullets.extend(("• " + L for L in (risks.get("lines") or [])[:5]))

    artifact = {
        "headline": "Path and cohort pulse",
        "bullets": bullets[:16],
        "policy_pack_hint": policy.get("display_name") or req.policy_pack_id,
    }
    return artifact


def _nba_preview(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        return {}
    if payload.get("error"):
        return {"error": payload.get("error"), "status": payload.get("status")}
    prev: dict[str, Any] = {"skipped": payload.get("skipped")}
    act = payload.get("action")
    if isinstance(act, dict):
        prev["course_title"] = act.get("course_title") or act.get("title")
        prev["confidence"] = act.get("confidence")
        prev["recommended_duration_mins"] = act.get("recommended_duration_mins")
        prev["action_type"] = act.get("action_type")
    return prev


def _modality_hint_from_events(events: list[dict[str, Any]], drop_thr: int) -> str:
    drops = sum(1 for e in events if e.get("event_type") == "drop_off")
    switches = sum(1 for e in events if e.get("event_type") == "modality_switch")
    if drops >= drop_thr:
        return (
            "You had several drop-offs recently — Sudar suggests a shorter session or switching modality "
            f"(signals: drop_offs={drops})."
        )
    if switches >= 2:
        return (
            "You have been experimenting with modalities — keep one modality per sprint to reduce context switching "
            "unless retrieval practice calls for variation."
        )
    return ""
