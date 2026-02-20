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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clerk_incidents: {
        Row: {
          clerk_id: string
          created_at: string
          id: string
          incident_type: string
          job_id: string | null
          logged_by: string | null
          notes: string | null
          restrict_priority: boolean
          severity: string
        }
        Insert: {
          clerk_id: string
          created_at?: string
          id?: string
          incident_type: string
          job_id?: string | null
          logged_by?: string | null
          notes?: string | null
          restrict_priority?: boolean
          severity?: string
        }
        Update: {
          clerk_id?: string
          created_at?: string
          id?: string
          incident_type?: string
          job_id?: string | null
          logged_by?: string | null
          notes?: string | null
          restrict_priority?: boolean
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "clerk_incidents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      clerk_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          provider_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          provider_id: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          provider_id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          job_id: string
          raised_against: string
          raised_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_id: string
          raised_against: string
          raised_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string
          raised_against?: string
          raised_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          function_name: string
          id: string
          metadata: Json | null
          recipient_email: string
          resend_id: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          function_name: string
          id?: string
          metadata?: Json | null
          recipient_email: string
          resend_id?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          function_name?: string
          id?: string
          metadata?: Json | null
          recipient_email?: string
          resend_id?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      escrow_payments: {
        Row: {
          auto_release_at: string | null
          cancellation_fee: number | null
          cancellation_reason: string | null
          cancelled_by: string | null
          clerk_id: string | null
          clerk_payout: number
          client_id: string
          created_at: string
          gross_amount: number
          held_at: string | null
          id: string
          job_id: string
          platform_fee: number
          provider_fee: number
          provider_id: string | null
          released_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          auto_release_at?: string | null
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          clerk_id?: string | null
          clerk_payout?: number
          client_id: string
          created_at?: string
          gross_amount?: number
          held_at?: string | null
          id?: string
          job_id: string
          platform_fee?: number
          provider_fee?: number
          provider_id?: string | null
          released_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_release_at?: string | null
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          clerk_id?: string | null
          clerk_payout?: number
          client_id?: string
          created_at?: string
          gross_amount?: number
          held_at?: string | null
          id?: string
          job_id?: string
          platform_fee?: number
          provider_fee?: number
          provider_id?: string | null
          released_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_items: {
        Row: {
          cleanliness: string | null
          cleanliness_notes: string | null
          completed: boolean | null
          condition: Database["public"]["Enums"]["condition_rating"] | null
          condition_notes: string | null
          created_at: string
          description: string | null
          id: string
          item_category: string | null
          item_name: string
          item_order: number
          quantity: number | null
          room_id: string
          updated_at: string
        }
        Insert: {
          cleanliness?: string | null
          cleanliness_notes?: string | null
          completed?: boolean | null
          condition?: Database["public"]["Enums"]["condition_rating"] | null
          condition_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_category?: string | null
          item_name: string
          item_order?: number
          quantity?: number | null
          room_id: string
          updated_at?: string
        }
        Update: {
          cleanliness?: string | null
          cleanliness_notes?: string | null
          completed?: boolean | null
          condition?: Database["public"]["Enums"]["condition_rating"] | null
          condition_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_category?: string | null
          item_name?: string
          item_order?: number
          quantity?: number | null
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "inspection_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_mandatory: boolean | null
          item_id: string | null
          photo_url: string
          report_id: string
          room_id: string | null
          taken_at: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          item_id?: string | null
          photo_url: string
          report_id: string
          room_id?: string | null
          taken_at?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          item_id?: string | null
          photo_url?: string
          report_id?: string
          room_id?: string | null
          taken_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_photos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inspection_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_photos_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "inspection_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_photos_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "inspection_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_reports: {
        Row: {
          carbon_monoxide_checked: boolean | null
          clerk_id: string
          clerk_signature_url: string | null
          completed_at: string | null
          created_at: string
          general_notes: string | null
          id: string
          job_id: string
          keys_info: Json | null
          meter_readings: Json | null
          smoke_alarms_checked: boolean | null
          started_at: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          carbon_monoxide_checked?: boolean | null
          clerk_id: string
          clerk_signature_url?: string | null
          completed_at?: string | null
          created_at?: string
          general_notes?: string | null
          id?: string
          job_id: string
          keys_info?: Json | null
          meter_readings?: Json | null
          smoke_alarms_checked?: boolean | null
          started_at?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          carbon_monoxide_checked?: boolean | null
          clerk_id?: string
          clerk_signature_url?: string | null
          completed_at?: string | null
          created_at?: string
          general_notes?: string | null
          id?: string
          job_id?: string
          keys_info?: Json | null
          meter_readings?: Json | null
          smoke_alarms_checked?: boolean | null
          started_at?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_rooms: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          notes: string | null
          overall_condition:
            | Database["public"]["Enums"]["condition_rating"]
            | null
          report_id: string
          room_name: string
          room_order: number
          room_type: Database["public"]["Enums"]["room_type"]
          updated_at: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          overall_condition?:
            | Database["public"]["Enums"]["condition_rating"]
            | null
          report_id: string
          room_name: string
          room_order?: number
          room_type: Database["public"]["Enums"]["room_type"]
          updated_at?: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          overall_condition?:
            | Database["public"]["Enums"]["condition_rating"]
            | null
          report_id?: string
          room_name?: string
          room_order?: number
          room_type?: Database["public"]["Enums"]["room_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_rooms_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "inspection_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          accepted_at: string | null
          cancellation_fee: number | null
          cancelled_at: string | null
          cancelled_by: string | null
          clerk_bonus: number | null
          clerk_final_payout: number | null
          clerk_id: string | null
          clerk_level_at_job: number | null
          clerk_payment_date: string | null
          clerk_payout: number | null
          clerk_payout_locked: boolean | null
          clerk_report_submitted_ack: boolean | null
          clerk_report_submitted_ack_at: string | null
          client_id: string
          client_pre_inspection_ack: boolean | null
          client_pre_inspection_ack_at: string | null
          client_report_accepted: boolean | null
          client_report_accepted_at: string | null
          client_report_comments: string | null
          client_signature_at: string | null
          client_signature_url: string | null
          created_at: string
          delivered_at: string | null
          final_price: number | null
          id: string
          inspection_type: Database["public"]["Enums"]["inspection_type"]
          inventorybase_job_id: string | null
          margin: number | null
          policy_acknowledged_at: string | null
          preferred_time_slot: string | null
          property_id: string
          provider_id: string | null
          provider_job_completed_ack: boolean | null
          provider_job_completed_ack_at: string | null
          quoted_price: number | null
          report_url: string | null
          review_email_sent_at: string | null
          scheduled_date: string
          service_tier: string
          short_notice_surcharge_applied: boolean
          special_instructions: string | null
          status: Database["public"]["Enums"]["job_status"]
          tier_acknowledged_at: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          cancellation_fee?: number | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          clerk_bonus?: number | null
          clerk_final_payout?: number | null
          clerk_id?: string | null
          clerk_level_at_job?: number | null
          clerk_payment_date?: string | null
          clerk_payout?: number | null
          clerk_payout_locked?: boolean | null
          clerk_report_submitted_ack?: boolean | null
          clerk_report_submitted_ack_at?: string | null
          client_id: string
          client_pre_inspection_ack?: boolean | null
          client_pre_inspection_ack_at?: string | null
          client_report_accepted?: boolean | null
          client_report_accepted_at?: string | null
          client_report_comments?: string | null
          client_signature_at?: string | null
          client_signature_url?: string | null
          created_at?: string
          delivered_at?: string | null
          final_price?: number | null
          id?: string
          inspection_type: Database["public"]["Enums"]["inspection_type"]
          inventorybase_job_id?: string | null
          margin?: number | null
          policy_acknowledged_at?: string | null
          preferred_time_slot?: string | null
          property_id: string
          provider_id?: string | null
          provider_job_completed_ack?: boolean | null
          provider_job_completed_ack_at?: string | null
          quoted_price?: number | null
          report_url?: string | null
          review_email_sent_at?: string | null
          scheduled_date: string
          service_tier?: string
          short_notice_surcharge_applied?: boolean
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tier_acknowledged_at?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          cancellation_fee?: number | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          clerk_bonus?: number | null
          clerk_final_payout?: number | null
          clerk_id?: string | null
          clerk_level_at_job?: number | null
          clerk_payment_date?: string | null
          clerk_payout?: number | null
          clerk_payout_locked?: boolean | null
          clerk_report_submitted_ack?: boolean | null
          clerk_report_submitted_ack_at?: string | null
          client_id?: string
          client_pre_inspection_ack?: boolean | null
          client_pre_inspection_ack_at?: string | null
          client_report_accepted?: boolean | null
          client_report_accepted_at?: string | null
          client_report_comments?: string | null
          client_signature_at?: string | null
          client_signature_url?: string | null
          created_at?: string
          delivered_at?: string | null
          final_price?: number | null
          id?: string
          inspection_type?: Database["public"]["Enums"]["inspection_type"]
          inventorybase_job_id?: string | null
          margin?: number | null
          policy_acknowledged_at?: string | null
          preferred_time_slot?: string | null
          property_id?: string
          provider_id?: string | null
          provider_job_completed_ack?: boolean | null
          provider_job_completed_ack_at?: string | null
          quoted_price?: number | null
          report_url?: string | null
          review_email_sent_at?: string | null
          scheduled_date?: string
          service_tier?: string
          short_notice_surcharge_applied?: boolean
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tier_acknowledged_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          job_id: string | null
          message_text: string
          read: boolean
          recipient_id: string
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          message_text: string
          read?: boolean
          recipient_id: string
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          message_text?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_job_updates: boolean
          email_marketing: boolean
          email_new_messages: boolean
          email_payment_updates: boolean
          email_report_delivery: boolean
          id: string
          inapp_job_updates: boolean
          inapp_new_messages: boolean
          inapp_payment_updates: boolean
          inapp_report_delivery: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_job_updates?: boolean
          email_marketing?: boolean
          email_new_messages?: boolean
          email_payment_updates?: boolean
          email_report_delivery?: boolean
          id?: string
          inapp_job_updates?: boolean
          inapp_new_messages?: boolean
          inapp_payment_updates?: boolean
          inapp_report_delivery?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_job_updates?: boolean
          email_marketing?: boolean
          email_new_messages?: boolean
          email_payment_updates?: boolean
          email_report_delivery?: boolean
          id?: string
          inapp_job_updates?: boolean
          inapp_new_messages?: boolean
          inapp_payment_updates?: boolean
          inapp_report_delivery?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clerk_jobs_completed: number | null
          clerk_level: number | null
          clerk_rating: number | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          non_circumvention_agreed_at: string | null
          onboarding_completed: boolean
          phone: string | null
          provider_id: string | null
          terms_agreed_at: string | null
          updated_at: string
          user_id: string
          verification_documents: Json | null
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          clerk_jobs_completed?: number | null
          clerk_level?: number | null
          clerk_rating?: number | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          non_circumvention_agreed_at?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          provider_id?: string | null
          terms_agreed_at?: string | null
          updated_at?: string
          user_id: string
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          clerk_jobs_completed?: number | null
          clerk_level?: number | null
          clerk_rating?: number | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          non_circumvention_agreed_at?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          provider_id?: string | null
          terms_agreed_at?: string | null
          updated_at?: string
          user_id?: string
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          bathrooms: number
          bedrooms: number
          city: string
          client_id: string
          communal_areas: number
          created_at: string
          dining_areas: number
          furnished_status: Database["public"]["Enums"]["furnished_status"]
          gardens: number
          hallways_stairs: number
          heavily_furnished: boolean
          id: string
          kitchens: number
          living_rooms: number
          notes: string | null
          postcode: string
          property_type: Database["public"]["Enums"]["property_type"]
          storage_rooms: number
          updated_at: string
          utility_rooms: number
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          bathrooms?: number
          bedrooms?: number
          city: string
          client_id: string
          communal_areas?: number
          created_at?: string
          dining_areas?: number
          furnished_status?: Database["public"]["Enums"]["furnished_status"]
          gardens?: number
          hallways_stairs?: number
          heavily_furnished?: boolean
          id?: string
          kitchens?: number
          living_rooms?: number
          notes?: string | null
          postcode: string
          property_type?: Database["public"]["Enums"]["property_type"]
          storage_rooms?: number
          updated_at?: string
          utility_rooms?: number
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          bathrooms?: number
          bedrooms?: number
          city?: string
          client_id?: string
          communal_areas?: number
          created_at?: string
          dining_areas?: number
          furnished_status?: Database["public"]["Enums"]["furnished_status"]
          gardens?: number
          hallways_stairs?: number
          heavily_furnished?: boolean
          id?: string
          kitchens?: number
          living_rooms?: number
          notes?: string | null
          postcode?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          storage_rooms?: number
          updated_at?: string
          utility_rooms?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          clerk_response: string | null
          created_at: string
          id: string
          job_id: string
          rating: number
          review_text: string | null
          reviewee_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          clerk_response?: string | null
          created_at?: string
          id?: string
          job_id: string
          rating: number
          review_text?: string | null
          reviewee_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          clerk_response?: string | null
          created_at?: string
          id?: string
          job_id?: string
          rating?: number
          review_text?: string | null
          reviewee_id?: string
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      strikes: {
        Row: {
          active: boolean
          clerk_id: string
          created_at: string
          expires_at: string | null
          id: string
          issued_by: string
          reason: string
          severity: number
        }
        Insert: {
          active?: boolean
          clerk_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_by: string
          reason: string
          severity?: number
        }
        Update: {
          active?: boolean
          clerk_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_by?: string
          reason?: string
          severity?: number
        }
        Relationships: []
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
      waitlist_leads: {
        Row: {
          company_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          monthly_volume: string | null
          notes: string | null
          phone: string | null
          portfolio_size: string | null
          role: string
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          monthly_volume?: string | null
          notes?: string | null
          phone?: string | null
          portfolio_size?: string | null
          role: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          monthly_volume?: string | null
          notes?: string | null
          phone?: string | null
          portfolio_size?: string | null
          role?: string
        }
        Relationships: []
      }
      xero_connections: {
        Row: {
          access_token: string
          connected_at: string
          id: string
          refresh_token: string
          scopes: string | null
          tenant_id: string
          tenant_name: string | null
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          id?: string
          refresh_token: string
          scopes?: string | null
          tenant_id: string
          tenant_name?: string | null
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          id?: string
          refresh_token?: string
          scopes?: string | null
          tenant_id?: string
          tenant_name?: string | null
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          accepted_at: string
          created_at: string
          email: string
          expires_at: string
          id: string
          provider_id: string
          status: string
          token: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_xero_connection: {
        Args: never
        Returns: {
          connected_at: string
          tenant_name: string
          token_expires_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "provider" | "clerk" | "admin"
      condition_rating:
        | "excellent"
        | "good"
        | "fair"
        | "poor"
        | "damaged"
        | "missing"
        | "na"
      furnished_status: "furnished" | "unfurnished" | "part_furnished"
      inspection_type:
        | "new_inventory"
        | "check_in"
        | "check_out"
        | "mid_term"
        | "interim"
      job_status:
        | "draft"
        | "pending"
        | "published"
        | "accepted"
        | "assigned"
        | "in_progress"
        | "submitted"
        | "reviewed"
        | "signed"
        | "completed"
        | "paid"
        | "cancelled"
      property_type:
        | "studio"
        | "1_bed"
        | "2_bed"
        | "3_bed"
        | "4_bed"
        | "5_bed"
        | "6_bed"
        | "7_bed"
        | "8_bed"
        | "9_bed"
      room_type:
        | "entrance"
        | "hallway"
        | "living_room"
        | "dining_room"
        | "kitchen"
        | "bedroom"
        | "bathroom"
        | "toilet"
        | "utility"
        | "storage"
        | "garden"
        | "garage"
        | "balcony"
        | "other"
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
      app_role: ["client", "provider", "clerk", "admin"],
      condition_rating: [
        "excellent",
        "good",
        "fair",
        "poor",
        "damaged",
        "missing",
        "na",
      ],
      furnished_status: ["furnished", "unfurnished", "part_furnished"],
      inspection_type: [
        "new_inventory",
        "check_in",
        "check_out",
        "mid_term",
        "interim",
      ],
      job_status: [
        "draft",
        "pending",
        "published",
        "accepted",
        "assigned",
        "in_progress",
        "submitted",
        "reviewed",
        "signed",
        "completed",
        "paid",
        "cancelled",
      ],
      property_type: [
        "studio",
        "1_bed",
        "2_bed",
        "3_bed",
        "4_bed",
        "5_bed",
        "6_bed",
        "7_bed",
        "8_bed",
        "9_bed",
      ],
      room_type: [
        "entrance",
        "hallway",
        "living_room",
        "dining_room",
        "kitchen",
        "bedroom",
        "bathroom",
        "toilet",
        "utility",
        "storage",
        "garden",
        "garage",
        "balcony",
        "other",
      ],
    },
  },
} as const
