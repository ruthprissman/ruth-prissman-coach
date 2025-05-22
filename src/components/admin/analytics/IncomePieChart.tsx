
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

// Dummy data - in a real app this would come from API calls to the transactions table with GROUP BY category
const data = [
  { name: 'טיפולי פיזיותרפיה', value: 35000 },
  { name: 'אימונים אישיים', value: 24000 },
  { name: 'סדנאות', value: 18000 },
  { name: 'ייעוץ מקצועי', value: 12000 },
  { name: 'מוצרי בריאות', value: 9000 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const IncomePieChart: React.FC = () => {
  const config = data.reduce((acc, item, index) => {
    acc[item.name] = { color: COLORS[index % COLORS.length] };
    return acc;
  }, {} as Record<string, { color: string }>);

  return (
    <div className="w-full">
      <div style={{ direction: "ltr", height: "300px" }}>
        <ChartContainer config={config} className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(Number(value))}
              />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default IncomePieChart;
