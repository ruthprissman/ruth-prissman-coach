
import { Patient, Session } from './patient';

export interface SessionWithPatient extends Session {
  patients: Patient;
}
