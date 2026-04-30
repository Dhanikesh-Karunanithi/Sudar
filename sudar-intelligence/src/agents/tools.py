"""
Agent tools — typed read/write helpers against Supabase (service role).

Write tools remain conservative (only explicit allow-listed side effects — e.g. NBA via Learn).
"""

from typing import Any, Optional


def _sb():
    import os

    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        raise RuntimeError("Supabase credentials not configured")
    from supabase import create_client

    return create_client(url, key)


def tool_get_twin_snapshot(user_id: str) -> dict[str, Any]:
    sb = _sb()
    row = sb.table("learner_profiles").select("ai_tutor_context, modality_affinity").eq("user_id", user_id).maybe_single().execute()
    if not row.data:
        return {"found": False}
    ctx = row.data.get("ai_tutor_context") or {}
    modality = row.data.get("modality_affinity")
    struggles = ctx.get("struggles_with") or []
    goals = ctx.get("learning_goals")
    prefs = ctx.get("preferences")
    summary = []
    if goals:
        summary.append(f"Goals note: {str(goals)[:200]}")
    if isinstance(struggles, list) and struggles:
        summary.append(f"Focus areas: {', '.join(map(str, struggles[:8]))}")
    return {
        "found": True,
        "summary_snippets": summary,
        "modality_affinity": modality,
        "preference_keys": list((prefs or {}).keys()) if isinstance(prefs, dict) else [],
    }


def tool_get_recent_learning_events(user_id: str, limit: int = 24) -> dict[str, Any]:
    sb = _sb()
    res = (
        sb.table("learning_events")
        .select("event_type, course_id, module_id, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    rows = res.data or []
    condensed: list[str] = []
    for r in rows[:limit]:
        condensed.append(f"{r.get('event_type')} @ {str(r.get('created_at', ''))[:16]}")
    return {"events": rows, "condensed": condensed}


def tool_get_path_rollups(org_id: str, path_id: Optional[str]) -> dict[str, Any]:
    sb = _sb()
    path_q = sb.table("learning_paths").select("id, title, status, courses").eq("org_id", org_id)
    if path_id:
        path_q = path_q.eq("id", path_id)
    paths = path_q.execute().data or []
    summaries: list[dict[str, Any]] = []
    for p in paths[:12]:
        pid = p.get("id")
        enr = (
            sb.table("enrollments")
            .select("status, progress_pct")
            .eq("path_id", pid)
            .execute()
        )
        enrows = enr.data or []
        counts: dict[str, int] = {}
        prog = []
        for e in enrows:
            counts[e.get("status") or "?"] = counts.get(e.get("status") or "?", 0) + 1
            prog.append(float(e.get("progress_pct") or 0))
        avg_p = round(sum(prog) / len(prog), 2) if prog else 0.0
        summaries.append({
            "path_id": pid,
            "title": p.get("title"),
            "status": p.get("status"),
            "enrollment_counts_by_status": counts,
            "enrollment_n": len(enrows),
            "avg_progress_pct": avg_p,
        })
    return {"paths_reviewed": len(summaries), "summaries": summaries}


def tool_get_org_risk_snippets(org_id: str, limit: int = 15) -> dict[str, Any]:
    sb = _sb()
    res = (
        sb.table("analytics_risk_signals")
        .select("user_id, risk_level, reasons, computed_at")
        .eq("org_id", org_id)
        .order("computed_at", desc=True)
        .limit(limit)
        .execute()
    )
    rows = res.data or []
    lines = []
    for r in rows:
        reasons = r.get("reasons") if isinstance(r.get("reasons"), list) else []
        snippet = "; ".join(str(x) for x in reasons[:3]) if reasons else "signal"
        lines.append(f"{r.get('risk_level')} learner {str(r.get('user_id'))[:8]}… — {snippet}")
    return {"risk_rows": len(rows), "lines": lines}
