# ByteOS — User Flows & Learner Lifecycle
**Version**: 1.0 | **February 2026**

---

## Overview

This document defines every critical user flow within ByteOS across both surfaces (Studio + Learn),
plus the end-to-end learner lifecycle from signup to mastery. These flows are the source of truth
for UX design, frontend routing, and API design.

---

## SECTION 1: Admin / Creator Flows (ByteOS Studio)

---

### Flow A1: Admin Onboarding & Organization Setup

```
[Landing Page] 
    → Click "Start for Free"
    → [Sign Up Page] — email + password OR Google/GitHub OAuth
    → [Email Verification] (if email signup)
    → [Onboarding Step 1: "What's your name?"]
    → [Onboarding Step 2: "What's your organization's name?"]
    → [Onboarding Step 3: "How many learners do you plan to train?"] (1–10 / 11–100 / 100+)
    → [Onboarding Step 4: "What's your primary use case?"] 
       (Employee onboarding / Compliance / Product training / Skills development / Other)
    → [Onboarding Step 5: "Invite your first team member?"] (optional skip)
    → [Studio Dashboard — Welcome State]
       ↳ "Create your first course" CTA prominent
       ↳ Quick tour available
```

**Supabase writes**: `profiles`, `organisations`, `org_members`
**Redirect on completion**: `/studio/dashboard`

---

### Flow A2: AI Course Creation (Core Admin Flow)

```
[Studio Dashboard]
    → Click "Create New Course" button
    → [Course Builder — Step 1: Choose Source]
       Options:
       ├── Upload file (PDF / DOCX / TXT / MD)
       ├── Paste URL
       ├── Paste text
       └── Start from scratch (text prompt)
    → [Source Upload / Input]
    → [Course Builder — Step 2: Configure]
       ├── Course title (auto-suggested, editable)
       ├── Target audience (dropdown + custom)
       ├── Difficulty level (Beginner / Intermediate / Advanced)
       ├── Number of modules (3 / 5 / 7 / 10 / custom)
       ├── Include quiz? (Yes / No / per module)
       └── AI provider (Together AI / OpenAI / Anthropic — auto if not specified)
    → Click "Generate Course"
    → [Generating... screen]
       ├── Animated progress indicator
       ├── Real-time generation log (optional toggle)
       └── Estimated time: ~30–60 seconds
    → [Course Editor — Generated Draft]
       ├── Left panel: Module/Stage navigation
       ├── Center: Content blocks (editable inline)
       ├── Right panel: Media search + Preview toggle
       └── Top bar: Template selector, Export, Publish
    → [Admin edits content as needed]
    → [Preview Mode] — see course as learner would see it
    → [Publish Options]
       ├── Publish to Learn (available to enrolled learners)
       ├── Export as SCORM (downloads .zip)
       ├── Export as HTML bundle
       └── Save as draft
    → Publish confirmation
    → [Course Detail Page] with shareable enrollment link
```

**Supabase writes**: `courses`, `modules`, `content_assets`
**Triggers**: Intelligence layer content validation, moderation check

---

### Flow A3: Learning Path Creation

```
[Studio Dashboard → Paths tab]
    → Click "Create Learning Path"
    → [Path Builder]
       ├── Path name + description
       ├── Add courses (search + drag from course library)
       ├── Set order (drag to reorder)
       ├── Set prerequisites (toggle per course)
       ├── Configure certification (yes/no, template, validity)
       └── Set path visibility (all learners / specific teams)
    → [Assign Path]
       ├── Search for learners or teams
       ├── Set due date (optional)
       └── Click "Assign"
    → Enrolled learners receive notification in ByteOS Learn
```

**Supabase writes**: `learning_paths`, `enrollments`

---

### Flow A4: Compliance Management

```
[Studio Dashboard → Compliance tab]
    → View compliance dashboard:
       ├── Compliance rate % (overall)
       ├── List of mandatory courses with stats
       └── At-risk / Overdue learner list
    → Click a mandatory course → see individual learner status
    → Click "Send Reminders" → select overdue learners → send
    → Click "View Certificates" → see all issued certificates
    → Export compliance report (CSV)
```

---

### Flow A5: Analytics Review

```
[Studio Dashboard → Analytics tab]
    ├── Overview: completion rate, avg time, engagement score
    ├── Per-course drill-down: module-level completion + drop-off
    ├── Skill gap heatmap: org-wide skill gaps by domain
    ├── Modality usage: which formats are most used
    ├── Team filter: see stats by department
    └── Export: download any view as CSV
```

---

## SECTION 2: Learner Flows (ByteOS Learn)

---

### Flow L1: Learner Onboarding (First-Time Experience)

