"""
SudarPlay FastAPI router — mounts all SudarPlay sub-routers.
"""
from fastapi import APIRouter

from .launch import router as launch_router
from .events import router as events_router
from .generate_map import router as gen_router
from .npc_chat import router as npc_router
from .quiz_gate import router as quiz_router
from .complete import router as complete_router

router = APIRouter()
router.include_router(launch_router)
router.include_router(events_router)
router.include_router(gen_router)
router.include_router(npc_router)
router.include_router(quiz_router)
router.include_router(complete_router)
