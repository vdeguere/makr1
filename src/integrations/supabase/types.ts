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
      achievements: {
        Row: {
          achievement_key: string
          color: string | null
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string
          display_order: number | null
          icon_name: string
          id: string
          is_active: boolean | null
          name: string
          tier: string | null
        }
        Insert: {
          achievement_key: string
          color?: string | null
          created_at?: string
          criteria_type: string
          criteria_value: number
          description: string
          display_order?: number | null
          icon_name: string
          id?: string
          is_active?: boolean | null
          name: string
          tier?: string | null
        }
        Update: {
          achievement_key?: string
          color?: string | null
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string
          display_order?: number | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          tier?: string | null
        }
        Relationships: []
      }
      adherence_streaks: {
        Row: {
          adherence_rate: number
          current_streak: number
          id: string
          last_check_in_date: string | null
          longest_streak: number
          patient_id: string
          streak_start_date: string | null
          total_check_ins: number
          total_missed: number
          treatment_schedule_id: string | null
          updated_at: string
        }
        Insert: {
          adherence_rate?: number
          current_streak?: number
          id?: string
          last_check_in_date?: string | null
          longest_streak?: number
          patient_id: string
          streak_start_date?: string | null
          total_check_ins?: number
          total_missed?: number
          treatment_schedule_id?: string | null
          updated_at?: string
        }
        Update: {
          adherence_rate?: number
          current_streak?: number
          id?: string
          last_check_in_date?: string | null
          longest_streak?: number
          patient_id?: string
          streak_start_date?: string | null
          total_check_ins?: number
          total_missed?: number
          treatment_schedule_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adherence_streaks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adherence_streaks_treatment_schedule_id_fkey"
            columns: ["treatment_schedule_id"]
            isOneToOne: false
            referencedRelation: "treatment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          patient_id: string | null
          record_id: string | null
          record_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          patient_id?: string | null
          record_id?: string | null
          record_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          patient_id?: string | null
          record_id?: string | null
          record_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      body_marker_types: {
        Row: {
          color: string
          created_at: string | null
          created_by: string | null
          description: string | null
          icon_name: string
          id: string
          is_system_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon_name: string
          id?: string
          is_system_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon_name?: string
          id?: string
          is_system_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          design_config: Json | null
          id: string
          is_default: boolean | null
          name: string
          svg_template: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          design_config?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          svg_template: string
          template_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          design_config?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          svg_template?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      commission_payouts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          practitioner_id: string
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          practitioner_id: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          practitioner_id?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_payouts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payouts_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payouts_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_certificates: {
        Row: {
          certificate_url: string | null
          course_id: string
          enrollment_id: string
          id: string
          issued_at: string
          template_id: string | null
          user_id: string
          verification_code: string
        }
        Insert: {
          certificate_url?: string | null
          course_id: string
          enrollment_id: string
          id?: string
          issued_at?: string
          template_id?: string | null
          user_id: string
          verification_code?: string
        }
        Update: {
          certificate_url?: string | null
          course_id?: string
          enrollment_id?: string
          id?: string
          issued_at?: string
          template_id?: string | null
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          certificate_issued_at: string | null
          completed_at: string | null
          completion_percentage: number | null
          course_id: string
          enrolled_at: string
          id: string
          last_accessed_at: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          certificate_issued_at?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          certificate_issued_at?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id?: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          content_url: string | null
          course_id: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_published: boolean | null
          lesson_type: string | null
          section_id: string | null
          title: string
          transcript: string | null
          updated_at: string
          video_duration_seconds: number | null
        }
        Insert: {
          content_url?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          lesson_type?: string | null
          section_id?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
          video_duration_seconds?: number | null
        }
        Update: {
          content_url?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          lesson_type?: string | null
          section_id?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
          video_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sections: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          certificate_criteria: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          display_order: number | null
          estimated_hours: number | null
          id: string
          instructor_id: string | null
          is_published: boolean | null
          learning_outcomes: Json | null
          prerequisites: Json | null
          preview_video_url: string | null
          requires_certificate: boolean | null
          target_audience: Database["public"]["Enums"]["course_audience"]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          certificate_criteria?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          estimated_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          learning_outcomes?: Json | null
          prerequisites?: Json | null
          preview_video_url?: string | null
          requires_certificate?: boolean | null
          target_audience?: Database["public"]["Enums"]["course_audience"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          certificate_criteria?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          estimated_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          learning_outcomes?: Json | null
          prerequisites?: Json | null
          preview_video_url?: string | null
          requires_certificate?: boolean | null
          target_audience?: Database["public"]["Enums"]["course_audience"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      currency_settings: {
        Row: {
          created_at: string | null
          currency_code: string
          display_name: string
          exchange_rate_to_base: number
          id: string
          is_active: boolean | null
          is_default: boolean | null
          symbol: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency_code: string
          display_name: string
          exchange_rate_to_base?: number
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          symbol: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency_code?: string
          display_name?: string
          exchange_rate_to_base?: number
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dev_role_overrides: {
        Row: {
          active_role: Database["public"]["Enums"]["app_role"]
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_role: Database["public"]["Enums"]["app_role"]
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guest_support_messages: {
        Row: {
          admin_reply: string | null
          chat_history: Json | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_read: boolean | null
          message_body: string
          replied_at: string | null
          replied_by: string | null
          status: string | null
          subject: string
        }
        Insert: {
          admin_reply?: string | null
          chat_history?: Json | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_read?: boolean | null
          message_body: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          admin_reply?: string | null
          chat_history?: Json | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_read?: boolean | null
          message_body?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_support_messages_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      herb_interactions: {
        Row: {
          created_at: string
          description: string
          herb_id_1: string
          herb_id_2: string
          id: string
          interaction_type: string | null
        }
        Insert: {
          created_at?: string
          description: string
          herb_id_1: string
          herb_id_2: string
          id?: string
          interaction_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          herb_id_1?: string
          herb_id_2?: string
          id?: string
          interaction_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "herb_interactions_herb_id_1_fkey"
            columns: ["herb_id_1"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "herb_interactions_herb_id_2_fkey"
            columns: ["herb_id_2"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
        ]
      }
      herbs: {
        Row: {
          average_rating: number | null
          brand: string | null
          category_id: string | null
          certifications: Json | null
          commission_rate: number | null
          contraindications: string | null
          cost_per_unit: number | null
          created_at: string
          description: string | null
          dosage_instructions: string | null
          id: string
          image_url: string | null
          images: Json | null
          name: string
          price_currency: string
          properties: string | null
          retail_price: number | null
          review_count: number | null
          scientific_name: string | null
          stock_quantity: number | null
          subscription_discount_percentage: number | null
          subscription_enabled: boolean | null
          subscription_intervals: Json | null
          supported_currencies: Json | null
          thai_name: string | null
          updated_at: string
        }
        Insert: {
          average_rating?: number | null
          brand?: string | null
          category_id?: string | null
          certifications?: Json | null
          commission_rate?: number | null
          contraindications?: string | null
          cost_per_unit?: number | null
          created_at?: string
          description?: string | null
          dosage_instructions?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          name: string
          price_currency?: string
          properties?: string | null
          retail_price?: number | null
          review_count?: number | null
          scientific_name?: string | null
          stock_quantity?: number | null
          subscription_discount_percentage?: number | null
          subscription_enabled?: boolean | null
          subscription_intervals?: Json | null
          supported_currencies?: Json | null
          thai_name?: string | null
          updated_at?: string
        }
        Update: {
          average_rating?: number | null
          brand?: string | null
          category_id?: string | null
          certifications?: Json | null
          commission_rate?: number | null
          contraindications?: string | null
          cost_per_unit?: number | null
          created_at?: string
          description?: string | null
          dosage_instructions?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          name?: string
          price_currency?: string
          properties?: string | null
          retail_price?: number | null
          review_count?: number | null
          scientific_name?: string | null
          stock_quantity?: number | null
          subscription_discount_percentage?: number | null
          subscription_enabled?: boolean | null
          subscription_intervals?: Json | null
          supported_currencies?: Json | null
          thai_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "herbs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          enrollment_id: string
          id: string
          last_position_seconds: number | null
          lesson_id: string
          notes: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          enrollment_id: string
          id?: string
          last_position_seconds?: number | null
          lesson_id: string
          notes?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          enrollment_id?: string
          id?: string
          last_position_seconds?: number | null
          lesson_id?: string
          notes?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_quizzes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lesson_id: string
          max_attempts: number | null
          passing_score: number | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lesson_id: string
          max_attempts?: number | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string
          max_attempts?: number | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          external_url: string | null
          file_path: string | null
          file_size: number | null
          id: string
          lesson_id: string
          resource_name: string
          resource_type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          external_url?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          lesson_id: string
          resource_name: string
          resource_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          external_url?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          lesson_id?: string
          resource_name?: string
          resource_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      live_meeting_attendees: {
        Row: {
          id: string
          joined_at: string | null
          left_at: string | null
          meeting_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "live_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      live_meetings: {
        Row: {
          allowed_roles: string[] | null
          created_at: string | null
          description: string | null
          host_user_id: string
          id: string
          is_live_now: boolean | null
          is_published: boolean | null
          max_attendees: number | null
          meeting_type: string | null
          recording_url: string | null
          scheduled_end_time: string | null
          scheduled_start_time: string
          stream_platform: string | null
          stream_url: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          created_at?: string | null
          description?: string | null
          host_user_id: string
          id?: string
          is_live_now?: boolean | null
          is_published?: boolean | null
          max_attendees?: number | null
          meeting_type?: string | null
          recording_url?: string | null
          scheduled_end_time?: string | null
          scheduled_start_time: string
          stream_platform?: string | null
          stream_url: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          created_at?: string | null
          description?: string | null
          host_user_id?: string
          id?: string
          is_live_now?: boolean | null
          is_published?: boolean | null
          max_attendees?: number | null
          meeting_type?: string | null
          recording_url?: string | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string
          stream_platform?: string | null
          stream_url?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          actual_delivery_date: string | null
          courier_name: string | null
          courier_tracking_url: string | null
          created_at: string
          currency: string
          estimated_delivery_date: string | null
          exchange_rate: number
          id: string
          notes: string | null
          paid_at: string | null
          parcel_dimensions: Json | null
          patient_id: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          recommendation_id: string
          shipment_weight: number | null
          shipnity_order_id: string | null
          shipped_at: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          actual_delivery_date?: string | null
          courier_name?: string | null
          courier_tracking_url?: string | null
          created_at?: string
          currency?: string
          estimated_delivery_date?: string | null
          exchange_rate?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          parcel_dimensions?: Json | null
          patient_id: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          recommendation_id: string
          shipment_weight?: number | null
          shipnity_order_id?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          actual_delivery_date?: string | null
          courier_name?: string | null
          courier_tracking_url?: string | null
          created_at?: string
          currency?: string
          estimated_delivery_date?: string | null
          exchange_rate?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          parcel_dimensions?: Json | null
          patient_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          recommendation_id?: string
          shipment_weight?: number | null
          shipnity_order_id?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      page_analytics: {
        Row: {
          created_at: string | null
          device_type: string | null
          duration_seconds: number | null
          entry_time: string
          exit_time: string | null
          id: string
          is_bounce: boolean | null
          page_location: string | null
          page_path: string
          page_title: string | null
          previous_page: string | null
          referrer: string | null
          screen_resolution: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          entry_time?: string
          exit_time?: string | null
          id?: string
          is_bounce?: boolean | null
          page_location?: string | null
          page_path: string
          page_title?: string | null
          previous_page?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          entry_time?: string
          exit_time?: string | null
          id?: string
          is_bounce?: boolean | null
          page_location?: string | null
          page_path?: string
          page_title?: string | null
          previous_page?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      patient_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          is_viewed: boolean | null
          patient_id: string
          progress_value: number | null
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          is_viewed?: boolean | null
          patient_id: string
          progress_value?: number | null
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          is_viewed?: boolean | null
          patient_id?: string
          progress_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_achievements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_check_ins: {
        Row: {
          check_in_date: string
          check_in_time: string
          created_at: string
          effectiveness_rating: number | null
          id: string
          notes: string | null
          patient_id: string
          side_effects: string | null
          status: string
          taken_at_time: string | null
          treatment_schedule_id: string | null
        }
        Insert: {
          check_in_date: string
          check_in_time?: string
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          side_effects?: string | null
          status: string
          taken_at_time?: string | null
          treatment_schedule_id?: string | null
        }
        Update: {
          check_in_date?: string
          check_in_time?: string
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          side_effects?: string | null
          status?: string
          taken_at_time?: string | null
          treatment_schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_check_ins_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_check_ins_treatment_schedule_id_fkey"
            columns: ["treatment_schedule_id"]
            isOneToOne: false
            referencedRelation: "treatment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_connection_tokens: {
        Row: {
          connection_type: string
          created_at: string | null
          created_by: string
          expires_at: string
          id: string
          patient_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          connection_type: string
          created_at?: string | null
          created_by: string
          expires_at: string
          id?: string
          patient_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          connection_type?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string
          id?: string
          patient_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_connection_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          patient_id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          patient_id: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          patient_id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message_body: string
          parent_message_id: string | null
          patient_id: string | null
          practitioner_id: string | null
          recipient_id: string | null
          recipient_type: string
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_body: string
          parent_message_id?: string | null
          patient_id?: string | null
          practitioner_id?: string | null
          recipient_id?: string | null
          recipient_type?: string
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_body?: string
          parent_message_id?: string | null
          patient_id?: string | null
          practitioner_id?: string | null
          recipient_id?: string | null
          recipient_type?: string
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "patient_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_visits: {
        Row: {
          chief_complaint: string
          created_at: string
          duration_minutes: number | null
          id: string
          patient_id: string
          practitioner_id: string
          status: string
          updated_at: string
          visit_date: string
          visit_type: string
        }
        Insert: {
          chief_complaint: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          patient_id: string
          practitioner_id: string
          status?: string
          updated_at?: string
          visit_date?: string
          visit_type?: string
        }
        Update: {
          chief_complaint?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          patient_id?: string
          practitioner_id?: string
          status?: string
          updated_at?: string
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_vital_signs: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          heart_rate: number | null
          height: number | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          patient_id: string
          recorded_at: string
          recorded_by: string
          respiratory_rate: number | null
          temperature: number | null
          weight: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id: string
          recorded_at?: string
          recorded_by: string
          respiratory_rate?: number | null
          temperature?: number | null
          weight?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id?: string
          recorded_at?: string
          recorded_by?: string
          respiratory_rate?: number | null
          temperature?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_vital_signs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_wellness_surveys: {
        Row: {
          created_at: string
          energy_levels: number
          id: string
          notes: string | null
          overall_feeling: number
          patient_id: string
          recommendation_id: string | null
          sleep_quality: number
          symptom_improvement: number
          treatment_satisfaction: number
        }
        Insert: {
          created_at?: string
          energy_levels: number
          id?: string
          notes?: string | null
          overall_feeling: number
          patient_id: string
          recommendation_id?: string | null
          sleep_quality: number
          symptom_improvement: number
          treatment_satisfaction: number
        }
        Update: {
          created_at?: string
          energy_levels?: number
          id?: string
          notes?: string | null
          overall_feeling?: number
          patient_id?: string
          recommendation_id?: string | null
          sleep_quality?: number
          symptom_improvement?: number
          treatment_satisfaction?: number
        }
        Relationships: [
          {
            foreignKeyName: "patient_wellness_surveys_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_wellness_surveys_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          abdominal_palpation: string | null
          allergies: string | null
          birth_time: string | null
          body_diagram_back: Json | null
          body_diagram_front: Json | null
          chief_complaint: string | null
          created_at: string
          current_medications: string | null
          date_of_birth: string | null
          default_shipping_address: string | null
          default_shipping_city: string | null
          default_shipping_phone: string | null
          default_shipping_postal_code: string | null
          dietary_recommendations: string | null
          email: string | null
          email_consent: boolean | null
          family_history: string | null
          follow_up_plan: string | null
          full_name: string
          gender: string | null
          general_appearance: string | null
          height: number | null
          herbal_prescription: string | null
          id: string
          id_number: string | null
          lifestyle_recommendations: string | null
          line_user_id: string | null
          medical_history: string | null
          nationality: string | null
          occupation: string | null
          other_findings: string | null
          past_medical_history: string | null
          past_operations: string | null
          phone: string | null
          practitioner_id: string
          practitioner_notes: string | null
          present_illness: string | null
          profile_picture_url: string | null
          pulse_grid_1: Json | null
          pulse_grid_2: Json | null
          pulse_grid_3: Json | null
          pulse_grid_4: Json | null
          pulse_grid_5: Json | null
          social_history: string | null
          tongue_examination: string | null
          treatment_plan: string | null
          ttm_diagnosis: string | null
          ttm_pattern_identification: string | null
          updated_at: string
          user_id: string | null
          weight: number | null
          western_diagnosis: string | null
        }
        Insert: {
          abdominal_palpation?: string | null
          allergies?: string | null
          birth_time?: string | null
          body_diagram_back?: Json | null
          body_diagram_front?: Json | null
          chief_complaint?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          default_shipping_address?: string | null
          default_shipping_city?: string | null
          default_shipping_phone?: string | null
          default_shipping_postal_code?: string | null
          dietary_recommendations?: string | null
          email?: string | null
          email_consent?: boolean | null
          family_history?: string | null
          follow_up_plan?: string | null
          full_name: string
          gender?: string | null
          general_appearance?: string | null
          height?: number | null
          herbal_prescription?: string | null
          id?: string
          id_number?: string | null
          lifestyle_recommendations?: string | null
          line_user_id?: string | null
          medical_history?: string | null
          nationality?: string | null
          occupation?: string | null
          other_findings?: string | null
          past_medical_history?: string | null
          past_operations?: string | null
          phone?: string | null
          practitioner_id: string
          practitioner_notes?: string | null
          present_illness?: string | null
          profile_picture_url?: string | null
          pulse_grid_1?: Json | null
          pulse_grid_2?: Json | null
          pulse_grid_3?: Json | null
          pulse_grid_4?: Json | null
          pulse_grid_5?: Json | null
          social_history?: string | null
          tongue_examination?: string | null
          treatment_plan?: string | null
          ttm_diagnosis?: string | null
          ttm_pattern_identification?: string | null
          updated_at?: string
          user_id?: string | null
          weight?: number | null
          western_diagnosis?: string | null
        }
        Update: {
          abdominal_palpation?: string | null
          allergies?: string | null
          birth_time?: string | null
          body_diagram_back?: Json | null
          body_diagram_front?: Json | null
          chief_complaint?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          default_shipping_address?: string | null
          default_shipping_city?: string | null
          default_shipping_phone?: string | null
          default_shipping_postal_code?: string | null
          dietary_recommendations?: string | null
          email?: string | null
          email_consent?: boolean | null
          family_history?: string | null
          follow_up_plan?: string | null
          full_name?: string
          gender?: string | null
          general_appearance?: string | null
          height?: number | null
          herbal_prescription?: string | null
          id?: string
          id_number?: string | null
          lifestyle_recommendations?: string | null
          line_user_id?: string | null
          medical_history?: string | null
          nationality?: string | null
          occupation?: string | null
          other_findings?: string | null
          past_medical_history?: string | null
          past_operations?: string | null
          phone?: string | null
          practitioner_id?: string
          practitioner_notes?: string | null
          present_illness?: string | null
          profile_picture_url?: string | null
          pulse_grid_1?: Json | null
          pulse_grid_2?: Json | null
          pulse_grid_3?: Json | null
          pulse_grid_4?: Json | null
          pulse_grid_5?: Json | null
          social_history?: string | null
          tongue_examination?: string | null
          treatment_plan?: string | null
          ttm_diagnosis?: string | null
          ttm_pattern_identification?: string | null
          updated_at?: string
          user_id?: string | null
          weight?: number | null
          western_diagnosis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_certifications: {
        Row: {
          certification_name: string
          certification_number: string | null
          created_at: string | null
          credential_type: string
          expiry_date: string | null
          file_path: string | null
          id: string
          is_verified: boolean | null
          issue_date: string
          issuing_organization: string
          notes: string | null
          status: string
          updated_at: string | null
          user_id: string
          verification_url: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          certification_name: string
          certification_number?: string | null
          created_at?: string | null
          credential_type?: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date: string
          issuing_organization: string
          notes?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          verification_url?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          certification_name?: string
          certification_number?: string | null
          created_at?: string | null
          credential_type?: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string
          issuing_organization?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          verification_url?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      practitioner_commission_overrides: {
        Row: {
          category_id: string | null
          commission_rate: number
          created_at: string | null
          effective_from: string | null
          effective_until: string | null
          herb_id: string | null
          id: string
          notes: string | null
          practitioner_id: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          commission_rate: number
          created_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          herb_id?: string | null
          id?: string
          notes?: string | null
          practitioner_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          commission_rate?: number
          created_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          herb_id?: string | null
          id?: string
          notes?: string | null
          practitioner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_commission_overrides_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_commission_overrides_herb_id_fkey"
            columns: ["herb_id"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_commission_overrides_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string
          helpful_count: number | null
          herb_id: string
          id: string
          media: Json | null
          patient_id: string | null
          rating: number
          review_text: string | null
          reviewer_name: string | null
          title: string | null
          updated_at: string
          user_id: string
          verified_purchase: boolean | null
        }
        Insert: {
          created_at?: string
          helpful_count?: number | null
          herb_id: string
          id?: string
          media?: Json | null
          patient_id?: string | null
          rating: number
          review_text?: string | null
          reviewer_name?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          verified_purchase?: boolean | null
        }
        Update: {
          created_at?: string
          helpful_count?: number | null
          herb_id?: string
          id?: string
          media?: Json | null
          patient_id?: string | null
          rating?: number
          review_text?: string | null
          reviewer_name?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_herb_id_fkey"
            columns: ["herb_id"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allergies: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          email_consent: boolean | null
          full_name: string
          id: string
          license_number: string | null
          medical_history: string | null
          payment_notes: string | null
          phone: string | null
          practice_name: string | null
          preferred_currency: string | null
          preferred_language: string | null
          promptpay_number: string | null
          specialization: string | null
          tax_id: string | null
          updated_at: string
          years_of_experience: number | null
        }
        Insert: {
          allergies?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          email_consent?: boolean | null
          full_name: string
          id: string
          license_number?: string | null
          medical_history?: string | null
          payment_notes?: string | null
          phone?: string | null
          practice_name?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          promptpay_number?: string | null
          specialization?: string | null
          tax_id?: string | null
          updated_at?: string
          years_of_experience?: number | null
        }
        Update: {
          allergies?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          email_consent?: boolean | null
          full_name?: string
          id?: string
          license_number?: string | null
          medical_history?: string | null
          payment_notes?: string | null
          phone?: string | null
          practice_name?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          promptpay_number?: string | null
          specialization?: string | null
          tax_id?: string | null
          updated_at?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answer_text: string
          created_at: string
          display_order: number | null
          id: string
          is_correct: boolean | null
          question_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_correct?: boolean | null
          question_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers_data: Json | null
          attempt_number: number
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          passed: boolean | null
          quiz_id: string
          score_percentage: number | null
          started_at: string
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          answers_data?: Json | null
          attempt_number: number
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          passed?: boolean | null
          quiz_id: string
          score_percentage?: number | null
          started_at?: string
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          answers_data?: Json | null
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          passed?: boolean | null
          quiz_id?: string
          score_percentage?: number | null
          started_at?: string
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "lesson_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          display_order: number | null
          explanation: string | null
          id: string
          question_text: string
          question_type: string | null
          quiz_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          explanation?: string | null
          id?: string
          question_text: string
          question_type?: string | null
          quiz_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          explanation?: string | null
          id?: string
          question_text?: string
          question_type?: string | null
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "lesson_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_items: {
        Row: {
          created_at: string
          dosage_instructions: string | null
          herb_id: string
          id: string
          quantity: number
          recommendation_id: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          dosage_instructions?: string | null
          herb_id: string
          id?: string
          quantity: number
          recommendation_id: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          dosage_instructions?: string | null
          herb_id?: string
          id?: string
          quantity?: number
          recommendation_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_items_herb_id_fkey"
            columns: ["herb_id"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_items_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_links: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          recommendation_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          recommendation_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          recommendation_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_links_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          created_at: string
          diagnosis: string | null
          duration_days: number | null
          id: string
          instructions: string | null
          notification_channels: string[] | null
          patient_id: string
          practitioner_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["recommendation_status"]
          title: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          duration_days?: number | null
          id?: string
          instructions?: string | null
          notification_channels?: string[] | null
          patient_id: string
          practitioner_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recommendation_status"]
          title: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          duration_days?: number | null
          id?: string
          instructions?: string | null
          notification_channels?: string[] | null
          patient_id?: string
          practitioner_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recommendation_status"]
          title?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_settings: {
        Row: {
          advance_notice_minutes: number | null
          created_at: string
          enable_morning_summary: boolean | null
          enabled: boolean | null
          id: string
          missed_reminder_delay_minutes: number | null
          morning_summary_time: string | null
          patient_id: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_methods: string[] | null
          send_missed_reminder: boolean | null
          updated_at: string
        }
        Insert: {
          advance_notice_minutes?: number | null
          created_at?: string
          enable_morning_summary?: boolean | null
          enabled?: boolean | null
          id?: string
          missed_reminder_delay_minutes?: number | null
          morning_summary_time?: string | null
          patient_id: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_methods?: string[] | null
          send_missed_reminder?: boolean | null
          updated_at?: string
        }
        Update: {
          advance_notice_minutes?: number | null
          created_at?: string
          enable_morning_summary?: boolean | null
          enabled?: boolean | null
          id?: string
          missed_reminder_delay_minutes?: number | null
          morning_summary_time?: string | null
          patient_id?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_methods?: string[] | null
          send_missed_reminder?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_settings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_analytics: {
        Row: {
          commission_amount: number
          commission_rate: number | null
          commission_status: string | null
          created_at: string
          id: string
          items_breakdown: Json | null
          order_id: string
          payout_id: string | null
          practitioner_id: string
          total_amount: number
        }
        Insert: {
          commission_amount: number
          commission_rate?: number | null
          commission_status?: string | null
          created_at?: string
          id?: string
          items_breakdown?: Json | null
          order_id: string
          payout_id?: string | null
          practitioner_id: string
          total_amount: number
        }
        Update: {
          commission_amount?: number
          commission_rate?: number | null
          commission_status?: string | null
          created_at?: string
          id?: string
          items_breakdown?: Json | null
          order_id?: string
          payout_id?: string | null
          practitioner_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_analytics_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_analytics_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "commission_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_schedules: {
        Row: {
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          herb_id: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          medication_name: string
          patient_id: string
          recommendation_id: string
          special_instructions: string | null
          start_date: string
          take_with_food: boolean | null
          times_of_day: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          herb_id?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          medication_name: string
          patient_id: string
          recommendation_id: string
          special_instructions?: string | null
          start_date: string
          take_with_food?: boolean | null
          times_of_day?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          herb_id?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          medication_name?: string
          patient_id?: string
          recommendation_id?: string
          special_instructions?: string | null
          start_date?: string
          take_with_food?: boolean | null
          times_of_day?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_schedules_herb_id_fkey"
            columns: ["herb_id"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_schedules_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_schedules_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
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
      visit_notes: {
        Row: {
          abdominal_palpation: string | null
          assessment: string | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          body_diagram_back: Json | null
          body_diagram_front: Json | null
          created_at: string
          dietary_recommendations: string | null
          follow_up_plan: string | null
          general_appearance: string | null
          heart_rate: number | null
          height: number | null
          herbal_prescription: string | null
          id: string
          is_private: boolean
          lifestyle_recommendations: string | null
          objective: string | null
          other_findings: string | null
          oxygen_saturation: number | null
          plan: string | null
          practitioner_notes: string | null
          present_illness: string | null
          pulse_grid_1: Json | null
          pulse_grid_2: Json | null
          pulse_grid_3: Json | null
          pulse_grid_4: Json | null
          pulse_grid_5: Json | null
          respiratory_rate: number | null
          subjective: string | null
          temperature: number | null
          tongue_examination: string | null
          treatment_plan: string | null
          ttm_diagnosis: string | null
          ttm_pattern_identification: string | null
          updated_at: string
          visit_id: string
          vital_notes: string | null
          weight: number | null
          western_diagnosis: string | null
        }
        Insert: {
          abdominal_palpation?: string | null
          assessment?: string | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          body_diagram_back?: Json | null
          body_diagram_front?: Json | null
          created_at?: string
          dietary_recommendations?: string | null
          follow_up_plan?: string | null
          general_appearance?: string | null
          heart_rate?: number | null
          height?: number | null
          herbal_prescription?: string | null
          id?: string
          is_private?: boolean
          lifestyle_recommendations?: string | null
          objective?: string | null
          other_findings?: string | null
          oxygen_saturation?: number | null
          plan?: string | null
          practitioner_notes?: string | null
          present_illness?: string | null
          pulse_grid_1?: Json | null
          pulse_grid_2?: Json | null
          pulse_grid_3?: Json | null
          pulse_grid_4?: Json | null
          pulse_grid_5?: Json | null
          respiratory_rate?: number | null
          subjective?: string | null
          temperature?: number | null
          tongue_examination?: string | null
          treatment_plan?: string | null
          ttm_diagnosis?: string | null
          ttm_pattern_identification?: string | null
          updated_at?: string
          visit_id: string
          vital_notes?: string | null
          weight?: number | null
          western_diagnosis?: string | null
        }
        Update: {
          abdominal_palpation?: string | null
          assessment?: string | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          body_diagram_back?: Json | null
          body_diagram_front?: Json | null
          created_at?: string
          dietary_recommendations?: string | null
          follow_up_plan?: string | null
          general_appearance?: string | null
          heart_rate?: number | null
          height?: number | null
          herbal_prescription?: string | null
          id?: string
          is_private?: boolean
          lifestyle_recommendations?: string | null
          objective?: string | null
          other_findings?: string | null
          oxygen_saturation?: number | null
          plan?: string | null
          practitioner_notes?: string | null
          present_illness?: string | null
          pulse_grid_1?: Json | null
          pulse_grid_2?: Json | null
          pulse_grid_3?: Json | null
          pulse_grid_4?: Json | null
          pulse_grid_5?: Json | null
          respiratory_rate?: number | null
          subjective?: string | null
          temperature?: number | null
          tongue_examination?: string | null
          treatment_plan?: string | null
          ttm_diagnosis?: string | null
          ttm_pattern_identification?: string | null
          updated_at?: string
          visit_id?: string
          vital_notes?: string | null
          weight?: number | null
          western_diagnosis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_notes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_stock: {
        Args: { herb_id: string; quantity: number }
        Returns: undefined
      }
      get_active_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_avg_time_on_page: {
        Args: { _end_date?: string; _page_path: string; _start_date?: string }
        Returns: number
      }
      get_commission_rate: {
        Args: { _herb_id: string; _practitioner_id: string }
        Returns: number
      }
      get_page_bounce_rate: {
        Args: { _end_date?: string; _page_path: string; _start_date?: string }
        Returns: number
      }
      get_top_pages_by_views: {
        Args: { _end_date?: string; _limit?: number; _start_date?: string }
        Returns: {
          avg_duration: number
          bounce_rate: number
          page_path: string
          page_title: string
          unique_visitors: number
          view_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_valid_checkout_link: {
        Args: { _recommendation_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "practitioner" | "patient" | "dev"
      course_audience: "practitioner" | "patient" | "both"
      recommendation_status:
        | "draft"
        | "sent"
        | "payment_pending"
        | "paid"
        | "shipped"
        | "delivered"
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
      app_role: ["admin", "practitioner", "patient", "dev"],
      course_audience: ["practitioner", "patient", "both"],
      recommendation_status: [
        "draft",
        "sent",
        "payment_pending",
        "paid",
        "shipped",
        "delivered",
      ],
    },
  },
} as const
