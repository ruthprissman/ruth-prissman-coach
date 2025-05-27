
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinanceService } from '@/services/FinanceService';
import { Expense, DateRange } from '@/types/finances';
import { useToast } from '@/hooks/use-toast';

const financeService = new FinanceService();

interface ExpenseFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  payee?: string;
}

export const useExpenseData = (dateRange: DateRange, filters?: ExpenseFilters) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('=== useExpenseData HOOK DEBUG ===');
  console.log('Hook called with dateRange:', dateRange);
  console.log('Hook called with filters:', filters);

  // Use filter dates if provided, otherwise use dateRange
  const effectiveDateRange = {
    start: filters?.startDate || dateRange.start,
    end: filters?.endDate || dateRange.end
  };

  console.log('Effective date range:', effectiveDateRange);

  // Query for expense data
  const {
    data: expenseData = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['expenseData', effectiveDateRange.start.toISOString(), effectiveDateRange.end.toISOString(), filters],
    queryFn: async () => {
      console.log('useExpenseData: Query function executing...');
      console.log('useExpenseData: Fetching expenses for date range:', effectiveDateRange);
      console.log('useExpenseData: With filters:', filters);
      try {
        const result = await financeService.getExpenseTransactions(effectiveDateRange, filters);
        console.log('useExpenseData: Received expenses from service:', result);
        console.log('useExpenseData: Number of expenses received:', result.length);
        return result;
      } catch (error) {
        console.error('useExpenseData: Error in query function:', error);
        throw error;
      }
    },
    enabled: !!effectiveDateRange.start && !!effectiveDateRange.end,
    retry: 1,
    retryDelay: 1000
  });

  console.log('useExpenseData: Current query state:');
  console.log('- data:', expenseData);
  console.log('- isLoading:', isLoading);
  console.log('- error:', error);
  console.log('- data length:', expenseData?.length || 0);

  // Mutation for deleting an expense
  const deleteMutation = useMutation({
    mutationFn: (id: number) => financeService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseData'] });
      queryClient.invalidateQueries({ queryKey: ['financialChartData'] });
      toast({
        title: "נמחק בהצלחה",
        description: "ההוצאה נמחקה בהצלחה",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה במחיקה",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleRefresh = () => {
    console.log('useExpenseData: Refreshing expense data');
    refetch();
  };

  console.log('useExpenseData: Returning state - data length:', expenseData?.length || 0, 'loading:', isLoading, 'error:', error);
  console.log('=== END useExpenseData HOOK DEBUG ===');

  return {
    expenseData,
    isLoading,
    error,
    handleDelete,
    handleRefresh,
    isDeleting: deleteMutation.isPending
  };
};
