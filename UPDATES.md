# Sudar — Updates & Development Log

**Creator:** Dhanikesh "Dhani" Karunanithi · **Ecosystem:** Sudar

This file tracks **what we've built** (phase-wise) and **what's upcoming**. Update it at the end of each development day so every GitHub commit tells a clear story. Use the format below for new entries.

---

## How to use this file

- **When you commit**: Add a short dated entry under **Latest** with the day’s changes, then commit with a message that references the update (e.g. `Updates: path assignment + compliance view (UPDATES.md)`).
- **What we've built**: Summary of completed phases (update when a phase or major feature is done).
- **What's upcoming**: Prioritised next work (sync with [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md) and [docs/ACTION_PLANS.md](docs/ACTION_PLANS.md)).

---

## Latest (add new entries at the top)

### 2026-06-11 — Learn correctness: certificates, progress, tutor guardrail

- **Theme**: Critical bugfix automation — close gaps that escaped review on `main`.
- **Shipped**:
  - `sudar-learn/src/lib/learner/courseProgress.ts` — distinct `module_id` counting for enrollment progress; path mandatory-course check for certs.
  - `sudar-learn/src/app/api/certificates/issue/route.ts` — require path enrollment + completed mandatory courses before issuing.
  - `sudar-learn/src/app/api/events/route.ts`, `sudar-learn/src/app/api/alp/events/route.ts` — use distinct module completion counts (no duplicate-event inflation).
  - `sudar-learn/src/lib/tutor/runInputGuardrail.ts` — remove question-word bypass that skipped scope LLM for harmful prompts.

### 2026-06-08 — AI discoverability: robots.txt, llms.txt, sitemaps, MCP discovery

- **Theme**: Marketing + Studio + Learn + MCP — make Sudar visible to AI crawlers (Google, OpenAI, Anthropic, Perplexity, Bing, Meta, Apple, Cohere, Common Crawl) and self-describing for AI agents.
- **Shipped**:
  - `teachwithsudar/src/app/robots.ts` — dynamically welcomes major AI crawlers per site variant (`teachwithsudar.com` / `thesudar.com`); points to sitemap and llms.txt.
  - `teachwithsudar/public/llms.txt` — AI-readable platform summary (forever free, Dhani mission, ByteVerse, MCP tool catalog).
  - `teachwithsudar/src/app/sitemap.ts` — static sitemap for all marketing routes, blog posts, guides, and public help articles.
  - `teachwithsudar/src/app/layout.tsx` — robots metadata, keywords, authors, Twitter card, JSON-LD `SoftwareApplication` + `Organization`.
  - `sudar-studio/public/robots.txt`, `sudar-learn/public/robots.txt` — allow AI crawlers on public auth pages; disallow `/api/`.
  - `sudar-studio/src/app/sitemap.ts`, `sudar-learn/src/app/sitemap.ts` — minimal public-route sitemaps.
  - `workers/sudar-mcp-cloudflare/src/discovery.ts`, `src/index.ts` — `GET /llms.txt` and `GET /` JSON discovery for MCP toolsets.
- **Docs**: `docs/SHIPPED_FEATURES.md` — new AI discoverability section.

### 2026-06-06 — Learn Cloudflare: Supabase client + CSP fix

- **Theme**: Ops — `learn.thesudar.com` client crash (`NEXT_PUBLIC_SUPABASE_*` missing from OpenNext build) and CSP blocking Cloudflare analytics / Google Fonts.
- **Shipped**: GitHub Actions pass Supabase public env at build time; shared `contentSecurityPolicy.mjs`; docs note on build vs Worker secrets.

### 2026-06-06 — Learn/Studio domains: auth paths + trusted origins

- **Theme**: Ops + Learn — production domains (`learn.thesudar.com`, `studio.thesudar.com`) verified; password recovery and origin guards hardened.
- **Shipped**: `/forgot-password` public in middleware; email reset via `/auth/callback?next=/reset-password`; `shared/security/trustedAppOrigins.ts`; `scripts/verify-production-domains.mjs`; Supabase redirect checklist in `docs/DNS_THESUDAR_COM.md` and Vercel/Cloudflare env table in `docs/VERCEL_DEPLOYMENT.md`.

### 2026-06-06 — Vercel staging: Studio + Learn production restored

- **Theme**: Ops — fix Vercel builds for `sudar-studio.vercel.app` and `sudar-learn.vercel.app` (Cloudflare remains primary production).
- **Root cause**: `@opennextjs/cloudflare` `initOpenNextCloudflareForDev()` ran during Vercel builds (EPIPE on Studio); Learn `vercel.json` had a sub-daily KB cron blocked on Hobby tier.
- **Shipped**: Guard OpenNext dev init in `sudar-learn/next.config.mjs` and `sudar-studio/next.config.mjs`; Studio `next build` on Linux; removed `process-kb-uploads` from Learn `vercel.json` (runs on Cloudflare); lint fix in `resolveOrgKbIds.ts`.
- **Verify**: Both Vercel projects show **Ready** production on `main` after push.

### 2026-06-06 — Learn + Studio: clean dashboard loading logo

- **Theme**: Learn and Studio — replace stretched warp/morph loaders with centered `SudarLogoMark` (`h-20 w-auto`, no rectangle box).
- **Shipped**: `sudar-learn/src/app/(dashboard)/loading.tsx`, `sudar-studio/src/app/(dashboard)/loading.tsx`, `SudarLogoMorphLoader.tsx` (aspect-safe morph if reused).

### 2026-06-05 — Gateway hero: scroll logo flies into nav

- **Theme**: Web — animated Sudar mark in the hero transforms and travels to `#nav-logo-anchor` as the user scrolls; nav link reveals when settled.
- **Shipped**: `HeroScrollAnimatedLogo.tsx`, `SudarLogoAnimatedMark.tsx`, `HeroCinematic.tsx`, `SudarLogoMotion.tsx`; `docs/SHIPPED_FEATURES.md` gateway section updated.

### 2026-06-05 — Gateway Digital Learner Twin: interactive 3D constellation

- **Theme**: Web — learner-twin visualization with mouse-tilt depth, orbital rings, hoverable signal nodes (live metric labels), and scroll-draw entrance.
- **Shipped**: `LearnerTwinVisualization.tsx`; `IntelligenceConstellation.tsx` delegates to the new component.

### 2026-06-05 — Gateway hero: clean Sudar S hold (fix = freeze)

- **Theme**: Web — remove sketch overlay; fix CSS so rest state locks **S + star** (not =); 30s loop; tagline only for “equal opportunity” story.
- **Shipped**: `SudarLogoMotion.tsx`, `sudar-logo-animated.css` (removed `SudarLogoSketch.tsx`).

### 2026-06-05 — Gateway hero: hand-drawn logo annotations

- **Theme**: Web — replace rotating story blocks with SVG sketch overlay (= brackets → S-curve → star rays) + one-line Playfair whisper: “Equal opportunity for all.”
- **Shipped**: `SudarLogoSketch.tsx`, `SudarLogoMotion.tsx`, `sudar-logo-animated.css`, Caveat font on gateway layout.

### 2026-06-05 — Gateway hero logo: larger, looping, story beats

- **Theme**: Web — enlarged canonical CSS logo (~1.32–1.38×), infinite loop, hover replay + glow; synced “= → S → ★” copy on democratizing AI education.
- **Shipped**: `SudarLogoMotion.tsx`, `sudar-logo-animated.css`, `HeroCinematic.tsx` (wider visual column).

### 2026-06-05 — Gateway hero logo uses canonical CSS animation

- **Theme**: Web — replace GSAP SVG logo loop with CSS keyframes from reference `sudar_animated.html` (pill morph + star pop).
- **Shipped**: `teachwithsudar/src/components/gateway/SudarLogoMotion.tsx`, `teachwithsudar/src/styles/sudar-logo-animated.css`.
- **Docs**: `docs/SHIPPED_FEATURES.md` gateway section updated.

### 2026-06-04 — thesudar.com gateway v2 (black canvas, logo fix, less clutter)

- **Theme**: Web — pure black gateway (`#000`), canonical logo loop (= → S → star), restored product pin-scroll mockups + constellation twin; modalities section removed (link to teachwithsudar.com/modalities).
- **Key files**: `gateway-theme.css`, `SudarLogoMotion.tsx`, `ProductTrinity.tsx`, `IntelligenceConstellation.tsx`, `GatewayHomePage.tsx`.
- **Operator**: Preview with `NEXT_PUBLIC_SITE_VARIANT=gateway` on port 3002.

### 2026-06-04 — thesudar.com gateway brand redesign (Option A, no Spline)

- **Theme**: Web — align `thesudar.com` gateway with `docs/brand/design-tokens-v1.md` (deep night, indigo + ember, Manrope); remove violet gradient / Playfair accent patterns and generic particle hero.
- **Shipped**:
  - `teachwithsudar/src/styles/gateway-theme.css` + `data-site-variant="gateway"` on `<html>`.
  - Shared gateway primitives: `GatewayHeadline`, `GatewaySection`, `GatewayCta`; hero `SudarLogoMotion` (logo loop) replaces `HeroCanvas`.
  - Full `GatewayHomePage` sections refactored: editorial product stack, learner-twin grid, modality grid + preview, calmer tutor mock, tokenized impact strip and access gate.
  - Header/footer gateway styling; README local preview for `NEXT_PUBLIC_SITE_VARIANT=gateway`.
