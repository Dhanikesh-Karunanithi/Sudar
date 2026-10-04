"""Pipecat voice pipeline for SudarSim roleplay sessions."""

from __future__ import annotations

import asyncio
import logging
import os
import time
from typing import Any

from pipecat.frames.frames import (
    EndFrame,
    Frame,
    InterruptionFrame,
    TextFrame,
    TranscriptionFrame,
    TTSSpeakFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.transports.livekit.transport import LiveKitParams, LiveKitTransport

from agent.context import (
    AgentSessionContext,
    build_scenario_context,
    fetch_session_context,
    voice_id_from_scenario,
)
from agent.intelligence_persona import IntelligencePersonaProcessor
from agent.sync import emit_voice_event, sync_turn

logger = logging.getLogger(__name__)


async def run_voice_agent(
    *,
    livekit_url: str,
    agent_token: str,
    room_name: str,
    session_id: str,
    user_id: str,
    locale: str = "en",
) -> None:
    """Join a LiveKit room and run the SudarSim voice pipeline until the room ends."""
    ctx = await fetch_session_context(session_id, user_id)
    ctx.locale = locale or ctx.locale

    transport = LiveKitTransport(
        url=livekit_url,
        token=agent_token,
        room_name=room_name,
        params=LiveKitParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_enabled=True,
            vad_analyzer=None,
        ),
    )

    deepgram_key = os.getenv("DEEPGRAM_API_KEY", "").strip()
    cartesia_key = os.getenv("CARTESIA_API_KEY", "").strip()
    if not deepgram_key or not cartesia_key:
        raise RuntimeError("DEEPGRAM_API_KEY and CARTESIA_API_KEY are required for streaming voice")

    stt = DeepgramSTTService(
        api_key=deepgram_key,
        live_options={
            "model": os.getenv("DEEPGRAM_MODEL", "nova-2"),
            "language": ctx.locale.split("-")[0] if ctx.locale else "en",
            "smart_format": True,
            "interim_results": True,
        },
    )

    voice_id = voice_id_from_scenario(ctx.scenario) or os.getenv("CARTESIA_VOICE_ID", "").strip() or None
    tts = CartesiaTTSService(
        api_key=cartesia_key,
        voice_id=voice_id or "a0e99841-438c-4a64-b679-ae501e7d6091",
    )

    persona = IntelligencePersonaProcessor(
        session_ctx=ctx,
        scenario_context=build_scenario_context(ctx.scenario),
        on_partial_transcript=lambda text: _send_transcript(transport, text, partial=True),
    )

    pipeline = Pipeline([transport.input(), stt, persona, tts, transport.output()])
    task = PipelineTask(pipeline, params=PipelineParams(allow_interruptions=True))
    runner = PipelineRunner()

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport_instance, participant_id: str) -> None:
        del transport_instance, participant_id
        if ctx.opening_spoken:
            return
        opening = ""
        persona_obj = ctx.scenario.get("persona")
        if isinstance(persona_obj, dict):
            opening = str(persona_obj.get("opening_line") or "").strip()
        if opening:
            ctx.opening_spoken = True
            await task.queue_frames([TTSSpeakFrame(opening)])
            await sync_turn(
                session_id,
                customer_text=opening,
                persona_state=ctx.persona_state,
            )
            ctx.history.append({"role": "customer", "text": opening})
        await emit_voice_event(session_id, "agent_ready", {"room": room_name})

    @transport.event_handler("on_participant_disconnected")
    async def on_participant_disconnected(transport_instance, participant_id: str) -> None:
        del transport_instance, participant_id
        await task.queue_frame(EndFrame())

    try:
        await runner.run(task)
    except asyncio.CancelledError:
        logger.info("Voice agent cancelled for room %s", room_name)
    except Exception:
        logger.exception("Voice agent failed for room %s", room_name)
        raise


async def _send_transcript(transport: LiveKitTransport, text: str, *, partial: bool) -> None:
    import json

    try:
        await transport.send_message(
            json.dumps({"type": "transcript", "text": text, "partial": partial}),
        )
    except Exception:
        logger.debug("Failed to send transcript data message", exc_info=True)
