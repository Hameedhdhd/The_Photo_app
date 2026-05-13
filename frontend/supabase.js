import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Retrieve values mapped from the .env file
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug: log env values (mask key for security)
console.log('Supabase URL:', supabaseUrl || 'UNDEFINED');
console.log('Supabase Key:', supabaseAnonKey ? `${supabaseAnonKey.slice(0, 10)}...` : 'UNDEFINED');

// Fallback hardcoded values if env vars aren't loaded (e.g., Expo Go)
if (!supabaseUrl) {
  supabaseUrl = 'https://awwahpecfvdljgupnzft.supabase.co';
  console.log('Using fallback Supabase URL');
}
if (!supabaseAnonKey) {
  supabaseAnonKey = 'sb_publishable_JbvTrXHKwtnZTcMGte00Ng_6uhuWG3s';
  console.log('Using fallback Supabase anon key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'api',
  },
});
