"""
Structured JSON logging for API errors. Never log JWT, passwords, or PII.
"""
import json
import logging
import time
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("byteos.intelligence")


def log_struct(level: str, message: str, **meta: object) -> None:
    entry = {"level": level, "message": message, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), **meta}
    out = json.dumps(entry)
    if level == "error":
        logger.error(out)
    else:
        logger.warning(out)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log 4xx/5xx responses as structured JSON."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        if response.status_code >= 400:
            log_struct(
                "error" if response.status_code >= 500 else "warn",
                f"API {response.status_code}",
                status=response.status_code,
                path=request.url.path,
                method=request.method,
            )
        return response