```
[ByteOS Learn — First Visit or Invite Link]
    → [Sign Up / Login]
       ├── Email + password
       ├── Google OAuth
       └── If invited by org: click invite link → auto-join org
    → [Welcome to ByteOS Learn screen]
       "Let's help Sudar learn how you learn best."
    → [Onboarding Assessment — 5 Questions]
       Q1: "How do you usually learn best?"
           Options: Reading articles / Watching videos / Listening while on the go /
                    Doing hands-on activities / All of the above
       Q2: "How much time can you usually dedicate to learning at once?"
           Options: 5–10 minutes (micro) / 15–30 minutes / 1+ hour
       Q3: "What level are you usually starting from?"
           Options: Complete beginner / Some knowledge / I know the basics well
       Q4: "What's your main learning goal right now?"
           Options: [populated from org's configured goals OR] 
                    Get certified / Develop a new skill / Keep up with my role / Explore
       Q5: "Where do you usually learn?"
           Options: At my desk / On my phone / On the go / A mix
    → [Learner Profile Created]
       "Sudar knows how to help you now."
       Summary card showing personalized settings
    → [Learn Dashboard — Personalized State]
       ├── Your learning paths (enrolled by admin OR self-selected)
       ├── "Sudar recommends you start with..." card
       └── "Continue Learning" (if returning user)
```

**Supabase writes**: `profiles`, `learner_profiles`
**Intelligence call**: `POST /api/learner/profile` — initializes Digital Learner Twin

---

### Flow L2: Learner Dashboard (Returning User)

```
[ByteOS Learn — Dashboard]
    ├── Top row:
    │   ├── "Continue where you left off" — last active module with progress
    │   ├── Learning streak: X days 🔥
    │   └── Overdue alerts (if any)
    ├── "Sudar Recommends" card:
    │   ├── Next course in current path
    │   ├── Alternative modality suggestion ("You haven't tried the video version")
    │   └── Skill gap learning ("You scored low on X — try this module")
    ├── My Learning Paths: enrolled paths with % progress
    ├── My Skills: top 3 skills with progress bars
    └── Recent Achievements: last earned badge or certificate
```

---

### Flow L3: Starting a Course Module

```
[Learning Path Page or Course Page]
    → Click on a module
    → [Modality Selection Screen] (first time on this course)
       "How would you like to learn this?"
       ├── Text (Reading)    ← highlighted if learning profile prefers it
       ├── Video             ← badge: "Popular" if high engagement
       ├── Audio
       ├── MindMap
       ├── Flashcards
       ├── ByteFeed
       └── BytePlay
       "Sudar will suggest the best format based on how you learn."
       → Confirm / Let Sudar choose
    → [Module Loads in selected modality]
    → [Sudar sidebar visible but collapsed by default]
    → [Module completes OR learner exits]
    → Supabase writes: learning_events (module_start, modality)
```

---

### Flow L4: Module Experience with AI Tutor Sudar

```
[Module page — any modality]

LEARNER-INITIATED:
    → Learner clicks Sudar icon (bottom right)
    → [Sudar sidebar opens]
       ├── Header: "Hi [Name], how can I help?"
       ├── Quick prompt suggestions: 
       │   "Explain this differently" / "Give me an example" / "Quiz me on this"
       └── Text input field
    → Learner types question
    → Sudar responds (< 5 seconds, RAG against current module content)
    → Learner rates response: 👍 / 👎
    → Conversation continues or learner closes
    → Supabase writes: ai_interactions (type: question)

BYTE-INITIATED (Proactive):
    Trigger 1: 90 seconds of inactivity on a module
        → Sudar expands with soft animation
        → Message: "Looks like you've been on this part for a bit — 
                    want me to explain it differently?"
        → Options: "Yes please" / "I'm good, just rereading"
        → Supabase writes: ai_interactions (type: proactive_nudge)
    
    Trigger 2: Quiz failed twice on same question
        → Sudar appears: "That one's tricky. Let me try explaining it another way."
        → Sudar provides alternative explanation + asks if learner wants to try again
        → Supabase writes: ai_interactions (type: proactive_nudge)
    
    Trigger 3: Modality engagement low (scroll speed too fast, replays, drop-offs)
        → Sudar: "You might prefer the video version of this module —
                 learners like you often find it easier to follow."
        → Options: "Switch to video" / "I'll stay here"
        → Supabase writes: ai_interactions (type: proactive_nudge)
```

---

### Flow L5: Modality Switching Mid-Course

```
[Any module page]
    → Learner clicks modality icon in top bar
    → [Modality switcher appears]
       Shows all 7 modalities with icons
       Current modality highlighted
       "Video" or "Audio" shows "Generating..." if not yet available
    → Learner clicks a different modality
    → [Loading state] — if modality not yet generated:
       "Sudar is preparing your [Video/Audio/etc.] version... (~30 seconds)"
       Background: Intelligence layer generates content variant
    → [Content reloads in new modality]
       Progress is maintained at the same logical position
    → Supabase writes: learning_events (type: modality_switch, from, to)
    → Intelligence reads this event: updates learner's modality_scores
```

---

### Flow L6: Completing a Course & Earning a Certificate

```
[Last module of a course]
    → Complete final quiz
    → [Quiz results screen]
       ├── Score: X/X correct
       ├── Pass: "🎉 You passed! Course complete."
       └── Fail: "You got X/X. You need X to pass. Try again?" / "Ask Sudar for help?"
    → [Course completion screen]
       ├── Confetti animation
       ├── Certificate preview (if cert enabled)
       ├── "Share on LinkedIn" button
       ├── "Download Certificate" button
       └── "What's next? Sudar recommends..." → next module in path
    → Supabase writes: enrollments (status: completed), certifications (if applicable)
    → Intelligence: runs adaptive scoring update, recomputes next_best_action
```

