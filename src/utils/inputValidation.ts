
import * as z from 'zod';

// Security-focused input validation utilities
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially harmful characters
    .substring(0, 1000); // Limit length
};

export const sanitizeNumericInput = (input: string | number): number => {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid numeric input');
  }
  return Math.abs(num); // Ensure positive numbers for financial data
};

export const validateDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  
  // Check if date is not too far in the future or past
  const now = new Date();
  const maxPastDate = new Date(now.getFullYear() - 50, 0, 1);
  const maxFutureDate = new Date(now.getFullYear() + 10, 11, 31);
  
  if (date < maxPastDate || date > maxFutureDate) {
    throw new Error('Date is outside acceptable range');
  }
  
  return date;
};

// Enhanced validation schemas for financial forms
export const expenseValidationSchema = z.object({
  date: z.string()
    .min(1, 'תאריך נדרש')
    .refine((date) => {
      try {
        validateDate(date);
        return true;
      } catch {
        return false;
      }
    }, 'תאריך לא תקין'),
  
  amount: z.string()
    .min(1, 'סכום נדרש')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 1000000;
    }, 'סכום חייב להיות מספר חיובי עד מיליון'),
  
  category: z.string()
    .min(1, 'קטגוריה נדרשת')
    .max(100, 'שם קטגוריה ארוך מדי')
    .refine((val) => sanitizeString(val).length > 0, 'קטגוריה לא תקינה'),
  
  payee: z.string()
    .min(1, 'שם הספק נדרש')
    .max(200, 'שם ספק ארוך מדי')
    .refine((val) => sanitizeString(val).length > 0, 'שם ספק לא תקין'),
  
  description: z.string()
    .max(1000, 'תיאור ארוך מדי')
    .optional(),
  
  payment_method: z.string()
    .min(1, 'אמצעי תשלום נדרש')
    .max(50, 'אמצעי תשלום ארוך מדי'),
  
  reference_number: z.string()
    .max(100, 'מספר אסמכתא ארוך מדי')
    .optional(),
  
  status: z.enum(['מאושר', 'טיוטה'], {
    errorMap: () => ({ message: 'סטטוס לא תקין' })
  })
});

export const incomeValidationSchema = z.object({
  date: z.string()
    .min(1, 'תאריך נדרש')
    .refine((date) => {
      try {
        validateDate(date);
        return true;
      } catch {
        return false;
      }
    }, 'תאריך לא תקין'),
  
  amount: z.string()
    .min(1, 'סכום נדרש')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 1000000;
    }, 'סכום חייב להיות מספר חיובי עד מיליון'),
  
  source: z.string()
    .min(1, 'מקור הכנסה נדרש')
    .max(200, 'מקור הכנסה ארוך מדי')
    .refine((val) => sanitizeString(val).length > 0, 'מקור הכנסה לא תקין'),
  
  client_name: z.string()
    .max(200, 'שם לקוח ארוך מדי')
    .optional(),
  
  description: z.string()
    .max(1000, 'תיאור ארוך מדי')
    .optional(),
  
  payment_method: z.string()
    .min(1, 'אמצעי תשלום נדרש')
    .max(50, 'אמצעי תשלום ארוך מדי'),
  
  reference_number: z.string()
    .max(100, 'מספר אסמכתא ארוך מדי')
    .optional(),
  
  status: z.enum(['מאושר', 'טיוטה'], {
    errorMap: () => ({ message: 'סטטוס לא תקין' })
  })
});

// Validation function for expense data
export const validateExpenseData = (data: any): z.infer<typeof expenseValidationSchema> => {
  return expenseValidationSchema.parse(data);
};

// Validation function for income data
export const validateIncomeData = (data: any): z.infer<typeof incomeValidationSchema> => {
  return incomeValidationSchema.parse(data);
};

// Security utility to clean financial data before submission
export const sanitizeFinancialData = (data: any) => {
  return {
    ...data,
    payee: data.payee ? sanitizeString(data.payee) : '',
    description: data.description ? sanitizeString(data.description) : '',
    reference_number: data.reference_number ? sanitizeString(data.reference_number) : '',
    amount: sanitizeNumericInput(data.amount)
  };
};
