
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useFinancialSummary } from '@/hooks/useFinancialSummary';
import { getDateRangeForPeriod } from '@/utils/financeUtils';

const FinancialSummary: React.FC = () => {
  const allTimeRange = getDateRangeForPeriod('alltime');
  const { data: summary, isLoading } = useFinancialSummary(allTimeRange);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">סיכום מתחילת הנתונים</h3>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">סיכום מתחילת הנתונים</h3>
      
      {/* Total Income */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">סך הכנסות</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary?.totalIncome || 0)}
          </div>
        </CardContent>
      </Card>

      {/* Total Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">סך הוצאות</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summary?.totalExpenses || 0)}
          </div>
        </CardContent>
      </Card>

      {/* Net Profit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">רווח נקי</CardTitle>
          <DollarSign className={`h-4 w-4 ${(summary?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(summary?.netProfit || 0)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSummary;
