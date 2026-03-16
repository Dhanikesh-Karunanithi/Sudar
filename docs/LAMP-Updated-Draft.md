# Learning That Remembers You: An AI-Native Ecosystem for Adaptive, Memory-Aware, and Multimodal Education at Scale

**Author:** Dhanikesh Karunanithi  
**Project:** Sudar / ALP Project  
**Repository:** https://github.com/Dhanikesh-Karunanithi/Sudar  
**Year:** 2026

---

## Abstract

Traditional learning management systems (LMSs) deliver static, one-size-fits-all content with no longitudinal learner model and no adaptive tutoring. Intelligent tutoring systems (ITS) that do adapt remain either narrow-domain research prototypes or products disconnected from the course-hosting infrastructure most organisations already use. We present **Sudar**, an AI-native learning system with three main contributions: (1) a full open-source reference platform that unifies authoring, delivery, and intelligence around a persistent **Digital Learner Twin**, adaptive sequencing, a complete multimodal delivery stack (text with read-along TTS, video, audio podcast, mindmap, flashcards, and SCORM), and an AI tutor with longitudinal cross-session memory; (2) the **Adaptive Learning Layer (ALP)**, an architecture by which these capabilities can be deployed as standalone plugins on top of existing LMSs — turning them into adaptive, memory-aware learning experience platforms without full platform replacement; and (3) a demonstrated **radical cost efficiency** enabled by open-weight inference models and zero-cost TTS, making world-class AI-native learning economically viable at a per-learner infrastructure cost of less than $0.02 per month — a reduction of over 99% compared to both incumbent commercial LMS licensing fees and proprietary AI provider stacks. The reference implementation is open source under the MIT licence, evidence-informed by the learning sciences, and designed as an extensible bedrock platform on which the community can build additional modalities, intelligence plugins, and LMS connectors.

---

## 1. Introduction

Learning management systems used by most organisations and universities deliver one-size-fits-all content: the same course for every learner, no memory of who the learner is, and no adaptation of sequence, difficulty, or support based on behaviour or prior knowledge. Research consistently shows that adaptive instruction and intelligent tutoring outperform fixed instruction [12, 2], yet mainstream LMS products do not maintain a longitudinal learner model or provide personalised, memory-aware tutoring [13, 1]. ITS that do adapt are typically not integrated into the same platform that hosts courses, compliance paths, and certifications.

We address this gap with Sudar, an AI-native learning system that (1) implements a complete reference platform with learner memory, adaptive paths, and a fully realised multimodal delivery stack; (2) is designed so its core components can be deployed as a layer on top of existing LMSs — the **Adaptive Learning Layer (ALP)** — enabling incumbent systems to gain longitudinal learner modelling, memory-aware tutoring, and modality choice without full platform replacement; and (3) demonstrates that this entire capability set can be delivered at infrastructure costs that approach zero, removing the economic barrier that has historically made AI-native learning a privilege of well-funded institutions.

The economic dimension deserves particular attention. In 2026, AI inference costs have fallen approximately 1,000-fold since 2022 [a16z LLMflation, 2025]. Delivering a full personalised learning session with AI tutoring, content generation, and TTS narration now costs less than a fraction of a US cent on open-weight model providers. Yet commercial LMS vendors continue to charge $5–$20 per user per month, and AI feature sets are typically offered as credits-based add-ons requiring enterprise contracts with annual commitments of $30,000 or more. This pricing structure excludes the very institutions — community colleges, NGOs, corporate L&D teams at mid-market companies, and educational organisations in the Global South — that would benefit most from adaptive, personalised learning. Sudar is an explicit response to this gap.

This paper presents a **system and architecture contribution** with an embedded economic analysis. Empirical efficacy data from a controlled study are not yet available; a pilot study has not yet been initiated; however, implementation is planned in collaboration with educational, university, and corporate institutions currently under negotiation, and corresponding outcomes will be documented in a subsequent publication. Our claims here concern design, implementation completeness, economic evidence, and the evidence-informed rationale for each component.

---

## 2. Background and Related Work

**Adaptive instruction and ITS.** Adaptive learning systems that tailor content and difficulty to the learner improve outcomes compared to one-size-fits-all instruction [12, 2]. Persistent learner models allow systems to adapt over time [11, 4]. Sudar implements adaptation through learner profiles, next-best-action recommendations, and adaptive path ordering.

**Multimodal learning and dual coding.** Dual coding and multimodal presentation support different learners and deepen encoding [9, 5]. Content is authored once and delivered in multiple formats (text with read-along narration, animated video, audio podcast, interactive mindmap, flashcards, and SCORM), with a modality dispatcher that recommends formats per learner profile.

**Self-regulated learning and metacognition.** Self-regulated learning and metacognitive scaffolding improve persistence and transfer [14]. Sudar supports this through progress visibility (streaks, completion rates), next-best-action surfacing, deadline awareness, and the tutor's "Your context" panel — a live view of what Sudar knows about the learner's goals and preferences — enabling learners to reflect on and correct their own model.

**Structured curricula and prerequisite ordering.** Structured curricula and prerequisite sequencing help learners build knowledge coherently [6]. Sudar supports learning paths with mandatory and optional courses, unlock rules, and adaptive reordering of optional content by the Intelligence engine.

**Formative assessment and retrieval practice.** Retrieval practice and formative assessment with feedback improve long-term retention [10, 3]. Sudar uses in-module quizzes with immediate feedback and low-stakes struggle detection that feeds directly into the learner model. Five quiz mode archetypes — standard, predict-then-learn, confidence-tagged, scenario-fork, and peer-contrast — are implemented to vary the retrieval modality and reduce habituation effects.

**AI in higher education and LMS.** Reviews of AI in HE note a persistent gap between ITS research and mainstream LMS adoption [13].

