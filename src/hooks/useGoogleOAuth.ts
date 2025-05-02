
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';

/**
 * This hook is provided for backward compatibility only.
 * It simply forwards all methods from useGoogleAuth context.
 * 
 * @deprecated Use useGoogleAuth from @/contexts/GoogleAuthContext directly instead
 */
export function useGoogleOAuth() {
  // Get all functionality from the context
  const googleAuth = useGoogleAuth();
  
  console.warn(
    '[DEPRECATED] useGoogleOAuth hook is deprecated and will be removed in a future update. ' +
    'Please use useGoogleAuth from @/contexts/GoogleAuthContext directly.'
  );
  
  return googleAuth;
}
