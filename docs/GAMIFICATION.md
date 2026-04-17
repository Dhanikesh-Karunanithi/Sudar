# Sudar Gamification System — Full Design Specification

> Version 1.0 | April 2026
> Covers: Sudar Learn (learner surface), Sudar Studio (admin/creator surface), Corporate tier

---

## 1. Narrative & Philosophy

### 1.1 The World: "The Sudar Academy"

Every learner is an **Explorer** enrolled in the Sudar Academy — a living, intelligent institution that adapts to them. The mascot Sudar acts as guide, mentor, and quest-giver. Learning is framed as **"unlocking the world"**: each module completed opens a new realm of knowledge, each question answered sharpens the Explorer's "mind map," and every streak day keeps the Academy's fire lit.

The core narrative promise: **"The more you teach the Academy about yourself, the more the Academy gives back."** This transforms every data-collection moment into a gift exchange, not surveillance. Learners feel seen, not tracked.

### 1.2 Design Principles

| Principle | Description |
|-----------|-------------|
| **Intrinsic over extrinsic** | Rewards should reinforce authentic curiosity, not replace it |
| **Mastery signals matter** | Every coin and XP event captures a real learning signal |
| **Data as dialogue** | Check-ins and profile questions are conversations, not forms |
| **Visible progress** | Learners should always know where they stand and what's next |
| **Social without shame** | Leaderboards show your rank; they never shame low performers |
| **Corporate KPIs feel human** | Work metrics are reframed as personal achievements, not surveillance |

### 1.3 Gamification Layers

```
Layer 6 — Corporate KPIs & Manager Visibility
Layer 5 — Data Acquisition Engine ("Know Yourself")
Layer 4 — Quests & Challenges (Daily, Weekly, Story, Org)
Layer 3 — Achievements & Badges (Narrative-driven milestones)
Layer 2 — XP & Scholar Rank (Permanent reputation)
Layer 1 — Sudar Coins (Spendable currency)
```

---

## 2. Layer 1 — Sudar Coins (SC)

Sudar Coins are the **spendable platform currency**. They are earned through learning actions and spent on platform superpowers — regenerations, themes, features, and cosmetics.

### 2.1 Earning Coins

| Trigger Event | Reward | Limit | Notes |
|--------------|--------|-------|-------|
| `onboarding_step_complete` | 15 SC | Once per step | Up to 5 steps = 75 SC max |
| `checkin_answered` | 10 SC | 3/day | Daily check-in micro-surveys |
| `profile_question_answered` | 10 SC | Once per question | Know-Yourself profile builder |
| `module_complete` | 25 SC | Unlimited | Per unique module |
| `course_complete` | 100 SC | Once per course | On enrollment status → completed |
| `streak_milestone_hit` (7d) | 50 SC | Once per streak cycle | |
| `streak_milestone_hit` (14d) | 100 SC | Once per streak cycle | |
| `streak_milestone_hit` (30d) | 250 SC | Once per streak cycle | |
| `streak_milestone_hit` (60d) | 500 SC | Once per streak cycle | |
| `streak_milestone_hit` (90d) | 1,000 SC | Once per streak cycle | |
| `ai_tutor_session` (≥3 turns) | 5 SC | 10/day | Qualifying conversation |
| `quiz_mastery` (100% first attempt) | 30 SC | Per quiz | |
| `modality_explorer_bonus` | 75 SC | Once per course | 3+ modalities used in one course |
| `course_reflection_submitted` | 20 SC | Once per course | Review/reflection submission |
| `peer_challenge_won` | 50 SC | Per challenge | |
| `org_kpi_milestone` | Variable | Admin-configured | Corporate tier |
| `creator_first_course_published` | 200 SC | Once (Studio) | Admin/creator reward |
| `creator_course_completions_10` | 100 SC | Per 10-completion threshold | Studio milestone |
| `level_up` | 25–200 SC | Per level | Scales with level reached |

### 2.2 Spending Coins (Reward Catalog)

**AI Power-ups**

| Item | Cost | Slug |
|------|------|------|
| AI regeneration pack (+5) | 50 SC | `ai_regen_5` |
| AI regeneration pack (+20) | 175 SC | `ai_regen_20` |
| Deep Dive mode (+extended sessions) | 250 SC | `deep_dive_mode` |

