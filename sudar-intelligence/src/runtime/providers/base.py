from __future__ import annotations

from typing import Protocol

from src.runtime.schemas import RuntimeProviderConfig


class ProviderHealth(dict):
    pass


class RuntimeProvider(Protocol):
    async def health_check(self) -> ProviderHealth:
        ...

    async def chat(
        self,
        *,
        messages: list[dict[str, str]],
        max_tokens: int,
        temperature: float,
    ) -> str:
        ...


class RuntimeProviderError(RuntimeError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def ensure_openai_local_type(provider: RuntimeProviderConfig) -> None:
    if provider.type != "openai_compatible_local":
        raise RuntimeProviderError("LOCAL_PROVIDER_UNSUPPORTED", f"Unsupported local provider type: {provider.type}")

