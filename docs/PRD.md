# ByteOS — Product Requirements Document (PRD)
**Version**: 1.0 | **Date**: February 2026 | **Status**: Active
**Owner**: Dhani (Project Lead)
**Tagline**: *Learns with you, for you.*

---

## 1. Executive Summary

ByteOS is an AI-native Learning Operating System that democratizes high-quality, personalized
education for organizations worldwide. It replaces the fragmented ecosystem of expensive authoring
tools (Rise360, Articulate Storyline, Adobe Captivate) and legacy LMS platforms (Moodle, Cornerstone)
with a single, intelligent platform that:

1. **Enables any admin** to build world-class training content with AI — no instructional design,
   video production, or graphic design skills required.
2. **Delivers learning** to every learner in the modality that works best for *them* — text, video,
   audio, games, mindmaps, flashcards, or TikTok-style micro-content.
3. **Learns the learner** over time through a Digital Learner Twin, continuously adapting
   difficulty, pacing, and content recommendations.
4. **Gives every learner** a personal AI tutor named "Sudar" — reactive, proactive, and longitudinal.

---

## 2. Problem Statement

### 2.1 The Admin / L&D Team Problem

Creating professional eLearning content today requires:
- **Instructional designers** ($60,000–$100,000/year salary)
- **Authoring tool subscriptions**: Rise360 ($1,299/year), Articulate 360 ($1,299/year),
  Adobe Captivate ($1,080/year)
- **LMS subscriptions**: Cornerstone ($5–$25/user/year), Docebo ($25,000+/year),
  TalentLMS ($4–$6/user/month)
- **Video production**: $500–$5,000 per video
- **Weeks or months** to produce a single quality course

**Result**: Only well-resourced organizations can afford professional learning programs.
SMEs, startups, schools, and NGOs are left behind.

### 2.2 The Learner Problem

Even when training exists, it fails learners because:
- **One-size-fits-all**: Everyone gets the same content in the same format regardless of how
  they learn best
- **No adaptation**: Content doesn't adjust if a learner is struggling or breezing through
- **No AI help**: Learners get stuck with no one to ask — the content just sits there
- **Wrong modality**: A visual learner forced to read walls of text. An auditory learner
  sitting through silent click-through courses.
- **No continuity**: Each course is isolated — the system has no memory of who the learner is

### 2.3 The Market Gap

No single platform currently offers:
- AI-powered content creation + adaptive delivery + personalized AI tutoring
- Multi-modality content (text, video, audio, games, mindmaps) from a single source
- A Digital Learner Twin that personalizes across ALL interactions
- Accessible pricing that democratizes enterprise-grade learning

---

## 3. Goals & Success Metrics

### 3.1 Product Goals
| Goal | Metric | Target (12 months) |
|---|---|---|
| Democratize content creation | Time to create a complete course | < 15 minutes vs. 40+ hours in traditional tools |
| Improve learner completion | Course completion rate | > 75% (industry avg: 15–30%) |
| Personalization effectiveness | Learner satisfaction score | > 4.5 / 5.0 |
| AI tutor adoption | % learners who use Sudar per session | > 60% |
| Modality engagement | Avg modalities used per course | > 2 |
| Platform growth | Monthly active learners | 1,000 in month 6, 10,000 in month 12 |

### 3.2 Business Goals
- Launch free tier and paid tiers within 6 months
- Achieve 10 paying organizations within 12 months
- Maintain < $0.50 per active learner AI cost through model optimization

---

## 4. Target Users

### Primary Users

#### 4.1 L&D Manager / Training Administrator
- Works at a company with 50–5,000 employees
- Currently using Rise360, Articulate, or a basic LMS
- Frustrated by: slow content creation, poor completion rates, no personalization
- Needs: fast course creation, compliance tracking, analytics, easy learner management
- Pain point: Cannot afford a full instructional design team

#### 4.2 Corporate Learner
- Employee taking mandatory or voluntary training
- Often completing courses on mobile during commute or breaks
- Frustrated by: boring click-through courses, no help when stuck, irrelevant content
- Needs: engaging content, AI help on demand, flexibility in format
- Pain point: Forced to sit through content that doesn't match their learning style

