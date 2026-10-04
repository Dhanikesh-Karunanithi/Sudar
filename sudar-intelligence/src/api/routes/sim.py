"""SudarSim — persona dialogue, coach evaluation, scenario generation, STT/TTS.

Learn BFF contracts (Stream A voice MVP):
- POST /api/sim/stt → { "success": true, "text": "..." }
  Body: multipart file field `audio` OR JSON { "audio_base64", "audio_mime?", "locale?", "user_id?" }
- POST /api/sim/persona/turn → {
    "reply": str,
    "persona_state": { "mood", "difficulty", "trust" },
    "audio_hint": str | null,
    "audio_base64": str | null,   # Edge-TTS mp3; null if TTS failed
    "audio_mime": "audio/mpeg" | null
  }
"""

from __future__ import annotations

import base64
import json
import logging
import os
import re
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from src.api.auth import require_learner_match, verify_supabase_jwt_or_service
from src.core.ai_client import chat_completion, get_chat_config_error
from src.core.edge_tts_helper import synthesize_edge_mp3, voice_for_locale
from src.core.hf_client import hf_api_key, transcribe_audio
from src.core.deepgram_client import deepgram_api_key, transcribe_deepgram
from src.core.cartesia_client import cartesia_api_key, synthesize_cartesia_mp3

logger = logging.getLogger(__name__)

router = APIRouter()

# Max history turns included in the persona prompt (user+assistant pairs).
_MAX_HISTORY = 24
_MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25 MB


class PersonaState(BaseModel):
    mood: float = Field(ge=0, le=1, default=0.5)
    difficulty: float = Field(ge=0, le=1, default=0.5)
    trust: float = Field(ge=0, le=1, default=0.5)


class HistoryTurn(BaseModel):
    role: str
    text: str


class PersonaTurnRequest(BaseModel):
    session_id: str
    user_message: str
    persona_state: PersonaState
    scenario_id: str | None = None
    locale: str = "en"
    channel: str = "phone"
    scenario_context: dict[str, Any] | None = None
    history: list[HistoryTurn] | None = None
    user_id: str | None = None
    # Optional voice override for Edge-TTS (else locale map → JennyNeural default).
    voice: str | None = None


class PersonaTurnResponse(BaseModel):
    reply: str
    persona_state: PersonaState
    audio_hint: str | None = None
    audio_base64: str | None = None
    audio_mime: str | None = None


class CoachEvaluateRequest(BaseModel):
    session_id: str
    scenario: dict[str, Any]
    transcript: list[dict[str, Any]]
    crm_actions: list[dict[str, Any]] = Field(default_factory=list)
    user_id: str | None = None
    learner_reflection: str | None = None


class GenerateScenarioRequest(BaseModel):
    content: str
    title: str | None = None
    locale: str = "en"


class FromTranscriptRequest(BaseModel):
    transcript: str
    title: str | None = None
    locale: str = "en"
    focus_skills: list[str] | None = None


class SttJsonRequest(BaseModel):
    audio_base64: str
    audio_mime: str | None = "audio/webm"
    locale: str | None = "en"
    user_id: str | None = None


class TtsRequest(BaseModel):
    text: str
    locale: str = "en"
    voice: str | None = None


class TtsResponse(BaseModel):
    audio_base64: str | None = None
    audio_mime: str | None = None


class VoiceTurnRequest(BaseModel):
    audio_base64: str
    audio_mime: str | None = "audio/webm"
    locale: str = "en"
    channel: str = "phone"
    persona_state: PersonaState
    scenario_context: dict[str, Any] | None = None
    history: list[HistoryTurn] | None = None
    voice: str | None = None
    user_id: str | None = None


class VoiceTurnResponse(BaseModel):
    learner_text: str
    reply: str
    persona_state: PersonaState
    audio_base64: str | None = None
    audio_mime: str | None = None


def _sim_persona_model() -> str | None:
    return (os.environ.get("SIM_PERSONA_MODEL") or os.environ.get("AI_CHAT_DEFAULT_MODEL") or "").strip() or None


