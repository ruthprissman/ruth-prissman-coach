
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { format, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';

// Dummy data - in a real app this would come from API calls to the transactions table
const generateLastTwelveMonthsData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const month = format(monthDate, 'MMM', { locale: he });
    
    // Generate random data for demo purposes
    const income = Math.floor(Math.random() * 10000) + 5000;
    const expenses = Math.floor(Math.random() * 6000) + 2000;
    
    data.push({
      name: month,
      הכנסות: income,
      הוצאות: expenses,
      רווח: income - expenses,
    });
  }
  
  return data;
};

const MonthlyFinanceChart: React.FC = () => {
  const data = generateLastTwelveMonthsData();
  
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
    </div>
  );
};

export default MonthlyFinanceChart;
