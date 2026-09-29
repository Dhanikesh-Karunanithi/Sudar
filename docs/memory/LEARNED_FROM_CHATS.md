# Learned from past chats

Durable learnings mined from ~135 Cursor agent chats (Apr–Sep 2026) about building Sudar. Each bullet links the chat it came from as `[title](<chat-uuid>)`. The status order still applies: `UPDATES.md` Latest, then `docs/SHIPPED_FEATURES.md`, then code. Where this file and the code disagree, trust the code and fix this file.

No secrets, keys, credentials, or personal data belong here.

---

## 1. Product decisions and rationale

### Identity and naming
- The product is **Sudar**, not ByteOS. The root folder, repo, Vercel projects, and Supabase dashboard were renamed over time. Stale `byteos-*` paths and `BYTEOS_*` env names still exist as legacy aliases, so don't reintroduce the old name anywhere users can see it. [ByteOS folder rename](ce9f64a0-b477-45c8-9543-f0c41bd3447a), [Vercel since April](dae4aa4b-d021-4da0-8506-9a0dc1a1a16d), [Video/audio in Learn](6ae6ce3f-6a77-439c-bfe6-6c88930c8b5c)
- **ALP means Adaptive Learning Protocol** everywhere: code, docs, teachwithsudar, and the research paper. "Adaptive Learning Layer" is wrong. [ALP naming fix](b625c607-e5fb-4cc3-aaed-3d0d52b4cc76)
- "Learn with Sudar" / "Tutor Journey" was renamed to **SudarNotes**. The route stays `/journey`. [SudarNotes tutor rehaul](98aa28a4-9d9f-44f0-a4d4-d604ab1c4a53)
- Commits must not carry `Co-authored-by: Cursor` trailers. The owner had a Cursor Agent contributor entry scrubbed from GitHub and wants the repo to show only his account. [Repo cleanup & contributors](d88bc68e-3de9-483d-be50-7429737ecb1c)

### Architecture and hosting
- **One monorepo, one Supabase project.** A September audit rejected splitting service repos: the real coupling is `shared/` + `supabase/` + `help-center/`. [Structural cleanup](04dbf89b-5fa0-440d-ae67-bdedc80acaad)
- **Production = Cloudflare Workers (OpenNext)** at `learn.thesudar.com` / `studio.thesudar.com`, plus cron workers and `mcp.thesudar.com`. **Vercel `*.vercel.app` is staging/fallback only.** Never point production hostnames at Vercel, because the DNS records conflict. [Cloudflare thesudar.com deploy](894fe4c0-6d00-4982-be54-d7dbefe62d78), [Vercel restore + CSP](480aa5e8-72b3-410c-a98a-b7380e229597)
- **Domains:** `thesudar.com` is the app gateway (login/entry). `teachwithsudar.com` is the marketing site and was never meant to be overwritten. Once an agent clobbered teachwithsudar while redesigning thesudar and had to restore it. [teachwithsudar vs thesudar](77ceae7b-b87d-4457-9e41-cab8eb7fa60b), [thesudar.com gateway](7472ae2c-cc95-48de-a183-a83fa25b41ca)
- **Sudar Intelligence runs on Render (Docker)** behind `intelligence.thesudar.com`, using a DNS-only CNAME. The Railway trial expired. The Render free tier has cold starts. Health lives at `/api/health`, not `/health`. [Cloudflare thesudar.com deploy](894fe4c0-6d00-4982-be54-d7dbefe62d78)
- **NBA and twin rollups are owned by Learn**, not Intelligence. Intelligence handles tutor/TTS/STT/sim/agents helpers. [Teaching OS ecosystem](67942728-d2fa-482b-bedc-16ca8ec8eac8)
- **Server-to-server auth uses `INTELLIGENCE_SERVICE_SECRET`**, and the value must be identical in Learn, Studio, and Intelligence (Render plus Worker secrets). Don't forward a browser Supabase JWT to Intelligence, which usually lacks `SUPABASE_JWT_SECRET`. [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209), [Content/video/roleplay overhaul](be02a875-ae91-43c0-9725-cfbeb2ef82bb), [Sudar Agents](01c64b11-3d1b-4bc8-b16c-9c68c9c5b2ca)