def _phone_max_tokens(channel: str) -> int:
    return 150 if (channel or "phone").lower() == "phone" else 400


def _clamp(v: float) -> float:
    return max(0.0, min(1.0, v))


def _parse_json_block(text: str) -> dict[str, Any]:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("No JSON in model response")
    return json.loads(match.group(0))


def _chat_content(result: Any) -> str:
    """chat_completion returns {"content": str, ...} — never pass the dict to JSON parse."""
    if isinstance(result, dict):
        return (result.get("content") or "") if result.get("content") is not None else ""
    if isinstance(result, str):
        return result
    return ""


def _mood_style_hint(mood: float) -> str:
    if mood >= 0.75:
        return "You are quite upset/frustrated — show emotion briefly but stay realistic (not abusive)."
    if mood >= 0.55:
        return "You are mildly stressed or impatient — let that color your tone slightly."
    if mood <= 0.25:
        return "You are relatively calm — be cooperative but still have your objective."
    return "Stay naturally conversational for your mood level."


async def _tts_base64(reply: str, locale: str, voice: str | None) -> tuple[str | None, str | None]:
    """Synthesize reply; Cartesia when configured, else Edge-TTS. On failure return (None, None)."""
    provider = (os.environ.get("SIM_TTS_PROVIDER") or "").strip().lower()
    use_cartesia = provider == "cartesia" or (not provider and cartesia_api_key())

    if use_cartesia and cartesia_api_key():
        try:
            audio = await synthesize_cartesia_mp3(reply, locale=locale, voice=voice)
            return base64.b64encode(audio).decode("ascii"), "audio/mpeg"
        except Exception as exc:
            logger.warning("SudarSim Cartesia TTS failed, falling back to Edge: %s", exc)

    try:
        voice_id = voice_for_locale(locale, voice)
        rate = 1.05 if locale.lower().startswith("en") else 1.0
        audio = await synthesize_edge_mp3(reply, voice=voice_id, rate=rate, timeout=45.0)
        return base64.b64encode(audio).decode("ascii"), "audio/mpeg"
    except Exception as exc:
        logger.warning("SudarSim Edge-TTS failed: %s", exc)
        return None, None


async def _transcribe_audio_bytes(
    audio_bytes: bytes,
    *,
    mime: str,
    locale: str | None,
) -> str:
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="audio is empty")
    if len(audio_bytes) > _MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="audio too large (max 25MB)")

    stt_provider = (os.environ.get("SIM_STT_PROVIDER") or "").strip().lower()
    use_deepgram = stt_provider == "deepgram" or (not stt_provider and deepgram_api_key())

    try:
        if use_deepgram and deepgram_api_key():
            result = await transcribe_deepgram(audio_bytes, content_type=mime, locale=locale)
        elif hf_api_key():
            result = await transcribe_audio(audio_bytes, content_type=mime, language=locale)
        else:
            raise HTTPException(
                status_code=503,
                detail="No STT configured. Set DEEPGRAM_API_KEY or HUGGINGFACE_API_KEY.",
            )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("SudarSim STT failed")
        raise HTTPException(status_code=502, detail=f"STT failed: {exc}") from exc

    return (result.get("text") or "").strip()


