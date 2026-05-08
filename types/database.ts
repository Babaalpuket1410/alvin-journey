export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          date_of_birth: string | null
          gender: string | null
          height_cm: number | null
          timezone: string
          activity_level: string
          primary_goal: string
          target_weight_kg: number | null
          weekly_target: string | null
          calorie_target: number
          protein_target: number
          carb_target: number
          fat_target: number
          water_target_cups: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      body_scans: {
        Row: {
          id: string
          user_id: string
          scan_date: string
          weight_kg: number
          body_fat_pct: number | null
          muscle_kg: number | null
          visceral_fat_grade: number | null
          health_score: number | null
          bmr: number | null
          bmi: number | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['body_scans']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['body_scans']['Insert']>
        Relationships: []
      }
      progress_photos: {
        Row: {
          id: string
          user_id: string
          scan_id: string | null
          photo_date: string
          angle: string
          storage_path: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['progress_photos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['progress_photos']['Insert']>
        Relationships: []
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          session_date: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>
        Relationships: []
      }
      exercises: {
        Row: {
          id: string
          session_id: string
          user_id: string
          type: 'strength' | 'cardio'
          name: string
          category: string
          muscle_groups: string[]
          sets: number | null
          reps: number | null
          weight_kg: number | null
          rest_seconds: number | null
          duration_min: number | null
          distance_km: number | null
          speed_kmh: number | null
          incline_pct: number | null
          intensity: string | null
          notes: string | null
          is_done: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>
        Relationships: []
      }
      meal_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          meal_type: 'breakfast' | 'snack_am' | 'lunch' | 'snack_pm' | 'dinner'
          food_name: string
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['meal_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['meal_logs']['Insert']>
        Relationships: []
      }
      meal_photos: {
        Row: {
          id: string
          user_id: string
          log_date: string
          meal_type: string
          storage_path: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['meal_photos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['meal_photos']['Insert']>
        Relationships: []
      }
      water_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          cups_consumed: number
          cup_size_ml: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['water_logs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['water_logs']['Insert']>
        Relationships: []
      }
      calorie_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          calories_consumed: number
          protein_g: number
          carbs_g: number
          fat_g: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['calorie_logs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['calorie_logs']['Insert']>
        Relationships: []
      }
      steps_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          steps: number
          goal: number
          distance_km: number | null
          calories_burned: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['steps_logs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['steps_logs']['Insert']>
        Relationships: []
      }
      sleep_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          bedtime: string | null
          wake_time: string | null
          duration_hrs: number | null
          quality: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['sleep_logs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['sleep_logs']['Insert']>
        Relationships: []
      }
      workout_splits: {
        Row: {
          id: string
          user_id: string
          day_of_week: number
          label: string
          muscle_groups: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workout_splits']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workout_splits']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
