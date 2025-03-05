
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXdsbHRyZnZva2psYXVmZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjU0MjYsImV4cCI6MjA1NjQ0MTQyNn0.G2JhvsEw4Q24vgt9SS9_nOMPtOdOqTGpus8zEJ5USD8';

// Create a Supabase client with anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a function to get a Supabase client with auth
export const getSupabaseWithAuth = (accessToken?: string) => {
  if (!accessToken) return supabase;
  
  return createClient(
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
};
