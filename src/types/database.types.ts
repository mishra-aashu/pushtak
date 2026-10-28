export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      license_activations: {
        Row: {
          activated_at: string
          created_at: string
          device_name: string
          hwid: string
          id: string
          is_active: boolean
          last_validated_at: string | null
          license_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string
          created_at?: string
          device_name?: string
          hwid: string
          id?: string
          is_active?: boolean
          last_validated_at?: string | null
          license_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string
          created_at?: string
          device_name?: string
          hwid?: string
          id?: string
          is_active?: boolean
          last_validated_at?: string | null
          license_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_activations_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          hwid: string | null
          id: string
          ip_address: string | null
          license_key: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          hwid?: string | null
          id?: string
          ip_address?: string | null
          license_key?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          hwid?: string | null
          id?: string
          ip_address?: string | null
          license_key?: string | null
        }
        Relationships: []
      }
      licenses: {
        Row: {
          created_at: string
          device_name: string | null
          expires_at: string | null
          hwid: string | null
          id: string
          is_active: boolean
          library_name: string | null
          license_key: string
          order_id: string | null
          payment_id: string | null
          updated_at: string
          user_email: string
          user_id: string | null
          validity: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          expires_at?: string | null
          hwid?: string | null
          id?: string
          is_active?: boolean
          library_name?: string | null
          license_key: string
          order_id?: string | null
          payment_id?: string | null
          updated_at?: string
          user_email: string
          user_id?: string | null
          validity?: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          expires_at?: string | null
          hwid?: string | null
          id?: string
          is_active?: boolean
          library_name?: string | null
          license_key?: string
          order_id?: string | null
          payment_id?: string | null
          updated_at?: string
          user_email?: string
          user_id?: string | null
          validity?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
