"""Locale routing for STT/TTS providers."""

LOCALE_CONFIG = {
    "en": {"stt_lang": "en", "tts_voice": "en-US-JennyNeural"},
    "en-US": {"stt_lang": "en", "tts_voice": "en-US-JennyNeural"},
    "fr": {"stt_lang": "fr", "tts_voice": "fr-FR-DeniseNeural"},
    "es": {"stt_lang": "es", "tts_voice": "es-ES-ElviraNeural"},
    "pt": {"stt_lang": "pt", "tts_voice": "pt-BR-FranciscaNeural"},
    "ta": {"stt_lang": "ta", "tts_voice": "ta-IN-PallaviNeural"},
    "ta-IN": {"stt_lang": "ta", "tts_voice": "ta-IN-PallaviNeural"},
}


def resolve_locale(locale: str) -> dict[str, str]:
    key = (locale or "en").strip()
    return LOCALE_CONFIG.get(key) or LOCALE_CONFIG.get(key.split("-")[0]) or LOCALE_CONFIG["en"]