### Secondary Users

#### 4.3 Content Creator / Subject Matter Expert (SME)
- Knows the content deeply but has no design/tech skills
- Needs to turn their expertise into a professional course
- Uses: AI course builder in Studio to scaffold content from their documents

#### 4.4 Department Manager / Team Lead
- Needs to assign training to their team and track compliance
- Uses: Learning path builder, analytics dashboard, compliance reports

---

## 5. Product Overview

### 5.1 ByteOS Studio (Admin Surface)

The authoring and management platform for L&D teams and content creators.

**Core Flows**:
1. **AI Course Builder**: Upload any source (PDF, DOCX, URL, text prompt) → AI generates a
   complete, structured course with sections, quizzes, and media → Admin reviews and edits
   → Publishes to ByteOS Learn
2. **Slide Mode**: Create presentation-style course slides with AI-generated content and images
3. **Learning Path Builder**: Sequence multiple courses into learning journeys and assign to teams
4. **Analytics Dashboard**: View completion rates, skill gaps, engagement by modality,
   drop-off analysis, compliance status
5. **Organisation Settings**: White-label config, member management, HRIS sync hooks, branding

### 5.2 ByteOS Learn (Learner Surface)

The personalized learning experience for every learner.

**Core Flows**:
1. **Learner Onboarding**: Profile creation, learning style assessment, goal setting
2. **Personalized Dashboard**: AI-curated "what's next" based on Digital Learner Twin
3. **Course Experience**: Multi-modality content consumption with Sudar (AI tutor) always available
4. **Modality Switching**: Learner or AI switches between Text / Video / Audio / MindMap /
   Flashcards / ByteFeed / BytePlay at any point
5. **AI Tutor "Sudar"**: Reactive Q&A, proactive nudges, longitudinal memory across all sessions
6. **Progress & Achievements**: Skill graph, streak tracking, certifications

### 5.3 ByteOS Intelligence (AI Engine)

The backend AI layer that powers all adaptation and generation.

**Core Services**:
1. **Adaptive Engine**: Computes next best action, modality recommendations, difficulty adjustments
2. **AI Tutor Service**: RAG-powered Q&A with learner context and longitudinal memory
3. **Content Generation**: Multi-format course content from any input
4. **Modality Dispatcher**: Generates video, audio, game, and mindmap variants of content
5. **Learner Profile Scorer**: Updates Digital Learner Twin after every session

---

## 6. Functional Requirements

### 6.1 ByteOS Studio

#### Course Creation
- FR-ST-001: System SHALL accept PDF, DOCX, TXT, URL, and plain text as course source inputs
- FR-ST-002: System SHALL generate a complete course structure (title, modules, sections, quizzes)
  within 60 seconds of source input submission
- FR-ST-003: System SHALL provide a visual editor with 14 pre-designed templates
- FR-ST-004: System SHALL support inline media search from 5+ sources (Google, Pexels, Unsplash,
  Giphy, DuckDuckGo)
- FR-ST-005: System SHALL validate generated content for accuracy via web search fact-checking
- FR-ST-006: System SHALL moderate all AI-generated content for safety before displaying
- FR-ST-007: Admin SHALL be able to manually edit any generated content block
- FR-ST-008: System SHALL support SCORM 1.2 export for external LMS compatibility
- FR-ST-009: System SHALL auto-generate quizzes with configurable question count and difficulty

#### Slide Mode
- FR-ST-010: Admin SHALL be able to create presentation-style slides as an alternative to
  the standard course view
- FR-ST-011: System SHALL generate slide content from the same source input pipeline

#### Learning Path Builder
- FR-ST-012: Admin SHALL be able to sequence multiple courses into an ordered learning path
- FR-ST-013: Admin SHALL be able to assign learning paths to individual users, teams, or the
  entire organization
- FR-ST-014: System SHALL support prerequisite rules (must complete Course A before Course B)
- FR-ST-015: Admin SHALL be able to set due dates on learning path enrollments