**AI plugins and learning analytics in LMSs today.** Mainstream LMSs have begun to expose AI in two main ways. First, *AI provider and placement plugins* (e.g. Moodle 4.5's AI subsystem [Moodle Developer Resources, 2025]) let institutions plug in external AI services for generic capabilities such as chatbots and content generation; these do not define a longitudinal learner model or a cross-course memory layer. Second, *third-party integrations* (e.g. LearnWise-style products) embed an AI assistant, grading help, or analytics directly inside the LMS via plugin, LTI, or API — but remain focused on course-level context and do not expose an LMS-agnostic intelligence layer or an open learner model that follows the learner across systems. Learning analytics plugins, meanwhile, log events and compute dashboards for instructors; they stop at visualisations and do not power a persistent Digital Learner Twin that feeds an adaptive tutor. Existing AI-for-LMS solutions thus fall into (1) generic AI provider plugins for chat or content, and (2) analytics plugins for instructor dashboards. None expose a persistent, cross-course learner model or an inspectable open learner profile, nor do they package the intelligence layer as LMS-agnostic services that multiple LMSs can call. In contrast, Sudar and ALP treat the Digital Learner Twin as a first-class, cross-platform substrate and make it accessible via uniform APIs.

Recent work on AI-augmented textbooks — e.g., *Learn Your Way* [8] — transforms source material with personalisation (grade level, interests), multiple views (immersive text, slides, audio, mind maps), and formative assessment; a randomised trial showed gains over a digital reader. However, *Learn Your Way* focuses on augmenting a single textbook or chapter within one product; it does not claim a longitudinal learner model across sessions and courses, nor does it provide an architecture to augment existing LMSs.

**Proactive and predictive AI tutoring.** A growing body of 2025–2026 research focuses on AI tutors that move beyond reactive Q&A toward predictive intervention. AgentTutor [2026] demonstrated multi-turn personalised teaching with dynamic strategy adjustment using curriculum decomposition and knowledge memory modules. Reinforcement learning-driven ITS research [ResearchSquare, 2025] showed 28.6% better intervention adaptability, 31.2% reduction in recurring student errors, and 24.8% lower dropout rates compared to traditional ITS — achieved by learning optimal intervention policies from behavioural data rather than hand-coding rules. Sudar's Intelligence layer is designed as a foundation for this trajectory.

**Inference cost economics and accessibility.** The cost of AI inference has fallen approximately 1,000-fold from 2022 to 2026, at a rate of roughly 10× per year — faster than Moore's Law and faster than the bandwidth cost curves observed during the internet expansion of the early 2000s [a16z LLMflation, 2025]. GPT-3-class performance, which cost $60 per million tokens in 2021, is now available at $0.06 per million tokens on open-weight models. This collapse makes AI-native learning economically viable at population scale for the first time, yet no major LMS vendor has restructured its pricing model to reflect it. This paper argues that open-source, open-weight AI platforms are the mechanism by which this economic gain reaches learners rather than being captured as margin by incumbents.

**Table 1: Contrast — Sudar + ALP vs. Learn Your Way and a typical LMS with AI add-on**

| Feature | Sudar + ALP | Learn Your Way | Typical LMS + AI |
|---|---|---|---|
| Scope | Full platform + plugin layer | Single-product reader | Course host + chatbot |
| Learner model | Longitudinal (Digital Twin) | Per-session / material | None or stateless |
| Tutor memory | Cross-session, cross-course | Not claimed | Stateless |
| Modalities | Text+TTS, video, podcast, mindmap, flashcards, SCORM | Text, slides, audio, mind map | Usually text/video only |
| Authoring | Integrated (Studio) | N/A (ingests material) | Separate tools |
| Augment LMS | Yes (ALP plugins) | No | N/A |
| Open source | Yes (MIT) | No | Rarely |
| Infrastructure cost (1,000 learners/month) | ~$21 | N/A | ~$3,400–$44,000 |
| Self-serve, no minimum | Yes | N/A | No (enterprise sales) |

---

## 3. System Design

### 3.1 Platform Architecture

The system has three surfaces sharing one data layer:

1. **Studio (admin/creator):** Course and path creation, AI-powered generation from documents or URLs, analytics, compliance management.
2. **Learn (learner):** Personalised dashboard, course viewer with modality switching, AI tutor sidebar (Sudar), progress tracking, and certificates.
3. **Intelligence (backend):** Adaptive engine, AI tutor engine, modality dispatcher, next-best-action computation, learning-event processing, and TTS audio generation.

All three surfaces share a single source of truth (Supabase / PostgreSQL) for authentication, learner profiles, content, and events. Studio and Learn are Next.js 14 applications; Intelligence is a Python FastAPI service. The event flow is: learner actions and tutor exchanges write to `learning_events` and `ai_interactions`; the Intelligence layer then asynchronously updates the learner profile and next-best-action.

### 3.2 Digital Learner Twin and Learner Model

A persistent **Digital Learner Twin** is stored in `learner_profiles`. It includes:

- Modality affinity scores (per format, 0.0–1.0)
- Learning pace and difficulty comfort
- Behavioural signals (session duration, completion rate, streak)
- A `preferences` field (JSONB) holding TTS voice selection, response length preference (concise / one-line / detailed), and modality preference notes
- An `ai_tutor_context` JSON field holding known concepts, struggles, learning-style notes, goals, and interaction summaries

This context is updated asynchronously from tutor interactions and quiz outcomes (e.g., struggle detection from repeated wrong answers). The design aligns with open learner model principles [4] and supports personalisation across courses and sessions. Crucially, the learner can inspect and correct their own model at any time via the tutor's "Your context" panel, supporting metacognitive engagement [14].

### 3.3 AI Tutor with Longitudinal Memory

The AI tutor, **Sudar**, is both:

- **Reactive:** Retrieval-augmented generation over course content to answer learner questions
- **Proactive:** Generating nudges when struggle or a prolonged pause is inferred from behavioural signals

Every exchange is logged in `ai_interactions`. The tutor's system prompt includes the learner's memory summary drawn from `ai_tutor_context`, so responses reference prior struggles, match the learner's preferred explanation style, and explicitly connect new material to prior learning. Most AI in LMS implementations are stateless [13]; Sudar is not, and this longitudinal memory is a primary differentiator.

**From stateless chatbots to stateful tutors.** A *stateless* tutor sees only the current turn or session and loses all history when the learner returns the next day. Practitioners often work around this with prompt-summarisation of prior chat or JSON-based "save files" that persist a few learner facts between sessions; these are typically per-course or per-conversation and are not integrated into an institutional learner model. Sudar generalises this pattern into a first-class **Digital Learner Twin** persisted in `learner_profiles`, shared across courses, accessible to any ALP plugin, and inspectable by the learner through the "Your context" panel. This turns ad-hoc memory into an institutional-grade learner model.

Additional tutor capabilities implemented in the current version include: a **text-selection-to-tutor popup** that allows learners to highlight any passage in the module and immediately invoke one of six pre-built actions ("Explain this", "Give me an example", "Why does this matter?", "Simplify this", "Summarise", "How does this connect…") or submit a custom question; a **resizable overlay panel** that learners can expand to full width without disrupting the content area; and a **generative block renderer** that allows the tutor to respond not only with prose but with structured artefacts — quiz questions, course recommendation cards, multi-step workflow trackers, and action groups — enriching the interaction beyond simple Q&A.

### 3.4 Modality-Agnostic Delivery

Content is authored once (structured courses and modules). The delivery layer presents the same material in six fully implemented modalities, selectable per learner in real time:

**Text with Read-Along.** The default text modality includes a server-side TTS read-along system. Unlike browser `speechSynthesis` implementations, Sudar's read-along calls the `/api/ai/generate-audio` endpoint for each sentence sequentially, receiving high-quality neural voice audio from Edge-TTS (40+ languages, 300+ voices, Azure Neural quality at zero cost). Each sentence is highlighted in-place in the document body as it plays, via sentence-boundary span elements rendered by `ReadingBodyWithSentences`. A collapsible transcript strip and sentence counter ("Sentence 3 of 24") support both visual and auditory learners simultaneously. Learning events (`read_along_start`, `read_along_complete`) are recorded for telemetry.

**Animated Video.** The video modality (`CourseVideoCard`) renders course content as a scene-by-scene animated video entirely in-browser, requiring no video generation API. Four animation styles — kinetic (bold scale-up entrance), word-reveal (word-by-word stagger), fade (paragraph fade-up), and list (staggered bullets) — are applied per scene. An animated gradient background with a cursor-following fourth orb provides visual depth. If scenes carry a `audioDataURL` field (Base64-encoded TTS audio), playback is audio-driven; otherwise, a configurable scene timer advances automatically. A scrubable progress bar and prev/next controls give learners full navigation agency.

**Audio Podcast.** The podcast modality (`CoursePodcastCard`) presents course content as a two-voice dialogue between a host and domain expert, playing through `DialogueSegment[]` objects sequentially. A live transcript highlights the active segment with animated equaliser bars; learners can click any segment to jump playback. Volume control, elapsed-time display, and a shimmer-animated progress bar complete the player.

**MindMap (SudarMind).** The mindmap modality (`MindMapCard`) generates an interactive concept map via `POST /api/ai/generate-mindmap`. The renderer is a fully custom SVG layout engine with no external charting library dependency. A `buildLayout()` function counts tree leaves to compute vertical centering; eight distinct colour families are assigned to top-level branches; node styles vary by depth (root pill, solid branch pill, transparent bordered box, dot+text for leaf nodes); and smooth cubic Bézier curves connect parent-child pairs. Hovering any node displays a floating tooltip with its label and an optional one-sentence AI-generated insight. A scope switcher lets learners see either the current module or the full course as a map.

**Flashcards.** The flashcards modality generates a set of review cards from module content on demand via `POST /api/ai/generate-flashcards`, supporting spaced repetition workflows and retrieval practice [10, 3].

**SCORM.** Existing SCORM packages are rendered in a full-height sandboxed iframe with a `postMessage` API shim intercepting `scorm_set_value` and `scorm_finish` signals. Session time, suspend data, and raw scores are written to `learning_events` on completion. The `scorm_text_content` field on imported modules feeds Sudar's RAG knowledge base, so the AI tutor can answer questions about SCORM content it has never directly rendered.

A modality dispatcher in the Intelligence layer recommends the next modality from the learner's affinity scores and recent behaviour, supporting dual-coding principles [9, 5] and learner agency. The architecture is explicitly designed so modality backends can be swapped independently of the delivery layer — a property discussed in Section 3.7.

### 3.5 Adaptive Sequencing and Next-Best Action

Learning paths support mandatory and optional courses and unlock rules. For optional courses, the ordering is adapted by the Intelligence engine from the learner profile and inferred knowledge gaps. A next-best-action algorithm suggests the next course or module and provides a human-readable explanation, surfacing required items and due-soon deadlines. Formative assessment (in-module quizzes with immediate feedback) and struggle detection feed the learner model [3, 10].

Five quiz mode archetypes — standard closed-response, predict-then-learn (learner commits a prediction before seeing content), confidence-tagged (learner rates certainty alongside each answer), scenario-fork (branching scenario with consequence feedback), and peer-contrast (response compared against anonymised peer distribution) — vary the retrieval modality and support metacognitive calibration.

### 3.6 Plugin Architecture for Existing LMSs: The Adaptive Learning Layer (ALP)

The most novel architectural contribution is the **Adaptive Learning Layer (ALP)**: a plugin layer that packages Sudar's capabilities as independently deployable services for existing LMSs. The core insight is that organisations running Moodle, Canvas, Blackboard, or a proprietary LMS need not abandon their investment to gain learner memory and adaptive tutoring — ALP attaches these capabilities via APIs and event hooks.

Moodle 4.5 introduced a dedicated AI subsystem with a formal separation between Provider plugins (which interface with external AI services) and Placement plugins (which define where AI functionality appears to users). ALP is architecturally aligned with this model: it acts as an intelligent provider that supplies longitudinal learner context and adaptive recommendations that no default Moodle provider can offer.

**ALP components — five independently deployable plugins:**

1. **SudarMemory.** The foundational layer. It intercepts the host LMS's xAPI or webhook event stream (quiz scores, content completions, time-on-task, tutor exchanges) and maintains a Digital Learner Twin for each user in the ALP database. Requires no visible UI change to the host LMS. Every other ALP plugin queries this Twin as its data source. Zero disruption to existing workflows; maximum leverage of existing event infrastructure.

2. **SudarChat.** Embeds the Sudar AI tutor as a sidebar or modal panel inside any LMS course page. Every message queries the learner's Digital Learner Twin from SudarMemory, so the tutor knows the learner's history, preferences, and prior struggles across *all* their courses on the LMS — not just the current one. Graceful fallback if the Intelligence service is unavailable. Rendered via the LMS's existing block or plugin rendering system without modification of core LMS files.

3. **SudarStudio Embed.** Adds a "Generate with AI" control to the host LMS's course editor. Instructors can select any module text and generate a mindmap, flashcard set, audio narration, or animated video storyboard — all powered by Sudar Intelligence — and embed the output as a native LMS resource. No content migration required; generated assets live in the LMS's own file store.

4. **SudarRecommend.** A next-best-action widget for the LMS dashboard. Queries the ALP `/api/intelligence/next-action` endpoint with the learner's current profile and returns a personalised recommendation card (next course, remediation module, or study suggestion). Renders in the LMS's block system with no schema changes to the host database.

5. **SudarAdapt.** The most advanced plugin. Integrates with the LMS's conditional activity system (e.g., Moodle's availability conditions) to dynamically unlock or reorder optional content based on ALP's adaptive sequencing recommendations. An administrator designates which activities are ALP-managed; SudarAdapt then routes each learner through the optimal path without any learner-visible complexity.

