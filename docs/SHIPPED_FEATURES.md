# Sudar — Shipped Features (Documentation)

This document summarizes **shipped** features that are committed and ready for use. For current state and gaps, see [STRATEGIC_PATH.md](STRATEGIC_PATH.md) §2.

---

## Pilot orgs — multi-org admin + Sudar AI tier (June 2026)

- **Where**: Staging Sudar Studio (`sudar-studio.vercel.app`); org switcher in sidebar; **Platform → Organisations** switch action; **Org settings → Sudar AI (included for pilots)**.
- **What**: Platform operators can provision Talisma/Foundever pilot orgs with included **Sudar AI** (FreeLLMAPI proxy, white-labeled). Super admins with multiple org memberships switch active workspace in Studio. Chat/tutor routes: org private BYOM → Sudar AI → cloud fallback (Together/OpenAI/Anthropic). Per-org monthly token caps via `ai_entitlements`.
- **Key files**:
  - `supabase/migrations/20260620100000_profiles_active_org_id.sql`
  - `shared/ai/orgAiPlatform.ts`, `shared/ai/platformChat.ts`
  - `sudar-studio/src/lib/org.ts`, `src/app/api/org/memberships/route.ts`, `src/app/api/org/switch/route.ts`, `src/components/layout/OrgSwitcher.tsx`
  - `sudar-studio|sudar-learn/src/lib/ai/chat.ts`
  - `sudar-intelligence/src/core/ai_client.py`, `src/runtime/router.py`
  - `scripts/ops/bootstrap-freellmapi.mjs`, `scripts/ops/provision-pilot-org.mjs`
  - `docs/PILOT_ONBOARDING.md`
- **Env**: `ALLOW_ORG_PLATFORM_AI=true`, `FREELLMAPI_BASE_URL`, `FREELLMAPI_API_KEY`, `TOGETHER_API_KEY` (fallback), `ADMIN_EMAILS`, `EARLY_ACCESS_ENABLED` on staging.
- **Ops**: `node scripts/ops/provision-pilot-org.mjs` after migration; bootstrap FreeLLMAPI via `node scripts/ops/bootstrap-freellmapi.mjs`.

---

## Early access gate (June 2026)

- **Where**: Sudar Learn + Sudar Studio signup/login; Studio **`/early-access`** (super admin / `ADMIN_EMAILS`); public **`/signup/waitlist`**; persistent **Early Access** banner on all pages when enabled.
- **What**: New self-signup users must redeem an early-access invite code before using the platform. Waitlist captures interest; operators issue single-use codes. Org-invited and admin-provisioned users bypass the gate. Existing users are grandfathered on migration. A slim top banner labels the platform as **Early Access** with an experimental-prototype disclaimer for demos.
- **Key files**:
  - `supabase/migrations/20260617000000_early_access.sql`, `20260617000001_early_access_auth_hook.sql`
  - `shared/access/` — invite validation, access checks, auth callback helpers
  - `sudar-learn|sudar-studio/src/app/signup/SignupClient.tsx`, `src/middleware.ts`, `src/app/auth/callback/route.ts`
  - `sudar-learn|sudar-studio/src/components/branding/EarlyAccessBanner.tsx`, `src/app/layout.tsx`
  - `sudar-studio/src/app/(dashboard)/early-access/page.tsx`, `src/app/api/early-access/admin/route.ts`
  - `scripts/configure-auth-signup.mjs`
  - `supabase/templates/invite.html`, `scripts/ops/update-supabase-email-templates.mjs` — branded org-invite email (Supabase Auth template); personalized with `invited_by_name` + `org_name` from Studio invite API
- **Flow**:
  1. User joins waitlist or receives invite code from operator.
  2. `/signup` → validate code → email or Google signup with invite metadata.
  3. Middleware allows app access when `signup_code_used` is set (or exempt tier/role).
- **Env**: `EARLY_ACCESS_ENABLED=true` on Learn + Studio; optional `ADMIN_EMAILS` on Studio. Banner on by default (`NEXT_PUBLIC_EARLY_ACCESS_BANNER=false` to hide).
- **Database**: Apply migrations; run auth hook script or wire `hook_before_user_created` in Supabase Dashboard.

---

## Learn course viewer — slim SSR + lazy module load (June 2026)

- **Where**: Sudar Learn — `/courses/[id]/learn` (CourseViewer).
- **What**: Course pages no longer serialize every module’s content and embedded audio blobs in the initial SSR payload (which could exceed Cloudflare Worker memory limits). Only the active module’s `content`/`quiz` is server-rendered; switching modules or opening video/podcast/mindmap fetches the rest on demand.
- **Key files**:
  - `sudar-learn/src/lib/learn/coursePayloadSlim.ts` — strips `audioDataURL` from `video_scenes` / `podcast_dialogue` in SSR settings.
  - `sudar-learn/src/app/(dashboard)/courses/[id]/learn/page.tsx` — slim module list + active module seed.
  - `sudar-learn/src/app/(dashboard)/courses/[id]/learn/CourseViewer.tsx` — client lazy-load orchestration.
  - `sudar-learn/src/app/api/learn/course-module/route.ts` — per-module `content` + `quiz`.
  - `sudar-learn/src/app/api/learn/course-media/route.ts` — full `video_scenes` / `podcast_dialogue` with audio blobs.
  - `sudar-learn/src/app/api/learn/course-module-bodies/route.ts` — plain-text bodies for course-scope mindmap.
- **Flow**:
  1. Learner opens course → SSR returns titles/order + active module content only.
  2. Learner switches module → client fetches `/api/learn/course-module?course_id&module_id`.
  3. Video/podcast modality → client fetches `/api/learn/course-media?course_id` when needed.
  4. Course mindmap → client fetches module bodies then calls generate-mindmap API.

---

## teachwithsudar mobile swipe carousels (June 2026)

- **Where**: teachwithsudar homepage hero, platform/modalities/research sections, `/guides/*` workflows, `/store` catalog.
- **What**: On viewports below `md`, card grids and animated demos use horizontal scroll-snap swipe rails with dot/chevron controls instead of auto-advancing or long vertical stacks. Hero demo mounts scenes lazily (active ±1) and disables 3D parallax on touch.
- **Key files**: `teachwithsudar/src/components/ui/SwipeCardStrip.tsx`, `ResponsiveCardGrid.tsx`, `teachwithsudar/src/hooks/useMediaQuery.ts`, `teachwithsudar/src/components/home/HeroFlowDemo.tsx`, `PlatformAtAGlance.tsx`, `MarketingHomePage.tsx`, `AnimatedWorkflow.tsx`, `StoreCatalog.tsx`.
- **Flow**: Mobile visitor lands on homepage → swipes hero demo steps manually → swipes modality/platform/research cards → on guide pages swipes workflow steps; desktop keeps grids and hero auto-play.

---

## Content & UX improvement (June 2026)

