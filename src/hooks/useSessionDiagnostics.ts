
import { useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabaseClient';
import { getCookie } from '@/utils/cookieUtils';

export type DiagnosticsReport = {
  persistSessionEnabled: boolean;
  environment: string;
  domain: string;
  initialSessionValid: boolean;
  cookieAuthEnvExists: boolean;
  cookieAuthEnvValue: string | null;
  localStorageEnvExists: boolean;
  localStorageEnvValue: string | null;
  sessionLostAfter1Min: boolean;
  sessionLostAfter2Min: boolean;
  sessionLostAfter5Min: boolean;
  unexpectedSignOut: boolean;
  authEvents: { event: string; timestamp: string }[];
  issues: string[];
};

export function useSessionDiagnostics() {
  const [report, setReport] = useState<DiagnosticsReport>({
    persistSessionEnabled: true,
    environment: '',
    domain: '',
    initialSessionValid: false,
    cookieAuthEnvExists: false,
    cookieAuthEnvValue: null,
    localStorageEnvExists: false,
    localStorageEnvValue: null,
    sessionLostAfter1Min: false,
    sessionLostAfter2Min: false,
    sessionLostAfter5Min: false,
    unexpectedSignOut: false,
    authEvents: [],
    issues: [],
  });

  // Reference to track if we've already detected an unexpected sign out
  const unexpectedSignOutRef = useRef(false);
  
  // Reference to track if diagnostics have been initialized
  const initializedRef = useRef(false);
  
  // Reference for tracking time-based session checks
  const sessionChecksRef = useRef({
    initialSession: null as Session | null,
    oneMinuteCheck: false,
    twoMinuteCheck: false,
    fiveMinuteCheck: false
  });

  useEffect(() => {
    // Prevent running diagnostics more than once
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.group('SUPABASE_SESSION_DIAGNOSTICS');
    
    // Start diagnostics
    console.log('⚡ Starting Supabase session diagnostics...');
    
    // Function to add issues to the report
    const addIssue = (issue: string) => {
      setReport(prev => ({
        ...prev,
        issues: [...prev.issues, issue]
      }));
      console.warn(`⚠️ Issue detected: ${issue}`);
    };

    // Function to log auth events
    const logAuthEvent = (event: string) => {
      const timestamp = new Date().toISOString();
      setReport(prev => ({
        ...prev,
        authEvents: [...prev.authEvents, { event, timestamp }]
      }));
      console.log(`📝 Auth event: ${event} at ${timestamp}`);
    };

    // 1. Check if persistSession is enabled
    const persistSessionCheck = () => {
      // Supabase client might not expose this directly, so use indirect checks
      try {
        const authCookies = document.cookie
          .split(';')
          .map(cookie => cookie.trim())
          .some(cookie => cookie.startsWith('sb-'));
          
        const supabaseLocalStorage = Object.keys(localStorage)
          .some(key => key.startsWith('sb-'));
          
        const persistSessionEnabled = authCookies || supabaseLocalStorage;
        
        console.log(`🔍 persistSession appears to be: ${persistSessionEnabled ? 'enabled' : 'disabled'}`);
        
        if (!persistSessionEnabled) {
          addIssue('persistSession appears to be disabled, which can cause session persistence issues');
        }
        
        setReport(prev => ({
          ...prev,
          persistSessionEnabled
        }));
      } catch (error) {
        console.error('Error checking persistSession status:', error);
      }
    };

    // 2. Check current environment and print session details
    const environmentAndSessionCheck = async () => {
      try {
        // Get current domain and environment
        const domain = window.location.hostname;
        const isPreview = domain.includes('preview');
        const environment = isPreview ? 'Preview' : 'Production';
        
        console.log(`🌐 Running in: ${environment} environment`);
        console.log(`🌐 Domain: ${domain}`);
        
        // Check for cookies and localStorage related to environment
        const authEnvCookie = getCookie('auth_env');
        let localStorageEnv = null;
        
        try {
          localStorageEnv = localStorage.getItem('auth_env');
        } catch (error) {
          console.error('Error accessing localStorage:', error);
        }
        
        console.log(`🍪 auth_env cookie: ${authEnvCookie || 'not found'}`);
        console.log(`🗄️ auth_env in localStorage: ${localStorageEnv || 'not found'}`);
        
        // Detect environment mismatch
        if (authEnvCookie && authEnvCookie !== (isPreview ? 'preview' : 'production')) {
          addIssue(`Environment mismatch: Cookie says '${authEnvCookie}' but we're in '${isPreview ? 'preview' : 'production'}'`);
        }
        
        // Check current session
        const { data } = await supabaseClient().auth.getSession();
        const session = data.session;
        
        if (session) {
          console.log('✅ Initial session is valid');
          console.log(`🔑 Access token: ${session.access_token.substring(0, 12)}...`);
          console.log(`🔄 Refresh token: ${session.refresh_token ? `${session.refresh_token.substring(0, 8)}...` : 'not present'}`);
          
          if (!session.refresh_token) {
            addIssue('Refresh token is missing, which will prevent session renewal');
          }
          
          const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown';
          console.log(`⏰ Expires at: ${expiresAt}`);
          
          // Check if expiry is too short
          if (session.expires_at) {
            const expiresInMs = session.expires_at * 1000 - Date.now();
            const expiresInMinutes = Math.round(expiresInMs / 60000);
            console.log(`⏳ Session expires in approximately ${expiresInMinutes} minutes`);
            
            if (expiresInMinutes < 10) {
              addIssue(`Session expires very soon (${expiresInMinutes} minutes)`);
            }
          }
          
          // Save initial session for later comparison
          sessionChecksRef.current.initialSession = session;
        } else {
          console.log('❌ No active session found');
        }
        
        // Update report
        setReport(prev => ({
          ...prev,
          environment: environment,
          domain: domain,
          initialSessionValid: !!session,
          cookieAuthEnvExists: !!authEnvCookie,
          cookieAuthEnvValue: authEnvCookie,
          localStorageEnvExists: !!localStorageEnv,
          localStorageEnvValue: localStorageEnv
        }));
        
      } catch (error) {
        console.error('Error checking environment and session:', error);
      }
    };

    // 3. Schedule session checks at different intervals
    const scheduleSessionChecks = () => {
      // Check session after 1 minute
      setTimeout(async () => {
        try {
          const { data } = await supabaseClient().auth.getSession();
          const sessionExists = !!data.session;
          const refreshTokenExists = !!data.session?.refresh_token;
          
          console.log(`⏱️ [1-minute check] Session exists: ${sessionExists}`);
          console.log(`⏱️ [1-minute check] Refresh token exists: ${refreshTokenExists}`);
          
          if (!sessionExists && sessionChecksRef.current.initialSession) {
            addIssue('Session lost after 1 minute');
            setReport(prev => ({ ...prev, sessionLostAfter1Min: true }));
          }
          
          sessionChecksRef.current.oneMinuteCheck = true;
        } catch (error) {
          console.error('Error in 1-minute session check:', error);
        }
      }, 60 * 1000);

      // Check session after 2 minutes
      setTimeout(async () => {
        try {
          const { data } = await supabaseClient().auth.getSession();
          const sessionExists = !!data.session;
          const refreshTokenExists = !!data.session?.refresh_token;
          
          console.log(`⏱️ [2-minute check] Session exists: ${sessionExists}`);
          console.log(`⏱️ [2-minute check] Refresh token exists: ${refreshTokenExists}`);
          
          if (!sessionExists && sessionChecksRef.current.initialSession && !sessionChecksRef.current.oneMinuteCheck) {
            addIssue('Session lost after 2 minutes');
            setReport(prev => ({ ...prev, sessionLostAfter2Min: true }));
          }
          
          sessionChecksRef.current.twoMinuteCheck = true;
        } catch (error) {
          console.error('Error in 2-minute session check:', error);
        }
      }, 2 * 60 * 1000);

      // Check session after 5 minutes
      setTimeout(async () => {
        try {
          const { data } = await supabaseClient().auth.getSession();
          const sessionExists = !!data.session;
          const refreshTokenExists = !!data.session?.refresh_token;
          
          console.log(`⏱️ [5-minute check] Session exists: ${sessionExists}`);
          console.log(`⏱️ [5-minute check] Refresh token exists: ${refreshTokenExists}`);
          
          if (!sessionExists && sessionChecksRef.current.initialSession && 
              !sessionChecksRef.current.oneMinuteCheck && !sessionChecksRef.current.twoMinuteCheck) {
            addIssue('Session lost after 5 minutes');
            setReport(prev => ({ ...prev, sessionLostAfter5Min: true }));
          }
          
          // Complete session checks and provide summary
          summarizeDiagnostics();
        } catch (error) {
          console.error('Error in 5-minute session check:', error);
          summarizeDiagnostics();
        }
      }, 5 * 60 * 1000);
    };

    // 4. Setup listener for auth state changes
    const setupAuthListener = () => {
      try {
        const { data: { subscription } } = supabaseClient().auth.onAuthStateChange((event, session) => {
          logAuthEvent(event);
          
          if (event === 'SIGNED_OUT' && !unexpectedSignOutRef.current) {
            // If we detect a sign out but didn't explicitly call signOut
            unexpectedSignOutRef.current = true;
            
            // Dump all relevant state for debugging
            console.warn('⚠️ Unexpected sign out detected! Current state:');
            console.log('- Session:', session);
            console.log('- URL:', window.location.href);
            console.log('- Domain:', window.location.hostname);
            
            // Check cookies
            console.log('- Cookies:', document.cookie);
            
            // Check localStorage
            try {
              const authKeys = Object.keys(localStorage).filter(key => 
                key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')
              );
              
              console.log('- Auth-related localStorage keys:', authKeys);
              authKeys.forEach(key => {
                console.log(`  - ${key}:`, localStorage.getItem(key));
              });
            } catch (e) {
              console.error('Error reading localStorage:', e);
            }
            
            addIssue('Unexpected sign out detected');
            setReport(prev => ({ ...prev, unexpectedSignOut: true }));
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up auth state listener:', error);
      }
    };

    // Summarize the diagnostics results
    const summarizeDiagnostics = () => {
      console.log('📊 Supabase Session Diagnostics Summary:');
      
      setReport(prev => {
        const issues = [...prev.issues];
        console.log(`- Found ${issues.length} issues`);
        
        if (issues.length === 0) {
          console.log('✅ No issues detected in session handling');
        } else {
          console.warn('⚠️ Issues detected:');
          issues.forEach((issue, i) => {
            console.warn(`  ${i+1}. ${issue}`);
          });
        }
        
        return prev;
      });
      
      console.groupEnd();
    };

    // Run diagnostics
    persistSessionCheck();
    environmentAndSessionCheck();
    scheduleSessionChecks();
    const unsubscribeAuth = setupAuthListener();
    
    // Cleanup
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  return {
    report,
    // Return a function to force an immediate report summary (useful for debugging)
    summarizeNow: () => {
      console.group('SUPABASE_SESSION_DIAGNOSTICS (Manual Summary)');
      console.log('📊 Current Diagnostics Report:', report);
      
      if (report.issues.length === 0) {
        console.log('✅ No issues detected');
      } else {
        console.warn('⚠️ Issues detected:', report.issues);
      }
      
      console.groupEnd();
    }
  };
}

export default useSessionDiagnostics;
