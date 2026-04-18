import { createClient } from '@supabase/supabase-js';

// ─── Client project Supabase instance ─────────────────────────────────────────
// Connects to THIS dealership's own Supabase project.
// Only the anon/publishable key is used here — never service_role.
// service_role keys live exclusively in Vault, accessed only by Edge Functions.

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,
    storageKey: 'stockmo_auth_v2',
  },
  realtime: {
    params: { eventsPerSecond: 0 }, // Disabled — polling is correct at this scale
  },
});

// ─── Operator project constants (for feature flag delivery) ───────────────────
export const OPERATOR_FUNCTIONS_URL = import.meta.env.VITE_OPERATOR_FUNCTIONS_URL as string;
export const CLIENT_SLUG            = import.meta.env.VITE_CLIENT_SLUG as string;
export const CLIENT_API_KEY         = import.meta.env.VITE_CLIENT_API_KEY as string;
