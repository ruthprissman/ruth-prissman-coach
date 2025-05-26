
import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseClient';

export interface FinanceCategory {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

export const useFinanceCategories = (type?: 'income' | 'expense') => {
  return useQuery({
    queryKey: ['financeCategories', type],
    queryFn: async () => {
      const client = supabaseClient();
      
      let query = client
        .from('finance_categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data as FinanceCategory[];
    }
  });
};
