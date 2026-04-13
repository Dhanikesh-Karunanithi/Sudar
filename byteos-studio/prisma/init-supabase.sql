-- Sudar Database Initialization Script
-- Run this in Supabase SQL Editor to create all required tables
-- Tables are created in dependency order (no foreign key cycles)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS (must be created first)
-- ============================================

CREATE TYPE "role" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'CREATOR', 'LEARNER');
CREATE TYPE "org_role" AS ENUM ('ADMIN', 'MANAGER', 'CREATOR', 'LEARNER');

-- ============================================
-- CORE TABLES (no foreign keys)
-- ============================================

-- Organisations (no FK dependencies)
CREATE TABLE "organisations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "branding" JSONB,
    "settings" JSONB,
    "plan" TEXT DEFAULT 'free',
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Profiles (depends on organisations, but orgId is nullable)
CREATE TABLE "profiles" (
    "id" UUID PRIMARY KEY,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "role" "role" DEFAULT 'LEARNER',
    "org_id" UUID REFERENCES "organisations"("id"),
    "onboarding_complete" BOOLEAN DEFAULT false,
    "require_password_change" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ORGANISATION-RELATED TABLES
-- ============================================

-- Org Members
CREATE TABLE "org_members" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organisations"("id"),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
    "role" "org_role" DEFAULT 'LEARNER',
    "joined_at" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("org_id", "user_id")
);

-- Org Branding
CREATE TABLE "org_branding" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID UNIQUE NOT NULL REFERENCES "organisations"("id"),
    "logo_url" TEXT,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "font_family" TEXT,
    "custom_domain" TEXT,
    "hide_branding" BOOLEAN DEFAULT false
);

-- Org Invites
CREATE TABLE "org_invites" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
    "email" TEXT NOT NULL,
    "role" "org_role" DEFAULT 'LEARNER',
    "created_at" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("org_id", "email")
);

-- Integration API Keys
CREATE TABLE "integration_api_keys" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "last_used_at" TIMESTAMPTZ
);

-- ============================================
-- LEARNER GROUPS
-- ============================================

CREATE TABLE "learner_groups" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_by" UUID NOT NULL REFERENCES "profiles"("id"),
    "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "learner_group_members" (
    "group_id" UUID NOT NULL REFERENCES "learner_groups"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    PRIMARY KEY ("group_id", "user_id")
);

-- ============================================
-- DIGITAL LEARNER TWIN
-- ============================================

CREATE TABLE "learner_profiles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID UNIQUE NOT NULL REFERENCES "profiles"("id"),
    "modality_scores" JSONB DEFAULT '{"text": 0.5, "video": 0.5, "audio": 0.5, "mindmap": 0.5, "flashcards": 0.5, "game": 0.5, "feed": 0.5}',
    "learning_pace" TEXT DEFAULT 'medium',
    "difficulty_comfort" TEXT DEFAULT 'intermediate',
    "cognitive_style" TEXT DEFAULT 'mixed',
    "preferred_language" TEXT DEFAULT 'en',
    "avg_session_duration_mins" FLOAT DEFAULT 0,
    "avg_completion_rate" FLOAT DEFAULT 0,
    "total_learning_minutes" FLOAT DEFAULT 0,
    "streak_days" INT DEFAULT 0,
    "last_active_at" TIMESTAMPTZ,
    "overall_engagement_score" FLOAT DEFAULT 0.5,
    "next_best_action" JSONB,
    "ai_tutor_context" JSONB,
    "generative_ai_consent_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LEARNER PERFORMANCE
-- ============================================

CREATE TABLE "learner_performance_records" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
    "source_type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" DECIMAL NOT NULL,
    "recorded_at" TIMESTAMPTZ DEFAULT now(),
    "metadata" JSONB
);

-- ============================================
-- SKILLS & TAGS
-- ============================================

CREATE TABLE "skills" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "tag_groups" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "org_tags" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
    "group_id" UUID REFERENCES "tag_groups"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CONTENT
-- ============================================

