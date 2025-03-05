
export interface Patient {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

export interface Session {
  id: number;
  patient_id: number;
  session_date: string;
  summary: string | null;
  exercise: string | null;
}
