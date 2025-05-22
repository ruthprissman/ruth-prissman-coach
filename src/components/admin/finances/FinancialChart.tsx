
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from '@/types/finances';
import { format } from 'date-fns';
import { ChartContainer } from '@/components/ui/chart';

// Dummy data - in a real app this would come from an API call
const generateDummyData = (startDate: Date, endDate: Date) => {
  const data = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const month = format(currentDate, 'MMM');
    const income = Math.floor(Math.random() * 10000) + 5000;
    const expenses = Math.floor(Math.random() * 6000) + 2000;
    
    data.push({
      name: month,
      הכנסות: income,
      הוצאות: expenses,
      רווח: income - expenses,
    });
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return data;
};

interface FinancialChartProps {
  dateRange: DateRange;
  onPeriodChange: (period: 'month' | 'quarter' | 'year') => void;
  currentPeriod: string;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ 
  dateRange, 
  onPeriodChange,
  currentPeriod
}) => {
  const data = generateDummyData(dateRange.start, dateRange.end);
  
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
            onValueChange={(value: 'month' | 'quarter' | 'year') => onPeriodChange(value)}
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
      </CardContent>
    </Card>
  );
};

export default FinancialChart;
