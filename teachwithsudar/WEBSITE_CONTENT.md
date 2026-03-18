# Teach with Sudar — Full Website Content

Use this document to build or rebuild the entire Teach with Sudar website. It contains all copy, structure, and links in one place.

---

## Site identity & metadata

- **Site name:** Teach with Sudar
- **Tagline:** The Operating System for Learning | "Learns with you, for you."
- **Default meta title:** Teach with Sudar — The Operating System for Learning
- **Meta description:** Sudar is the AI-native Learning Operating System. Learn how to teach with Sudar: research, self-host at $0, plugins, help, and collaboration.
- **Open Graph:** Title: "Teach with Sudar — The Operating System for Learning" | Description: "Learns with you, for you. Research, self-host, plugins, and community."
- **GitHub repo:** https://github.com/Dhanikesh-Karunanithi/Sudar
- **Contact email:** connect@dhanikeshkarunanithi.com
- **License:** Apache-2.0 (open source)

---

## Global navigation (header)

**Logo/brand:** "Sudar." (links to /)

**Main nav links (order):**
- Expertise → /#expertise (anchor on homepage)
- How it works → /#works (anchor on homepage)
- About → /story
- Blog → /blog
- Get Started → /self-host
- Collaborate → /collaborate

**Right side:**
- GitHub → external: https://github.com/Dhanikesh-Karunanithi/Sudar
- Primary CTA button: "Start with Sudar" → /self-host

---

## Footer

**Visual:** Large watermark text "SUDAR." (decorative, low opacity).

**Link groups (can be columns or grid):**

About: The Story (/story), Mission & Vision (/mission), Research Foundation (/research), Research Papers (/papers)

Product: Features (/features), Modalities (/modalities), ALP & Plugins (/alp)

Get Started: Self-Host at $0 (/self-host), Plugin Downloads (/plugins), Make Money with Sudar (/monetize)

Resources: Blog (/blog), Updates (/updates), EdTech & AI (/edtech), Best Practices (/best-practices)

Help: Studio Help (/help/studio), Learn Help (/help/learn), FAQ (/faq)

Community: Collaborate (/collaborate), Contact (/contact)

**Bottom line:** GitHub link, Contact (mailto), © [year] Teach with Sudar. Open source (Apache-2.0).

---

## Homepage

