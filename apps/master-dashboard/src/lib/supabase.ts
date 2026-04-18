import { createClient } from '@supabase/supabase-js';

// ─── Operator Project Supabase Instance ───────────────────────────────────────
// The Master Dashboard connects ONLY to the operator project.
// Anon key is used — service_role key never appears in browser code.
// Cross-client data is fetched via Edge Functions (cross-project-query), not directly.

const supabaseUrl  = import.meta.env.VITE_OPERATOR_SUPABASE_URL  as string;
const supabaseAnon = import.meta.env.VITE_OPERATOR_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing VITE_OPERATOR_SUPABASE_URL or VITE_OPERATOR_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    storageKey:       'stockmo_master_auth_v1',
  },
});

export const FUNCTIONS_URL = import.meta.env.VITE_OPERATOR_FUNCTIONS_URL as string;
