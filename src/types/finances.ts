export interface DateRange {
  start: Date;
  end: Date;
}

export type PeriodType = 'month' | 'quarter' | '3months' | 'year' | 'alltime';

export interface Transaction {
  id: number;
  date: Date;
  amount: number;
  type: 'income' | 'expense';
  status: string;
  
  // Income specific fields
  source?: string;
  category: string;
  client_name?: string;
  client_id?: number;
  payment_method: string;
  reference_number?: string | null;
  receipt_number?: string | null;
  session_id?: number | null;
}

export interface Expense {
  id: number;
  date: Date;
  amount: number;
  category: string;
  payee: string;
  description: string;
  payment_method: string;
  reference_number?: string | null;
  attachment_url?: string | null;
  status: string;
  type: 'expense';
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  period: string;
}
