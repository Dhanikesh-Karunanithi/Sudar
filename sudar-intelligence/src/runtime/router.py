from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from src.core.ai_client import _get_provider
from src.runtime.providers.openai_local import OpenAiCompatibleLocalProvider
from src.runtime.schemas import RuntimeCapability, RuntimePolicy, RuntimeProviderConfig, RuntimeRoutingMetadata


def parse_runtime_policy(settings: Any) -> RuntimePolicy:
    raw = settings if isinstance(settings, dict) else {}
    rt = raw.get("ai_runtime") if isinstance(raw.get("ai_runtime"), dict) else {}
    providers_raw = rt.get("providers") if isinstance(rt.get("providers"), list) else []

    providers: list[RuntimeProviderConfig] = []
    for item in providers_raw:
        if not isinstance(item, dict):
            continue
        try:
            providers.append(RuntimeProviderConfig(**item))
        except Exception:
            continue
    return RuntimePolicy(
        mode=rt.get("mode") if rt.get("mode") in {"cloud", "local", "hybrid"} else "cloud",
        strict_local=rt.get("strict_local") is True,
        fallback_enabled=rt.get("fallback_enabled") is not False,
        providers=providers,
    )


@dataclass
class RouteResolution:
    routing: RuntimeRoutingMetadata
    provider: OpenAiCompatibleLocalProvider | None


class ModelRouter:
    def __init__(self, policy: RuntimePolicy):
        self.policy = policy

    def _pick_local_provider(self, capability: RuntimeCapability) -> RuntimeProviderConfig | None:
        for p in self.policy.providers:
            if not p.active:
                continue
            if capability not in p.capabilities:
                continue
            if p.type != "openai_compatible_local":
                continue
            return p
        return None

    async def resolve(self, capability: RuntimeCapability) -> RouteResolution:
        cloud_provider = _get_provider()
        if self.policy.mode == "cloud":
            return RouteResolution(
                routing=RuntimeRoutingMetadata(
                    decision="cloud",
                    provider_id=f"cloud:{cloud_provider}",
                    model="default",
                    fallback_used=False,
                    fallback_reason=None,
                ),
                provider=None,
            )

        local_cfg = self._pick_local_provider(capability)
        if local_cfg is None:
            if self.policy.mode == "local" and (self.policy.strict_local or not self.policy.fallback_enabled):
                return RouteResolution(
                    routing=RuntimeRoutingMetadata(
                        decision="local",
                        provider_id="local:none",
                        model="",
                        fallback_used=False,
                        fallback_reason="LOCAL_CAPABILITY_UNSUPPORTED",
                    ),
                    provider=None,
                )
            return RouteResolution(
                routing=RuntimeRoutingMetadata(
                    decision="cloud",
                    provider_id=f"cloud:{cloud_provider}",
                    model="default",
                    fallback_used=self.policy.mode in {"local", "hybrid"},
                    fallback_reason="LOCAL_CAPABILITY_UNSUPPORTED",
                ),
                provider=None,
            )

        provider = OpenAiCompatibleLocalProvider(local_cfg)
        health = await provider.health_check()
        if not bool(health.get("ok")):
            if self.policy.mode == "local" and (self.policy.strict_local or not self.policy.fallback_enabled):
                return RouteResolution(
                    routing=RuntimeRoutingMetadata(
                        decision="local",
                        provider_id=local_cfg.id,
                        model=local_cfg.model,
                        fallback_used=False,
                        fallback_reason="LOCAL_PROVIDER_UNREACHABLE",
                    ),
                    provider=None,
                )
            return RouteResolution(
                routing=RuntimeRoutingMetadata(
                    decision="cloud",
                    provider_id=f"cloud:{cloud_provider}",
                    model="default",
                    fallback_used=True,
                    fallback_reason="LOCAL_PROVIDER_UNREACHABLE",
                ),
                provider=None,
            )

        return RouteResolution(
            routing=RuntimeRoutingMetadata(
                decision="local",
                provider_id=local_cfg.id,
                model=local_cfg.model,
                fallback_used=False,
                fallback_reason=None,
            ),
            provider=provider,
        )

