
import { supabaseClient, clearSupabaseClientCache } from './supabaseClient';

// For backward compatibility, export the client
export const supabase = supabaseClient();

// Create a function to get a Supabase client with auth (for backward compatibility)
export const getSupabaseWithAuth = async () => {
  console.warn('[Supabase] getSupabaseWithAuth is deprecated, use supabaseClient() instead');
  return supabaseClient();
};

// For backward compatibility
export const clearAuthClientCache = () => {
  console.warn('[Supabase] clearAuthClientCache is deprecated, use clearSupabaseClientCache() instead');
  clearSupabaseClientCache();
};

// Log a deprecation warning when this file is imported
console.warn(
  '[Supabase] src/lib/supabase.ts is deprecated and will be removed in the future. ' +
  'Please use src/lib/supabaseClient.ts instead.'
);
