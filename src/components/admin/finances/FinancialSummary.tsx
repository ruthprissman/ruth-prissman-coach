
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse min-h-0 h-16">
            <CardContent className="p-3">
              <div className="h-10 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      {/* Total Income */}
      <Card className="hover:shadow-md transition-shadow min-h-0 h-20">
        <CardContent className="p-3">
          <div className="flex items-center justify-between h-full">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">סך הכנסות</p>
              <p className="text-lg font-bold text-green-600 truncate">
                {formatCurrency(summary?.totalIncome || 0)}
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>

      {/* Total Expenses */}
      <Card className="hover:shadow-md transition-shadow min-h-0 h-20">
        <CardContent className="p-3">
          <div className="flex items-center justify-between h-full">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">סך הוצאות</p>
              <p className="text-lg font-bold text-red-600 truncate">
                {formatCurrency(summary?.totalExpenses || 0)}
              </p>
            </div>
            <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>

      {/* Net Profit */}
      <Card className="hover:shadow-md transition-shadow min-h-0 h-20">
        <CardContent className="p-3">
          <div className="flex items-center justify-between h-full">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">רווח נקי</p>
              <p className={`text-lg font-bold truncate ${(summary?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(summary?.netProfit || 0)}
              </p>
            </div>
            <DollarSign className={`h-5 w-5 flex-shrink-0 ml-2 ${(summary?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSummary;
