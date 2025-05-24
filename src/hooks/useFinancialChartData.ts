
import { useQuery } from '@tanstack/react-query';
import { FinanceService } from '@/services/FinanceService';
import { DateRange } from '@/types/finances';

const financeService = new FinanceService();

export const useFinancialChartData = (dateRange: DateRange) => {
  return useQuery({
    queryKey: ['financialChartData', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: () => financeService.getFinancialChartData(dateRange),
    enabled: !!dateRange.start && !!dateRange.end
  });
};