- **Where**: teachwithsudar marketing pages; Sudar Studio `/onboarding`, `/tools`, `/settings/governance`, dashboard; Sudar Learn `/onboarding`, `/leaderboard`, `/gamification`, home dashboard.
- **What**: Honest six-modality messaging; Studio first-run wizard; Learn onboarding gate with verify step; sparse/active home layouts; org leaderboard page; gamification hub; help articles for onboarding, exports, governance.
- **Key files**: `teachwithsudar/src/app/edtech|contact|papers|store`, `sudar-studio/src/app/onboarding`, `sudar-learn/src/app/(dashboard)/leaderboard`, `help-center/articles/admins|learners/*`.
- **Flow**: New Studio admin completes onboarding → creates first course; new Learn user completes or skips (max 3) onboarding → sparse home until enrolled → active layout with continue-learning priority.

---

## SudarSim — roleplay simulation (pilot)

- **Where**: Sudar Studio **`/sudarsim`** (org scenario library + editor, sidebar **SudarSim**); Sudar Learn `/sim/session`, CourseViewer **Sim** tab, ALP `/alp/sim/play`; Moodle `local_sudaralp/sim.php`; voice service `sudar-sim/`. Course modules optionally **link** a scenario (delivery only).
- **What**: Multi-channel customer roleplay (phone voice via WebSocket/LiveKit, chat, email) with screenshot **CRM overlay** editor, configurable rubric coach, transcript→scenario import, optional module completion gate, Twin memory via `ai_interactions`. Locales: en, fr, es, pt, ta.
- **Key files**:
  - `docs/SUDAR_SIM_PLAN.md`, `docs/SUDAR_SIM_DEPLOY.md`, `docs/SUDAR_SIM_API.md`
  - `shared/sudarsim/`, `sudar-sim/main.py`
  - `sudar-intelligence/src/api/routes/sim.py`
  - `sudar-learn/src/components/sudarsim/`, `src/app/api/sim/`
  - `sudar-studio/src/app/(dashboard)/sudarsim/`, `src/app/api/sudarsim/scenarios/`, `src/components/sudarsim/`
  - `supabase/migrations/20260616000000_sudarsim.sql`
- **Flow**:
  1. Admin creates/publishes scenario in Studio **SudarSim** (`/sudarsim`) — CRM screenshot + overlays + rubric.
  2. Optionally links scenario to a course module for in-context delivery.
  3. Learner opens **Sim** tab or `/sim/session/new?scenario_id=…`.
  4. Practices across channels; CRM actions logged.
  5. Ends session → coach report → optional `module_complete` if rubric passes.

---

## Sudar Store — LMS integrations marketplace

- **Where**: `https://teachwithsudar.com/store` (marketing site); `/plugins` redirects here.
- **What**: Browse and install Sudar services for existing LMSs — ALP intelligence (Memory, Chat, Recommend), Sudar Create (Quiz, Interact, Cards, Draft, Media), Moodle connector, Canvas LTI pack, MCP server, and ALP SDK. Filter by category and LMS; each item links to GitHub source, API docs, and Studio Integrations for API keys.
- **Key files**:
  - `teachwithsudar/src/data/sudarStore.ts` — catalog definitions.
  - `teachwithsudar/src/app/store/page.tsx`, `store/[id]/page.tsx` — store UI.
  - `teachwithsudar/src/components/store/StoreCatalog.tsx`, `StoreProductCard.tsx`.
- **Flow**:
  1. Admin opens Sudar Store → picks Moodle ALP Connector or SudarQuiz.
  2. Follows download/docs → configures org key in Studio Integrations.
  3. Installs plugin or registers LTI → LMS gains new capability.

---

## Sudar Create — LMS content generation (ALP extension)

- **Where**: Sudar Learn `/api/alp/create/*` and `/alp/create` embed UI; Moodle `local_sudaralp/create.php`; Canvas LTI checklist in `integrations/canvas/`.
- **What**: Org-scoped AI services for external LMSs: **SudarQuiz**, **SudarInteract**, **SudarCards**, outline, async **SudarDraft** / **SudarMedia** jobs. Hybrid delivery: headless ALP API + MCP `sudar_create_*` tools + teacher iframe. Exports JSON and **SCORM 1.2 single-SCO** ZIP for upload into Moodle/Canvas/Blackboard.
- **Key files**:
  - `docs/SUDAR_CREATE_API.md` — HTTP contract.
  - `shared/content-generation/` — prompts, Zod schemas, SCORM builder.
  - `sudar-learn/src/app/api/alp/create/` — proxy routes.
  - `sudar-learn/src/app/alp/create/` — embed shell.
  - `supabase/migrations/20260615000000_content_generation_jobs.sql` — async jobs.
  - `packages/sudar-mcp/src/tools/create.ts` — MCP integrator tools.
- **Flow**:
  1. Admin provisions org-scoped ALP key in Studio Integrations.
  2. Teacher opens Sudar Create (Moodle link or `POST /api/alp/create/embed-token` → iframe).
  3. Paste content → Generate → Download SCORM → upload to host LMS activity.
  4. Integrators call `POST /api/alp/create/quiz` directly or via MCP.
- **Env**: `ALP_EMBED_SIGNING_SECRET` on Learn (embed tokens); optional `ALP_WEBHOOK_HMAC_SECRET` for async job webhooks.

---

## AI discoverability — robots.txt, llms.txt, sitemaps, MCP discovery

- **Where**: `teachwithsudar.com` / `thesudar.com` (primary), `studio.thesudar.com`, `learn.thesudar.com`, `mcp.thesudar.com`.
- **What**: Makes Sudar visible and understandable to AI crawlers and AI search (Google/Gemini, OpenAI/ChatGPT, Anthropic/Claude, Perplexity, Bing/Copilot, Meta AI, Apple Intelligence, Cohere, Common Crawl). Public `llms.txt` describes the forever-free open education mission, ByteVerse ecosystem, and MCP integration. Sitemaps enumerate crawlable marketing pages. MCP worker serves its own `llms.txt` and JSON discovery document for AI agents.
- **Value**:
  - **AI search / discovery**: Crawlers can index Sudar as an open, free AI-powered education platform.
  - **AI agents**: MCP endpoint is self-describing — agents know tool names, auth modes, and example prompts.
  - **Operators**: No env changes; deploy marketing site and MCP worker as usual.
- **Key files**:
  - `teachwithsudar/src/app/robots.ts`, `teachwithsudar/public/llms.txt` — primary AI crawler policy and platform summary.
  - `teachwithsudar/scripts/generate-sitemap.mjs`, `teachwithsudar/public/sitemap.xml` (prebuild), `teachwithsudar/src/app/layout.tsx` — static XML sitemap + structured data (JSON-LD).
  - `sudar-studio/public/robots.txt`, `sudar-learn/public/robots.txt` — app-level crawler policy (public auth pages only).
  - `sudar-studio/src/app/sitemap.ts`, `sudar-learn/src/app/sitemap.ts` — minimal public-route sitemaps.
  - `workers/sudar-mcp-cloudflare/src/discovery.ts`, `src/index.ts` — MCP `GET /llms.txt` and `GET /` discovery JSON.
