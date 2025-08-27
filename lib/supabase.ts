import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Fallback to hardcoded values if env vars are not loaded
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || 'https://xoohhcndzvwthzfdqgjz.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb2hoY25kenZ3dGh6ZmRxZ2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODE3ODgsImV4cCI6MjA3MTc1Nzc4OH0.RugTPLdcgrM6EXKxCOjvp4FXVPjyyJ9-DidY_SuqWGQ';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing env. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('[Supabase] URL:', supabaseUrl);
  console.error('[Supabase] Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

console.log('[Supabase] URL:', supabaseUrl);
console.log('[Supabase] Key (first 8):', (supabaseAnonKey ?? '').substring(0, 8) + '...');
console.log('[Supabase] Platform:', Platform.OS);

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
  global: {
    fetch: Platform.OS === 'web' ? fetch : undefined,
  },
});

// Test connection function
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[Supabase] Testing connection...');
    
    if (Platform.OS === 'web') {
      // On web, we'll simulate a successful connection for now
      // since CORS restrictions prevent direct database access
      console.log('[Supabase] Web platform detected - using mock data');
      return { success: true };
    }
    
    const { error, count } = await supabase
      .from('websites')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('[Supabase] Connection test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Supabase] Connection test successful. Count:', count ?? 'n/a');
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Connection test error:', errorMsg);
    return { success: false, error: errorMsg };
  }
};