CREATE TABLE "courses" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organisations"("id"),
    "created_by" UUID NOT NULL REFERENCES "profiles"("id"),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "banner_url" TEXT,
    "status" TEXT DEFAULT 'draft',
    "template" TEXT,
    "difficulty" TEXT,
    "estimated_duration_mins" INT,
    "target_skills" JSONB,
    "tags" TEXT[],
    "scorm_url" TEXT,
    "settings" JSONB,
    "is_adaptive" BOOLEAN DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "modules" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "modality_variants" JSONB,
    "order_index" INT NOT NULL,
    "quiz" JSONB,
    "sudarplay_map_url" TEXT,
    "sudarplay_map_id" UUID,
    "sudarplay_config" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "course_org_tags" (
    "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "org_tag_id" UUID NOT NULL REFERENCES "org_tags"("id") ON DELETE CASCADE,
    PRIMARY KEY ("course_id", "org_tag_id")
);

CREATE TABLE "content_assets" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID REFERENCES "organisations"("id"),
    "uploader_id" UUID REFERENCES "profiles"("id"),
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storage_path" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LEARNING PATHS
-- ============================================

CREATE TABLE "learning_paths" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organisations"("id"),
    "created_by" UUID NOT NULL REFERENCES "profiles"("id"),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "status" TEXT DEFAULT 'draft',
    "courses" JSONB DEFAULT '[]',
    "is_adaptive" BOOLEAN DEFAULT false,
    "is_mandatory" BOOLEAN DEFAULT false,
    "target_skills" JSONB,
    "certification_config" JSONB,
    "issues_certificate" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ENROLLMENTS
-- ============================================

CREATE TABLE "enrollments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
    "path_id" UUID REFERENCES "learning_paths"("id"),
    "course_id" UUID REFERENCES "courses"("id"),
    "enrolled_by" UUID REFERENCES "profiles"("id"),
    "status" TEXT DEFAULT 'not_started',
    "progress_pct" FLOAT DEFAULT 0,
    "due_date" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "personalized_welcome" JSONB,
    "personalized_sequence" JSONB,
    "personalization_overlays" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EVENTS & AI INTERACTIONS
-- ============================================

CREATE TABLE "learning_events" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
    "course_id" UUID REFERENCES "courses"("id"),
    "module_id" UUID REFERENCES "modules"("id"),
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "modality" TEXT,
    "duration_secs" INT,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "ai_interactions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
    "course_id" UUID REFERENCES "courses"("id"),
    "module_id" UUID REFERENCES "modules"("id"),
    "interaction_type" TEXT NOT NULL,
    "user_message" TEXT,
    "ai_response" TEXT,
    "context_used" JSONB,
    "helpful" BOOLEAN,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CERTIFICATIONS & COMPLIANCE
-- ============================================

CREATE TABLE "certifications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
    "path_id" UUID NOT NULL REFERENCES "learning_paths"("id"),
    "issued_at" TIMESTAMPTZ DEFAULT now(),
    "expires_at" TIMESTAMPTZ,
    "certificate_url" TEXT,
    "verification_code" TEXT UNIQUE,
    "recipient_name" TEXT,
    "path_title" TEXT,
    "org_name" TEXT
);

CREATE TABLE "compliance_records" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organisations"("id"),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
    "course_id" UUID NOT NULL REFERENCES "courses"("id"),
    "required_by" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "status" TEXT DEFAULT 'pending',
    "reminder_sent_at" TIMESTAMPTZ
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_profiles_org_id ON "profiles"("org_id");
CREATE INDEX idx_org_members_org_id ON "org_members"("org_id");
CREATE INDEX idx_org_members_user_id ON "org_members"("user_id");
CREATE INDEX idx_learner_groups_org_id ON "learner_groups"("org_id");
CREATE INDEX idx_courses_org_id ON "courses"("org_id");
CREATE INDEX idx_modules_course_id ON "modules"("course_id");
CREATE INDEX idx_learning_events_user_id ON "learning_events"("user_id");
CREATE INDEX idx_learning_events_course_id ON "learning_events"("course_id");
CREATE INDEX idx_ai_interactions_user_id ON "ai_interactions"("user_id");
CREATE INDEX idx_enrollments_user_id ON "enrollments"("user_id");
CREATE INDEX idx_course_org_tags_org_tag_id ON "course_org_tags"("org_tag_id");

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE "organisations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "org_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_interactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learner_profiles" ENABLE ROW LEVEL SECURITY;

-- Basic policy: users can read their own profile
CREATE POLICY "Users can read own profile" ON "profiles"
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON "profiles"
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Service role has full access (for backend operations)
CREATE POLICY "Service role full access on profiles" ON "profiles"
    FOR ALL USING (auth.role() = 'service_role');

-- Similar policies for other tables can be added as needed

COMMIT;
