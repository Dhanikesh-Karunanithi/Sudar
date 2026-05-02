"""Shared rate limiter for FastAPI (used by main and route modules)."""
import os

from slowapi import Limiter
from slowapi.util import get_remote_address

# Default: in-process memory. For multi-instance production, point to Redis, e.g.
#   RATE_LIMIT_STORAGE_URI=redis://default:PASSWORD@HOST:6379
# Upstash and other hosts that only expose REST are not supported by slowapi/limit
# here; use a TCP Redis URL (Upstash provides one) or deploy a single-instance limiter.
_rate_storage = os.getenv("RATE_LIMIT_STORAGE_URI", "").strip() or None

limiter = Limiter(key_func=get_remote_address, storage_uri=_rate_storage)