**Cosmetics**

| Item | Cost | Slug |
|------|------|------|
| Theme: Neon | 200 SC | `theme_neon` |
| Theme: Ocean | 200 SC | `theme_ocean` |
| Theme: Forest | 200 SC | `theme_forest` |
| Theme: Sunset | 200 SC | `theme_sunset` |
| Dashboard layout: Zen | 150 SC | `layout_zen` |
| Dashboard layout: Focus | 150 SC | `layout_focus` |
| Mascot skin: Cosmic Sudar | 300 SC | `mascot_cosmic` |
| Mascot skin: Scholar Sudar | 300 SC | `mascot_scholar` |
| Avatar frame: Gold | 150 SC | `frame_gold` |
| Avatar frame: Diamond | 400 SC | `frame_diamond` |

**Features**

| Item | Cost | Slug |
|------|------|------|
| Certificate premium design | 150 SC | `cert_premium` |
| Course fast-track (skip 1 prereq) | 500 SC | `fasttrack_prereq` |
| Sudar memory export (PDF) | 100 SC | `memory_export` |

---

## 3. Layer 2 — XP & Scholar Ranks

XP is **permanent reputation**. It is never spent. It represents the Explorer's accumulated learning history within the Academy.

### 3.1 XP Earning Table

| Action | XP Reward |
|--------|-----------|
| Module complete | 40 XP |
| Course complete | 200 XP |
| Quiz mastery (100%) | 60 XP |
| Quiz pass (≥70%) | 20 XP |
| Check-in answered | 10 XP |
| AI tutor session | 10 XP |
| Profile question answered | 15 XP |
| Achievement unlocked | achievement.xp_reward |
| Quest completed | quest.xp_reward |
| Streak milestone (7d) | 75 XP |
| Streak milestone (30d) | 400 XP |
| Streak milestone (90d) | 1,500 XP |

### 3.2 Scholar Rank Thresholds

| Level | Title | XP Required |
|-------|-------|-------------|
| 1 | Seeker | 0 |
| 2 | Apprentice | 500 |
| 3 | Scholar | 1,500 |
| 4 | Practitioner | 3,500 |
| 5 | Adept | 7,500 |
| 6 | Expert | 15,000 |
| 7 | Mentor | 30,000 |
| 8 | Sage | 55,000 |
| 9 | Architect | 90,000 |
| 10 | Luminary | 140,000 |
| 11 | Oracle | 200,000 |
| 12 | Grand Explorer | 300,000+ |

**Level-up rewards (coin bonus by level):**
Levels 2–4: 25 SC each | Levels 5–7: 50 SC each | Levels 8–10: 100 SC each | Levels 11–12: 200 SC each

---

## 4. Layer 3 — Achievements & Badges

Achievements are **narrative-driven milestones** with flavor text, icon references, and rarity tiers. Each badge has a slug, title, description, flavor text, and icon key.

### 4.1 Rarity Tiers

| Tier | Color | Criteria |
|------|-------|----------|
| Common | Grey | Basic milestones, easy to earn |
| Rare | Blue | Requires sustained effort |
| Epic | Purple | Significant mastery or exploration |
| Legendary | Gold | Exceptional, long-term commitment |

### 4.2 Achievement Catalog

**Learning Milestones**

| Slug | Title | Description | Flavor Text | Rarity | XP | SC |
|------|-------|-------------|-------------|--------|----|----|
| `first_light` | First Light | Complete your first module | The Academy recognizes a new Explorer. | Common | 50 | 0 |
| `the_long_road` | The Long Road | Complete your first full course | Knowledge is a journey, not a destination. | Rare | 150 | 50 |
| `completionist` | Completionist | Complete an entire Learning Path | You walked every step of the path. | Epic | 400 | 100 |
| `speed_learner` | Speed Learner | Finish a course in fewer than 2 sessions | Fast mind, focused intent. | Rare | 100 | 30 |
| `deep_diver` | Deep Diver | Spend 3+ hours in a single course | Some knowledge requires depth. | Rare | 150 | 40 |
| `century_club` | Century Club | Complete 100 modules total | One hundred steps toward mastery. | Epic | 500 | 150 |

