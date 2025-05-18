
import { supabaseClient } from '@/lib/supabaseClient';
import { getCookie } from '@/utils/cookieUtils';

/**
 * Stand-alone version of session diagnostics that can be imported and run
 * without React hooks. This is useful for non-component parts of the app.
 */
export class SessionDiagnostics {
  private static initialized = false;
  private static issues: string[] = [];
  private static authEvents: { event: string; timestamp: string }[] = [];
  private static initialSession: any = null;
  private static sessionChecks = {
    oneMinute: false,
    twoMinutes: false,
    fiveMinutes: false
  };

  /**
   * Run comprehensive session diagnostics
   */
  public static async runDiagnostics(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    console.group('SUPABASE_SESSION_DIAGNOSTICS');
    console.log('⚡ Starting Supabase session diagnostics...');

    try {
      this.checkPersistSession();
      await this.checkEnvironmentAndSession();
      this.setupAuthListener();
      this.scheduleSessionChecks();
    } catch (error) {
      console.error('Error initializing session diagnostics:', error);
    }
  }

  /**
   * Force an immediate summary report
   */
  public static summarize(): void {
    console.group('SUPABASE_SESSION_DIAGNOSTICS (Manual Summary)');
    console.log('📊 Session Diagnostics Summary:');
    
    if (this.issues.length === 0) {
      console.log('✅ No issues detected in session handling');
    } else {
      console.warn('⚠️ Issues detected:');
      this.issues.forEach((issue, i) => {
        console.warn(`  ${i+1}. ${issue}`);
      });
    }
    
    console.log('📝 Auth events:', this.authEvents);
    
    console.groupEnd();
  }

  /**
   * Check if persistSession is enabled
   */
  private static checkPersistSession(): void {
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
        this.addIssue('persistSession appears to be disabled, which can cause session persistence issues');
      }
    } catch (error) {
      console.error('Error checking persistSession status:', error);
    }
  }

  /**
   * Check current environment and session details
   */
  private static async checkEnvironmentAndSession(): Promise<void> {
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
        this.addIssue(`Environment mismatch: Cookie says '${authEnvCookie}' but we're in '${isPreview ? 'preview' : 'production'}'`);
      }
      
      // Check current session
      const { data } = await supabaseClient().auth.getSession();
      const session = data.session;
      
      if (session) {
        console.log('✅ Initial session is valid');
        console.log(`🔑 Access token: ${session.access_token.substring(0, 12)}...`);
        console.log(`🔄 Refresh token: ${session.refresh_token ? `${session.refresh_token.substring(0, 8)}...` : 'not present'}`);
        
        if (!session.refresh_token) {
          this.addIssue('Refresh token is missing, which will prevent session renewal');
        }
        
        const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown';
        console.log(`⏰ Expires at: ${expiresAt}`);
        
        // Save initial session for later comparison
        this.initialSession = session;
      } else {
        console.log('❌ No active session found');
      }
    } catch (error) {
      console.error('Error checking environment and session:', error);
    }
  }

  /**
   * Schedule session checks at different intervals
   */
  private static scheduleSessionChecks(): void {
    // Check session after 1 minute
    setTimeout(async () => {
      try {
        const { data } = await supabaseClient().auth.getSession();
        const sessionExists = !!data.session;
        const refreshTokenExists = !!data.session?.refresh_token;
        
        console.log(`⏱️ [1-minute check] Session exists: ${sessionExists}`);
        console.log(`⏱️ [1-minute check] Refresh token exists: ${refreshTokenExists}`);
        
        if (!sessionExists && this.initialSession) {
          this.addIssue('Session lost after 1 minute');
        }
        
        this.sessionChecks.oneMinute = true;
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
        
        if (!sessionExists && this.initialSession && !this.sessionChecks.oneMinute) {
          this.addIssue('Session lost after 2 minutes');
        }
        
        this.sessionChecks.twoMinutes = true;
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
        
        if (!sessionExists && this.initialSession && 
            !this.sessionChecks.oneMinute && !this.sessionChecks.twoMinutes) {
          this.addIssue('Session lost after 5 minutes');
        }
        
        // Close diagnostics group after all checks
        this.summarizeFinal();
      } catch (error) {
        console.error('Error in 5-minute session check:', error);
        this.summarizeFinal();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Setup listener for auth state changes
   */
  private static setupAuthListener(): void {
    try {
      const { data: { subscription } } = supabaseClient().auth.onAuthStateChange((event, session) => {
        this.logAuthEvent(event);
        
        if (event === 'SIGNED_OUT') {
          // Dump all relevant state for debugging
          console.warn('⚠️ Sign out detected! Current state:');
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
        }
      });
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
    }
  }

  /**
   * Log auth events with timestamp
   */
  private static logAuthEvent(event: string): void {
    const timestamp = new Date().toISOString();
    this.authEvents.push({ event, timestamp });
    console.log(`📝 Auth event: ${event} at ${timestamp}`);
  }

  /**
   * Add an issue to the diagnostics report
   */
  private static addIssue(issue: string): void {
    this.issues.push(issue);
    console.warn(`⚠️ Issue detected: ${issue}`);
  }

  /**
   * Finalize diagnostics with a summary
   */
  private static summarizeFinal(): void {
    console.log('📊 Session Diagnostics Summary (After All Checks):');
    
    if (this.issues.length === 0) {
      console.log('✅ No issues detected in session handling');
    } else {
      console.warn(`⚠️ Found ${this.issues.length} issues:`);
      this.issues.forEach((issue, i) => {
        console.warn(`  ${i+1}. ${issue}`);
      });
    }
    
    console.groupEnd();
  }
}

// Export a function to run diagnostics
export const runSessionDiagnostics = async () => {
  await SessionDiagnostics.runDiagnostics();
};

// Export a function to get a summary
export const getSessionDiagnosticsSummary = () => {
  SessionDiagnostics.summarize();
};
