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
      org_members: {
        Row: { id: string; org_id: string; user_id: string; role: string; joined_at: string }
        Insert: { id?: string; org_id: string; user_id: string; role?: string; joined_at?: string }
        Update: { org_id?: string; user_id?: string; role?: string; joined_at?: string }
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
      lms_identity_links: {
        Row: {
          id: string
          org_id: string
          provider: string
          external_user_id: string
          external_email: string | null
          sudar_user_id: string
          created_at: string
          revoked_at: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          org_id: string
          provider?: string
          external_user_id: string
          external_email?: string | null
          sudar_user_id: string
          created_at?: string
          revoked_at?: string | null
          metadata?: Json
        }
        Update: {
          org_id?: string
          provider?: string
          external_user_id?: string
          external_email?: string | null
          sudar_user_id?: string
          revoked_at?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      lti_platform_deployments: {
        Row: {
          id: string
          org_id: string
          issuer: string
          client_id: string
          deployment_id: string
          platform_jwks_uri: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          issuer: string
          client_id: string
          deployment_id: string
          platform_jwks_uri: string
          created_at?: string
        }
        Update: {
          org_id?: string
          issuer?: string
          client_id?: string
          deployment_id?: string
          platform_jwks_uri?: string
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
        Relationships: [
          {
            foreignKeyName: 'modules_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: 'enrollments_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'enrollments_path_id_fkey'
            columns: ['path_id']
            isOneToOne: false
            referencedRelation: 'learning_paths'
            referencedColumns: ['id']
          },
        ]
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
      audit_events: {
        Row: {
          id: string
          org_id: string | null
          actor_user_id: string
          action: string
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          actor_user_id: string
          action: string
          payload?: Json
          created_at?: string
        }
        Update: {
          payload?: Json
        }
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
      agent_runs: {
        Row: {
          id: string
          org_id: string
          actor_user_id: string
          subject_user_id: string | null
          team: string
          goal: string
          goal_kind: string
          status: string
          plan: Json
          tool_calls: Json
          artifact: Json | null
          policy_pack_id: string
          error: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          actor_user_id: string
          subject_user_id?: string | null
          team: string
          goal?: string
          goal_kind?: string
          status?: string
          plan?: Json
          tool_calls?: Json
          artifact?: Json | null
          policy_pack_id?: string
          error?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          status?: string
          plan?: Json
          tool_calls?: Json
          artifact?: Json | null
          error?: string | null
          completed_at?: string | null
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
          is_adaptive: boolean
          is_mandatory: boolean
          issues_certificate: boolean
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
          is_adaptive?: boolean
          is_mandatory?: boolean
          issues_certificate?: boolean
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
          is_adaptive?: boolean
          is_mandatory?: boolean
          issues_certificate?: boolean
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
          recipient_name: string | null
          path_title: string | null
          org_name: string | null
        }
        Insert: {
          id?: string
          user_id: string
          path_id: string
          issued_at?: string
          expires_at?: string | null
          certificate_url?: string | null
          verification_code?: string | null
          recipient_name?: string | null
          path_title?: string | null
          org_name?: string | null
        }
        Update: {
          expires_at?: string | null
          certificate_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'certifications_path_id_fkey'
            columns: ['path_id']
            isOneToOne: false
            referencedRelation: 'learning_paths'
            referencedColumns: ['id']
          },
        ]
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
      notification_categories: {
        Row: {
          slug: string
          title: string
          description: string
          default_channels: string[]
          is_mandatory_for_orgs: boolean
          rate_cap_per_day: number
          allow_quiet_hours: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          slug: string
          title: string
          description: string
          default_channels?: string[]
          is_mandatory_for_orgs?: boolean
          rate_cap_per_day?: number
          allow_quiet_hours?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          default_channels?: string[]
          is_mandatory_for_orgs?: boolean
          rate_cap_per_day?: number
          allow_quiet_hours?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          category_slug: string
          channel: string
          enabled: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_slug: string
          channel: string
          enabled?: boolean
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          user_id: string
          quiet_hours_start: string | null
          quiet_hours_end: string | null
          timezone: string
          locale: string
          daily_digest_email: boolean
          frequency_mode: string
          coin_opt_in_awarded_at: string | null
          last_monthly_bonus_at: string | null
          last_revoke_at: string | null
          never_prompt_push: boolean
          push_prompt_snooze_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          timezone?: string
          locale?: string
          daily_digest_email?: boolean
          frequency_mode?: string
          coin_opt_in_awarded_at?: string | null
          last_monthly_bonus_at?: string | null
          last_revoke_at?: string | null
          never_prompt_push?: boolean
          push_prompt_snooze_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          timezone?: string
          locale?: string
          daily_digest_email?: boolean
          frequency_mode?: string
          coin_opt_in_awarded_at?: string | null
          last_monthly_bonus_at?: string | null
          last_revoke_at?: string | null
          never_prompt_push?: boolean
          push_prompt_snooze_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_channels: {
        Row: {
          id: string
          user_id: string
          channel: string
          endpoint_hash: string
          endpoint_payload: Json
          user_agent: string | null
          created_at: string
          last_seen_at: string | null
          revoked_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          channel: string
          endpoint_hash: string
          endpoint_payload?: Json
          user_agent?: string | null
          created_at?: string
          last_seen_at?: string | null
          revoked_at?: string | null
        }
        Update: {
          endpoint_payload?: Json
          user_agent?: string | null
          last_seen_at?: string | null
          revoked_at?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          id: string
          org_id: string | null
          slug: string
          category_slug: string
          title_mustache: string
          body_mustache: string | null
          cta_label: string | null
          cta_url_mustache: string | null
          branding: Json
          channels: string[]
          locale: string
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          slug: string
          category_slug: string
          title_mustache: string
          body_mustache?: string | null
          cta_label?: string | null
          cta_url_mustache?: string | null
          branding?: Json
          channels?: string[]
          locale?: string
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title_mustache?: string
          body_mustache?: string | null
          cta_label?: string | null
          cta_url_mustache?: string | null
          branding?: Json
          channels?: string[]
          locale?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notification_campaigns: {
        Row: {
          id: string
          org_id: string
          template_id: string
          audience_filter: Json
          schedule_rule: Json
          status: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          template_id: string
          audience_filter?: Json
          schedule_rule?: Json
          status?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          schedule_rule?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_delivery_log: {
        Row: {
          id: string
          user_id: string
          notification_id: string | null
          template_id: string | null
          category_slug: string
          channel: string
          status: string
          suppression_reason: string | null
          scheduled_send_at: string | null
          sent_at: string | null
          opened_at: string | null
          clicked_at: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_id?: string | null
          template_id?: string | null
          category_slug: string
          channel: string
          status?: string
          suppression_reason?: string | null
          scheduled_send_at?: string | null
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          status?: string
          suppression_reason?: string | null
          scheduled_send_at?: string | null
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          metadata?: Json
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
