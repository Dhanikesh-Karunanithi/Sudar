"""
Hugging Face Inference client for Sudar Intelligence.
Supports HF Router, legacy inference API, and OpenAI-compatible TEI/vLLM via HF_INFERENCE_BASE_URL.
"""
from __future__ import annotations

import base64
import os
from typing import Any

import httpx

HF_DEFAULT_EMBED_MODEL = "BAAI/bge-m3"
HF_DEFAULT_RERANK_MODEL = "BAAI/bge-reranker-v2-m3"
HF_DEFAULT_CHAT_MODEL = "meta-llama/Meta-Llama-3.1-8B-Instruct"
HF_DEFAULT_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell"
HF_ROUTER_BASE = "https://router.huggingface.co/hf-inference/models"
HF_LEGACY_FEATURE_BASE = "https://api-inference.huggingface.co/pipeline/feature-extraction"
HF_INFERENCE_MODELS_BASE = "https://api-inference.huggingface.co/models"
HF_ROUTER_CHAT_BASE = "https://router.huggingface.co/v1/chat/completions"


def hf_api_key() -> str:
    return os.environ.get("HUGGINGFACE_API_KEY", "").strip()


def hf_inference_base_url() -> str | None:
    raw = os.environ.get("HF_INFERENCE_BASE_URL", "").strip()
    return raw.rstrip("/") if raw else None


def hf_embed_model() -> str:
    return (
        os.environ.get("HF_EMBED_MODEL", "").strip()
        or os.environ.get("EMBED_MODEL", "").strip()
        or HF_DEFAULT_EMBED_MODEL
    )


def hf_rerank_model() -> str:
    return os.environ.get("HF_RERANK_MODEL", "").strip() or HF_DEFAULT_RERANK_MODEL


def hf_chat_model() -> str:
    return (
        os.environ.get("HF_CHAT_MODEL", "").strip()
        or os.environ.get("AI_CHAT_DEFAULT_MODEL", "").strip()
        or HF_DEFAULT_CHAT_MODEL
    )


def hf_image_model() -> str:
    return os.environ.get("HF_IMAGE_MODEL", "").strip() or HF_DEFAULT_IMAGE_MODEL


def image_provider() -> str:
    return os.environ.get("IMAGE_PROVIDER", "together").strip().lower()


def _auth_headers(api_key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}


def _mean_pool(matrix: list[list[float]]) -> list[float]:
    if not matrix:
        return []
    dim = len(matrix[0])
    out = [0.0] * dim
    count = 0
    for row in matrix:
        if len(row) != dim:
            continue
        for i, v in enumerate(row):
            out[i] += v
        count += 1
    if count == 0:
        return []
    return [v / count for v in out]


def _normalize_embedding_payload(data: Any) -> list[float]:
    if not isinstance(data, list) or not data:
        return []
    if isinstance(data[0], (int, float)):
        return [float(x) for x in data]
    if isinstance(data[0], list):
        return _mean_pool(data)
    return []


async def embed_texts(texts: list[str], expected_dim: int = 1024) -> list[list[float]]:
    api_key = hf_api_key()
    if not api_key or not texts:
        return [[] for _ in texts]

    model = hf_embed_model()
    inputs = [t.strip()[:8000] for t in texts if t and t.strip()]
    if not inputs:
        return [[] for _ in texts]

    base = hf_inference_base_url()
    if base:
        url = f"{base}/v1/embeddings" if "/v1" not in base else f"{base.rstrip('/')}/embeddings"
        if "/embeddings" not in url:
            url = f"{base}/v1/embeddings"
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                url,
                headers=_auth_headers(api_key),
                json={"model": model, "input": inputs},
            )
            if r.status_code == 200:
                data = r.json()
                items = sorted(data.get("data") or [], key=lambda x: x.get("index", 0))
                out = []
                for item in items:
                    vec = item.get("embedding") or []
                    out.append(vec if len(vec) == expected_dim else [])
                if any(out):
                    return out

    async with httpx.AsyncClient(timeout=120.0) as client:
        results: list[list[float]] = []
        for text in inputs:
            r = await client.post(
                f"{HF_ROUTER_BASE}/{model}",
                headers=_auth_headers(api_key),
                json={"inputs": text},
            )
            if r.status_code != 200:
                results.append([])
                continue
            vec = _normalize_embedding_payload(r.json())
            results.append(vec if len(vec) == expected_dim else [])
        if any(results):
            return results

        r = await client.post(
            f"{HF_LEGACY_FEATURE_BASE}/{model}",
            headers=_auth_headers(api_key),
            json={"inputs": inputs if len(inputs) > 1 else inputs[0]},
        )
        if r.status_code != 200:
            return [[] for _ in texts]
        data = r.json()
        if len(inputs) == 1:
            vec = _normalize_embedding_payload(data)
            return [vec if len(vec) == expected_dim else []]
        out = []
        for i, _ in enumerate(inputs):
            vec = _normalize_embedding_payload(data[i] if isinstance(data, list) else [])
            out.append(vec if len(vec) == expected_dim else [])
        return out


