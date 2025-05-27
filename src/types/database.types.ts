export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: number
          user_id: string
          date: string
          time_slot_id: string
          status: 'pending' | 'confirmed' | 'cancelled'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          date: string
          time_slot_id: string
          status?: 'pending' | 'confirmed' | 'cancelled'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          date?: string
          time_slot_id?: string
          status?: 'pending' | 'confirmed' | 'cancelled'
          notes?: string | null
          created_at?: string
        }
      }
      appointment_services: {
        Row: {
          id: string
          appointment_id: string
          service_id: string
        }
        Insert: {
          id?: string
          appointment_id: string
          service_id: string
        }
        Update: {
          id?: string
          appointment_id?: string
          service_id?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          duration: number
          image_url: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          duration: number
          image_url?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          duration?: number
          image_url?: string | null
          is_active?: boolean
        }
      }
      time_slots: {
        Row: {
          id: string
          start_time: string
          end_time: string
          day_of_week: number
          is_available: boolean
        }
        Insert: {
          id?: string
          start_time: string
          end_time: string
          day_of_week: number
          is_available?: boolean
        }
        Update: {
          id?: string
          start_time?: string
          end_time?: string
          day_of_week?: number
          is_available?: boolean
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          is_admin: boolean
          created_at: string
          email: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          is_admin?: boolean
          created_at?: string
        }
      }
    }
  }
}