- **Operator**: Preview at `http://localhost:3002` with gateway env; deploy via existing `teachwithsudar-pages.yml` matrix job **thesudar**.

### 2026-06-04 — LAMP / arXiv paper prep (tone, cost, benchmarks)

- **Theme**: Research — `docs/research/paper.tex` ready for arXiv moderation (academic tone, reconciled economics, system latency table).
- **Shipped**:
  - Section 5 renamed *Economic Feasibility and Cost Analysis*; marginal AI table without vendor rows in main text; appendix labels Docebo/Sana as illustrative list prices.
  - ALP HTTP contract paragraph + LTI roadmap wording; Keywords block; conclusion de-manifestoed.
  - `COST_WORKSHEET.md` filled (headline **$0.021/learner/month**, sensitivity range).
  - `scripts/benchmark-sudar.mjs` implemented → `docs/research/benchmark-results.json`; performance subsection in paper.
  - arXiv checklists updated in `GET_PDF_AND_ARXIV.md` / `ARXIV_SUBMISSION.md`.
- **Operator**: Recompile PDF in Overleaf; run benchmark with Intelligence up + `INTELLIGENCE_SERVICE_SECRET` before final Table perf numbers.

### 2026-06-03 — Favicon background black (was brand blue)

- **Theme**: Brand — tab icon rounded square now `#000000` with white Sudar mark (all surfaces).
- **Key files**: `*/public/icon.svg` in `teachwithsudar`, `sudar-learn`, `sudar-studio`, `sudar-ecosystem-demo`.

### 2026-06-03 — Split thesudar.com gateway from teachwithsudar.com marketing

- **Theme**: Web presence — restore teachwithsudar.com as the docs/marketing site; keep thesudar.com as the app gateway only.
- **Shipped**:
  - Build flag `NEXT_PUBLIC_SITE_VARIANT` (`gateway` | `marketing`) selects homepage, header, metadata, and smooth-scroll shell.
  - GitHub Action deploys **two** Cloudflare Pages projects: `thesudar` (gateway) and `teachwithsudar` (marketing).
  - Restored marketing homepage (`MarketingHomePage`) and nav (Platform, Guides, Research, …) from pre-gateway design.
- **Operator**: Attach `thesudar.com` only to Pages project **thesudar**; `teachwithsudar.com` only to **teachwithsudar** — see `docs/DNS_THESUDAR_COM.md`.

### 2026-06-03 — Unified browser favicon and tab titles (Learn + Studio + marketing)

- **Theme**: Brand — Sudar logo in browser tabs; professional page titles across apps.
- **Shipped**:
  - Shared `public/icon.svg` (Sudar mark on brand primary `#2f2a8a`) for `sudar-learn`, `sudar-studio`, `teachwithsudar`, `sudar-ecosystem-demo`.
  - Root layout metadata: explicit `icons` config + descriptive default titles (Learn, Studio, marketing, demo).
  - Removed legacy `favicon.ico` from Learn and Studio `src/app/` (replaced default/Vercel fallback).
- **Docs**: `docs/SHIPPED_FEATURES.md`.

### 2026-06-03 — thesudar.com Premium Application Gateway Redesign

- **Theme**: Marketing & Gateway — Redesigned `thesudar.com` homepage in `teachwithsudar/` into a world-class, premium, animation-driven application gateway.
- **Shipped**:
  - Installed GSAP, Lenis, and SplitType for high-fidelity animations.
  - Built `HeroCanvas.tsx` for GPU-cheap orbital ring background animations.
  - Built `HeroCinematic.tsx` with SplitType character-by-character headline reveals and magnetic CTA buttons.
  - Built `ProductTrinity.tsx` with GSAP ScrollTrigger pinned horizontal scrolling through Sudar Learn, Sudar Studio, and Sudar Intelligence.
  - Built `IntelligenceConstellation.tsx` with scroll-triggered SVG node/edge animations representing the Digital Learner Twin.
  - Built `ModalitiesOrbit.tsx` with an interactive 7-modality orbital ring, hover-expand states, and a Framer Motion preview panel.
  - Built `TutorShowcase.tsx` with an auto-playing scripted chat conversation showing Sudar AI tutor's reactive and proactive capabilities.
  - Built `ImpactStrip.tsx` with GSAP counter-up animations on scroll entry.
  - Built `AccessGate.tsx` with a dramatic full-viewport split-screen login portal and GSAP hover ratio animations.
  - Updated `Header.tsx` to streamline navigation for the application gateway with clean login dropdowns and external links to `teachwithsudar.com`.
  - Added Bricolage Grotesque font and custom animation classes to `tailwind.config.ts` and `globals.css`.

### 2026-06-03 — Production domain thesudar.com (Cloudflare)

- **Theme**: Ops — Learn, Studio, and marketing on **thesudar.com** via Cloudflare Workers/Pages.
- **Shipped**:
  - OpenNext Cloudflare adapter for `sudar-learn` and `sudar-studio` (`wrangler.jsonc`, `deploy:cf` scripts).
  - GitHub Actions: `sudar-learn-cloudflare.yml`, `sudar-studio-cloudflare.yml`; marketing deploys to Pages project **thesudar**.
  - Cron workers: `workers/sudar-cron-learn`, `workers/sudar-cron-studio` (replaces Vercel Cron on Cloudflare).
  - Landing: `teachwithsudar/` static export → `thesudar.com` with CTAs to Learn/Studio.
- **Docs**: `docs/CLOUDFLARE_PAGES_DEPLOY.md`, `docs/DNS_THESUDAR_COM.md`, `docs/DEPLOY_THESUDAR_COM.md`, `docs/ENV_REFERENCE.md`, `docs/SHIPPED_FEATURES.md`.

### 2026-06-03 — Learn dashboard hyperdrive loading animation

- **Theme**: Sudar Learn — first-open dashboard loader feels faster and more alive.
- **Shipped**: Dashboard loading uses header `SudarLogoMark` FLIP morph — logo expands to center while loading, page collapses into logo on complete, logo returns to nav.
- **Key files**: `sudar-learn/src/components/branding/SudarLogoMorphLoader.tsx`, `sudar-learn/src/components/layout/TopNav.tsx`, `sudar-learn/src/app/(dashboard)/loading.tsx`.

### 2026-06-03 — Knowledge bases + MarkItDown RAG ingest (Studio + Learn + Intelligence)

- **Theme**: Org-scoped document libraries for tutor RAG — PDF/Office/media uploads via MarkItDown, async ingest, pgvector chunks.
- **Shipped**:
  - Supabase: `knowledge_bases`, `kb_ingest_queue`, `content_chunks.kb_id`, `match_content_chunks` with `filter_kb_ids`.
  - Intelligence: `POST /api/kb/convert-markdown` (`markitdown[all]`).
  - Learn: cron `POST /api/cron/process-kb-uploads`, KB APIs, tutor RAG merges org KB excerpts.
  - Studio: `/settings/knowledge-bases`, `/api/kb/*` upload + queue status + retry.
  - Learn: `/settings/knowledge` (when `knowledge_bases.allow_learner_uploads` in org settings).
- **Docs**: `docs/KNOWLEDGE_BASE_SETUP.md`, `docs/MARKITDOWN_INTEGRATION.md`, `docs/SHIPPED_FEATURES.md`, `docs/ENV_REFERENCE.md`.

### 2026-06-02 — SudarArt temporarily disabled (Studio)

- **Theme**: Sudar Studio quality safeguard.
- **Shipped**: Temporarily removed SudarArt from the sidebar navigation and replaced `/tools/sudarart` with an unavailable notice page.
- **API behavior**: `POST /api/ai/sudarart/generate` now returns `503` with a clear “temporarily disabled” error message so clients fail fast and predictably.
- **Key files**: `sudar-studio/src/components/layout/Sidebar.tsx`, `sudar-studio/src/app/(dashboard)/tools/sudarart/page.tsx`, `sudar-studio/src/app/api/ai/sudarart/generate/route.ts`.
- **Docs**: Updated `UPDATES.md` and `docs/SHIPPED_FEATURES.md`.

### 2026-06-02 — SudarArt v2 hybrid rebuild (aipencil + Flux + style controls)

- **Theme**: Sudar Studio — `/tools/sudarart` now supports strategic hybrid generation instead of CSS-only output.
- **Shipped**: Added multi-engine generation with `artMethod` (`aipencil`, `llm-css`, `flux`), visual style presets, figure theme controls, and response telemetry (`elapsedMs`, approximate cost, warnings/model details).
- **Engine path**:
  - `aipencil` mode: integrated CLI-first rendering (`AIPENCIL_PATH`) with deterministic fallback SVG pipeline when binary is unavailable.
  - `llm-css` mode: existing strict SceneSpec + CSS compiler retained and now returned as precompiled render payload.
  - `flux` mode: added Hugging Face image generation path (`FLUX_API_KEY`, `FLUX_MODEL`) for high-fidelity image output.