**Mastery**

| Slug | Title | Description | Flavor Text | Rarity | XP | SC |
|------|-------|-------------|-------------|--------|----|----|
| `perfectionist` | Perfectionist | Achieve 100% on 3 quizzes (first attempt) | Precision is its own kind of art. | Rare | 200 | 60 |
| `no_wrong_turns` | No Wrong Turns | Complete a course with >90% average quiz score | Your compass never wavers. | Epic | 300 | 75 |
| `domain_expert` | Domain Expert | Close 5 skill gaps in one topic area | The Academy sees your expertise. | Epic | 350 | 100 |
| `flawless` | Flawless | 100% on every quiz in a course | Not a single gap remains. | Legendary | 600 | 200 |

**Engagement & Streaks**

| Slug | Title | Description | Flavor Text | Rarity | XP | SC |
|------|-------|-------------|-------------|--------|----|----|
| `creature_of_habit` | Creature of Habit | Maintain a 7-day streak | Seven suns, seven lessons. | Common | 75 | 0 |
| `unbreakable` | Unbreakable | Maintain a 30-day streak | The Academy cannot stop your momentum. | Rare | 300 | 0 |
| `always_on` | Always On | Maintain a 90-day streak | Three months of fire. Legendary. | Legendary | 1000 | 0 |
| `night_owl` | Night Owl | 10 learning sessions between 10pm–2am | The Academy never sleeps, and neither do you. | Rare | 100 | 0 |
| `early_bird` | Early Bird | 10 learning sessions before 7am | The early Explorer catches the concept. | Rare | 100 | 0 |

**Exploration (Modality)**

| Slug | Title | Description | Flavor Text | Rarity | XP | SC |
|------|-------|-------------|-------------|--------|----|----|
| `text_addict` | Text Addict | 10 hours in text modality | Words are your primary element. | Common | 75 | 0 |
| `cinephile` | Cinephile | 10 hours in video modality | You see to understand. | Common | 75 | 0 |
| `multisensory` | Multisensory | Use all 7 modalities at least once | The whole Academy is your classroom. | Epic | 300 | 75 |
| `modality_switcher` | Modality Switcher | Switch modalities mid-course 5× | You adapt your lens to the lesson. | Rare | 100 | 25 |
| `audio_explorer` | Audio Explorer | 5 hours in audio modality | The spoken word carries you forward. | Common | 50 | 0 |

**Social & Community**

| Slug | Title | Description | Flavor Text | Rarity | XP | SC |
|------|-------|-------------|-------------|--------|----|----|
| `team_player` | Team Player | Complete a group/org challenge | Strength in numbers, knowledge in community. | Common | 100 | 25 |
| `trailblazer` | Trailblazer | Be first in your org to complete a new course | You paved the path for others. | Epic | 300 | 75 |
| `leaderboard_top3` | Podium Finish | Reach top 3 on the org weekly leaderboard | The Academy applauds. | Rare | 150 | 50 |

**Data & Curiosity (Know-Yourself)**

| Slug | Title | Description | Flavor Text | Rarity | XP | SC |
|------|-------|-------------|-------------|--------|----|----|
| `self_aware` | Self-Aware | Answer 10 Know-Yourself check-in questions | You look inward to learn outward. | Common | 75 | 0 |
| `open_book` | Open Book | Complete the full learner profile questionnaire | The Academy knows you. | Rare | 200 | 50 |
| `reflective_learner` | Reflective Learner | Submit 5 course reflections | Growth requires looking back. | Rare | 150 | 40 |
| `curious_mind` | Curious Mind | Answer 50 total check-in questions | You never stop asking. | Epic | 400 | 100 |

**Creator (Studio)**

| Slug | Title | Description | Flavor Text | Rarity | XP | SC |
|------|-------|-------------|-------------|--------|----|----|
| `author` | Author | Publish your first course | Knowledge shared is knowledge multiplied. | Common | 150 | 0 |
| `prolific` | Prolific | Publish 5 courses | The Academy grows with every author. | Rare | 400 | 100 |
| `hit_maker` | Hit Maker | Have a course reach 50 completions | Your work resonates. | Epic | 600 | 150 |
| `five_star_creator` | 5-Star Creator | Achieve ≥4.5 average learner rating | Excellence recognized by those who learn. | Legendary | 800 | 200 |

