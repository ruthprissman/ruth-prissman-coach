
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
      default:
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(now);
    }
    
    setDateRange({ start, end });
  }, [period]);

  // Fetch monthly summary data
  const { data: monthlySummaryData, isLoading: isLoadingMonthlySummary } = useQuery({
    queryKey: ['financialSummary', 'monthly'],
    queryFn: async () => {
      try {
        const supabase = await supabaseClient();
        // Implement actual data fetching from the transactions table
        // This would typically join with categories and group by month
        // For now, return placeholder structure that will be replaced with real data
        return Array.from({ length: 12 }, (_, i) => ({
          name: format(subMonths(new Date(), 11 - i), 'MMM'),
          הכנסות: 0,
          הוצאות: 0,
          רווח: 0
        }));
      } catch (error: any) {
        console.error('Error fetching monthly summary:', error);
        toast({
          title: "שגיאה בטעינת נתונים",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Fetch income categories data
  const { data: incomeCategoriesData, isLoading: isLoadingIncomeCategories } = useQuery({
    queryKey: ['incomeCategories'],
    queryFn: async () => {
      try {
        const supabase = await supabaseClient();
        // Implement actual data fetching from transactions joined with categories
        // Group by category and sum amounts where type = 'income'
        return [];
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
    queryKey: ['expenseCategories'],
    queryFn: async () => {
      try {
        const supabase = await supabaseClient();
        // Implement actual data fetching from transactions joined with categories
        // Group by category and sum amounts where type = 'expense'
        return [];
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
        const supabase = await supabaseClient();
        // Implement actual data fetching for profit trends
        // Calculate monthly profit (income - expenses) for last 12 months
        return [];
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
    queryKey: ['topClients'],
    queryFn: async () => {
      try {
        const supabase = await supabaseClient();
        // Implement actual data fetching for top clients
        // Group by client_name and sum amounts where type = 'income'
        // Order by sum desc and limit to 10
        return [];
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
