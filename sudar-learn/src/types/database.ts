// Sudar — Supabase Database Types (shared with sudar-studio)
// Stub until: npx supabase gen types typescript --project-id qnsrrboprydmjyormlky

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
      org_invites: {
        Row: { id: string; org_id: string; email: string; role: string; created_at: string }
        Insert: { id?: string; org_id: string; email: string; role?: string; created_at?: string }
        Update: { org_id?: string; email?: string; role?: string; created_at?: string }
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
          updated_at: string
          // Gamification fields
          coin_balance: number
          xp_total: number
          scholar_level: number
          scholar_title: string
          profile_completeness_pct: number
          total_checkins_answered: number
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
          updated_at?: string
          coin_balance?: number
          xp_total?: number
          scholar_level?: number
          scholar_title?: string
          profile_completeness_pct?: number
          total_checkins_answered?: number
        }
        Update: {
          modality_scores?: Json
          learning_pace?: string
          difficulty_comfort?: string
          overall_engagement_score?: number
          next_best_action?: Json | null
          ai_tutor_context?: Json | null
          generative_ai_consent_at?: string | null
          updated_at?: string
          coin_balance?: number
          xp_total?: number
          scholar_level?: number
          scholar_title?: string
          profile_completeness_pct?: number
          total_checkins_answered?: number
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
      xp_ledger: {
        Row: {
          id: string
          user_id: string
          amount: number
          source_type: string
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          source_type: string
          reference_id?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      achievements: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          flavor_text: string | null
          icon_key: string
          category: string
          xp_reward: number
          coin_reward: number
          rarity: string
          trigger_type: string
          trigger_config: Json
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description: string
          flavor_text?: string | null
          icon_key?: string
          category: string
          xp_reward?: number
          coin_reward?: number
          rarity?: string
          trigger_type: string
          trigger_config?: Json
          created_at?: string
        }
        Update: {
          title?: string
          description?: string
          flavor_text?: string | null
          icon_key?: string
          xp_reward?: number
          coin_reward?: number
          rarity?: string
        }
        Relationships: []
      }
      learner_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string
          notified: boolean
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          unlocked_at?: string
          notified?: boolean
        }
        Update: {
          notified?: boolean
        }
        Relationships: []
      }
      quests: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          quest_type: string
          steps: Json
          coin_reward: number
          xp_reward: number
          available_from: string | null
          available_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description: string
          quest_type?: string
          steps?: Json
          coin_reward?: number
          xp_reward?: number
          available_from?: string | null
          available_to?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          description?: string
          steps?: Json
          coin_reward?: number
          xp_reward?: number
        }
        Relationships: []
      }
      learner_quests: {
        Row: {
          id: string
          user_id: string
          quest_id: string
          org_id: string | null
          status: string
          progress: Json
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          quest_id: string
          org_id?: string | null
          status?: string
          progress?: Json
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          status?: string
          progress?: Json
          completed_at?: string | null
        }
        Relationships: []
      }
      reward_catalog: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          category: string
          cost_coins: number
          metadata: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description: string
          category: string
          cost_coins: number
          metadata?: Json
          is_active?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          description?: string
          cost_coins?: number
          metadata?: Json
          is_active?: boolean
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          id: string
          user_id: string
          reward_id: string
          cost_coins: number
          redeemed_at: string
          applied: boolean
        }
        Insert: {
          id?: string
          user_id: string
          reward_id: string
          cost_coins: number
          redeemed_at?: string
          applied?: boolean
        }
        Update: { applied?: boolean }
        Relationships: []
      }
      checkin_questions: {
        Row: {
          id: string
          question_text: string
          answer_type: string
          options: Json | null
          signal_key: string
          category: string
          weight: number
          is_org_only: boolean
          created_at: string
        }
        Insert: {
          id?: string
          question_text: string
          answer_type?: string
          options?: Json | null
          signal_key: string
          category: string
          weight?: number
          is_org_only?: boolean
          created_at?: string
        }
        Update: {
          question_text?: string
          weight?: number
          is_org_only?: boolean
        }
        Relationships: []
      }
      checkin_responses: {
        Row: {
          id: string
          user_id: string
          question_id: string
          answer_value: Json
          coin_reward: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          answer_value: Json
          coin_reward?: number
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
          is_adaptive: boolean
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
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          status?: string
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
          order_index: number
          modality_variants?: Json | null
          quiz?: Json | null
        }
        Update: {
          title?: string
          content?: Json
          order_index?: number
          modality_variants?: Json | null
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
          personalized_welcome?: Json | null
          personalized_sequence?: Json | null
          personalization_overlays?: Json | null
        }
        Update: {
          status?: string
          progress_pct?: number
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
        }
        Update: {
          helpful?: boolean | null
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
        }
        Relationships: []
      }
      learner_skills: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          proficiency_level: number
          evidence_count: number
          last_assessed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
          proficiency_level?: number
          evidence_count?: number
          last_assessed_at?: string | null
        }
        Update: {
          proficiency_level?: number
          evidence_count?: number
          last_assessed_at?: string | null
        }
        Relationships: []
      }
      skill_gaps: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          gap_score: number | null
          identified_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
          gap_score?: number | null
          identified_at?: string
          resolved_at?: string | null
        }
        Update: {
          gap_score?: number | null
          resolved_at?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          id: string
          user_id: string
          category: string
          title: string
          body: string | null
          link_url: string | null
          metadata: Json
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          title: string
          body?: string | null
          link_url?: string | null
          metadata?: Json
          read_at?: string | null
          created_at?: string
        }
        Update: {
          read_at?: string | null
        }
        Relationships: []
      }
      content_chunks: {
        Row: {
          id: string
          course_id: string | null
          module_id: string | null
          chunk_index: number
          chunk_type: string
          content: string
          embedding: unknown
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          course_id?: string | null
          module_id?: string | null
          chunk_index?: number
          chunk_type?: string
          content: string
          embedding: number[]
          metadata?: Json
          created_at?: string
        }
        Update: {
          course_id?: string | null
          module_id?: string | null
          chunk_index?: number
          chunk_type?: string
          content?: string
          embedding?: number[]
          metadata?: Json
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