### AI providers and cost
- **Chat routing today:** org private BYOM → Sudar AI (FreeLLMAPI pilot tier, gated by `ALLOW_ORG_PLATFORM_AI` plus `org_settings.ai_platform`) → Together → OpenAI → Anthropic. When the platform tier isn't enabled on a deployment, routing must fall through to Together instead of erroring with "Sudar AI is not enabled". [Pilot orgs & FreeLLMAPI](b49744a6-f50a-41dd-9064-667290a98106), [MCP in ChatGPT/Cursor](43876d3d-b312-4f23-adeb-732fa56b4f65)
- For showcase/demo orgs, the owner prefers Together with open models (gpt-oss 20b/120b) under a hard inference cap over the free FreeLLMAPI tier, for reliability. [Portfolio courses demo](939bf393-cd6b-40cb-a5e9-e7721ad8428a)
- **Cost awareness is a first-class requirement.** Always-on polling (coins, achievements, heartbeats that re-ran gamification, and 90s idle LLM nudges) was audited as waste. The fix was a single visibility-aware poller, heartbeats paused in hidden tabs, Realtime-first notifications, and usage limits that fail closed. Don't add new background intervals without that lens. [Runtime cost audit](62ef0603-edad-455c-99f4-b56adde407f9)
- Token caching was evaluated and deferred. A token-consumption monitoring view was built instead so usage can be estimated and resold. [Token monitoring](0be56afc-5fbb-4594-9739-d6d8737879a0)

### Access, pilots, and data
- New users are gated behind **Early Access** invite codes. Never publish invite codes in docs, seeds, or ops files. `EARLY_TALISMA` and some hire codes leaked publicly and were revoked. Provisioners now write random codes to gitignored `*.local` files. [Early access gate](cf9a7188-8274-4ac2-9d67-1c8ae5215692), [Structural cleanup](04dbf89b-5fa0-440d-ae67-bdedc80acaad)
- The platform is labeled **Early Access**, not Alpha or Beta, when demoed. [Early access labeling](6917f548-08e6-4aa6-af93-9ec70cb0160c)
- **Clean slate (Sep 2026):** the Talisma and Foundever pilots ended. All orgs, courses, events, chats, sim rows, and invites were wiped after a local-only backup (`.local-backups/`, gitignored). Profiles were kept with `org_id` nulled. A single fresh org replaced them. Jobsy tables were orphaned (no code in repo) and dropped, because Jobsy is a separate project. [Structural cleanup](04dbf89b-5fa0-440d-ae67-bdedc80acaad)
- **Removed features:** WorkAdventure/SudarPlay world was removed from the repo, and SudarArt is disabled because output quality was unacceptable (revisit later). Don't resurrect either without an explicit ask. [Remove WorkAdventure/SudarPlay](ea9918a2-587a-49af-9735-75f482d06aad), [Disable SudarArt](4bd384a7-cc46-4fb5-829a-b825a4c77b5b)
- End users and admins should get **configuration control** (toggles, cadence settings) instead of hardcoded behavior. Examples are memory-learning cadence and notification preferences living in Settings. [Science enrichments & config](e3c2d795-7d1f-4fbc-89a9-b81de594a004), [Longitudinal memory](aa54dd7b-2fd1-42f6-a3cf-0f4925c0f654), [Notifications in settings](7f3b2f9f-d8de-47d2-a062-a1103b862bf5)

---

## 2. Recurring pitfalls and fixes