---

## 5. Layer 4 — Quests & Challenges

### 5.1 Daily Quests (3 per day, auto-assigned)

Daily quests rotate from a pool. Each learner gets a personalized set of 3 based on their current course enrollment and learning pattern.

| Quest Template | Requirement | SC Reward | XP Reward |
|----------------|-------------|-----------|-----------|
| `daily_video_15` | Watch 15 mins of video content | 20 SC | 30 XP |
| `daily_tutor_ask` | Ask the AI tutor a question | 10 SC | 15 XP |
| `daily_module_complete` | Complete one module | 25 SC | 40 XP |
| `daily_checkin` | Answer today's check-in | 10 SC | 15 XP |
| `daily_new_modality` | Try a modality you haven't used today | 15 SC | 20 XP |
| `daily_read_30` | Read 30 mins of text content | 20 SC | 30 XP |

### 5.2 Weekly Quests

| Quest | Requirements | SC | XP | Badge |
|-------|-------------|----|----|-------|
| `weekly_streak` | 7-day streak | 100 SC | 150 XP | Creature of Habit |
| `weekly_3_modules` | Complete 3 modules across 2 courses | 75 SC | 100 XP | — |
| `weekly_new_modality` | Try a modality not used last week | 50 SC | 75 XP | — |
| `weekly_tutor_5x` | 5 AI tutor sessions in a week | 60 SC | 80 XP | — |
| `weekly_quiz_ace` | Score ≥90% on 2 quizzes | 80 SC | 120 XP | — |

### 5.3 Story Quests (Onboarding & Narrative Arcs)

**"The Awakening"** — Onboarding Arc (5 steps)
1. Complete your first module → 25 SC
2. Ask Sudar a question → 15 SC
3. Complete your first course → 50 SC
4. Spend your first coins → 10 SC
5. Unlock your first achievement → 20 SC
> Total: 120 SC + "First Light" badge on step 1 + "The Long Road" badge on step 3

**"The Knowledge Hunt"** — Exploration Arc (4 steps)
1. Try the video modality → 20 SC
2. Try the audio modality → 20 SC
3. Try the flashcard modality → 20 SC
4. Try one more new modality → 20 SC
> Total: 80 SC + "Multisensory" badge progress

**"The Scholar's Path"** — Mastery Arc (3 steps)
1. Score ≥90% on a quiz → 30 SC
2. Complete a course with ≥90% quiz average → 75 SC
3. Achieve quiz mastery 3× → 50 SC
> Total: 155 SC + "Perfectionist" badge on step 3

**"Know Thyself"** — Profile Arc (4 steps)
1. Answer 5 check-in questions → 40 SC
2. Complete 50% of the profile questionnaire → 50 SC
3. Answer 25 total check-ins → 60 SC
4. Complete the full profile questionnaire → 100 SC
> Total: 250 SC + "Open Book" badge on step 4

### 5.4 Org Challenges (Corporate, Admin-Created)

Admins in Studio can create time-boxed org challenges:

- **Competitive**: "Most completions this month" — leaderboard-style
- **Collaborative**: "Team finishes 100 modules by Friday" — shared progress bar
- **Compliance-Linked**: "All Safety Certs completed by April 30" — deadline countdown
- **Department vs Department**: Cross-team competition

Challenge types:
- `individual_completions` — most modules/courses completed
- `team_total_completions` — aggregate completions hit target
- `compliance_deadline` — all assigned certs complete by date
- `streak_leaders` — longest streak in the org
- `quiz_score_avg` — highest average quiz score

---

## 6. Layer 5 — The Data Acquisition Engine ("Know Yourself")

The most strategically important layer. Every gamification interaction is **also a learner signal** that enriches the Digital Twin and improves personalization.

### 6.1 Sudar Check-in Questions (Bank)

Check-ins appear as a floating card after a learning session or on dashboard load. Max 3 per day. Each answer updates `ai_tutor_context`.

