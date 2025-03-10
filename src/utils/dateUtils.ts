
/**
 * Converts a JavaScript Date to a Hebrew date string
 * @param date JavaScript Date object
 * @returns Hebrew date string (e.g., "כ"ד תשרי תשפ"ה")
 */
export const convertToHebrewDate = (date: Date): string => {
  try {
    // Format the date to Hebrew using Intl.DateTimeFormat with the Hebrew calendar
    const options: Intl.DateTimeFormatOptions = {
      calendar: 'hebrew',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    
    // Get Hebrew date string
    let hebrewDate = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', options).format(date);
    
    // Fix the Hebrew date format to match the desired output: כ"ד תשרי תשפ"ה
    // First, extract day, month, and year
    const parts = hebrewDate.split(' ');
    if (parts.length >= 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      
      // Add the quotation mark to the day
      const formattedDay = day + '"';
      
      // Return the formatted date
      return `${formattedDay} ${month} ${year}`;
    }
    
    return hebrewDate;
  } catch (error) {
    console.error('Error converting to Hebrew date:', error);
    return '';
  }
};