### Build and deploy (Cloudflare / OpenNext / Vercel)
- **`NEXT_PUBLIC_*` values are inlined at build time.** Setting them only as Worker runtime secrets ships empty values, and Learn crashed with "@supabase/ssr: URL and API key are required". The Cloudflare GitHub Actions workflows must pass Supabase public env at build. [Vercel restore + CSP](480aa5e8-72b3-410c-a98a-b7380e229597)
- **CSP breaks live pages silently.** Google Fonts (`fonts.googleapis.com`/`fonts.gstatic.com`) and `static.cloudflareinsights.com` had to be allowlisted. Warnings from `rsms.me` or `react-app-holder.js` come from browser extensions. [Vercel restore + CSP](480aa5e8-72b3-410c-a98a-b7380e229597), [Security hardening](20c11bd9-fa54-49c5-8fea-778587a8ae03)
- **`initOpenNextCloudflareForDev()` must be guarded** so it doesn't run on Vercel/CI builds. Unguarded, it crashed Studio builds with `EPIPE`. [Vercel restore + CSP](480aa5e8-72b3-410c-a98a-b7380e229597)
- **Vercel Hobby allows only daily crons.** Sub-daily crons belong in `workers/sudar-cron-*`. [Vercel restore + CSP](480aa5e8-72b3-410c-a98a-b7380e229597)
- **Wrangler 4.9x needs Node 22** in CI workflows. [Cloudflare thesudar.com deploy](894fe4c0-6d00-4982-be54-d7dbefe62d78)
- **OpenNext on Windows is fragile.** Custom `.next` paths, wrong `outputFileTracingRoot`, and ESLint errors each failed a slow Studio deploy late. Prefer CI deploys, and run lint before a local `deploy:cf`. [Cloudflare thesudar.com deploy](894fe4c0-6d00-4982-be54-d7dbefe62d78)
- A `CLOUDFLARE_API_TOKEN` copied from Wrangler OAuth **expires within days** and lacks Zone DNS Edit scope. CI needs a long-lived dashboard API token. [Cloudflare thesudar.com deploy](894fe4c0-6d00-4982-be54-d7dbefe62d78)
- Vercel CLI often **hangs after printing success**. "Aborted" background tasks had usually already applied the change, so verify before retrying. [Pilot orgs & FreeLLMAPI](b49744a6-f50a-41dd-9064-667290a98106)
- Render defaulted to Python 3.14, so `pydantic-core` had no wheel. Fix by pinning 3.11 or using the Intelligence Dockerfile with root dir `sudar-intelligence`. [Cloudflare thesudar.com deploy](894fe4c0-6d00-4982-be54-d7dbefe62d78)
- After any deploy, add production and staging hosts plus the MCP OAuth callback to **Supabase Auth redirect URLs**, or login/magic links break. [Cloudflare thesudar.com deploy](894fe4c0-6d00-4982-be54-d7dbefe62d78), [Pilot orgs & FreeLLMAPI](b49744a6-f50a-41dd-9064-667290a98106)

### Supabase
- **Supabase MCP must point at the same project ref as the apps' `.env.local`.** Once it targeted a different project, so auth and migrations silently went to the wrong DB. MCP auth also blocks until the owner approves in the browser, which looks like the agent hanging. [Teaching OS ecosystem](67942728-d2fa-482b-bedc-16ca8ec8eac8)
- Migrations applied through Supabase MCP get a **server-assigned version** in remote history that doesn't match the repo filename timestamp. Check `list_migrations` by name, not by version, before re-applying. [Video/audio in Learn](6ae6ce3f-6a77-439c-bfe6-6c88930c8b5c), [Sudar Agents](01c64b11-3d1b-4bc8-b16c-9c68c9c5b2ca)
- A free-tier Supabase project **pauses when idle**, and every login then fails. Restore the project before debugging auth. [MCP in ChatGPT/Cursor](43876d3d-b312-4f23-adeb-732fa56b4f65)
- Learn magic-link callbacks failed on a PKCE/hash mismatch in September. Password or Google login is the reliable path until that's fixed. [Structural cleanup](04dbf89b-5fa0-440d-ae67-bdedc80acaad)

