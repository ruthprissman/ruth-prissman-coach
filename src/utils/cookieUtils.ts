/**
 * Utility functions for handling cookies
 */

/**
 * Sets a cookie with the specified name, value, and options
 */
export const setCookie = (name: string, value: string, options: { [key: string]: string | number | boolean } = {}): void => {
  // For auth related cookies, ensure they persist by setting a longer max-age (7 days instead of 1)
  if ((name === 'auth_env' || name.startsWith('sb-')) && !options['max-age']) {
    options['max-age'] = 7 * 24 * 60 * 60; // 7 days in seconds
  }
  
  // Always set path to root for auth cookies to ensure they're available across pages
  if ((name === 'auth_env' || name.startsWith('sb-')) && !options.path) {
    options.path = '/';
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

// Enhance persistence of auth state in localStorage
export const persistAuthState = (isAuthenticated: boolean, tokenData?: {
  access_token?: string,
  refresh_token?: string,
  expires_at?: number
}): void => {
  try {
    localStorage.setItem('google_auth_state', isAuthenticated ? 'authenticated' : '');
    
    // Store token data for session recovery
    if (isAuthenticated && tokenData) {
      localStorage.setItem('supabase_auth_data', JSON.stringify({
        ...tokenData,
        timestamp: Date.now()
      }));
    } else if (!isAuthenticated) {
      localStorage.removeItem('supabase_auth_data');
    }
    
    console.log(`[auth] Persisted auth state: ${isAuthenticated}${tokenData ? ' with token data' : ''}`);
  } catch (error) {
    console.error('[auth] Error persisting auth state:', error);
  }
};

// Enhanced function to retrieve persistent auth state
export const getPersistedAuthState = (): {
  isAuthenticated: boolean;
  tokenData: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    timestamp?: number;
  } | null;
} => {
  try {
    const state = localStorage.getItem('google_auth_state');
    const isAuthenticated = !!state;
    
    // Get persisted token data if available
    let tokenData = null;
    const storedData = localStorage.getItem('supabase_auth_data');
    if (storedData) {
      tokenData = JSON.parse(storedData);
    }
    
    console.log(`[auth] Retrieved persisted auth state: ${isAuthenticated}${tokenData ? ' with token data' : ''}`);
    return { isAuthenticated, tokenData };
  } catch (error) {
    console.error('[auth] Error getting persisted auth state:', error);
    return { isAuthenticated: false, tokenData: null };
  }
};

// Check if the stored token is still valid or about to expire
export const isStoredTokenValid = (tokenData: { expires_at?: number } | null): boolean => {
  if (!tokenData || !tokenData.expires_at) return false;
  
  // Token is valid if it expires more than 5 minutes from now
  const expiresAtMs = tokenData.expires_at * 1000; // convert to milliseconds
  const currentTimeMs = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;
  
  // Token is valid if it expires more than 5 minutes from now
  const isValid = expiresAtMs > (currentTimeMs + fiveMinutesMs);
  
  console.log(`[auth] Token valid check: ${isValid}, expires in ${Math.round((expiresAtMs - currentTimeMs) / 60000)} minutes`);
  return isValid;
};
