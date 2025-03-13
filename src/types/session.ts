
import { Patient, Session } from './patient';

export interface SessionWithPatient extends Session {
  patients: Patient;
}

export interface FutureSession {
  id: number;
  patient_id: number;
  scheduled_date: string;
  meeting_type: 'Zoom' | 'Phone' | 'In-Person';
  notes: string | null;
}

export interface ClientStatistics {
  total_sessions: number;
  total_debt: number;
  last_session: string | null;
  next_session: string | null;
}