**Learning Preference Category**
- "Do you prefer learning with examples first, or theory first?"
- "When you get stuck, do you prefer: hints, worked examples, or starting over?"
- "How long is your ideal learning session? (< 15 min / 15–30 min / 30–60 min / 60+ min)"
- "How do you prefer to review material? (Re-read / Quiz yourself / Discuss / Just move on)"
- "Do you like seeing the 'big picture' before diving into details?"

**Context / Goals Category**
- "What's your primary learning goal this week?"
- "Are you learning for your job, career change, personal interest, or something else?"
- "How much time do you have for learning today?"
- "On a scale of 1–5, how important is getting a certificate from this course?"
- "Is there a specific deadline driving your learning right now?"

**Reflection Category**
- "What was the most surprising thing you learned today?"
- "Rate today's session difficulty: (Too easy / Just right / Challenging / Too hard)"
- "What's one thing you want to remember from today?"
- "How confident do you feel about today's topic? (1–5)"
- "Did anything confuse you in the last session?"

**Background / Prior Knowledge Category**
- "How would you rate your overall knowledge of this topic? (Beginner / Intermediate / Advanced)"
- "Have you studied this topic before?"
- "Do you have any professional experience in this area?"
- "What related subjects have you studied?"
- "Are there any specific sub-topics you already know well?"

**Cognitive Style Category**
- "Do you learn better with visuals or text?"
- "Do you prefer structured lessons or open exploration?"
- "When you learn something complex, do you prefer: step-by-step / overview first / hands-on?"
- "How do you feel about tests and quizzes? (Love them / Tolerate them / Dislike them)"
- "Are you someone who takes notes while learning?"

**Corporate / Role Category** (shown to org learners only)
- "What team or department are you in?"
- "What's your role level? (Individual contributor / Manager / Director / Executive)"
- "How does this course relate to your current work projects?"
- "Does your manager know you're taking this course?"
- "On a scale of 1–5, how relevant is this training to your current role?"

### 6.2 Profile Completeness Progression

Displayed as a progress bar: "Your Academy Profile: X% complete"

| Section | % Contribution |
|---------|---------------|
| Basic learning goals | 10% |
| Prior domain knowledge | 15% |
| Learning style (modality preference) | 10% |
| Session length preference | 5% |
| Communication style | 10% |
| Background / experience | 15% |
| Cognitive style | 10% |
| Check-in answers (first 20) | 15% |
| Corporate role context (org users only) | 10% |

Coin milestones: 25% → 50 SC | 50% → 75 SC | 75% → 100 SC | 100% → 200 SC

### 6.3 AI Conversation Signal Mining

The tutor passively extracts structured signals from conversations and writes them to `ai_tutor_context`:

| Signal Type | Extracted From | Field Updated |
|-------------|---------------|---------------|
| Topic understanding | User confirms/denies knowing a concept | `known_concepts` / `struggles_with` |
| Sentiment | Phrases like "I'm confused", "got it", "that's hard" | `difficulty_comfort` |
| Learning preference | "Can you explain with examples?" | `preferred_explanation_style` |
| Goal revelation | "I need this for my job as..." | `learning_goals` |
| Background signal | "I've worked with X before" | `self_reported_background` |

---

## 7. Layer 6 — Corporate KPIs & Gamification

### 7.1 Learner KPI Dashboard (`/dashboard/kpis`)

Each learner sees their own KPI card row. Manager-visible view is configurable in Studio.

| KPI | Description | Source |
|-----|-------------|--------|
| Completion Rate | % of assigned courses/paths done | `enrollments` |
| Weekly Learning Time | Hours this week vs org benchmark | `learning_events` |
| Current Streak | Consecutive days with learning activity | `learner_profiles.streak_days` |
| Quiz Mastery Score | Avg quiz score across all attempts | `learning_events` (quiz_attempt payload) |
| Skill Gaps Closed | Gaps resolved this month | `skill_gaps` |
| Cert Status | Compliance certs: valid/expiring/missing | `certifications` / `compliance_records` |
| Engagement Rank | Percentile within org (based on XP) | `learner_profiles.xp_total` |
| Sudar Coins | Current balance vs org median | `learner_profiles.coin_balance` |

### 7.2 Corporate Gamification Mechanics

**Org Leaderboard** (`/dashboard/leaderboard`)
- Weekly XP leaderboard for all org members
- Resets every Monday 00:00 UTC
- Shows top 10 + current user's rank if outside top 10
- Separate views: Weekly XP | All-time XP | Completions this month

