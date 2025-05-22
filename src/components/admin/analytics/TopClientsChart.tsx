
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

interface ClientData {
  name: string;
  הכנסות: number;
}

interface TopClientsChartProps {
  data: ClientData[];
  isLoading: boolean;
}

const TopClientsChart: React.FC<TopClientsChartProps> = ({ data, isLoading }) => {
  const config = {
    הכנסות: { color: "#4ade80" } // green
  };

  return (
    <div className="w-full">
      <div className="text-xs text-muted-foreground mb-2 text-right">
        10 הלקוחות המובילים לפי הכנסות
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <div className="mt-2">טוען נתונים...</div>
          </div>
        </div>
      ) : (
        <div style={{ direction: "ltr", height: "400px" }}>
          <ChartContainer config={config} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data} 
                layout="vertical" 
                margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120}
                />
                <Tooltip 
                  formatter={(value) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(Number(value))}
                />
                <Bar dataKey="הכנסות" fill="#4ade80" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}
    </div>
  );
};

export default TopClientsChart;
