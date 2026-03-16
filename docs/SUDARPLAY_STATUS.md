# SudarPlay — Status & Testing Checklist

**Last updated**: 2026-03-15

SudarPlay is the game-based learning modality (Modality 7) built on WorkAdventure. This doc summarizes what’s implemented, what’s stubbed, and what you need to run an end-to-end test.

---

## What’s done

| Area | Status | Notes |
|------|--------|------|
| **DB schema** | Done | Migration `supabase/migrations/20260313_sudarplay.sql`: `sudarplay_maps`, `sudarplay_sessions`, `modules.sudarplay_map_url` / `sudarplay_map_id` / `sudarplay_config`, RLS. |
| **Intelligence API** | Partial | Router mounted at `/api/sudarplay`. **Implemented**: `launch.py` (launch-token), `events.py` (event logging), `auth.py` (JWT verification), `schemas.py`. **Stubs**: `npc_chat.py`, `quiz_gate.py`, `complete.py`, `generate_map.py`. |
| **Learn app** | Done | `/sudarplay/launch` page: gets JWT from Intelligence, redirects to WorkAdventure with token. **Play button**: Course viewer shows a “Play” tab when a module has `sudarplay_map_url`; it links to `/sudarplay/launch?module_id=...`. |
| **Studio** | Schema only | Prisma has `sudarplayMapUrl`, `sudarplayMapId`, `sudarplayConfig` on Module. No “Generate game map” UI yet (Milestone 3). |
| **WorkAdventure** | Script only | `workadventure/scripts/wa-bridge.ts` — Sudar API bridge (log event, NPC chat, quiz, complete). WA itself must be self-hosted. |

---

## What’s needed to test

### 1. Apply the migration

From repo root:

```bash
supabase db push
# or apply supabase/migrations/20260313_sudarplay.sql manually in Supabase SQL editor
```

Confirm: `sudarplay_maps`, `sudarplay_sessions` exist; `modules` has `sudarplay_map_url`, `sudarplay_map_id`, `sudarplay_config`.

### 2. Configure Intelligence

In `byteos-intelligence/.env` (or `.env.local`):

- **`SUDARPLAY_JWT_SECRET`** — Required. Min 32 characters (used to sign launch JWTs). Example: `openssl rand -base64 32`
- **`WA_INSTANCE_URL`** — Base URL of your WorkAdventure instance (e.g. `https://play.sudar.app` or `http://localhost` if running WA locally)
- Supabase env vars must be set (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) so launch can read modules and create sessions

### 3. Configure Learn

- **`BYTEOS_INTELLIGENCE_URL`** — Must point to your Intelligence API (e.g. `http://localhost:8000` or your deployed URL). The launch page calls `${BYTEOS_INTELLIGENCE_URL}/api/sudarplay/launch-token`.

### 4. Give a module a SudarPlay map

Map generation is not implemented yet (Milestone 3). To test launch and events:

1. **Create a map row** (e.g. in Supabase SQL or Studio):

   - Insert into `sudarplay_maps`: `module_id`, `course_id`, `created_by` (your user UUID), `status = 'ready'`, and optionally `map_file_url` if your WA serves maps from a URL.
2. **Link the module** to that map:

   - Update `modules` set `sudarplay_map_id = <sudarplay_maps.id>`, `sudarplay_map_url = <full URL to the map JSON or WA map path>`.
   - The launch endpoint uses `sudarplay_map_id` and builds `wa_url` as `{WA_INSTANCE_URL}/maps/{map_id}`. So your WorkAdventure instance must serve a map at that path (or you need to align how WA resolves map IDs to your `sudarplay_map_url`).

### 5. Run WorkAdventure

- Self-host WorkAdventure (see `.cursor/ARCHITECTURE-SudarPlay.md` and implementation guide: `docker-compose` in `workadventure/`).
- Ensure `WA_INSTANCE_URL` matches the URL learners will use (e.g. `https://play.sudar.app`).

### 6. WA → Intelligence URL (for event logging)

- `workadventure/scripts/wa-bridge.ts` uses a hardcoded `SUDAR_API`. For local testing, change it to your Intelligence base URL (e.g. `http://localhost:8000`) or make it configurable (e.g. from map or build env) so WA can call `/api/sudarplay/event` and other endpoints.

---

## Minimal test flow

1. Run migration; set env vars (Intelligence + Learn); run Intelligence and Learn locally.
2. Assign a SudarPlay map to one module (manual DB update as above).
3. Run WorkAdventure and point `WA_INSTANCE_URL` at it.
4. In Learn, open a course that contains that module; click the **Play** tab → you should be redirected to `/sudarplay/launch`, then to WorkAdventure with a token.
5. If the map loads in WA, any event logging from the map (via `wa-bridge.ts`) will hit Intelligence `/api/sudarplay/event` and write to `learning_events` with `modality = 'sudarplay'`.

---

## Next implementation steps (from IMPLEMENTATION-GUIDE-SudarPlay.md)

- **Milestone 2**: Implement NPC chat and quiz gate endpoints + overlays so learners can talk to NPCs and pass gates.
- **Milestone 3**: Implement AI map generator (`generate_map.py`) and Studio “Generate game map” UI so modules get maps without manual DB edits.
- **Milestone 4**: Session complete endpoint, completion page, modality dispatcher entry, analytics check.
- **Milestone 5**: Polish, code lab, object overlays, pilot.

For full build order and file references, see `.cursor/IMPLEMENTATION-GUIDE-SudarPlay.md`.
