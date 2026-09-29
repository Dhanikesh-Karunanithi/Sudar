# Sudar decision log

Short ADR-style entries. Newest first. Each entry: context, decision, consequence. If you reverse a decision, add a new entry rather than editing the old one.

---

### D-017 (2026-09-29) Authored content must pass a quality gate before it is saved
- **Context:** Quality scores were computed and ignored; no moderation; docs overclaimed Llama Guard and fact-checking.
- **Decision:** Every generator that persists learner-facing content validates with Zod, moderates, scores with the pedagogy rubric, regenerates below threshold, and records per-issue details. Publishing is blocked while high-severity issues are unresolved. Contract: `.cursor/rules/content-generation.mdc`.
- **Consequence:** Generation is slower and costs more per module; in exchange the quality floor is enforced and visible to authors.

### D-016 (2026-09-29) Deploys wait for lint and tests
- **Decision:** Cloudflare deploy workflows have a `verify` job; `deploy` `needs: verify`. Studio gained a vitest suite.

### D-015 (2026-09-29) Usage metering fails closed in production only
- **Context:** A missing or failing `increment_usage_request_count` RPC previously allowed unlimited AI spend; fail-closed everywhere broke local dev.
- **Decision:** Production fails closed (503); development fails open with a warning.

### D-014 (2026-09-15) Clean-slate wipe; Cavi is the sandbox org
- **Decision:** Pilot (Talisma/Foundever) data wiped; schemas kept. Personal sandbox org **Cavi**. Testers get a separate beta org provisioned by `scripts/ops/provision-pilot-org.mjs` / `scripts/seed-demo.mjs`.

### D-013 (2026-09-15) Migrations applied via Supabase MCP
- **Decision:** Prod migrations are applied through the Supabase MCP `apply_migration` tool. Remote versions differ from filenames by design; verify by name. No `supabase db push` to prod.

### D-012 (2026-09-10) Studio middleware passes Bearer requests to `/api/*`
- **Context:** ChatGPT/Cursor MCP calls Studio APIs without cookies.
- **Decision:** Middleware lets `Authorization: Bearer` through; routes authenticate themselves. An explicit allowlist of Bearer-capable routes is the follow-up (security Phase 1).

### D-011 (2026-09-10) Remote MCP is stateless on Cloudflare Workers
- **Decision:** `mcp.thesudar.com` uses stateless Streamable HTTP + JSON responses and OAuth 2.1 PKCE, with Studio login as the consent screen.

### D-010 (2026-07-28) Teaching OS is the shared spine; SudarNotes is a client of it
- **Decision:** Claims, mastery, scheduler, and pedagogy engine live in `sudar-learn/src/lib/teaching`. SudarNotes, the tutor, quizzes, and SudarSim write evidence to the same claim mastery. SudarNotes coexists with authored courses; it does not replace them.

### D-009 (2026-07-28) SudarSim voice = LiveKit + Pipecat with typed fallback
- **Decision:** Streaming duplex voice via LiveKit rooms and a Pipecat agent (Deepgram STT, Cartesia TTS). Turn-based push-to-talk through Intelligence (HF Whisper, Edge TTS) and typed turns remain as fallbacks and must always work.

### D-008 (2026) Studio and Learn production run on Cloudflare Workers (OpenNext)
- **Decision:** Production frontends on Cloudflare Workers; marketing on Cloudflare Pages. Vercel may remain for staging only. `NEXT_PUBLIC_*` values are injected at build time in GitHub Actions.

### D-007 (2026) One Supabase project for prod and staging
- **Decision:** Single project, separated by hostname and org. Cheaper and simpler for a solo builder; the cost is that staging tests touch prod data, so testers get their own org.

### D-006 (2026) Next Best Action is owned by Learn
- **Decision:** `sudar-learn/src/lib/intelligence/nextBestActionEngine.ts` is canonical. Intelligence does not compute NBA or twin rollups.

### D-005 (2026) Provider chain: org runtime -> OpenRouter -> Together -> OpenAI -> Anthropic
- **Decision:** `shared/ai/platformChat.ts` tries the org's private runtime / Sudar AI first, then OpenRouter (`gpt-4o-mini` default), Together (Llama 3.3 70B), OpenAI, Anthropic. Supersedes the older "Together first" wording in `.cursorrules`.

### D-004 (2026) Supabase is the runtime data layer; Prisma is leftover
- **Decision:** Runtime access via `@supabase/ssr` and service-role clients. Canonical DDL in `supabase/migrations/`. `prisma/` folders are not used at runtime.

### D-003 (2026) Five learning personas, not fourteen templates
- **Decision:** Visual themes are the 5 personas in `sudar-studio/src/lib/themes/learningPersonas.ts`. Course templates in `courseTemplates.ts` are structural starters, not skins.

### D-002 (2026) Monorepo "Option A"
- **Decision:** Keep Studio, Learn, Intelligence, SudarVid, SudarSim, MCP, workers, integrations in one repo. Portfolio material moves out.

### D-001 (2026) Product is Sudar; ByteOS is legacy
- **Decision:** All naming is Sudar (Studio, Learn, Intelligence; tutor named "Sudar"). Folder names like `sudar-studio` are legacy but stay. Canonical repo `Dhanikesh-Karunanithi/Sudar`.
