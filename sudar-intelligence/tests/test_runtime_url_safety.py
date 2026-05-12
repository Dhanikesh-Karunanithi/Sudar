import pytest

from src.runtime.router import parse_runtime_policy
from src.runtime.url_safety import UnsafeLlmUrlError, validate_llm_base_url


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1:11434/v1",
        "http://localhost/v1",
        "http://[::1]/v1",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.1:11434/v1",
        "file:///etc/passwd",
        "gopher://evil",
    ],
)
def test_validate_rejects_unsafe_urls(url: str, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("INTELLIGENCE_ALLOW_PRIVATE_LLM_URLS", raising=False)
    with pytest.raises(UnsafeLlmUrlError):
        validate_llm_base_url(url)


def test_validate_accepts_public_https(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("INTELLIGENCE_ALLOW_PRIVATE_LLM_URLS", raising=False)
    assert validate_llm_base_url("https://api.example.com/v1").startswith("https://")


def test_validate_private_ip_allowed_with_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("INTELLIGENCE_ALLOW_PRIVATE_LLM_URLS", "1")
    assert validate_llm_base_url("http://10.0.0.1:11434/v1") == "http://10.0.0.1:11434/v1"


def test_validate_loopback_still_blocked_with_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("INTELLIGENCE_ALLOW_PRIVATE_LLM_URLS", "1")
    with pytest.raises(UnsafeLlmUrlError):
        validate_llm_base_url("http://127.0.0.1:11434/v1")


def test_parse_runtime_policy_skips_invalid_provider_urls(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("INTELLIGENCE_ALLOW_PRIVATE_LLM_URLS", raising=False)
    policy = parse_runtime_policy(
        {
            "ai_runtime": {
                "mode": "hybrid",
                "providers": [
                    {
                        "id": "evil",
                        "type": "openai_compatible_local",
                        "base_url": "http://169.254.169.254/v1",
                        "model": "x",
                        "capabilities": ["chat"],
                        "active": True,
                    }
                ],
            },
        }
    )
    assert policy.providers == []
