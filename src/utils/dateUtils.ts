
import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { HebrewCalendar, HDate } from '@hebcal/core';
import { he } from 'date-fns/locale';

/**
 * Creates a Hebrew date string from a JavaScript Date
 * 
 * Note: This function is synchronous, unlike the previous version which was async.
 * 
 * @param date JavaScript Date object
 * @returns Hebrew date string
 */
export const convertToHebrewDateSync = (date: Date): string => {
  try {
    // Create an HDate object from a JavaScript Date
    const hDate = new HDate(date);
    return format(new Date(hDate.getFullYear(), hDate.getMonth() - 1, hDate.getDate()), "do MMMM yyyy", { locale: he });
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
 * @returns Hebrew date string (e.g., "כ"ד תשרי תשפ"ה")
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
    return formatInTimeZone(dateObj, 'Asia/Jerusalem', 'dd/MM/yyyy');
  } catch (error) {
    console.error('Error formatting date in Israel time zone:', error);
    return '';
  }
};

/**
 * Formats a date for display in Israel time zone
 * @param date Date to format (string or Date object)
 * @returns Formatted date string
 */
export const formatDateInIsraelTimeZone = (date: string | null | Date): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatInTimeZone(dateObj, 'Asia/Jerusalem', 'dd/MM/yyyy, HH:mm');
  } catch (error) {
    console.error('Error formatting date in Israel time zone:', error);
    return '';
  }
};

/**
 * Converts a UTC date to Israel time (Asia/Jerusalem)
 * @param dateString UTC date string or Date object
 * @returns Formatted date string in Israel time zone in format dd/MM/yyyy, HH:mm
 */
export const formatDateTimeInIsrael = (dateString: string | null | Date): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return formatInTimeZone(date, 'Asia/Jerusalem', 'dd/MM/yyyy, HH:mm');
  } catch (error) {
    console.error('Error formatting date in Israel time zone:', error);
    return '';
  }
};

/**
 * Converts a local datetime in Israel timezone to UTC for storage in database
 * @param localDate Local datetime in Israel timezone
 * @returns UTC ISO string
 */
export const convertLocalToUTC = (localDate: Date): string => {
  try {
    // Create a Date object representing the local time
    const year = localDate.getFullYear();
    const month = localDate.getMonth();
    const day = localDate.getDate();
    const hours = localDate.getHours();
    const minutes = localDate.getMinutes();
    const seconds = localDate.getSeconds();
    
    console.log(`Converting local date: ${year}-${month+1}-${day} ${hours}:${minutes}:${seconds} (Israel time)`);
    
    // Create a date string in ISO format with the Israel timezone
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Use fromZonedTime to convert from Israel timezone to UTC
    const utcDate = fromZonedTime(new Date(dateString), 'Asia/Jerusalem');
    
    console.log(`Converted to UTC: ${utcDate.toISOString()}`);
    
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting local date to UTC:', error);
    console.error('Date input was:', localDate);
    return new Date().toISOString();
  }
};
