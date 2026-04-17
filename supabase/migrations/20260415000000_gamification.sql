-- =============================================================================
-- ByteOS Gamification System — Database Migration
-- =============================================================================

-- ─── COIN LEDGER ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coin_ledger (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        integer     NOT NULL,
  event_type    text        NOT NULL,
  reference_id  uuid,
  balance_after integer     NOT NULL,
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coin_ledger_user_id_idx ON coin_ledger (user_id);
CREATE INDEX IF NOT EXISTS coin_ledger_created_at_idx ON coin_ledger (created_at DESC);

ALTER TABLE coin_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own coin ledger" ON coin_ledger FOR SELECT USING (auth.uid() = user_id);

-- ─── XP LEDGER ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_ledger (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        integer     NOT NULL,
  source_type   text        NOT NULL,
  reference_id  uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS xp_ledger_user_id_idx ON xp_ledger (user_id);

ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own xp ledger" ON xp_ledger FOR SELECT USING (auth.uid() = user_id);

-- ─── ACHIEVEMENTS CATALOG ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id             uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug           text    NOT NULL UNIQUE,
  title          text    NOT NULL,
  description    text    NOT NULL,
  flavor_text    text,
  icon_key       text    NOT NULL DEFAULT 'star',
  category       text    NOT NULL,
  xp_reward      integer NOT NULL DEFAULT 0,
  coin_reward    integer NOT NULL DEFAULT 0,
  rarity         text    NOT NULL DEFAULT 'common',
  trigger_type   text    NOT NULL,
  trigger_config jsonb   NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are public readable" ON achievements FOR SELECT USING (true);

-- ─── LEARNER ACHIEVEMENTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learner_achievements (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid        NOT NULL REFERENCES achievements(id),
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  notified       boolean     NOT NULL DEFAULT false,
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS learner_achievements_user_id_idx ON learner_achievements (user_id);

ALTER TABLE learner_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own achievements" ON learner_achievements FOR SELECT USING (auth.uid() = user_id);

-- ─── QUESTS CATALOG ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quests (
  id             uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug           text    NOT NULL UNIQUE,
  title          text    NOT NULL,
  description    text    NOT NULL,
  quest_type     text    NOT NULL DEFAULT 'daily',
  steps          jsonb   NOT NULL DEFAULT '[]',
  coin_reward    integer NOT NULL DEFAULT 0,
  xp_reward      integer NOT NULL DEFAULT 0,
  available_from timestamptz,
  available_to   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests are public readable" ON quests FOR SELECT USING (true);

-- ─── LEARNER QUESTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learner_quests (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id     uuid        NOT NULL REFERENCES quests(id),
  org_id       uuid,
  status       text        NOT NULL DEFAULT 'active',
  progress     jsonb       NOT NULL DEFAULT '{}',
  started_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, quest_id)
);

CREATE INDEX IF NOT EXISTS learner_quests_user_id_idx    ON learner_quests (user_id);
CREATE INDEX IF NOT EXISTS learner_quests_status_idx     ON learner_quests (status);

ALTER TABLE learner_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own quests" ON learner_quests FOR SELECT USING (auth.uid() = user_id);

-- ─── REWARD CATALOG ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_catalog (
  id          uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text    NOT NULL UNIQUE,
  title       text    NOT NULL,
  description text    NOT NULL,
  category    text    NOT NULL,
  cost_coins  integer NOT NULL,
  metadata    jsonb   NOT NULL DEFAULT '{}',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reward_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reward catalog is public readable" ON reward_catalog FOR SELECT USING (true);

-- ─── REWARD REDEMPTIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id   uuid        NOT NULL REFERENCES reward_catalog(id),
  cost_coins  integer     NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  applied     boolean     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS reward_redemptions_user_id_idx ON reward_redemptions (user_id);

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own redemptions" ON reward_redemptions FOR SELECT USING (auth.uid() = user_id);

-- ─── CHECK-IN QUESTIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checkin_questions (
  id            uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text text    NOT NULL,
  answer_type   text    NOT NULL DEFAULT 'choice',
  options       jsonb,
  signal_key    text    NOT NULL,
  category      text    NOT NULL,
  weight        float   NOT NULL DEFAULT 1.0,
  is_org_only   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE checkin_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are public readable" ON checkin_questions FOR SELECT USING (true);

-- ─── CHECK-IN RESPONSES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checkin_responses (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id  uuid        NOT NULL REFERENCES checkin_questions(id),
  answer_value jsonb       NOT NULL,
  coin_reward  integer     NOT NULL DEFAULT 10,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS checkin_responses_user_id_idx ON checkin_responses (user_id);

ALTER TABLE checkin_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own checkin responses" ON checkin_responses FOR SELECT USING (auth.uid() = user_id);

-- ─── ORG CHALLENGES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_challenges (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id          uuid        NOT NULL,
  title           text        NOT NULL,
  description     text,
  challenge_type  text        NOT NULL DEFAULT 'individual_completions',
  target_config   jsonb       NOT NULL DEFAULT '{}',
  coin_prize      integer     NOT NULL DEFAULT 0,
  start_at        timestamptz NOT NULL,
  end_at          timestamptz NOT NULL,
  created_by      uuid        NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_challenges_org_id_idx  ON org_challenges (org_id);

ALTER TABLE org_challenges ENABLE ROW LEVEL SECURITY;

-- ─── ORG CHALLENGE PROGRESS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_challenge_progress (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid        NOT NULL REFERENCES org_challenges(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution jsonb       NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  UNIQUE (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS org_challenge_progress_challenge_id_idx ON org_challenge_progress (challenge_id);
CREATE INDEX IF NOT EXISTS org_challenge_progress_user_id_idx      ON org_challenge_progress (user_id);

ALTER TABLE org_challenge_progress ENABLE ROW LEVEL SECURITY;

-- ─── LEARNER_PROFILES ADDITIONS ──────────────────────────────────────────────
ALTER TABLE learner_profiles
  ADD COLUMN IF NOT EXISTS coin_balance          integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_total              integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scholar_level         integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scholar_title         text    NOT NULL DEFAULT 'Seeker',
  ADD COLUMN IF NOT EXISTS profile_completeness_pct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_checkins_answered  integer NOT NULL DEFAULT 0;

-- ─── SEED: ACHIEVEMENTS ──────────────────────────────────────────────────────
INSERT INTO achievements (slug, title, description, flavor_text, icon_key, category, xp_reward, coin_reward, rarity, trigger_type, trigger_config)
VALUES
-- Learning Milestones
('first_light',       'First Light',       'Complete your first module',                          'The Academy recognizes a new Explorer.',         'sparkles',    'milestones', 50,  0,   'common',    'module_complete',     '{"count":1}'),
('the_long_road',     'The Long Road',     'Complete your first full course',                     'Knowledge is a journey, not a destination.',     'book-open',   'milestones', 150, 50,  'rare',      'course_complete',     '{"count":1}'),
('completionist',     'Completionist',     'Complete an entire Learning Path',                    'You walked every step of the path.',             'route',       'milestones', 400, 100, 'epic',      'path_complete',       '{"count":1}'),
('speed_learner',     'Speed Learner',     'Finish a course in fewer than 2 sessions',            'Fast mind, focused intent.',                     'zap',         'milestones', 100, 30,  'rare',      'course_complete',     '{"max_sessions":2}'),
('deep_diver',        'Deep Diver',        'Spend 3+ hours in a single course',                   'Some knowledge requires depth.',                 'waves',       'milestones', 150, 40,  'rare',      'session_end',         '{"course_hours":3}'),
('century_club',      'Century Club',      'Complete 100 modules total',                          'One hundred steps toward mastery.',              'trophy',      'milestones', 500, 150, 'epic',      'module_complete',     '{"count":100}'),

-- Mastery
('perfectionist',     'Perfectionist',     'Achieve 100% on 3 quizzes on your first attempt',    'Precision is its own kind of art.',              'target',      'mastery',    200, 60,  'rare',      'quiz_attempt',        '{"score":100,"first_attempt":true,"count":3}'),
('no_wrong_turns',    'No Wrong Turns',    'Complete a course with over 90% average quiz score',  'Your compass never wavers.',                     'compass',     'mastery',    300, 75,  'epic',      'course_complete',     '{"avg_quiz_score":90}'),
('domain_expert',     'Domain Expert',     'Close 5 skill gaps in one topic area',                'The Academy sees your expertise.',               'brain',       'mastery',    350, 100, 'epic',      'skill_gap_closed',    '{"count":5}'),
('flawless',          'Flawless',          '100% on every quiz in a course',                      'Not a single gap remains.',                      'crown',       'mastery',    600, 200, 'legendary', 'course_complete',     '{"all_quizzes_perfect":true}'),

-- Engagement & Streaks
('creature_of_habit', 'Creature of Habit', 'Maintain a 7-day learning streak',                   'Seven suns, seven lessons.',                     'flame',       'engagement', 75,  0,   'common',    'streak_milestone_hit','{"days":7}'),
('unbreakable',       'Unbreakable',       'Maintain a 30-day learning streak',                   'The Academy cannot stop your momentum.',         'shield',      'engagement', 300, 0,   'rare',      'streak_milestone_hit','{"days":30}'),
('always_on',         'Always On',         'Maintain a 90-day learning streak',                   'Three months of fire. Legendary.',               'infinity',    'engagement', 1000,0,   'legendary', 'streak_milestone_hit','{"days":90}'),
('night_owl',         'Night Owl',         '10 learning sessions between 10pm and 2am',           'The Academy never sleeps, and neither do you.',  'moon',        'engagement', 100, 0,   'rare',      'session_end',         '{"hour_start":22,"hour_end":2,"count":10}'),
('early_bird',        'Early Bird',        '10 learning sessions before 7am',                     'The early Explorer catches the concept.',        'sun',         'engagement', 100, 0,   'rare',      'session_end',         '{"hour_end":7,"count":10}'),

-- Exploration (Modality)
('text_addict',       'Text Addict',       '10 hours in text modality',                           'Words are your primary element.',                'file-text',   'exploration',75,  0,   'common',    'twin_rollup',         '{"modality":"text","hours":10}'),
('cinephile',         'Cinephile',         '10 hours in video modality',                          'You see to understand.',                         'video',       'exploration',75,  0,   'common',    'twin_rollup',         '{"modality":"video","hours":10}'),
('multisensory',      'Multisensory',      'Use all 7 learning modalities at least once',         'The whole Academy is your classroom.',           'layers',      'exploration',300, 75,  'epic',      'modality_switch',     '{"all_modalities":true}'),
('modality_switcher', 'Modality Switcher', 'Switch modalities mid-course 5 times',                'You adapt your lens to the lesson.',             'repeat',      'exploration',100, 25,  'rare',      'modality_switch',     '{"count":5}'),
('audio_explorer',    'Audio Explorer',    '5 hours in audio modality',                           'The spoken word carries you forward.',           'headphones',  'exploration',50,  0,   'common',    'twin_rollup',         '{"modality":"audio","hours":5}'),

-- Social
('team_player',       'Team Player',       'Complete a group org challenge',                      'Strength in numbers, knowledge in community.',   'users',       'social',     100, 25,  'common',    'org_challenge_completed','{}'),
('trailblazer',       'Trailblazer',       'Be first in your org to complete a new course',       'You paved the path for others.',                 'flag',        'social',     300, 75,  'epic',      'course_complete',     '{"first_in_org":true}'),
('podium_finish',     'Podium Finish',     'Reach top 3 on the org weekly leaderboard',           'The Academy applauds.',                          'medal',       'social',     150, 50,  'rare',      'leaderboard_rank_changed','{"rank_lte":3}'),

-- Know Yourself
('self_aware',        'Self-Aware',        'Answer 10 Know-Yourself check-in questions',          'You look inward to learn outward.',              'eye',         'curiosity',  75,  0,   'common',    'checkin_answered',    '{"count":10}'),
('open_book',         'Open Book',         'Complete the full learner profile questionnaire',     'The Academy knows you.',                         'book',        'curiosity',  200, 50,  'rare',      'profile_question_answered','{"completeness":100}'),
('reflective_learner','Reflective Learner','Submit 5 course reflections',                         'Growth requires looking back.',                  'refresh-cw',  'curiosity',  150, 40,  'rare',      'course_reflection_submitted','{"count":5}'),
('curious_mind',      'Curious Mind',      'Answer 50 total check-in questions',                  'You never stop asking.',                         'search',      'curiosity',  400, 100, 'epic',      'checkin_answered',    '{"count":50}'),

-- Creator (Studio)
('author',            'Author',            'Publish your first course',                           'Knowledge shared is knowledge multiplied.',      'pen-tool',    'creator',    150, 0,   'common',    'creator_course_published','{"count":1}'),
('prolific',          'Prolific',          'Publish 5 courses',                                   'The Academy grows with every author.',           'library',     'creator',    400, 100, 'rare',      'creator_course_published','{"count":5}'),
('hit_maker',         'Hit Maker',         'Have a course reach 50 completions',                  'Your work resonates.',                           'trending-up', 'creator',    600, 150, 'epic',      'creator_milestone_hit',  '{"completions":50}'),
('five_star_creator', '5-Star Creator',    'Achieve a 4.5+ average learner rating on a course',  'Excellence recognized by those who learn.',      'star',        'creator',    800, 200, 'legendary', 'creator_milestone_hit',  '{"rating_gte":4.5}')
ON CONFLICT (slug) DO NOTHING;

-- ─── SEED: REWARD CATALOG ────────────────────────────────────────────────────
INSERT INTO reward_catalog (slug, title, description, category, cost_coins, metadata, is_active)
VALUES
-- AI Power-ups
('ai_regen_5',       'AI Regenerations (+5)',      'Get 5 extra AI response regenerations',          'ai_powerup',  50,  '{"type":"ai_regen","amount":5}',           true),
('ai_regen_20',      'AI Regenerations (+20)',     'Get 20 extra AI response regenerations',         'ai_powerup',  175, '{"type":"ai_regen","amount":20}',          true),
('deep_dive_mode',   'Deep Dive Mode',             'Unlock extended AI tutor sessions (no time limit)','ai_powerup',250, '{"type":"feature_flag","key":"deep_dive"}',true),

-- Themes
('theme_neon',       'Neon Theme',                'Electric neon palette for your dashboard',       'cosmetic',    200, '{"type":"theme","palette":"neon"}',        true),
('theme_ocean',      'Ocean Theme',               'Deep ocean blue palette for your dashboard',     'cosmetic',    200, '{"type":"theme","palette":"ocean"}',       true),
('theme_forest',     'Forest Theme',              'Calming forest green palette for your dashboard','cosmetic',    200, '{"type":"theme","palette":"forest"}',      true),
('theme_sunset',     'Sunset Theme',              'Warm amber sunset palette for your dashboard',   'cosmetic',    200, '{"type":"theme","palette":"sunset"}',      true),

-- Dashboard Layouts
('layout_zen',       'Zen Dashboard',             'Minimal, distraction-free dashboard layout',    'cosmetic',    150, '{"type":"layout","key":"zen"}',            true),
('layout_focus',     'Focus Dashboard',           'Focus-mode layout optimized for deep work',     'cosmetic',    150, '{"type":"layout","key":"focus"}',          true),

-- Mascot Skins
('mascot_cosmic',    'Cosmic Sudar',              'Sudar in a galactic cosmic skin',               'cosmetic',    300, '{"type":"mascot_skin","key":"cosmic"}',    true),
('mascot_scholar',   'Scholar Sudar',             'Sudar in a classic academic scholar skin',      'cosmetic',    300, '{"type":"mascot_skin","key":"scholar"}',   true),

-- Avatar Frames
('frame_gold',       'Gold Avatar Frame',         'Gold border frame for your profile avatar',     'cosmetic',    150, '{"type":"avatar_frame","key":"gold"}',     true),
('frame_diamond',    'Diamond Avatar Frame',      'Premium diamond border for your profile avatar','cosmetic',    400, '{"type":"avatar_frame","key":"diamond"}',  true),

-- Features
('cert_premium',     'Premium Certificate Design','Unlock a premium certificate design on completion','feature',  150, '{"type":"feature_flag","key":"cert_premium"}',true),
('fasttrack_prereq', 'Fast-Track (Skip Prereq)',  'Skip one course prerequisite requirement',       'feature',    500, '{"type":"skip_prereq","count":1}',         true),
('memory_export',    'Memory Export (PDF)',        'Export your Sudar memory as a PDF report',      'feature',    100, '{"type":"feature_flag","key":"memory_export"}',true)
ON CONFLICT (slug) DO NOTHING;

-- ─── SEED: STORY QUESTS ──────────────────────────────────────────────────────
INSERT INTO quests (slug, title, description, quest_type, steps, coin_reward, xp_reward)
VALUES
(
  'the_awakening',
  'The Awakening',
  'Your first steps into the Sudar Academy. Complete this quest to discover your learning powers.',
  'story',
  '[
    {"id":"step_1","title":"Complete your first module","event_type":"module_complete","target":1,"coin_reward":25},
    {"id":"step_2","title":"Ask Sudar a question","event_type":"ai_tutor_query","target":1,"coin_reward":15},
    {"id":"step_3","title":"Complete your first course","event_type":"course_complete","target":1,"coin_reward":50},
    {"id":"step_4","title":"Spend your first Sudar Coins","event_type":"coin_spent","target":1,"coin_reward":10},
    {"id":"step_5","title":"Unlock your first achievement","event_type":"achievement_unlocked","target":1,"coin_reward":20}
  ]',
  120, 300
),
(
  'the_knowledge_hunt',
  'The Knowledge Hunt',
  'Explore different ways to learn. Each modality unlocks a new dimension of understanding.',
  'story',
  '[
    {"id":"step_1","title":"Try the video modality","event_type":"modality_switch","modality":"video","target":1,"coin_reward":20},
    {"id":"step_2","title":"Try the audio modality","event_type":"modality_switch","modality":"audio","target":1,"coin_reward":20},
    {"id":"step_3","title":"Try the flashcard modality","event_type":"modality_switch","modality":"flashcards","target":1,"coin_reward":20},
    {"id":"step_4","title":"Try one more new modality","event_type":"modality_switch","target":1,"coin_reward":20}
  ]',
  80, 200
),
(
  'the_scholars_path',
  'The Scholar''s Path',
  'True mastery requires consistent excellence. Prove yourself on the path.',
  'story',
  '[
    {"id":"step_1","title":"Score 90% or higher on a quiz","event_type":"quiz_attempt","min_score":90,"target":1,"coin_reward":30},
    {"id":"step_2","title":"Complete a course with 90%+ quiz average","event_type":"course_complete","avg_quiz":90,"target":1,"coin_reward":75},
    {"id":"step_3","title":"Achieve perfect score on 3 quizzes","event_type":"quiz_attempt","score":100,"first_attempt":true,"target":3,"coin_reward":50}
  ]',
  155, 400
),
(
  'know_thyself',
  'Know Thyself',
  'Help Sudar understand you better. The more you share, the better the Academy learns alongside you.',
  'story',
  '[
    {"id":"step_1","title":"Answer 5 check-in questions","event_type":"checkin_answered","target":5,"coin_reward":40},
    {"id":"step_2","title":"Complete 50%% of your learner profile","event_type":"profile_question_answered","completeness":50,"target":1,"coin_reward":50},
    {"id":"step_3","title":"Answer 25 total check-ins","event_type":"checkin_answered","target":25,"coin_reward":60},
    {"id":"step_4","title":"Complete your full profile","event_type":"profile_question_answered","completeness":100,"target":1,"coin_reward":100}
  ]',
  250, 500
)
ON CONFLICT (slug) DO NOTHING;

-- ─── SEED: CHECK-IN QUESTION BANK ───────────────────────────────────────────
INSERT INTO checkin_questions (question_text, answer_type, options, signal_key, category, weight, is_org_only)
VALUES
-- Learning Preference
('Do you prefer learning with examples first, or theory first?',        'choice', '["Examples first","Theory first","Depends on the topic"]', 'preferred_explanation_style', 'preference', 1.0, false),
('How long is your ideal learning session?',                            'choice', '["Under 15 minutes","15–30 minutes","30–60 minutes","60+ minutes"]', 'session_length_preference', 'preference', 1.0, false),
('When you get stuck, what helps you most?',                            'choice', '["A small hint","A worked example","Starting over fresh","Asking for explanation"]', 'preferred_explanation_style', 'preference', 0.9, false),
('Do you prefer seeing the big picture before diving into details?',    'choice', '["Yes, overview first","No, jump straight in","Depends"]', 'cognitive_style', 'preference', 0.9, false),
('How do you prefer to review material after a session?',               'choice', '["Re-read it","Quiz myself","Discuss with someone","Just move on"]', 'preferred_explanation_style', 'preference', 0.8, false),
('How comfortable are you with ambiguity while learning?',              'scale',  '{"min":1,"max":5,"labels":["Need certainty","Fully comfortable"]}', 'cognitive_style', 'preference', 0.7, false),

-- Goals / Context
('What is your primary learning goal this week?',                       'text',   NULL, 'learning_goals', 'context', 1.0, false),
('Why are you learning this topic?',                                    'choice', '["Career advancement","Job requirement","Personal interest","Certification","Career change"]', 'learning_goals', 'context', 1.0, false),
('How much time do you have for learning today?',                       'choice', '["Less than 15 min","15–30 min","30–60 min","More than an hour"]', 'session_length_preference', 'context', 0.8, false),
('Is there a specific deadline driving your learning right now?',       'boolean', NULL, 'learning_goals', 'context', 0.7, false),

-- Reflection
('How confident did you feel after your last session?',                 'scale',  '{"min":1,"max":5,"labels":["Not confident","Very confident"]}', 'difficulty_comfort', 'reflection', 1.0, false),
('Rate the difficulty of your last session.',                           'choice', '["Too easy","Just right","Challenging","Too hard"]', 'difficulty_comfort', 'reflection', 1.0, false),
('What was the most surprising thing you learned recently?',            'text',   NULL, 'learning_style_notes', 'reflection', 0.8, false),
('Did anything confuse you in your last learning session?',             'text',   NULL, 'learning_style_notes', 'reflection', 0.8, false),
('On a scale of 1–5, how motivated do you feel to keep learning today?','scale',  '{"min":1,"max":5,"labels":["Not motivated","Very motivated"]}', 'learning_style_notes', 'reflection', 0.7, false),

-- Background / Prior Knowledge
('How would you rate your overall knowledge of the topics you are studying?', 'choice', '["Complete beginner","Some exposure","Intermediate","Advanced","Expert"]', 'self_reported_background', 'background', 1.0, false),
('Have you studied this topic in a formal course before?',              'boolean', NULL, 'self_reported_background', 'background', 0.9, false),
('Do you have professional experience in this area?',                   'boolean', NULL, 'self_reported_background', 'background', 0.9, false),
('What related subjects have you studied before?',                      'text',   NULL, 'self_reported_background', 'background', 0.7, false),

-- Cognitive Style
('Do you learn better with visuals or text?',                           'choice', '["Strongly visual","More visual","Equal","More text","Strongly text"]', 'cognitive_style', 'style', 1.0, false),
('Do you prefer structured lessons or open exploration?',               'choice', '["Highly structured","Mostly structured","Balanced","Mostly open","Fully exploratory"]', 'cognitive_style', 'style', 0.9, false),
('How do you feel about quizzes and tests?',                            'choice', '["Love them","Tolerate them","Dislike them"]', 'difficulty_comfort', 'style', 0.8, false),
('Do you typically take notes while learning?',                         'boolean', NULL, 'learning_style_notes', 'style', 0.7, false),
('When learning something complex, do you prefer:',                     'choice', '["Step-by-step breakdown","High-level overview first","Learning by doing"]', 'cognitive_style', 'style', 0.9, false),

-- Corporate / Role (org users only)
('What team or department are you in?',                                 'text',   NULL, 'role_context', 'corporate', 1.0, true),
('What is your role level?',                                            'choice', '["Individual contributor","Senior IC","Team lead","Manager","Director","Executive"]', 'role_context', 'corporate', 1.0, true),
('How does this course relate to your current work?',                   'choice', '["Directly related","Somewhat related","Building future skills","Required training","Not sure"]', 'role_context', 'corporate', 0.9, true),
('Does your manager know you are taking this course?',                  'boolean', NULL, 'role_context', 'corporate', 0.6, true),
('On a scale of 1–5, how relevant is this training to your current role?', 'scale', '{"min":1,"max":5,"labels":["Not relevant","Highly relevant"]}', 'role_context', 'corporate', 1.0, true)
ON CONFLICT DO NOTHING;

-- ─── SEED: DAILY QUEST TEMPLATES ─────────────────────────────────────────────
INSERT INTO quests (slug, title, description, quest_type, steps, coin_reward, xp_reward)
VALUES
('daily_module_complete', 'Daily: Complete a Module',      'Complete one module today',                    'daily', '[{"id":"s1","event_type":"module_complete","target":1}]',     25, 40),
('daily_video_15',        'Daily: 15 Min of Video',        'Watch 15 minutes of video content today',     'daily', '[{"id":"s1","event_type":"video_play","duration_secs":900,"target":1}]', 20, 30),
('daily_tutor_ask',       'Daily: Ask Sudar',              'Ask the AI tutor a question today',           'daily', '[{"id":"s1","event_type":"ai_tutor_query","target":1}]',       10, 15),
('daily_checkin',         'Daily: Today''s Check-in',      'Answer today''s Sudar check-in',              'daily', '[{"id":"s1","event_type":"checkin_answered","target":1}]',     10, 15),
('daily_new_modality',    'Daily: Try a New Modality',     'Try a modality you haven''t used today',      'daily', '[{"id":"s1","event_type":"modality_switch","target":1}]',      15, 20)
ON CONFLICT (slug) DO NOTHING;