- **Flow**:
  1. AI crawler fetches `teachwithsudar.com/robots.txt` → allowed → follows `sitemap.xml` and `llms.txt`.
  2. AI agent connects to `mcp.thesudar.com` → reads `/llms.txt` or `/` discovery JSON → authenticates via OAuth or Bearer JWT → calls MCP tools.
  3. Studio/Learn crawlers see only `/login`, `/signup` (and `/forgot-password` on Learn); dashboard routes remain behind auth.

---

## Unified ecosystem branding — browser favicon and tab titles

- **Where**: Sudar Learn, Sudar Studio, marketing site (`teachwithsudar/`), and ecosystem demo — browser tab icon and default `<title>`.
- **What**: Replaces default/Vercel globe favicon with a high-visibility Sudar mark (white logo on black `#000000`, rounded square). Root layouts declare explicit `icons` metadata and professional default titles per surface.
- **Key files**:
  - `sudar-learn/public/icon.svg`, `sudar-studio/public/icon.svg`, `teachwithsudar/public/icon.svg`, `sudar-ecosystem-demo/public/icon.svg` — shared favicon asset.
  - `sudar-learn/src/app/layout.tsx`, `sudar-studio/src/app/layout.tsx`, `teachwithsudar/src/app/layout.tsx`, `sudar-ecosystem-demo/src/app/layout.tsx` — `metadata.icons` + default titles.
- **Flow**: User opens any Sudar app or marketing URL → browser tab shows Sudar logo and surface-specific title (e.g. “Sudar Learn — AI-Powered Personalized Learning”).

---

## thesudar.com Application Gateway (black canvas, v2)

- **Where**: `thesudar.com` homepage — `teachwithsudar` with `NEXT_PUBLIC_SITE_VARIANT=gateway` (`teachwithsudar/src/app/page.tsx` → `GatewayHomePage`).
- **What**: Entry gateway on **pure black** (`#000`) with ember CTAs and indigo structure accents only. Hero uses an enlarged CSS pill-morph + star-pop that **holds on the Sudar S mark** (loops every 30s); tagline—“Equal opportunity for all.” On scroll, the held mark **flies and scales into the fixed nav logo** (`#nav-logo-anchor`) while the header link stays hidden until settled. Product section uses horizontal pin-scroll with rich mockups; Digital Learner Twin uses an **interactive 3D constellation** (mouse tilt, orbital rings, hoverable signal nodes with sample metrics). Modalities marketing removed from homepage—link to `teachwithsudar.com/modalities`.
- **Key files**:
  - `teachwithsudar/src/styles/gateway-theme.css` — Black surfaces; no indigo page wash.
  - `teachwithsudar/src/components/gateway/SudarLogoMotion.tsx` — Hero logo (= → S + ★, 30s loop, holds on S).
  - `teachwithsudar/src/components/gateway/SudarLogoAnimatedMark.tsx` — Shared animated mark DOM (hero + scroll clone).
  - `teachwithsudar/src/components/home/HeroScrollAnimatedLogo.tsx` — Framer scroll flight to nav (`useHeroLogoScroll`).
  - `teachwithsudar/src/hooks/useHeroLogoScroll.ts` — Scroll progress + nav compact threshold.
  - `teachwithsudar/src/styles/sudar-logo-animated.css` — Logo keyframes + `is-holding` lock state.
  - `teachwithsudar/src/components/home/HeroCinematic.tsx`, `ProductTrinity.tsx`, `IntelligenceConstellation.tsx`, `LearnerTwinVisualization.tsx`, `TutorShowcase.tsx`, `ImpactStrip.tsx`, `AccessGate.tsx`.
  - `teachwithsudar/src/components/home/ModalitiesOrbit.tsx` — Used on marketing site only (not gateway home).
- **Env**: `NEXT_PUBLIC_SITE_VARIANT=gateway` for local preview and Cloudflare Pages project **thesudar** (see `teachwithsudar/README.md`).
- **Flow**: User visits `thesudar.com` → hero + product beats + twin + tutor proof → Learn or Studio via CTAs or access gate.

---

## Knowledge bases + MarkItDown RAG (Studio + Learn + Intelligence)

- **Where**: Sudar Studio — **Settings → Knowledge bases** (`/settings/knowledge-bases`); Sudar Learn — **Settings → Knowledge** (`/settings/knowledge`, when org allows learner uploads); tutor RAG in `/api/tutor/query`.
- **What**: Admins and (optionally) learners upload PDFs, Office files, images, and other formats. Files are converted to Markdown via **MarkItDown** on Intelligence, chunked and embedded in Learn, and retrieved alongside course RAG for Sudar tutor answers.
- **Key files**:
  - `supabase/migrations/20260603000000_knowledge_bases.sql` — `knowledge_bases`, `kb_ingest_queue`, `content_chunks.kb_id`, RPC `match_content_chunks`.
  - `sudar-intelligence/src/api/routes/kb.py` — `POST /api/kb/convert-markdown`.
  - `sudar-learn/src/app/api/cron/process-kb-uploads/route.ts` — async ingest worker.
  - `sudar-learn/src/lib/knowledge-base/processKbQueueItem.ts`, `resolveOrgKbIds.ts`, `lib/intelligence/kb-convert.ts`.
  - `sudar-studio/src/app/api/kb/*`, `components/knowledge-base/KnowledgeBaseManager.tsx`.
  - `sudar-learn/src/app/api/knowledge-base/*`, `lib/rag/retrieve.ts` (`kbIds` filter).
- **Database**: Tables `knowledge_bases`, `kb_ingest_queue`; `content_chunks.kb_id`.
- **Env**: `SUDAR_INTELLIGENCE_URL`, `INTELLIGENCE_SERVICE_SECRET`, `CRON_SECRET`, optional `KB_PROCESSING_MAX_CONCURRENCY`, `MARKITDOWN_*` — see [KNOWLEDGE_BASE_SETUP.md](KNOWLEDGE_BASE_SETUP.md), [MARKITDOWN_INTEGRATION.md](MARKITDOWN_INTEGRATION.md).
- **Flow**: Upload → Storage `course-media` → queue row `pending` → cron calls Intelligence MarkItDown → chunk + embed → `content_chunks` with `kb_id` → tutor query retrieves org KB excerpts.

---

## SudarArt temporary shutdown (Studio)

