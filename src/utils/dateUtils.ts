
import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { HebrewCalendar } from '@hebcal/core';
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
    const hDate = HebrewCalendar.gregorianToHebrew(date);
    return format(new Date(hDate.gy, hDate.gm - 1, hDate.gd), "do MMMM yyyy", { locale: he });
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
 * Converts a local datetime to UTC for storage in database
 * @param localDate Local datetime
 * @returns UTC ISO string
 */
export const convertLocalToUTC = (localDate: Date): string => {
  try {
    // Convert local date to UTC
    return localDate.toISOString();
  } catch (error) {
    console.error('Error converting local date to UTC:', error);
    return new Date().toISOString();
  }
};
