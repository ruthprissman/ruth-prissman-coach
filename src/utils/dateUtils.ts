
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
      
      // Format the day with the Hebrew quote mark (geresh for single digit, gershayim for double)
      let formattedDay;
      if (day.length === 2 && day.includes('׳')) {
        // Single digit (like י׳) - replace with geresh
        formattedDay = day.replace('׳', "'");
      } else if (day.length > 2) {
        // Double digit (like י״א) - place gershayim before the last character
        const lastChar = day.slice(-1);
        const beforeLast = day.slice(0, -1).replace('״', '');
        formattedDay = beforeLast + '"' + lastChar;
      } else {
        formattedDay = day;
      }
      
      // Format the year to ensure it uses gershayim before the last character
      let formattedYear = year;
      if (year.length > 2) {
        const yearLastChar = year.slice(-1);
        const yearBeforeLast = year.slice(0, -1).replace('״', '');
        formattedYear = yearBeforeLast + '"' + yearLastChar;
      }
      
      // Return the formatted date
      return `${formattedDay} ${month} ${formattedYear}`;
    }
    
    return hebrewDate;
  } catch (error) {
    console.error('Error converting to Hebrew date:', error);
    return '';
  }
};
