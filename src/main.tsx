
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
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      
      // Check if we have a saved environment in the cookie
      const env = getCookie('auth_env');
      
      console.log('[auth] Cookie detected on return:', document.cookie);
      console.log('[auth] Parsed environment from cookie:', env);
      
      if (access_token && env) {
        // Clean up
        deleteCookie('auth_env');
        
        // Construct the correct environment URL
        const hostname = window.location.hostname;
        let redirectURL;
        
        if (env === 'preview' && !hostname.includes('preview')) {
          // We're in production but should be in preview
          console.log('[auth] Redirecting to preview dashboard...');
          redirectURL = `https://preview--${hostname.replace('https://', '')}`;
        } else if (env === 'production' && hostname.includes('preview')) {
          // We're in preview but should be in production
          console.log('[auth] Redirecting to production dashboard...');
          redirectURL = `https://${hostname.replace('preview--', '')}`;
        } else {
          // We're in the correct environment
          console.log('[auth] Staying in current environment');
          return;
        }
        
        const dashboardPath = '/admin/dashboard';
        const fullRedirectURL = `${window.location.protocol}//${redirectURL}${dashboardPath}`;
        
        console.log(`[auth] Full redirect URL: ${fullRedirectURL}`);
        
        // Preserve the tokens in the URL
        const tokenParams = `#access_token=${access_token}${refresh_token ? `&refresh_token=${refresh_token}` : ''}`;
        window.location.replace(`${fullRedirectURL}${tokenParams}`);
        return;
      } else if (env === null) {
        console.log('[auth] No environment cookie found');
      }
    }
  } catch (error) {
    console.error('[auth] Error handling OAuth redirect:', error);
    // Continue to normal rendering if there's an error
  }
}

function renderApp() {
  try {
    // First check if we need to handle OAuth redirect
    handleOAuthRedirect();
    
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      console.error("Root element not found");
      return;
    }
    
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
  } catch (error) {
    console.error("Failed to render application:", error);
    
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

renderApp();
