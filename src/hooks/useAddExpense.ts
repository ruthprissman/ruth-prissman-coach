
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export interface AddExpenseData {
  date: Date;
  amount: number;
  category: string;
  payee: string;
  description: string;
  payment_method: string;
  reference_number?: string;
  status: string;
}

export const useAddExpense = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddExpenseData) => {
      const client = supabaseClient();
      
      // מיפוי קטגוריות מעברית לאנגלית
      const categoryMapping = {
        'שכירות': 'rent',
        'ציוד משרדי': 'supplies',
        'שירותים מקצועיים': 'services',
        'מסים': 'taxes',
        'חשבונות': 'utilities',
        'אחר': 'other'
      };

      // מיפוי אמצעי תשלום מעברית לאנגלית
      const paymentMethodMapping = {
        'אשראי': 'credit',
        'העברה בנקאית': 'transfer',
        'מזומן': 'cash',
        'צ\'ק': 'check'
      };

      // המרה מעברית לאנגלית לסטטוס
      const statusMapping = {
        'מאושר': 'confirmed',
        'טיוטה': 'draft'
      };
      
      const transactionData = {
        date: data.date.toISOString().split('T')[0],
        amount: data.amount,
        type: 'expense',
        category: categoryMapping[data.category as keyof typeof categoryMapping] || data.category,
        client_name: data.payee, // Store payee in client_name field
        source: data.description, // Store description in source field
        payment_method: paymentMethodMapping[data.payment_method as keyof typeof paymentMethodMapping] || data.payment_method,
        reference_number: data.reference_number || null,
        status: statusMapping[data.status as keyof typeof statusMapping] || 'draft'
      };

      console.log('Sending expense transaction data:', transactionData);

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
      queryClient.invalidateQueries({ queryKey: ['expenseData'] });
      queryClient.invalidateQueries({ queryKey: ['financialChartData'] });
      toast({
        title: "הוצאה נוספה בהצלחה",
        description: "הרשומה נשמרה במערכת",
      });
    },
    onError: (error: any) => {
      console.error('Add expense error:', error);
      toast({
        title: "שגיאה בהוספת הוצאה",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};