**Team Challenges**
- Admin creates in Studio: title, type, target, date range, coin prize
- All participants see a shared progress bar
- Individual contribution visible to participant; aggregate visible to all

**Manager Gifting**
- Managers have an `org_coin_pool` (admin-configured)
- Can gift SC to individual team members with a message
- Gift logged in `coin_ledger` with `event_type: 'manager_gift'`

**KPI Streak**
- Days in a row where learner hits their assigned weekly learning-time target
- Target set by admin per learner group
- Displayed in the KPI dashboard with fire icon

**Compliance Countdown**
- For compliance-linked assignments: "X days until deadline"
- Bonus coins for completing early: 3+ days early = +50 SC

### 7.3 Academy Health Score (Studio View)

Org-level composite metric visible in Studio dashboard:

```
Academy Health Score = (
  avg_completion_rate * 0.35 +
  avg_streak_normalized * 0.15 +
  avg_quiz_score * 0.25 +
  weekly_active_ratio * 0.15 +
  cert_compliance_ratio * 0.10
) * 100
```

Displayed as a 0–100 score with letter grade (A/B/C/D/F).

---

## 8. Technical Architecture

### 8.1 Database Schema

#### `coin_ledger`
```sql
CREATE TABLE coin_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,          -- positive = earn, negative = spend
  event_type text NOT NULL,
  reference_id uuid,                -- links to learning_event, achievement, etc.
  balance_after integer NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
```

#### `xp_ledger`
```sql
CREATE TABLE xp_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  source_type text NOT NULL,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);
```

#### `achievements` (catalog)
```sql
CREATE TABLE achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  flavor_text text,
  icon_key text NOT NULL,
  category text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  coin_reward integer NOT NULL DEFAULT 0,
  rarity text NOT NULL DEFAULT 'common',
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

#### `learner_achievements`
```sql
CREATE TABLE learner_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id),
  unlocked_at timestamptz DEFAULT now(),
  notified boolean DEFAULT false,
  UNIQUE(user_id, achievement_id)
);
```

#### `quests` (catalog)
```sql
CREATE TABLE quests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  quest_type text NOT NULL,          -- daily | weekly | story | org
  steps jsonb NOT NULL DEFAULT '[]',
  coin_reward integer NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 0,
  available_from timestamptz,
  available_to timestamptz,
  created_at timestamptz DEFAULT now()
);
```

#### `learner_quests`
```sql
CREATE TABLE learner_quests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL REFERENCES quests(id),
  org_id uuid,
  status text NOT NULL DEFAULT 'active',    -- active | completed | expired
  progress jsonb NOT NULL DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, quest_id)
);
```

#### `reward_catalog`
```sql
CREATE TABLE reward_catalog (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  cost_coins integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

#### `reward_redemptions`
```sql
CREATE TABLE reward_redemptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES reward_catalog(id),
  cost_coins integer NOT NULL,
  redeemed_at timestamptz DEFAULT now(),
  applied boolean DEFAULT false
);
```

#### `checkin_questions` (bank)
```sql
CREATE TABLE checkin_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text text NOT NULL,
  answer_type text NOT NULL,         -- scale | choice | text | boolean
  options jsonb,
  signal_key text NOT NULL,          -- maps to ai_tutor_context field
  category text NOT NULL,
  weight float NOT NULL DEFAULT 1.0,
  is_org_only boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

#### `checkin_responses`
```sql
CREATE TABLE checkin_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES checkin_questions(id),
  answer_value jsonb NOT NULL,
  coin_reward integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)     -- each question answered once
);
```

#### `org_challenges`
```sql
CREATE TABLE org_challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  challenge_type text NOT NULL,
  target_config jsonb NOT NULL DEFAULT '{}',
  coin_prize integer NOT NULL DEFAULT 0,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
