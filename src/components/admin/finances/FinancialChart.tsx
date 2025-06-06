
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange, PeriodType } from '@/types/finances';
import { format } from 'date-fns';
import { ChartContainer } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useFinancialSummary } from '@/hooks/useFinancialSummary';
import { getDateRangeForPeriod } from '@/utils/financeUtils';

interface ChartData {
  name: string;
  הכנסות: number;
  הוצאות: number;
  רווח: number;
}

interface FinancialChartProps {
  dateRange: DateRange;
  onPeriodChange: (period: PeriodType) => void;
  currentPeriod: PeriodType;
  data: ChartData[];
  isLoading: boolean;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ 
  dateRange, 
  onPeriodChange,
  currentPeriod,
  data,
  isLoading
}) => {
  // Chart configuration for RTL support
  const config = {
    הכנסות: { color: "#4ade80" },
    הוצאות: { color: "#f87171" },
    רווח: { color: "#60a5fa" }
  };

  // Get all-time data for summary
  const allTimeRange = getDateRangeForPeriod('alltime');
  const { data: summary, isLoading: isLoadingSummary } = useFinancialSummary(allTimeRange);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold">סיכום כספים</CardTitle>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="text-sm text-muted-foreground ml-2">טווח זמן:</span>
          <Select
            value={currentPeriod}
            onValueChange={(value: PeriodType) => onPeriodChange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="בחר טווח זמן" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">חודש</SelectItem>
              <SelectItem value="quarter">רבעון</SelectItem>
              <SelectItem value="3months">3 חודשים</SelectItem>
              <SelectItem value="year">שנה</SelectItem>
              <SelectItem value="alltime">מתחילת הנתונים</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-xs text-muted-foreground mb-2 text-right">
          {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}
        </div>
        
        <div className="flex gap-4">
          {/* Summary Section - Right Side */}
          <div className="w-48 space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 text-right">סיכום כללי</h4>
            
            {isLoadingSummary ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Total Income */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-800">סך הכנסות</span>
                  </div>
                  <div className="text-lg font-bold text-green-700 text-right">
                    {formatCurrency(summary?.totalIncome || 0)}
                  </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-800">סך הוצאות</span>
                  </div>
                  <div className="text-lg font-bold text-red-700 text-right">
                    {formatCurrency(summary?.totalExpenses || 0)}
                  </div>
                </div>

                {/* Net Profit */}
                <div className={`${(summary?.netProfit || 0) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <DollarSign className={`h-4 w-4 ${(summary?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                    <span className={`text-xs font-medium ${(summary?.netProfit || 0) >= 0 ? 'text-blue-800' : 'text-red-800'}`}>רווח נקי</span>
                  </div>
                  <div className={`text-lg font-bold text-right ${(summary?.netProfit || 0) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {formatCurrency(summary?.netProfit || 0)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Chart Section - Left Side */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-[300px]">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <div className="mt-2">טוען נתונים...</div>
                </div>
              </div>
            ) : (
              <div style={{ direction: "ltr", height: "300px" }}>
                <ChartContainer config={config} className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(Number(value))}
                      />
                      <Legend wrapperStyle={{ paddingTop: "10px" }} />
                      <Bar dataKey="הכנסות" fill="#4ade80" />
                      <Bar dataKey="הוצאות" fill="#f87171" />
                      <Bar dataKey="רווח" fill="#60a5fa" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialChart;
