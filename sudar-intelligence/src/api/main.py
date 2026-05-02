"""
Sudar Intelligence — FastAPI Entry Point
The AI brain of Sudar: adaptive engine, AI tutor, content generation, modality dispatch.
"""
from pathlib import Path

from dotenv import load_dotenv

# Load sudar-intelligence/.env.local then .env before any os.getenv (matches Next.js local dev workflow).
_intel_root = Path(__file__).resolve().parents[2]
for _env_fname in (".env.local", ".env"):
    _env_path = _intel_root / _env_fname
    if _env_path.is_file():
        load_dotenv(_env_path)

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.api.routes import tutor, learner, content, modality, health, audio, agents, runtime
from src.api.logging_middleware import LoggingMiddleware
from src.sudarplay.router import router as sudarplay_router

# CORS: default localhost for dev; in production CORS_ORIGINS must be set explicitly (no implicit localhost).
_default_origins = ["http://localhost:3000", "http://localhost:3001"]
_env_raw = os.getenv("ENV", "").strip().lower()
if not _env_raw:
    _env_raw = os.getenv("ENVIRONMENT", "").strip().lower()
_is_production = _env_raw in ("production", "prod")
_cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()
if _is_production and not _cors_origins_env:
    raise RuntimeError(
        "CORS_ORIGINS must be set in production (comma-separated origins, e.g. https://learn.example.com,https://studio.example.com)"
    )
CORS_ORIGINS = [o.strip() for o in _cors_origins_env.split(",") if o.strip()] if _cors_origins_env else _default_origins

_default_cors_headers = "Authorization,Content-Type,X-Intelligence-Service-Secret,X-Requested-With,Accept-Language"
_cors_headers_env = os.getenv("CORS_ALLOW_HEADERS", "").strip()
if _cors_headers_env == "*":
    CORS_ALLOW_HEADERS = ["*"]
else:
    CORS_ALLOW_HEADERS = [
        h.strip() for h in (_cors_headers_env or _default_cors_headers).split(",") if h.strip()
    ]

# Disable Swagger/ReDoc in production to reduce attack surface
_docs_url = None if _is_production else "/docs"
_redoc_url = None if _is_production else "/redoc"


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Sudar Intelligence starting up...")
    if not os.getenv("SUPABASE_JWT_SECRET", "").strip():
        print(
            "WARNING: SUPABASE_JWT_SECRET is unset. Bearer JWT routes (Sudar Agents, tutor, …) "
            "return 503 until it matches your Supabase JWT secret "
            "(Dashboard → Project Settings → API → JWT Secret). "
            f"Put it in {_intel_root / '.env.local'} or {_intel_root / '.env'} (both are auto-loaded)."
        )
    yield
    print("Sudar Intelligence shutting down...")


app = FastAPI(
    title="Sudar Intelligence",
    description="The adaptive AI engine for the Sudar learning platform.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=_docs_url,
    redoc_url=_redoc_url,
)

# Rate limiting (in-memory; for production use Redis e.g. Upstash)
from src.api.limiter import limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=CORS_ALLOW_HEADERS,
)

# Routes
@app.get("/")
def root():
    return {
        "service": "Sudar Intelligence",
        "status": "running",
        "docs": _docs_url,
        "health": "/api/health",
        "audio": "POST /api/audio/generate",
    }

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(tutor.router, prefix="/api/tutor", tags=["AI Tutor"])
app.include_router(learner.router, prefix="/api/learner", tags=["Learner"])
app.include_router(content.router, prefix="/api/content", tags=["Content Generation"])
app.include_router(runtime.router, prefix="/api/runtime", tags=["Runtime"])
app.include_router(modality.router, prefix="/api/modality", tags=["Modality"])
app.include_router(audio.router, prefix="/api/audio", tags=["Audio TTS"])
app.include_router(agents.router, prefix="/api/agents", tags=["Sudar Agents"])
app.include_router(sudarplay_router, prefix="/api/sudarplay", tags=["sudarplay"])
