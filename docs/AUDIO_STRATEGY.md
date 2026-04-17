# Sudar Audio Strategy: Read-Along + Audiobook/Podcast Listen

Design and implementation record for audio features in Sudar.

---

## Summary

- **Read-along:** On the **Reading** modality, a "Listen" (read aloud) button uses **browser TTS** and highlights the current sentence so the learner can follow along. No server TTS required for this path.
- **Listen modality:** Delivers course content as **audiobook/podcast-style** audio using **high-quality TTS** (Edge-TTS first). Never falls back to browser TTS; show "unavailable" + retry when Intelligence is down.
- **Model selection:** Unified card-grid UI for choosing **LLM** (Tutor, content generation) and **TTS** model/voice. Studio = org/course defaults; Learn = learner preferences (e.g. preferred TTS voice).
- **Voice preview:** Learn and Studio settings include per-voice sample playback so users can compare tone and clarity before saving a preference.

---

## Decisions

| Decision | Choice |
|----------|--------|
| Read-along engine | Server TTS (Edge-TTS via `/api/ai/generate-audio`) for human-quality voice; same as Listen modality. |
| Read-along UI | No transcript container; highlight the active sentence in place in the main content (ReadingBodyWithSentences). |
| Listen modality fallback | No browser TTS; show "Audio unavailable" + Retry when Intelligence fails. |
| Phase 2a | Edge-TTS improvement (voice, rate, chunking) + remove browser fallback for Listen. |
| TTS backends | Edge-TTS first (built-in catalog); optional providers shown as status sections until full provider-library fetch is enabled. |
| Highlight granularity | Sentence-level first; word-level as follow-up if needed. |
| Voice preview content | Each voice reads a short Sudar-specific sample line to make side-by-side comparison easier. |
| Voice mapping reliability | Voice IDs are validated in settings APIs and reused directly in generation routes to avoid drift. |
| India naming migration | Canonical IDs are `india_shreya` and `india_shubh`; legacy `sarvam_*` IDs are normalized on read/write for backward compatibility. |

---

## ByteLab References

Reference implementations for podcast/audio generation:

| Path | Purpose |
|------|---------|
| `bytelab(old)/bytelab/podcastfy_integration.py` | Conversational podcast from course content (LLM + TTS). |
| `bytelab(old)/bytelab/podcast_generator.py` | Podcast generation entry point. |
| `bytelab(old)/bytelab/audio_integration.py` | Podcast-to-audio JSON, copy/move generated audio. |
| `bytelab(old)/bytetexttovid/audio_generator.py` | Segment-level Edge-TTS, `audio_timing.json`. |
| `bytelab(old)/bytelab/vtt_generator.py` | VTT captions from content_blocks (start/end + text). |
| `bytelab(old)/podcastfy-main/.../podcastfy/tts/factory.py` | TTS provider factory (edge, openai, elevenlabs, gemini, geminimulti). |
| `bytelab(old)/podcastfy-main/.../podcastfy/tts/providers/edge.py` | Edge TTS provider implementation. |

Course output `audio_timing.json` and `content_blocks` (start/end, text) are used for phrase-level sync and future read-along with server-generated audio.

---

## TTS Options Comparison

| Option | Pros | Cons |
|--------|------|------|
| **Edge-TTS** | Free, multilingual, broad accent coverage, already in Intelligence. | Limited expressiveness controls vs premium providers. |
| **Sarvam (Bulbul)** | Indian languages + English (Indian), expressive, API. | API key, not self-hosted. |
| **Coqui XTTS-v2** | Self-hosted, audiobook-quality, voice clone. | Heavier; GPU/CPU. |
| **ElevenLabs / OpenAI** | High quality. | Paid, API-dependent. |

**Chosen default:** Edge-TTS with configurable voice and rate, including expanded multilingual options and static per-voice preview assets.

---

## Implementation Progress

- [x] **doc-audio-strategy** — Add docs/AUDIO_STRATEGY.md (this file)
- [x] **read-along-ui** — Read-along on Reading: Listen button + browser TTS + sentence highlight
- [x] **listen-no-fallback** — Listen: remove browser TTS fallback; show unavailable + retry
- [x] **edge-tts-improve** — Intelligence: configurable voice, rate, chunking
- [x] **model-picker-component** — Reusable ModelPicker (card grid) for LLM/TTS
- [x] **unified-settings-studio** — Studio: AI models settings (Tutor, TTS, generation)
- [x] **unified-settings-learn** — Learn: learner TTS voice (and optional Tutor) preferences
- [x] **persist-preferences** — Persist org/learner preferences in Supabase
- [x] **wire-tts-backend** — Pass voice/provider from Learn/Studio to generate-audio and /api/audio
- [x] **optional-sarvam-xtts** — (Optional) Sarvam backend in Intelligence; exposed in TTS picker
- [x] **ecosystem-audio** — ECOSYSTEM.md Audio subsection + model-selection behaviour
- [x] **voice-preview-per-option** — Learn + Studio settings can preview each TTS voice via static pre-generated MP3 assets
- [x] **studio-tts-reliability** — Studio generation reads org default `ai_models.tts_voice`, forwards Intelligence auth, and returns clear errors when generation fails
- [x] **india-voice-migration** — Migrate legacy `sarvam_*` IDs to canonical `india_*` IDs with compatibility aliases
- [x] **provider-status-sections** — Learn + Studio voice settings display provider connection status placeholders (no live provider voice fetch in this phase)

---

## Open Questions / Follow-ups

- Word-level vs sentence-level read-along: sentence-level first; word-level if browser boundary events prove reliable.
- Podcast-style pipeline timeline: Phase 2c (LLM script + multi-segment TTS + timing) is later.
- Learner preference storage: `learner_profiles` JSONB or dedicated `learner_preferences` table.
