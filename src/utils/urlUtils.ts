
/**
 * Utility functions for URL handling and environment detection
 */

import { setCookie, getCookie, deleteCookie } from './cookieUtils';

// The name of the cookie that stores environment information
const AUTH_ENV_COOKIE = 'auth_env_cookie';

/**
 * Determines if the app is running in a preview environment
 */
export const isPreviewEnvironment = (): boolean => {
  return window.location.hostname.includes('preview');
};

/**
 * Generates the appropriate redirect URL based on current environment
 * 
 * @param path The path to redirect to (without leading slash)
 * @returns Full redirect URL including domain
 */
export const getRedirectUrl = (path: string): string => {
  // Use window.location.origin to automatically get the correct domain for the current environment
  const baseUrl = window.location.origin;
  
  // Ensure path starts with a slash
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${formattedPath}`;
};

/**
 * Gets the appropriate dashboard redirect URL based on current environment
 */
export const getDashboardRedirectUrl = (): string => {
  return getRedirectUrl('/admin/dashboard');
};

/**
 * Saves the current environment (preview or production) to a cookie
 * for use after OAuth redirects
 */
export const saveEnvironmentForAuth = (): void => {
  const isPreview = isPreviewEnvironment();
  setCookie(AUTH_ENV_COOKIE, isPreview ? 'preview' : 'production');
  console.log(`[Auth Debug] Environment saved to cookie: ${isPreview ? 'preview' : 'production'}`);
};

/**
 * Gets the saved environment from cookie
 * 
 * @returns The saved environment (preview or production) or null if not set
 */
export const getSavedEnvironment = (): string | null => {
  const env = getCookie(AUTH_ENV_COOKIE);
  return env || null;
};

/**
 * Clears the saved environment from cookie
 */
export const clearSavedEnvironment = (): void => {
  deleteCookie(AUTH_ENV_COOKIE);
};

/**
 * Gets environment-aware redirect URL that works even if Supabase redirects
 * to the wrong environment
 * 
 * @param path The path to redirect to (without leading slash)
 * @returns Full redirect URL for the original environment
 */
export const getEnvironmentAwareRedirectUrl = (path: string): string => {
  // Get saved environment from cookie
  const env = getCookie(AUTH_ENV_COOKIE);
  
  // Ensure path starts with a slash
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  // If environment was saved, use it to construct the URL
  if (env === 'preview') {
    // Extract the current domain without the preview prefix
    const currentDomain = window.location.hostname;
    const baseDomain = currentDomain.includes('preview--') 
      ? currentDomain 
      : `preview--${currentDomain}`;
      
    const protocol = window.location.protocol;
    return `${protocol}//${baseDomain}${formattedPath}`;
  } else if (env === 'production') {
    // For production, remove any preview prefix
    const currentDomain = window.location.hostname;
    const baseDomain = currentDomain.replace('preview--', '');
    
    const protocol = window.location.protocol;
    return `${protocol}//${baseDomain}${formattedPath}`;
  }
  
  // Fallback to normal redirect if no environment was saved
  return getRedirectUrl(path);
};
