
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Define specific type for Supabase client
type SupabaseTypedClient = SupabaseClient<any, "public", any>;

// Supabase configuration
const supabaseUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXdsbHRyZnZva2psYXVmZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjU0MjYsImV4cCI6MjA1NjQ0MTQyNn0.G2JhvsEw4Q24vgt9SS9_nOMPtOdOqTGpus8zEJ5USD8';

/**
 * Unified Supabase Client Manager
 * 
 * This class manages a single instance of the Supabase client
 * and handles authentication state changes to ensure the correct
 * client is used based on authentication context.
 */
class SupabaseClientManager {
  // Base anonymous client
  private anonClient: SupabaseTypedClient;
  
  // Current active session
  private currentSession: Session | null = null;
  
  // Cached authenticated client
  private authClient: SupabaseTypedClient | null = null;

  constructor() {
    // Initialize the anonymous client (used when no auth)
    this.anonClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Set up auth state change listener
    this.anonClient.auth.onAuthStateChange(this.handleAuthChange);
    
    // Initialize session on startup
    this.initSession();
  }

  /**
   * Initialize session state on startup
   */
  private async initSession(): Promise<void> {
    try {
      const { data } = await this.anonClient.auth.getSession();
      this.currentSession = data.session;
      
      if (data.session?.access_token) {
        this.createAuthenticatedClient(data.session.access_token);
      }
    } catch (error) {
      console.error("Failed to initialize Supabase session:", error);
    }
  }

  /**
   * Handle auth state changes
   */
  private handleAuthChange = (event: AuthChangeEvent, session: Session | null): void => {
    console.log(`Supabase auth event: ${event}`);
    
    // Update current session
    this.currentSession = session;
    
    if (event === 'SIGNED_OUT') {
      // Clear any authenticated clients on logout
      this.clearAuthClientCache();
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // Create authenticated client on login
      if (session?.access_token) {
        this.createAuthenticatedClient(session.access_token);
      }
    }
  };

  /**
   * Create an authenticated client with access token
   */
  private createAuthenticatedClient(accessToken: string): void {
    // Prevent creating duplicate instances if token hasn't changed
    if (this.authClient && this.currentSession?.access_token === accessToken) {
      return;
    }
    
    // Create new authenticated client
    this.authClient = createClient(
      supabaseUrl, 
      supabaseAnonKey, 
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );
  }

  /**
   * Get the appropriate Supabase client based on auth state
   * This automatically returns the authenticated client if available,
   * otherwise falls back to the anonymous client
   */
  public getClient(): SupabaseTypedClient {
    // Return authenticated client if available
    if (this.authClient && this.currentSession?.access_token) {
      return this.authClient;
    }
    
    // Fall back to anonymous client
    return this.anonClient;
  }

  /**
   * Clear any cached authenticated clients (used on logout)
   */
  public clearAuthClientCache(): void {
    this.authClient = null;
  }
}

// Create a singleton instance
const supabaseManager = new SupabaseClientManager();

// Export the supabase client getter
export const supabaseClient = (): SupabaseTypedClient => supabaseManager.getClient();

// Export the cache clearing function for explicit cleanup
export const clearSupabaseClientCache = (): void => supabaseManager.clearAuthClientCache();

/**
 * MIGRATION GUIDE
 * 
 * To migrate from the old supabase.ts approach to this unified client:
 * 
 * 1. Replace imports:
 *    - Before: import { supabase, getSupabaseWithAuth } from '@/lib/supabase';
 *    - After:  import { supabaseClient } from '@/lib/supabaseClient';
 * 
 * 2. Replace client usage:
 *    - Before: 
 *        const client = authSession?.access_token 
 *          ? getSupabaseWithAuth(authSession.access_token) 
 *          : supabase;
 *        const { data } = await client.from('table').select('*');
 * 
 *    - After:
 *        const { data } = await supabaseClient().from('table').select('*');
 * 
 * 3. Replace logout cleanup:
 *    - Before: clearAuthClientCache(session?.access_token);
 *    - After:  clearSupabaseClientCache();
 *
 * Note: This client automatically detects the authentication state,
 * so you don't need to pass the access token or check for auth yourself.
 */
