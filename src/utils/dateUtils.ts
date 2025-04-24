/**
 * Converts a JavaScript Date to a Hebrew date string
 * @param date JavaScript Date object
 * @returns Hebrew date string (e.g., "כ"ד תשרי תשפ"ה")
 */
export const convertToHebrewDate = async (date: Date): Promise<string> => {
  try {
    // First try the Hebcal API
    return await fetchHebrewDateFromHebcal(date);
  } catch (error) {
    console.error('Error with Hebcal API, falling back to local conversion:', error);
    // Fallback to local conversion using kosher-zmanim
    return formatHebrewDateLocally(date);
  }
};

/**
 * Fetches Hebrew date from Hebcal API
 */
const fetchHebrewDateFromHebcal = async (date: Date): Promise<string> => {
  try {
    const response = await fetch(
      `https://www.hebcal.com/converter?cfg=json&gy=${date.getFullYear()}&gm=${date.getMonth()+1}&gd=${date.getDate()}&g2h=1&strict=1`
    );
    
    if (!response.ok) {
      throw new Error(`Hebcal API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.hebrew; // Returns formatted Hebrew date as a string with proper punctuation
  } catch (error) {
    console.error('Error fetching from Hebcal API:', error);
    throw error; // Propagate error to trigger fallback
  }
};

/**
 * Formats Hebrew date locally using kosher-zmanim
 */
const formatHebrewDateLocally = (date: Date): string => {
  try {
    // Import kosher-zmanim library dynamically to avoid TypeScript errors
    const kosherZmanim = require('kosher-zmanim');
    
    if (kosherZmanim && kosherZmanim.JewishCalendar) {
      const jewishCalendar = new kosherZmanim.JewishCalendar(date);
      
      // Get Hebrew day, month, and year
      const dayNumber = jewishCalendar.getJewishDayOfMonth();
      const monthNumber = jewishCalendar.getJewishMonth();
      const year = jewishCalendar.getJewishYear();
      
      // Convert day number to Hebrew letters with proper punctuation
      const dayInHebrew = convertNumberToHebrewLetters(dayNumber);
      
      // Get Hebrew month name
      const monthName = getHebrewMonthName(monthNumber, jewishCalendar.isJewishLeapYear());
      
      // Convert year to Hebrew letters with proper punctuation
      const yearInHebrew = convertNumberToHebrewLetters(year % 1000); // Only use last 3 digits of year
      
      return `${dayInHebrew} ${monthName} ${yearInHebrew}`;
    } else {
      console.error('JewishCalendar not found in kosher-zmanim');
      return fallbackDateFormat(date);
    }
  } catch (error) {
    console.error('Error converting to Hebrew date locally:', error);
    return fallbackDateFormat(date);
  }
};

/**
 * Converts a number to Hebrew letters with proper punctuation
 */
const convertNumberToHebrewLetters = (number: number): string => {
  // Hebrew letters with their numeric values
  const hebrewNumerals: Record<number, string> = {
    1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה',
    6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט', 10: 'י',
    20: 'כ', 30: 'ל', 40: 'מ', 50: 'נ', 60: 'ס',
    70: 'ע', 80: 'פ', 90: 'צ', 100: 'ק',
    200: 'ר', 300: 'ש', 400: 'ת'
  };
  
  if (number === 15) {
    return 'ט״ו'; // Special case for 15
  } else if (number === 16) {
    return 'ט״ז'; // Special case for 16
  }
  
  // Convert number to Hebrew letters
  let result = '';
  let remaining = number;
  
  // Handle hundreds
  const hundreds = Math.floor(remaining / 100) * 100;
  if (hundreds > 0) {
    if (hundreds <= 400) {
      result += hebrewNumerals[hundreds];
    } else {
      // For numbers > 400, use combinations
      const hundreds_remainder = hundreds % 400;
      const tav_count = Math.floor(hundreds / 400);
      
      for (let i = 0; i < tav_count; i++) {
        result += hebrewNumerals[400];
      }
      
      if (hundreds_remainder > 0) {
        result += hebrewNumerals[hundreds_remainder];
      }
    }
    remaining -= hundreds;
  }
  
  // Handle tens
  const tens = Math.floor(remaining / 10) * 10;
  if (tens > 0) {
    result += hebrewNumerals[tens];
    remaining -= tens;
  }
  
  // Handle ones
  if (remaining > 0) {
    result += hebrewNumerals[remaining];
  }
  
  // Add appropriate punctuation
  if (result.length > 1) {
    // Add gershayim before the last character for multiple letters
    return result.slice(0, -1) + '״' + result.slice(-1);
  } else if (result.length === 1) {
    // Add geresh for single letter
    return result + '׳';
  }
  
  return result;
};

/**
 * Gets the Hebrew month name based on month number
 */
const getHebrewMonthName = (monthNumber: number, isLeapYear: boolean): string => {
  const monthNames = [
    'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול',
    'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר'
  ];
  
  // Handle Adar I and Adar II in leap years
  if (isLeapYear && monthNumber === 12) {
    return 'אדר א׳';
  } else if (isLeapYear && monthNumber === 13) {
    return 'אדר ב׳';
  } else {
    return monthNames[(monthNumber - 1) % 12];
  }
};

/**
 * Last resort fallback using DateTimeFormat
 */
const fallbackDateFormat = (date: Date): string => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      calendar: 'hebrew',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      numberingSystem: 'hebr'
    };
    
    const formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', options);
    const hebrewDate = formatter.format(date);
    
    // This is a simple fallback, might not have correct formatting
    return hebrewDate;
  } catch (error) {
    console.error('Error in fallback date formatting:', error);
    return '';
  }
};

// For backward compatibility with synchronous calls, providing a sync version
export const convertToHebrewDateSync = (date: Date): string => {
  try {
    return formatHebrewDateLocally(date);
  } catch (error) {
    console.error('Error converting to Hebrew date synchronously:', error);
    return fallbackDateFormat(date);
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
 * Converts a local date to UTC while considering Israel timezone
 * @param localDate Local date in Israel timezone
 * @returns UTC date string
 */
export const convertLocalToUTC = (localDate: Date): string => {
  try {
    // Convert the local date to UTC considering Israel timezone
    const utcDate = zonedTimeToUtc(localDate, 'Asia/Jerusalem');
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting local date to UTC:', error);
    return new Date().toISOString();
  }
};

/**
 * Converts a UTC date to Israel time (Asia/Jerusalem)
 * @param dateString UTC date string
 * @returns Date string formatted for Israel time zone
 */
export const convertToIsraelTime = (dateString: string | null | Date): string | null => {
  if (!dateString) return null;
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Create a formatter that outputs in the Israel time zone
    const formatter = new Intl.DateTimeFormat('en-IL', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    return formatter.format(date).replace(/\//g, '-');
  } catch (error) {
    console.error('Error converting to Israel time:', error);
    return null;
  }
};

/**
 * Formats a date for display in Israel time zone
 * @param date Date to format (string or Date object)
 * @param formatStr Format string (default: dd/MM/yyyy HH:mm)
 * @returns Formatted date string
 */
export const formatDateInIsraelTimeZone = (
  date: Date | string | null,
  formatStr: string = 'dd/MM/yyyy HH:mm'
): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Create a formatter based on the provided format string
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jerusalem',
    };
    
    // Map the format string to Intl.DateTimeFormat options
    if (formatStr.includes('yyyy')) options.year = 'numeric';
    if (formatStr.includes('MM')) options.month = '2-digit';
    if (formatStr.includes('dd')) options.day = '2-digit';
    if (formatStr.includes('HH')) {
      options.hour = '2-digit';
      options.hour12 = false;
    }
    if (formatStr.includes('mm')) options.minute = '2-digit';
    if (formatStr.includes('ss')) options.second = '2-digit';
    
    const formatter = new Intl.DateTimeFormat('he-IL', options);
    
    // Format the date using the Israel timezone
    let formattedDate = formatter.format(dateObj);
    
    // For time-only formats
    if (formatStr === 'HH:mm') {
      const parts = formatter.formatToParts(dateObj);
      const hour = parts.find(part => part.type === 'hour')?.value || '00';
      const minute = parts.find(part => part.type === 'minute')?.value || '00';
      formattedDate = `${hour}:${minute}`;
    }
    
    return formattedDate;
  } catch (error) {
    console.error('Error formatting date in Israel time zone:', error);
    // Fallback to simple format
    return new Date(date).toLocaleDateString('he-IL');
  }
};

/**
 * Calculates the end time 90 minutes after the start time
 * @param startTime The session start time
 * @returns Formatted end time string
 */
export const calculateSessionEndTime = (startTime: string | Date): string => {
  try {
    const startDate = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const endTime = new Date(startDate.getTime() + 90 * 60000); // Add 90 minutes in milliseconds
    
    // Format using browser's native Intl API with Israel timezone
    const formatter = new Intl.DateTimeFormat('he-IL', {
      timeZone: 'Asia/Jerusalem',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return formatter.format(endTime);
  } catch (error) {
    console.error('Error calculating session end time:', error);
    return '';
  }
};
