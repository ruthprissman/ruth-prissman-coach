
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { getCookie, deleteCookie } from './utils/cookieUtils'

// Handle OAuth redirect if needed
function handleOAuthRedirect() {
  try {
    // Check if we have access_token in the URL hash
    const hash = window.location.hash;
    console.log('[auth-redirect] Current URL hash:', hash ? 'Present (hidden for security)' : 'Not present');
    console.log('[auth-redirect] Current pathname:', window.location.pathname);
    
    if (hash && hash.includes('access_token')) {
      console.log('[auth-redirect] Access token found in URL hash');
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      
      console.log('[auth-redirect] Access token present:', !!access_token);
      console.log('[auth-redirect] Refresh token present:', !!refresh_token);
      
      // Check if we have a saved environment in the cookie
      const env = getCookie('auth_env');
      
      console.log('[auth-redirect] Environment cookie value:', env);
      console.log('[auth-redirect] Current hostname:', window.location.hostname);
      console.log('[auth-redirect] Is preview environment:', window.location.hostname.includes('preview'));
      
      if (access_token && env) {
        console.log('[auth-redirect] Both access token and environment cookie found');
        
        // Clean up
        deleteCookie('auth_env');
        
        // Construct the correct environment URL
        const hostname = window.location.hostname;
        let redirectURL;
        
        if (env === 'preview' && !hostname.includes('preview')) {
          // We're in production but should be in preview
          console.log('[auth-redirect] Need to redirect: Currently in production but should be in preview');
          redirectURL = `preview--${hostname}`;
        } else if (env === 'production' && hostname.includes('preview')) {
          // We're in preview but should be in production
          console.log('[auth-redirect] Need to redirect: Currently in preview but should be in production');
          redirectURL = hostname.replace('preview--', '');
        } else {
          // We're in the correct environment
          console.log('[auth-redirect] Already in correct environment, no redirect needed');
          return;
        }
        
        const dashboardPath = '/admin/dashboard';
        const fullRedirectURL = `${window.location.protocol}//${redirectURL}${dashboardPath}`;
        
        console.log(`[auth-redirect] Redirecting to: ${fullRedirectURL} (tokens hidden)`);
        
        // Preserve the tokens in the URL
        const tokenParams = `#access_token=${access_token}${refresh_token ? `&refresh_token=${refresh_token}` : ''}`;
        console.log('[auth-redirect] Performing redirect with tokens in URL hash');
        window.location.replace(`${fullRedirectURL}${tokenParams}`);
        return;
      } else if (access_token && !env) {
        console.log('[auth-redirect] Access token found but no environment cookie');
        console.log('[auth-redirect] Continuing normal app render - environment handling not needed');
      } else {
        console.log('[auth-redirect] No access token or missing environment information');
      }
    } else {
      console.log('[auth-redirect] No OAuth redirect detected, normal app rendering');
    }
  } catch (error) {
    console.error('[auth-redirect] Error handling OAuth redirect:', error);
    // Continue to normal rendering if there's an error
  }
}

function renderApp() {
  try {
    console.log('[app] Starting app render process');
    
    // First check if we need to handle OAuth redirect
    console.log('[app] Checking for OAuth redirect');
    handleOAuthRedirect();
    console.log('[app] OAuth redirect check complete, proceeding with normal render');
    
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      console.error("[app] Root element not found");
      return;
    }
    
    console.log('[app] Root element found, creating React root');
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('[app] React app successfully rendered');
    
  } catch (error) {
    console.error("[app] Failed to render application:", error);
    
    // Create fallback UI for critical errors
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="font-family: system-ui; padding: 20px; text-align: center;">
          <h2>אירעה שגיאה</h2>
          <p>משהו השתבש בטעינת האפליקציה. אנא נסה לרענן את הדף.</p>
          <button onclick="window.location.reload()" style="padding: 8px 16px; background: #4A235A; color: white; border: none; border-radius: 4px; cursor: pointer;">
            רענן דף
          </button>
          <div style="margin-top: 20px; padding: 10px; background: #f7f7f7; border-radius: 4px; text-align: left; direction: ltr;">
            <p style="font-family: monospace; font-size: 12px;">${error}</p>
          </div>
        </div>
      `;
    }
  }
}

console.log('[app] Application script starting');
renderApp();