---

## SECTION 3: The Full Learner Lifecycle

```
DAY 1 — Discovery & Signup
│
├── Learner arrives (invited by org OR organic signup)
├── Creates account → Onboarding assessment
├── Digital Learner Twin initialized (modality preference, pace, difficulty)
└── First learning path appears on dashboard

WEEK 1 — First Course Experience
│
├── Takes first module in preferred modality
├── Meets Sudar for the first time (proactive nudge likely in first session)
├── Completes first quiz (Sudar offers help if failed)
├── Finishes first course → first certificate earned
└── Streak begins: Day 1 🔥

WEEKS 2–4 — Pattern Establishment
│
├── ByteOS Learn starts learning the learner:
│   - Detects time-of-day patterns (Daniel learns at 7am in the car)
│   - Identifies modality affinity (Marcus loves video + game)
│   - Finds knowledge gaps (Amara struggles with data concepts)
├── Sudar becomes more personalized — references past interactions
├── Modality auto-selection gets smarter with each session
└── Dashboard starts showing "Your skill progress" with real data

MONTH 2 — Deepening Engagement
│
├── Learner is now 3–5 courses in
├── ByteMind mindmap shows connected knowledge graph
├── Sudar remembers: "Last time you asked about X — here's how it connects to today's topic"
├── Next Best Action gets highly accurate (based on 20+ sessions of data)
├── Skills graph shows measurable progress
└── Second certificate earned → shared on LinkedIn → new learners discover ByteOS

MONTH 3–6 — Mastery & Achievement
│
├── Learning path completed → full path certificate
├── Skill proficiency: visible jump in skill domains
├── Learner becomes an advocate → invites colleagues
├── Admin notices learner's completion rate + skill data → showcases in team meeting
└── Learner sets a new goal → new path begins

ONGOING — The Compounding Effect
│
├── Digital Learner Twin is rich with 6+ months of data
├── Every new course is immediately personalized from session 1
├── Sudar knows: preferred modality, optimal session length, time-of-day, knowledge gaps
├── Learner can't imagine using a platform that doesn't know them
└── Switching cost is the data — the longer you use ByteOS, the more personal it gets
```

---

## SECTION 4: Admin-to-Learner Content Flow

```
[STUDIO: Admin creates content]
    Content in Supabase: courses + modules tables
                ↓
[STUDIO: Admin assigns to learning path]
    Supabase: learning_paths + enrollments (status: not_started)
                ↓
[LEARN: Learner gets notification]
    "New course assigned: [Course Name] — Due: [Date]"
    Learner sees it on dashboard
                ↓
[LEARN: Learner takes the course]
    Supabase: learning_events written per interaction
                ↓
[INTELLIGENCE: Events processed]
    Adaptive engine updates learner_profiles.modality_scores
    Skill gap analysis updates learner_skills
    next_best_action recomputed
                ↓
[LEARN: Learner experience improves]
    Dashboard personalization increases
    Sudar gets smarter about this learner
                ↓
[STUDIO: Admin sees results]
    Analytics dashboard: completion rate, engagement, skill progress
    Compliance dashboard: who's done, who's overdue
```

---

## SECTION 5: Authentication Flow

```
[Protected Route Accessed without Auth]
    → Redirect to /login

[Login Page]
    ├── Email + password
    ├── Google OAuth button
    └── "Don't have an account? Sign up"

[Successful Login]
    → Check profiles.role
    ├── role = 'admin' | 'manager' | 'creator' → redirect to /studio/dashboard
    └── role = 'learner' → redirect to /learn/dashboard

[Forgot Password]
    → Email input
    → Supabase sends reset email
    → User clicks link → reset password form
    → Redirect to login

[Session Management]
    → Supabase handles JWT refresh automatically
    → Server components use supabaseServerClient()
    → Client components use supabaseClientClient()
```

---

## SECTION 6: Error States & Edge Cases

| Situation | User-Facing Behaviour |
|---|---|
| AI generation fails | "Sudar had trouble generating this. Try again?" + retry button |
| Video generation in progress | Loading animation with "Your video is being prepared..." |
| Network offline | Cached module available; Sudar in offline mode (limited responses) |
| Quiz failed 3 times | Sudar offers full alternative explanation; admin notified |
| Overdue compliance | Red badge on dashboard; automated email sent by Studio |
| Invalid invite link | "This invite link has expired. Contact your administrator." |
| Modality not available | "This format isn't ready yet. Sudar is preparing it — check back in 2 minutes." |
| AI tutor context too long | Sudar summarizes last 10 interactions automatically |
| Free tier limit reached | Friendly upgrade prompt: "You've reached your 10-learner limit. Upgrade to add more." |

---

*ByteOS User Flows v1.0 | February 2026 | "Learns with you, for you."*
