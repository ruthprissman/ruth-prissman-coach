
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

// Dummy data - in a real app this would come from API calls to the transactions table
const data = [
  { name: 'דני לוי', הכנסות: 12500 },
  { name: 'רונית כהן', הכנסות: 11200 },
  { name: 'אמיר גולן', הכנסות: 9800 },
  { name: 'מיכל אברהם', הכנסות: 8900 },
  { name: 'יוסי מזרחי', הכנסות: 7600 },
  { name: 'נועה שמעוני', הכנסות: 7100 },
  { name: 'גיא פרץ', הכנסות: 6500 },
  { name: 'דנה אלון', הכנסות: 6200 },
  { name: 'אורי שרון', הכנסות: 5800 },
  { name: 'שירה לוין', הכנסות: 5400 },
].sort((a, b) => b.הכנסות - a.הכנסות); // Sort by income, highest first

const TopClientsChart: React.FC = () => {
  const config = {
    הכנסות: { color: "#4ade80" } // green
  };

  return (
    <div className="w-full">
      <div className="text-xs text-muted-foreground mb-2 text-right">
        10 הלקוחות המובילים לפי הכנסות
      </div>
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
    </div>
  );
};

export default TopClientsChart;