### Local dev (Windows / PowerShell / ports)
- **Ports:** Studio `:3000`, Learn `:3001`, Help `:3002`, **SudarVid `:8000`, Intelligence `:8001`**, sudar-sim `:8090`, LiveKit `:7880`. A `BYTEOS_INTELLIGENCE_URL=http://localhost:8000` pointed at SudarVid, which caused Internal Server Errors and blank TTS more than once. `run.bat` still starts Intelligence on 8000. [Video/audio in Learn](6ae6ce3f-6a77-439c-bfe6-6c88930c8b5c), [Content/video/roleplay overhaul](be02a875-ae91-43c0-9725-cfbeb2ef82bb), [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209)
- `uvicorn` isn't on PATH. Start with `python -m uvicorn src.api.main:app --port 8001 --reload`. [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209)
- **Stale Python processes** on 8001 kept serving old env. Intelligence doesn't reload `.env.local`, so kill all instances and start exactly one. `/api/health/sim-voice` shows which STT/TTS providers are loaded. [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209)
- `scripts/dev-with-sudarvid.mjs` once injected a default `INTELLIGENCE_SERVICE_SECRET` that overrode `.env.local`. When auth fails despite matching keys, check what the dev launcher sets. [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209)
- Placeholder keys (`your_*`) in Intelligence env caused provider 401s, and an obsolete default Together model caused 400s. Intelligence now ignores placeholders. [Content/video/roleplay overhaul](be02a875-ae91-43c0-9725-cfbeb2ef82bb)
- The Edge-TTS multi-chunk merge used pydub, which needs ffmpeg on PATH (absent on Windows) and leaves locked temp files. It was replaced by in-memory byte concatenation. The Sarvam path still needs ffmpeg. [Video/audio in Learn](6ae6ce3f-6a77-439c-bfe6-6c88930c8b5c)
- Docker Desktop's `bin` may not be on PATH after install, so prepend it in the session. [SudarSim real-time voice](6caad2c3-1623-49b8-87fb-0133c01c7d1e)

### App-level bugs that recurred
- **Zod `.flatten()` objects returned as `error`** crashed React when rendered, in both Sim Studio and Learn. API routes must return string errors (repo rule: `{ success, data?, error?: string }`). [Content/video/roleplay overhaul](be02a875-ae91-43c0-9725-cfbeb2ef82bb), [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209)
- **Zod 4:** `z.record(z.unknown())` throws, so use `z.record(z.string(), z.unknown())`. The error was misreported as "Invalid JSON". [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209)
- **`Permissions-Policy: microphone=()`** disabled the mic site-wide, so there was no prompt and manual allow didn't work. It must be `microphone=(self)` in Studio and Learn. It took several rounds to find. [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209)
- **Iframe media 401s.** Learn/Studio middleware blocks `/api/*` without a session cookie, and iframe subresource loads often lack it. The fix was a short-lived HttpOnly render-grant cookie minted before mounting the SudarVid iframe. "Video not visible" was reported at least three times. [Video/audio in Learn](6ae6ce3f-6a77-439c-bfe6-6c88930c8b5c), [Video not visible](8f126d73-da64-44c6-8253-c5deb9c557b9), [External open courses](f9c20ae2-e5c3-472a-8e8a-b92945ddd3ed)
- Intelligence `chat_completion` returns `{content}`. Parsing the whole dict as JSON 500'd every Sim persona/coach call. [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209)
- Tutor output: models leak raw HTML or emit only `BLOCKS:` JSON with no chat text. Normalize HTML to Markdown for chat, synthesize notebook pages when blocks are missing, and never show "I had trouble formatting". Short follow-ups ("plan it for me", "all basics") were wrongly rejected by the guardrail. [Sudar 2.0 Journey experiment](7b17eb51-300b-4cfd-a5d7-d133b31f70f5)
- ChatGPT/Cursor MCP clients only pick up new tools in a **new chat** after reconnecting. Cursor uses port 8787 for its OAuth callback, so don't run Wrangler dev there. [MCP in ChatGPT/Cursor](43876d3d-b312-4f23-adeb-732fa56b4f65)

