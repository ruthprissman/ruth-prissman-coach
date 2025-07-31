export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          email: string
          id: number
          role: string | null
        }
        Insert: {
          email: string
          id?: number
          role?: string | null
        }
        Update: {
          email?: string
          id?: number
          role?: string | null
        }
        Relationships: []
      }
      article_publications: {
        Row: {
          content_id: number | null
          created_at: string | null
          id: number
          publish_location: string
          published_date: string | null
          scheduled_date: string | null
        }
        Insert: {
          content_id?: number | null
          created_at?: string | null
          id?: number
          publish_location: string
          published_date?: string | null
          scheduled_date?: string | null
        }
        Update: {
          content_id?: number | null
          created_at?: string | null
          id?: number
          publish_location?: string
          published_date?: string | null
          scheduled_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_publications_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "professional_content"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_slots: {
        Row: {
          created_at: string | null
          date: string
          end_time: string
          id: string
          source: string
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          source?: string
          start_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          source?: string
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      content_publish_options: {
        Row: {
          content_id: number | null
          id: number
          publish_location: string
        }
        Insert: {
          content_id?: number | null
          id?: number
          publish_location: string
        }
        Update: {
          content_id?: number | null
          id?: number
          publish_location?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_publish_options_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "professional_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_subscribers: {
        Row: {
          email: string
          first_name: string | null
          id: number
          is_subscribed: boolean | null
          joined_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          first_name?: string | null
          id?: number
          is_subscribed?: boolean | null
          joined_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          first_name?: string | null
          id?: number
          is_subscribed?: boolean | null
          joined_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      content_subscribers_TEST: {
        Row: {
          email: string
          first_name: string | null
          id: number
          is_subscribed: boolean | null
          joined_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          first_name?: string | null
          id?: number
          is_subscribed?: boolean | null
          joined_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          first_name?: string | null
          id?: number
          is_subscribed?: boolean | null
          joined_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          content_id: number | null
          email_template: string
          id: number
          scheduled_send: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          content_id?: number | null
          email_template: string
          id?: number
          scheduled_send?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          content_id?: number | null
          email_template?: string
          id?: number
          scheduled_send?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "professional_content"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          article_id: number | null
          email: string
          id: number
          sent_at: string | null
          status: string
          story_id: number | null
        }
        Insert: {
          article_id?: number | null
          email: string
          id?: number
          sent_at?: string | null
          status: string
          story_id?: number | null
        }
        Update: {
          article_id?: number | null
          email?: string
          id?: number
          sent_at?: string | null
          status?: string
          story_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "professional_content"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          description: string | null
          exercise_name: string
          file_url: string | null
          id: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          exercise_name: string
          file_url?: string | null
          id?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          exercise_name?: string
          file_url?: string | null
          id?: number
        }
        Relationships: []
      }
      faq_questions: {
        Row: {
          answer: string
          category: string
          id: number
          is_active: boolean
          order_index: number
          question: string
        }
        Insert: {
          answer: string
          category: string
          id?: number
          is_active?: boolean
          order_index?: number
          question: string
        }
        Update: {
          answer?: string
          category?: string
          id?: number
          is_active?: boolean
          order_index?: number
          question?: string
        }
        Relationships: []
      }
      finance_categories: {
        Row: {
          id: string
          name: string
          type: string
        }
        Insert: {
          id?: string
          name: string
          type: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      future_sessions: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          meeting_type: string | null
          patient_id: number | null
          session_date: string
          session_type_id: number | null
          status: string | null
          updated_at: string | null
          zoom_link: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          meeting_type?: string | null
          patient_id?: number | null
          session_date: string
          session_type_id?: number | null
          status?: string | null
          updated_at?: string | null
          zoom_link?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          meeting_type?: string | null
          patient_id?: number | null
          session_date?: string
          session_type_id?: number | null
          status?: string | null
          updated_at?: string | null
          zoom_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "future_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "future_sessions_session_type_id_fkey"
            columns: ["session_type_id"]
            isOneToOne: false
            referencedRelation: "session_types"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          email: string | null
          id: number
          name: string
          notes: string | null
          phone: string | null
          session_price: number | null
        }
        Insert: {
          email?: string | null
          id?: number
          name: string
          notes?: string | null
          phone?: string | null
          session_price?: number | null
        }
        Update: {
          email?: string | null
          id?: number
          name?: string
          notes?: string | null
          phone?: string | null
          session_price?: number | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      professional_content: {
        Row: {
          category_id: number | null
          contact_email: string | null
          content_markdown: string
          created_at: string | null
          id: number
          image_url: string | null
          link_email: string | null
          published_at: string | null
          scheduled_publish: string | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
        }
        Insert: {
          category_id?: number | null
          contact_email?: string | null
          content_markdown: string
          created_at?: string | null
          id?: number
          image_url?: string | null
          link_email?: string | null
          published_at?: string | null
          scheduled_publish?: string | null
          title: string
          type?: Database["public"]["Enums"]["content_type"]
        }
        Update: {
          category_id?: number | null
          contact_email?: string | null
          content_markdown?: string
          created_at?: string | null
          id?: number
          image_url?: string | null
          link_email?: string | null
          published_at?: string | null
          scheduled_publish?: string | null
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
        }
        Relationships: [
          {
            foreignKeyName: "professional_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_emails: {
        Row: {
          article_id: number | null
          created_at: string
          error_message: string | null
          html_content: string
          id: string
          recipients: string[]
          scheduled_datetime: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          article_id?: number | null
          created_at?: string
          error_message?: string | null
          html_content: string
          id?: string
          recipients: string[]
          scheduled_datetime: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          article_id?: number | null
          created_at?: string
          error_message?: string | null
          html_content?: string
          id?: string
          recipients?: string[]
          scheduled_datetime?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "professional_content"
            referencedColumns: ["id"]
          },
        ]
      }
      session_types: {
        Row: {
          code: string
          created_at: string | null
          duration_minutes: number
          id: number
          is_default: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          duration_minutes?: number
          id?: number
          is_default?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          duration_minutes?: number
          id?: number
          is_default?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          attachment_urls: string[] | null
          exercise: string | null
          exercise_list: string[] | null
          id: number
          meeting_type: string | null
          paid_amount: number | null
          patient_id: number | null
          payment_date: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_status: string | null
          sent_exercises: boolean | null
          session_date: string | null
          session_type_id: number | null
          summary: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          exercise?: string | null
          exercise_list?: string[] | null
          id?: number
          meeting_type?: string | null
          paid_amount?: number | null
          patient_id?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_status?: string | null
          sent_exercises?: boolean | null
          session_date?: string | null
          session_type_id?: number | null
          summary?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          exercise?: string | null
          exercise_list?: string[] | null
          id?: number
          meeting_type?: string | null
          paid_amount?: number | null
          patient_id?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_status?: string | null
          sent_exercises?: boolean | null
          session_date?: string | null
          session_type_id?: number | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_session_type_id_fkey"
            columns: ["session_type_id"]
            isOneToOne: false
            referencedRelation: "session_types"
            referencedColumns: ["id"]
          },
        ]
      }
      static_links: {
        Row: {
          fixed_text: string | null
          id: number
          list_type: string | null
          name: string
          url: string | null
        }
        Insert: {
          fixed_text?: string | null
          id?: number
          list_type?: string | null
          name: string
          url?: string | null
        }
        Update: {
          fixed_text?: string | null
          id?: number
          list_type?: string | null
          name?: string
          url?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          description: string
          id: number
          image_url: string
          pdf_url: string
          published_at: string | null
          title: string
        }
        Insert: {
          description: string
          id?: number
          image_url: string
          pdf_url: string
          published_at?: string | null
          title: string
        }
        Update: {
          description?: string
          id?: number
          image_url?: string
          pdf_url?: string
          published_at?: string | null
          title?: string
        }
        Relationships: []
      }
      story_subscribers: {
        Row: {
          email: string
          first_name: string | null
          id: number
          is_subscribed: boolean | null
          joined_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          first_name?: string | null
          id?: number
          is_subscribed?: boolean | null
          joined_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          first_name?: string | null
          id?: number
          is_subscribed?: boolean | null
          joined_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string | null
          id: number
          image_url: string | null
          name: string | null
          source_type: string | null
          summary: string
          text_full: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          image_url?: string | null
          name?: string | null
          source_type?: string | null
          summary: string
          text_full?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          image_url?: string | null
          name?: string | null
          source_type?: string | null
          summary?: string
          text_full?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          attachment_url: string | null
          category: string | null
          client_id: number | null
          client_name: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          payment_method: string | null
          receipt_number: string | null
          reference_number: string | null
          session_id: number | null
          source: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category?: string | null
          client_id?: number | null
          client_name?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          payment_method?: string | null
          receipt_number?: string | null
          reference_number?: string | null
          session_id?: number | null
          source?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category?: string | null
          client_id?: number | null
          client_name?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          receipt_number?: string | null
          reference_number?: string | null
          session_id?: number | null
          source?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_type: "article" | "poem" | "humor"
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
      content_type: ["article", "poem", "humor"],
    },
  },
} as const
