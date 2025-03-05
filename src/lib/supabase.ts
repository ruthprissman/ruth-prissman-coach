import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXdsbHRyZnZva2psYXVmZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjU0MjYsImV4cCI6MjA1NjQ0MTQyNn0.G2JhvsEw4Q24vgt9SS9_nOMPtOdOqTGpus8zEJ5USD8';

// Create a singleton Supabase client with anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Keep a reference to the auth client to avoid creating multiple instances
let authClient: ReturnType<typeof createClient> | null = null;

// Create a function to get a Supabase client with auth
export const getSupabaseWithAuth = (accessToken?: string) => {
  if (!accessToken) return supabase;
  
  try {
    // Return existing auth client if it exists to prevent multiple instances
    if (authClient) return authClient;
    
    // Create new authenticated client
    authClient = createClient(
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
    
    return authClient;
  } catch (error) {
    console.error('Error creating authenticated Supabase client:', error);
    return supabase; // Fallback to anonymous client
  }
};
