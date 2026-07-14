export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          university: string | null;
          course_name: string | null;
          course_type: 'bachelors' | 'masters_coursework' | 'masters_research' | 'phd';
          course_commencement_date: string | null;
          visa_expiry: string | null;
          timezone: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      settings: {
        Row: {
          user_id: string;
          notifications_enabled: boolean;
          theme: 'system' | 'light' | 'dark';
          language: string;
          warning_percentage: number;
          max_hours: number;
          shift_schedules: string;
          created_at: string;
          updated_at: string;
        };
        Insert: { user_id: string } & Partial<Database['public']['Tables']['settings']['Row']>;
        Update: Partial<Database['public']['Tables']['settings']['Row']>;
      };
      employers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          location: string | null;
          position: string | null;
          colour: string;
          hourly_rate: number | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
        } & Partial<Database['public']['Tables']['employers']['Row']>;
        Update: Partial<Database['public']['Tables']['employers']['Row']>;
      };
      work_shifts: {
        Row: {
          id: string;
          user_id: string;
          employer_id: string;
          status: 'scheduled' | 'worked' | 'cancelled' | 'missed';
          start_time: string;
          end_time: string;
          duration_minutes: number;
          break_minutes: number;
          notes: string | null;
          recurrence_group_id: string | null;
          reminder_minutes: number | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          employer_id: string;
          start_time: string;
          end_time: string;
          duration_minutes: number;
        } & Partial<Database['public']['Tables']['work_shifts']['Row']>;
        Update: Partial<Database['public']['Tables']['work_shifts']['Row']>;
      };
      semester_breaks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          start_date: string;
          end_date: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          start_date: string;
          end_date: string;
        } & Partial<Database['public']['Tables']['semester_breaks']['Row']>;
        Update: Partial<Database['public']['Tables']['semester_breaks']['Row']>;
      };
    };
  };
};
