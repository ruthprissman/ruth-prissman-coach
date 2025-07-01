
export interface Patient {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  session_price?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  
  // Additional properties used in PatientsList
  last_session_date?: string | null;
  has_unpaid_sessions?: boolean;
  has_upcoming_sessions?: boolean;
  is_active?: boolean;
}

export interface Session {
  id: number;
  patient_id: number;
  session_date: string;
  meeting_type: 'Zoom' | 'Phone' | 'In-Person';
  session_type_id?: number | null; // New field for session type
  summary?: string | null;
  sent_exercises: boolean;
  exercise_list?: string[] | null;
  paid_amount?: number | null;
  payment_status: 'paid' | 'partial' | 'pending';
  payment_method?: 'cash' | 'bit' | 'transfer' | null;
  payment_date?: string | null;
  payment_notes?: string | null;
  attachment_urls?: string[] | null; // New field for file attachments
  created_at?: string;
  updated_at?: string;
}

export interface Exercise {
  id: number;
  name: string;
  exercise_name?: string; // Keep for backward compatibility
  description?: string | null;
  category?: string | null;
  file_url?: string | null; // Add back for compatibility
  created_at?: string;
  updated_at?: string;
}
