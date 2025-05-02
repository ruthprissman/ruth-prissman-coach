
/**
 * Utility functions for URL handling and environment detection
 */
import { setCookie, getCookie, deleteCookie } from './cookieUtils';

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
 * Using the full origin ensures correct redirection across environments
 */
export const getDashboardRedirectUrl = (): string => {
  // Log the full URL for debugging
  const redirectUrl = `${window.location.origin}/admin/dashboard`;
  console.log('[auth] Generated dashboard redirect URL:', redirectUrl);
  return redirectUrl;
};

/**
 * Saves the current environment (preview or production) to both cookie and localStorage
 * for use after OAuth redirects
 */
export const saveEnvironmentForAuth = (): void => {
  const isPreview = isPreviewEnvironment();
  const env = isPreview ? 'preview' : 'production';
  
  console.log('[auth] Environment detected before login:', env);
  
  // Set cookie with 1 day expiration and path=/
  setCookie('auth_env', env, { path: '/', 'max-age': 86400 });
  
  // Also save to localStorage as backup
  try {
    localStorage.setItem('auth_env', env);
    console.log('[auth] Saved environment to localStorage:', env);
  } catch (error) {
    console.error('[auth] Error saving to localStorage:', error);
  }
};

/**
 * Gets environment-aware redirect URL that works even if Supabase redirects
 * to the wrong environment
 * 
 * @param path The path to redirect to (without leading slash)
 * @returns Full redirect URL for the original environment
 */
export const getEnvironmentAwareRedirectUrl = (path: string): string => {
  // Get saved environment from cookie or localStorage
  const cookieEnv = getCookie('auth_env');
  let env = cookieEnv;
  
  // If not in cookie, try localStorage
  if (!env) {
    try {
      env = localStorage.getItem('auth_env');
      console.log('[auth] Retrieved environment from localStorage:', env);
    } catch (error) {
      console.error('[auth] Error reading from localStorage:', error);
    }
  }
  
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
