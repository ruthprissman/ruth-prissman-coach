
/**
 * Utility functions for handling cookies
 */

/**
 * Sets a cookie with the given name, value and optional expiration days
 * 
 * @param name Cookie name
 * @param value Cookie value
 * @param days Number of days until cookie expires (default: 1 day)
 */
export const setCookie = (name: string, value: string, days: number = 1): void => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
};

/**
 * Gets a cookie value by name
 * 
 * @param name Cookie name to retrieve
 * @returns Cookie value or empty string if not found
 */
export const getCookie = (name: string): string => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  
  return '';
};

/**
 * Deletes a cookie by name
 * 
 * @param name Cookie name to delete
 */
export const deleteCookie = (name: string): void => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};
