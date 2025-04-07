
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from '@/lib/supabase'

// Set up debug logging for authentication flow
const DEBUG_AUTH = true;

// Auth redirect handler - Runs on every page load
const handleAuthRedirect = async () => {
  // Enhanced debug logging
  if (DEBUG_AUTH) {
    console.log('🔍 Auth redirect handler running...');
    console.log('📍 Current URL:', window.location.href);
  }
  
  // Check if URL contains access_token in the hash
  if (window.location.hash && window.location.hash.includes('access_token')) {
    if (DEBUG_AUTH) {
      console.log('🔑 Auth tokens found in URL hash');
    }
    
    const hashParams = new URLSearchParams(
      window.location.hash.substring(1) // Remove the # character
    );
    
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');
    const provider_token = hashParams.get('provider_token');
    
    // If we have both tokens, set the session
    if (access_token && refresh_token) {
      console.log('✅ Auth tokens extracted successfully:', { 
        access_token: access_token?.substring(0, 15) + '...',
        refresh_token: refresh_token?.substring(0, 15) + '...',
        provider_token: provider_token ? 'present' : 'not present'
      });
      
      try {
        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });
        
        if (error) {
          console.error('❌ Error setting session:', error);
          return;
        } 
        
        if (data?.session) {
          console.log('✅ Session set successfully:', {
            user: data.session.user.email,
            expires_at: new Date(data.session.expires_at * 1000).toLocaleString()
          });
          
          // Store provider token in localStorage if available (for Google Calendar API)
          if (provider_token) {
            localStorage.setItem('google_provider_token', provider_token);
            console.log('✅ Google provider token stored for calendar access');
          }
          
          // Clean up URL by removing the hash
          window.history.replaceState(
            {}, 
            document.title, 
            window.location.pathname
          );
          
          // Check if user is in admins table
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('email')
            .eq('email', data.session.user.email)
            .single();
          
          if (adminError && adminError.code !== 'PGRST116') {
            console.error('❌ Error checking admin status:', adminError);
          }
          
          // Redirect based on admin status
          if (adminData) {
            console.log('✅ User is admin, redirecting to dashboard...');
            // Use location.replace to prevent back button issues
            window.location.href = '/admin/dashboard';
          } else {
            console.log('⚠️ User is not admin, signing out...');
            // Sign out non-admin users
            await supabase.auth.signOut();
            // Remove any stored tokens
            localStorage.removeItem('google_provider_token');
            window.location.href = '/';
          }
        }
      } catch (error) {
        console.error('❌ Unexpected error during auth redirect:', error);
      }
    } else {
      console.error('❌ Missing required tokens in URL hash');
    }
  } else if (DEBUG_AUTH) {
    console.log('ℹ️ No auth tokens in URL, continuing normal app load');
  }
};

// Execute the handler when the app loads
(async function() {
  console.log('🚀 App initializing...');
  await handleAuthRedirect();
  console.log('⚡ Auth handler completed, rendering app');
})();

// Render the app normally
createRoot(document.getElementById("root")!).render(<App />);
