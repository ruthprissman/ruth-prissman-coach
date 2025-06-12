
import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseClient';
import { SessionType, DEFAULT_SESSION_TYPES } from '@/types/sessionTypes';

export const useSessionTypes = () => {
  return useQuery({
    queryKey: ['sessionTypes'],
    queryFn: async (): Promise<SessionType[]> => {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('session_types')
        .select('*')
        .order('is_default', { ascending: false }) // Default types first
        .order('name');
      
      if (error) {
        // If table doesn't exist yet, return default types for compatibility
        if (error.code === '42P01') {
          console.log('Session types table not found, using default types');
          return DEFAULT_SESSION_TYPES.map((type, index) => ({
            ...type,
            id: index + 1
          }));
        }
        throw error;
      }
      
      return data || [];
    }
  });
};

export const getDefaultSessionType = (): SessionType => {
  return {
    id: 1,
    name: 'פגישה רגילה (קוד הנפש)',
    code: 'regular',
    duration_minutes: 90,
    is_default: true
  };
};

export const getSessionTypeDuration = (sessionTypeId?: number | null, sessionTypes?: SessionType[]): number => {
  if (!sessionTypeId || !sessionTypes) {
    return 90; // Default 90 minutes
  }
  
  const sessionType = sessionTypes.find(type => type.id === sessionTypeId);
  return sessionType ? sessionType.duration_minutes : 90;
};
