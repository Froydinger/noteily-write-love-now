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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      note_ai_history: {
        Row: {
          action_type: string
          created_at: string
          id: string
          instruction: string | null
          new_content: string
          new_title: string | null
          note_id: string
          original_content: string
          original_title: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          instruction?: string | null
          new_content: string
          new_title?: string | null
          note_id: string
          original_content: string
          original_title?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          instruction?: string | null
          new_content?: string
          new_title?: string | null
          note_id?: string
          original_content?: string
          original_title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          deleted_at: string | null
          featured_image: string | null
          id: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          featured_image?: string | null
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          featured_image?: string | null
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          from_user_email: string | null
          id: string
          message: string
          note_id: string | null
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_user_email?: string | null
          id?: string
          message: string
          note_id?: string | null
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_user_email?: string | null
          id?: string
          message?: string
          note_id?: string | null
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_notes: {
        Row: {
          created_at: string
          id: string
          note_id: string
          owner_id: string
          permission: string
          shared_with_email: string | null
          shared_with_user_id: string | null
          shared_with_username: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          owner_id: string
          permission: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
          shared_with_username?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          owner_id?: string
          permission?: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
          shared_with_username?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_notes_audit: {
        Row: {
          accessed_email: string | null
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          shared_note_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_email?: string | null
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          shared_note_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_email?: string | null
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          shared_note_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          ai_enabled: boolean | null
          body_font: string | null
          created_at: string
          daily_prompt_time: string | null
          email: string | null
          id: string
          notification_daily_prompt: boolean | null
          notification_note_shared: boolean | null
          notification_note_updated: boolean | null
          theme: string
          title_font: string | null
          updated_at: string
          user_id: string
          username: string | null
          username_prompt_last_shown: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          body_font?: string | null
          created_at?: string
          daily_prompt_time?: string | null
          email?: string | null
          id?: string
          notification_daily_prompt?: boolean | null
          notification_note_shared?: boolean | null
          notification_note_updated?: boolean | null
          theme?: string
          title_font?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          username_prompt_last_shown?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          body_font?: string | null
          created_at?: string
          daily_prompt_time?: string | null
          email?: string | null
          id?: string
          notification_daily_prompt?: boolean | null
          notification_note_shared?: boolean | null
          notification_note_updated?: boolean | null
          theme?: string
          title_font?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          username_prompt_last_shown?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_preferences_public: {
        Row: {
          created_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_share_with_user_link: {
        Args: {
          p_note_id: string
          p_owner_id: string
          p_permission: string
          p_shared_with_email_or_username: string
        }
        Returns: string
      }
      check_identifier_exists: {
        Args: { p_identifier: string }
        Returns: boolean
      }
      check_username_available_for_user: {
        Args: { p_user_email: string; p_username: string }
        Returns: boolean
      }
      check_username_exists: {
        Args: { p_username: string }
        Returns: boolean
      }
      cleanup_old_deleted_notes: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_secure_share: {
        Args: {
          p_email_or_username: string
          p_note_id: string
          p_permission: string
        }
        Returns: string
      }
      get_note_sharing_info: {
        Args: { note_id_param: string }
        Returns: {
          share_count: number
          user_has_access: boolean
          user_permission: string
        }[]
      }
      get_shared_note_display_info: {
        Args: { share_id: string }
        Returns: {
          display_name: string
          id: string
          is_registered_user: boolean
          note_id: string
          permission: string
        }[]
      }
      get_user_by_identifier: {
        Args: { p_identifier: string }
        Returns: {
          email: string
          has_google_auth: boolean
          user_id: string
          username: string
        }[]
      }
      get_user_email_by_username: {
        Args: { p_username: string }
        Returns: string
      }
      get_user_id_by_username: {
        Args: { p_username: string }
        Returns: string
      }
      is_google_user: {
        Args: { p_identifier: string }
        Returns: boolean
      }
      link_existing_shared_notes: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      permanently_delete_note: {
        Args: { note_id_param: string }
        Returns: boolean
      }
      remove_shared_note_access: {
        Args: { note_id_param: string }
        Returns: boolean
      }
      restore_note: {
        Args: { note_id_param: string }
        Returns: boolean
      }
      soft_delete_note: {
        Args: { note_id_param: string }
        Returns: boolean
      }
      user_has_note_access: {
        Args: { p_note_id: string; p_user_id: string }
        Returns: boolean
      }
      user_has_note_write_access: {
        Args: { p_note_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
