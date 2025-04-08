
/**
 * Utility functions for handling cookies
 */

/**
 * Sets a cookie with the specified name, value, and options
 */
export const setCookie = (name: string, value: string, options: { [key: string]: string | number | boolean } = {}): void => {
  // For auth_env cookie, ensure it persists by setting a longer max-age
  if (name === 'auth_env' && !options['max-age']) {
    options['max-age'] = 86400; // 1 day in seconds
  }
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  for (const optionKey in options) {
    cookieString += `; ${optionKey}`;
    const optionValue = options[optionKey];
    if (optionValue !== true) {
      cookieString += `=${optionValue}`;
    }
  }
  
  console.log(`[cookie] Setting cookie: ${name}=${value}; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`);
  console.log(`[cookie] Full cookie string: ${document.cookie}`);
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
      console.log(`[cookie] Reading cookie: ${name}, found value: ${value}`);
      console.log(`[cookie] Full cookie string: ${document.cookie}`);
      return value;
    }
  }
  
  console.log(`[cookie] Reading cookie: ${name}, not found`);
  console.log(`[cookie] Full cookie string: ${document.cookie}`);
  return null;
};

/**
 * Deletes a cookie by name
 */
export const deleteCookie = (name: string, path: string = '/'): void => {
  console.log(`[cookie] Deleting cookie: ${name}`);
  console.log(`[cookie] Full cookie string before deletion: ${document.cookie}`);
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0`;
  console.log(`[cookie] Full cookie string after deletion: ${document.cookie}`);
};
