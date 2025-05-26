
import React, { useState, useEffect } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters } from 'date-fns';
import { supabaseClient } from '@/lib/supabaseClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange, PeriodType } from '@/types/finances';
import FinancialChart from '@/components/admin/finances/FinancialChart';
import ExpensesPieChart from '@/components/admin/analytics/ExpensesPieChart';
import IncomePieChart from '@/components/admin/analytics/IncomePieChart';
import MonthlyFinanceChart from '@/components/admin/analytics/MonthlyFinanceChart';
import ProfitTrendChart from '@/components/admin/analytics/ProfitTrendChart';
import TopClientsChart from '@/components/admin/analytics/TopClientsChart';
import { useToast } from '@/hooks/use-toast';
import { useFinancialChartData } from '@/hooks/useFinancialChartData';

// Create a QueryClient instance
const queryClient = new QueryClient();

const FinancialAnalyticsContent: React.FC = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<PeriodType>("month");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfMonth(subMonths(new Date(), 1)),
    end: endOfMonth(new Date())
  });

  // Update date range when period changes
  useEffect(() => {
    const now = new Date();
    let start, end;
    
    switch (period) {
      case "month":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(now);
        break;
      case "quarter":
        start = startOfQuarter(subQuarters(now, 1));
        end = endOfQuarter(now);
        break;
      case "3months":
        start = startOfMonth(subMonths(now, 3));
        end = endOfMonth(now);
        break;
      case "year":
        start = startOfMonth(subMonths(now, 12));
        end = endOfMonth(now);
        break;
      case "alltime":
        start = new Date(2020, 0, 1); // Start from 2020
        end = endOfMonth(now);
        break;
      default:
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(now);
    }
    
    setDateRange({ start, end });
  }, [period]);

  // Use the existing financial chart data hook
  const { data: monthlySummaryData = [], isLoading: isLoadingMonthlySummary } = useFinancialChartData(dateRange);

  // Fetch income categories data
  const { data: incomeCategoriesData, isLoading: isLoadingIncomeCategories } = useQuery({
    queryKey: ['incomeCategories', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      try {
        const supabase = supabaseClient();
        
        const { data, error } = await supabase
          .from('transactions')
          .select('category, amount')
          .eq('type', 'income')
          .gte('date', dateRange.start.toISOString().split('T')[0])
          .lte('date', dateRange.end.toISOString().split('T')[0]);
        
        if (error) throw error;
        
        // Group by category and sum amounts
        const categoryTotals = (data || []).reduce((acc: Record<string, number>, transaction) => {
          const category = transaction.category || 'אחר';
          acc[category] = (acc[category] || 0) + transaction.amount;
          return acc;
        }, {});
        
        return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
      } catch (error: any) {
        console.error('Error fetching income categories:', error);
        toast({
          title: "שגיאה בטעינת נתוני קטגוריות הכנסה",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Fetch expense categories data
  const { data: expenseCategoriesData, isLoading: isLoadingExpenseCategories } = useQuery({
    queryKey: ['expenseCategories', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      try {
        const supabase = supabaseClient();
        
        const { data, error } = await supabase
          .from('transactions')
          .select('category, amount')
          .eq('type', 'expense')
          .gte('date', dateRange.start.toISOString().split('T')[0])
          .lte('date', dateRange.end.toISOString().split('T')[0]);
        
        if (error) throw error;
        
        // Group by category and sum amounts
        const categoryTotals = (data || []).reduce((acc: Record<string, number>, transaction) => {
          const category = transaction.category || 'אחר';
          acc[category] = (acc[category] || 0) + transaction.amount;
          return acc;
        }, {});
        
        return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
      } catch (error: any) {
        console.error('Error fetching expense categories:', error);
        toast({
          title: "שגיאה בטעינת נתוני קטגוריות הוצאה",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Fetch profit trend data
  const { data: profitTrendData, isLoading: isLoadingProfitTrend } = useQuery({
    queryKey: ['profitTrend'],
    queryFn: async () => {
      try {
        const supabase = supabaseClient();
        const last12Months = subMonths(new Date(), 12);
        
        const { data, error } = await supabase
          .from('transactions')
          .select('date, amount, type')
          .gte('date', last12Months.toISOString().split('T')[0])
          .lte('date', new Date().toISOString().split('T')[0]);
        
        if (error) throw error;
        
        // Group by month and calculate profit
        const monthlyData = new Map();
        
        (data || []).forEach((transaction: any) => {
          const date = new Date(transaction.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleDateString('he-IL', { year: 'numeric', month: 'short' });
          
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, { name: monthName, income: 0, expenses: 0 });
          }
          
          const current = monthlyData.get(monthKey);
          if (transaction.type === 'income') {
            current.income += transaction.amount;
          } else {
            current.expenses += transaction.amount;
          }
        });
        
        return Array.from(monthlyData.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, data]) => ({
            name: data.name,
            רווח: data.income - data.expenses
          }));
      } catch (error: any) {
        console.error('Error fetching profit trend:', error);
        toast({
          title: "שגיאה בטעינת נתוני מגמת רווח",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Fetch top clients data
  const { data: topClientsData, isLoading: isLoadingTopClients } = useQuery({
    queryKey: ['topClients', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      try {
        const supabase = supabaseClient();
        
        const { data, error } = await supabase
          .from('transactions')
          .select('client_name, amount')
          .eq('type', 'income')
          .gte('date', dateRange.start.toISOString().split('T')[0])
          .lte('date', dateRange.end.toISOString().split('T')[0])
          .not('client_name', 'is', null);
        
        if (error) throw error;
        
        // Group by client and sum amounts
        const clientTotals = (data || []).reduce((acc: Record<string, number>, transaction) => {
          const clientName = transaction.client_name || 'לא צוין';
          acc[clientName] = (acc[clientName] || 0) + transaction.amount;
          return acc;
        }, {});
        
        return Object.entries(clientTotals)
          .map(([name, הכנסות]) => ({ name, הכנסות }))
          .sort((a, b) => b.הכנסות - a.הכנסות)
          .slice(0, 10);
      } catch (error: any) {
        console.error('Error fetching top clients:', error);
        toast({
          title: "שגיאה בטעינת נתוני לקוחות מובילים",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    }
  });

  return (
    <AdminLayout title="ניתוחים גרפיים">
      <div dir="rtl" className="container mx-auto space-y-6">
        {/* Summary Chart with Period Selector */}
        <FinancialChart 
          dateRange={dateRange}
          onPeriodChange={setPeriod}
          currentPeriod={period}
          data={monthlySummaryData || []}
          isLoading={isLoadingMonthlySummary}
        />

        {/* Main Analysis Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto mb-4">
            <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
            <TabsTrigger value="income">הכנסות</TabsTrigger>
            <TabsTrigger value="expenses">הוצאות</TabsTrigger>
            <TabsTrigger value="clients">לקוחות</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>התפלגות הכנסות לפי קטגוריה</CardTitle>
                </CardHeader>
                <CardContent>
                  <IncomePieChart 
                    data={incomeCategoriesData || []} 
                    isLoading={isLoadingIncomeCategories} 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>התפלגות הוצאות לפי קטגוריה</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpensesPieChart 
                    data={expenseCategoriesData || []}
                    isLoading={isLoadingExpenseCategories}  
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>מגמת רווח חודשי</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfitTrendChart 
                  data={profitTrendData || []}
                  isLoading={isLoadingProfitTrend}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income">
            <Card>
              <CardHeader>
                <CardTitle>סיכום הכנסות חודשי</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyFinanceChart 
                  data={monthlySummaryData || []}
                  isLoading={isLoadingMonthlySummary}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>סיכום הוצאות חודשי</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyFinanceChart 
                  data={monthlySummaryData || []}
                  isLoading={isLoadingMonthlySummary}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>לקוחות מובילים</CardTitle>
              </CardHeader>
              <CardContent>
                <TopClientsChart 
                  data={topClientsData || []}
                  isLoading={isLoadingTopClients}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

const FinancialAnalytics: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <FinancialAnalyticsContent />
    </QueryClientProvider>
  );
};

export default FinancialAnalytics;
