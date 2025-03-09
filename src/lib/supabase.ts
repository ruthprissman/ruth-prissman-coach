
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Define specific type for Supabase client
type SupabaseTypedClient = SupabaseClient<any, "public", any>;

const supabaseUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXdsbHRyZnZva2psYXVmZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjU0MjYsImV4cCI6MjA1NjQ0MTQyNn0.G2JhvsEw4Q24vgt9SS9_nOMPtOdOqTGpus8zEJ5USD8';

// Create a singleton Supabase client with anon key
export const supabase: SupabaseTypedClient = createClient(supabaseUrl, supabaseAnonKey);

// Cache for authenticated clients to avoid creating multiple instances
const authClientCache = new Map<string, SupabaseTypedClient>();

// Create a function to get a Supabase client with auth
export const getSupabaseWithAuth = (accessToken?: string): SupabaseTypedClient => {
  if (!accessToken) {
    console.log("Warning: getSupabaseWithAuth called without accessToken");
    return supabase;
  }
  
  try {
    // Return cached client if it exists for this token
    if (authClientCache.has(accessToken)) {
      console.log("Using cached authenticated Supabase client");
      return authClientCache.get(accessToken)!;
    }
    
    console.log("Creating new authenticated Supabase client");
    
    // Create new authenticated client
    const authClient = createClient(
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
    
    // Cache the client
    authClientCache.set(accessToken, authClient);
    
    return authClient;
  } catch (error) {
    console.error('Error creating authenticated Supabase client:', error);
    return supabase; // Fallback to anonymous client
  }
};

// Clear cached client when needed (e.g., on logout)
export const clearAuthClientCache = (accessToken?: string) => {
  if (accessToken) {
    authClientCache.delete(accessToken);
    console.log("Cleared specific auth client from cache");
  } else {
    authClientCache.clear();
    console.log("Cleared all auth clients from cache");
  }
};
