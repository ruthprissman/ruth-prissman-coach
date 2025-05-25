
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import FinancialChart from '@/components/admin/finances/FinancialChart';
import FinancialTabs from '@/components/admin/finances/FinancialTabs';
import FinancialSummary from '@/components/admin/finances/FinancialSummary';
import { DateRange, PeriodType } from '@/types/finances';
import { getDateRangeForPeriod } from '@/utils/financeUtils';
import { useFinancialChartData } from '@/hooks/useFinancialChartData';

// Create a QueryClient instance
const queryClient = new QueryClient();

const FinancesManagementContent = () => {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    return getDateRangeForPeriod('3months');
  });

  const [period, setPeriod] = useState<PeriodType>('3months');

  // Use real chart data
  const { data: chartData = [], isLoading } = useFinancialChartData(dateRange);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    setDateRange(getDateRangeForPeriod(newPeriod));
  };

  return (
    <AdminLayout title="ניהול כספים">
      <Helmet>
        <title>ניהול כספים</title>
      </Helmet>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-6">
          <FinancialChart 
            dateRange={dateRange} 
            onPeriodChange={handlePeriodChange} 
            currentPeriod={period}
            data={chartData}
            isLoading={isLoading}
          />
          <FinancialTabs dateRange={dateRange} />
        </div>

        {/* Sidebar with summary */}
        <div className="w-80 shrink-0">
          <FinancialSummary />
        </div>
      </div>
    </AdminLayout>
  );
};

const FinancesManagement = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <FinancesManagementContent />
    </QueryClientProvider>
  );
};

export default FinancesManagement;
