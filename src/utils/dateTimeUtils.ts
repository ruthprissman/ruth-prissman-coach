
import { format, formatISO, parseISO } from 'date-fns';
import { formatInTimeZone as dateFormatterInTimeZone } from 'date-fns-tz';

// Debug version for tracking code execution
const UTILS_VERSION = "1.0.0";
console.log(`LOV_DEBUG_DATETIME: Date time utils loaded, version ${UTILS_VERSION}`);

/**
 * Formats a date in the Israel timezone with proper error handling
 */
export function formatInTimeZone(date: Date | string | null, timeZone: string, formatString: string): string {
  if (!date) return '';
  
  try {
    // Safety convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Log for debugging
    console.log(`LOV_DEBUG_DATETIME: Formatting date ${dateObj.toISOString()} in timezone ${timeZone} with format ${formatString}`);
    
    // Use the date-fns-tz function with safety checks
    const result = dateFormatterInTimeZone(dateObj, timeZone, formatString);
    
    console.log(`LOV_DEBUG_DATETIME: Formatted result: ${result}`);
    return result;
  } catch (error) {
    console.error(`LOV_DEBUG_DATETIME: Error formatting date in timezone:`, error);
    console.error(`LOV_DEBUG_DATETIME: Input was:`, { date, timeZone, formatString });
    
    // Return a default format or empty string as fallback
    return typeof date === 'string' ? date : date?.toLocaleString() || '';
  }
}

/**
 * Helper function to safely get hours and minutes from a date string
 */
export function getDateTimeParts(dateString: string | Date | null): { 
  date: string, 
  hour: string, 
  minute: string,
  fullTime: string
} {
  try {
    const dateObj = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (!dateObj) {
      return { date: '', hour: '00', minute: '00', fullTime: '00:00' };
    }
    
    const formattedDate = format(dateObj, 'yyyy-MM-dd');
    const hour = format(dateObj, 'HH');
    const minute = format(dateObj, 'mm');
    const fullTime = `${hour}:${minute}`;
    
    return { date: formattedDate, hour, minute, fullTime };
  } catch (error) {
    console.error('Error parsing date for parts:', error);
    return { date: '', hour: '00', minute: '00', fullTime: '00:00' };
  }
}

/**
 * Helper function to safely add minutes to a date
 */
export function addMinutesToDate(date: Date | string, minutes: number): Date {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Date(dateObj.getTime() + minutes * 60000);
  } catch (error) {
    console.error('Error adding minutes to date:', error);
    return new Date();
  }
}
