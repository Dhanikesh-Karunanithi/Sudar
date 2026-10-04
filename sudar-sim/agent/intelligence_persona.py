"""Calls Sudar Intelligence persona/turn from the Pipecat pipeline."""

from __future__ import annotations

import logging
import os
import time
from typing import Awaitable, Callable

import httpx
from pipecat.frames.frames import (
    Frame,
    TextFrame,
    TranscriptionFrame,
    TTSSpeakFrame,
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from agent.context import AgentSessionContext
from agent.sync import sync_turn

logger = logging.getLogger(__name__)

INTELLIGENCE_URL = (os.getenv("SUDAR_INTELLIGENCE_URL") or "http://localhost:8001").rstrip("/")
INTEL_SECRET = os.getenv("INTELLIGENCE_SERVICE_SECRET", "").strip()


class IntelligencePersonaProcessor(FrameProcessor):
    """Turn final learner transcripts into customer replies via Intelligence."""

    def __init__(
        self,
        *,
        session_ctx: AgentSessionContext,
        scenario_context: dict,
        on_partial_transcript: Callable[[str], Awaitable[None]] | None = None,
    ) -> None:
        super().__init__()
        self._ctx = session_ctx
        self._scenario_context = scenario_context
        self._on_partial = on_partial_transcript
        self._pending_transcript = ""
        self._processing = False

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame):
            text = (frame.text or "").strip()
            if not text:
                return
            is_final = getattr(frame, "is_final", getattr(frame, "final", True))
            if is_final is False:
                if self._on_partial:
                    await self._on_partial(text)
                return
            self._pending_transcript = text
            return

        if isinstance(frame, UserStartedSpeakingFrame):
            await self.push_frame(frame, direction)
            return

        if isinstance(frame, UserStoppedSpeakingFrame):
            await self.push_frame(frame, direction)
            learner_text = self._pending_transcript.strip()
            self._pending_transcript = ""
            if learner_text and not self._processing:
                await self._handle_learner_turn(learner_text)
            return

        await self.push_frame(frame, direction)

    async def _handle_learner_turn(self, learner_text: str) -> None:
        self._processing = True
        started = time.monotonic()
        try:
            result = await self._persona_turn(learner_text)
            reply = str(result.get("reply") or "").strip()
            persona_state = result.get("persona_state") or self._ctx.persona_state
            if isinstance(persona_state, dict):
                self._ctx.persona_state = {
                    "mood": float(persona_state.get("mood", self._ctx.persona_state["mood"])),
                    "difficulty": float(persona_state.get("difficulty", self._ctx.persona_state["difficulty"])),
                    "trust": float(persona_state.get("trust", self._ctx.persona_state["trust"])),
                }

            latency_ms = int((time.monotonic() - started) * 1000)
            await sync_turn(
                self._ctx.session_id,
                learner_text=learner_text,
                customer_text=reply or None,
                persona_state=self._ctx.persona_state,
                latency_ms=latency_ms,
            )

            self._ctx.history.append({"role": "learner", "text": learner_text})
            if reply:
                self._ctx.history.append({"role": "customer", "text": reply})
                await self.push_frame(TTSSpeakFrame(reply))
        except Exception:
            logger.exception("Persona turn failed")
            await self.push_frame(
                TTSSpeakFrame("Sorry, I lost you for a moment. Could you say that again?"),
            )
        finally:
            self._processing = False

    async def _persona_turn(self, learner_text: str) -> dict:
        headers = {"Content-Type": "application/json"}
        if INTEL_SECRET:
            headers["X-Intelligence-Service-Secret"] = INTEL_SECRET

        payload = {
            "session_id": self._ctx.session_id,
            "user_id": self._ctx.user_id,
            "user_message": learner_text,
            "persona_state": self._ctx.persona_state,
            "scenario_id": self._ctx.scenario_id or None,
            "locale": self._ctx.locale,
            "channel": "phone",
            "scenario_context": self._scenario_context,
            "history": self._ctx.history[-24:],
        }
        voice_id = None
        persona = self._ctx.scenario.get("persona")
        if isinstance(persona, dict) and isinstance(persona.get("voice_id"), str):
            voice_id = persona["voice_id"].strip() or None
        if voice_id:
            payload["voice"] = voice_id

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                f"{INTELLIGENCE_URL}/api/sim/persona/turn",
                headers=headers,
                json=payload,
            )
            if not res.is_success:
                raise RuntimeError(res.text[:400])
            return res.json()
