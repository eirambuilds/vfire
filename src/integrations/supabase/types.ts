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
      applications: {
        Row: {
          establishment_name: string
          submitted_at: string
          date_updated: string
          establishment_id: string
          id: string
          owner_id: string
          status: Database["public"]["Enums"]["application_status"]
          type: Database["public"]["Enums"]["application_type"]
          applicationType: string
          applicantName: string
          reference: string
          dti_number: string

        }
        Insert: {
          submitted_at?: string
          date_updated?: string
          establishment_id: string
          id?: string
          owner_id: string
          status?: Database["public"]["Enums"]["application_status"]
          type: Database["public"]["Enums"]["application_type"]
        }
        Update: {
          submitted_at?: string
          date_updated?: string
          establishment_id?: string
          id?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          type?: Database["public"]["Enums"]["application_type"]
        }
        Relationships: [
          {
            foreignKeyName: "applications_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          address: string
          created_at: string
          date_registered: string | null
          dti_number: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          owner_id: string
          status: Database["public"]["Enums"]["establishment_status"]
          type: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          date_registered?: string | null
          dti_number?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          owner_id: string
          status?: Database["public"]["Enums"]["establishment_status"]
          type: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          date_registered?: string | null
          dti_number?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["establishment_status"]
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          all_day: boolean | null
          created_at: string
          description: string | null
          end_time: string
          establishment_id: string | null
          id: string
          inspection_type:
            | Database["public"]["Enums"]["application_type"]
            | null
          related_id: string | null
          start_time: string
          status: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string
          description?: string | null
          end_time: string
          establishment_id?: string | null
          id?: string
          inspection_type?:
            | Database["public"]["Enums"]["application_type"]
            | null
          related_id?: string | null
          start_time: string
          status?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean | null
          created_at?: string
          description?: string | null
          end_time?: string
          establishment_id?: string | null
          id?: string
          inspection_type?:
            | Database["public"]["Enums"]["application_type"]
            | null
          related_id?: string | null
          start_time?: string
          status?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          contact_person: string | null
          created_at: string
          deadline_date: string | null
          establishment_id: string
          id: string
          inspector_id: string | null
          is_priority: boolean | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["inspection_status"]
          updated_at: string
          certificateUrl: string | null
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          deadline_date?: string | null
          establishment_id: string
          id?: string
          inspector_id?: string | null
          is_priority?: boolean | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          updated_at?: string
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          deadline_date?: string | null
          establishment_id?: string
          id?: string
          inspector_id?: string | null
          is_priority?: boolean | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          description: string
          id: string
          priority: string | null
          read: boolean | null
          related_id: string | null
          time: string
          title: string
          type: string
          user_id: string
          user_role: string | null
        }
        Insert: {
          description: string
          id?: string
          priority?: string | null
          read?: boolean | null
          related_id?: string | null
          time?: string
          title: string
          type: string
          user_id: string
          user_role?: string | null
        }
        Update: {
          description?: string
          id?: string
          priority?: string | null
          read?: boolean | null
          related_id?: string | null
          time?: string
          title?: string
          type?: string
          user_id?: string
          user_role?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          updated_at: string
          phone_number: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
          phone_number: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
          phone_number: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      application_status:
        | "pending"
        | "scheduled"
        | "inspected"
        | "approved"
        | "rejected"
        | "cancelled"
      application_type: "FSEC" | "FSIC-Occupancy" | "FSIC-Business"
      establishment_status: "unregistered" | "pre_registered" | "registered"
      inspection_status:
        | "pending"
        | "scheduled"
        | "inspected"
        | "approved"
        | "rejected"
        | "cancelled"
      user_role: "admin" | "inspector" | "owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