async def _run_persona_turn(
    *,
    user_message: str,
    persona_state: PersonaState,
    locale: str,
    channel: str,
    scenario_context: dict[str, Any] | None,
    history: list[HistoryTurn] | None,
    voice: str | None,
) -> PersonaTurnResponse:
    err = get_chat_config_error()
    if err:
        raise HTTPException(status_code=503, detail=err)

    ctx = scenario_context or {}
    persona = ctx.get("persona") if isinstance(ctx.get("persona"), dict) else {}
    name = persona.get("name") or ctx.get("persona_name") or "Customer"
    backstory = persona.get("backstory") or "A customer calling for help."
    objectives = persona.get("objectives") or ctx.get("objectives") or []
    if isinstance(objectives, str):
        objectives = [objectives]
    opening_line = persona.get("opening_line") or ctx.get("opening_line") or ""
    title = ctx.get("title") or ""
    state = persona_state
    is_phone = (channel or "phone").lower() == "phone"
    word_limit = 60 if is_phone else 120

    obj_text = ", ".join(str(o) for o in objectives) if objectives else "Resolve the issue professionally"
    system = f"""You are {name}, a customer in a corporate training simulation{" titled " + title if title else ""}.
Backstory: {backstory}
Your opening line (context only; do not repeat unless asked): {opening_line or "(none)"}
Learner objectives: {obj_text}
Current mood (0=calm, 1=angry): {state.mood:.2f}
Difficulty (0=easy, 1=hard): {state.difficulty:.2f}
Trust in agent (0=low, 1=high): {state.trust:.2f}
Channel: {channel}. Locale: {locale}.
{_mood_style_hint(state.mood)}
Stay strictly in character as {name}. Do not break character or mention you are an AI.
For phone: keep replies under {word_limit} words, natural spoken language, one or two short turns of speech.
Return ONLY JSON: {{"reply":"...","mood_delta":0.0,"difficulty_delta":0.0,"trust_delta":0.0}}"""

    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    for turn in (history or [])[-_MAX_HISTORY:]:
        role = (turn.role or "").strip().lower()
        text = (turn.text or "").strip()
        if not text:
            continue
        if role in ("assistant", "customer", "persona", "npc"):
            messages.append({"role": "assistant", "content": text})
        elif role in ("user", "learner", "agent", "human"):
            messages.append({"role": "user", "content": text})
    messages.append({"role": "user", "content": user_message})

    model = _sim_persona_model()
    result = await chat_completion(
        messages,
        model=model,
        temperature=0.7,
        max_tokens=_phone_max_tokens(channel),
    )
    raw = _chat_content(result)
    try:
        parsed = _parse_json_block(raw)
    except (ValueError, json.JSONDecodeError):
        parsed = {
            "reply": (raw.strip()[:500] if raw.strip() else "I need help with my account."),
            "mood_delta": 0,
            "difficulty_delta": 0,
            "trust_delta": 0,
        }

    new_state = PersonaState(
        mood=_clamp(state.mood + float(parsed.get("mood_delta", 0) or 0)),
        difficulty=_clamp(state.difficulty + float(parsed.get("difficulty_delta", 0) or 0)),
        trust=_clamp(state.trust + float(parsed.get("trust_delta", 0) or 0)),
    )
    reply = str(parsed.get("reply") or "I need help with my account.").strip()

    audio_b64: str | None = None
    audio_mime: str | None = None
    if reply:
        audio_b64, audio_mime = await _tts_base64(reply, locale, voice)

    return PersonaTurnResponse(
        reply=reply,
        persona_state=new_state,
        audio_hint=reply,
        audio_base64=audio_b64,
        audio_mime=audio_mime,
    )