async def rerank_pairs(query: str, passages: list[str]) -> list[int]:
    api_key = hf_api_key()
    if not api_key or not query.strip() or not passages:
        return list(range(len(passages)))

    model = hf_rerank_model()
    base = hf_inference_base_url()
    url = f"{base}/models/{model}" if base else f"{HF_INFERENCE_MODELS_BASE}/{model}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            url,
            headers=_auth_headers(api_key),
            json={
                "inputs": {
                    "source_sentence": query.strip()[:2000],
                    "sentences": [p[:2000] for p in passages],
                }
            },
        )
        if r.status_code != 200:
            return list(range(len(passages)))
        scores = r.json()
        if not isinstance(scores, list):
            return list(range(len(passages)))
        indexed = sorted(
            enumerate(scores),
            key=lambda x: float(x[1]) if isinstance(x[1], (int, float)) else 0.0,
            reverse=True,
        )
        return [i for i, _ in indexed]


async def chat_completion_openai_compat(
    messages: list[dict[str, str]],
    *,
    model: str | None = None,
    max_tokens: int = 1024,
    temperature: float = 0.7,
) -> dict[str, Any]:
    api_key = hf_api_key()
    if not api_key:
        raise RuntimeError("HUGGINGFACE_API_KEY not configured")

    model = (model or "").strip() or hf_chat_model()
    base = hf_inference_base_url()
    url = f"{base}/v1/chat/completions" if base else HF_ROUTER_CHAT_BASE

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(url, headers=_auth_headers(api_key), json=payload)
        r.raise_for_status()
        data = r.json()

    content = ""
    if isinstance(data.get("choices"), list) and data["choices"]:
        msg = data["choices"][0].get("message") or {}
        content = (msg.get("content") or "").strip()

    return {"content": content, "raw": data, "provider": "huggingface"}


async def generate_image_bytes(
    prompt: str,
    *,
    model: str | None = None,
) -> dict[str, Any]:
    """Generate image via HF inference. Returns {b64_json, url, model}."""
    api_key = hf_api_key()
    if not api_key:
        raise RuntimeError("HUGGINGFACE_API_KEY not configured")

    model = (model or "").strip() or hf_image_model()
    base = hf_inference_base_url()
    url = f"{base}/models/{model}" if base else f"{HF_INFERENCE_MODELS_BASE}/{model}"

    async with httpx.AsyncClient(timeout=180.0) as client:
        r = await client.post(
            url,
            headers=_auth_headers(api_key),
            json={"inputs": prompt[:2000]},
        )
        if r.status_code != 200:
            raise RuntimeError(r.text or "HF image request failed")

        content_type = r.headers.get("content-type", "")
        if "image" in content_type:
            b64 = base64.b64encode(r.content).decode("ascii")
            return {"b64_json": b64, "url": None, "model": model}

        data = r.json()
        if isinstance(data, dict):
            b64 = data.get("b64_json") or data.get("image")
            if isinstance(b64, str):
                return {"b64_json": b64, "url": data.get("url"), "model": model}
        if isinstance(data, list) and data and isinstance(data[0], dict):
            b64 = data[0].get("b64_json") or data[0].get("image")
            if isinstance(b64, str):
                return {"b64_json": b64, "url": data[0].get("url"), "model": model}

    raise RuntimeError("HF returned no image data")