**Integration flow:**

```
Host LMS (owns content, enrollments, grades)
    │
    ├─ Learning events → SudarMemory → Digital Learner Twin
    │
    ├─ SudarChat ← Twin + course RAG index
    │
    ├─ SudarStudio Embed ← /api/content/* (mindmap, flashcards, audio, video)
    │
    ├─ SudarRecommend ← /api/intelligence/next-action
    │
    └─ SudarAdapt ← /api/learner/adaptive-sequence
```

**ALP API surface and data flow.** Event ingestion accepts xAPI or SCORM-style payloads and maps them into `learning_events` (actor/user, verb/event_type, object, result, context). The learner model is read and updated via endpoints aligned with the reference Intelligence service: e.g. `POST /api/learner/profile` (update Twin from session events), `POST /api/learner/next-action` (next-best action), and `POST /api/tutor/query` (tutor Q&A with learner ID and content source). The Learn app exposes ALP proxies (`POST /api/alp/events`, `POST /api/alp/next-action`, `POST /api/alp/tutor/query`) so external LMSs can call a single base URL with an API key; the full contract is documented in the repository (docs/ALP_API.md). SCORM remains dominant for simple completion and score reporting; xAPI and LRS-style streams offer finer granularity (e.g. paragraph-level time, replay counts), which better supports the Digital Learner Twin and adaptive sequencing. ALP can sit on top of an existing LRS or act as a specialised LRS for tutoring and adaptation.