@router.post("/persona/turn", response_model=PersonaTurnResponse)
async def persona_turn(
    body: PersonaTurnRequest,
    request: Request,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    if body.user_id:
        require_learner_match(request, body.user_id)
    elif getattr(request.state, "auth_method", None) == "jwt":
        raise HTTPException(status_code=400, detail="user_id required for JWT auth")

    return await _run_persona_turn(
        user_message=body.user_message,
        persona_state=body.persona_state,
        locale=body.locale,
        channel=body.channel,
        scenario_context=body.scenario_context,
        history=body.history,
        voice=body.voice,
    )


@router.post("/tts", response_model=TtsResponse)
async def sim_tts(
    body: TtsRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    audio_b64, audio_mime = await _tts_base64(text, body.locale, body.voice)
    return TtsResponse(audio_base64=audio_b64, audio_mime=audio_mime)


@router.post("/voice-turn", response_model=VoiceTurnResponse)
async def voice_turn(
    body: VoiceTurnRequest,
    request: Request,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    if body.user_id:
        require_learner_match(request, body.user_id)
    elif getattr(request.state, "auth_method", None) == "jwt":
        raise HTTPException(status_code=400, detail="user_id required for JWT auth")

    raw_b64 = body.audio_base64.strip()
    if raw_b64.startswith("data:") and "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]
    try:
        audio_bytes = base64.b64decode(raw_b64, validate=False)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid audio_base64") from exc

    mime = (body.audio_mime or "audio/webm").split(";")[0].strip()
    learner_text = await _transcribe_audio_bytes(audio_bytes, mime=mime, locale=body.locale)
    if not learner_text:
        raise HTTPException(status_code=422, detail="Could not transcribe audio. Try again or type your reply.")

    turn = await _run_persona_turn(
        user_message=learner_text,
        persona_state=body.persona_state,
        locale=body.locale,
        channel=body.channel,
        scenario_context=body.scenario_context,
        history=body.history,
        voice=body.voice,
    )

    return VoiceTurnResponse(
        learner_text=learner_text,
        reply=turn.reply,
        persona_state=turn.persona_state,
        audio_base64=turn.audio_base64,
        audio_mime=turn.audio_mime,
    )


@router.post("/stt")
async def sim_stt(
    request: Request,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    """
    Speech-to-text for SudarSim push-to-talk.
    Accepts multipart (`audio` file + optional locale/user_id forms)
    or JSON { audio_base64, audio_mime?, locale?, user_id? }.
    Returns { success, text } for Learn BFF.
    """
    content_type = (request.headers.get("content-type") or "").lower()
    audio_bytes: bytes | None = None
    mime = "audio/webm"
    lang: str | None = None
    uid: str | None = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        upload = form.get("audio")
        if upload is None:
            raise HTTPException(status_code=400, detail="multipart field 'audio' is required")
        # Starlette UploadFile or raw bytes
        if hasattr(upload, "read"):
            audio_bytes = await upload.read()  # type: ignore[misc]
            mime = (getattr(upload, "content_type", None) or "audio/webm").split(";")[0].strip()
        elif isinstance(upload, (bytes, bytearray)):
            audio_bytes = bytes(upload)
        else:
            raise HTTPException(status_code=400, detail="Invalid audio upload")
        loc = form.get("locale")
        if isinstance(loc, str) and loc.strip():
            lang = loc.strip()
        uid_raw = form.get("user_id")
        if isinstance(uid_raw, str) and uid_raw.strip():
            uid = uid_raw.strip()
    else:
        try:
            payload = await request.json()
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Expected multipart audio or JSON body") from exc
        body = SttJsonRequest.model_validate(payload)
        uid = body.user_id
        lang = body.locale
        mime = (body.audio_mime or "audio/webm").split(";")[0].strip()
        raw_b64 = body.audio_base64.strip()
        if raw_b64.startswith("data:") and "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        try:
            audio_bytes = base64.b64decode(raw_b64, validate=False)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid audio_base64") from exc

    if uid:
        require_learner_match(request, uid)
    elif getattr(request.state, "auth_method", None) == "jwt":
        raise HTTPException(status_code=400, detail="user_id required for JWT auth")

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="audio is empty")
    if len(audio_bytes) > _MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="audio too large (max 25MB)")

    text = await _transcribe_audio_bytes(audio_bytes, mime=mime, locale=lang)
    return {"success": True, "text": text}


@router.post("/coach/evaluate")
async def coach_evaluate(
    body: CoachEvaluateRequest,
    request: Request,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    if body.user_id:
        require_learner_match(request, body.user_id)
    elif getattr(request.state, "auth_method", None) == "jwt":
        raise HTTPException(status_code=400, detail="user_id required for JWT auth")

    err = get_chat_config_error()
    if err:
        raise HTTPException(status_code=503, detail=err)

    scenario = body.scenario
    rubric = scenario.get("rubric") or {}
    dimensions = rubric.get("dimensions") or [
        {"id": "empathy", "label": "Empathy", "weight": 0.25, "must_pass": False},
        {"id": "resolution", "label": "Resolution", "weight": 0.35, "must_pass": True},
        {"id": "compliance", "label": "Compliance", "weight": 0.2, "must_pass": True},
        {"id": "clarity", "label": "Clarity", "weight": 0.2, "must_pass": False},
    ]
    dim_desc = json.dumps(dimensions)
    transcript_text = "\n".join(
        f"[{t.get('ts','')}] {t.get('role','')}: {t.get('text','')}" for t in body.transcript
    )
    crm_text = json.dumps(body.crm_actions)
    reflection_block = ""
    if body.learner_reflection and body.learner_reflection.strip():
        reflection_block = f"\nLearner self-reflection before scoring:\n{body.learner_reflection.strip()}\n"

    system = f"""You are Sudar, an AI coach for contact-center training.
Score the learner on rubric dimensions (0-100 each): {dim_desc}
Transcript:
{transcript_text}
CRM actions: {crm_text}{reflection_block}
Return ONLY JSON:
{{"dimension_scores":{{"empathy":0}},"overall_score":0,"coach_narrative":"...","replay_moments":[{{"ts":"","issue":"","suggestion":""}}],"passed":true}}"""

    result_chat = await chat_completion(
        [{"role": "system", "content": system}], temperature=0.3, max_tokens=1200
    )
    raw = _chat_content(result_chat)
    try:
        result = _parse_json_block(raw)
    except (ValueError, json.JSONDecodeError):
        result = {
            "dimension_scores": {},
            "overall_score": 0,
            "coach_narrative": raw[:800],
            "replay_moments": [],
            "passed": False,
        }

    completion = scenario.get("completion_rule") or {}
    min_score = float(completion.get("min_overall_score", 70))
    overall = float(result.get("overall_score", 0))
    passed = bool(result.get("passed", overall >= min_score))
    if completion.get("require_must_pass"):
        for d in dimensions:
            if d.get("must_pass"):
                did = d.get("id")
                if float((result.get("dimension_scores") or {}).get(did, 0)) < min_score:
                    passed = False

    result["passed"] = passed
    result["overall_score"] = overall
    return result


@router.post("/scenario/generate")
async def generate_scenario(
    body: GenerateScenarioRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    err = get_chat_config_error()
    if err:
        raise HTTPException(status_code=503, detail=err)

    system = """Generate a SudarSim roleplay scenario from the source content.
Return ONLY JSON matching:
{"title":"","locale":"","persona":{"name":"","backstory":"","objectives":[],"opening_line":""},
"rubric":{"dimensions":[{"id":"","label":"","description":"","weight":0.2,"must_pass":false}]},
"channels":{"phone":true,"chat":true,"email":false}}"""

    result_chat = await chat_completion(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": body.content[:12000]},
        ],
        temperature=0.5,
        max_tokens=1500,
    )
    raw = _chat_content(result_chat)
    try:
        scenario = _parse_json_block(raw)
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="Failed to parse scenario JSON") from None
    if body.title:
        scenario["title"] = body.title
    scenario["locale"] = body.locale
    return {"success": True, "scenario": scenario}


@router.post("/scenario/from-transcript")
async def from_transcript(
    body: FromTranscriptRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    err = get_chat_config_error()
    if err:
        raise HTTPException(status_code=503, detail=err)

    focus = ", ".join(body.focus_skills or ["empathy", "compliance", "resolution"])
    system = f"""Analyze this contact-center call transcript and create a practice scenario.
Focus skills to grade: {focus}
Identify failure moments for replay coaching.
Return ONLY JSON with title, persona, rubric (dimensions with must_pass flags), channels, and source.type=transcript_import."""

    result_chat = await chat_completion(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": body.transcript[:15000]},
        ],
        temperature=0.4,
        max_tokens=1800,
    )
    raw = _chat_content(result_chat)
    try:
        scenario = _parse_json_block(raw)
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="Failed to parse transcript scenario") from None
    if body.title:
        scenario["title"] = body.title
    scenario["locale"] = body.locale
    scenario["source"] = {"type": "transcript_import"}
    return {"success": True, "scenario": scenario}
