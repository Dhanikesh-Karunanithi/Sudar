"""
Authorization for Sudar Agents admin_team runs (org staff verification via Supabase).
"""
import os


def create_service_supabase():
    """Sync Supabase client for agent auth checks."""
    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        return None
    from supabase import create_client

    return create_client(url, key)


def verify_org_staff(actor_user_id: str, org_id: str) -> bool:
    """
    True if actor is admin or manager for org (org_members) or platform super/org admin on profile.
    """
    sb = create_service_supabase()
    if not sb:
        return False
    try:
        prof = sb.table("profiles").select("role, org_id").eq("id", actor_user_id).maybe_single().execute()
        pdata = prof.data if prof.data else {}
        role = pdata.get("role")
        profile_org_id = pdata.get("org_id")
        if role in ("super_admin",):
            return True
        if role == "org_admin" and profile_org_id == org_id:
            return True
        memb = (
            sb.table("org_members")
            .select("role")
            .eq("org_id", org_id)
            .eq("user_id", actor_user_id)
            .maybe_single()
            .execute()
        )
        mr = (memb.data or {}).get("role") if memb.data else None
        return mr in ("admin", "manager")
    except Exception:
        return False


def learner_org_id(user_id: str) -> str | None:
    sb = create_service_supabase()
    if not sb:
        return None
    try:
        row = sb.table("profiles").select("org_id").eq("id", user_id).maybe_single().execute()
        if row.data:
            return row.data.get("org_id")
    except Exception:
        pass
    return None
