
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

  // Mutation for updating a transaction
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Transaction> }) =>
      financeService.updateTransaction(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeData'] });
      toast({
        title: "עודכן בהצלחה",
        description: "הרשומה עודכנה בהצלחה",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בעדכון",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation for deleting a transaction
  const deleteMutation = useMutation({
    mutationFn: (id: number) => financeService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeData'] });
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

  const handleEdit = (transaction: Transaction) => {
    // This will be implemented when edit modal is created
    console.log('Edit transaction:', transaction);
  };

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
    handleEdit,
    handleDelete,
    handleRefresh,
    updateTransaction: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
