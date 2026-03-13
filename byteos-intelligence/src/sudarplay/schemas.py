"""
Pydantic v2 models for SudarPlay API request/response bodies.
"""
from uuid import UUID

from pydantic import BaseModel, Field
from typing import Any


class LaunchTokenRequest(BaseModel):
    learner_id: UUID
    module_id: UUID


class GenerateMapRequest(BaseModel):
    module_id: UUID
    course_id: UUID
    options: dict[str, Any] = Field(default_factory=dict)


class NPCChatRequest(BaseModel):
    message: str
    npc_id: str
    concept_context: str
    conversation_history: list[dict[str, str]] = Field(default_factory=list)


class QuizAnswer(BaseModel):
    question_id: str
    selected: str
    correct: str


class QuizGateRequest(BaseModel):
    gate_id: str
    archetype: str = "standard"
    answers: list[QuizAnswer]
    attempt_number: int = 1


class EventRequest(BaseModel):
    event_type: str
    payload: dict[str, Any] = Field(default_factory=dict)


class CompleteRequest(BaseModel):
    map_id: UUID
