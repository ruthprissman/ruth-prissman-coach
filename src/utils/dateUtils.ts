import { format } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * Converts a JavaScript Date to a Hebrew date string
 * @param date JavaScript Date object
 * @returns Hebrew date string (e.g., "כ"ד תשרי תשפ"ה")
 */
export const convertToHebrewDate = async (date: Date): Promise<string> => {
  try {
    const { gregorianToHebrew } = await import('@hebcal/core');
    const { format } = await import('date-fns');
    const { he } = await import('date-fns/locale/he');

    const hDate = gregorianToHebrew(date);
    const hebrewDateString = format(new Date(hDate.gy, hDate.gm - 1, hDate.gd), "do MMMM yyyy", { locale: he });
    return hebrewDateString;
  } catch (error) {
    console.error('Error converting to Hebrew date:', error);
    return '';
  }
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