```

#### `org_challenge_progress`
```sql
CREATE TABLE org_challenge_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES org_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  UNIQUE(challenge_id, user_id)
);
```

#### `learner_profiles` additions
```sql
ALTER TABLE learner_profiles
  ADD COLUMN coin_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN xp_total integer NOT NULL DEFAULT 0,
  ADD COLUMN scholar_level integer NOT NULL DEFAULT 1,
  ADD COLUMN scholar_title text NOT NULL DEFAULT 'Seeker',
  ADD COLUMN profile_completeness_pct integer NOT NULL DEFAULT 0,
  ADD COLUMN total_checkins_answered integer NOT NULL DEFAULT 0;
```

### 8.2 New Learning Event Types

```
coin_earned
coin_spent
xp_earned
level_up
achievement_unlocked
quest_started
quest_step_completed
quest_completed
checkin_answered
reward_redeemed
org_challenge_joined
org_challenge_completed
profile_question_answered
leaderboard_rank_changed
streak_milestone_hit
manager_gift_received
onboarding_step_complete
course_reflection_submitted
modality_explorer_bonus
creator_course_published
creator_milestone_hit
```

### 8.3 Gamification Engine Flow

```
Learning Event Written to DB
         ↓
evaluateGamification(userId, eventType, payload)
         ↓
    ┌────┴────┐
    │         │
Check Coin  Check XP
Earn Rules  Earn Rules
    │         │
    ↓         ↓
POST /api/coins/earn (with XP + level-up check)
         ↓
Check Achievement Conditions
(all achievements whose trigger_type matches eventType)
         ↓
If condition met → INSERT learner_achievements + notify
         ↓
Update Quest Step Progress
         ↓
