
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Define specific type for Supabase client
type SupabaseTypedClient = SupabaseClient<any, "public", any>;

// Supabase configuration
const supabaseUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXdsbHRyZnZva2psYXVmZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjU0MjYsImV4cCI6MjA1NjQ0MTQyNn0.G2JhvsEw4Q24vgt9SS9_nOMPtOdOqTGpus8zEJ5USD8';

// Token refresh settings
const TOKEN_EXPIRY_MARGIN_MS = 5 * 60 * 1000; // 5 minutes before actual expiry
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE_MS = 1000; // Base delay for exponential backoff

/**
 * JWT Token utilities
 */
class TokenUtils {
  /**
   * Decode a JWT token to extract expiration time
   */
  static decodeToken(token: string): { exp?: number } {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return {};
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('[Supabase] Failed to decode JWT token:', e);
      return {};
    }
  }

  /**
   * Check if a token will expire soon or is already expired
   */
  static isTokenExpiringSoon(token?: string): boolean {
    if (!token) return true;
    
    try {
      const decoded = this.decodeToken(token);
      if (!decoded.exp) return true;
      
      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      // Token is considered expiring soon if it's within the margin
      return currentTime + TOKEN_EXPIRY_MARGIN_MS >= expiryTime;
    } catch (e) {
      console.error('[Supabase] Failed to check token expiration:', e);
      return true; // Treat as expiring if we can't verify
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static getRetryDelay(attempt: number): number {
    return RETRY_DELAY_BASE_MS * Math.pow(2, attempt);
  }
}

/**
 * RetryableOperation provides a way to retry operations with exponential backoff
 * when they fail due to token expiration or other specific errors
 */
class RetryableOperation {
  private retryCount = 0;
  
  /**
   * Execute an operation with automatic retry on token expiration
   * @param operation The async operation to execute
   * @param refreshToken Function to call to refresh the token
   * @returns The result of the operation
   */
  async execute<T>(
    operation: () => Promise<T>, 
    refreshToken: () => Promise<string | null>
  ): Promise<T> {
    while (true) {
      try {
        return await operation();
      } catch (error: any) {
        // Check if it's a JWT expiration error
        const isTokenExpiredError = 
          error?.message?.includes?.('JWT expired') || 
          error?.message?.includes?.('invalid JWT') ||
          error?.code === 'PGRST301' ||
          (error?.status === 401 && error?.statusText === 'Unauthorized');

        if (isTokenExpiredError && this.retryCount < MAX_RETRY_ATTEMPTS) {
          this.retryCount++;
          console.log(`[Supabase] Token expired, refreshing and retrying (attempt ${this.retryCount}/${MAX_RETRY_ATTEMPTS})`);
          
          // Wait with exponential backoff
          const delay = TokenUtils.getRetryDelay(this.retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Refresh token
          const newToken = await refreshToken();
          if (!newToken) {
            console.error('[Supabase] Failed to refresh token, aborting retry');
            throw error;
          }
          
          console.log('[Supabase] Token refreshed successfully, retrying operation');
          continue;
        }
        
        // If it's not a token error or we've reached max retries, rethrow
        throw error;
      }
    }
  }
}

/**
 * Unified Supabase Client Manager
 * 
 * This class manages a single instance of the Supabase client
 * and handles authentication state changes to ensure the correct
 * client is used based on authentication context.
 * 
 * It also implements token refresh strategies to ensure API calls
 * and Edge Function calls always use a valid token.
 */
class SupabaseClientManager {
  // Base anonymous client
  private anonClient: SupabaseTypedClient;
  
  // Current active session
  private currentSession: Session | null = null;
  
  // Cached authenticated client
  private authClient: SupabaseTypedClient | null = null;
  
  // Last token refresh timestamp
  private lastTokenRefresh: number = 0;
  
  // Flag to track if we're currently refreshing the token
  private isRefreshingToken: boolean = false;

  constructor() {
    // Initialize the anonymous client (used when no auth)
    // CRITICAL FIX: Added persistSession: true to ensure session persistence
    this.anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // Ensure session persistence
        storageKey: 'supabase_auth_token' // Explicit storage key for session
      }
    });
    
    // Set up auth state change listener
    this.anonClient.auth.onAuthStateChange(this.handleAuthChange);
    
    // Initialize session on startup
    this.initSession();
    
    console.log('[Supabase] Client manager initialized with persistSession=true');
  }

  /**
   * Initialize session state on startup
   */
  private async initSession(): Promise<void> {
    try {
      const { data } = await this.anonClient.auth.getSession();
      this.currentSession = data.session;
      
      if (data.session?.access_token) {
        console.log('[Supabase] Session found during initialization');
        this.createAuthenticatedClient(data.session.access_token);
        
        // Check token expiration
        if (TokenUtils.isTokenExpiringSoon(data.session.access_token)) {
          console.log('[Supabase] Token is expiring soon, refreshing on init');
          await this.refreshToken();
        }
      } else {
        console.log('[Supabase] No session found during initialization');
      }
    } catch (error) {
      console.error("[Supabase] Failed to initialize Supabase session:", error);
    }
  }

  /**
   * Handle auth state changes
   */
  private handleAuthChange = (event: AuthChangeEvent, session: Session | null): void => {
    console.log(`[Supabase] Auth event: ${event}`);
    
    // Update current session
    this.currentSession = session;
    
    if (event === 'SIGNED_OUT') {
      // Clear any authenticated clients on logout
      this.clearAuthClientCache();
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // Create authenticated client on login or token refresh
      if (session?.access_token) {
        this.createAuthenticatedClient(session.access_token);
        
        if (event === 'TOKEN_REFRESHED') {
          this.lastTokenRefresh = Date.now();
          console.log('[Supabase] Token refreshed at:', new Date().toISOString());
        }
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
    
    console.log('[Supabase] Creating authenticated client');
    
    // Create new authenticated client
    // CRITICAL FIX: Added persistSession: true to ensure session persistence
    this.authClient = createClient(
      supabaseUrl, 
      supabaseAnonKey, 
      {
        auth: {
          persistSession: true // Ensure session persistence
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );
  }

  /**
   * Explicitly refresh the authentication token
   * This is useful before making critical API calls
   */
  public async refreshToken(): Promise<string | null> {
    // Prevent concurrent refresh operations
    if (this.isRefreshingToken) {
      console.log('[Supabase] Token refresh already in progress, waiting...');
      // Wait for the current refresh to complete (max 5 seconds)
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!this.isRefreshingToken) {
          break;
        }
      }
      
      // If we're still refreshing, something is stuck
      if (this.isRefreshingToken) {
        console.error('[Supabase] Token refresh is taking too long, clearing flag');
        this.isRefreshingToken = false;
      }
    }
    
    // Check if we've refreshed recently (within last 10 seconds)
    const timeSinceLastRefresh = Date.now() - this.lastTokenRefresh;
    if (timeSinceLastRefresh < 10000) {
      console.log('[Supabase] Token was refreshed recently, reusing:', 
        `${Math.round(timeSinceLastRefresh / 1000)}s ago`);
      return this.currentSession?.access_token || null;
    }
    
    this.isRefreshingToken = true;
    
    try {
      console.log('[Supabase] Refreshing auth token');
      
      const client = this.authClient || this.anonClient;
      const { data, error } = await client.auth.refreshSession();
      
      if (error) {
        console.error('[Supabase] Failed to refresh token:', error.message);
        
        // Clear auth client on refresh failure
        this.clearAuthClientCache();
        return null;
      }
      
      // If refresh was successful
      if (data.session?.access_token) {
        this.lastTokenRefresh = Date.now();
        console.log('[Supabase] Token refreshed successfully at:', new Date().toISOString());
        
        // Check token validity again, just to be sure
        if (TokenUtils.isTokenExpiringSoon(data.session.access_token)) {
          console.warn('[Supabase] Newly refreshed token is already expiring soon?');
        }
        
        // Update current session
        this.currentSession = data.session;
        this.createAuthenticatedClient(data.session.access_token);
        
        return data.session.access_token;
      } else {
        console.error('[Supabase] Token refresh returned no session');
        return null;
      }
    } catch (error) {
      console.error('[Supabase] Error refreshing token:', error);
      return null;
    } finally {
      this.isRefreshingToken = false;
    }
  }

  /**
   * Get the appropriate Supabase client based on auth state
   * This automatically returns the authenticated client if available,
   * otherwise falls back to the anonymous client
   */
  public getClient(): SupabaseTypedClient {
    // Return authenticated client if available
    if (this.authClient && this.currentSession?.access_token) {
      // Check if token is expiring soon
      if (TokenUtils.isTokenExpiringSoon(this.currentSession.access_token)) {
        console.log('[Supabase] Token is expiring soon, scheduling refresh');
        // Refresh token in the background, don't await
        this.refreshToken().catch(err => {
          console.error('[Supabase] Background token refresh failed:', err);
        });
      }
      
      return this.authClient;
    }
    
    // Fall back to anonymous client
    return this.anonClient;
  }

  /**
   * Get a guaranteed fresh client with a recently refreshed token
   * This is useful for important operations like calling edge functions
   */
  public async getFreshClient(): Promise<SupabaseTypedClient> {
    // Always refresh the token before returning client
    const token = await this.refreshToken();
    
    if (token && this.authClient) {
      return this.authClient;
    }
    
    // Fall back to anonymous client if refresh fails
    return this.anonClient;
  }

  /**
   * Execute an operation with retry capability if token expires
   * @param operation Function that performs the operation
   * @returns Result of the operation
   */
  public async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const retryable = new RetryableOperation();
    return retryable.execute(operation, () => this.refreshToken());
  }

  /**
   * Clear any cached authenticated clients (used on logout)
   */
  public clearAuthClientCache(): void {
    console.log('[Supabase] Clearing auth client cache');
    this.authClient = null;
  }

  /**
   * Get current token expiration information
   * Useful for debugging token issues
   */
  public getTokenInfo(): { 
    hasToken: boolean; 
    isExpiringSoon: boolean; 
    lastRefresh: string;
  } {
    const token = this.currentSession?.access_token;
    return {
      hasToken: !!token,
      isExpiringSoon: TokenUtils.isTokenExpiringSoon(token),
      lastRefresh: this.lastTokenRefresh ? new Date(this.lastTokenRefresh).toISOString() : 'never'
    };
  }
}