#### Analytics
- FR-ST-016: Admin SHALL see course completion rates by course, team, and date range
- FR-ST-017: Admin SHALL see skill gap analysis across their organization
- FR-ST-018: Admin SHALL see module-level drop-off analysis (where learners abandon courses)
- FR-ST-019: Admin SHALL see engagement breakdown by modality (which formats are most used)
- FR-ST-020: System SHALL export analytics reports as CSV

#### Compliance
- FR-ST-021: Admin SHALL be able to mark courses as mandatory with due dates
- FR-ST-022: System SHALL send automated reminders to overdue learners
- FR-ST-023: Admin SHALL see a compliance dashboard showing compliant/overdue/at-risk learners
- FR-ST-024: System SHALL issue digital certificates on learning path completion

#### Organization Management
- FR-ST-025: Admin SHALL be able to invite members via email
- FR-ST-026: System SHALL support roles: Super Admin, Admin, Manager, Creator, Learner
- FR-ST-027: Admin SHALL be able to configure organization branding (logo, colors)
- FR-ST-028: System SHALL support multiple organizations (multi-tenancy) with data isolation

### 6.2 ByteOS Learn

#### Onboarding
- FR-LN-001: New learner SHALL complete a 5-question onboarding assessment capturing:
  learning pace preference, preferred modality, primary goal, difficulty comfort
- FR-LN-002: System SHALL create a learner profile record in Supabase on onboarding completion
- FR-LN-003: System SHALL suggest an initial learning path based on onboarding responses

#### Dashboard
- FR-LN-004: Learner SHALL see their enrolled courses with progress indicators
- FR-LN-005: System SHALL show a "Continue Learning" card for the most recently active course
- FR-LN-006: System SHALL show a "Sudar recommends..." section with next best action
- FR-LN-007: Learner SHALL see their current skill levels on relevant skill domains
- FR-LN-008: System SHALL show learning streak (consecutive days of learning activity)

#### Course Experience
- FR-LN-009: Learner SHALL be able to navigate course modules in order or freely (if unlocked)
- FR-LN-010: System SHALL display content in the learner's preferred modality by default
- FR-LN-011: Learner SHALL be able to switch modality at any point during a course
- FR-LN-012: System SHALL track time-on-task per module and per modality
- FR-LN-013: System SHALL auto-save progress so learners can resume from exactly where they left off
- FR-LN-014: Quizzes SHALL provide immediate feedback with explanations for wrong answers

#### Modalities
- FR-LN-015: TEXT modality: Standard reading view with structured content blocks
- FR-LN-016: VIDEO modality: Auto-generated video with narration from course content
- FR-LN-017: AUDIO modality: Podcast-style audio with text transcript available
- FR-LN-018: MINDMAP modality: Interactive visual mindmap of the course topic
- FR-LN-019: FLASHCARDS modality: Spaced-repetition flashcard set from course key points
- FR-LN-020: BYTEFEED modality: TikTok-style vertical swipe format for mobile micro-learning
- FR-LN-021: BYTEPLAY modality: AI-generated game from learning objectives

#### AI Tutor "Sudar"
- FR-LN-022: Sudar SHALL be accessible via a sidebar on every module page
- FR-LN-023: Sudar SHALL answer questions about the current module content using RAG
- FR-LN-024: Sudar SHALL proactively offer help after 90 seconds of inactivity on a module
- FR-LN-025: Sudar SHALL proactively offer an alternative explanation if a quiz is failed twice
- FR-LN-026: Sudar SHALL remember previous interactions across sessions (longitudinal memory)
- FR-LN-027: Learner SHALL be able to rate Sudar's responses (helpful / not helpful)
- FR-LN-028: Sudar responses SHALL be under 150 words unless learner requests more detail

#### Progress & Achievements
- FR-LN-029: Learner SHALL see their overall completion percentage per course and path
- FR-LN-030: System SHALL issue a shareable certificate on learning path completion
- FR-LN-031: System SHALL maintain and display a learning streak counter
- FR-LN-032: Learner SHALL see their skill progress over time on their profile page