---

## 3. How the owner wants agents to work

- **Be decisive.** Give options with a clear recommendation instead of open-ended questions. The owner is the only full-time person and relies on agents for execution. When asked, stop after each step for review. [Structural cleanup](04dbf89b-5fa0-440d-ae67-bdedc80acaad)
- **Do it yourself.** Use Supabase/Vercel/Cloudflare MCPs, CLIs, and the browser before handing over manual steps. When manual steps are unavoidable, give short numbered instructions. [Cloudflare thesudar.com deploy](894fe4c0-6d00-4982-be54-d7dbefe62d78), [External open courses](f9c20ae2-e5c3-472a-8e8a-b92945ddd3ed)
- **"Avoid commentary"** comes up repeatedly: after fixes, say what changed and what the owner must do, briefly. [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209), [SudarSim real-time voice](6caad2c3-1623-49b8-87fb-0133c01c7d1e)
- **Finish the loop to live.** "Commit and push so I can see it on the live site" is the default expectation. Check GitHub Actions and deploy status and fix failures rather than stopping at a local change. [Vercel restore + CSP](480aa5e8-72b3-410c-a98a-b7380e229597), [Blog/site pushes](39b3ca80-e221-43d8-895b-10486c262d69)
- **Honest critique is welcome.** The owner explicitly asks agents to criticize the vision or claims when they're repackaged or not viable, then plan how to make the claims true rather than hiding them. [Teaching OS ecosystem](67942728-d2fa-482b-bedc-16ca8ec8eac8), [Credibility audit & Moodle](8041a675-8b0b-418f-82f7-3a2c32ee19a8)
- **Protect mainline for experiments.** Risky rethinks go on a killable branch (Sudar 2.0 started on `experiment/sudar-2.0-conversational`). Personal portfolio/demo work stays discreet and off public mainline. [Sudar 2.0 Journey experiment](7b17eb51-300b-4cfd-a5d7-d133b31f70f5), [Portfolio courses demo](939bf393-cd6b-40cb-a5e9-e7721ad8428a)
- **Don't claim done when it isn't.** "No change at all. Why are we not able to fix this simple issue?" came after repeated unverified mic fixes. Verify in the browser or with a real request before reporting success. [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209)
- **Keep project memory current.** The owner forgets process details and wants agents to remember: ship memory (`UPDATES.md` / `SHIPPED_FEATURES.md`) and `docs/memory/` exist for that. [Ship memory setup](2e9b5a65-8db4-452e-bd19-036654595485), [Beta readiness + memory](57a87e6a-2a2e-46d8-a0f4-792fec2caead)

