
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinanceService } from '@/services/FinanceService';
import { Transaction, DateRange } from '@/types/finances';
import { useToast } from '@/hooks/use-toast';

const financeService = new FinanceService();

interface IncomeFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  paymentMethod?: string;
  client?: string;
}

export const useIncomeData = (dateRange: DateRange, filters?: IncomeFilters) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use filters if provided, otherwise use dateRange
  const effectiveDateRange = {
    start: filters?.startDate || dateRange.start,
    end: filters?.endDate || dateRange.end
  };

  // Query for income data
  const {
    data: incomeData = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [
      'incomeData', 
      effectiveDateRange.start.toISOString(), 
      effectiveDateRange.end.toISOString(),
      filters?.category,
      filters?.paymentMethod,
      filters?.client
    ],
    queryFn: async () => {
      console.log('Fetching income data with filters:', filters);
      console.log('Effective date range:', effectiveDateRange);
      
      let data = await financeService.getIncomeTransactions(effectiveDateRange);
      
      // Apply additional filters on the server results
      if (filters?.category && filters.category !== 'all' && filters.category !== '') {
        data = data.filter(item => item.category === filters.category);
      }

      if (filters?.paymentMethod && filters.paymentMethod !== 'all' && filters.paymentMethod !== '') {
        data = data.filter(item => item.payment_method === filters.paymentMethod);
      }

      if (filters?.client && filters.client !== 'all' && filters.client !== '') {
        data = data.filter(item => item.client_name === filters.client);
      }

      console.log('Filtered income data:', data);
      return data;
    },
    enabled: !!effectiveDateRange.start && !!effectiveDateRange.end
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
