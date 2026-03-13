"""
SudarPlay JWT verification for WA → Sudar API calls.
Launch token is signed with SUDARPLAY_JWT_SECRET; validated on every protected endpoint.
"""
import os
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

try:
    import jwt
except ImportError:
    jwt = None  # type: ignore

bearer = HTTPBearer(auto_error=True)


def _get_secret() -> str:
    secret = os.environ.get("SUDARPLAY_JWT_SECRET", "").strip()
    if not secret:
        raise RuntimeError("SUDARPLAY_JWT_SECRET is not set")
    return secret


def verify_sudarplay_jwt(
    credentials: HTTPAuthorizationCredentials = Security(bearer),
) -> dict:
    """Decode and validate the SudarPlay launch JWT. Returns claims dict."""
    if jwt is None:
        raise HTTPException(
            status_code=503,
            detail="JWT support not installed (pip install pyjwt)",
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            _get_secret(),
            algorithms=["HS256"],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="SudarPlay session expired — please re-launch from your dashboard",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid SudarPlay token")