### Hero section
- **Headline (H1):** Sudar.
- **Subheadline (italic):** The operating system for learning.
- **Body:** Learns with you, for you. Build training in minutes, deliver it adaptively, and let every learner have a tutor that remembers.
- **Primary CTA:** "Explore Sudar" (can link to #expertise or /features).
- **Secondary line:** [Current time] | Teach with Sudar (small, monospace-style).

### Section: Expertise (id="expertise")
- **Heading (H2):** We design the space where learning truly lives.
- **Body:** Sudar doesn't just deliver content — it learns the learner. Studio, Intelligence, and Learn work together so training is built for real people and real outcomes.
- **Three pillars (display as labels or cards):** Studio | Intelligence | Learn

### Section: How it works (id="works")
- **Heading (H2):** Define your [line break] *learning presence*

**Card 1 — "Create in minutes" (accent colour, e.g. orange)**
- Short description: Upload a PDF or paste a URL. AI generates the course. Publish to Learn. No instructional designer required.
- Link → /features
- Visual: optional icon (e.g. grid/blocks) and badge "01"

**Card 2 — "Adapt to everyone" (dark card)**
- Short description: The Digital Learner Twin, AI tutor with memory, and next-best-action. Learning that never forgets.
- Link → /alp
- Visual: optional icon (e.g. arrow) and badge "02"

### Section: The problem we solve
- **Heading (H2):** The problem we solve
- **Body:** Traditional LMSs deliver one-size-fits-all content: no memory of the learner, no adaptation. Sudar closes the gap with a persistent Digital Learner Twin, multimodal delivery, and an AI tutor that remembers every session.
- **Link:** Research foundation → /research

### Section: Get started (CTA)
- **Heading (H2):** Get started
- **Body:** Self-host Sudar at $0. Use ALP to plug adaptive learning into Moodle or any LMS.
- **Links:** Self-host at $0 (/self-host) | Collaborate (/collaborate) | Blog (/blog)

---

## Page: The Story (/story)

**Title:** The Story

**Intro paragraph:** Sudar was built to fix the world of education and make it accessible — not just to those who can afford expensive eLearning tools, but to every learner and every organization that cares about real learning outcomes.

**Accordion or expandable 1 — "Why it exists"**
- Traditional learning management systems deliver the same content to everyone. They don't remember who the learner is. They don't adapt sequence, difficulty, or support based on behavior or prior knowledge. Research has shown for years that adaptive instruction and intelligent tutoring outperform one-size-fits-all delivery — yet mainstream LMS products still don't offer a longitudinal learner model or memory-aware tutoring. Intelligent tutoring systems that do adapt are usually research prototypes or narrow-domain tools, not integrated into the same platform that hosts courses, paths, and compliance.
- Sudar closes that gap. It started as a solo builder's vision: one platform that unifies authoring, delivery, and intelligence around a persistent Digital Learner Twin, so that every learner can get the kind of adaptive, intelligent education that was previously reserved for the few.

**Accordion or expandable 2 — "The product"**
- Sudar is composed of three surfaces that share a single source of truth in Supabase — auth, learner profiles, content, events, and analytics. The AI tutor "Sudar" is the face of that intelligence.
- The project is open source (Apache-2.0). The canonical repository is github.com/Dhanikesh-Karunanithi/Sudar. We invite institutions, organizations, and open-source contributors to collaborate on pilots, plugin integrations, and community extensions.

**Subsection: Three surfaces**
- **Heading:** Three surfaces
- **Subtext:** Studio, Learn, and Intelligence work together around one learner model.

**Step 01 — Sudar Studio**
Admin and creator surface. Build courses from documents, URLs, or prompts. AI generates structure and content. Publish to Learn.

**Step 02 — Sudar Learn**
Learner-facing delivery. Personalized dashboard, modality choice, and the AI tutor — all driven by the Digital Learner Twin.

**Step 03 — Sudar Intelligence**
The AI brain. Adaptive engine, longitudinal memory, next-best-action, and the tutor "Sudar" — curious, warm, and knowledgeable.

**Footer links:** Mission & Vision → /mission | Research Foundation → /research | Collaborate → /collaborate

---

## Page: Features (/features)

**Title:** Features

**Intro:** Sudar delivers a full AI-native learning stack: authoring in Studio, delivery and adaptation in Learn, and intelligence in the backend. Below is a high-level feature overview.

### Sudar Studio (Admin / Creator)
- AI-powered course generation from PDF, DOCX, URL, or text prompt
- RAG pipeline for context-aware generation from uploaded documents
- 14 visual course templates, block-based editing, live preview
- Multi-source media search (Google, Pexels, Unsplash, Giphy)
- Web-search–driven module generation with citations
- SCORM 1.2 export and import
- Content fact-checking and validation
- Learning path builder (assign ordered course sequences to teams)
- Analytics dashboard (completions, skill gaps, drop-off analysis)
- Role-based access (Admin, Manager, Creator, Learner)
- Compliance tracking (mandatory training, certifications, due dates)
- Compliance email reminders (at-risk and overdue)
- Integrations: ALP API keys, embed Sudar, event ingestion

### Sudar Learn (Learner)
- Personalized learner dashboard (streak, time, engagement, Sudar recommends)
- Modality switching: Text, Video, Audio (Listen), MindMap, Flashcards, SudarFeed, SudarPlay
- AI Tutor Sudar: RAG over course content, longitudinal memory, floating chat
- Structured tutor responses (enroll, continue, review), quick memory preferences
- My Memory page with insights carousel
- Skills graph and knowledge gap visualization
- Next Best Action recommendations
- Learning path enrollment and progress tracking
- Certification management, SCORM delivery (iframe proxy)
- Digital Learner Twin (accumulation of all signals about a learner)
- Change password flow when required by admin

### Sudar Intelligence
- Adaptive difficulty engine
- Modality dispatcher and next-best-action algorithm
- AI Tutor engine (RAG, longitudinal memory via Supabase)
- Content generation (multi-format, multi-provider with fallback)
- Learner profile scoring and skill gap mapping
- Event processing (ingests learner events, updates profiles)
- Listen modality: TTS (Edge-TTS, optional Sarvam AI)

**Links:** Modalities → /modalities | ALP & Plugins → /alp | Self-host → /self-host

---

## Page: Self-Host at $0 (/self-host)

**Title:** Self-Host Sudar at $0

**Intro:** You can run Sudar the same way we do: Studio and Learn on **Vercel** (free tier), and Sudar Intelligence on **Railway**, **Render**, or **Fly.io** (free tiers available). No server cost for the front ends; optional paid tiers only if you need always-on or more resources.

### Why $0 is possible
Sudar is open source. Vercel hosts Next.js apps for free (hobby tier). Railway, Render, and Fly.io offer free tiers for the Python Intelligence service. You bring your own Supabase project (free tier) and AI API keys (usage-based). Open-weight models and zero-cost TTS (Edge-TTS) keep per-learner infrastructure cost extremely low — under $0.02/month in our reference setup.

### Prerequisites
- GitHub repo: https://github.com/Dhanikesh-Karunanithi/Sudar
- Vercel account (sign in with GitHub)
- Supabase project (same for both Studio and Learn)
- Sudar Intelligence hosted somewhere (Railway / Render / Fly.io) for production

### Step 1: Deploy Sudar Studio
1. Go to vercel.com/new and import the repo Dhanikesh-Karunanithi/Sudar.
2. Set **Root Directory** to byteos-studio (monorepo).
3. Add environment variables from byteos-studio/.env.example: Supabase keys, NEXTAUTH_URL, NEXTAUTH_SECRET, BYTEOS_INTELLIGENCE_URL, at least one AI key, NEXT_PUBLIC_LEARN_APP_URL (you'll set this after deploying Learn).
4. Deploy. Then set NEXTAUTH_URL to the actual Vercel URL and redeploy if needed.

### Step 2: Deploy Sudar Learn
1. Create another Vercel project from the same repo.
2. Set **Root Directory** to byteos-learn.
3. Add env vars from byteos-learn/.env.example: Supabase, NEXTAUTH_URL (your Learn URL), NEXTAUTH_SECRET, BYTEOS_INTELLIGENCE_URL, NEXT_PUBLIC_APP_URL (same as NEXTAUTH_URL).
4. Deploy.

### Step 3: Deploy Sudar Intelligence
Vercel only runs Node.js. The Python FastAPI service in byteos-intelligence/ must be hosted elsewhere. Recommended: **Railway**.

1. Sign up at railway.app. New Project → Deploy from GitHub repo, root byteos-intelligence.
2. Build: pip install -r requirements.txt. Start: uvicorn src.api.main:app --host 0.0.0.0 --port $PORT.
3. Set variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, at least one of TOGETHER_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY, CORS_ORIGINS (your Studio and Learn URLs), ENVIRONMENT=production.
4. Generate a domain in Railway. Copy the URL (e.g. https://sudar-intelligence.up.railway.app).
5. In both Vercel projects, set BYTEOS_INTELLIGENCE_URL to that URL and redeploy.

Alternatives: **Render** (New Web Service, root byteos-intelligence, same build/start commands) or **Fly.io** (Docker or fly launch in byteos-intelligence). Free tiers may spin down after inactivity; Railway and Render paid tiers give always-on.

### Step 4: Wire URLs
- In Studio (Vercel): set NEXT_PUBLIC_LEARN_APP_URL to your Learn URL.
- In Learn: ensure NEXTAUTH_URL and NEXT_PUBLIC_APP_URL match the Learn deployment URL.
- Redeploy both if you changed anything.

**Note:** Full step-by-step and env reference: docs/VERCEL_DEPLOYMENT.md and docs/INTELLIGENCE_DEPLOYMENT.md in the repo.

**Links:** Plugin downloads → /plugins | GitHub repo → (GitHub URL)

---

## Page: Blog (/blog)

**Title:** Blog

**Intro:** Updates, how-tos, and thought leadership on AI-native learning, Sudar, and the future of L&D.

**Note:** More posts will be added as MDX in the repo. Themes: 15-minute course, L&D without a team, why learners drop off, the AI tutor revolution.

### Blog post list (show as cards or list)

**Post 1**
- Slug: 15-minute-course
- Title: The 15-Minute Course Challenge
- Date: 2026-03-01
- Excerpt: How to build a complete course in Sudar Studio in 15 minutes — from document or URL to published content.
- Link: /blog/15-minute-course

**Post 2**
- Slug: lnd-without-team
- Title: L&D Without a Team
- Date: 2026-02-15
- Excerpt: Stories of solo L&D managers who built professional training without instructional designers or video teams.
- Link: /blog/lnd-without-team

**Post 3**
- Slug: why-learners-drop-off
- Title: Why Your Learners Aren't Finishing Courses
- Date: 2026-02-01
- Excerpt: Modality mismatch, disengagement, and the cost of one-size-fits-all delivery — and what adaptive learning changes.
- Link: /blog/why-learners-drop-off

---

## Blog post pages (full body copy)

### /blog/15-minute-course
**Title:** The 15-Minute Course Challenge  
**Date:** 2026-03-01

**Body:** Building a complete course in Sudar Studio in 15 minutes is not a trick — it's the default. Upload a PDF or paste a URL, and the AI generates a course outline and module content. You can edit, add media, and publish to Sudar Learn. No instructional designer required. This post will be expanded with a step-by-step and screenshots; for now, try it in Studio with any document or article URL.

**Back link:** ← Back to Blog → /blog

---

### /blog/lnd-without-team
**Title:** L&D Without a Team  
**Date:** 2026-02-15

**Body:** Solo L&D managers often lack the budget for Rise360, Articulate, or a full design team. Sudar gives you AI-powered course generation, 14 visual templates, and multi-source media search — so you can build world-class training on your own. We'll share case studies and tips from practitioners who ship training without a large team.

**Back link:** ← Back to Blog → /blog

---

### /blog/why-learners-drop-off
**Title:** Why Your Learners Aren't Finishing Courses  
**Date:** 2026-02-01

**Body:** Single-digit completion rates are common when content is one-size-fits-all. Modality mismatch (only text when someone learns better by listening), no adaptation to prior knowledge, and no memory of the learner all contribute. Sudar addresses this with multimodal delivery, the Digital Learner Twin, and an AI tutor that remembers and adapts. This post explores the evidence and what changes when learning is adaptive.

**Back link:** ← Back to Blog → /blog

---

## Page: Research Foundation (/research)

**Title:** Research Foundation

**Intro:** Sudar is designed as an evidence-informed learning platform that applies established findings from the learning sciences, cognitive science, and adaptive learning research.

### The gap Sudar fills
Traditional LMSs deliver static content: one course for all learners, no memory of who the learner is, and no adaptation of sequence, difficulty, or support based on behaviour or prior knowledge. Research consistently shows that adaptive instruction and intelligent tutoring outperform one-size-fits-all delivery, yet mainstream LMS products do not maintain a longitudinal learner model or provide personalised, memory-aware tutoring. Sudar is built to close this gap with learner memory, adaptive sequencing, and AI tutoring with longitudinal context inside a single, open learning platform.

### Core principles (evidence base)
- **Personalisation & adaptive instruction:** Learner profiles, next-best-action, adaptive path ordering, personalised welcome messages.
- **Multimodal learning:** Content authored once, delivered in text, video, audio, mindmaps, flashcards, and game-based modalities.
- **Metacognition & self-regulated learning:** Progress visibility, Sudar recommends, upcoming deadlines, required-path surfacing.
- **Formative assessment & retrieval practice:** In-module quizzes with immediate feedback, struggle detection feeding the learner model.
- **Intelligent tutoring & dialogue:** Reactive Q&A (RAG over course content), longitudinal memory, contextual help, proactive nudges.
- **Longitudinal learner model (Digital Learner Twin):** Persistent learner_profiles with ai_tutor_context, next_best_action, onboarding data.
- **Learning paths & prerequisite structure:** Mandatory and optional courses, unlock rules, adaptive path ordering, certifications.
- **Organisational learning & compliance:** Assignments, due dates, compliance views, certificates with shareable verification.

### Alignment with broader themes
Differentiation (adaptive paths, modality choice), scaffolding (Sudar as tutor, "Explain this"), feedback (quiz feedback, progress, next-best-action), motivation (streaks, certificates, due soon), and accessibility (multimodal delivery, structure for assistive tech).

### Open science & reproducibility
Sudar is open source so researchers and practitioners can inspect, extend, and evaluate the implementation. Schema and event model are documented; learning_events and ai_interactions support research on engagement and tutor usage. We encourage citation of the repository and research foundation when Sudar is used in studies or derivative work.

**Links:** Research Papers → /papers | Mission & Vision → /mission

---

## Page: Mission & Vision (/mission)

**Title:** Mission & Vision

**Tagline:** *Learns with you, for you.*

### Mission
Democratize high-quality, personalized learning — giving every learner in the world access to the kind of adaptive, intelligent education that was previously available only to those who could afford thousands of dollars in eLearning subscriptions (Rise360, Articulate Storyline, Adobe Captivate, etc.).

### Vision
Sudar is the world's first AI-native Learning Operating System — a platform that doesn't just deliver content, but learns the learner. It adapts modality, pace, difficulty, and content in real time based on behavioral signals, preferences, and outcomes.

### The Core Promise (three cards)

**For learners**  
A personal AI tutor that remembers you, adapts to you, and never judges you.

**For L&D teams / admins**  
Build world-class training content without needing instructional designers, video producers, or graphic designers. AI handles everything.

**For organizations**  
A platform that connects learning outcomes to business outcomes, with full analytics and compliance tracking.

**Links:** The Story → /story | Research Foundation → /research

---

## Page: Call for Collaboration (/collaborate)

**Title:** Call for Collaboration

**Intro:** Institutions, organisations, and open-source contributors are invited to collaborate on pilots, plugin integrations, and community extensions.

### Pilots
We are planning pilot evaluations with organisational and institutional partners: one university or HE institution using Moodle (or similar) with the ALP connector (SudarMemory, SudarChat, SudarRecommend), and/or one mid-market company using Sudar Learn standalone for mandatory or upskilling paths (e.g. 50–200 learners). Pilots will assess adoption, engagement, and early learning outcomes. Data collection and success criteria are described in the repo in docs/PILOT_PLAN.md.

### Plugin integrations
The ALP API is documented and implemented. We welcome connectors for Canvas, Blackboard, or other LMSs; user mapping (LMS user ID → Sudar profiles.id) and event shapes are in docs/ALP_API.md. If you build a plugin or adapter, we'd like to link to it or feature it in the community.

### Research and community
The reference implementation is open source (Apache-2.0) and evidence-informed. We encourage citation of the repository and RESEARCH_FOUNDATION.md when Sudar is used in studies or derivative work. Community extensions — new modalities, intelligence plugins, or integrations — are welcome; open an issue or PR on GitHub.

### Get in touch
Contact us at connect@dhanikeshkarunanithi.com for pilot discussions, partnership ideas, or technical collaboration. Repository: GitHub — Sudar (https://github.com/Dhanikesh-Karunanithi/Sudar).

**Links:** Contact form → /contact | Research Papers → /papers | ALP & Plugins → /alp

---

## Page: Modalities (/modalities)

**Title:** Modalities

**Intro:** Sudar is modality-agnostic: content is authored once in Studio and delivered in multiple formats in Learn so learners can choose — or be guided to — the format that fits them. Evidence from dual coding and multimodal learning supports offering text, audio, visual, and interactive options.

**List (each as a card or list item):**

- **Text (Read)** — Standard reading view with markdown, sections, and optional read-along. Core modality for every module.
- **Listen (Audio TTS)** — Audiobook/podcast-style TTS. Generated on demand via Sudar Intelligence (Edge-TTS or Sarvam). Voice and rate configurable.
- **Video** — Pre-generated or on-demand video from module content. Powered by Remotion and bytetexttovid.
- **Podcast** — Audio dialogue format; can use pre-generated or on-demand content.
- **Flashcards (Cards)** — Cards generated from module content via AI. Learners study in Cards tab; completion rules apply.
- **MindMap (SudarMind)** — Mindmap modality embedded in Learn. Visual structure of module content.
- **SCORM** — Import SCORM 1.2 packages in Studio; delivery in Learn via iframe proxy with correct MIME types.
- **SudarFeed** — TikTok-style feed modality (absorbed from shayshay). Planned.
- **SudarPlay** — Game-based modality (Phaser.js). Planned / in progress.

**Links:** Features → /features | Research Foundation → /research

---

## Page: ALP & Plugins (/alp)

**Title:** ALP & Plugins

**Intro:** The **Adaptive Learning Layer (ALP)** is an architecture that lets you deploy Sudar's capabilities as standalone plugins on top of existing LMSs — turning them into adaptive, memory-aware learning platforms without replacing the whole system.

### How ALP works
ALP sits between a host LMS (Moodle, Canvas, Blackboard) and Sudar Intelligence. The host LMS sends events (completions, quiz attempts, time-on-task, tutor exchanges) so ALP can maintain the Digital Learner Twin. It can then call Intelligence for tutor Q&A, next-best-action, and modality recommendations. SCORM and xAPI events are mapped into Sudar's learning_events and learner_profiles.

### ALP plugins (Moodle connector)
- **SudarMemory** — Event ingestion from the LMS into ALP. Sends learning events to POST /api/alp/events on your Sudar Learn app.
- **SudarChat** — Tutor inside Moodle. A block or LTI that embeds Sudar chat and calls POST /api/alp/tutor/query with learner ID and course context.
- **SudarRecommend** — Next-action block on the Moodle dashboard. Calls POST /api/alp/next-action and displays the recommendation card.

Auth for all ALP endpoints uses x-alp-api-key or Authorization: Bearer with an API key you create in Sudar Studio → Integrations.

### API documentation
The full ALP API — event ingestion, learner Twin, next-action, tutor query, embed token — is documented in the repository: docs/ALP_API.md. Studio's Integrations page shows your Learn base URL, API key setup, and embed link generator.

**Links:** Plugin downloads → /plugins | ALP API (GitHub) → (repo blob main docs/ALP_API.md) | Studio Help (Integrations) → /help/studio

---

## Page: Compare (/compare)

**Title:** Sudar vs. Alternatives

**Intro:** How Sudar compares to traditional authoring tools, generic LMSs, and generic AI assistants for L&D.

### vs. Rise360 / Articulate Storyline / Adobe Captivate
These tools require instructional designers, weeks of work, and high licence fees. Sudar builds in 15 minutes what Rise takes 15 weeks to create. No instructional designer required. Content is generated from documents or URLs; you edit and publish. Cost: self-host at $0 or pay only for your Supabase and AI usage — a fraction of enterprise authoring tool subscriptions.

### vs. Generic LMS (Moodle, Cornerstone, Docebo)
Traditional LMSs track who clicked and who completed. They deliver the same content to everyone and don't maintain a longitudinal learner model. Sudar learns who struggled and does something about it: adaptive path ordering, next-best-action, and an AI tutor with memory. You can also plug Sudar into your existing LMS via the ALP (Adaptive Learning Layer) so Moodle or Canvas gains adaptive, memory-aware tutoring without full replacement.

### vs. ChatGPT (or generic AI) for L&D
ChatGPT generates text. Sudar generates courses, videos, audio, flashcards, mindmaps, and a personal tutor — and remembers your learners across every session. The tutor is RAG-powered over your course content and uses a persistent Digital Learner Twin so responses are personalized. No copy-paste into a generic chat; it's built into the learning experience.

**Links:** Features → /features | Self-host at $0 → /self-host

---

## Page: FAQ (/faq)

**Title:** Frequently Asked Questions

**Q: What is Sudar?**  
A: Sudar is the world's first AI-native Learning Operating System. It unifies authoring (Studio), delivery (Learn), and intelligence (adaptive engine, AI tutor with memory) in one open-source platform. It learns the learner and adapts modality, pace, and content in real time.

**Q: Is Sudar free?**  
A: The software is open source (Apache-2.0). You can self-host at $0 using Vercel (Studio/Learn) and Railway/Render/Fly.io (Intelligence) free tiers. You pay for your own Supabase and AI API usage. There is no mandatory fee to use Sudar.

**Q: How do I self-host?**  
A: See the Self-Host at $0 page: deploy Studio and Learn as two Vercel projects (root dirs byteos-studio and byteos-learn), deploy Intelligence to Railway (or Render/Fly.io), set BYTEOS_INTELLIGENCE_URL in both Vercel projects. Full steps are in docs/VERCEL_DEPLOYMENT.md and docs/INTELLIGENCE_DEPLOYMENT.md in the repo.

**Q: How do I get the Moodle plugin?**  
A: ALP plugins (SudarMemory, SudarChat, SudarRecommend) are documented in the repo; Moodle connector packages will be published via GitHub Releases when ready. You can integrate today by calling the ALP API from your LMS backend; see docs/ALP_API.md and the Plugins page.

**Q: Where is my data stored?**  
A: In your own Supabase project. Studio and Learn connect to the same Supabase instance. Learner profiles, learning_events, ai_interactions, and content stay in your tenant. We do not host or mine your data.

**Q: What about privacy and GDPR/FERPA?**  
A: Data is stored in your Supabase project; you control retention and access. The research paper describes privacy and governance (tenancy, view/correct, opt-out, FERPA/GDPR alignment). See the Privacy Policy page for more.

**Links:** Privacy Policy → /privacy | Terms of Service → /terms | Contact → /contact

---

## Page: Contact (/contact)

**Title:** Contact

**Intro:** For collaboration, support, or press inquiries, reach out by email or GitHub.

**Email**  
connect@dhanikeshkarunanithi.com  
Use for: pilot discussions, partnership ideas, technical questions, or general contact.

**GitHub**  
https://github.com/Dhanikesh-Karunanithi/Sudar  
Use for: bugs, feature requests, pull requests, and community discussion. The repo includes documentation (ECOSYSTEM.md, docs/ALP_API.md, etc.).

**Newsletter**  
Sign up for product updates, blog posts, and EdTech & AI highlights. Newsletter signup will be added here when we integrate Resend (or similar); until then, follow the repo on GitHub for releases.

**Note:** A contact form (with Resend or similar) can also be added here to send messages to connect@dhanikeshkarunanithi.com.

**Links:** Call for collaboration → /collaborate | FAQ → /faq

---

## Additional routes (for sitemap/nav only; content can be minimal or same style as above)

- /mission — Mission & Vision (content above)
- /papers — Research Papers
- /plugins — Plugin Downloads
- /monetize — Make Money with Sudar
- /updates — Updates
- /edtech — EdTech & AI
- /best-practices — Best Practices
- /help/studio — Studio Help
- /help/learn — Learn Help
- /privacy — Privacy Policy
- /terms — Terms of Service
- /demo — Demo
- /roadmap — Roadmap
- /compare — Compare (content above)
- /accessibility — Accessibility

---

## Build notes for AI/designers

- **Brand:** Sudar. Serif for headlines, sans for body. Tagline: "Learns with you, for you."
- **Primary CTA:** Start with Sudar / Get started → self-host or signup.
- **Secondary CTAs:** GitHub, Blog, Collaborate, Research, Contact.
- **Tone:** Professional, evidence-based, inclusive. Emphasize open source, self-host at $0, and adaptive/AI-native learning.
- **Key differentiators:** Digital Learner Twin, AI tutor with memory, 15-minute course creation, ALP for existing LMSs, multimodal delivery.
- **Assets:** Logo can be used from repo or assets; hero can use abstract/atmospheric imagery if desired.
- **Accessibility:** Semantic HTML, skip links, ARIA where needed, sufficient contrast, keyboard nav.

End of document.