No data migration. No LMS replacement. The institution's existing courses, users, grades, and integrations continue operating as the source of truth. ALP sits alongside them, enriching the experience without replacing infrastructure. For institutions that cannot switch LMS products for contractual, regulatory, or organisational reasons, ALP is the only path to longitudinal learner intelligence.

**The addressable scale.** Moodle alone has 509 million registered users across 233 countries and holds a 28.67% share of the global LMS market [Moodle.org, 2025]. Canvas, Blackboard, and Sakai each serve tens of millions of additional users. ALP connectors for these platforms collectively address the largest possible deployment channel for Sudar's intelligence layer — without requiring a single institution to change its LMS.

To our knowledge, no widely adopted technology today adds a longitudinal learner model and memory-aware tutoring to incumbent LMSs in a pluggable, LMS-agnostic way. SCORM and xAPI standardise event reporting but provide no intelligence layer. Commercial LMS AI add-ons are typically stateless within a session. ALP is designed specifically to fill this gap.

### 3.7 Open-Source Extensibility and The Modality Upgrade Path

A distinguishing property of Sudar as a platform is that its modality delivery stack is explicitly designed for community extension and backend substitution. This is not merely an aspirational design principle; it is enforced by the data architecture. The `VideoScene[]` type, `DialogueSegment[]` type, and `ModalityVariants` composite type on module records are provider-agnostic interfaces. The rendering frontend consumes these data structures without caring how the content was generated. This means any modality backend — AI video generator, TTS engine, or mindmap renderer — can be swapped or upgraded by a community contributor without touching the delivery layer.

**The video modality upgrade path** is the clearest illustration. The current in-browser renderer delivers animated typographic video at zero infrastructure cost. It is a fully functional baseline. Organisations or community contributors who want photorealistic or character-driven video can connect any of the following backends to the same `VideoScene[]` interface:

- **Higgsfield** — a multi-model creative platform aggregating Sora 2, Kling 2.6, and Google Veo 3.1, with world-model physics simulation, character consistency locking, lip-sync, cinema-grade camera simulation (ARRI and RED lens characteristics), and audio-adaptive motion generation that syncs movement to music beats. The Creator plan provides 4× more generations per dollar than standalone platforms. Optimal for enterprise L&D teams requiring high production value.
- **Wan 2.1** (Alibaba, MIT open-source) — a text-to-video suite with models ranging from 1.3B to 14B parameters. The T2V-1.3B model requires only 8.19 GB VRAM, enabling 480p video generation on a consumer RTX 4090 at approximately 4 minutes per 5-second clip. For institutions requiring data sovereignty, offline capability, or zero per-call cost, Wan 2.1 can be self-hosted on commodity GPU hardware [Wan-Video/Wan2.1, GitHub, 2025].
- **HunyuanVideo** (Tencent, open-source) — a Diffusion Transformer architecture with FP8 quantized weights and strong community integration via ComfyUI and Diffusers. Continuous model improvements (HunyuanVideo-1.5, Nov 2025) and avatar animation specialisation make it well-suited for instructor avatar generation in corporate training contexts.

The principle is: **Sudar is the authoring and delivery operating system; the generation backend is a plugin.** A school in Sub-Saharan Africa self-hosts Wan 2.1 on a local GPU server and generates all course videos with zero per-call cost. A Fortune 500 L&D team connects Higgsfield for cinematic course introductions. The learner experience — the Digital Learner Twin, adaptive sequencing, AI tutor, and modality switching — is identical. Quality scales with available budget; the platform itself is the constant.

**Community extension patterns enabled by the MIT licence:**

- **New modality plugins:** A community developer can add a VR walkthrough modality, a 3D simulation renderer, or an AR overlay layer, all consuming the existing module content schema with no changes to the core platform.
- **New LLM backends:** The Intelligence service is provider-agnostic by design. Any OpenAI-compatible API endpoint — Together AI, Groq, Cerebras, Ollama (local), or a fine-tuned domain-specific model — can replace the default provider via environment variable.
- **New language and voice packs:** The TTS pipeline already supports Sarvam AI's Indian English neural voices alongside the default Edge-TTS library. Community contributors can add Yoruba, Swahili, Bengali, or any other language by registering a new provider implementation.
- **Vertical-specific forks:** A medical education deployment can extend quiz modes with USMLE-specific question formats; a software engineering bootcamp can embed in-browser code execution alongside the tutor; a regulated-industry compliance deployment can add immutable audit trail logging and evidence packaging for accreditation review.
- **White-label institutional deployments:** Universities and corporate training divisions can fork Sudar, apply institutional branding, and run the platform on their own infrastructure — with the same AI-native capability set as the reference implementation, and with full control over data, model versions, and update cadence.

The open-source moat is compounding: every community contribution improves the platform for all deployments, and those contributions carry no incremental cost to the project.

### 3.8 The Evolution of Sudar Intelligence: From Reactive to Predictive Bedrock

The Intelligence layer described in Sections 3.3 and 3.5 reflects the current implementation: reactive Q&A via RAG, rule-based proactive nudges triggered by explicit behavioural signals, and a longitudinal memory updated from quiz outcomes and tutor exchanges. This is a substantial advance over stateless LMS AI. It is also, architecturally, only the beginning.

**The predictive layer.** As the `learning_events` table accumulates interaction data — time-on-task at paragraph resolution, scroll depth, replay counts, wrong-answer sequences, abandoned sessions, modality switches — the Intelligence engine transitions from rule-based heuristics to *learned* intervention policies. The research frontier in 2025–2026 demonstrates what becomes possible: reinforcement learning-driven ITS achieves 28.6% better intervention adaptability, 31.2% reduction in recurring errors, and 24.8% lower dropout rates compared to rule-based systems [ResearchSquare, 2025], precisely because the system learns *when* and *how* to intervene from data rather than from a priori assumptions.

Sudar's architecture anticipates this transition explicitly:

