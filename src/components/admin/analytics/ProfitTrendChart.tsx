
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ProfitData {
  name: string;
  רווח: number;
}

interface ProfitTrendChartProps {
  data: ProfitData[];
  isLoading: boolean;
}

const ProfitTrendChart: React.FC<ProfitTrendChartProps> = ({ data, isLoading }) => {
  // Chart configuration for RTL support
  const config = {
    רווח: { color: "#60a5fa" } // blue
  };

  return (
    <div className="w-full">
      <div className="text-xs text-muted-foreground mb-2 text-right">
        מגמת רווח ב-12 החודשים האחרונים
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
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(Number(value))}
                />
                <Line 
                  type="monotone" 
                  dataKey="רווח" 
                  stroke="#60a5fa" 
                  strokeWidth={3} 
                  dot={{ r: 5 }} 
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}
    </div>
  );
};

export default ProfitTrendChart;
