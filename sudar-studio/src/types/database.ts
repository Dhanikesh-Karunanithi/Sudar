// Sudar — Supabase Database Types
// Stub until: npx supabase gen types typescript --project-id qnsrrboprydmjyormlky
// These types mirror the Prisma schema in prisma/schema.prisma

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: Database['public']['Enums']['role']
          org_id: string | null
          onboarding_complete: boolean
          require_password_change: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: Database['public']['Enums']['role']
          org_id?: string | null
          onboarding_complete?: boolean
          require_password_change?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          role?: Database['public']['Enums']['role']
          org_id?: string | null
          onboarding_complete?: boolean
          require_password_change?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      org_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: Database['public']['Enums']['org_role']
          joined_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role?: Database['public']['Enums']['org_role']
          joined_at?: string
        }
        Update: {
          org_id?: string
          user_id?: string
          role?: Database['public']['Enums']['org_role']
          joined_at?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          id: string
          name: string
          slug: string
          branding: Json | null
          settings: Json | null
          plan: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          branding?: Json | null
          settings?: Json | null
          plan?: string
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          branding?: Json | null
          settings?: Json | null
          plan?: string
        }
        Relationships: []
      }
      org_invites: {
        Row: {
          id: string
          org_id: string
          email: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          email: string
          role?: string
          created_at?: string
        }
        Update: {
          org_id?: string
          email?: string
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      integration_api_keys: {
        Row: {
          id: string
          org_id: string
          name: string
          key_hash: string
          key_prefix: string
          created_at: string
          last_used_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          key_hash: string
          key_prefix: string
          created_at?: string
          last_used_at?: string | null
        }
        Update: {
          org_id?: string
          name?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
        }
        Relationships: []
      }
      learner_profiles: {
        Row: {
          id: string
          user_id: string
          modality_scores: Json
          learning_pace: string
          difficulty_comfort: string
          cognitive_style: string
          preferred_language: string
          avg_session_duration_mins: number
          avg_completion_rate: number
          total_learning_minutes: number
          streak_days: number
          last_active_at: string | null
          overall_engagement_score: number
          next_best_action: Json | null
          ai_tutor_context: Json | null
          generative_ai_consent_at: string | null
          coin_balance: number
          xp_total: number
          scholar_level: number
          scholar_title: string
          profile_completeness_pct: number
          total_checkins_answered: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          modality_scores?: Json
          learning_pace?: string
          difficulty_comfort?: string
          cognitive_style?: string
          preferred_language?: string
          avg_session_duration_mins?: number
          avg_completion_rate?: number
          total_learning_minutes?: number
          streak_days?: number
          last_active_at?: string | null
          overall_engagement_score?: number
          next_best_action?: Json | null
          ai_tutor_context?: Json | null
          generative_ai_consent_at?: string | null
          coin_balance?: number
          xp_total?: number
          scholar_level?: number
          scholar_title?: string
          profile_completeness_pct?: number
          total_checkins_answered?: number
          updated_at?: string
        }
        Update: {
          modality_scores?: Json
          learning_pace?: string
          difficulty_comfort?: string
          cognitive_style?: string
          preferred_language?: string
          avg_session_duration_mins?: number
          avg_completion_rate?: number
          total_learning_minutes?: number
          streak_days?: number
          last_active_at?: string | null
          overall_engagement_score?: number
          next_best_action?: Json | null
          ai_tutor_context?: Json | null
          generative_ai_consent_at?: string | null
          coin_balance?: number
          xp_total?: number
          scholar_level?: number
          scholar_title?: string
          profile_completeness_pct?: number
          total_checkins_answered?: number
          updated_at?: string
        }
        Relationships: []
      }
      coin_ledger: {
        Row: {
          id: string
          user_id: string
          amount: number
          event_type: string
          reference_id: string | null
          balance_after: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          event_type: string
          reference_id?: string | null
          balance_after: number
          metadata?: Json | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      org_challenges: {
        Row: {
          id: string
          org_id: string
          title: string
          description: string | null
          challenge_type: string
          target_config: Json
          coin_prize: number
          start_at: string
          end_at: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          description?: string | null
          challenge_type?: string
          target_config?: Json
          coin_prize?: number
          start_at: string
          end_at: string
          created_by: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          coin_prize?: number
          end_at?: string
        }
        Relationships: []
      }
      org_challenge_progress: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          contribution: Json
          completed_at: string | null
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          contribution?: Json
          completed_at?: string | null
        }
        Update: {
          contribution?: Json
          completed_at?: string | null
        }
        Relationships: []
      }
      learner_performance_records: {
        Row: {
          id: string
          org_id: string
          user_id: string
          source_type: string
          key: string
          value: number
          value_display: string | null
          period_start: string | null
          period_end: string | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          source_type: string
          key: string
          value: number
          value_display?: string | null
          period_start?: string | null
          period_end?: string | null
          recorded_at?: string
          created_at?: string
        }
        Update: {
          org_id?: string
          user_id?: string
          source_type?: string
          key?: string
          value?: number
          value_display?: string | null
          period_start?: string | null
          period_end?: string | null
          recorded_at?: string
        }
        Relationships: []
      }
      tag_groups: {
        Row: {
          id: string
          org_id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      org_tags: {
        Row: {
          id: string
          org_id: string
          group_id: string | null
          slug: string
          label: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          group_id?: string | null
          slug: string
          label: string
          created_at?: string
        }
        Update: {
          group_id?: string | null
          slug?: string
          label?: string
        }
        Relationships: []
      }
      course_org_tags: {
        Row: {
          course_id: string
          org_tag_id: string
          created_at: string
        }
        Insert: {
          course_id: string
          org_tag_id: string
          created_at?: string
        }
        Update: {
          created_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          org_id: string
          created_by: string
          title: string
          description: string | null
          thumbnail_url: string | null
          banner_url: string | null
          status: string
          template: string | null
          difficulty: string | null
          estimated_duration_mins: number | null
          target_skills: Json | null
          tags: string[]
          scorm_url: string | null
          settings: Json | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          created_by: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          banner_url?: string | null
          status?: string
          template?: string | null
          difficulty?: string | null
          estimated_duration_mins?: number | null
          target_skills?: Json | null
          tags?: string[]
          scorm_url?: string | null
          settings?: Json | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          banner_url?: string | null
          status?: string
          template?: string | null
          difficulty?: string | null
          estimated_duration_mins?: number | null
          target_skills?: Json | null
          tags?: string[]
          scorm_url?: string | null
          settings?: Json | null
          published_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          content: Json
          modality_variants: Json | null
          order_index: number
          quiz: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          content: Json
          modality_variants?: Json | null
          order_index: number
          quiz?: Json | null
          created_at?: string
        }
        Update: {
          title?: string
          content?: Json
          modality_variants?: Json | null
          order_index?: number
          quiz?: Json | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          path_id: string | null
          course_id: string | null
          enrolled_by: string | null
          status: string
          progress_pct: number
          due_date: string | null
          started_at: string | null
          completed_at: string | null
          personalized_welcome: Json | null
          personalized_sequence: Json | null
          personalization_overlays: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          path_id?: string | null
          course_id?: string | null
          enrolled_by?: string | null
          status?: string
          progress_pct?: number
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          personalized_welcome?: Json | null
          personalized_sequence?: Json | null
          personalization_overlays?: Json | null
          created_at?: string
        }
        Update: {
          status?: string
          progress_pct?: number
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          personalized_welcome?: Json | null
          personalization_overlays?: Json | null
        }
        Relationships: []
      }
      learner_groups: {
        Row: {
          id: string
          org_id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
        }
        Relationships: []
      }
      learner_group_members: {
        Row: {
          group_id: string
          user_id: string
        }
        Insert: {
          group_id: string
          user_id: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      learning_events: {
        Row: {
          id: string
          user_id: string
          course_id: string | null
          module_id: string | null
          event_type: string
          payload: Json | null
          modality: string | null
          duration_secs: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id?: string | null
          module_id?: string | null
          event_type: string
          payload?: Json | null
          modality?: string | null
          duration_secs?: number | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      ai_interactions: {
        Row: {
          id: string
          user_id: string
          course_id: string | null
          module_id: string | null
          interaction_type: string
          user_message: string | null
          ai_response: string | null
          context_used: Json | null
          helpful: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id?: string | null
          module_id?: string | null
          interaction_type: string
          user_message?: string | null
          ai_response?: string | null
          context_used?: Json | null
          helpful?: boolean | null
          created_at?: string
        }
        Update: {
          helpful?: boolean | null
        }
        Relationships: []
      }
      learning_paths: {
        Row: {
          id: string
          org_id: string
          created_by: string
          title: string
          description: string | null
          thumbnail_url: string | null
          status: string
          courses: Json
          target_skills: Json | null
          certification_config: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          created_by: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          status?: string
          courses: Json
          target_skills?: Json | null
          certification_config?: Json | null
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          status?: string
          courses?: Json
          target_skills?: Json | null
          certification_config?: Json | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          name: string
          slug: string
          category: string | null
          parent_skill_id: string | null
          description: string | null
          org_id: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          category?: string | null
          parent_skill_id?: string | null
          description?: string | null
          org_id?: string | null
        }
        Update: {
          name?: string
          slug?: string
          category?: string | null
          parent_skill_id?: string | null
          description?: string | null
          org_id?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          id: string
          user_id: string
          path_id: string
          issued_at: string
          expires_at: string | null
          certificate_url: string | null
          verification_code: string | null
        }
        Insert: {
          id?: string
          user_id: string
          path_id: string
          issued_at?: string
          expires_at?: string | null
          certificate_url?: string | null
          verification_code?: string | null
        }
        Update: {
          expires_at?: string | null
          certificate_url?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER'
      org_role: 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER'
    }
    CompositeTypes: Record<string, never>
  }
}
