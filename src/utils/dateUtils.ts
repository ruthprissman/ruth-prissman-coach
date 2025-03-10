
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
