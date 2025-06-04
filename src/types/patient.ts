
export interface Patient {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  session_price?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id: number;
  patient_id: number;
  session_date: string;
  meeting_type: 'Zoom' | 'Phone' | 'In-Person';
  summary?: string | null;
  sent_exercises: boolean;
  exercise_list?: string[] | null;
  paid_amount?: number | null;
  payment_status: 'paid' | 'partial' | 'pending';
  payment_method?: 'cash' | 'bit' | 'transfer' | null;
  payment_date?: string | null;
  payment_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Exercise {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  created_at?: string;
  updated_at?: string;
}
