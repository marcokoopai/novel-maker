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
      ai_usage_daily: {
        Row: {
          created_at: string
          novel_init_count: number
          updated_at: string
          usage_date: string
          user_id: string
          writing_ai_count: number
        }
        Insert: {
          created_at?: string
          novel_init_count?: number
          updated_at?: string
          usage_date: string
          user_id: string
          writing_ai_count?: number
        }
        Update: {
          created_at?: string
          novel_init_count?: number
          updated_at?: string
          usage_date?: string
          user_id?: string
          writing_ai_count?: number
        }
        Relationships: []
      }
      chapters: {
        Row: {
          content: string
          created_at: string
          id: string
          novel_id: string
          sort_order: number
          status: string
          summary: string
          title: string
          updated_at: string
          word_count: number
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          novel_id: string
          sort_order?: number
          status?: string
          summary?: string
          title: string
          updated_at?: string
          word_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          novel_id?: string
          sort_order?: number
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapters_novel_id_fkey"
            columns: ["novel_id"]
            isOneToOne: false
            referencedRelation: "novels"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: string
          appearance: string
          background: string
          color: string
          created_at: string
          id: string
          name: string
          novel_id: string
          personality: string
          relationships: string
          role: string
          sort_order: number
          speech_style: string
          updated_at: string
        }
        Insert: {
          age?: string
          appearance?: string
          background?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          novel_id: string
          personality?: string
          relationships?: string
          role?: string
          sort_order?: number
          speech_style?: string
          updated_at?: string
        }
        Update: {
          age?: string
          appearance?: string
          background?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          novel_id?: string
          personality?: string
          relationships?: string
          role?: string
          sort_order?: number
          speech_style?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_novel_id_fkey"
            columns: ["novel_id"]
            isOneToOne: false
            referencedRelation: "novels"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          novel_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          kind: string
          novel_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          novel_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_novel_id_fkey"
            columns: ["novel_id"]
            isOneToOne: false
            referencedRelation: "novels"
            referencedColumns: ["id"]
          },
        ]
      }
      novels: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          owner_id: string
          purge_after: string | null
          source_language: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          owner_id: string
          purge_after?: string | null
          source_language?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          purge_after?: string | null
          source_language?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          plan: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          plan?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          plan?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          font_size: number
          lang: string
          line_height: number
          show_ai: boolean
          updated_at: string
          user_id: string
          variant: string
        }
        Insert: {
          created_at?: string
          font_size?: number
          lang?: string
          line_height?: number
          show_ai?: boolean
          updated_at?: string
          user_id: string
          variant?: string
        }
        Update: {
          created_at?: string
          font_size?: number
          lang?: string
          line_height?: number
          show_ai?: boolean
          updated_at?: string
          user_id?: string
          variant?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_novel: { Args: { p_novel_id: string }; Returns: undefined }
      consume_novel_init_quota: {
        Args: never
        Returns: {
          novel_init_count: number
          novel_init_limit: number
          usage_date: string
          writing_ai_count: number
          writing_ai_limit: number
        }[]
      }
      consume_writing_ai_quota: {
        Args: never
        Returns: {
          novel_init_count: number
          novel_init_limit: number
          usage_date: string
          writing_ai_count: number
          writing_ai_limit: number
        }[]
      }
      create_empty_novel: {
        Args: { p_source_language?: string; p_title: string }
        Returns: string
      }
      free_novel_init_limit: { Args: never; Returns: number }
      free_writing_ai_limit: { Args: never; Returns: number }
      get_ai_usage_for_today: {
        Args: never
        Returns: {
          novel_init_count: number
          novel_init_limit: number
          usage_date: string
          writing_ai_count: number
          writing_ai_limit: number
        }[]
      }
      note_title_for_language: {
        Args: { note_kind: string; source_language: string }
        Returns: string
      }
      purge_expired_archived_novels: { Args: never; Returns: number }
      restore_novel: { Args: { p_novel_id: string }; Returns: undefined }
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
