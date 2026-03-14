"""
ByteOS Intelligence — FastAPI Entry Point
The AI brain of ByteOS: adaptive engine, AI tutor, content generation, modality dispatch.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.api.routes import tutor, learner, content, modality, health, audio
from src.sudarplay.router import router as sudarplay_router

# CORS: default localhost; in production set CORS_ORIGINS (comma-separated) e.g. https://sudar-studio.vercel.app,https://sudar-learn.vercel.app
_default_origins = ["http://localhost:3000", "http://localhost:3001"]
_cors_origins_env = os.getenv("CORS_ORIGINS", "")
CORS_ORIGINS = [o.strip() for o in _cors_origins_env.split(",") if o.strip()] or _default_origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("ByteOS Intelligence starting up...")
    yield
    print("ByteOS Intelligence shutting down...")


app = FastAPI(
    title="ByteOS Intelligence",
    description="The adaptive AI engine for the ByteOS learning platform.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
@app.get("/")
def root():
    return {
        "service": "ByteOS Intelligence",
        "status": "running",
        "docs": "/docs",
        "health": "/api/health",
        "audio": "POST /api/audio/generate",
    }

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(tutor.router, prefix="/api/tutor", tags=["AI Tutor"])
app.include_router(learner.router, prefix="/api/learner", tags=["Learner"])
app.include_router(content.router, prefix="/api/content", tags=["Content Generation"])
app.include_router(modality.router, prefix="/api/modality", tags=["Modality"])
app.include_router(audio.router, prefix="/api/audio", tags=["Audio TTS"])
app.include_router(sudarplay_router, prefix="/api/sudarplay", tags=["sudarplay"])
