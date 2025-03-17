
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
  is_active?: boolean;
  financial_status?: 'No Debts' | 'Has Outstanding Payments' | null;
  
  // Adding missing fields that are used in ClientDetails
  address?: string | null;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  occupation?: string | null;
  referral_source?: string | null;
  status?: 'Active' | 'Inactive' | 'Suspended' | 'Completed' | string;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  previous_therapy?: string | null;
  reason_for_therapy?: string | null;
  medical_history?: string | null;
  allergies?: string | null;
  medications?: string | null;
  family_status?: string | null;
  children?: string | null;
}

export interface Session {
  id: number;
  patient_id: number;
  session_date: string;
  meeting_type: 'Zoom' | 'Phone' | 'In-Person';
  sent_exercises: boolean;
  exercise_list: string[] | null;
  summary: string | null;
  paid_amount: number | null;
  payment_method: 'cash' | 'bit' | 'transfer' | null;
  payment_status: 'paid' | 'partially_paid' | 'unpaid';
  payment_date: string | null;
  payment_notes: string | null;
}

export interface Exercise {
  id: number;
  exercise_name: string;
  description: string | null;
  file_url?: string | null;
  created_at?: string;
}
