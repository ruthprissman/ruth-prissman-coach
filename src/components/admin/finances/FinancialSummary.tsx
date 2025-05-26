
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Income */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">סך הכנסות</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary?.totalIncome || 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Total Expenses */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">סך הוצאות</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary?.totalExpenses || 0)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      {/* Net Profit */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">רווח נקי</p>
              <p className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(summary?.netProfit || 0)}
              </p>
            </div>
            <DollarSign className={`h-8 w-8 ${(summary?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSummary;
