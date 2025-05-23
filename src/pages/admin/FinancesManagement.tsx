
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import FinancialChart from '@/components/admin/finances/FinancialChart';
import FinancialTabs from '@/components/admin/finances/FinancialTabs';
import { DateRange, PeriodType } from '@/types/finances';
import { getDateRangeForPeriod } from '@/utils/financeUtils';

// Create a QueryClient instance
const queryClient = new QueryClient();

const FinancesManagementContent = () => {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    return getDateRangeForPeriod('3months');
  });

  const [period, setPeriod] = useState<PeriodType>('3months');

  // Mock data for chart - will be replaced with real API calls
  const mockChartData = [];
  const isLoading = false;

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    setDateRange(getDateRangeForPeriod(newPeriod));
  };

  return (
    <AdminLayout title="ניהול כספים">
      <Helmet>
        <title>ניהול כספים</title>
      </Helmet>

      <div className="space-y-6">
        <FinancialChart 
          dateRange={dateRange} 
          onPeriodChange={handlePeriodChange} 
          currentPeriod={period}
          data={mockChartData}
          isLoading={isLoading}
        />
        <FinancialTabs dateRange={dateRange} />
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
