export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ecosystem_profiles: {
        Row: {
          challenges: string[] | null
          created_at: string
          cultural_background: string | null
          daily_routine: Json | null
          family_id: string
          goals: string[] | null
          id: string
          notes: string | null
          parenting_style: string | null
          support_network: string | null
          tech_usage: string | null
          updated_at: string
          values_summary: string | null
        }
        Insert: {
          challenges?: string[] | null
          created_at?: string
          cultural_background?: string | null
          daily_routine?: Json | null
          family_id: string
          goals?: string[] | null
          id?: string
          notes?: string | null
          parenting_style?: string | null
          support_network?: string | null
          tech_usage?: string | null
          updated_at?: string
          values_summary?: string | null
        }
        Update: {
          challenges?: string[] | null
          created_at?: string
          cultural_background?: string | null
          daily_routine?: Json | null
          family_id?: string
          goals?: string[] | null
          id?: string
          notes?: string | null
          parenting_style?: string | null
          support_network?: string | null
          tech_usage?: string | null
          updated_at?: string
          values_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: true
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          family_motto: string | null
          family_name: string | null
          family_photo_url: string | null
          household_languages: string[] | null
          household_size: number | null
          id: string
          postal_code: string | null
          primary_email: string | null
          primary_phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          family_motto?: string | null
          family_name?: string | null
          family_photo_url?: string | null
          household_languages?: string[] | null
          household_size?: number | null
          id?: string
          postal_code?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          family_motto?: string | null
          family_name?: string | null
          family_photo_url?: string | null
          household_languages?: string[] | null
          household_size?: number | null
          id?: string
          postal_code?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_goals: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          family_id: string
          id: string
          progress_notes: Json
          status: string
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          family_id: string
          id?: string
          progress_notes?: Json
          status?: string
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          family_id?: string
          id?: string
          progress_notes?: Json
          status?: string
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "family_goals_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          family_id: string
          id: string
          relation: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          relation: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          relation?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "hub_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "hub_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_articles: {
        Row: {
          author: string | null
          canonical_url: string | null
          category: string
          content: string
          content_json: Json | null
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          hero_image_url: string | null
          id: string
          is_featured: boolean
          og_image_url: string | null
          publish_at: string
          reading_minutes: number
          scheduled_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author?: string | null
          canonical_url?: string | null
          category: string
          content?: string
          content_json?: Json | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          og_image_url?: string | null
          publish_at?: string
          reading_minutes?: number
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author?: string | null
          canonical_url?: string | null
          category?: string
          content?: string
          content_json?: Json | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          og_image_url?: string | null
          publish_at?: string
          reading_minutes?: number
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      hub_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      hub_newsletter_subscribers: {
        Row: {
          confirmed: boolean
          created_at: string
          email: string
          id: string
          source: string | null
          subscribed_at: string
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          email: string
          id?: string
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      hub_podcast_episodes: {
        Row: {
          apple_url: string | null
          audio_url: string | null
          category: string
          cover_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          episode_number: number | null
          id: string
          is_featured: boolean
          publish_at: string
          slug: string
          spotify_url: string | null
          status: string
          title: string
          transcript: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          apple_url?: string | null
          audio_url?: string | null
          category: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          id?: string
          is_featured?: boolean
          publish_at?: string
          slug: string
          spotify_url?: string | null
          status?: string
          title: string
          transcript?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          apple_url?: string | null
          audio_url?: string | null
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          id?: string
          is_featured?: boolean
          publish_at?: string
          slug?: string
          spotify_url?: string | null
          status?: string
          title?: string
          transcript?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      hub_reading_history: {
        Row: {
          completed: boolean
          id: string
          item_id: string
          item_type: string
          last_viewed_at: string
          progress: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          id?: string
          item_id: string
          item_type: string
          last_viewed_at?: string
          progress?: number
          user_id: string
        }
        Update: {
          completed?: boolean
          id?: string
          item_id?: string
          item_type?: string
          last_viewed_at?: string
          progress?: number
          user_id?: string
        }
        Relationships: []
      }
      hub_resources: {
        Row: {
          age_group: string | null
          category: string
          created_at: string
          description: string | null
          download_count: number
          file_type: string | null
          file_url: string | null
          id: string
          publish_at: string
          resource_type: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          category: string
          created_at?: string
          description?: string | null
          download_count?: number
          file_type?: string | null
          file_url?: string | null
          id?: string
          publish_at?: string
          resource_type?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          category?: string
          created_at?: string
          description?: string | null
          download_count?: number
          file_type?: string | null
          file_url?: string | null
          id?: string
          publish_at?: string
          resource_type?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hub_saved_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      hub_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      instructor_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invited_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructor_profiles: {
        Row: {
          bio: string | null
          created_at: string
          specialties: string[]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          specialties?: string[]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          specialties?: string[]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      living_tree_entries: {
        Row: {
          attachments: Json
          author_user_id: string | null
          content: Json
          created_at: string
          description: string | null
          entry_type: string
          family_id: string
          id: string
          occurred_on: string
          student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          author_user_id?: string | null
          content?: Json
          created_at?: string
          description?: string | null
          entry_type: string
          family_id: string
          id?: string
          occurred_on?: string
          student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          author_user_id?: string | null
          content?: Json
          created_at?: string
          description?: string | null
          entry_type?: string
          family_id?: string
          id?: string
          occurred_on?: string
          student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "living_tree_entries_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "living_tree_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_status: {
        Row: {
          completed_at: string | null
          completed_steps: string[]
          current_step: number
          family_id: string | null
          id: string
          journey: string
          started_at: string
          status: string
          student_id: string | null
          total_steps: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[]
          current_step?: number
          family_id?: string | null
          id?: string
          journey: string
          started_at?: string
          status?: string
          student_id?: string | null
          total_steps: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[]
          current_step?: number
          family_id?: string | null
          id?: string
          journey?: string
          started_at?: string
          status?: string
          student_id?: string | null
          total_steps?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_status_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_status_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_responses: {
        Row: {
          answer: Json
          created_at: string
          family_id: string
          id: string
          parent_id: string | null
          question_key: string
          step_key: string
        }
        Insert: {
          answer: Json
          created_at?: string
          family_id: string
          id?: string
          parent_id?: string | null
          question_key: string
          step_key: string
        }
        Update: {
          answer?: Json
          created_at?: string
          family_id?: string
          id?: string
          parent_id?: string | null
          question_key?: string
          step_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_responses_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_responses_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          created_at: string
          education_level: string | null
          email: string | null
          family_id: string
          full_name: string
          id: string
          is_primary: boolean
          occupation: string | null
          phone: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          education_level?: string | null
          email?: string | null
          family_id: string
          full_name: string
          id?: string
          is_primary?: boolean
          occupation?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          education_level?: string | null
          email?: string | null
          family_id?: string
          full_name?: string
          id?: string
          is_primary?: boolean
          occupation?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parents_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          notification_prefs: Json
          phone: string | null
          preferred_name: string | null
          primary_role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          notification_prefs?: Json
          phone?: string | null
          preferred_name?: string | null
          primary_role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          notification_prefs?: Json
          phone?: string | null
          preferred_name?: string | null
          primary_role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_responses: {
        Row: {
          answer: Json
          created_at: string
          id: string
          question_key: string
          step_key: string
          student_id: string
        }
        Insert: {
          answer: Json
          created_at?: string
          id?: string
          question_key: string
          step_key: string
          student_id: string
        }
        Update: {
          answer?: Json
          created_at?: string
          id?: string
          question_key?: string
          step_key?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          date_of_birth: string | null
          family_id: string | null
          full_name: string
          grade_level: string | null
          id: string
          learning_style: string | null
          preferred_subjects: string[] | null
          school_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          family_id?: string | null
          full_name: string
          grade_level?: string | null
          id?: string
          learning_style?: string | null
          preferred_subjects?: string[] | null
          school_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          family_id?: string | null
          full_name?: string
          grade_level?: string | null
          id?: string
          learning_style?: string | null
          preferred_subjects?: string[] | null
          school_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_primary_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      claim_instructor_invitation: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_article_view: {
        Args: { _article_id: string }
        Returns: undefined
      }
      increment_download: { Args: { _resource_id: string }; Returns: undefined }
      is_family_member: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      subscribe_to_newsletter: {
        Args: { _email: string; _source?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "editor"
        | "member"
        | "parent"
        | "student"
        | "instructor"
        | "administrator"
        | "mentor"
        | "wellness_practitioner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "editor",
        "member",
        "parent",
        "student",
        "instructor",
        "administrator",
        "mentor",
        "wellness_practitioner",
      ],
    },
  },
} as const