### UX and copy quality bar
- **No "AI slop" visuals:** no blue/cyan/purple gradients, no generic noise/gradient effects, no logos boxed in square containers, and no stretched logos. The owner prefers black/neutral premium surfaces with one scarce accent. SudarNotes (`html[data-sudar-journey]`) is the design lab for anti-slop tokens, with sharp 2px radii, before any Learn-wide rehaul. Treat blue/cyan in `.cursorrules` as legacy. [Sudar 2.0 Journey experiment](7b17eb51-300b-4cfd-a5d7-d133b31f70f5), [Form redesign colors](aff35c30-6c5b-4367-a008-ceba7974803d), [Branded invite emails](8d2fd5d6-2925-4f4b-b906-5144ac9cadb2), [Logo containers](fe2b4f44-dcbf-4f83-9fb2-5934216805df)
- **Use the project's SVG logo**, not PNGs. The old logo files were purged from the repo. [Branded invite emails](8d2fd5d6-2925-4f4b-b906-5144ac9cadb2), [Old logo removal](a78275ae-4ec5-4afd-9cbb-cbfb9043bf2b)
- **No em dashes** in marketing copy, blog posts, or drafted messages. Avoid predictable AI phrasing and accusatory tone in hero copy. [Remove em dashes](6b69d647-8500-4148-88bb-7172107bea04), [teachwithsudar copy](3318188d-4adb-4087-86ce-d77a198231eb), [Hero copy](88d3ca94-1054-4147-ba52-bd64b571aa60)
- **No internal build chatter in product copy.** Lines like "Canvas on the left, Sudar on the right" or "Live · Sudar 2.0" were called out angrily. [Sudar 2.0 Journey experiment](7b17eb51-300b-4cfd-a5d7-d133b31f70f5)
- **Layout hygiene is expected without being asked:** internal scroll panes (the page must not grow with chat), no truncated titles, aligned headers, stable page after loading animations, and mobile swipe carousels on marketing cards. [Sudar 2.0 Journey experiment](7b17eb51-300b-4cfd-a5d7-d133b31f70f5), [Loading animation](c2dcc1ac-3490-4198-8970-125d0c12bb0c), [Mobile carousels](0c9668c6-f31b-4adc-9ff7-bd03c4c20269)
- **Low-value chrome belongs in Settings.** Examples are notification sounds and generation-time notification prompts. [Notifications in settings](7f3b2f9f-d8de-47d2-a062-a1103b862bf5)
- **Personal touches land well** when they use the learner's name: playful greetings like "Hello night owl" instead of a wrong "Goodnight". [Greeting copy](91d5e393-d1df-4046-b14d-95cd2151beeb)
- **Generated course content must not be samey.** The owner rejected identical component sets, examples at the start of every lesson, minimal designs, and plain-text courses. Their own hand-built microlearning course is the reference bar. [Content generation themes](630cc20c-95df-425b-aeff-87fb8a0ff2d5), [MCP in ChatGPT/Cursor](43876d3d-b312-4f23-adeb-732fa56b4f65)

---

## 4. Feature intent per surface (not obvious from code)

### Studio
- Manual course creation with SudarChat co-authoring (apply cards with diff-style previews) is a core flow alongside AI generation. [Manual course creation](adbed8a4-16cb-4fc9-8886-fcd4b41a6fcc)
- Full SCORM upload, edit, and export parity is expected, and SCORM 1.2 export is a deliverable other surfaces (MCP) reuse. [SCORM audit](3a2c16c5-e977-409a-8f7a-59b4c5745d42)
- Studio is where scenarios, domains (Teaching OS claims), and courses are **previewed**. Authors shouldn't have to open Learn to test. [Content/video/roleplay overhaul](be02a875-ae91-43c0-9725-cfbeb2ef82bb)

### Learn
- Course tutor chat should ask inline clarifying questions with selectable choices and render rich interactive blocks, not just prose. [Course chat rich learning](2ef530ce-73f8-445e-86ab-50c933bbab6b)
- External open courses live in a **separate tab**, embedded via iframe where allowed, and are always clearly labelled external. They are tagged so NBA and the tutor can recommend them. [External open courses](f9c20ae2-e5c3-472a-8e8a-b92945ddd3ed), [External courses tagging](068913ca-59c7-4bdc-8e4d-9c3f9aba6394)
- Early testers can send feedback (screenshots, URLs) through the Sudar chat. [Early-tester feedback](92a16b53-de4f-4f71-ad11-63f26d226461)