- **Where**: Sudar Studio — `/tools/sudarart`; API `POST /api/ai/sudarart/generate`.
- **What**: SudarArt is temporarily disabled while generation quality is reassessed. The feature is hidden from the main sidebar, direct page access shows an unavailable message, and generation API requests return `503` with a clear error payload.
- **Key files**:
  - `sudar-studio/src/components/layout/Sidebar.tsx` — removed SudarArt nav entry.
  - `sudar-studio/src/app/(dashboard)/tools/sudarart/page.tsx` — unavailable state page.
  - `sudar-studio/src/app/api/ai/sudarart/generate/route.ts` — hard-disabled API response.
- **Flow**: User opens Studio navigation → no SudarArt entry shown. If user visits `/tools/sudarart` manually, UI explains temporary shutdown. Any programmatic generation call gets a `503` response and does not run generation logic.

---

## SudarArt v2 hybrid generation (Studio)

- **Where**: Sudar Studio — **SudarArt** (`/tools/sudarart`) and API `POST /api/ai/sudarart/generate`.
- **What**: Rebuilt SudarArt from a single CSS-only flow into a **hybrid engine system**:
  - `aipencil` (primary): deterministic SVG generation with CLI-first render and automatic fallback SVG renderer.
  - `llm-css` (legacy-compatible): strict SceneSpec + CSS compiler flow preserved.
  - `flux` (premium image): Hugging Face model inference path for higher-fidelity image output.
- **Key files**:
  - `shared/sudarart/aipencilCompiler.ts` — deterministic scene builder + fallback SVG compiler.
  - `sudar-studio/src/lib/ai/aipencilClient.ts` — aipencil CLI integration (`AIPENCIL_PATH`) with fallback handling.
  - `sudar-studio/src/lib/ai/fluxClient.ts` — Flux/HF image generation client (`FLUX_API_KEY`, `FLUX_MODEL`).
  - `sudar-studio/src/app/api/ai/sudarart/generate/route.ts` — request validation + engine routing + metering metadata.
  - `sudar-studio/src/app/(dashboard)/tools/sudarart/page.tsx` — engine selector, style controls, runtime/cost display.
  - `sudar-studio/.env.example` — SudarArt v2 env contracts.
- **Flow**: User selects engine + style presets → submit prompt → API routes to selected engine → returns render-ready HTML/CSS payload → Studio preview iframe shows output → user can copy/download artifact.
- **Controls**: UI now exposes **layout style**, **visual style**, and **figure theme** (for full-figure layouts), plus generation metadata (method, time, estimated cost, model/warnings).
- **Ops**: `aipencil` mode requires optional CLI install and `AIPENCIL_PATH` if binary path differs; `flux` mode requires `FLUX_API_KEY` (or `HUGGINGFACE_API_KEY`) and optional `FLUX_MODEL`.

---

## Course creation experience refresh (Studio)

- **Where**: Sudar Studio — course creation page (`/courses/new`) across AI/manual/document/SCORM entry flows.
- **What**: The form now uses a more modern, animated interaction model: staged section entrance motion, interactive card hover/tap states, smoother focus transitions, upgraded CTA motion feedback, and an animated Sudar brand mark in the AI header. The AI mode label now reads **Create with Sudar AI**.
- **Key files**:
  - `sudar-studio/src/app/(dashboard)/courses/new/page.tsx` — updated UI motion variants, branded header icon/title, interactive controls, and error presentation.
- **Flow**: Open **New course** → choose a creation mode with animated visual feedback → complete fields with stronger focus/hover cues → submit with motion-enhanced CTA and status transitions.

---

## Notification settings (Studio)

- **Where**: Sudar Studio — **Settings → Notifications** (`/settings/notifications`).
- **What**: Users configure completion notifications via a dedicated page instead of during course generation. Options: **Desktop notification** (system browser notification when course finishes), **In-tab chime** (subtle sound while tab is active), with volume slider. Browser permission handled transparently.
- **Persistence**: Preferences stored in `profiles.notification_preferences` (JSON) so settings sync across devices/sessions and persist indefinitely.
- **Default**: Both notifications are **disabled by default** (opt-in); browser permission requested only when user enables desktop notifications.
- **Flow**: User visits **Settings → Notifications** → toggles options → saved to Supabase → when course generation completes, notifications fire (if opted in + browser permission granted).
- **Key files**:
  - `sudar-studio/prisma/schema.prisma` — `profiles.notification_preferences` JSON field.
  - `sudar-studio/src/app/(dashboard)/settings/notifications/page.tsx` — Settings UI.
  - `sudar-studio/src/app/api/user/notification-preferences/route.ts` — GET/PATCH API.
  - `sudar-studio/src/hooks/useBrowserCompletionNotification.ts` — Hook refactored to read/write Supabase.
  - `sudar-studio/src/app/(dashboard)/courses/new/page.tsx` — Removed notification prompts from generation overlay and forms.
- **UX benefit**: Cleaner, less cluttered course generation flow. Notifications are treated as a **preference** (set once in Settings), not a **blocker** (decide every generation).

---

## External open courses — Discover + import (Learn + Studio)

- **Where**: Sudar Learn — **Courses** catalog (`/courses`, **`?tab=discover`**), course detail, learn viewer for external items; Next Best Action on dashboard; Sudar tutor chat and proactive nudges. Sudar Studio — **Settings → External courses**, **External courses → Import**.
- **What**: Admins import external courses from **YouTube, Udemy, Coursera, edX, Khan Academy, or manual URL** with **org tag** assignment (LLM-suggested + manual). Learners discover open courses on the **Open courses** tab; view in Sudar via **iframe** (with optional consent + sign-in gates for paid providers); **Mark as complete** syncs progress. Sudar tutor uses **ingested metadata + RAG chunks** to discuss topics when `content_access_mode` allows; NBA scores external courses (boost on skill-gap match); proactive nudges can recommend tagged external courses after low quiz scores.
- **Key files**:
  - `supabase/migrations/20260601000000_external_open_courses.sql`, `20260602120000_external_courses_extended.sql` — external columns, `external_course_data`, provider config, sync log, `learner_profiles.external_course_engagement`.
  - `shared/external-courses/types.ts` — shared metadata and policy types.
  - `sudar-studio/src/lib/providers/` — provider adapters (YouTube, Udemy, Coursera, edX, Khan, manual).
  - `sudar-studio/src/lib/ai/suggestExternalCourseTags.ts`, `sudar-studio/src/lib/external/importExternalCourse.ts`.
  - `sudar-studio/src/app/api/org/external-courses/import/route.ts`, `search/route.ts`, `settings/route.ts`.
  - `sudar-studio/src/app/(dashboard)/external-courses/import/page.tsx`, `settings/external-courses/page.tsx`.
  - `sudar-learn/src/lib/courses/externalProviders.ts` — extended provider registry.
  - `sudar-learn/src/lib/rag/ingestExternalCourse.ts`, `extractExternalCourseChunks.ts`, `/api/rag/ingest-external`.
  - `sudar-learn/src/lib/external/externalCourseContext.ts`, `/api/external-courses/engagement`.
  - `sudar-learn/src/components/courses/ExternalCourseLabel.tsx`, `ExternalCourseEmbed.tsx` — labelling + iframe + engagement callbacks.
  - `sudar-learn/src/app/(dashboard)/courses/[id]/learn/ExternalCourseViewer.tsx` — consent, sign-in gate, Ask Sudar.
  - `sudar-learn/src/app/api/tutor/query/route.ts`, `proactive-nudge/route.ts`, `nextBestActionEngine.ts`.
