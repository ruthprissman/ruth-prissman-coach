
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import IncomeTable from './IncomeTable';
import ExpensesTable from './ExpensesTable';
import { DateRange } from '@/types/finances';

interface FinancialTabsProps {
  dateRange: DateRange;
}

const FinancialTabs: React.FC<FinancialTabsProps> = ({ dateRange }) => {
  const [activeTab, setActiveTab] = useState("income");

  return (
    <Card className="w-full">
      <Tabs defaultValue="income" className="w-full" dir="rtl" onValueChange={setActiveTab}>
        <div className="border-b px-3">
          <TabsList className="bg-transparent h-12">
            <TabsTrigger value="income" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              הכנסות
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              הוצאות
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="income" className="p-0 border-none">
          <IncomeTable dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="expenses" className="p-0 border-none">
          <ExpensesTable dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default FinancialTabs;
