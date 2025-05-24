
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinanceService } from '@/services/FinanceService';
import { Expense, DateRange } from '@/types/finances';
import { useToast } from '@/hooks/use-toast';

const financeService = new FinanceService();

export const useExpenseData = (dateRange: DateRange) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for expense data
  const {
    data: expenseData = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['expenseData', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: () => financeService.getExpenseTransactions(dateRange),
    enabled: !!dateRange.start && !!dateRange.end
  });

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
    refetch();
  };

  return {
    expenseData,
    isLoading,
    error,
    handleDelete,
    handleRefresh,
    isDeleting: deleteMutation.isPending
  };
};
