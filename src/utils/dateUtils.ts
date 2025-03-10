
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
      numberingSystem: 'hebr' // Force Hebrew numerals
    };
    
    // Get Hebrew date string
    const formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', options);
    const hebrewDate = formatter.format(date);
    
    // Split the date parts and handle formatting
    const parts = hebrewDate.split(' ');
    if (parts.length >= 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      
      // Format the day - add geresh (׳) for single letters, gershayim (״) for double
      let formattedDay = day;
      if (day.length === 1) {
        formattedDay = day + '׳';
      } else if (day.length > 1) {
        const lastChar = day.slice(-1);
        const beforeLast = day.slice(0, -1);
        formattedDay = beforeLast + '״' + lastChar;
      }
      
      // Format the year with gershayim
      let formattedYear = year;
      if (year.length > 1) {
        const yearLastChar = year.slice(-1);
        const yearBeforeLast = year.slice(0, -1);
        formattedYear = yearBeforeLast + '״' + yearLastChar;
      }
      
      // Return the formatted date with proper Hebrew punctuation
      return `${formattedDay} ${month} ${formattedYear}`;
    }
    
    return hebrewDate;
  } catch (error) {
    console.error('Error converting to Hebrew date:', error);
    return '';
  }
};
