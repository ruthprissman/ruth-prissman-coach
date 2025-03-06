
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXdsbHRyZnZva2psYXVmZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjU0MjYsImV4cCI6MjA1NjQ0MTQyNn0.G2JhvsEw4Q24vgt9SS9_nOMPtOdOqTGpus8zEJ5USD8';

// Create a singleton Supabase client with anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cache for authenticated clients to avoid creating multiple instances
const authClientCache = new Map<string, ReturnType<typeof createClient>>();

// Create a function to get a Supabase client with auth
export const getSupabaseWithAuth = (accessToken?: string) => {
  if (!accessToken) return supabase;
  
  try {
    // Return cached client if it exists for this token
    if (authClientCache.has(accessToken)) {
      return authClientCache.get(accessToken)!;
    }
    
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
  } else {
    authClientCache.clear();
  }
};
