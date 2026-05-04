import asyncio

from src.runtime.router import ModelRouter, parse_runtime_policy


def _resolve(policy_dict: dict, capability: str = "chat"):
    policy = parse_runtime_policy({"ai_runtime": policy_dict})
    return asyncio.run(ModelRouter(policy).resolve(capability)).routing


def test_cloud_mode_routes_to_cloud():
    routing = _resolve({"mode": "cloud", "providers": []})
    assert routing.decision == "cloud"
    assert routing.fallback_used is False


def test_local_strict_without_provider_returns_local_error():
    routing = _resolve(
        {
            "mode": "local",
            "strict_local": True,
            "fallback_enabled": False,
            "providers": [],
        }
    )
    assert routing.decision == "local"
    assert routing.fallback_reason == "LOCAL_CAPABILITY_UNSUPPORTED"


def test_hybrid_without_provider_falls_back_to_cloud():
    routing = _resolve(
        {
            "mode": "hybrid",
            "providers": [],
        },
        capability="rewrite",
    )
    assert routing.decision == "cloud"
    assert routing.fallback_used is True
    assert routing.fallback_reason == "LOCAL_CAPABILITY_UNSUPPORTED"

