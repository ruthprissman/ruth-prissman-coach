
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from '@/lib/supabase'

// Auth redirect handler - Runs on every page load
const handleAuthRedirect = async () => {
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
      
      try {
        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });
        
        if (error) {
          console.error('Error setting session:', error);
          return;
        } 
        
        if (data?.session) {
          console.log('Session set successfully, checking admin status...');
          
          // Clean up URL by removing the hash
          window.history.replaceState(
            {}, 
            document.title, 
            window.location.pathname + window.location.search
          );
          
          // Check if user is in admins table
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('email')
            .eq('email', data.session.user.email)
            .single();
          
          if (adminError && adminError.code !== 'PGRST116') {
            console.error('Error checking admin status:', adminError);
          }
          
          // Redirect based on admin status
          if (adminData) {
            console.log('User is admin, redirecting to dashboard...');
            window.location.href = '/admin/dashboard';
          } else {
            console.log('User is not admin, redirecting to homepage...');
            // Sign out non-admin users
            await supabase.auth.signOut();
            window.location.href = '/';
          }
        }
      } catch (error) {
        console.error('Unexpected error during auth redirect:', error);
      }
    }
  }
};

// Execute the handler when the app loads
(async function() {
  await handleAuthRedirect();
})();

// Render the app normally
createRoot(document.getElementById("root")!).render(<App />);