- **Studio UI**: SudarArt page now exposes engine selector, layout style, visual style, figure theme (for full-figure), and generation metadata chip (method/time/cost/model).
- **Key files**: `shared/sudarart/aipencilCompiler.ts`, `sudar-studio/src/lib/ai/aipencilClient.ts`, `sudar-studio/src/lib/ai/fluxClient.ts`, `sudar-studio/src/app/api/ai/sudarart/generate/route.ts`, `sudar-studio/src/app/(dashboard)/tools/sudarart/page.tsx`, `sudar-studio/.env.example`.
- **Docs**: Updated `UPDATES.md` and `docs/SHIPPED_FEATURES.md`.

### 2026-06-02 — Studio course creation form refresh (motion + branding)

- **Theme**: Sudar Studio — modernized `/courses/new` interaction design for AI, manual, document, and SCORM flows.
- **Shipped**: Replaced the generic AI sparkles header icon with animated `SudarLogoMark`; renamed the AI header to **Create with Sudar AI**; added staggered section entrance animations, interactive mode card lift states, smoother input focus transitions, animated option chips/buttons, and richer error presentation.
- **Design alignment**: Consolidated key accents toward Sudar indigo for AI flow interactions while retaining semantic emerald/amber cues for document and SCORM modes.
- **Key file**: `sudar-studio/src/app/(dashboard)/courses/new/page.tsx`.
- **Docs**: Updated `UPDATES.md` and `docs/SHIPPED_FEATURES.md`.

### 2026-06-02 — External courses import, tagging, tutor + NBA integration

- **Theme**: Bring third-party courses into Sudar with org tags, iframe viewing, and intelligent recommendations.
- **Studio**: Provider adapters (YouTube, Udemy, Coursera, edX, Khan, manual URL); import API with LLM tag suggestions; **Settings → External courses** policy; **External courses → Import** UI.
- **Learn**: Extended external viewer (consent, sign-in gate, Ask Sudar); engagement tracking on `learner_profiles.external_course_engagement`; RAG ingest for external metadata; tutor + proactive nudge + NBA scoring for external courses.
- **Database**: `supabase/migrations/20260602120000_external_courses_extended.sql`.
- **Key files**: `sudar-studio/src/lib/providers/`, `sudar-studio/src/app/api/org/external-courses/`, `sudar-learn/src/lib/external/`, `sudar-learn/src/lib/rag/ingestExternalCourse.ts`.

### 2026-06-02 — Notification settings: UX refactor (Studio)

- **Theme**: Studio — reduce cognitive load during course generation by centralizing notification preferences.
- **Changed**: Moved browser notification and in-tab chime toggles from the course generation overlay/forms to a dedicated **Settings → Notifications** page. Notifications are now **user preferences** (not generation-time decisions).
- **Why**: Notification prompts interrupted workflow at the most critical moment (generation in progress). Settings is the correct place to keep notification engine configuration.
- **Implementation**: Added `notification_preferences` JSON field to `profiles` table; created `/api/user/notification-preferences` (GET/PATCH); new `Settings > Notifications` page with same controls + clearer UX; updated `useBrowserCompletionNotification` hook to read/write from Supabase (persists across devices/sessions); removed all prompt UI from `NewCoursePage` generation overlay, AI wizard, and document import forms.
- **Behavior**: On first visit, Sudar reads user defaults (false for notifications, false for sound, 50% volume); notifications only fire if the user has opted in via Settings page and browser permission is granted.
- **Key files**: `sudar-studio/prisma/schema.prisma` (Profile model), `sudar-studio/src/app/(dashboard)/settings/notifications/page.tsx`, `sudar-studio/src/app/api/user/notification-preferences/route.ts`, `sudar-studio/src/hooks/useBrowserCompletionNotification.ts`, `sudar-studio/src/app/(dashboard)/courses/new/page.tsx`.
- **Benefit**: Cleaner course generation flow; notification preferences persist; accessible from a dedicated, intuitive settings page.

### 2026-06-02 — Course generation quality v2 (instructional design + Learn UX)

- **Theme**: Studio generation pipeline + Learn course reader — less repetitive AI content, better layout, creator control over visual identity.
- **Generation**: Domain-specific introduction strategies (no more default “calculator program” openers); SME context on curriculum + modules; stricter interactive component validation (matching pairs, flipcards, empty blocks dropped); quality scoring stored in `generation_telemetry`; side cards default to **hidden** (floating insight hotspot in Learn).
- **Studio**: **BrandSettings** on AI course wizard (domain, theme, brand colors, density, quality toggles); **Content quality** page per course (`/courses/[id]/quality`).
- **Learn**: Full-width reading column (no permanent side column); fixed flipcard mirror bug; matching supports `left`/`right` pairs; optional `content_theme` + brand colors from course settings.
- **Key files**: `sudar-studio/src/lib/ai/courseGeneration/{prompts,pipeline,introductionStrategies,componentValidation}.ts`, `sudar-studio/src/lib/ai/componentSelector.ts`, `sudar-studio/src/components/generator/BrandSettings.tsx`, `sudar-learn/src/components/learn/RichModuleContent.tsx`, `sudar-learn/src/lib/courseBodyMarkdown.tsx`, `sudar-learn/src/components/learn/blocks/FlipcardBlock.tsx`.

### 2026-06-02 — Learn read-aloud voice preference fix

- **Issue**: Read aloud feature was not using the learner's voice preference from settings.
- **Fix**: Updated `ReadAlongControls` to fetch the learner's TTS voice preference from `/api/learner/preferences` on mount and pass it to the audio generation endpoint.
- **Where learners set it**: Sudar Learn **Settings → Preferences** has a **VoiceCharacterStage** component for selecting TTS voice (part of audio/mascot customization).
- **Flow**: Settings page saves to `ai_tutor_context.preferences.tts_voice` → `ReadAlongControls` fetches it → generates audio with learner's chosen voice.
- **Key files**: `sudar-learn/src/components/learn/ReadAlongControls.tsx`, `sudar-learn/src/app/(dashboard)/settings/page.tsx`, `sudar-learn/src/app/api/learner/preferences/route.ts`.
- **Benefit**: Read aloud now respects the learner's audio voice choice, making the feature actually useful instead of generic.

### 2026-06-02 — Video display fix: iframe rendering + sandbox security

- **Theme**: Learn — video modality visibility and performance.
- **Fixed**: Recurring issue where generated SudarVid videos wouldn't display after generation completed. Root causes: iframe remounting, restrictive sandbox, missing load state, unclear render grant errors.
- **Changes**: Added iframe load tracking, expanded sandbox attributes (`allow-presentation`), enhanced `allow` attribute (fullscreen, picture-in-picture), removed `key={jobId}` remounting, improved render grant error handling, added iframe readiness signal via postMessage.
- **Result**: Videos now display reliably; loading overlay shows while iframe initializes; better error diagnostics.
- **Key files**: `sudar-learn/src/app/(dashboard)/courses/[id]/learn/SudarVidCard.tsx`, `VIDEO_DISPLAY_FIX.md`.

### 2026-06-02 — Learn hibernation overlay animation

- **Theme**: Learn — inactivity hibernation UX polish.
- **Shipped**: Replaced spinning Sudar logo with a sleeping hibernation animation — tilted logo with closed-eye overlay, floating ZZZ particles, and subtle cave backdrop; distinct warning vs hibernating motion.
- **Key files**: `sudar-learn/src/components/features/activity/HibernationAnimation.tsx`, `sudar-learn/src/components/features/activity/InactiveHibernationOverlay.tsx`, `sudar-learn/tailwind.config.ts`.

### 2026-06-01 — External open courses (Discover) in Learn

- **Catalog tabs**: **Organisation** vs **Open courses** on `/courses` (`?tab=discover`); provider filter pills; dashed amber styling and external labels on open-course cards.
- **Discover**: Published courses can be flagged `is_external` with provider (`youtube`, `khan_academy`, `mit_ocw`, `custom`), link-out URL, and optional embed URL. Detail page preview + learn viewer use shared `ExternalCourseEmbed` (iframe when embeddable, labelled fallback link-out).
- **Learn viewer**: `ExternalCourseViewer` — in-app iframe + **Mark as complete** → `module_complete` event, enrollment progress, gamification.
- **NBA**: Next Best Action payload includes `is_external` / provider metadata; dashboard CTA routes to learn for open courses.
- **Seed**: Migration seeds CS50 (YouTube), Khan Algorithms, MIT 6.006, PY4E when an org + profile exist.
- **Key files**: `supabase/migrations/20260601000000_external_open_courses.sql`, `sudar-learn/src/app/(dashboard)/courses/[id]/learn/ExternalCourseViewer.tsx`, `sudar-learn/src/lib/courses/externalProviders.ts`, `sudar-learn/src/lib/intelligence/nextBestActionEngine.ts`.

### 2026-05-29 — AI token monitoring & usage dashboard (Studio)

- **Metering**: `ai_usage_events` append-only ledger + `ai_usage_daily_org` rollups + `ai_model_pricing` reference rates; `chatCompletion` parses provider `usage` and records per call (feature, call_kind, org, user).
- **Studio**: **Analytics → AI usage** (`/analytics/ai-usage`) — totals, by-feature breakdown, estimated marginal USD, CSV export; cron `POST /api/cron/ai-usage-rollups`.
- **Coverage**: Tutor (guardrail/main/quiz/memory), course generation pipeline, Studio agent, modalities, RAG query embeds, memory cron; optional org `ai_entitlements` monthly cap (`hard_stop`).
- **Key files**: `supabase/migrations/20260529120000_ai_usage_monitoring.sql`, `shared/ai/*`, `sudar-learn/src/lib/ai/chat.ts`, `sudar-studio/src/app/api/org/ai-usage/*`, `sudar-studio/src/components/analytics/AiUsageDashboard.tsx`.

