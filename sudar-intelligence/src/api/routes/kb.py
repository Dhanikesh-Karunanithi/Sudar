"""
Knowledge base document conversion via Microsoft MarkItDown.
POST /api/kb/convert-markdown — multipart file → structured Markdown for RAG ingest.
"""
from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from src.api.auth import verify_supabase_jwt_or_service

router = APIRouter()

MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50MB


class ConvertMarkdownResponse(BaseModel):
    markdown: str
    pages: int | None = None
    images_extracted: int | None = None
    ocr_used: bool = False
    title: str | None = None


def _guess_file_type(filename: str, content_type: str | None) -> str:
    name = (filename or "").lower()
    mime = (content_type or "").lower()
    if name.endswith(".pdf") or mime == "application/pdf":
        return "pdf"
    if name.endswith(".docx") or "wordprocessingml" in mime:
        return "docx"
    if name.endswith(".pptx") or "presentationml" in mime:
        return "pptx"
    if name.endswith(".xlsx") or "spreadsheetml" in mime:
        return "xlsx"
    if name.endswith(".xls"):
        return "xls"
    if name.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")) or mime.startswith("image/"):
        return "image"
    if name.endswith((".mp3", ".wav", ".m4a")) or mime.startswith("audio/"):
        return "audio"
    if name.endswith((".mp4", ".mov", ".webm")) or mime.startswith("video/"):
        return "video"
    if name.endswith(".html") or mime == "text/html":
        return "html"
    if name.endswith(".csv") or mime == "text/csv":
        return "csv"
    if name.endswith(".json") or mime == "application/json":
        return "json"
    if name.endswith(".xml"):
        return "xml"
    if name.endswith(".epub"):
        return "epub"
    if name.endswith(".zip"):
        return "zip"
    return "other"


def _build_markitdown() -> Any:
    try:
        from markitdown import MarkItDown
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail="markitdown is not installed. pip install 'markitdown[all]' in sudar-intelligence.",
        ) from e

    llm_client = None
    llm_model = os.environ.get("MARKITDOWN_LLM_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if openai_key:
        try:
            from openai import OpenAI

            llm_client = OpenAI(api_key=openai_key)
        except Exception:
            llm_client = None

    return MarkItDown(
        enable_plugins=os.environ.get("MARKITDOWN_ENABLE_PLUGINS", "false").lower() in ("1", "true", "yes"),
        llm_client=llm_client,
        llm_model=llm_model,
    )


@router.post("/convert-markdown", response_model=ConvertMarkdownResponse)
async def convert_markdown(
    file: UploadFile = File(...),
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="filename required")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty file")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="file too large (max 50MB)")

    suffix = Path(file.filename).suffix or ""
    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(raw)
            tmp_path = tmp.name

        converter = _build_markitdown()
        result = converter.convert(tmp_path)
        markdown = (getattr(result, "text_content", None) or getattr(result, "markdown", None) or "").strip()
        if not markdown:
            raise HTTPException(status_code=422, detail="no text extracted from document")

        meta = getattr(result, "metadata", None) or {}
        pages = meta.get("pages") if isinstance(meta, dict) else None
        if pages is not None:
            try:
                pages = int(pages)
            except (TypeError, ValueError):
                pages = None

        return ConvertMarkdownResponse(
            markdown=markdown[:500_000],
            pages=pages,
            images_extracted=meta.get("images_extracted") if isinstance(meta, dict) else None,
            ocr_used=bool(meta.get("ocr_used")) if isinstance(meta, dict) else False,
            title=meta.get("title") if isinstance(meta, dict) else None,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"MarkItDown conversion failed: {e}") from e
    finally:
        if tmp_path and os.path.isfile(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
