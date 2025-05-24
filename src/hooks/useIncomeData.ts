
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinanceService } from '@/services/FinanceService';
import { Transaction, DateRange } from '@/types/finances';
import { useToast } from '@/hooks/use-toast';

const financeService = new FinanceService();

export const useIncomeData = (dateRange: DateRange) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for income data
  const {
    data: incomeData = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['incomeData', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: () => financeService.getIncomeTransactions(dateRange),
    enabled: !!dateRange.start && !!dateRange.end
  });

  // Mutation for deleting a transaction
  const deleteMutation = useMutation({
    mutationFn: (id: number) => financeService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeData'] });
      queryClient.invalidateQueries({ queryKey: ['financialChartData'] });
      toast({
        title: "נמחק בהצלחה",
        description: "הרשומה נמחקה בהצלחה",
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
    if (window.confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return {
    incomeData,
    isLoading,
    error,
    handleDelete,
    handleRefresh,
    isDeleting: deleteMutation.isPending
  };
};
