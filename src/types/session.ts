
import { Patient, Session } from './patient';

export interface SessionWithPatient extends Session {
  patients: Patient;
}

export interface FutureSession {
  id: number;
  patient_id: number;
  start_time: string; // timestamp without time zone
  end_time?: string; // timestamp without time zone
  meeting_type: 'Zoom' | 'Phone' | 'In-Person';
  status: 'scheduled' | 'completed' | 'cancelled';
  zoom_link?: string;
  notes: string | null;
  created_at?: string;
}

export interface ClientStatistics {
  total_sessions: number;
  total_debt: number;
  last_session: string | null;
  next_session: string | null;
}
