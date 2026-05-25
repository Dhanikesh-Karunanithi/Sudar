from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from src.runtime.url_safety import validate_llm_base_url


RuntimeMode = Literal["cloud", "local", "hybrid"]
RuntimeCapability = Literal["chat", "summarize", "rewrite", "flashcards", "quiz_explain"]
RuntimeDecision = Literal["cloud", "local"]


class RuntimeProviderConfig(BaseModel):
    id: str = Field(min_length=1, max_length=128)
    type: str = Field(default="openai_compatible_local")
    base_url: str = Field(min_length=1, max_length=2048)
    model: str = Field(min_length=1, max_length=256)
    auth_mode: Literal["none", "bearer"] = "none"
    timeout_ms: int = Field(default=30_000, ge=1000, le=120_000)
    max_tokens_default: int = Field(default=512, ge=32, le=8192)
    capabilities: list[RuntimeCapability] = Field(default_factory=lambda: ["chat", "summarize", "rewrite"])
    active: bool = True

    @field_validator("base_url")
    @classmethod
    def base_url_ssrf_guard(cls, v: str) -> str:
        return validate_llm_base_url(v)


class RuntimePolicy(BaseModel):
    mode: RuntimeMode = "cloud"
    strict_local: bool = False
    fallback_enabled: bool = True
    providers: list[RuntimeProviderConfig] = Field(default_factory=list)


class ResolveRuntimeRequest(BaseModel):
    org_id: str | None = None
    user_id: str | None = None
    feature: str = "tutor_query"
    capability_required: RuntimeCapability = "chat"


class RuntimeRoutingMetadata(BaseModel):
    decision: RuntimeDecision
    provider_id: str
    model: str
    fallback_used: bool = False
    fallback_reason: str | None = None