- **Database**: `courses` external fields + `external_course_data`, `external_course_providers`, `external_course_sync_log`; `learner_profiles.external_course_engagement`.
- **Env**: `YOUTUBE_API_KEY`, `UDEMY_CLIENT_ID`, `UDEMY_CLIENT_SECRET` (Studio search); `INTERNAL_SERVICE_SECRET` + `NEXT_PUBLIC_LEARN_URL` (Studio → Learn RAG trigger on import).
- **Flow**: Studio **Import external course** → tag + publish → Learn **Open courses** / NBA → enroll → iframe viewer (consent/sign-in if configured) → engagement tracked → tutor discusses ingested outline → mark complete.

---

## AI token monitoring & usage estimates (Studio)

- **Where**: Sudar Studio — **Analytics → AI usage** (`/analytics/ai-usage`); APIs under `/api/org/ai-usage/*`.
- **What**: Records LLM token usage per org/feature/call (tutor chat, course generation, Studio agent, modalities, RAG, etc.) with **estimated marginal USD** from `ai_model_pricing`. Daily rollups for fast dashboards; CSV export for hosters/resellers. Does not invoice — observability only. Optional `organisations.settings.ai_entitlements` (`monthly_token_allowance`, `hard_stop`) blocks LLM calls when exceeded.
- **Key files**:
  - `supabase/migrations/20260529120000_ai_usage_monitoring.sql`
  - `shared/ai/usageTypes.ts`, `shared/ai/parseChatUsage.ts`, `shared/ai/estimateCost.ts`, `shared/ai/entitlements.ts`
  - `sudar-learn/src/lib/ai/chat.ts`, `sudar-studio/src/lib/ai/chat.ts`, `sudar-studio/src/lib/ai/recordUsage.ts`
  - `sudar-studio/src/app/api/org/ai-usage/summary/route.ts`, `export/route.ts`, `timeseries/route.ts`
  - `sudar-studio/src/app/api/cron/ai-usage-rollups/route.ts`
  - `sudar-studio/src/components/analytics/AiUsageDashboard.tsx`
- **Database**: `ai_usage_events`, `ai_usage_daily_org`, `ai_model_pricing`; RPC `refresh_ai_usage_rollups`, `increment_usage_token_count`.
- **Flow**: LLM call → `chatCompletion` with `usageContext` → row in `ai_usage_events` → nightly cron rollups → admin views breakdown and exports CSV.

---

## Flashcards modality (Learn)

- **Where**: Sudar Learn course viewer — **Cards** tab per module.
- **What**: Learners can switch from Read to **Cards** to study the current module as flashcards. Cards are generated on demand from module content via AI.
- **Key files**:
  - `sudar-learn/src/app/(dashboard)/courses/[id]/learn/FlashcardsCard.tsx` — UI component.
  - `sudar-learn/src/app/api/ai/generate-flashcards/route.ts` — API that generates cards from content + optional module title.
- **Flow**: Switch to Cards → API called with module body → cards displayed; retry available. Progress and completion rules (e.g. min time) apply as in other modalities.

---

## Multilingual RAG v2 + Hugging Face providers (Learn + Intelligence)

- **Where**: Sudar Learn — tutor catalog + in-course Q&A; `POST /api/rag/ingest`; Sudar Intelligence — chat (`AI_CHAT_PROVIDER=huggingface`), images (`IMAGE_PROVIDER=huggingface`); Studio — **Settings → AI & API Keys** (HF card).
- **What**: Multilingual embeddings (`BAAI/bge-m3`, 1024-dim pgvector); module body + SCORM text chunking; optional cross-encoder rerank; HF Inference API with optional `HF_INFERENCE_BASE_URL` for TEI/vLLM swap.
- **Key files**:
  - `sudar-learn/src/lib/hf/client.ts`, `sudar-learn/src/lib/embed.ts`, `sudar-learn/src/lib/rag/chunk.ts`, `sudar-learn/src/lib/rag/rerank.ts`, `sudar-learn/src/lib/rag/retrieve.ts`
  - `sudar-learn/src/app/api/rag/ingest/route.ts`, `sudar-learn/src/app/api/tutor/query/route.ts`
  - `sudar-intelligence/src/core/hf_client.py`, `sudar-intelligence/src/core/ai_client.py`, `sudar-intelligence/src/api/routes/image.py`, `sudar-intelligence/src/api/routes/health.py`
  - `docs/HF_INTEGRATION_TEST.md`, `scripts/hf/*.mjs`
- **Env**: `HUGGINGFACE_API_KEY`, `EMBED_PROVIDER`, `HF_EMBED_MODEL`, `RAG_RERANK_ENABLED`, `HF_RERANK_MODEL`, `HF_INFERENCE_BASE_URL`, `AI_CHAT_PROVIDER`, `IMAGE_PROVIDER`, `HF_CHAT_MODEL`, `HF_IMAGE_MODEL` — see [ENV_REFERENCE.md](ENV_REFERENCE.md).
- **Flow**: Operator sets HF keys → ingest published courses → floating tutor uses catalog RAG → in-course tutor gets vector excerpts + inline module context → Intelligence can serve HF chat/image for Studio/Learn proxies.

---

## AI course generation quality v2 (Studio + Learn)

- **Where**: Sudar Studio — AI new-course wizard, generation pipeline, per-course **Content quality** page (`/courses/[id]/quality`). Sudar Learn — rich module reader.
- **What**: Domain-varied module openings (no default “calculator program” scenarios); SME-aware curriculum and module prompts; validated interactives (matching/flipcard/quiz); optional LLM quality scores in `courses.settings.ai_generation.generation_telemetry`; creator **visual identity** controls (domain, theme, brand colors, density); side insights as a **floating hotspot** instead of a permanent sidebar; wider read column; flipcard rendering fix.
- **Key files**:
  - `sudar-studio/src/lib/ai/courseGeneration/{introductionStrategies,prompts,pipeline,componentValidation}.ts`
  - `sudar-studio/src/lib/ai/componentSelector.ts`
  - `sudar-studio/src/components/generator/BrandSettings.tsx`
  - `sudar-studio/src/app/(dashboard)/courses/[id]/quality/page.tsx`
  - `sudar-learn/src/components/learn/RichModuleContent.tsx`, `sudar-learn/src/lib/courseBodyMarkdown.tsx`
