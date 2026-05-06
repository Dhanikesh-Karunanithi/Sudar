"""Regression: runtime resolve must not be callable without auth (SSRF via health_check)."""

import os
from pathlib import Path

import pytest
from starlette.testclient import TestClient

_intel_root = Path(__file__).resolve().parents[1]
os.environ.setdefault("ENV", "development")
os.environ.setdefault("ENVIRONMENT", "development")

# Import app after env so main.py CORS production guard does not fire.
from src.api.main import app  # noqa: E402


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


def test_runtime_resolve_without_credentials_returns_401(client: TestClient) -> None:
    r = client.post(
        "/api/runtime/resolve",
        json={
            "capability_required": "chat",
            "org_settings": {"ai_runtime": {"mode": "cloud", "providers": []}},
        },
    )
    assert r.status_code == 401
