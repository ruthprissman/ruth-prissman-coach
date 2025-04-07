
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
    
    // Display a loading indicator to the user
    const loadingElement = document.createElement('div');
    loadingElement.id = 'auth-loading';
    loadingElement.style.position = 'fixed';
    loadingElement.style.top = '0';
    loadingElement.style.left = '0';
    loadingElement.style.width = '100%';
    loadingElement.style.height = '100%';
    loadingElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    loadingElement.style.display = 'flex';
    loadingElement.style.justifyContent = 'center';
    loadingElement.style.alignItems = 'center';
    loadingElement.style.zIndex = '9999';
    
    const loadingContent = document.createElement('div');
    loadingContent.innerHTML = `
      <div style="text-align: center;">
        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; margin: 0 auto; animation: spin 2s linear infinite;"></div>
        <p style="margin-top: 10px; font-family: Arial, sans-serif;">מתחבר למערכת...</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    loadingElement.appendChild(loadingContent);
    document.body.appendChild(loadingElement);
    
    try {
      // Extract tokens from URL hash
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
          // Step 2: Set the session with the tokens
          console.log('🔄 Setting Supabase session with tokens...');
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (sessionError) {
            throw new Error(`Failed to set session: ${sessionError.message}`);
          } 
          
          if (!sessionData?.session) {
            throw new Error('Session data is missing after setSession');
          }
          
          console.log('✅ Session set successfully:', {
            user: sessionData.session.user.email,
            expires_at: new Date(sessionData.session.expires_at * 1000).toLocaleString()
          });
          
          // Store provider token in localStorage if available (for Google Calendar API)
          if (provider_token) {
            localStorage.setItem('google_provider_token', provider_token);
            console.log('✅ Google provider token stored for calendar access');
          }
          
          // Step 3: Get the current user to ensure session is valid
          console.log('🔄 Fetching current user details...');
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            throw new Error(`Failed to get user: ${userError.message}`);
          }
          
          if (!userData?.user) {
            throw new Error('User data is missing after getUser');
          }
          
          console.log('✅ User details retrieved:', {
            email: userData.user.email,
            id: userData.user.id,
          });
          
          // Step 4: Check if user is in admins table
          console.log('🔄 Checking if user is an admin...');
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('email')
            .eq('email', userData.user.email)
            .single();
          
          // Clean up URL by removing the hash
          window.history.replaceState(
            {}, 
            document.title, 
            window.location.pathname
          );
          console.log('✅ URL cleaned up, hash fragment removed');
          
          if (adminError) {
            if (adminError.code === 'PGRST116') {
              // Record not found - user is not an admin
              console.log('⚠️ User is not an admin, signing out...');
              
              // Step 6: Not an admin, sign out and redirect
              await supabase.auth.signOut();
              localStorage.removeItem('google_provider_token'); // Clean up tokens
              
              // Remove loading indicator and display error before redirect
              document.body.removeChild(loadingElement);
              
              const errorElement = document.createElement('div');
              errorElement.style.position = 'fixed';
              errorElement.style.top = '20px';
              errorElement.style.left = '50%';
              errorElement.style.transform = 'translateX(-50%)';
              errorElement.style.backgroundColor = '#f8d7da';
              errorElement.style.color = '#721c24';
              errorElement.style.padding = '12px 20px';
              errorElement.style.borderRadius = '4px';
              errorElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
              errorElement.style.zIndex = '10000';
              errorElement.style.textAlign = 'center';
              errorElement.style.fontFamily = 'Arial, sans-serif';
              errorElement.innerHTML = 'אין לך הרשאת גישה למערכת הניהול';
              
              document.body.appendChild(errorElement);
              
              // Remove error message after 3 seconds
              setTimeout(() => {
                if (document.body.contains(errorElement)) {
                  document.body.removeChild(errorElement);
                }
                window.location.href = '/'; // Redirect to home page
              }, 3000);
              
              return;
            } else {
              throw new Error(`Error checking admin status: ${adminError.message}`);
            }
          }
          
          // Step 5: Admin found, redirect to dashboard
          if (adminData) {
            console.log('✅ User is admin, redirecting to dashboard...');
            document.body.removeChild(loadingElement); // Remove loading indicator
            window.location.href = '/admin/dashboard';
          } else {
            // This is a fallback - should be caught by the adminError code above
            console.log('⚠️ User is not admin (no data), signing out...');
            await supabase.auth.signOut();
            localStorage.removeItem('google_provider_token');
            document.body.removeChild(loadingElement);
            window.location.href = '/';
          }
          
        } catch (error: any) {
          console.error('❌ Error during auth redirect process:', error);
          
          // Remove loading indicator and show error
          if (document.body.contains(loadingElement)) {
            document.body.removeChild(loadingElement);
          }
          
          // Display error message
          const errorElement = document.createElement('div');
          errorElement.style.position = 'fixed';
          errorElement.style.top = '20px';
          errorElement.style.left = '50%';
          errorElement.style.transform = 'translateX(-50%)';
          errorElement.style.backgroundColor = '#f8d7da';
          errorElement.style.color = '#721c24';
          errorElement.style.padding = '12px 20px';
          errorElement.style.borderRadius = '4px';
          errorElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
          errorElement.style.zIndex = '10000';
          errorElement.style.textAlign = 'center';
          errorElement.style.fontFamily = 'Arial, sans-serif';
          errorElement.innerHTML = `התרחשה שגיאה: ${error.message || 'אנא נסה שוב'}`;
          
          document.body.appendChild(errorElement);
          
          // Remove error message after 5 seconds
          setTimeout(() => {
            if (document.body.contains(errorElement)) {
              document.body.removeChild(errorElement);
            }
            window.location.href = '/'; // Redirect to home page
          }, 5000);
        }
      } else {
        console.error('❌ Missing required tokens in URL hash');
        
        // Remove loading indicator if it exists
        if (document.body.contains(loadingElement)) {
          document.body.removeChild(loadingElement);
        }
        
        // Display error for missing tokens
        const errorElement = document.createElement('div');
        errorElement.style.position = 'fixed';
        errorElement.style.top = '20px';
        errorElement.style.left = '50%';
        errorElement.style.transform = 'translateX(-50%)';
        errorElement.style.backgroundColor = '#f8d7da';
        errorElement.style.color = '#721c24';
        errorElement.style.padding = '12px 20px';
        errorElement.style.borderRadius = '4px';
        errorElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        errorElement.style.zIndex = '10000';
        errorElement.style.textAlign = 'center';
        errorElement.style.fontFamily = 'Arial, sans-serif';
        errorElement.innerHTML = 'התחברות נכשלה: חסרים פרמטרים נדרשים';
        
        document.body.appendChild(errorElement);
        
        // Remove error message after 3 seconds
        setTimeout(() => {
          if (document.body.contains(errorElement)) {
            document.body.removeChild(errorElement);
          }
          window.location.href = '/'; // Redirect to home page
        }, 3000);
      }
    } catch (error: any) {
      console.error('❌ Unexpected error during auth redirect:', error);
      
      // Remove loading indicator if it exists
      const loadingEl = document.getElementById('auth-loading');
      if (loadingEl && loadingEl.parentNode) {
        loadingEl.parentNode.removeChild(loadingEl);
      }
      
      // Display generic error
      const errorElement = document.createElement('div');
      errorElement.style.position = 'fixed';
      errorElement.style.top = '20px';
      errorElement.style.left = '50%';
      errorElement.style.transform = 'translateX(-50%)';
      errorElement.style.backgroundColor = '#f8d7da';
      errorElement.style.color = '#721c24';
      errorElement.style.padding = '12px 20px';
      errorElement.style.borderRadius = '4px';
      errorElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      errorElement.style.zIndex = '10000';
      errorElement.style.textAlign = 'center';
      errorElement.style.fontFamily = 'Arial, sans-serif';
      errorElement.innerHTML = 'התרחשה שגיאה לא צפויה בתהליך ההתחברות';
      
      document.body.appendChild(errorElement);
      
      // Remove error message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(errorElement)) {
          document.body.removeChild(errorElement);
        }
        window.location.href = '/'; // Redirect to home page
      }, 3000);
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