- **Flow**: Studio AI wizard → BrandSettings + blueprint → `generate-course` → `fillEmptyModulesForCourse` (quality telemetry) → Learn applies `content_theme` / brand colors → learner reads full-width content; taps insight bulb for side context.

---

## Document-to-course (Studio)

- **Where**: Sudar Studio — course creation from document or URL.
- **What**: Admins can upload a PDF/DOCX or paste a URL; the system extracts text and generates a course outline + modules. Optional RAG-from-docs for richer generation.
- **Key files**:
  - `sudar-studio/src/app/api/.../generate-from-document/` (or equivalent route) — accepts file upload or URL, returns outline/modules.
- **Flow**: New course or “Generate from document” → upload/paste → AI generates structure → creator can edit and publish to Learn.

---

## SCORM 1.2 import (Studio)

- **Where**: Sudar Studio — import existing SCORM packages.
- **What**: Upload a SCORM 1.2 ZIP; the system parses `imsmanifest.xml`, maps to Sudar courses/modules, and stores assets in Supabase (e.g. `course-media`). Learners can then take the course in Learn with SCORM delivery (iframe proxy).
- **Key files**:
  - `sudar-studio/src/app/api/courses/import-scorm/route.ts` — import endpoint.
  - Learn: SCORM delivery proxy for package assets (correct MIME types, iframe launch).
- **Flow**: Studio → Import SCORM → upload ZIP → course created with SCORM modules → publish → Learn shows SCORM activity per module.

---

## Listen (Audio TTS) modality (Learn)

- **Where**: Sudar Learn course viewer — **Listen** tab per module (alongside Read, Watch, Map, Cards).
- **What**: Learners can switch to **Listen** to hear the current module read aloud. Audio is generated on demand via TTS (proxies to Sudar Intelligence when configured; otherwise returns `use_browser_tts` and the UI shows “Audio not available” with retry).
- **Key files**:
  - `sudar-learn/src/app/(dashboard)/courses/[id]/learn/AudioCard.tsx` — Listen tab UI.
  - `sudar-learn/src/app/api/ai/generate-audio/route.ts` — POST with `{ text }`; returns audio blob or JSON with `use_browser_tts` when TTS is unavailable.
- **Flow**: Switch to Listen → API called with module text → audio cached per module; play/regenerate. Completion rules (e.g. min time) apply. Learner preference `tts_voice` in profile is used when calling Intelligence.

---

## Compliance email reminders (Studio)

- **Where**: Sudar Studio — cron endpoint; call via scheduler (e.g. daily).
- **What**: Sends reminder emails to learners with path assignments that are **at-risk** (due within 7 days) or **overdue**. Uses Resend for delivery.
- **Key files**:
  - `sudar-studio/src/app/api/cron/compliance-reminders/route.ts` — POST with `Authorization: Bearer <CRON_SECRET>` (or `?secret=<CRON_SECRET>`).
- **Env**: `CRON_SECRET`, `RESEND_API_KEY`, optional `RESEND_FROM` (see [ENV_REFERENCE.md](ENV_REFERENCE.md)).
- **Flow**: Cron job calls endpoint → backend finds path enrollments with `due_date` → for each learner with at-risk/overdue items, sends one email listing those items and a link to the learning dashboard.

---

## Production deployment (documented)

- **Where**: Repo docs; Cloudflare Workers/Pages + GitHub Actions; Intelligence on Railway/Render/Fly.
- **What**: **Primary production domain:** `thesudar.com` — marketing at apex, `learn.thesudar.com` and `studio.thesudar.com` on Cloudflare Workers (OpenNext). Sudar Intelligence (Python FastAPI) deploys separately; URL set as `SUDAR_INTELLIGENCE_URL`. **Vercel** remains documented as an alternative/staging path.
- **Key files**:
  - [docs/CLOUDFLARE_PAGES_DEPLOY.md](CLOUDFLARE_PAGES_DEPLOY.md) — Learn + Studio + marketing on Cloudflare
  - [docs/DNS_THESUDAR_COM.md](DNS_THESUDAR_COM.md) — DNS and custom domains
  - [docs/DEPLOY_THESUDAR_COM.md](DEPLOY_THESUDAR_COM.md) — production checklist
  - [docs/VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) — Vercel alternative
  - `sudar-learn/wrangler.jsonc`, `sudar-studio/wrangler.jsonc`, `workers/sudar-cron-*`
- **Flow**: Set GitHub secrets → configure Worker env vars → deploy via push to `main` → attach custom domains → deploy cron workers → set Intelligence `CORS_ORIGINS` → smoke test.

---

## Personalization v2 — module overlays, consent, org policy (Learn + Studio)

- **Where**: Sudar Learn (course experience + settings); Sudar Studio (org settings, course editor, governance).  
- **What**: For **adaptive** courses, orgs can configure AI personalization (audience: org / groups / individuals; features: course welcome, role explanation, brief “3 min” views). Generated text is stored only in **`enrollments.personalization_overlays`** (per module keys); canonical **`modules.content`** is never overwritten. Orgs can require learner consent (`organisations.settings.ai_compliance`); consent timestamp on **`learner_profiles.generative_ai_consent_at`**.  
- **Database**: Migration `supabase/migrations/20260410000000_personalization_v2.sql` — consent column, `personalization_overlays` on `enrollments`, **`learner_groups`** and **`learner_group_members`** for audience targeting.  
- **Key files (Learn)**:
  - `sudar-learn/src/lib/personalization/eligibility.ts` — gate features by org, course, enrollment, consent.  
  - `sudar-learn/src/app/api/ai/module-personalize/route.ts` — POST to generate/store overlays (`role_explain` | `brief_3min`); usage limit `module_personalize`.  
  - `sudar-learn/src/app/api/learner/ai-consent/route.ts` — learner accepts generative personalization when required.  
  - `sudar-learn/src/lib/learn/modulePlainText.ts` — module body to plain text for prompts.  
- **Key files (Studio)**: Org settings API `sudar-studio/src/app/api/org/settings/route.ts`; learner groups `sudar-studio/src/app/api/org/learner-groups/`; course detail/settings UI for personalization flags; **Governance** `sudar-studio/src/app/(dashboard)/governance/page.tsx` (links to `docs/trust/`).  
- **Flow**: Admin enables policy + course personalization → learner meets consent if required → eligible learners request overlay per module → overlay cached on enrollment → telemetry via `learning_events` (see ECOSYSTEM.md — AI personalization boundaries).

---

## Brand, logo, and mascot system (Learn + Studio)

- **Where**: App chrome (header, nav, auth pages), public assets, learner journey cards.  
- **What**: Shared **SudarLogo** component and SVG marks; neutral **mascot** assets (Sudar, focus, memory, confidence) for journey UI; lightweight **mascot engine** (personas, rollout, tracking) for staged experiences.  
- **Key files**:
  - `sudar-learn/src/components/branding/SudarLogo.tsx`, `sudar-studio/src/components/branding/SudarLogo.tsx`  
  - `sudar-learn/public/sudar-logo.svg`, `sudar-logo-mark.svg`; Studio equivalents under `sudar-studio/public/`  
  - `sudar-learn/public/mascots/*.svg`, `sudar-learn/src/components/mascot/*`, `sudar-learn/src/lib/mascot/*`  
