
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { format, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';

// Dummy data - in a real app this would come from API calls to the transactions table
const generateProfitTrendData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const month = format(monthDate, 'MMM', { locale: he });
    
    // Generate random data for demo purposes with some trend
    const baseProfit = 3000;
    const trend = i * 200; // increasing trend
    const randomVariation = Math.floor(Math.random() * 2000) - 1000;
    
    data.push({
      name: month,
      רווח: baseProfit + trend + randomVariation,
    });
  }
  
  return data;
};

const ProfitTrendChart: React.FC = () => {
  const data = generateProfitTrendData();
  
  // Chart configuration for RTL support
  const config = {
    רווח: { color: "#60a5fa" } // blue
  };

  return (
    <div className="w-full">
      <div className="text-xs text-muted-foreground mb-2 text-right">
        מגמת רווח ב-12 החודשים האחרונים
      </div>
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
    </div>
  );
};

export default ProfitTrendChart;
