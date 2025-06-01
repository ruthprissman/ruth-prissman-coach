
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange } from '@/types/finances';
import IncomeTable from './IncomeTable';
import ExpensesTable from './ExpensesTable';
import { useIncomeData } from '@/hooks/useIncomeData';
import { useExpenseData } from '@/hooks/useExpenseData';

interface FinancialTabsProps {
  dateRange: DateRange;
}

const FinancialTabs: React.FC<FinancialTabsProps> = ({ dateRange }) => {
  const [incomeFilters, setIncomeFilters] = useState<any>({});
  const [expenseFilters, setExpenseFilters] = useState<any>({});

  const {
    incomeData,
    isLoading: isLoadingIncome,
    handleDelete: handleDeleteIncome,
    handleRefresh: handleRefreshIncome
  } = useIncomeData(dateRange, incomeFilters);

  const {
    expenseData,
    isLoading: isLoadingExpenses,
    handleDelete: handleDeleteExpense,
    handleRefresh: handleRefreshExpenses
  } = useExpenseData(dateRange, expenseFilters);

  const handleIncomeFiltersChange = (filters: any) => {
    console.log('Income filters changed:', filters);
    setIncomeFilters(filters);
  };

  const handleExpenseFiltersChange = (filters: any) => {
    console.log('Expense filters changed:', filters);
    setExpenseFilters(filters);
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income">הכנסות</TabsTrigger>
          <TabsTrigger value="expenses">הוצאות</TabsTrigger>
        </TabsList>
        
        <TabsContent value="income" className="space-y-4">
          <IncomeTable
            dateRange={dateRange}
            data={incomeData}
            isLoading={isLoadingIncome}
            onRefresh={handleRefreshIncome}
            onDelete={handleDeleteIncome}
            onFiltersChange={handleIncomeFiltersChange}
          />
        </TabsContent>
        
        <TabsContent value="expenses" className="space-y-4">
          <ExpensesTable
            dateRange={dateRange}
            data={expenseData}
            isLoading={isLoadingExpenses}
            onRefresh={handleRefreshExpenses}
            onDelete={handleDeleteExpense}
            onFiltersChange={handleExpenseFiltersChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialTabs;
