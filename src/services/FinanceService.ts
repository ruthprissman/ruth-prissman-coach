import { supabaseClient } from '@/lib/supabaseClient';
import { Transaction, Expense, DateRange } from '@/types/finances';

export class FinanceService {
  /**
   * Get income transactions within a date range
   */
  public async getIncomeTransactions(dateRange: DateRange): Promise<Transaction[]> {
    try {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('transactions')
        .select(`
          id,
          date,
          amount,
          type,
          status,
          source,
          category,
          client_name,
          client_id,
          payment_method,
          reference_number,
          receipt_number,
          session_id
        `)
        .eq('type', 'income')
        .gte('date', dateRange.start.toISOString().split('T')[0])
        .lte('date', dateRange.end.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return (data || []).map(transaction => ({
        ...transaction,
        date: new Date(transaction.date)
      })) as Transaction[];
    } catch (err) {
      console.error('Error fetching income transactions:', err);
      throw err;
    }
  }

  /**
   * Get expense transactions within a date range
   */
  public async getExpenseTransactions(dateRange: DateRange): Promise<Expense[]> {
    try {
      const client = supabaseClient();
      
      console.log('Fetching expense transactions from:', dateRange.start.toISOString().split('T')[0], 'to:', dateRange.end.toISOString().split('T')[0]);
      
      const { data, error } = await client
        .from('transactions')
        .select(`
          id,
          date,
          amount,
          category,
          client_name,
          source,
          payment_method,
          reference_number,
          status,
          type
        `)
        .eq('type', 'expense')
        .gte('date', dateRange.start.toISOString().split('T')[0])
        .lte('date', dateRange.end.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Database error fetching expenses:', error);
        throw error;
      }
      
      console.log('Raw expense data from DB:', data);
      
      // Map the data to match the Expense interface
      return (data || []).map(expense => ({
        ...expense,
        date: new Date(expense.date),
        // Use client_name or source as payee
        payee: expense.client_name || expense.source || 'לא צוין',
        // Create description from available fields
        description: `${expense.category || ''} - ${expense.source || ''}`.trim().replace(/^-\s*|-\s*$/, '') || 'ללא תיאור'
      })) as Expense[];
    } catch (err) {
      console.error('Error fetching expense transactions:', err);
      throw err;
    }
  }

  /**
   * Update a transaction
   */
  public async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction> {
    try {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return {
        ...data,
        date: new Date(data.date)
      } as Transaction;
    } catch (err) {
      console.error('Error updating transaction:', err);
      throw err;
    }
  }

  /**
   * Delete a transaction
   */
  public async deleteTransaction(id: number): Promise<void> {
    try {
      const client = supabaseClient();
      
      const { error } = await client
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  }

  /**
   * Get financial summary for a date range
   */
  public async getFinancialSummary(dateRange: DateRange): Promise<{ totalIncome: number; totalExpenses: number; netProfit: number }> {
    try {
      const client = supabaseClient();
      
      // Get total income
      const { data: incomeData, error: incomeError } = await client
        .from('transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('date', dateRange.start.toISOString().split('T')[0])
        .lte('date', dateRange.end.toISOString().split('T')[0]);
      
      if (incomeError) {
        throw incomeError;
      }
      
      // Get total expenses
      const { data: expenseData, error: expenseError } = await client
        .from('transactions')
        .select('amount')
        .eq('type', 'expense')
        .gte('date', dateRange.start.toISOString().split('T')[0])
        .lte('date', dateRange.end.toISOString().split('T')[0]);
      
      if (expenseError) {
        throw expenseError;
      }
      
      const totalIncome = (incomeData || []).reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = (expenseData || []).reduce((sum, item) => sum + item.amount, 0);
      const netProfit = totalIncome - totalExpenses;
      
      return {
        totalIncome,
        totalExpenses,
        netProfit
      };
    } catch (err) {
      console.error('Error fetching financial summary:', err);
      throw err;
    }
  }

  /**
   * Get aggregated financial data for chart display
   */
  public async getFinancialChartData(dateRange: DateRange): Promise<any[]> {
    try {
      const client = supabaseClient();
      
      // Get income data grouped by month
      const { data: incomeData, error: incomeError } = await client
        .from('transactions')
        .select('date, amount')
        .eq('type', 'income')
        .gte('date', dateRange.start.toISOString().split('T')[0])
        .lte('date', dateRange.end.toISOString().split('T')[0]);
      
      if (incomeError) {
        throw incomeError;
      }
      
      // Get expense data grouped by month
      const { data: expenseData, error: expenseError } = await client
        .from('transactions')
        .select('date, amount')
        .eq('type', 'expense')
        .gte('date', dateRange.start.toISOString().split('T')[0])
        .lte('date', dateRange.end.toISOString().split('T')[0]);
      
      if (expenseError) {
        throw expenseError;
      }
      
      // Group data by month
      const monthlyData = new Map();
      
      // Process income data
      (incomeData || []).forEach((transaction: any) => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('he-IL', { year: 'numeric', month: 'short' });
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            name: monthName,
            הכנסות: 0,
            הוצאות: 0,
            רווח: 0
          });
        }
        
        const current = monthlyData.get(monthKey);
        current.הכנסות += transaction.amount;
        current.רווח = current.הכנסות - current.הוצאות;
      });
      
      // Process expense data
      (expenseData || []).forEach((transaction: any) => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('he-IL', { year: 'numeric', month: 'short' });
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            name: monthName,
            הכנסות: 0,
            הוצאות: 0,
            רווח: 0
          });
        }
        
        const current = monthlyData.get(monthKey);
        current.הוצאות += transaction.amount;
        current.רווח = current.הכנסות - current.הוצאות;
      });
      
      // Convert to array and sort by date
      const result = Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, data]) => data);
      
      return result;
    } catch (err) {
      console.error('Error fetching financial chart data:', err);
      throw err;
    }
  }
}