### SudarNotes
- It must behave like a real personal tutor: hybrid adaptive modes (intake → socratic / teach / check / replan / note_craft), one idea at a time, soft checks every few turns, and no "roadmap + overview dump". [SudarNotes tutor rehaul](98aa28a4-9d9f-44f0-a4d4-d604ab1c4a53)
- It reuses the **same Sudar chat panel** as the rest of Learn (no second chat UI). The notebook is the tutor-written, learner-owned surface: suggested cards need Accept/Dismiss, and summary/map/course-draft use accepted notes only. [Sudar 2.0 Journey experiment](7b17eb51-300b-4cfd-a5d7-d133b31f70f5), [SudarNotes tutor rehaul](98aa28a4-9d9f-44f0-a4d4-d604ab1c4a53)
- Chat and notebook are independent: "New chat" keeps the notebook, while "New session" clears both. Resources (YouTube embeds, reading cards) sit in a bottom slider rail and must be verified and relevant, never invented URLs. [Sudar 2.0 Journey experiment](7b17eb51-300b-4cfd-a5d7-d133b31f70f5)

### Teaching OS
- It is a shared teaching spine (claims, mastery, scheduler, pedagogy engine) that **every** surface calls. SudarNotes is one client, not the centre everything plugs into. Authored courses stay for compliance and scale. [Teaching OS ecosystem](67942728-d2fa-482b-bedc-16ca8ec8eac8)
- The long-term vision is "one Sudar per learner", a Digital Learner Twin that mirrors each learner. It only counts as a differentiator with a closed loop and proof, not a slogan. [Teaching OS ecosystem](67942728-d2fa-482b-bedc-16ca8ec8eac8)

### SudarSim
- It is a **standalone roleplay product** (its own Studio section and scenario library), not something bolted into courses. The benchmark is Zenarate / Second Nature / Symtrain with better UX and lower cost. Contact-center scenarios come first. [SudarSim standalone](76ce2026-dce2-44b8-954b-9d6b0f056429), [SudarSim vision review](80a8c79e-3cc9-42c7-9c97-e5b3c2f9d673), [SudarSim plan](beab3118-449f-4f75-a38b-5bc93c10a3b2)
- The loop is create in minutes, then practice a seamless two-way **voice** call with a persona that pushes back, then an AI coach asks "how do you think it went?" before showing scores. Text chat alone doesn't meet the bar. Latency and natural voices matter most. [SudarSim real-time voice](6caad2c3-1623-49b8-87fb-0133c01c7d1e), [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209)
- Voice stack: Deepgram STT + Cartesia TTS when keys exist. Whisper large-v3 (HF/Together) and Edge-TTS are fallbacks. Puter.js was rejected because it forces learner accounts. Streaming duplex needs sudar-sim + LiveKit (Docker), and push-to-talk is the fallback. [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209), [SudarSim real-time voice](6caad2c3-1623-49b8-87fb-0133c01c7d1e)
- The CRM overlay should be built from a screenshot plus positioned interactive overlays, with vision-model HTML recreation as a later phase. [SudarSim plan](beab3118-449f-4f75-a38b-5bc93c10a3b2)

### MCP
- ChatGPT users should get a **finished course in the chat** (HTML lessons plus SCORM 1.2 package, learner share link), not a markdown outline. Hosting and editing in Studio are optional. The model must call `sudar_build_course` and never write the course itself. [MCP in ChatGPT/Cursor](43876d3d-b312-4f23-adeb-732fa56b4f65)
- The local `packages/sudar-mcp` stdio server is the ALP integrator (tutor, NBA, events) and needs Learn running. `mcp.thesudar.com` is the remote OAuth server for ChatGPT/Cursor authoring. [MCP in ChatGPT/Cursor](43876d3d-b312-4f23-adeb-732fa56b4f65), [MCP strategy](aac9b978-c729-4434-aeab-dcc50eaecbb1)

### SudarVid
- Multiple video formats are expected, and the standalone SudarVid and in-course Watch must stay at parity (hybrid HTTP mode, `engine_mode` persisted). Reliable playback inside Learn/Studio is the recurring complaint. [SudarVid multi-format](f4e98f02-55b6-49e4-94b1-017c57494926), [SudarVid parity](ab196d0a-bac5-46a8-87c9-6c99de8fbac7), [Video not visible](8f126d73-da64-44c6-8253-c5deb9c557b9)