- **Brand docs**: `docs/brand/` (strategy, guidelines, design tokens, mascot illustration spec and character bibles, rollout checklist, messaging kit).

---

## Trust and governance documentation

- **Where**: Repository `docs/trust/`; Sudar Studio **Governance** page.  
- **What**: Technical trust pack (posture, data flows, subprocessors, shared responsibility, AI system register, threat model, operations, audit log backlog) for reviews and procurement — not legal advice.  
- **Key files**: `docs/trust/README.md` (index); `sudar-studio/src/app/(dashboard)/governance/page.tsx`.

---

## Proactive Sudar with multiple-choice replies (Learn)

- **Where**: Sudar Learn — **dashboard** (floating bar: session welcome on home, contextual prompts when navigating e.g. `/courses`, `/progress`, `/paths`, `/memory`, `/search`); **course viewer** (idle nudge banner after ~90s without interaction). Hidden on inline lesson pages where the course tutor handles idle nudges only.
- **What**: Sudar reaches out with a short message and **single-select chips**. Each chip maps to an optional `follow_up_message` sent to `/api/tutor/query` (same as typing), so learners respond without a keyboard. Snooze (X), route cooldowns, and session flags reduce spam. Intelligence **`POST /api/tutor/nudge`** documents the same **`choices`** shape for external LMSs (see [ALP_API.md](ALP_API.md) §5.2).
- **Key files**:
  - `sudar-learn/src/components/tutor/ProactiveSudarHost.tsx` — session + navigation triggers.
  - `sudar-learn/src/components/tutor/ProactiveSudarChoiceChips.tsx` — shared chip UI.
  - `sudar-learn/src/app/api/tutor/proactive-prompt/route.ts` — template prompts (`session_start`, `route_change`).
  - `sudar-learn/src/app/api/tutor/proactive-nudge/route.ts` — idle nudge + LLM JSON `choices` with validation/fallback.
  - `sudar-learn/src/app/api/tutor/proactive-reply/route.ts` — logs chip taps (`tutor_action_taken`, `proactive_choice`).
  - `sudar-learn/src/lib/tutor/proactiveTemplates.ts`, `proactivePromptSchema.ts`.
  - `sudar-intelligence/src/api/routes/tutor.py` — `NudgeChoice`, optional `choices` on `NudgeResponse`.
- **Flow**: Prompt shown → learner taps chip → optional follow-up opens floating or inline tutor and sends message → events in `learning_events` / `ai_interactions`.

---

## Learner gamification and engagement (Learn)

- **Where**: Dashboard and related APIs (quests, check-ins, coins, achievements, notifications) — see `sudar-learn/src/lib/gamification/`, `sudar-learn/src/app/api/quests/`, `sudar-learn/src/app/api/checkin/`, and dashboard layout toasts.  
- **What**: Optional engagement loop: quests with progress, daily check-ins, virtual coins and levels, achievement unlocks, in-app notifications, with structured `learning_events` for milestones. Wired for operator rollout per product configuration.  
- **Doc trail**: Dated build notes in [UPDATES.md](../UPDATES.md) (e.g. 2026-04-15, 2026-04-17).

---

## Notification sounds — Chime-style in-app chimes (Learn + Studio)

- **Where**: Sudar Learn — **Settings → Notification controls** (`/settings/notifications`); in-tab chimes across course learn, tutor chat, notification toasts, and gamification toasts. Sudar Studio — **New course** generation UI (AI / document / SCORM paths).
- **What**: Optional subtle WAV chimes when tasks complete (AI generation, Sudar tutor reply, notification toast, level-up/achievement). Master toggle off by default; volume slider; four event-group toggles; respects learner quiet hours and `prefers-reduced-motion`. Studio stores sound prefs in `localStorage` for course-ready chime (independent of OS browser notifications).
- **Key files**:
  - `shared/notifications/sound.ts` — `playSudarChime`, `shouldPlaySound`, category → sound group mapping.
  - `shared/notifications/quietHours.ts` — shared quiet-hours helper (also used by notification engine).
  - `sudar-learn/src/components/features/notifications/NotificationSoundProvider.tsx` — loads prefs, exposes `playChime`.
  - `sudar-learn/src/app/api/learner/notification-settings/route.ts` — GET/PATCH sound fields.
  - `sudar-learn/public/audio/notifications/*.wav` — generated via `scripts/generate-notification-sounds.mjs`.
  - `sudar-studio/src/hooks/useBrowserCompletionNotification.ts` — Studio chime + browser notification on course ready.
- **Database**: `supabase/migrations/20260522120000_notification_sound_settings.sql` — columns on `user_notification_settings` (`sound_enabled`, `sound_volume`, `sound_task_complete`, `sound_sudar_reply`, `sound_notifications`, `sound_celebration`).
- **Flow**: Learner enables sounds on notification settings → preview chimes → generation/tutor/notification events call `playChime` when prefs allow → Studio creator enables “Play a chime when the course is ready” on new-course flow → chime on successful generation (optional OS notification unchanged).

---

## Global search (Learn)

- **Where**: Learner dashboard app — `/search`.  
- **What**: Search entry point for courses/paths content discovery (implementation under `sudar-learn/src/app/(dashboard)/search/`).

---

## Sensitive input guard (Studio + Learn)

- **Where**: Server-side paths that accept free text toward AI or logs.  
- **What**: Shared guard utilities to reduce high-risk patterns (e.g. secrets/sensitive payloads) before model calls; Studio: `sudar-studio/src/lib/security/sensitiveInputGuard.ts`; Learn: `sudar-learn/src/lib/security/sensitiveInputGuard.ts`.

---

## Localization and multilingual delivery (Learn + Studio + Intelligence)

