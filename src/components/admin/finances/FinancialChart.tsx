
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange, PeriodType } from '@/types/finances';
import { format } from 'date-fns';
import { ChartContainer } from '@/components/ui/chart';

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
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-xs text-muted-foreground mb-2 text-right">
          {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}
        </div>
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
      </CardContent>
    </Card>
  );
};

export default FinancialChart;
