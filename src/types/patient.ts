export interface Patient {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  session_price: number | null;
  last_session_date?: string | null;
  has_unpaid_sessions?: boolean;
  has_upcoming_sessions?: boolean;
}

export interface Session {
  id: number;
  patient_id: number;
  session_date: string;
  meeting_type: 'Zoom' | 'Phone' | 'In-Person';
  sent_exercises: boolean;
  exercise_list: string[] | null;
  summary: string | null;
}

export interface Exercise {
  id: number;
  exercise_name: string;
  description: string | null;
  file_url?: string | null;
  created_at?: string;
}
