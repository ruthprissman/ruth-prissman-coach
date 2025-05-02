
/**
 * Utility functions for handling cookies
 */

/**
 * Sets a cookie with the specified name, value, and options
 */
export const setCookie = (name: string, value: string, options: { [key: string]: string | number | boolean } = {}): void => {
  // Enhanced cookie setting with better defaults
  
  // For auth_env cookie, ensure it persists by setting a longer max-age
  if (name === 'auth_env' && !options['max-age']) {
    options['max-age'] = 86400 * 7; // 7 days in seconds
  }
  
  // Always set path to root for auth cookies to ensure they're available across pages
  if ((name === 'auth_env' || name.includes('auth')) && !options.path) {
    options.path = '/';
  }
  
  // Set SameSite attribute for better security and cross-origin behavior
  if (!options.SameSite) {
    options.SameSite = 'Lax';
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
  document.cookie = cookieString;
  
  // Debug after setting
  console.log(`[cookie] Full cookie string after setting: ${document.cookie}`);
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
      return value;
    }
  }
  
  console.log(`[cookie] Reading cookie: ${name}, not found`);
  return null;
};

/**
 * Deletes a cookie by name
 */
export const deleteCookie = (name: string, path: string = '/'): void => {
  console.log(`[cookie] Deleting cookie: ${name}`);
  console.log(`[cookie] Full cookie string before deletion: ${document.cookie}`);
  
  // Set expired date in the past to ensure deletion
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  
  console.log(`[cookie] Full cookie string after deletion: ${document.cookie}`);
};

// Enhanced localStorage functions with timestamps and error handling

/**
 * Sets a value in localStorage with expiration
 */
export const setLocalStorage = (key: string, value: any, expirationDays: number = 7): void => {
  try {
    const item = {
      value: value,
      expiration: new Date().getTime() + (expirationDays * 24 * 60 * 60 * 1000),
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(item));
    console.log(`[localStorage] Set item: ${key}, expires in ${expirationDays} days`);
  } catch (error) {
    console.error(`[localStorage] Error setting item ${key}:`, error);
  }
};

/**
 * Gets a value from localStorage, respecting expiration
 */
export const getLocalStorage = (key: string): any => {
  try {
    const itemStr = localStorage.getItem(key);
    
    // If item doesn't exist, return null
    if (!itemStr) {
      console.log(`[localStorage] Item ${key} not found`);
      return null;
    }
    
    const item = JSON.parse(itemStr);
    const now = new Date().getTime();
    
    // Check if the item has expired
    if (item.expiration && now > item.expiration) {
      console.log(`[localStorage] Item ${key} has expired, removing it`);
      localStorage.removeItem(key);
      return null;
    }
    
    console.log(`[localStorage] Retrieved item: ${key}, set at ${item.timestamp}`);
    return item.value;
  } catch (error) {
    console.error(`[localStorage] Error getting item ${key}:`, error);
    return null;
  }
};

/**
 * Removes a value from localStorage
 */
export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
    console.log(`[localStorage] Removed item: ${key}`);
  } catch (error) {
    console.error(`[localStorage] Error removing item ${key}:`, error);
  }
};

// Enhanced auth state persistence

/**
 * Persists authentication state in both localStorage and cookies
 */
export const persistAuthState = (isAuthenticated: boolean): void => {
  try {
    // Store in localStorage with 7-day expiration
    setLocalStorage('google_auth_state', isAuthenticated ? 'authenticated' : '', 7);
    
    // Also set a cookie as backup
    if (isAuthenticated) {
      setCookie('google_auth_state', 'authenticated', {
        'max-age': 86400 * 7, // 7 days
        path: '/',
        SameSite: 'Lax'
      });
    } else {
      deleteCookie('google_auth_state', '/');
    }
    
    console.log(`[auth] Persisted Google auth state: ${isAuthenticated} (in both localStorage and cookie)`);
  } catch (error) {
    console.error('[auth] Error persisting auth state:', error);
  }
};

/**
 * Retrieves persisted authentication state from localStorage or cookie
 */
export const getPersistedAuthState = (): boolean => {
  try {
    // Try localStorage first
    const localStorageState = getLocalStorage('google_auth_state');
    if (localStorageState === 'authenticated') {
      console.log('[auth] Retrieved authenticated state from localStorage');
      return true;
    }
    
    // Fall back to cookie if localStorage doesn't have it
    const cookieState = getCookie('google_auth_state');
    if (cookieState === 'authenticated') {
      console.log('[auth] Retrieved authenticated state from cookie');
      // Also update localStorage for consistency
      setLocalStorage('google_auth_state', 'authenticated', 7);
      return true;
    }
    
    console.log('[auth] No authenticated state found');
    return false;
  } catch (error) {
    console.error('[auth] Error getting persisted auth state:', error);
    return false;
  }
};

// Function to debug all stored auth state
export const debugAuthState = (): { localStorage: any, cookies: any } => {
  const debugInfo = {
    localStorage: {},
    cookies: {}
  };
  
  // Debug localStorage
  try {
    // Check Google auth state
    const googleAuthState = localStorage.getItem('google_auth_state');
    debugInfo.localStorage['google_auth_state'] = googleAuthState ? JSON.parse(googleAuthState) : null;
    
    // Check auth_env
    const authEnv = localStorage.getItem('auth_env');
    debugInfo.localStorage['auth_env'] = authEnv;
  } catch (error) {
    console.error('[debug] Error accessing localStorage:', error);
    debugInfo.localStorage['error'] = String(error);
  }
  
  // Debug cookies
  try {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    debugInfo.cookies = cookies;
  } catch (error) {
    console.error('[debug] Error accessing cookies:', error);
    debugInfo.cookies['error'] = String(error);
  }
  
  console.log('[debug] Auth state debug info:', debugInfo);
  return debugInfo;
};
