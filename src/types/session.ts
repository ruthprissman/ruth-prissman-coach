
import { Patient, Session } from './patient';

export interface SessionWithPatient extends Session {
  patients: Patient;
}

export interface FutureSession {
  id: number;
  patient_id: number | null;
  session_date: string; // timestamp without time zone
  meeting_type: 'Zoom' | 'Phone' | 'In-Person';
  status: 'available' | 'booked' | 'completed' | 'canceled';
  zoom_link?: string;
  notes?: string | null;
  created_at?: string;
}

export interface ClientStatistics {
  total_sessions: number;
  total_debt: number;
  last_session: string | null;
  next_session: string | null;
}

export interface NewFutureSessionFormData {
  session_date: Date;
  meeting_type: 'Zoom' | 'Phone' | 'In-Person';
  status: 'available' | 'booked' | 'completed' | 'canceled';
  zoom_link?: string;
  notes?: string | null;
}

export interface NewHistoricalSessionFormData {
  session_date: Date;
  meeting_type: 'Zoom' | 'Phone' | 'In-Person';
  summary: string | null;
  sent_exercises: boolean;
  exercise_list: string[] | null;
  paid_amount: number | null;
  payment_status: 'paid' | 'partially_paid' | 'unpaid';
  payment_method: 'cash' | 'bit' | 'transfer' | null;
  payment_date: Date | null;
  payment_notes: string | null;
}
