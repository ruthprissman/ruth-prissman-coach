
import { useQuery } from '@tanstack/react-query';
import { FinanceService } from '@/services/FinanceService';
import { DateRange } from '@/types/finances';

const financeService = new FinanceService();

export const useFinancialSummary = (dateRange: DateRange) => {
  return useQuery({
    queryKey: ['financialSummary', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: () => financeService.getFinancialSummary(dateRange),
    enabled: !!dateRange.start && !!dateRange.end
  });
};
