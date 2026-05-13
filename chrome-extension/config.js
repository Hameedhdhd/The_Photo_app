/**
 * Configuration for the Kleinanzeigen Sync Chrome Extension
 * 
 * UPDATE THESE VALUES to match your deployment:
 * - API_URL: Your FastAPI backend URL
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_ANON_KEY: Your Supabase anon/public key
 */

const CONFIG = {
  // Backend API URL (change to your production URL when deployed)
  API_URL: 'http://192.168.178.61:8000',
  
  // Supabase configuration (same as your mobile app)
  SUPABASE_URL: 'https://awwahpecfvdljgupnzft.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_JbvTrXHKwtnZTcMGte00Ng_6uhuWG3s',
};

// Make config available to other scripts
if (typeof window !== 'undefined') {
  window.EXTENSION_CONFIG = CONFIG;
}