"""Shared rate limiter for FastAPI (used by main and route modules)."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
