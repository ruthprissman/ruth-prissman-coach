
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface MonthlyData {
  name: string;
  הכנסות: number;
  הוצאות: number;
  רווח: number;
}

interface MonthlyFinanceChartProps {
  data: MonthlyData[];
  isLoading: boolean;
}

const MonthlyFinanceChart: React.FC<MonthlyFinanceChartProps> = ({ data, isLoading }) => {
  // Chart configuration for RTL support
  const config = {
    הכנסות: { color: "#4ade80" }, // green
    הוצאות: { color: "#f87171" }, // red
    רווח: { color: "#60a5fa" }    // blue
  };

  return (
    <div className="w-full">
      <div className="text-xs text-muted-foreground mb-2 text-right">
        נתונים מ-12 החודשים האחרונים
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-[360px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <div className="mt-2">טוען נתונים...</div>
          </div>
        </div>
      ) : (
        <div style={{ direction: "ltr", height: "360px" }}>
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
  );
};

export default MonthlyFinanceChart;
