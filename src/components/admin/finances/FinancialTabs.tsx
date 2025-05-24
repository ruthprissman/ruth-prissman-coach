
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import IncomeTable from './IncomeTable';
import ExpensesTable from './ExpensesTable';
import { DateRange } from '@/types/finances';
import { useIncomeData } from '@/hooks/useIncomeData';
import { useExpenseData } from '@/hooks/useExpenseData';

interface FinancialTabsProps {
  dateRange: DateRange;
}

const FinancialTabs: React.FC<FinancialTabsProps> = ({ dateRange }) => {
  const [activeTab, setActiveTab] = useState("income");

  // Use the real income data hook
  const {
    incomeData,
    isLoading: isIncomeLoading,
    handleDelete: handleIncomeDelete,
    handleRefresh: handleIncomeRefresh
  } = useIncomeData(dateRange);

  // Use the real expense data hook
  const {
    expenseData,
    isLoading: isExpenseLoading,
    handleDelete: handleExpenseDelete,
    handleRefresh: handleExpenseRefresh
  } = useExpenseData(dateRange);

  const handleExpenseEdit = (expense: any) => {
    console.log('Edit expense:', expense);
    // TODO: Implement edit functionality for expenses
  };

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
          <IncomeTable 
            dateRange={dateRange}
            data={incomeData}
            isLoading={isIncomeLoading}
            onRefresh={handleIncomeRefresh}
            onDelete={handleIncomeDelete}
          />
        </TabsContent>
        
        <TabsContent value="expenses" className="p-0 border-none">
          <ExpensesTable 
            dateRange={dateRange}
            data={expenseData}
            isLoading={isExpenseLoading}
            onRefresh={handleExpenseRefresh}
            onEdit={handleExpenseEdit}
            onDelete={handleExpenseDelete}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default FinancialTabs;