### 2026-05-29 — Hugging Face integration: multilingual RAG v2 + Intelligence providers

- **Learn RAG**: Default HF embed model `BAAI/bge-m3` (1024-dim); module-level ingest with chunking; in-course vector excerpts in tutor; optional `BAAI/bge-reranker-v2-m3` reranking (`RAG_RERANK_ENABLED`).
- **Intelligence**: `AI_CHAT_PROVIDER=huggingface`, `IMAGE_PROVIDER=huggingface`; shared `hf_client.py`; smoke route `GET /api/health/hf-chat`.
- **Ops**: `docs/HF_INTEGRATION_TEST.md`, `scripts/hf/*` smoke tests, expanded Studio keys card and `ENV_REFERENCE.md`.
- **Key files**: `sudar-learn/src/lib/hf/client.ts`, `sudar-learn/src/lib/rag/chunk.ts`, `sudar-learn/src/lib/rag/rerank.ts`, `sudar-learn/src/app/api/rag/ingest/route.ts`, `sudar-intelligence/src/core/hf_client.py`, `sudar-intelligence/src/api/routes/image.py`.

### 2026-05-26 — Teach with Sudar: Research Papers page aligned with LAMP preprint

- **Papers page**: Rebuilt `/papers` from the May 2026 LAMP/ALP preprint — paper card with keywords and abstract, three contribution cards, capability comparison table, infrastructure cost table, BibTeX/APA citations, and reproducibility artefact list.
- **Readability**: Tables use `not-prose` styling so captions and columns render cleanly on the marketing site.
- **Key files**: `teachwithsudar/src/app/papers/page.tsx`.

### 2026-05-26 — Teach with Sudar: /demo ships launch demo on teachwithsudar.com

- **Demo page**: Removed local-dev instructions; **Watch launch demo** links to same-origin `/launch-demo` (no broken localhost:3003).
- **Build**: `sudar-ecosystem-demo` static export with `basePath=/launch-demo` copied into `teachwithsudar/public/launch-demo` on `npm run build` (CI included).
- **UX**: Embedded preview iframe on `/demo`; interactive tour at `/launch-demo/interactive/`.
- **Key files**: `teachwithsudar/src/app/demo/page.tsx`, `teachwithsudar/src/lib/demo-urls.ts`, `scripts/copy-launch-demo.mjs`, `sudar-ecosystem-demo/next.config.ts`.

### 2026-05-26 — Teach with Sudar: homepage hero demo polish (full width, 3D, chat flow)

- **Homepage hero**: Demo spans full content width (`max-w-[1400px]`); wireframe stage has mouse-reactive 3D tilt and depth shadow.
- **Cursor**: Spring-physics pointer persists across steps with delayed click on arrival (feels hand-driven).
- **Learn + tutor**: Steps 5–7 use one continuous Learn scene — video stays on screen, Sudar chat slides in as a messenger panel with typing and reply bubbles (no hard scene swap).
- **Key files**: `HeroFlowDemo.tsx`, `HeroDemoCursor.tsx`, `HeroScene3D.tsx`, `HeroLearnFlowScene.tsx`, `HeroTutorChat.tsx`.

### 2026-05-26 — Teach with Sudar: homepage hero user-flow demo

- **Homepage hero**: Replaced the static “I paused the video” chat card with an autoplaying wireframe journey — Studio creation → cohort personalization → Marcus on Learn → contextual tutor → Memory (animated cursor, step captions, progress dots).
- **Wireframes**: Ported rich ecosystem-demo scenes into teachwithsudar (`learn-course-rich`, `learn-tutor-contextual`, `studio-live-editor`, etc.) plus `DemoCursor`, `heroFlowDemo.ts`, and Prison Mike lesson asset.
- **Key files**: `teachwithsudar/src/components/home/HeroFlowDemo.tsx`, `teachwithsudar/src/data/heroFlowDemo.ts`, `teachwithsudar/src/components/wireframes/**`, `teachwithsudar/public/characters/prison-mike.png`.

### 2026-05-26 — Teach with Sudar: GitHub Actions → Cloudflare Pages

- **CI/CD**: Added `.github/workflows/teachwithsudar-pages.yml` — on push to `main` (paths: `teachwithsudar/`, `help-center/`), builds static export and deploys to Cloudflare Pages project `teachwithsudar`. Supports manual **workflow_dispatch**.
- **Ops**: Requires GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; optional repo variable `NEXT_PUBLIC_ECOSYSTEM_DEMO_URL`.
- **Key files**: `.github/workflows/teachwithsudar-pages.yml`, `teachwithsudar/README.md`, `docs/ENV_REFERENCE.md`.

### 2026-05-26 — Teach with Sudar: research foundation refresh

- **Homepage**: Research Foundation section now uses six citations in three tiers (Foundation, Modern validation, AI era) — classics (Ebbinghaus, Mayer 2009) plus Roediger & Karpicke (2006), VanLehn (2011), Learn Your Way (2025), and AgentTutor (2026), each mapped to a Sudar feature.
- **Research page**: Aligned evidence list and LAMP paper pointer with the homepage cards.
- **Key files**: `teachwithsudar/src/app/page.tsx`, `teachwithsudar/src/app/research/page.tsx`.

### 2026-05-26 — Teach with Sudar: custom blog illustration banners

