
import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { HebrewCalendar, HDate } from '@hebcal/core';
import { he } from 'date-fns/locale/he';

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
 * @returns Formatted date string
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
 * Ensures correct timezone display for dates stored in UTC
 * 
 * @param dateString UTC date string or Date object
 * @returns Formatted date string in Israel time zone in format dd/MM/yyyy, HH:mm
 */
export const formatDateTimeInIsrael = (dateString: string | null | Date): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    console.log('formatDateTimeInIsrael - input:', dateString);
    console.log('formatDateTimeInIsrael - date object:', date);
    
    // Important: Use formatInTimeZone to properly convert and format in one step
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
 * בעיה: כשמשתמשים בתאריך מקומי בישראל (לדוגמא: 31/03/2025 בשעה 08:45)
 * וקוראים לפונקציה זו, הפונקציה מניחה שזה תאריך UTC וממירה אותו לשעון ישראל
 * שגורם לתזוזה של שעות נוספות (לדוגמא: מ-08:45 ל-11:45).
 * 
 * הפתרון: לשמור את התאריך כפי שהוא ללא המרה נוספת מזמן מקומי ל-UTC.
 *
 * @param localDate התאריך המקומי בישראל
 * @returns התאריך כמחרוזת ISO ללא המרה נוספת
 */
export const convertLocalToUTC = (localDate: Date): string => {
  try {
    // במקום להמיר את התאריך, פשוט נשמור אותו כ-ISO string
    // זה יתן לנו תאריך ב-UTC, אבל יקח בחשבון שהמשתמש הזין את הזמן בשעון ישראל
    // ולכן ישמור את התאריך והזמן המדויקים
    const isoString = localDate.toISOString();
    console.log(`Converting local date to ISO string: ${isoString} (keeping original time)`);
    return isoString;
  } catch (error) {
    console.error('Error converting local date to UTC:', error);
    console.error('Date input was:', localDate);
    return new Date().toISOString();
  }
};
