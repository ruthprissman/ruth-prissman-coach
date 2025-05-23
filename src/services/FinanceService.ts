
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
      
      const { data, error } = await client
        .from('transactions')
        .select(`
          id,
          date,
          amount,
          category,
          payee,
          description,
          payment_method,
          reference_number,
          attachment_url,
          status,
          type
        `)
        .eq('type', 'expense')
        .gte('date', dateRange.start.toISOString().split('T')[0])
        .lte('date', dateRange.end.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return (data || []).map(expense => ({
        ...expense,
        date: new Date(expense.date)
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
}