- **Assets**: Five Sudar-branded flat vector banners (dark #111 + orange #FF4500) in `teachwithsudar/public/blog/` — one per blog post.
- **Blog**: All hero images switched from Unsplash to local `/blog/*.png`; redundant inline stock photos removed.
- **Key files**: `teachwithsudar/public/blog/`, `teachwithsudar/src/data/blogPosts.ts`.

### 2026-05-26 — Teach with Sudar: blog expansion + layout fixes

- **New posts**: Added multimodal learning design and AI tutor memory articles with arXiv/peer-reviewed citations.
- **Layout**: Fixed blog card hero images overlapping date/read-time (prose `img` styles vs. Next.js `fill`); blog index and post pages now use `not-prose` wrappers with isolated image containers.
- **Formatting**: BlogArticle renders `**bold**` inline markdown, consistent typography (leading-7), and internal/external CTA links.
- **Key files**: `teachwithsudar/src/data/blogPosts.ts`, `teachwithsudar/src/components/BlogArticle.tsx`, `teachwithsudar/src/app/blog/**`.

### 2026-05-26 — Teach with Sudar: blog articles rewritten for SEO

- **Blog content**: Replaced checklist-style posts with research-backed articles (arXiv citations, peer-reviewed meta-analyses, MOOC completion data). Each post includes hero images, reading time, tags, further-reading sections, and a Sudar pitch at the bottom.
- **Rendering**: New `BlogArticle` component supports paragraphs, lists, quotes, images, references, steps, and pitch callouts; blog index and post pages add Open Graph metadata and JSON-LD.
- **Key files**: `teachwithsudar/src/data/blogPosts.ts`, `teachwithsudar/src/components/BlogArticle.tsx`, `teachwithsudar/src/app/blog/**`, `teachwithsudar/next.config.ts` (Unsplash images).

### 2026-05-25 — Teach with Sudar: hero logo scroll animation

- Homepage hero: **Sudar.** logo starts centered at the top of the hero and scroll-travels into the nav slot (180px range); nav compacts after the animation completes. Respects `prefers-reduced-motion`.
- **Key files**: `teachwithsudar/src/components/home/HeroScrollLogo.tsx`, `teachwithsudar/src/hooks/useHeroLogoScroll.ts`, `teachwithsudar/src/components/Header.tsx`, `teachwithsudar/src/components/home/HeroSection.tsx`.

### 2026-05-25 — Teach with Sudar: infrastructure-agnostic copy

- Generalized Supabase-specific marketing across FAQ, Privacy, Self-host, Story, Compare, Terms, homepage, guides data, help hub, and help-center getting-started articles — data lives in **your Postgres tenant** (managed or self-operated), not a single vendor.
- **Key files**: `teachwithsudar/src/app/**`, `teachwithsudar/src/data/*`, `help-center/articles/start-here/getting-started.md`, `help-center/articles/admins/studio-overview.md`.

### 2026-05-25 — Teach with Sudar: trust section on homepage

- **Digital Learner Twin callout**: Replaced Supabase-specific copy with infrastructure-agnostic data sovereignty messaging (your DB, region, retention).
- **Trust & guardrails** (homepage): New section covering Safety, Privacy, Security, Compliance & rights, plus long-term alignment that learner data serves learners — links to Privacy Policy, Studio governance, FAQ, and `docs/trust`.
- **Key files**: `teachwithsudar/src/app/page.tsx`.

### 2026-05-25 — Demo: Marcus mobile + 1.5× speed

- **Marcus beats** (`launchDemo.ts`): Learn wireframes in **phone frame** (`MobileDeviceFrame`, bottom tab nav) from personal context through memory — matches “Lagos · phone · between shifts.”
- **Playback** (`cinematicPlayback.ts`): Autoplay runs at **1.5×** (~3 min total); in-scene typing/progress animations scaled to match.

### 2026-05-25 — Ecosystem demo v3 (cinematic rework)

- **Narrative** (`launchDemo.ts`): Marketing-first script (~4:30) — Ebbinghaus gap, Bloom 2σ, $0.02/learner stat, Sarah→Marcus story; no UI-component names in overlays; consolidated block beats (no per-block title spam).
- **Camera** (`Scene3DStage.tsx`): Per-frame `cameraEffect` — zoom-in/out, push-left/right (Ken Burns) wired from `launchDemo.ts`.
- **Screens**: Fixed cinematic canvas height (`h-[min(58vh,520px)]`) so wireframes stay full-size, not small rectangles; wider stage max-width.
- **In-scene motion**: Typing prompt, module stagger, generating spinner, spring block slides, animated video playhead, tutor typing dots + streamed reply, KPI count-up, ecosystem layer stagger.
- **Key files**: `launchDemo.ts`, `demoMotion.ts`, `DemoScenesExtended.tsx`, `TutorConversationPanel.tsx`, `WireframePrimitives.tsx`, `Scene3DStage.tsx`.

### 2026-05-25 — Ecosystem demo review pass

- **Cinematic** (`launchDemo.ts`): Removed redundant `act6-1`; overlay copy refresh (Ebbinghaus stat, Bloom headline, tutor/memory lines); `act8-0` integrations title; `act5-tutor-proactive` extended to 11s; close card CTA `teachwithsudar.com`.
- **Wireframes**: Richer `AlpFlowScene` (events + Twin affinity bars), `AnalyticsComplianceScene` (KPIs, Certified chip, Live pulse), ecosystem Learn→Twin feedback loop, Studio dashboard COHORT/LEARNER chips, Bloom strip legibility, Learn dashboard streak pill.
- **Docs**: [docs/DEMO_AI_REVIEW_PACKET.md](docs/DEMO_AI_REVIEW_PACKET.md) updated for applied review.

### 2026-05-25 — Ecosystem demo narrative v2 (~5 min)

- **Launch story** (`sudar-ecosystem-demo/` `/`): Expanded to **~5 minutes** — content generation from idea, business need, document, cohort, and learner context; instructional-design blueprint (Bloom, archetypes); live Studio block build (text, video, audio, accordion, flipcard, quiz); personalization act; Marcus stuck on video with **contextual Sudar chat** and typed reply.
- **Course theme**: Sarah prompts *fun office management* → **Somehow I manage** (Michael Scott); `public/characters/prison-mike.png` in video preview.
- **UI fidelity**: Learn wireframes use light/purple chrome; Studio stays dark; new scenes `studio-create-sources`, `studio-id-blueprint`, `studio-live-editor`, `learn-course-rich`, `learn-tutor-contextual`, `learn-memory-rich`.
- **Interactive tour** (`/interactive`): Chapters rewritten — Content generation, Live editor blocks, Tutor, Memory.
- **Key files**: `launchDemo.ts`, `ecosystemDemo.ts`, `sceneState.ts`, `DemoScenesExtended.tsx`, `CourseBlockCanvas.tsx`, `TutorConversationPanel.tsx`, `LearnNavChrome.tsx`.

### 2026-05-25 — Cinematic product launch demo

- **Launch experience** (`sudar-ecosystem-demo/` `/`): Full-screen cinematic player — 28 frames, title cards, animated typography overlays on wireframes, play/pause only (auto-hide controls), ~3 min narrative.
- **How-to tour** (`/interactive`): Previous step-by-step player retained for teachwithsudar guides and help how-tos.
- **Key files**: `launchDemo.ts`, `CinematicPlayer.tsx`, `TitleCard.tsx`, `TextOverlay.tsx`, `VideoControls.tsx`.

### 2026-05-25 — Ecosystem wireframe demo app

- **Standalone demo** (`sudar-ecosystem-demo/`): Next.js app on port 3003 — wireframe scenes, cursor animation; interactive mode at `/interactive`.
- **Docs**: [docs/demo.md](docs/demo.md), teachwithsudar `/demo`; root script `npm run demo:ecosystem`.

### 2026-05-24 — teachwithsudar.com platform upgrade

- **Marketing site** (`teachwithsudar/`): Capability catalog (`platformCapabilities.ts`), 10 animated wireframe guides (`/guides/[slug]`), expanded Features/Updates/Best Practices/Help hubs, FAQ refresh (MCP, sounds, i18n), homepage “What ships today” section. Copy pass: no em-dashes; plainer voice.

### 2026-05-24 — teachwithsudar.com copy pass

- **Marketing site** (`teachwithsudar/`): Removed em-dashes sitewide; rewrote homepage hero, problem, platform, Digital Learner Twin, research, manifesto, and CTA copy for a plainer voice. Metadata titles use `|` instead of em-dash. `WEBSITE_CONTENT.md` aligned for editors.

### 2026-05-24 — ChatGPT-ready MCP (thesudar.app)

- **Creator MCP tools**: `sudar_generate_outline`, `sudar_generate_course`, `sudar_generate_quiz`, `sudar_generate_from_document`, `sudar_create_course`, `sudar_list_courses` — proxy Studio routes with Bearer JWT.
- **Studio**: Bearer auth on creator API routes; `POST /api/mcp/audit`; Integrations **ChatGPT connector** URL + [MCP_CHATGPT_LAUNCH.md](docs/MCP_CHATGPT_LAUNCH.md).
- **Cloudflare Worker**: [workers/sudar-mcp-cloudflare](workers/sudar-mcp-cloudflare) — OAuth metadata, Supabase token exchange, Streamable HTTP `/mcp` for ChatGPT/Claude.
- **Deploy docs**: [DNS_THESUDAR_APP.md](docs/DNS_THESUDAR_APP.md), [DEPLOY_THESUDAR_APP.md](docs/DEPLOY_THESUDAR_APP.md), [openapi/sudar-creator-v1.json](openapi/sudar-creator-v1.json) (Custom GPT Actions fallback).
- **npm**: `@sudar/mcp-server` v0.2.0 — [NPM_PUBLISH.md](docs/NPM_PUBLISH.md).

### 2026-05-22 — Sudar MCP servers (ALP + Agents for AI clients)

- **MCP package**: `packages/sudar-mcp` (`@sudar/mcp-server`) — stdio server with integrator, admin, and learner toolsets proxying Learn ALP and BFF routes.
- **Remote worker**: `workers/sudar-mcp-remote` — `POST /token` (API-key exchange) + SSE `/sse` for hosted MCP partners.
- **Learn/Studio**: `getRequestSession` Bearer JWT support on agents, tutor, next-action, proactive-nudge; `POST /api/mcp/audit` for optional MCP telemetry.
- **Studio UI**: Integrations page — Cursor `mcp.json` snippet and MCP docs link.
- **Docs**: `docs/MCP_SERVERS.md`, `docs/ENV_REFERENCE.md`, `docs/SHIPPED_FEATURES.md`, `docs/ALP_API.md` cross-link.

### 2026-05-22 — Chime-style notification sounds (Learn + Studio)

- **Learn — in-app chimes**: Optional subtle completion sounds when AI content generation finishes, Sudar tutor replies, realtime notification toasts, and gamification celebrations. Master toggle + volume + per-event groups on **Settings → Notification controls**; respects quiet hours and `prefers-reduced-motion`.
- **Learn — implementation**: `shared/notifications/sound.ts`, `NotificationSoundProvider`, hooks in `SudarVidCard`, `CourseViewer`, tutor chat, `NotificationToasts`, `GamificationToasts`; assets under `sudar-learn/public/audio/notifications/`.
- **Studio — course generation**: “Play a chime when the course is ready” (localStorage) alongside existing browser notifications on **New course**; `useBrowserCompletionNotification` plays `task_complete` chime on success.
- **Database**: `supabase/migrations/20260522120000_notification_sound_settings.sql` — `user_notification_settings` sound columns.
- **Docs**: `docs/SHIPPED_FEATURES.md` catalog entry.

### 2026-05-22 — Learn API correctness + dependency security patches

- **Learn — security / correctness**:
  - `GET /api/learn/module-bridge` now requires an **enrollment** row for `course_id` and loads only **published** courses (closes an IDOR / draft metadata leak vs arbitrary UUIDs).
  - `POST /api/events` returns **500** when the `learning_events` insert fails instead of reporting success and running downstream side effects without the event row.
  - `consolidate-learner-memory` cron treats failed `learner_profiles` digest updates as failures (HTTP **500** for batch or single-user runs when persistence fails).
  - Tutor **input guardrail** no longer skips scope checks based on client-supplied `conversation_history`; extracted to `runInputGuardrail.ts`.
  - Tutor **quick actions** restored in-course via `buildTutorActionAllowlists` (active `course_id` always allowed for Continue/Review buttons).
- **Intelligence — BYOM SSRF**: `RuntimeProviderConfig` rejects unsafe local LLM base URLs before health checks (private hosts blocked unless `INTELLIGENCE_ALLOW_PRIVATE_LLM_URLS` is set).
- **Dependencies (Learn + Studio)**: bumped **Next.js** to `15.5.18` and **PostCSS** to `8.5.10` to clear high-severity `npm audit` findings in CI.
- **Localization**: fixed malformed `src/messages/*.json` catalogs (missing `Memory` section close) so Learn builds pass stricter JSON parsing on Next 15.5.
- **Studio lint**: typed SudarVid job access helper (fixes stricter ESLint on Next 15.5).

### 2026-05-13 — Localization + tutor memory LLM cadence

- **Localization (Learn + Studio + Intelligence)**:
  - **Learn**: `next-intl` (cookie `NEXT_LOCALE`), 30+ locale catalogs under `sudar-learn/src/messages/`, dynamic `lang`/`dir`, Noto font stacks + RTL; **Memory** → language (UI / content / auto-detect) via `learner_preferences` + sync to `learner_profiles.preferred_language`; multilingual Edge + Sarvam TTS maps; tutor + proactive routes inject `content_language`; `POST /api/ai/generate-image` proxies Intelligence.
  - **Studio**: `next-intl` + org **Localization** card (Studio UI cookie + org default UI locale for learners in `organisations.settings.localization.default_ui_locale`); `GET`/`PATCH` `/api/org/settings` exposes `localization`; optional **AI course covers** on AI course creation when Intelligence + `TOGETHER_API_KEY` return image bytes → `course-media` (`sudar-studio/src/lib/intelligence/courseCoverFromTogether.ts`).
  - **Intelligence**: Sarvam `target_language_code` from request; `ContentGenerateRequest.language`; `POST /api/image/generate` (Together FLUX).
  - **DB**: optional index migration `supabase/migrations/20260513120000_learner_preferred_language_index.sql` on `learner_profiles(preferred_language)`.
  - **Shared**: `shared/i18nLocales.ts` — canonical locale list + `LOCALE_OPTIONS`.
- **Tutor memory LLM cadence (learner + org)**:
  - **Learn**: My Memory → Learning preferences — learners set **how often** an LLM may infer profile updates from tutor chat (`off` / per message / daily / weekly) and **minimum days** between long-range digest summaries (1 / 7 / 30). Tutor route gates `updateLearnerMemory`; `ai_tutor_context.tutor_memory_llm_last_extraction_at` tracks last extraction.
  - **Learn cron**: `consolidate-learner-memory` respects digest cadence and org policy (skip digest when org disables LLM memory updates).
  - **Studio**: Org settings → AI personalization — **Tutor memory — LLM learning cadence**: org-wide disable, optional minimum hours between profile-inference LLM runs, optional minimum days between digests (floors on learner choices).
  - **Docs**: `docs/sudar-memory.md`, `docs/LAMP-Updated-Draft.md` (abstract + twin/tutor sections), `teachwithsudar` papers blurb; `docs/SHIPPED_FEATURES.md` catalog entry.

### 2026-04-26 — GitHub homepage: professional README and documentation pointers

- **Web presence (repo)**: Reworked the root **README** into a product-focused GitHub landing page: clear value proposition, comparison vs typical LMSs, capability sections for **Sudar Studio**, **Sudar Learn**, and **Sudar Intelligence**, architecture diagram, trust/governance and ALP callouts, and links to **Supabase** single data layer, deployment docs, and deeper specs — without foregrounding internal folder renames.
- **Documentation map**: README now points contributors to [ECOSYSTEM.md](ECOSYSTEM.md), [RESEARCH_FOUNDATION.md](RESEARCH_FOUNDATION.md), [docs/PRODUCT_FEATURES.md](docs/PRODUCT_FEATURES.md), [docs/SHIPPED_FEATURES.md](docs/SHIPPED_FEATURES.md), [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md), and this file for ongoing update tracking.
- **Repo hygiene**: Source-of-truth for dated milestones remains **UPDATES.md**; use it for user-facing and meaningful technical milestones, not build-cache or local-only noise.

### 2026-04-17 — Sudar consolidation + engagement and proactive learning pass

- **Repo and naming consolidation**:
  - Continued broad migration from legacy `byteos-*` paths to `sudar-*` paths across apps, docs, scripts, and environment references.
  - Removed legacy premium-LMS and older video surface remnants in favor of the current Sudar app structure.
- **Learn product expansion (engagement + retention)**:
  - Added gamification and motivation surfaces: achievements, quests/rewards, coins, check-in APIs, KPI/leaderboard/insight endpoints, and supporting UI components.
  - Added notifications center and profile/avatar utilities for learner identity and re-engagement loops.
  - Added inactivity hibernation handling and proactive nudge infrastructure to support safer, context-aware learner prompts.
- **Tutor and AI interaction upgrades**:
  - Added proactive tutor prompt/reply APIs and reusable response contract scaffolding for consistent tutor behavior.
  - Added voice preview assets/routes and voice-provider status checks to improve audio modality reliability and learner choice.
  - Extended generation/tutor route integrations and supporting libs for more resilient orchestration.
- **Intelligence and docs alignment**:
  - Updated Intelligence route/auth wiring and related deployment/environment guidance.
  - Refreshed roadmap, trust, product, user-flow, and shipped-feature documentation to reflect current Sudar scope and naming.

### 2026-04-15 — Gamification Fast MVP shipped (core parity + engagement polish)

- **API parity (Learn)**:
  - Added `POST /api/quests/progress` (`sudar-learn/src/app/api/quests/progress/route.ts`) to emit milestone events and run immediate gamification evaluation.
  - Added missing quest lifecycle events on assignment (`quest_started`) in `sudar-learn/src/app/api/quests/route.ts`.
- **Reward correctness**:
  - Unified check-in reward handling through the central gamification engine (removed duplicate direct coin/xp writes from `sudar-learn/src/app/api/checkin/answer/route.ts`).
  - Engine now emits structured `learning_events` for `level_up`, `achievement_unlocked`, `quest_step_completed`, and `quest_completed`.
- **Profile completeness**:
  - Added deterministic completeness rollup helper (`sudar-learn/src/lib/gamification/profileCompleteness.ts`).
  - Wired completeness updates from check-ins and learner preference updates into `learner_profiles.profile_completeness_pct`.
- **Animation + interaction (Learn)**:
  - Added global gamification toast layer (`sudar-learn/src/components/features/gamification/GamificationToasts.tsx`) for level-up and badge unlock feedback.
  - Mounted to dashboard layout for always-on milestone feedback.
  - Check-in floating card now reflects actual earned coins and level-up state from backend response.
- **Challenges (Studio + engine)**:
  - Added org challenge progression endpoint: `sudar-studio/src/app/api/org/challenges/[id]/progress/route.ts`.
  - Enhanced challenge listing API with aggregate `teamProgress`.
  - Added org challenge progression and coin prize payout logic in `sudar-learn/src/lib/gamification/engine.ts`.

### 2026-04-15 — Repository path rename migration (`byteos-*` -> `sudar-*`)

- **Directory rename shipped**:
  - `byteos-studio` -> `sudar-studio`
  - `byteos-learn` -> `sudar-learn`
  - `byteos-intelligence` -> `sudar-intelligence`
- **Reference updates**: filesystem path references across docs/scripts/config were updated to `sudar-*`.
- **Compatibility window active (temporary)**: historical notes may still mention `byteos-*`; treat them as aliases during this stabilization cycle.
- **Cleanup target**: remove remaining legacy alias mentions after one full stabilization cycle (target date: 2026-05-15).

### 2026-04-11 — Sudar: brand, personalization v2, trust pack, governance, learner UX

**Continuing this work (operators & agents)**  
- **Database**: Apply `supabase/migrations/20260410000000_personalization_v2.sql` to the shared Supabase project (consent column, `personalization_overlays` on enrollments, `learner_groups` / `learner_group_members`). Then align Prisma: `sudar-studio` — `npx prisma db pull` or `db push` as you normally do for this repo.  
- **Policy & product docs**: Brand and messaging live under `docs/brand/`; security / procurement context under `docs/trust/` (indexed in `docs/trust/README.md`). Studio **Governance** (`/governance`) links learners to the trust pack.  
- **Code map**: Learn personalization gates — `sudar-learn/src/lib/personalization/eligibility.ts`, module overlays API — `sudar-learn/src/app/api/ai/module-personalize/route.ts`, consent — `sudar-learn/src/app/api/learner/ai-consent/route.ts`. Studio org AI compliance + course personalization live in org/course settings and APIs (`sudar-studio/src/app/api/org/settings/route.ts`, course editor). Learner groups API — `sudar-studio/src/app/api/org/learner-groups/`. Mascot system — `sudar-learn/src/lib/mascot/*`, `sudar-learn/src/components/mascot/*`.  
- **Windows / Studio dev**: Prefer `npm run dev` from `sudar-studio` (uses `scripts/run-next.mjs`) so Next resolves correctly; optional `NEXT_FORCE_PROJECT_DIST=1` if you want `.next` inside the app folder. See `sudar-studio/.env.example`.  
- **Shipped feature summary**: [docs/SHIPPED_FEATURES.md](docs/SHIPPED_FEATURES.md) (April 2026 sections). Roadmap text: [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md) §2.

**What shipped**  
- **Brand & UI**: Sudar logo components and static marks in Learn and Studio (`SudarLogo.tsx`, `public/sudar-logo.svg`, `public/sudar-logo-mark.svg`); logo assets under `assets/sudar logo/`. Learn theme/globals and Tailwind tokens refined for consistent Sudar visual language.  
- **Mascot (Learn)**: Neutral mascot SVGs in `sudar-learn/public/mascots/`; `MascotAvatar`, `MascotJourneyCard`, `MascotModeBadge`; engine/personas/rollout/tracking under `sudar-learn/src/lib/mascot/`; types in `src/types/mascot.ts`.  
- **Personalization v2**: Opt-in **per-module AI overlays** (`role_explain`, `brief_3min`) stored on `enrollments.personalization_overlays` without changing canonical `modules.content`. Eligibility respects `courses.settings.personalization`, `courses.is_adaptive`, and `organisations.settings.ai_compliance`; learner consent via `learner_profiles.generative_ai_consent_at` and `/api/learner/ai-consent`. Daily usage cap via `module_personalize` in usage limits. Plain-text extraction helper: `sudar-learn/src/lib/learn/modulePlainText.ts`.  
- **Studio**: **Governance** dashboard page; **Compliance** page cross-links; course detail/settings expanded for personalization and org policies; **learner groups** REST API (`/api/org/learner-groups`); Prisma/schema and `database` types updated; agent chat and platform knowledge touch-ups; `fetch-with-deadline` utility; **sensitive input guard** shared pattern with Learn. Middleware and `next.config.mjs` updates; dev scripts `scripts/run-next.mjs`, `scripts/rm-next-cache.mjs`.  
- **Learn (learner experience)**: **Global search** route (`/search`); course viewer, onboarding, paths, settings (including AI consent UI), TopNav, Floating Sudar Chat, enroll-bridge and path-enrollments improvements; tutor and ALP query routes hardened; **sensitive input guard** for tutor-facing inputs.  
- **Docs**: Full **brand** pack (`docs/brand/` — strategy, guidelines, tokens, mascot specs, rollout checklist, deck assets). **Trust** pack (`docs/trust/` — posture, data flows, subprocessors, AI system register, threat model, operations). Root **README**, **ECOSYSTEM**, **AGENTS**, **GITHUB_SETUP**, marketing/pitch decks aligned with Sudar positioning.

### 2026-04-07 — SudarVid overhaul: loader UX, timeline editor, media generation pipeline
- **SudarVid frontend**: Refined UI/UX in `frontend/index.html`, `frontend/assets/main.css`, and `frontend/assets/main.js` with improved timeline editing flow and richer controls for creator-side video building.
- **Playback and loader experience**: Updated `static/js/sudarvid.js`, added dedicated loader assets (`loader.html`, `sudar_loading_v3.html`), and intro/outro template support (`sudarvid-intro-outro.html`).
- **Generation pipeline**: Expanded backend logic across `sudarvid/core.py`, `sudarvid/server.py`, `sudarvid/media.py`, `sudarvid/content_planner.py`, and `sudarvid/image_gen.py` for stronger planning/media orchestration and model handling (`sudarvid/image_models.py`).
- **Themes and templates**: Enhanced render templates (`templates/base.html.j2`) and theme/type wiring (`sudarvid/themes.py`, `sudarvid/types.py`) for higher quality output composition.
- **Config/docs**: Updated `sudar_vid` README, `.env.example`, and dependency set in `requirements.txt` to match the refreshed workflow.

### 2026-03-18 — Vercel builds: login/signup Suspense; Learn UX; marketing site; docs
- **Next.js 15 / Vercel**: Learn and Studio `/login` and `/signup` now use a **Server Component page** + **client `*Client.tsx`** wrapped in `<Suspense>` so `useSearchParams()` no longer fails static generation on Vercel.
- **Learn**: Signup split to match login; removed temporary debug ingest calls from tutor API and chat UI.
- **Learn UX**: Dashboard/progress loading states, greeting/top-nav tweaks, course viewer and modality cards refinements; flashcards API touch-up.
- **teachwithsudar**: Marketing Next.js site (Teach with Sudar) added under repo root.
- **Docs & audit**: LAMP draft, research paper/bib updates; Learn audit notes in `audit/Learn/`.

### 2026-03-17 — Security hardening: IDOR fixes, JWT validation, RLS, rate limits, CSP, logging
- **Authorization & IDOR**: Hardened ALP endpoints to enforce org scope; Intelligence now validates Supabase JWT (subject must match learner_id/user_id) and supports an optional server-to-server secret for ALP proxy calls.
- **Supabase RLS**: Added migrations to enable RLS + ownership policies on learner-scoped tables (learner_profiles, learning_events, ai_interactions, enrollments, certifications) and RAG `content_chunks`.
- **AI cost abuse protection**: Added `usage_limits` (per-user/day) and an atomic increment RPC; Learn now enforces daily limits for tutor and next-action requests. Intelligence adds per-IP rate limiting for tutor and next-action.
- **Input validation & prompt injection**: Tutor message length capped (2000 chars) and basic prompt-override line filtering; Intelligence adds Pydantic validators for tutor inputs.
- **Deployment hardening**: CSP headers added in both Next.js apps; Intelligence disables Swagger/ReDoc in production; `.env` added to Learn .gitignore.
- **Logging**: Added structured JSON logging for auth events, AI provider failures, and FastAPI 4xx/5xx responses (no JWT/PII).

### 2026-03-13 — Ship recent work + one more win (Listen modality, compliance reminders)
- **Ship recent work**: Documented Flashcards, document-to-course (generate-from-document), and SCORM 1.2 import in [docs/SHIPPED_FEATURES.md](docs/SHIPPED_FEATURES.md). Updated STRATEGIC_PATH §2 (current state) and §3 (Next 3: ship recent work and one more win marked done).
- **Listen (Audio TTS) modality**: Added **Listen** tab to Learn course viewer (CourseViewer). Learners can switch to Listen to hear the current module via TTS; AudioCard + generate-audio API; cache per module, retry when unavailable. Same completion rules (e.g. min time) apply.
- **Compliance email reminders**: Documented in SHIPPED_FEATURES.md and STUDIO_USER_GUIDE §5 (Compliance and email reminders). Cron endpoint `POST /api/cron/compliance-reminders` with CRON_SECRET; env: RESEND_API_KEY, RESEND_FROM. Quick reference table updated.
- **ACTION_PLANS**: Plan D checklist updated — B1–B5 and P1–P8 marked done; O1/O2 (pilot, Claude-for-OSS) to be done after build is complete.

### 2026-03-13 — Product update: New modalities, ALP embed, certificates & media
- **Learn — New modalities**: Audio (AudioCard, ReadAlongControls, ReadingBodyWithSentences), Video (CourseVideoCard), Podcast (CoursePodcastCard), MindMap (MindMapCard). Generate-audio and generate-mindmap APIs; ActivityChartClient, learner preferences API, settings page.
- **Learn — Certificates**: Server-side certificate PDF generation (API route + CertificatePDF component), cert verification and print/save flow improvements.
- **Learn — Sudar & ALP**: FloatingSudarChatClient, ModelPicker; ALP embed (AlpEmbedChat, embed page), embed-token, events, next-action, alp tutor query APIs; alp-auth lib.
- **Studio — Content & media**: Generate-module-with-research API; media search (search-audio, search-videos) and libs (audioSearch, videoSearch, webSearch); studio generate-audio, podcast, video APIs; ProjectMediaPeek; courseContentForGeneration, courseMedia. ModelPicker, block editor and content panel updates.
- **Studio — Operations**: Integrations page and API (keys, org settings); cron compliance-reminders route.
- **Intelligence**: Audio route (FastAPI), README.run.md, run.bat for local run.
- **Docs**: STUDIO_USER_GUIDE, ALP_API, AUDIO_STRATEGY, LAMP_BUILD_PLAN/TRACKER, PILOT_PLAN, DEMO_VIDEO; ACTION_PLANS, STRATEGIC_PATH, screenshots README.

### 2026-03-08 (ship recent work)
- **Documented as shipped**: Flashcards modality (Learn: FlashcardsCard + generate-flashcards API), document-to-course (Studio: generate-from-document API for PDF/DOCX/URL), SCORM 1.2 import (Studio: import-scorm API). All three are live; current state in STRATEGIC_PATH Section 2 and this file is aligned.
- **Visibility**: Screenshots README and DEMO_VIDEO instructions added under docs/screenshots/; README links updated.

### 2026-03-08
- **Sudar Chat (Learn)**: Floating Sudar Chat widget (global access from dashboard), startup questions, paste context, generative blocks (enroll / continue / review), outcome logging (`tutor_action_taken` to learning_events), validate-memory quick preferences (response length: one_line, detailed, concise; modality: reading, listening, video, no_video). Tutor workflow API (summarize, extract_terms) for batch workflows.
- **RAG (Learn)**: content_chunks migration (pgvector 1024), ingest API (index published courses or single course), embed/retrieve/cache libs, [RAG_SETUP_STEPS.md](sudar-learn/docs/RAG_SETUP_STEPS.md) for env, DB, and ingest.
- **Memory & insights**: Insights builder from learner profile/events/enrollments/ai_interactions, InsightsCarousel component, memory/validate-memory alignment.
- **Dashboard & paths**: DashboardSidebar, TopNav, ActivityChart, ProgressPieChart, PathNodeGraph, CourseThemeProvider and learning personas (themed learning experience).
- **Auth**: Change password flow (require_password_change after admin reset) — page, form, complete-password-change API.
- **SCORM**: SCORM asset proxy in Learn — serve SCORM package assets from Supabase Storage (course-media) with correct MIME types for iframe playback.
- **Docs/assets**: Sudar Chat logo assets (light/dark), root doc tweaks (AGENTS, CONTRIBUTING, ECOSYSTEM, GITHUB_SETUP, README, RESEARCH_FOUNDATION).

### 2026-03-02
- **Web presence**: README updated with "What makes Sudar different" highlights (Sudar's memory, adaptive paths, compliance, open source). Updates section now references Phase 5 in progress (flashcards, document-to-course, SCORM 1.2 import).
- **Phase 5**: Flashcards modality (Learn), document-to-course (Studio generate-from-document), and SCORM 1.2 import (Studio import-scorm) documented as implemented.

### 2026-02-26
- **Learn (Memory)**: Info banner on Sudar's Memory page now uses explicit light/dark colors (amber-50/amber-950, amber-900/amber-100) so text is readable in both themes — no camouflaging when switching color mode.
- **Roadmap**: SCORM & format import added to "What's upcoming" (upload SCORM 1.2 packages, parse manifest, map to courses; other formats later). Second modality and Document/URL import remain first priorities.
- **Repo & docs**: Sudar pushed to GitHub with README, RESEARCH_FOUNDATION, UPDATES, CONTRIBUTING, LICENSE. Creator story and problem/solution framing added; research-backed positioning for adaptive learning + learner memory.
- **Phase summary**: UPDATES.md created; phase-wise “what we’ve built” and “what’s upcoming” documented for daily commits.

### 2026-02-24 (representative)
- **Compliance & creator velocity**: Path assignment from Studio (assign learners + due date), Assigned learners table, Compliance page (overdue / at-risk / on-track). Learn: Upcoming deadlines, Required by organisation, Certificate Print/Save as PDF.
- **Progress & paths**: Progress page (courses, paths, certificates), path progress % sync on course complete, path unlock rules (complete previous first).

---

## What we've built (phase-wise)

### Phase 1 — Foundation ✅
- Supabase schema (profiles, organisations, courses, modules, enrollments, learning_events, ai_interactions, learner_profiles, learning_paths, certifications).
- Shared auth (Supabase Auth) across Studio and Learn.
- Sudar Studio scaffold (Next.js 14): dashboard, courses CRUD, org/workspace.
- Sudar Learn scaffold (Next.js 14): dashboard, course catalog, enrollments.
- Environment contracts and RLS policies.

### Phase 2 — Integration ✅
- Course publish: Studio publishes to Supabase; Learn reads and displays published courses.
- Enrollments and learning_events (module start/complete, quiz attempts, duration).
- Progress calculation and enrollment status (not_started, in_progress, completed).
- End-to-end flow: author → publish → enroll → learn → track.

### Phase 3 — Learner experience ✅
- **Personalised dashboard**: Streak, total learning time, engagement %, courses completed, “Sudar recommends” (next best action). DashboardSidebar, TopNav, ActivityChart, ProgressPieChart, PathNodeGraph. CourseThemeProvider and learning personas (themed experience per course).
- **Course viewer**: Markdown rendering, module navigation, progress auto-save, quizzes with immediate feedback. SCORM delivery: proxy for SCORM package assets from Supabase Storage (course-media) with correct MIME types for iframe playback.
- **AI tutor "Sudar"**: RAG over course content (content_chunks + pgvector 1024, ingest API, embed/retrieve/cache). Floating Sudar Chat (global), startup questions, paste context. Longitudinal memory (ai_interactions + ai_tutor_context), contextual “Explain this” from text selection. Structured tutor responses (blocks/actions: enroll, continue, review). Validate-memory quick preferences (response length, modality). Tutor workflow API (summarize, extract_terms). Outcome logging (tutor_action_taken) for learning from suggestions. My Memory page (view/edit what Sudar knows). Memory insights builder and InsightsCarousel.
- **Onboarding assessment**: Short intake flow to bootstrap learner profile (goals, background, style).
- **Learning paths**: Enroll in paths, personalised sequence for adaptive paths, path progress and unlock rules (complete previous first).
- **Certifications**: Auto-issued on path completion, shareable public verification link, Print/Save as PDF.
- **Progress page**: Single view for courses, paths, and certificates.
- **Upcoming deadlines** and **Required by your organisation** on dashboard.
- **Auth**: Change password flow when require_password_change is set (e.g. after admin reset).

### Phase 4 — Intelligence ✅
- **Next best action**: Scores unenrolled courses from learner profile, AI-generated reason, stored in learner_profiles.
- **Struggle detection**: Quiz wrong answers feed into ai_tutor_context.struggles_with; used for path ordering and tutor context.
- **Adaptive path ordering**: Optional courses in a path reordered per learner (Sudar surfaces gaps, deprioritises known concepts).
- **Personalised welcome**: On enrollment in adaptive courses, AI-generated welcome that connects prior learning to the new course.
- **Studio analytics**: Org-level completions, quiz scores, top struggle topics; **Compliance** view (overdue / at-risk / on-track).
- **Path assignment**: Assign path to learners from Studio, optional due date, “Assigned learners” table.

### Phase 5 — Scale (in progress)
- **Done**: Path assignment + due dates, compliance view, certificate print, upcoming deadlines, required paths; compliance **email reminders** (Studio cron — see SHIPPED_FEATURES.md).
- **Implemented**: Flashcards modality (Learn: FlashcardsCard, generate-flashcards API); document-to-course (Studio: generate-from-document API for PDF/DOCX/URL); SCORM 1.2 import (Studio: import-scorm API). RAG in Learn (content_chunks, ingest, tutor search); Floating Sudar Chat (global); tutor workflows (summarize/extract_terms); outcome logging; validate-memory quick preferences; memory insights carousel; SCORM delivery proxy (Learn); change-password flow. **Personalization v2** (overlays, consent, learner groups), Sudar **brand/mascot** surfaces, **trust** docs + Studio Governance (2026-04-11 — see Latest above).
- **Upcoming**: SudarPlay / SudarFeed / SudarMind wiring, white-label, SSO/HRIS; production hardening of personalization policies.

---

## What's upcoming (prioritised)

| Priority | Item | Notes |
|----------|------|--------|
| 1 | **Second full modality** | Audio TTS for current module (standalone Audio tab in course viewer). Flashcards already live as embedded + generate API. |
| 2 | ~~Document/URL import~~ | ✅ Shipped — generate-from-document (PDF/DOCX/URL) in Studio. |
| 3 | ~~SCORM 1.2 import~~ | ✅ Shipped — import-scorm API in Studio. |
| 4 | ~~**Email reminders**~~ | ✅ Shipped — Studio `POST /api/cron/compliance-reminders` (see SHIPPED_FEATURES.md). |
| 5 | **Server-side certificate PDF** | Optional: generate PDF for download (in addition to browser Print). |
| 6 | **SudarPlay / SudarFeed / SudarMind** | Wire game, feed, and mindmap modalities into Learn. |
| 7 | **White-label & SSO** | Org branding, custom domain, SAML/OIDC (later phase). |
| 8 | **HRIS integration** | Webhooks for Workday, BambooHR, Rippling (later phase). |

*Detailed roadmap: [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md) | [docs/ACTION_PLANS.md](docs/ACTION_PLANS.md).*

---

## Template for daily entry (copy and paste)

```markdown
### YYYY-MM-DD
- **Area**: Short theme (e.g. Compliance, Learn dashboard, Studio paths).
- **Changes**: Bullet list of what was implemented or fixed.
- **Docs**: Any README/UPDATES/STRATEGIC_PATH changes.
```

---

*Sudar — Learns with you, for you. | Updated as development progresses.*

### 2026-04-15
- **Area**: Hybrid analytics engine (admin + learner insights).
- **Changes**:
  - Added event contract hardening on Learn `/api/events` with event-type validation and required payload semantics for `section_heartbeat`, `session_end`, `drop_off`, and `modality_switch`.
  - Added Supabase analytics migration with rollup tables/functions: `analytics_daily_user`, `analytics_daily_course`, `analytics_daily_module`, `analytics_org_rollup`, `analytics_risk_signals`, and `analytics_feedback`.
  - Added Studio analytics APIs: `/api/analytics/overview`, `/api/analytics/courses/[id]`, `/api/analytics/learner-risk`, `/api/analytics/export` (CSV).
  - Added Learn insights APIs: `/api/insights/me`, `/api/insights/time`, `/api/insights/feedback`.
  - Extended Learn NBA route (`/api/intelligence/next-action`) to return explainable analytics fields (`action_type`, `target`, `recommended_duration_mins`, `confidence`).
  - Added Intelligence endpoint `/api/learner/next-action-analytics` for analytics-driven recommendation output.
  - Added learner dashboard insight cards for focused time, engagement state, and suggested next session duration.
  - Added analytics feature-flag gate (`ENABLE_ANALYTICS_ENGINE=false` disables new analytics APIs).
- **Docs**:
  - Updated `docs/ALP_API.md`, `docs/STRATEGIC_PATH.md`, `docs/PRODUCT_FEATURES.md`, `docs/USER_FLOWS.md`, `docs/trust/DATA_FLOWS.md`, and `docs/trust/POSTURE.md`.
  - Added rollout notes in `docs/ENV_REFERENCE.md` and `docs/VERCEL_DEPLOYMENT.md` for `ENABLE_ANALYTICS_ENGINE` and daily analytics cron scheduling.
  - Added Studio cron endpoint `POST /api/cron/analytics-rollups` and manual admin trigger `POST /api/analytics/refresh` (via Analytics page “Refresh now”).
