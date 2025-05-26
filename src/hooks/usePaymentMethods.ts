
import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseClient';

export interface PaymentMethod {
  id: number;
  name: string;
}

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('payment_methods')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return data as PaymentMethod[];
    }
  });
};
