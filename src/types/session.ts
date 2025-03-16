
import { Patient, Session } from './patient';

export interface SessionWithPatient extends Session {
  patients: Patient;
}

export interface FutureSession {
  id: number;
  patient_id: number | null;
  scheduled_at: string; // timestamp with time zone
  title: string;
  type: 'manual' | 'patient';
  notes: string | null;
  zoom_link?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientStatistics {
  total_sessions: number;
  total_debt: number;
  last_session: string | null;
  next_session: string | null;
}