// Create a singleton instance
const supabaseManager = new SupabaseClientManager();

// Export the supabase client getter (SYNC version, no Promise)
export const supabaseClient = (): SupabaseTypedClient => supabaseManager.getClient();

// Export the fresh client getter (ASYNC version, returns Promise)
export const getFreshSupabaseClient = async (): Promise<SupabaseTypedClient> => 
  await supabaseManager.getFreshClient();

// Export operation executor with retry capability
export const executeWithRetry = <T>(operation: () => Promise<T>): Promise<T> =>
  supabaseManager.executeWithRetry(operation);

// Export the cache clearing function for explicit cleanup
export const clearSupabaseClientCache = (): void => supabaseManager.clearAuthClientCache();

// Export token info getter for debugging
export const getTokenInfo = (): ReturnType<typeof supabaseManager.getTokenInfo> => 
  supabaseManager.getTokenInfo();

/**
 * Helper function to safely get a Supabase client from either an async or sync source
 * This resolves the TypeScript error when using functions that return Promise<SupabaseTypedClient>
 */
export const getSupabaseClient = async (clientPromise: SupabaseTypedClient | Promise<SupabaseTypedClient>): Promise<SupabaseTypedClient> => {
  return clientPromise instanceof Promise ? await clientPromise : clientPromise;
};

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
 * 3. For critical API calls that need fresh tokens:
 *    - Use: 
 *        const freshClient = await getFreshSupabaseClient();
 *        const { data } = await freshClient.from('table').select('*');
 * 
 * 4. For operations that should retry on token expiration:
 *    - Use:
 *        const result = await executeWithRetry(async () => {
 *          const { data } = await supabaseClient().from('table').select('*');
 *          return data;
 *        });
 * 
 * 5. Replace logout cleanup:
 *    - Before: clearAuthClientCache(session?.access_token);
 *    - After:  clearSupabaseClientCache();
 */
