
import { DateRange, PeriodType } from "@/types/finances";
import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";

export const getDateRangeForPeriod = (period: PeriodType | string): DateRange => {
  const now = new Date();
  
  switch (period) {
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    
    case 'quarter':
      return {
        start: startOfMonth(subMonths(now, 2)),
        end: endOfMonth(addMonths(now, 0))
      };
      
    case '3months':
      // Default: from beginning of last month to end of next month
      return {
        start: startOfMonth(subMonths(now, 1)),
        end: endOfMonth(addMonths(now, 1))
      };
      
    case 'year':
      return {
        start: startOfMonth(subMonths(now, 11)),
        end: endOfMonth(now)
      };
      
    default:
      return {
        start: startOfMonth(subMonths(now, 1)),
        end: endOfMonth(addMonths(now, 1))
      };
  }
};