- **Dropout prediction:** Learning to identify the behavioural signature that precedes course abandonment — prolonged inactivity patterns, declining session durations, increasing error rates on formative assessments — and intervening with the right modality change, workload adjustment, or personal encouragement before the learner disengages.
- **Knowledge gap forecasting:** Predicting which quiz questions a learner will struggle with before they encounter them, enabling pre-scaffolding with targeted explanatory content or a modality switch that matches the learner's current cognitive load.
- **Optimal intervention timing:** Learning per-learner patterns for when a Sudar nudge will be welcomed versus intrusive. Some learners work best in uninterrupted flow; others benefit from a check-in at the 20-minute mark. A predictive model learns this distinction from behavioural history.
- **Behavioural modality inference:** Moving from manually reported preferences (the current TTS voice and modality preference settings) to behaviourally inferred affinities — the system observes that this learner consistently completes mindmaps but exits podcasts at 40% completion, and adjusts the modality dispatcher accordingly, without requiring the learner to explicitly configure anything.

**The plugin bedrock.** Sudar Intelligence is designed to function as a platform that third-party intelligence plugins read from and write to, not merely as a service with a fixed feature set. The `learning_events` stream and the Digital Learner Twin are the substrate. Future first-party and community-built plugins on this substrate could include:

- **SudarCoach** — a career pathway advisor that maps the learner's knowledge state against job market skill requirements, recommending courses that close the highest-value gaps first.
- **SudarAssess** — a psychometric assessment layer that fits item response theory models to the learner's quiz response stream, producing calibrated ability estimates and difficulty-appropriate question selection.
- **SudarSocial** — a peer learning orchestrator that identifies learners with complementary knowledge gaps and matches them for collaborative tasks, generating collaborative exercises via the Intelligence API.
- **SudarCompliance** — automated evidence collection and attestation packaging for regulated industries (healthcare, aviation, financial services), mapping completed modules and quiz scores to regulatory competency frameworks.
- **SudarTranslate** — real-time multilingual delivery, translating both rendered text content and TTS narration on the fly, enabling a single course to serve a multilingual workforce without duplicate authoring.

The principle is: Sudar's persistent learner model and event stream are the shared data layer that every intelligence plugin reads from and writes to. A plugin developer does not need to solve learner modelling; they inherit a solved, continuously improving learner model and build domain-specific intelligence on top of it.

---

## 4. Implementation and Reproducibility

The reference platform is implemented with:

- **Next.js 14** (Studio, Learn) — TypeScript strict mode, App Router, Tailwind CSS
- **Python 3.11+ FastAPI** (Intelligence) — async handlers, Pydantic v2 models
- **Supabase** (PostgreSQL + pgvector, auth, storage)
- **AI providers:** Together AI (primary; open-weight models), OpenAI and Anthropic (optional fallback)
- **TTS:** Edge-TTS (default; zero cost, 40+ languages, 300+ voices) with optional Sarvam AI (Indian English neural voices)

The schema and event model are fully documented in the repository (`ECOSYSTEM.md`, `RESEARCH_FOUNDATION.md`). Key tables: `learner_profiles`, `learning_events`, `ai_interactions`, `enrollments`, `certifications`.

**Currently implemented features:**

- Shared authentication and schema across Studio and Learn
- Course and learning path CRUD, publish workflow, and document-to-course AI generation
- Learner dashboard with streak, time-on-task, Sudar recommendations, upcoming deadlines, and required path surfacing
- Course viewer with six fully implemented modalities: text (with sentence-level read-along TTS), animated video, audio podcast, interactive mindmap, flashcards, and SCORM delivery
- AI tutor (Sudar) with longitudinal cross-session memory, RAG over course content, text-selection popup (6 pre-built actions), resizable overlay, "Your context" live memory panel, and generative block rendering (quiz, course cards, workflow status, action groups)
- Five quiz mode archetypes (standard, predict-then-learn, confidence-tagged, scenario-fork, peer-contrast) and five lesson archetypes (cold-open, socratic, misconception-trap, case-file, comparison-engine)
- Server-side TTS pipeline via Edge-TTS with optional Sarvam AI, learner voice preference settings stored in Digital Learner Twin
- Next-best-action and adaptive path ordering; struggle detection from quiz and behavioural signals
- Learning paths with mandatory/optional courses, unlock rules, and shareable certification links with PDF certificate generation
- Compliance view (overdue / at-risk / on-track) and analytics (completions, quiz scores, struggle topics, time per section)
- Compliance email reminders: cron endpoint for at-risk and overdue path assignments (Resend; CRON_SECRET), documented in STUDIO_USER_GUIDE and SHIPPED_FEATURES
- Learner preferences page (TTS voice, response style, modality preferences stored in learner profile)
- SCORM import with text content extraction for AI tutor RAG knowledge base
- Listen (Audio TTS) modality: standalone Listen tab in course viewer with on-demand TTS per module (generate-audio API, AudioCard)
- Production deployment: Studio and Learn on Vercel; Intelligence on Railway, Render, or Fly.io (docs/VERCEL_DEPLOYMENT.md, docs/INTELLIGENCE_DEPLOYMENT.md)

**Remaining planned items:** SudarPlay (gamified modality), SudarFeed (social/TikTok-style learning feed), white-label configuration, SSO/HRIS integration, additional reminder channels (e.g. push), and ALP LMS connectors for Moodle, Canvas, and Blackboard. Pilot (O1) and Claude-for-OSS application (O2) to follow build completion.

The project is open source under the MIT licence. Self-deployment requires a Supabase project (free tier supports approximately 500–700 learners before the 500 MB database limit), a Together AI API key, and a standard Node.js and Python 3.11 environment. No proprietary infrastructure is required to run a fully functional deployment.

---

## 4.5 Economic Accessibility: The Radical Cost Case

The economic dimension of Sudar is not incidental to its design — it is one of its three primary contributions. This section documents the cost structure in detail and contextualises it against both incumbent commercial LMS pricing and the broader global education access crisis.

**Costing methodology and assumptions.** All figures below use March 2026 list pricing. Token counts are estimated from observed usage: a typical tutor exchange is ~2,000 tokens (input + output); a full course generation from document is ~5,000 tokens per module. We use Together AI's Llama 3.1 8B at $0.18/1M input and $0.18/1M output as the baseline; GPT-4o and Claude 3.5 Sonnet equivalents use published API pricing. Sessions per learner per month are assumed at 50 (mix of tutor, modality switches, and light generation). Hosting (Supabase) is excluded from the per-learner AI cost: free tier suffices for small deployments; Pro ($25/month) is used for scale estimates. Edge-TTS is zero marginal cost; Azure AI Speech or other licensed TTS would add per-character cost if substituted. The cited 1,000× inference cost collapse [a16z LLMflation, 2025] is reflected in the contrast: GPT-3-class at $60/1M tokens (2021) versus $0.06/1M on open-weight models (2026).

### 4.5.1 Observed Infrastructure Cost

**Empirical finding.** Operating Sudar at full engagement — generating 10 courses, completing 20 learner review sessions as a learner in full engagement mode including AI tutor chat, adaptive personalisation, mindmap generation, flashcard generation, and TTS narration — costs approximately **$0.20 per week** on the Together AI + Edge-TTS stack. This figure reflects real usage of the platform, not a theoretical minimum.

