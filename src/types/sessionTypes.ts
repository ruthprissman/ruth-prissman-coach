
export interface SessionType {
  id: number;
  name: string;
  code: string;
  duration_minutes: number;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_SESSION_TYPES: Omit<SessionType, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'פגישה רגילה (קוד הנפש)',
    code: 'regular',
    duration_minutes: 90,
    is_default: true
  },
  {
    name: 'פגישת אינטייק',
    code: 'intake',
    duration_minutes: 75,
    is_default: false
  },
  {
    name: 'פגישת SEFT',
    code: 'seft',
    duration_minutes: 240,
    is_default: false
  }
];
