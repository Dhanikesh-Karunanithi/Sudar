import asyncio
from pathlib import Path

import edge_tts


SAMPLES = {
    "en-US-JennyNeural": (
        "en-US-JennyNeural",
        "Did you know Sudar can personalize your learning path based on how you study best?",
    ),
    "en-US-AriaNeural": (
        "en-US-AriaNeural",
        "Sudar is designed to make every lesson feel like it was built just for you.",
    ),
    "en-US-AnaNeural": (
        "en-US-AnaNeural",
        "With Sudar, your courses adapt in real time so learning stays clear and engaging.",
    ),
    "en-US-GuyNeural": (
        "en-US-GuyNeural",
        "Sudar helps you move from confusion to confidence with guided, adaptive support.",
    ),
    "en-US-ChristopherNeural": (
        "en-US-ChristopherNeural",
        "Sudar combines AI tutoring, progress insights, and modality switching in one platform.",
    ),
    "en-GB-SoniaNeural": (
        "en-GB-SoniaNeural",
        "Sudar can recommend what to learn next using your pace, progress, and preferences.",
    ),
    "en-GB-LibbyNeural": (
        "en-GB-LibbyNeural",
        "Learn with Sudar in text, audio, video, and more, while your learner profile keeps improving.",
    ),
    "en-GB-RyanNeural": (
        "en-GB-RyanNeural",
        "Sudar gives every learner a personal, non-judgmental tutor experience.",
    ),
    "en-IN-NeerjaNeural": (
        "en-IN-NeerjaNeural",
        "Sudar is built to support diverse learners with adaptive, personalized learning journeys.",
    ),
    "india_shreya": (
        "en-IN-NeerjaNeural",
        "Did you know Sudar can turn one course into multiple learning modalities for better outcomes?",
    ),
    "india_shubh": (
        "en-IN-PrabhatNeural",
        "Sudar is designed to learn with you, for you, every time you come back to study.",
    ),
    "en-AU-NatashaNeural": (
        "en-AU-NatashaNeural",
        "Sudar helps you learn faster by adapting lessons to how you engage.",
    ),
    "en-CA-ClaraNeural": (
        "en-CA-ClaraNeural",
        "Sudar keeps your learning journey personalized across every modality.",
    ),
    "hi-IN-SwaraNeural": (
        "hi-IN-SwaraNeural",
        "Sudar aapke learning style ke hisaab se content ko personalize karta hai.",
    ),
    "es-ES-ElviraNeural": (
        "es-ES-ElviraNeural",
        "Sudar adapta cada curso para mejorar tu progreso de aprendizaje.",
    ),
    "fr-FR-DeniseNeural": (
        "fr-FR-DeniseNeural",
        "Sudar adapte vos cours selon votre rythme et vos preferences.",
    ),
    "de-DE-KatjaNeural": (
        "de-DE-KatjaNeural",
        "Sudar passt Inhalte an, damit Lernen klarer und effektiver wird.",
    ),
    "ja-JP-NanamiNeural": (
        "ja-JP-NanamiNeural",
        "Sudar wa anata no manabikata ni awasete content o saitekika shimasu.",
    ),
    "pt-BR-FranciscaNeural": (
        "pt-BR-FranciscaNeural",
        "Sudar personaliza suas aulas para acelerar seu aprendizado.",
    ),
}


async def write_samples(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for sample_id, (voice, text) in SAMPLES.items():
        path = output_dir / f"{sample_id}.mp3"
        communicator = edge_tts.Communicate(text, voice, rate="+0%")
        await communicator.save(str(path))
        print(f"wrote {path}")


async def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    learn_dir = repo_root / "sudar-learn" / "public" / "audio" / "voice-previews"
    studio_dir = repo_root / "sudar-studio" / "public" / "audio" / "voice-previews"
    await write_samples(learn_dir)
    await write_samples(studio_dir)


if __name__ == "__main__":
    asyncio.run(main())