**Validated breakdown** (Together AI, March 2026 pricing):

| Task | Estimated Tokens | Cost (Llama 3.1 8B at $0.18/1M) |
|---|---|---|
| 10 course generations | ~50,000 | $0.009 |
| 20 AI tutor sessions | ~40,000 | $0.007 |
| 10 mindmaps + flashcard sets | ~30,000 | $0.005 |
| TTS narration via Edge-TTS | — | **$0.000** |
| **Total** | **~120,000** | **~$0.021** |

The equivalent workload on a GPT-4o + OpenAI TTS stack costs approximately $3.41 — a **162-fold cost difference** for identical functionality.

At organisational scale, the contrast is starker:

| Stack | 1,000 learners, 50 sessions/month | Annual |
|---|---|---|
| Sudar (Together AI + Edge-TTS) | **$21/month** | **$252/year** |
| GPT-4o + OpenAI TTS-1 | $3,405/month | $40,860/year |
| Claude 3.5 Sonnet + Azure TTS | $3,735/month | $44,820/year |

At 10,000 learners, Sudar's open-weight stack costs approximately $210/month. The equivalent closed-model stack would cost $34,050–$37,350/month. The delta — over $400,000 per year — is the economic value of open-weight inference returned to the institution rather than captured by AI API providers.

### 4.5.2 The Inference Cost Collapse

AI inference costs have fallen approximately **1,000-fold** from 2022 to 2026, at a sustained rate of approximately 10× per year [a16z LLMflation, 2025]. This is the result of compounding advances in hardware efficiency (2–3× per GPU generation), software optimisation (vLLM and TensorRT-LLM raising GPU utilisation from 30–40% to 70–80%), Mixture-of-Experts architectures that activate only a fraction of model parameters per token, and quantisation and distillation techniques that reduce model size without proportional quality loss. GPT-3-class performance, which cost $60 per million tokens in 2021, is available at $0.06 per million tokens on open-weight models in 2026.

The implication for educational AI is direct: **the cost of delivering a world-class personalised tutor interaction to one learner is now less than $0.02 per month.** This is below the cost of a single SMS message. The economic argument against AI-native learning — that it is too expensive to deploy at scale — has expired.

Yet this economic reality has not been reflected in the pricing of commercial AI LMS products. Incumbents continue to charge $5–$20 per user per month for platform access, with AI features offered as credits-based add-ons or enterprise-only tiers requiring contracts of $30,000–$70,000+ per year. The gap between the actual cost of AI-native learning infrastructure and the price at which it is sold represents an extractable rent that open-source alternatives can eliminate.

### 4.5.3 Competitive Positioning Against Incumbent LMSs

| Platform | Pricing Model | Entry Point | AI Capability |
|---|---|---|---|
| Docebo | $5.83–$10.00/user/month | ~$30,000/year | Credits-based add-on ("Harmony AI") |
| Sana Labs | ~$12–$20/user/month (est.) | 300-user minimum, 3-year contract | Core differentiator |
| Cornerstone OnDemand | $4.00–$6.00/user/month | Avg. ACV $69,000 | Limited add-on |
| 360Learning | $8.00/user/month | 100-user minimum | Collaborative AI |
| LinkedIn Learning | ~$31.66/user/year | $379.88/user/year (5–125 seats) | AI learning plans |
| **Sudar** | **Infrastructure: ~$0.21/user/month at scale** | **Self-serve, no minimum, no sales call** | **AI-native core** |

The average corporate training spend per employee is $1,283 per year [Statista, 2023]. Sudar's infrastructure cost of $0.21/user/month ($2.52/year) represents a **99.8% cost reduction** for the AI infrastructure layer compared to this benchmark. Even accounting for hosting, engineering, and operational costs, an organisation deploying Sudar at the $25/month Supabase Pro tier to serve several hundred learners is operating at a total platform cost of $27–$50/month — a figure that would be a line-item rounding error in most L&D department budgets.

No major player in the current market offers a transparent, self-serve, AI-native LMS in the sub-$5/user/month segment. This gap is uncontested.

### 4.5.4 The Education Access Crisis and the Democratisation Imperative

The economic case for Sudar is not only relevant to cost-conscious corporate L&D teams. It is directly relevant to a global education access crisis of extraordinary scale.

As of 2024: 251 million children and youth remain out of school globally, with only 1% improvement since 2015 [UNESCO, 2024]. 650 million students leave the education system without a secondary certificate. In Sub-Saharan Africa, fewer than 1 in 10 students reach minimum reading proficiency; fewer than 2 in 10 meet minimum mathematics standards. 2.6 billion people remain offline globally [ITU, 2024], with 1.8 billion of those in rural areas. Mobile internet in Africa costs 14× more than in Europe. An annual financing gap of $39 billion exists for basic education in low- and lower-middle-income countries through 2030 [UNESCO, 2023].

These figures represent the context in which AI in education is most consequential. High-end AI learning platforms priced at $12–$20 per user per month are simply not deployable in this context. A platform whose full AI infrastructure costs $0.02 per learner per month — and whose entire stack is open-source, self-hostable, and runnable on open-weight models — is.

The bottleneck for equitable AI-native learning is no longer compute cost. It is: (a) access to funded API tokens; (b) connectivity; and (c) awareness. Sudar addresses (a) and (c) structurally. For (b), the open-source architecture enables offline-capable variants using locally hosted open-weight models (Llama, Mistral, Wan 2.1), where the only requirement is a single GPU server accessible within a local network.

**This paper issues three specific calls to action:**

1. **Inference model companies** — Together AI, Groq, Cerebras, and emerging providers — to establish social responsibility token pools for verified educational deployments in low-income countries, mirroring the established practice of nonprofit cloud credits from AWS, Google, and Microsoft. The cost of providing API tokens for 10,000 learners for a full month on current pricing is approximately $200. This is a trivially small commitment relative to the social impact.

2. **Corporate L&D departments and CSR programmes** to fund API token grants for Sudar deployments in underserved markets. An organisation spending $1,283 per employee per year on training could, for the same cost, fund the AI infrastructure for approximately 500 learners in a developing country for an entire year. The asymmetry between the cost of the grant and the scale of the impact is an opportunity for genuine leverage.

3. **Institutional partners and governments** to consider Sudar's open-weight, self-hostable architecture as an alternative to expensive EdTech licensing in national and regional educational technology procurement. The infrastructure cost of deploying AI-native personalised learning across an entire school system is, at current open-weight inference prices, within reach of budgets previously insufficient for basic LMS licensing.

---

## 5. Evidence and Evaluation Strategy

**Research foundation.** The design is evidence-informed. `RESEARCH_FOUNDATION.md` in the repository maps each capability to learning-science references: adaptive instruction [12, 2], dual coding [9, 5], self-regulated learning [14], formative assessment [3, 10], intelligent tutoring [11, 12], and learner modelling [4, 11].

