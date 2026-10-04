# Run Sudar locally

One command starts everything that is configured, after checking your env.

```bash
npm run dev:check   # env preflight only (exit 1 if something required is missing)
npm run dev:all     # start the stack
```

Options: `--only=learn,intelligence`, `--no-vid` (skip SudarVid), `--no-voice` (skip sudar-sim + LiveKit), `--force` (start despite missing required env).

## What starts

| Service | Port | Started when |
|---|---|---|
| Sudar Studio | 3000 | always |
| Sudar Learn | 3001 | always |
| Sudar Intelligence | 8001 | always (reused if `/api/health` answers) |
| SudarVid | 8000 | unless `--no-vid` (reused if `/health` answers) |
| sudar-sim | 8090 | streaming voice keys present (`LIVEKIT_URL`, `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY` in `sudar-sim/.env`) |
| LiveKit (Docker) | 7880 | same as sudar-sim, and Docker is running |

Each app reads its own `.env` / `.env.local`. Copy the `.env.example` next to each app to start. The preflight tells you which features are off and why.

## First-time setup

1. `npm ci` in `sudar-studio` and `sudar-learn`; `pip install -r requirements.txt` in `sudar-intelligence` (and `sudar-sim`, `sudar_vid` if you use them). Python 3.11+.
2. Fill `sudar-studio/.env.local`, `sudar-learn/.env.local`, `sudar-intelligence/.env.local` (Supabase URL + anon + service-role keys, one AI provider key). See [ENV_REFERENCE.md](ENV_REFERENCE.md).
3. `npm run dev:check`, then `npm run dev:all`.
4. Seed demo content into your org:

   ```bash
   ORG_SLUG=<your-org-slug> CREATED_BY_EMAIL=<you@example.com> npm run seed:demo
   ```

   Add `LEARNER_EMAILS=a@x.com,b@y.com` to enrol existing learner accounts.

## Voice (optional)

- Streaming voice: `docker compose -f sudar-sim/docker-compose.livekit.yml up -d`, then set `LIVEKIT_URL=ws://localhost:7880`, `LIVEKIT_API_KEY=devkey`, `LIVEKIT_API_SECRET=secret`, `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY` in `sudar-sim/.env`, and `SUDAR_SIM_URL=http://localhost:8090` in `sudar-learn/.env.local`.
- Without those, sims and SudarNotes voice use push-to-talk through Intelligence (Deepgram or HF Whisper for STT, Cartesia or Edge TTS for speech), and typing always works.

## Troubleshooting

- **Tutor or generation returns 503 "usage metering unavailable"**: production-only behaviour when the `increment_usage_request_count` RPC fails. In dev it logs a warning and allows the request.
- **Voice connects but nothing is heard**: check the browser console for CSP `connect-src` errors; add your LiveKit origin via `NEXT_PUBLIC_LIVEKIT_URL`.
- **Port already in use**: SudarVid owns 8000, Intelligence 8001. Stop the old process or reuse it (the launcher detects healthy services).
- **PowerShell**: use `;` between commands, and `$env:NAME='value'` to set env for a single session.