### 6.3 ByteOS Intelligence

- FR-AI-001: Adaptive engine SHALL update `learner_profiles.modality_scores` after each session
  based on engagement data from `learning_events`
- FR-AI-002: System SHALL recompute `next_best_action` after each session completion
- FR-AI-003: AI Tutor context SHALL include the last 10 `ai_interactions` for the learner
  (longitudinal memory window)
- FR-AI-004: System SHALL fall back to secondary AI provider within 5 seconds if primary fails
- FR-AI-005: Content generation SHALL complete within 60 seconds for a standard 5-module course

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Core pages load in < 2 seconds on a 4G connection |
| Performance | AI tutor response in < 5 seconds |
| Performance | Video generation in < 5 minutes for a 5-minute video |
| Scalability | Architecture supports 10,000 concurrent learners without re-architecture |
| Availability | 99.9% uptime for Studio and Learn surfaces |
| Security | All data encrypted at rest (Supabase default) and in transit (TLS) |
| Security | No AI API keys exposed to the browser |
| Security | Row Level Security on all Supabase tables |
| Privacy | Learner behavioral data used only for personalization, never sold |
| Accessibility | WCAG 2.1 AA compliance on all learner-facing UI |
| Mobile | Learner surface fully functional on iOS Safari and Chrome Mobile |
| Internationalisation | System architecture supports multiple languages (Phase 5+) |

---

## 8. Out of Scope (v1.0)

The following are explicitly out of scope for the initial build:
- Live instructor-led training (ILT) scheduling and virtual classroom
- Social learning features (discussion boards, peer review)
- External content marketplace
- HRIS deep integrations (Workday, BambooHR) — hooks only in v1
- Custom AI model fine-tuning UI (backend pipeline exists, no admin UI yet)
- iOS/Android native apps (PWA-capable responsive web first)
- Multi-language content generation (English only in v1)
- xAPI / Tin Can API (SCORM 1.2 only in v1)

---

## 9. Dependencies & Integrations

| Dependency | Type | Purpose | Fallback |
|---|---|---|---|
| Supabase | Infrastructure | Database, Auth, Storage | None — core dependency |
| Together AI | API | Primary LLM + embeddings | OpenAI |
| OpenAI | API | Secondary LLM | Anthropic |
| Anthropic | API | Tertiary LLM | Graceful error |
| Google Search API | API | Media search + fact-checking | DuckDuckGo |
| Pexels API | API | Stock images + video loops | Unsplash |
| Edge-TTS | Library | Text-to-speech for audio/video | OpenAI TTS |
| FFmpeg | Binary | Video assembly | — |
| Remotion | Library | Programmatic video rendering | bytetexttovid |
| Phaser.js | Library | Game engine for BytePlay | — |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI provider outage | Medium | High | Multi-provider fallback chain |
| High AI costs | High | Medium | Rate limiting, caching, model tiering |
| Video generation too slow | Medium | High | Async generation, progress indicator |
| Low learner engagement | Medium | High | ByteFeed + BytePlay modalities drive engagement |
| Complex onboarding | Medium | Medium | 5-step max onboarding, skip option available |
| Solo builder bandwidth | High | High | Phase-based build — ship Phase 1 first |

---

## 11. Release Plan

| Phase | Focus | Target |
|---|---|---|
| Phase 1 | Foundation: Supabase schema, auth, project scaffold | Week 3 |
| Phase 2 | Integration: Studio → Supabase → Learn flow | Week 6 |
| Phase 3 | Learner experience: Dashboard, modalities, AI tutor | Week 10 |
| Phase 4 | Intelligence: Adaptive engine, longitudinal Sudar | Week 16 |
| Phase 5 | Scale: All modalities, compliance, white-label | Week 20+ |
| v1.0 Launch | Public launch with free + paid tiers | Month 6 |

---

*ByteOS PRD v1.0 | February 2026 | "Learns with you, for you."*
