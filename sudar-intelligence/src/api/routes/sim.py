"""SudarSim — persona dialogue, coach evaluation, scenario generation."""

from __future__ import annotations

import json
import re
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.api.auth import verify_supabase_jwt_or_service
from src.core.ai_client import chat_completion, get_chat_config_error

router = APIRouter()


class PersonaState(BaseModel):
    mood: float = Field(ge=0, le=1, default=0.5)
    difficulty: float = Field(ge=0, le=1, default=0.5)
    trust: float = Field(ge=0, le=1, default=0.5)


class PersonaTurnRequest(BaseModel):
    session_id: str
    user_message: str
    persona_state: PersonaState
    scenario_id: str | None = None
    locale: str = "en"
    channel: str = "phone"
    scenario_context: dict[str, Any] | None = None


class PersonaTurnResponse(BaseModel):
    reply: str
    persona_state: PersonaState
    audio_hint: str | None = None


class CoachEvaluateRequest(BaseModel):
    session_id: str
    scenario: dict[str, Any]
    transcript: list[dict[str, Any]]
    crm_actions: list[dict[str, Any]] = Field(default_factory=list)


class GenerateScenarioRequest(BaseModel):
    content: str
    title: str | None = None
    locale: str = "en"


class FromTranscriptRequest(BaseModel):
    transcript: str
    title: str | None = None
    locale: str = "en"
    focus_skills: list[str] | None = None


def _clamp(v: float) -> float:
    return max(0.0, min(1.0, v))


def _parse_json_block(text: str) -> dict[str, Any]:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("No JSON in model response")
    return json.loads(match.group(0))


@router.post("/persona/turn", response_model=PersonaTurnResponse)
async def persona_turn(
    body: PersonaTurnRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    err = get_chat_config_error()
    if err:
        raise HTTPException(status_code=503, detail=err)

    ctx = body.scenario_context or {}
    persona = ctx.get("persona") or {}
    name = persona.get("name") or "Customer"
    backstory = persona.get("backstory") or "A customer calling for help."
    objectives = persona.get("objectives") or []
    state = body.persona_state

    system = f"""You are {name}, a customer in a corporate training simulation.
Backstory: {backstory}
Objectives for the learner: {', '.join(objectives) if objectives else 'Resolve the issue professionally'}
Current mood (0=calm, 1=angry): {state.mood:.2f}
Difficulty (0=easy, 1=hard): {state.difficulty:.2f}
Trust in agent (0=low, 1=high): {state.trust:.2f}
Channel: {body.channel}. Locale: {body.locale}.
Stay in character. Respond naturally and concisely (under 80 words for phone).
Return ONLY JSON: {{"reply":"...","mood_delta":0.0,"difficulty_delta":0.0,"trust_delta":0.0}}"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": body.user_message},
    ]
    raw = await chat_completion(messages, temperature=0.7, max_tokens=400)
    try:
        parsed = _parse_json_block(raw)
    except (ValueError, json.JSONDecodeError):
        parsed = {"reply": raw.strip()[:500], "mood_delta": 0, "difficulty_delta": 0, "trust_delta": 0}

    new_state = PersonaState(
        mood=_clamp(state.mood + float(parsed.get("mood_delta", 0))),
        difficulty=_clamp(state.difficulty + float(parsed.get("difficulty_delta", 0))),
        trust=_clamp(state.trust + float(parsed.get("trust_delta", 0))),
    )
    reply = str(parsed.get("reply") or "I need help with my account.")
    return PersonaTurnResponse(reply=reply, persona_state=new_state, audio_hint=reply)


@router.post("/coach/evaluate")
async def coach_evaluate(
    body: CoachEvaluateRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
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

    system = f"""You are Sudar, an AI coach for contact-center training.
Score the learner on rubric dimensions (0-100 each): {dim_desc}
Transcript:
{transcript_text}
CRM actions: {crm_text}
Return ONLY JSON:
{{"dimension_scores":{{"empathy":0}},"overall_score":0,"coach_narrative":"...","replay_moments":[{{"ts":"","issue":"","suggestion":""}}],"passed":true}}"""

    raw = await chat_completion([{"role": "system", "content": system}], temperature=0.3, max_tokens=1200)
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

    raw = await chat_completion(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": body.content[:12000]},
        ],
        temperature=0.5,
        max_tokens=1500,
    )
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

    raw = await chat_completion(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": body.transcript[:15000]},
        ],
        temperature=0.4,
        max_tokens=1800,
    )
    try:
        scenario = _parse_json_block(raw)
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="Failed to parse transcript scenario") from None
    if body.title:
        scenario["title"] = body.title
    scenario["locale"] = body.locale
    scenario["source"] = {"type": "transcript_import"}
    return {"success": True, "scenario": scenario}
