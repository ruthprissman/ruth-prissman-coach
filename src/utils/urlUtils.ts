
/**
 * Utility functions for URL handling and environment detection
 */

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
