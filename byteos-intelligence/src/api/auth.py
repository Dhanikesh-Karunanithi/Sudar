"""
Supabase JWT verification for Learn/Studio → Intelligence requests.
Validates Authorization: Bearer <supabase_jwt> and enforces body.user_id == JWT sub.
Optionally allows X-Intelligence-Service-Secret for server-to-server (ALP) calls from Learn.
"""
import os
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, HTTPHeader

HTTPBearerOptional = HTTPBearer(auto_error=False)
ServiceSecretHeader = HTTPHeader(alias="X-Intelligence-Service-Secret")


def _get_supabase_jwt_secret() -> str | None:
    return os.environ.get("SUPABASE_JWT_SECRET", "").strip() or None


def _get_service_secret() -> str | None:
    return os.environ.get("INTELLIGENCE_SERVICE_SECRET", "").strip() or None


async def verify_supabase_jwt_or_service(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(HTTPBearerOptional)] = None,
    service_secret: Annotated[str | None, Depends(ServiceSecretHeader)] = None,
) -> str | None:
    """
    Validates request auth. Sets request.state.auth_user_id and request.state.auth_method.
    - If Authorization: Bearer <jwt>: verifies Supabase JWT, sets auth_user_id=sub, returns sub.
    - Else if X-Intelligence-Service-Secret matches INTELLIGENCE_SERVICE_SECRET: auth_method='service';
      route uses body.user_id (Learn ALP already validated org). Returns None.
    - Else: 401. Route must call require_learner_match(request, body.user_id) after parsing body.
    """
    if credentials:
        secret = _get_supabase_jwt_secret()
        if not secret:
            raise HTTPException(
                status_code=503,
                detail="JWT validation not configured (SUPABASE_JWT_SECRET)",
            )
        try:
            payload = jwt.decode(
                credentials.credentials,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            sub = payload.get("sub")
            if not sub:
                raise HTTPException(status_code=401, detail="JWT missing sub")
            request.state.auth_user_id = sub
            request.state.auth_method = "jwt"
            return sub
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="JWT expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid JWT")

    configured = _get_service_secret()
    if configured and service_secret and service_secret == configured:
        request.state.auth_method = "service"
        return None

    raise HTTPException(
        status_code=401,
        detail="Missing or invalid auth: send Authorization Bearer <supabase_jwt> or X-Intelligence-Service-Secret",
    )


def require_learner_match(request: Request, body_user_id: str) -> None:
    """
    Call after parsing body. If auth was JWT, enforces body_user_id == JWT sub.
    If auth was service secret, body_user_id is trusted (no check).
    """
    if getattr(request.state, "auth_method", None) == "jwt":
        auth_uid = getattr(request.state, "auth_user_id", None)
        if auth_uid and body_user_id != auth_uid:
            raise HTTPException(
                status_code=403,
                detail="body user_id does not match authenticated user",
            )
