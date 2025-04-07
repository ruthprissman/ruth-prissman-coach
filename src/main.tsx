
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from '@/lib/supabase'

// Auth redirect handler - Runs on every page load
const handleAuthRedirect = () => {
  // Check if URL contains access_token in the hash
  if (window.location.hash && window.location.hash.includes('access_token')) {
    const hashParams = new URLSearchParams(
      window.location.hash.substring(1) // Remove the # character
    );
    
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');
    
    // If we have both tokens, set the session
    if (access_token && refresh_token) {
      console.log('Auth tokens found in URL, setting session...');
      
      // Set the session with the tokens
      supabase.auth.setSession({
        access_token,
        refresh_token
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error setting session:', error);
        } else if (data?.session) {
          console.log('Session set successfully, redirecting...');
          
          // Clean up URL by removing the hash
          window.history.replaceState(
            {}, 
            document.title, 
            window.location.pathname + window.location.search
          );
          
          // Redirect to dashboard
          window.location.href = '/admin/dashboard';
        }
      });
    }
  }
};

// Execute the handler when the app loads
handleAuthRedirect();

// Render the app normally
createRoot(document.getElementById("root")!).render(<App />);
