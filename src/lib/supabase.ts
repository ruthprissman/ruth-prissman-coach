
import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseClient, getFreshSupabaseClient, clearSupabaseClientCache, getSupabaseClient } from './supabaseClient';

// Define specific type for Supabase client
type SupabaseTypedClient = SupabaseClient<any, "public", any>;

// For backward compatibility, export the client getter
export const supabase: SupabaseTypedClient = supabaseClient;

// Create a function to get a Supabase client with auth (for backward compatibility)
export const getSupabaseWithAuth = async (accessToken?: string): Promise<SupabaseTypedClient> => {
  // This ignores the accessToken parameter and always uses the supabaseClientManager
  console.warn('[Supabase] getSupabaseWithAuth is deprecated, use supabaseClient() instead');
  
  // Return a Promise<SupabaseTypedClient> to match the expected return type
  return await supabaseClient();
};

// For backward compatibility
export const clearAuthClientCache = (accessToken?: string) => {
  console.warn('[Supabase] clearAuthClientCache is deprecated, use clearSupabaseClientCache() instead');
  clearSupabaseClientCache();
};

// Log a deprecation warning when this file is imported
console.warn(
  '[Supabase] src/lib/supabase.ts is deprecated and will be removed in the future. ' +
  'Please use src/lib/supabaseClient.ts instead.'
);