Return { coinsEarned, xpEarned, levelUp, newAchievements }
```

### 8.4 API Routes

**sudar-learn:**
- `POST /api/coins/earn` — award coins + XP (internal, service-role)
- `POST /api/coins/spend` — deduct coins, create redemption
- `GET /api/coins/balance` — balance + recent ledger (last 20)
- `GET /api/achievements` — catalog + learner unlock status
- `POST /api/achievements/check` — trigger condition evaluation
- `GET /api/quests` — active daily/weekly/story quests
- `POST /api/quests/progress` — update quest step
- `GET /api/leaderboard/[orgId]` — org leaderboard
- `POST /api/checkin/answer` — submit answer, award coins, update twin
- `GET /api/checkin/next` — next unanswered check-in
- `GET /api/rewards` — reward catalog
- `POST /api/rewards/redeem` — redeem by slug

**sudar-studio:**
- `GET /api/org/gamification` — Academy Health Score + leaderboard
- `POST /api/org/challenges` — create org challenge
- `GET /api/org/challenges/[id]/progress` — team challenge progress
- `POST /api/org/coins/gift` — manager gifts coins

---

## 9. UI Component Map

### 9.1 sudar-learn Components

| Component | Location | Description |
|-----------|----------|-------------|
| `CoinWidget` | TopNav | Coin balance pill (animated) |
| `QuestCard` | Dashboard | Daily quest tracker (3 quests) |
| `AchievementShelf` | Dashboard | Recent + pinned badges |
| `ProfileCompletenessBar` | Dashboard | Know-Yourself progress bar |
| `CheckinFloatingCard` | Dashboard (post-session) | Daily check-in prompt |
| `RewardCatalogModal` | Triggered from nav/coins | Full spend catalog |
| `LevelUpToast` | Global | Level-up celebration animation |
| `AchievementUnlockedToast` | Global | Badge earned notification |
| `KPIDashboard` | `/dashboard/kpis` | Corporate learner KPIs |
| `OrgLeaderboard` | `/dashboard/leaderboard` | Weekly XP leaderboard |
| `CoinLedger` | `/dashboard/coins` | Transaction history |

### 9.2 sudar-studio Components

| Component | Location | Description |
|-----------|----------|-------------|
| `AcademyHealthScore` | Studio Dashboard | Org health composite score |
| `OrgLeaderboardWidget` | Studio Dashboard | Top learners widget |
| `ChallengeCreator` | `/tools/gamification` | Create org challenges |
| `ChallengeProgressView` | `/tools/gamification` | Monitor challenge progress |
| `CoinGiftPanel` | `/tools/gamification` | Manager coin gifting |
| `CourseRewardConfig` | Course settings | Set custom SC for course completion |

---

## 10. Implementation Phases

### Phase A — Foundation (Weeks 1–3)
- DB migrations (all new tables + learner_profiles additions)
- `lib/gamification/engine.ts`, `rules.ts`, `achievements.ts`
- Hook `/api/events/route.ts`
- `GET /api/coins/balance`, `POST /api/coins/earn`, `POST /api/coins/spend`

### Phase B — Achievements & Quests (Weeks 4–5)
- Achievement condition evaluators + seed data (30+ achievements)
- `GET /api/achievements`, `GET /api/quests`, `POST /api/quests/progress`
- Global toast notifications for unlocks and level-ups

### Phase C — Learn UI (Weeks 6–8)
- `CoinWidget` in TopNav
- Dashboard: `QuestCard`, `AchievementShelf`, `ProfileCompletenessBar`
- `RewardCatalogModal`
- Theme/layout application from redeemed rewards

### Phase D — Check-in & Data Engine (Weeks 9–10)
- `checkin_questions` seed bank (50+ questions)
- `GET /api/checkin/next`, `POST /api/checkin/answer`
- `CheckinFloatingCard` component
- `ai_tutor_context` signal mapping + soft twin rollup

### Phase E — Corporate KPIs (Weeks 11–12)
- KPI Dashboard page `/dashboard/kpis`
- Org Leaderboard `/dashboard/leaderboard`
- Studio: `AcademyHealthScore`, `ChallengeCreator`, `CoinGiftPanel`

### Phase F — Narrative Polish (Weeks 13–14)
- Story quests ("The Awakening", "The Knowledge Hunt", "The Scholar's Path")
- Level-up ceremony animation
- Mascot dialogue hooks for milestone moments
- Seasonal quest events framework

---

## 10.1 Fast MVP Implementation Status (April 2026)

### Completed in Fast MVP
- Added `POST /api/quests/progress` in Learn for explicit quest/milestone event emission and immediate gamification evaluation.
- Consolidated reward awarding so check-in flow routes coin/xp through the central gamification engine (prevents duplicate reward writes).
- Added profile completeness rollup logic and wired updates to `learner_profiles.profile_completeness_pct` from check-ins and learner preferences.
- Added global learner feedback layer (`GamificationToasts`) for level-up and achievement unlock notifications with reduced-motion support.
- Added lifecycle event coverage for `quest_started`, `quest_step_completed`, `quest_completed`, `achievement_unlocked`, and `level_up`.
- Added org challenge progression + payout handling in the gamification engine and surfaced richer challenge progress in Studio APIs/UI.

### Remaining for Full Narrative Polish
- Expanded mascot milestone dialogue hooks and seasonal challenge frameworks.
- Additional high-fidelity celebration effects (optional confetti-tier polish) after core adoption metrics are stable.

---

## 11. Event → Signal Mapping (Quick Reference)

| Learning Event | Coins Earned | XP Earned | Achievement Triggers |
|---------------|-------------|-----------|---------------------|
| `module_complete` | 25 SC | 40 XP | first_light, century_club |
| `course_complete` (enrollment→completed) | 100 SC | 200 XP | the_long_road, completionist, speed_learner |
| `quiz_attempt` (100% first try) | 30 SC | 60 XP | perfectionist, no_wrong_turns, flawless |
| `quiz_attempt` (≥70%) | 0 SC | 20 XP | — |
| `session_end` | 0 SC | 0 XP | night_owl, early_bird, deep_diver |
| `modality_switch` | 0 SC | 0 XP | modality_switcher, multisensory |
| `ai_tutor_query` (session count) | 5 SC (max 10/day) | 10 XP | — |
| `checkin_answered` | 10 SC | 10 XP | self_aware, curious_mind |
| `profile_question_answered` | 10 SC | 15 XP | open_book |
| `streak_maintained` (7d) | 50 SC | 75 XP | creature_of_habit |
| `streak_maintained` (30d) | 250 SC | 300 XP | unbreakable |
| `streak_maintained` (90d) | 1,000 SC | 1,000 XP | always_on |
| `modality_explorer_bonus` | 75 SC | 0 XP | multisensory |
| `course_reflection_submitted` | 20 SC | 0 XP | reflective_learner |

---

*This document is the authoritative gamification design reference. Update alongside any schema migrations or rule changes.*
