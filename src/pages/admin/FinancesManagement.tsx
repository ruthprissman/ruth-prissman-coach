
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '@/components/admin/AdminLayout';
import FinancialChart from '@/components/admin/finances/FinancialChart';
import FinancialTabs from '@/components/admin/finances/FinancialTabs';
import { DateRange, PeriodType } from '@/types/finances';
import { getDateRangeForPeriod } from '@/utils/financeUtils';

const FinancesManagement = () => {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    // Default range: from beginning of last month to end of next month
    return getDateRangeForPeriod('3months');
  });

  const [period, setPeriod] = useState<PeriodType>('3months');

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
        <FinancialChart dateRange={dateRange} onPeriodChange={handlePeriodChange} currentPeriod={period} />
        <FinancialTabs dateRange={dateRange} />
      </div>
    </AdminLayout>
  );
};

export default FinancesManagement;