- **Where**: Sudar Learn — root layout + Memory preferences + tutor/audio APIs; Sudar Studio — root layout + **Org settings** → Localization; Sudar Intelligence — audio/content/image routes.
- **What**: Cookie-driven UI locale (`NEXT_LOCALE`) with 30+ message catalogs; learner prefs `ui_language`, `content_language`, `auto_detect_language` (JSONB) and column `preferred_language`; org-level **default UI locale** for learners who have not customised (`organisations.settings.localization`); multilingual TTS (Edge voices + Sarvam language code); tutor/proactive prompts respect content language; optional **Together** image generation for catalog-style course art (Studio AI create + Learn proxy).
- **Key files**: `shared/i18nLocales.ts`; `sudar-learn/src/i18n/*`, `sudar-learn/src/messages/*.json`, `sudar-learn/src/components/settings/LanguageSelector.tsx`, `sudar-learn/src/app/api/learner/preferences/route.ts`, `sudar-learn/src/app/api/ai/generate-audio/route.ts`, `sudar-learn/src/app/api/ai/generate-image/route.ts`; `sudar-studio/src/i18n/*`, `sudar-studio/src/components/settings/StudioLocalizationCard.tsx`, `sudar-studio/src/app/api/org/settings/route.ts`, `sudar-studio/src/lib/intelligence/courseCoverFromTogether.ts`; `sudar-intelligence/src/api/routes/audio.py`, `content.py`, `image.py`.
- **Env**: `TOGETHER_API_KEY` on Intelligence for `/api/image/generate` (optional); existing `SUDAR_INTELLIGENCE_URL` / `INTELLIGENCE_SERVICE_SECRET` for proxies.
- **Flow**: Learner sets languages on Memory → cookie + prefs persist → UI strings and tutor/TTS follow; admin sets org learner default in Studio → Learn preferences API merges org default when learner UI unset; AI course creation may upload generated cover to `course-media` when Together returns `b64_json`.

---

## Tutor memory LLM cadence (Learn + Studio)

- **Where**: Sudar Learn — **My Memory** → Learning preferences (`memory_digest_*`, `tutor_memory_llm_cadence`, `memory_digest_cadence_days` in `learner_profiles.learner_preferences`); Sudar Studio — **Org settings** → *AI personalization & privacy* → *Tutor memory — LLM learning cadence* (`organisations.settings.ai_compliance`: `tutor_llm_memory_extraction_policy`, `tutor_llm_memory_min_interval_hours`, `memory_digest_min_interval_days_org`).
- **What**: Learners throttle or turn off LLM-driven profile inference from tutor chat; orgs can disable LLM memory updates entirely or set minimum-interval floors. Digest cron honours learner digest-day spacing and org floors.
- **Key files**: `sudar-learn/src/lib/learner/tutorMemoryCadence.ts`, `sudar-learn/src/lib/learner/learnerPreferences.ts`, `sudar-learn/src/app/api/tutor/query/route.ts`, `sudar-learn/src/app/api/cron/consolidate-learner-memory/route.ts`, `sudar-learn/src/app/(dashboard)/memory/LearningPreferencesPanel.tsx`, `sudar-studio/src/app/(dashboard)/settings/page.tsx`, `sudar-studio/src/types/orgCompliance.ts`.
- **Flow**: Learner sets cadence on Memory page → each tutor completion evaluates policy → optional `updateLearnerMemory` → nightly digest cron evaluates digest eligibility per user.

---

## Sudar MCP servers (Integrations + Learn + Studio + ChatGPT)

- **Where**: Sudar Studio → **Integrations** → *Connect via MCP* / *ChatGPT*; `https://mcp.thesudar.app/mcp` (production); repo `packages/sudar-mcp` (`@sudar/mcp-server` v0.2+).
- **What**: MCP adapter for **Cursor** (stdio), **ChatGPT/Claude** (Cloudflare remote OAuth + Streamable HTTP), and LMS integrators (ALP). Toolsets: **integrator** (ALP), **creator** (Studio course AI), **admin** (cohort pulse), **learner** (tutor, NBA, agents).
- **Key files**:
  - `docs/MCP_SERVERS.md`, `docs/MCP_CHATGPT_LAUNCH.md`, `docs/DEPLOY_THESUDAR_APP.md`, `docs/DNS_THESUDAR_APP.md`
  - `packages/sudar-mcp/src/tools/creator.ts` — Studio generation tools
  - `workers/sudar-mcp-cloudflare/` — production remote MCP (OAuth + `/mcp`)
  - `workers/sudar-mcp-remote/` — dev Express remote (API-key token)
  - `sudar-studio/src/lib/auth/requestSession.ts` — Bearer on Studio creator routes
  - `sudar-studio/src/app/api/mcp/audit/route.ts`, `sudar-learn/.../mcp/audit/route.ts`
  - `openapi/sudar-creator-v1.json` — Custom GPT Actions fallback
- **Env**: `NEXT_PUBLIC_MCP_URL`, `SUDAR_*`, Wrangler secrets — [ENV_REFERENCE.md](ENV_REFERENCE.md).
- **Flow**: Deploy thesudar.app → deploy Cloudflare MCP worker → register ChatGPT connector → user signs in with Sudar → ChatGPT calls `sudar_generate_outline` etc. on Studio.

---

## Cinematic product launch demo (standalone app)

- **Where**: [`sudar-ecosystem-demo/`](../sudar-ecosystem-demo/) — `/` on port **3003**; teachwithsudar **Demo** page and [docs/demo.md](demo.md).
- **What**: Full-screen video-like launch story (**~5 min**): title cards, typography overlays, animated cursor. Narrative covers **content generation** (document, idea/prompt, business need, cohort, learner context), **instructional design** (Bloom, objectives, archetypes), **live block authoring** (video, audio, accordion, flipcards, quiz), **cohort + individual personalization**, and **contextual tutor** (screen-aware proactive message + learner typed reply). Demo course: **Somehow I manage** (Office-themed prompt). Learn wireframes use purple/light chrome; Studio uses dark editor chrome.
- **Key files**:
  - `sudar-ecosystem-demo/src/data/launchDemo.ts` — `CinematicFrame` sequence (title-card + scene patches).
  - `sudar-ecosystem-demo/src/components/wireframes/DemoScenesExtended.tsx`, `CourseBlockCanvas.tsx`, `TutorConversationPanel.tsx`, `LearnNavChrome.tsx`, `BloomBlueprintStrip.tsx`.
  - `sudar-ecosystem-demo/public/characters/prison-mike.png` — course video placeholder.
  - `sudar-ecosystem-demo/src/components/cinematic/CinematicPlayer.tsx` — player shell.
- **Flow**: Problem → Sudar vision → Sarah (sources → blueprint → block build → publish) → personalization → Marcus (Watch → stuck → interact → tutor → memory) → certification → ALP/MCP → tagline.

## Interactive ecosystem how-to tour (same app)

- **Where**: `sudar-ecosystem-demo/interactive` — for teachwithsudar **Guides** and help how-tos.
- **What**: Step-by-step wireframe tour with scrub, chapter jump, and speed — chapters aligned with launch story (Content generation, Live editor blocks, Tutor, Memory, etc.).
- **Key files**: `ecosystemDemo.ts`, `EcosystemDemoPlayer.tsx`, `TransportBar.tsx`.
- **Env**: `NEXT_PUBLIC_ECOSYSTEM_DEMO_URL` on teachwithsudar when deployed (e.g. `https://demo.thesudar.app`).

---

*Last updated: May 2026 (ecosystem wireframe demo + MCP + localization). For roadmap and next priorities, see [STRATEGIC_PATH.md](STRATEGIC_PATH.md) and [ACTION_PLANS.md](ACTION_PLANS.md).*
