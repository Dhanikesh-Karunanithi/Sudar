# Subprocessors and data processors

**Deploy-specific:** this is the list for the hosted Sudar deployment (`*.thesudar.com`) as of 2026-09-29. Self-hosted deployments should maintain their own list. Optional services only receive data when their keys are configured.

| Service | Role | Typical data | When used |
|---------|------|--------------|-----------|
| Supabase | Database, auth, file storage | All application data (profiles, courses, learning events, tutor history) | Always |
| Cloudflare | Hosting for Studio, Learn, MCP worker (Workers/OpenNext), DNS, Web Analytics | HTTP request metadata, IP addresses, cookie-less page analytics | Always |
| Vercel | Staging hosting | HTTP request metadata for staging traffic | Staging only |
| Together AI | Primary model inference, embeddings, Llama Guard moderation | Prompts, course/module context snippets, learner questions | Always (primary provider) |
| OpenRouter | Model routing (Sudar AI platform models) | Prompts and context per routing decision | When the org uses Sudar AI routing |
| OpenAI | Fallback inference, moderation | Prompts and context when earlier providers fail | Fallback |
| Anthropic | Fallback inference | Prompts and context when earlier providers fail | Fallback |
| Hugging Face | Inference (chat, image, STT fallback, embeddings, rerank) | Prompts, audio clips for transcription, text for embeddings | When `HUGGINGFACE_API_KEY` / HF providers are configured |
| Deepgram | Speech-to-text for SudarSim voice and SudarNotes voice | Learner voice audio (not stored by Sudar after transcription) | When `DEEPGRAM_API_KEY` is set |
| Cartesia | Text-to-speech for streaming SudarSim voice | Persona reply text | When `CARTESIA_API_KEY` is set |
| Microsoft Edge TTS | Text-to-speech fallback (Listen modality, previews) | Text to be spoken | Default TTS when no paid TTS key |
| LiveKit (Cloud or self-hosted) | Real-time audio rooms for SudarSim voice | Live audio streams, room metadata | When `LIVEKIT_*` is configured |
| Resend (or configured SMTP) | Transactional email (invites, notifications) | Email addresses, message content | When email keys are set |
| Sentry | Error monitoring | Error name/message/stack, app, route pathname, environment. No request bodies, user ids or learner prompts | When `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` is set |
| YouTube Data API (Google) | Playlist search for Studio external course import | Admin search terms | When `YOUTUBE_API_KEY` / `GOOGLE_API_KEY` is set |

Customers should complete DPIA / transfer analysis (e.g. SCCs) against **their** final list. Data flows per feature: [DATA_FLOWS.md](DATA_FLOWS.md). AI systems: [AI_SYSTEM_REGISTER.md](AI_SYSTEM_REGISTER.md).
