
/**
 * Utility functions for handling cookies
 */

/**
 * Sets a cookie with the specified name, value, and options
 */
export const setCookie = (name: string, value: string, options: { [key: string]: string | number | boolean } = {}): void => {
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  for (const optionKey in options) {
    cookieString += `; ${optionKey}`;
    const optionValue = options[optionKey];
    if (optionValue !== true) {
      cookieString += `=${optionValue}`;
    }
  }
  
  console.log(`[auth] Setting cookie: ${name}=${value}`);
  document.cookie = cookieString;
};

/**
 * Gets a cookie value by name
 */
export const getCookie = (name: string): string | null => {
  const nameEQ = encodeURIComponent(name) + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
      console.log(`[auth] Retrieved cookie: ${name}=${value}`);
      return value;
    }
  }
  
  console.log(`[auth] Cookie not found: ${name}`);
  return null;
};

/**
 * Deletes a cookie by name
 */
export const deleteCookie = (name: string, path: string = '/'): void => {
  console.log(`[auth] Deleting cookie: ${name}`);
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0`;
};
