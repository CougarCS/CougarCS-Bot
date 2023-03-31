export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          contact_id: string
          discord_snowflake: string | null
          email: string
          first_name: string
          last_name: string | null
          phone_number: number | null
          shirt_size_id: string | null
          timestamp: string | null
          uh_id: number | null
        }
        Insert: {
          contact_id?: string
          discord_snowflake?: string | null
          email: string
          first_name: string
          last_name?: string | null
          phone_number?: number | null
          shirt_size_id?: string | null
          timestamp?: string | null
          uh_id?: number | null
        }
        Update: {
          contact_id?: string
          discord_snowflake?: string | null
          email?: string
          first_name?: string
          last_name?: string | null
          phone_number?: number | null
          shirt_size_id?: string | null
          timestamp?: string | null
          uh_id?: number | null
        }
      }
      discord_guilds: {
        Row: {
          admin_role_id: string | null
          guild_id: string
          log_channel_id: string | null
          member_role_id: string | null
          name: string
          officer_role_id: string | null
          report_channel_id: string | null
        }
        Insert: {
          admin_role_id?: string | null
          guild_id: string
          log_channel_id?: string | null
          member_role_id?: string | null
          name: string
          officer_role_id?: string | null
          report_channel_id?: string | null
        }
        Update: {
          admin_role_id?: string | null
          guild_id?: string
          log_channel_id?: string | null
          member_role_id?: string | null
          name?: string
          officer_role_id?: string | null
          report_channel_id?: string | null
        }
      }
      event: {
        Row: {
          date: string
          description: string | null
          duration: number | null
          event_id: string
          point_value: number
          title: string
        }
        Insert: {
          date: string
          description?: string | null
          duration?: number | null
          event_id?: string
          point_value?: number
          title: string
        }
        Update: {
          date?: string
          description?: string | null
          duration?: number | null
          event_id?: string
          point_value?: number
          title?: string
        }
      }
      event_attendance: {
        Row: {
          contact_id: string
          event_attendance_id: string
          event_id: string
          swag: boolean
          timestamp: string
        }
        Insert: {
          contact_id: string
          event_attendance_id?: string
          event_id: string
          swag?: boolean
          timestamp?: string
        }
        Update: {
          contact_id?: string
          event_attendance_id?: string
          event_id?: string
          swag?: boolean
          timestamp?: string
        }
      }
      member_point_transaction: {
        Row: {
          contact_id: string
          member_point_transaction_id: string
          member_point_transaction_reason_id: string
          point_value: number
          timestamp: string
        }
        Insert: {
          contact_id: string
          member_point_transaction_id?: string
          member_point_transaction_reason_id: string
          point_value: number
          timestamp?: string
        }
        Update: {
          contact_id?: string
          member_point_transaction_id?: string
          member_point_transaction_reason_id?: string
          point_value?: number
          timestamp?: string
        }
      }
      member_point_transaction_reason: {
        Row: {
          member_point_transaction_reason_id: string
          message: string
        }
        Insert: {
          member_point_transaction_reason_id: string
          message: string
        }
        Update: {
          member_point_transaction_reason_id?: string
          message?: string
        }
      }
      membership: {
        Row: {
          contact_id: string
          end_date: string
          membership_code_id: string
          membership_id: string
          semesters: number
          start_date: string
        }
        Insert: {
          contact_id: string
          end_date?: string
          membership_code_id: string
          membership_id?: string
          semesters: number
          start_date?: string
        }
        Update: {
          contact_id?: string
          end_date?: string
          membership_code_id?: string
          membership_id?: string
          semesters?: number
          start_date?: string
        }
      }
      membership_code: {
        Row: {
          membership_code_id: string
          message: string
        }
        Insert: {
          membership_code_id: string
          message: string
        }
        Update: {
          membership_code_id?: string
          message?: string
        }
      }
      shirt_size: {
        Row: {
          message: string
          shirt_size_id: string
        }
        Insert: {
          message: string
          shirt_size_id: string
        }
        Update: {
          message?: string
          shirt_size_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      balance: {
        Args: {
          contact_id: string
        }
        Returns: number
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
