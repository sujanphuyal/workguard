import type { Database } from '../../supabase/types';

export type { Database };

export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbSettings = Database['public']['Tables']['settings']['Row'];
export type DbEmployer = Database['public']['Tables']['employers']['Row'];
export type DbWorkShift = Database['public']['Tables']['work_shifts']['Row'];
export type DbSemesterBreak = Database['public']['Tables']['semester_breaks']['Row'];
