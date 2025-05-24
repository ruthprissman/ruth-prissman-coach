
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export interface AddIncomeData {
  date: Date;
  amount: number;
  source: string;
  category: string;
  client_id?: number;
  client_name?: string;
  payment_method: string;
  reference_number?: string;
  receipt_number?: string;
  session_id?: number;
  status: string;
}

export const useAddIncome = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddIncomeData) => {
      const client = supabaseClient();
      
      const transactionData = {
        date: data.date.toISOString().split('T')[0],
        amount: data.amount,
        type: 'income',
        source: data.source,
        category: data.category,
        client_id: data.client_id || null,
        client_name: data.client_name || null,
        payment_method: data.payment_method,
        reference_number: data.reference_number || null,
        receipt_number: data.receipt_number || null,
        session_id: data.session_id || null,
        status: data.status
      };

      const { data: result, error } = await client
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeData'] });
      queryClient.invalidateQueries({ queryKey: ['financialChartData'] });
      toast({
        title: "הכנסה נוספה בהצלחה",
        description: "הרשומה נשמרה במערכת",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בהוספת הכנסה",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};
