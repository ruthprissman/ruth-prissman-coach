
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { HebrewCalendar, HDate, months } from '@hebcal/core';
import { he } from 'date-fns/locale/he';

/**
 * Creates a Hebrew date string from a JavaScript Date
 * 
 * This function properly uses @hebcal/core to convert a date to a real Hebrew date
 * 
 * @param date JavaScript Date object
 * @returns Hebrew date string in Hebrew (e.g., "כ״ד בתשרי תשפ״ה")
 */
export const convertToHebrewDateSync = (date: Date): string => {
  try {
    // Create an HDate object from a JavaScript Date
    const hDate = new HDate(date);
    
    // Get the Hebrew date components
    const day = hDate.getDate();
    const month = hDate.getMonth();
    const year = hDate.getFullYear();
    
    // Get the Hebrew month name
    const monthName = months[month];
    
    // Format the complete Hebrew date
    return `${day} ${monthName} ${year}`;
  } catch (error) {
    console.error('Error converting to Hebrew date (sync):', error);
    return '';
  }
};

/**
 * Converts a JavaScript Date to a Hebrew date string
 * For backward compatibility as applications transition to the sync version
 * 
 * @param date JavaScript Date object
 * @returns Hebrew date string (e.g., "כ״ד תשרי תשפ״ה")
 */
export const convertToHebrewDate = async (date: Date): Promise<string> => {
  return convertToHebrewDateSync(date);
};

/**
 * Formats a date for display in Israel time zone (date only)
 * @param date Date to format (string or Date object)
 * @returns Formatted date string (dd/MM/yyyy)
 */
export const formatDateOnlyInIsrael = (date: string | null | Date): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    console.log('formatDateOnlyInIsrael - input:', date);
    const formatted = formatInTimeZone(dateObj, 'Asia/Jerusalem', 'dd/MM/yyyy');
    console.log('formatDateOnlyInIsrael - output:', formatted);
    return formatted;
  } catch (error) {
    console.error('Error formatting date in Israel time zone:', error);
    return '';
  }
};

/**
 * Formats a date for display in Israel time zone
 * @param date Date to format (string or Date object)
 * @returns Formatted date string (dd/MM/yyyy, HH:mm)
 */
export const formatDateInIsraelTimeZone = (date: string | null | Date): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    console.log('formatDateInIsraelTimeZone - input:', date);
    const formatted = formatInTimeZone(dateObj, 'Asia/Jerusalem', 'dd/MM/yyyy, HH:mm');
    console.log('formatDateInIsraelTimeZone - output:', formatted);
    return formatted;
  } catch (error) {
    console.error('Error formatting date in Israel time zone:', error);
    return '';
  }
};

/**
 * Converts a UTC date to Israel time (Asia/Jerusalem)
 * @param dateString UTC date string or Date object
 * @returns Formatted date string in Israel time zone
 */
export const formatDateTimeInIsrael = (dateString: string | null | Date): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    console.log('formatDateTimeInIsrael - input:', dateString);
    console.log('formatDateTimeInIsrael - date object:', date);
    
    const formatted = formatInTimeZone(date, 'Asia/Jerusalem', 'dd/MM/yyyy, HH:mm');
    console.log('formatDateTimeInIsrael - formatted output:', formatted);
    
    return formatted;
  } catch (error) {
    console.error('Error formatting date in Israel time zone:', error);
    console.error('Input was:', dateString);
    return '';
  }
};

/**
 * שומר תאריך מקומי בישראל כ-ISO string בדיוק כפי שהוא
 * בלי לבצע המרות או שינויים נוספים
 * 
 * @param localDate התאריך המקומי בישראל
 * @returns מחרוזת ISO המייצגת את התאריך המקומי
 */
export const convertLocalToUTC = (localDate: Date): string => {
  try {
    // שומר את התאריך בפורמט ISO בדיוק כפי שהוא, ללא המרה
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    const seconds = String(localDate.getSeconds()).padStart(2, '0');
    
    const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000+03:00`;
    
    console.log('Converting local date to ISO string:', {
      input: localDate.toString(),
      output: isoString,
      inputTime: `${hours}:${minutes}`,
      timeZone: 'Asia/Jerusalem'
    });
    
    return isoString;
  } catch (error) {
    console.error('Error converting local date:', error);
    console.error('Date input was:', localDate);
    return new Date().toISOString();
  }
};