**Scope of current claims.** This is a system and architecture paper. Current claims are: (a) the platform implements all described components to the level of a working proof of concept; (b) each component is grounded in established learning-science evidence; (c) the ALP architecture addresses a gap that no widely adopted technology currently fills; and (d) the economic cost structure has been empirically observed in practice and validated against current provider pricing.

**Planned evaluation design.** A structured evaluation plan is documented in the repository (`docs/PILOT_PLAN.md`) and will guide pilot and subsequent studies. Research questions include: **RQ1** — Does Sudar+ALP improve learning outcomes (assessment scores, time-to-mastery) relative to a standard LMS? **RQ2** — Does longitudinal tutor memory reduce repeated errors and dropout rates, in line with RL-based ITS findings? **RQ3** — What is the cost per unit of learning gain relative to incumbent platforms? Designs under consideration: A/B or cluster-randomised trials at the course level (LMS vs LMS+ALP); within-subject comparison of stateless vs memory-enabled tutor on different modules. Metrics: learning (quiz/exam scores, time-to-completion), behavioural (time-on-task, help-seeking, streaks, dropout), and economic (cost per learner per month, cost per mastered outcome). Analysis plans include mixed-effects or ANCOVA to control for instructor and course effects, and examination of heterogeneity (e.g. by prior knowledge or region).

**Pilot study.** A pilot evaluation will be conducted in partnership with an organisational partner to assess adoption, engagement, and early learning outcomes. The pilot plan (target partners, success criteria, data collection, and anonymisation) is documented in the repository; results will be reported in a subsequent paper when available.

**Future controlled studies.** Plans include randomised or quasi-experimental comparisons of Sudar versus a standard LMS on learning outcomes, learner satisfaction, and time-to-competency, as well as studies isolating the contribution of the longitudinal tutor memory component. We will also report **cost per unit of learning gain** (e.g. cost per point improvement on assessments or per unit reduction in time-to-competency) comparing Sudar+ALP to commercial LMS+AI stacks, so that the economic argument is tied to outcome rather than infrastructure alone.

---

## 6. Discussion

**Privacy and governance.** Sudar is designed for organisational and institutional deployment. Data are scoped by **tenant** (organisation): learner profiles, events, and AI interactions are stored per organisation with no cross-tenant access. **Retention** is configurable at deployment; the reference implementation does not impose automatic deletion, so deployers must set policies (e.g. event logs 12 months, AI transcripts 24 months) in line with local regulation. Learners can **view** their Digital Learner Twin via the "Your context" panel and **correct** preferences (voice, response style, modality affinity) in the learner settings page; correction of inferred signals (e.g. struggle flags) is planned as future work. **Opt-out** of AI tutor memory is supported: disabling memory prevents new context from being written to the Twin and limits the tutor to session-only context. For **FERPA** (US) and **GDPR** (EU/UK), the platform stores learner data under the control of the deploying institution; no data is sent to third-party AI providers beyond the content and messages necessary for inference (Together AI, OpenAI, or Anthropic per configuration), and deployers must ensure DPAs and lawful basis as required. **Edge-TTS** uses Microsoft's Azure Neural Voice infrastructure; its licensing terms require production deployments with paying customers to use the official Azure AI Speech API or an equivalent licensed TTS service — see Section 6 Limitations.

**Limitations:**

- Production ALP plugin connectors for Moodle, Canvas, and Blackboard are not yet built. The architecture is specified and the API surface is defined; the LMS-specific adapter layer requires additional engineering and LMS-specific testing. **Generalisation across LMSs** (Moodle vs Canvas vs Blackboard) is untested; event schemas and auth flows may differ and will require validation per platform.
- Controlled efficacy data are not yet available. Claims about learning gains remain grounded in the underlying learning-science evidence rather than Sudar-specific trials.
- **Model validity:** The Digital Learner Twin relies on inferred signals (quiz performance, time-on-task, tutor exchange content) that may not fully capture a learner's actual knowledge state — a challenge common to all learner-modelling systems [11, 4]. We do not use formal psychometric models (e.g. IRT, BKT) for knowledge estimation; the Twin is a proxy model for personalisation, not a certified assessment of mastery.
- **Bias and equity:** Systematic evaluation of fairness across demographics, prior attainment, and language is planned as future work; current deployment should be monitored for differential outcomes.
- The observed infrastructure cost of $0.20/week is based on usage by a single operator at development scale. Production deployments with concurrent learners, real-time TTS, and high-frequency event writes will have different cost profiles; the cost analysis in Section 4.5 provides validated per-token scaling models for these scenarios.
- Edge-TTS, the current default TTS implementation, accesses Microsoft's Azure Neural Voice infrastructure without a formal commercial licence. Production deployments with paying customers should provision Azure AI Speech (official API; $15/1M characters) or an equivalent licensed TTS service. The platform is designed to swap TTS providers via environment configuration.
- The predictive intelligence capabilities described in Section 3.8 require longitudinal event data to train effectively. Early deployments will rely on the current rule-based proactive nudge system until sufficient behavioural data accumulates.

**Future work:**

- Building LMS-specific connectors for ALP (Moodle, Canvas, Blackboard)
- Completing remaining modalities: SudarPlay (gamified), SudarFeed (social feed)
- Developing the predictive intervention layer with RL-based policy learning
- Running controlled efficacy studies with organisational and institutional partners
- Releasing SudarCoach, SudarAssess, and SudarCompliance as first-party Intelligence plugins
- Building the community plugin ecosystem and developer documentation
- Supporting enterprise features (SSO, HRIS integration) for organisational deployments
- Offline-first deployment variant using locally hosted open-weight models for connectivity-constrained environments

---

## 7. Conclusion

We presented Sudar, an AI-native learning platform with three contributions: (1) a reference platform combining authoring, delivery, and intelligence around a Digital Learner Twin, adaptive sequencing, a complete multimodal delivery stack, and an AI tutor with longitudinal cross-session memory; (2) the Adaptive Learning Layer (ALP), an architecture for deploying these capabilities as a plugin layer on top of existing LMSs — with the potential to reach the 509 million Moodle users and the hundreds of millions more on Canvas, Blackboard, and Sakai without requiring LMS replacement; and (3) a demonstrated economic model that reduces the infrastructure cost of AI-native personalised learning to less than $0.02 per learner per month, making it viable at the scale of national education systems and accessible in contexts where $12–$20/user/month platforms are structurally excluded.

The inference cost collapse is the macro condition that makes all of this possible. AI inference is becoming as cheap as bandwidth. Platforms built on open-weight models and open-source infrastructure are positioned to pass this economic gain directly to learners — particularly the learners in the 2.6 billion who are currently offline, the 251 million children currently out of school, and the vast majority of the global workforce who are trained on whatever the cheapest LMS their organisation could procure could provide.