### Ecosystem add-ons
- **ALP / Moodle:** the "add-on for any LMS" claim must be made demonstrably true (identity bridge, retries, observability), not softened in docs. [Credibility audit & Moodle](8041a675-8b0b-418f-82f7-3a2c32ee19a8)
- **Sudar Create / Store:** LMS-connectable services (quiz generators, interactive content) distributed through a Sudar Store. [Sudar Create / Store](5322735f-987a-4495-b98b-c6dc8ee4cd9e)
- **Local BYOM:** local and free models are a supported routing mode for privacy and cost, and mobile/offline is roadmap-only. [Local BYOM](836f4da4-28a4-4ca0-b04c-e51dcf6c7654)

---

## 5. Open threads (mentioned repeatedly, not closed)

- **Content quality and validation pipeline.** Consistent, premium, interactive, science-backed output with moderation and citation checks is the owner's top concern going into beta. [Beta readiness + memory](57a87e6a-2a2e-46d8-a0f4-792fec2caead), [Content generation themes](630cc20c-95df-425b-aeff-87fb8a0ff2d5), [Content/video/roleplay overhaul](be02a875-ae91-43c0-9725-cfbeb2ef82bb)
- **Post-wipe RLS policy pass** (profiles, org_members insert, sim_*, invite_codes), plus the RAG/Bearer sub-plan in `docs/RLS_RAG_BEARER_SUBPLAN.md`. [Structural cleanup](04dbf89b-5fa0-440d-ae67-bdedc80acaad)
- **SudarSim streaming voice in production.** LiveKit/sudar-sim hosting isn't wired for prod, and Learn has no scenario browser (only deep links). [SudarSim real-time voice](6caad2c3-1623-49b8-87fb-0133c01c7d1e), [SudarSim voice MVP](0e85765c-4a0b-4f73-a59b-52bb536b8209)
- **"It didn't appear as expected" end-to-end.** Aligning the actual learner experience with design intent across the notebook, tutor, and navigation is still open. [Beta readiness + memory](57a87e6a-2a2e-46d8-a0f4-792fec2caead)
- **Journey anti-slop design tokens** were validated on `/journey` only. The brand-rule rewrite and Learn-wide rollout are deferred. [Sudar 2.0 Journey experiment](7b17eb51-300b-4cfd-a5d7-d133b31f70f5)
- **SudarNotes chat history is device-local** (IndexedDB) and not synced to the cloud. [Sudar 2.0 Journey experiment](7b17eb51-300b-4cfd-a5d7-d133b31f70f5)
- **Teaching OS proof loop** only has one seeded domain, so more seeded domains and mastery evidence are needed. [Teaching OS ecosystem](67942728-d2fa-482b-bedc-16ca8ec8eac8)
- **Learn magic-link PKCE failure** and a long-lived Cloudflare API token for CI are both unresolved. [Structural cleanup](04dbf89b-5fa0-440d-ae67-bdedc80acaad), [Cloudflare thesudar.com deploy](894fe4c0-6d00-4982-be54-d7dbefe62d78)
- **CI noise.** The dependency-audit (vitest advisory) and a `HibernationAnimation` test path issue were failing independently of deploys. [Vercel restore + CSP](480aa5e8-72b3-410c-a98a-b7380e229597)
- **Native Sudar pets/mascots.** The owner wants real animated sprites, not "blobs that hover". The asset pipeline (ChatGPT sprite sheets → SVG) is unresolved. SudarArt stays off until quality is solved. [Sudar pets & Sim reality](9e4377be-e15b-4e28-ab41-e84a179c7fd5), [Sudar persona pet](101bcc3b-16c8-49f2-9d97-6f1a48d6f00f), [Disable SudarArt](4bd384a7-cc46-4fb5-829a-b825a4c77b5b)
