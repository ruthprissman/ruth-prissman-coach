
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
      
      // המרה מעברית לאנגלית לסטטוס
      const statusMapping = {
        'מאושר': 'confirmed',
        'טיוטה': 'draft'
      };

      // מיפוי קטגוריות מעברית לאנגלית
      const categoryMapping = {
        'טיפולים': 'therapy',
        'ייעוץ': 'consultation',
        'סדנאות': 'workshop',
        'אחר': 'other'
      };

      // מיפוי אמצעי תשלום מעברית לאנגלית
      const paymentMethodMapping = {
        'מזומן': 'cash',
        'ביט': 'bit',
        'העברה': 'transfer'
      };
      
      // אם יש client_id (לקוח מטבלת לקוחות) ולא הוגדרה קטגוריה, הגדר אוטומטית "טיפולים"
      let finalCategory = data.category;
      if (data.client_id && (!data.category || data.category === '')) {
        finalCategory = 'therapy';
      } else {
        // המר מעברית לאנגלית
        finalCategory = categoryMapping[data.category as keyof typeof categoryMapping] || data.category;
      }
      
      const transactionData = {
        date: data.date.toISOString().split('T')[0],
        amount: data.amount,
        type: 'income',
        source: data.source,
        category: finalCategory,
        client_id: data.client_id || null,
        client_name: data.client_name || null,
        payment_method: paymentMethodMapping[data.payment_method as keyof typeof paymentMethodMapping] || data.payment_method,
        reference_number: data.reference_number || null,
        receipt_number: data.receipt_number || null,
        session_id: data.session_id || null,
        status: statusMapping[data.status as keyof typeof statusMapping] || 'draft'
      };

      console.log('Sending transaction data:', transactionData);

      const { data: result, error } = await client
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
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
      console.error('Add income error:', error);
      toast({
        title: "שגיאה בהוספת הכנסה",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};