Together, these contributions offer a path to making adaptive, memory-aware learning accessible both through a standalone platform and as an augmentation of the LMSs that organisations already rely on. The reference implementation is open source, grounded in a broad learning-science evidence base [12, 2, 9, 5, 14, 6, 4, 3, 10], and designed as a bedrock upon which the community can build modalities, intelligence plugins, and LMS connectors that the project alone could never sustain.

Learns with you. For you. For everyone.

---

## Acknowledgments

The system and research are the author's project. Development was assisted by AI coding tools (including Claude) for implementation, documentation, and refactoring; architectural and learning-science decisions remain human-led. The reference implementation is available at https://github.com/Dhanikesh-Karunanithi/Sudar with documentation (`ECOSYSTEM.md`, `RESEARCH_FOUNDATION.md`, `docs/sudar-memory.md`).

**Call for collaboration.** Institutions, organisations, and open-source contributors are invited to collaborate on pilots, plugin integrations, and community extensions. Contact: connect@dhanikeshkarunanithi.com or https://github.com/Dhanikesh-Karunanithi/Sudar.

**Statements for Claude for OSS application (if applicable).** (1) **Project value:** Sudar delivers an AI-native learning platform with a persistent Digital Learner Twin, adaptive sequencing, and an AI tutor with cross-session memory, at infrastructure cost under $0.02 per learner per month — enabling enterprises and institutions to deploy personalised learning without vendor lock-in. (2) **Enterprises:** The Adaptive Learning Layer (ALP) allows existing LMSs (Moodle, Canvas, Blackboard) to gain Sudar’s intelligence via a plugin layer, reaching hundreds of millions of learners without replacing incumbent systems. (3) **OSS impact:** The reference implementation is MIT-licensed and documented for reproducibility; it establishes a public baseline for cost, privacy, and evidence-based design that the EdTech and OSS community can extend and compare against.

---

## Appendix A: Schema Summary

Key tables for reproducibility:

- `learner_profiles` — Digital Learner Twin: `ai_tutor_context`, `next_best_action`, modality affinity scores, behavioural signals, `preferences` (JSONB)
- `learning_events` — `event_type`, `payload`, `modality`, `duration`
- `ai_interactions` — `user_message`, `ai_response`, `context_used`
- `enrollments` — path/course, progress, `due_date`
- `certifications`

Full schema: `ECOSYSTEM.md` in the repository.

---

## Appendix B: Infrastructure Cost Reference

| Stack | Per-learner cost/month (50 sessions) | Annual (1,000 learners) |
|---|---|---|
| Together AI Llama 3.1 8B + Edge-TTS | $0.021 | $252 |
| Together AI Llama 3.3 70B + Edge-TTS | $0.105 | $1,260 |
| GPT-4o + OpenAI TTS-1 | $3.41 | $40,860 |
| Claude 3.5 Sonnet + Azure TTS | $3.74 | $44,820 |
| Docebo (platform licence, low end) | $5.83 | $69,960 |
| Sana Labs (estimated, 300-user min) | ~$15.00 | ~$180,000 |

*AI infrastructure only; does not include hosting (Supabase free tier: $0; Pro: $25/month).*

---

## References

1. Muhammad Adnan and Saman Rizvi. Why do we need personalised learning in the age of AI? A critical review. *Education and Information Technologies*, 28(11):14891–14920, 2023.
2. Vincent Aleven, Elizabeth A. McLaughlin, R. Amos Glenn, and Kenneth R. Koedinger. Instruction based on adaptive learning technologies. In *Handbook of Research on Learning and Instruction*, pages 522–560. Routledge, 2nd edition, 2016.
3. Paul Black and Dylan Wiliam. Assessment and classroom learning. *Assessment in Education: Principles, Policy & Practice*, 5(1):7–74, 1998.
4. Susan Bull and Judy Kay. SMILI: A framework for interfaces to learning data in open learner models, learning analytics and related fields. *International Journal of Artificial Intelligence in Education*, 26(1):293–331, 2016.
5. Ruth Colvin Clark and Richard E. Mayer. *E-Learning and the Science of Instruction*. Wiley, Hoboken, NJ, 4th edition, 2016.
6. Robert M. Gagné. *The Conditions of Learning and Theory of Instruction*. Holt, Rinehart and Winston, New York, 4th edition, 1985.
7. Dhanikesh Karunanithi and Sudar Contributors. Sudar: An AI-native adaptive learning platform. https://github.com/dhanikeshkarunanithi/Sudar, 2026. MIT Licence.
8. LearnLM Team, Google. Towards an AI-augmented textbook, 2025. arXiv preprint arXiv:2509.13348.
9. Richard E. Mayer. *Multimedia Learning*. Cambridge University Press, New York, 2nd edition, 2009.
10. Henry L. Roediger and Jeffrey D. Karpicke. Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science*, 17(3):249–255, 2006.
11. John A. Self. Bypassing the intractable problem of student modelling. In *Proceedings of ITS 1988*, pages 18–24, 1988.
12. Kurt VanLehn. The relative effectiveness of human tutoring, intelligent tutoring systems, and other tutoring systems. *Educational Psychologist*, 46(4):197–221, 2011.
13. Olaf Zawacki-Richter, Victoria I. Marín, Melissa Bond, and Franziska Gouverneur. Systematic review of research on artificial intelligence applications in higher education — where are the educators? *International Journal of Educational Technology in Higher Education*, 16(1):39, 2019.
14. Barry J. Zimmerman. Becoming a self-regulated learner: An overview. *Theory Into Practice*, 41(2):64–70, 2002.
15. a16z. LLMflation: The rapid deflation of LLM inference costs. Andreessen Horowitz, 2025.
16. ITU. Facts and figures 2024: Internet use. International Telecommunication Union, 2024.
17. UNESCO. Global education monitoring report 2024. United Nations Educational, Scientific and Cultural Organization, 2024.
18. Statista. Average training expenditure per employee in the United States. Statista Research, 2023.
19. Moodle HQ. Moodle statistics. https://stats.moodle.org, 2025.
20. AgentTutor authors. AgentTutor: Empowering personalized learning with multi-turn interactive teaching in intelligent education systems. arXiv preprint arXiv:2601.04219, 2026.
21. Reinforced-LLM Tutor authors. Self-evolving generative AI tutors: Reinforcement learning-augmented ITS for personalized, proactive, and context-aware student engagement. ResearchSquare, 2025. https://doi.org/10.21203/rs.3.rs-6107039/v1.
22. Wan-Video. Wan2.1: Open-source video generation foundation model. https://github.com/wan-video/wan2.1, 2025.
23. Tencent Hunyuan. HunyuanVideo: Open-source video generation model. https://github.com/Tencent-Hunyuan/HunyuanVideo, 2025.
24. Higgsfield AI. Platform overview and model documentation. https://docs.higgsfield.ai, 2026.
25. Moodle Developer Resources. AI subsystem. https://moodledev.io/docs/5.1/apis/subsystems/ai, 2025.
