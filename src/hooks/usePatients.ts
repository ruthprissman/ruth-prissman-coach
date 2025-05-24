
import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseClient';

export interface Patient {
  id: number;
  name: string;
}

export const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async (): Promise<Patient[]> => {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('patients')
        .select('id, name')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    }
  });
};
