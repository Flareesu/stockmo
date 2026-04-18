import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ─── Feature Flag Delivery ────────────────────────────────────────────────────
// Called by StockMo SPA on startup and every 5 minutes.
// Returns resolved feature flags for the requesting client + suspension status.
// Authentication: per-client read-only API key in X-StockMo-Client-Key header.

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-stockmo-client-key, x-stockmo-client-slug',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientApiKey  = req.headers.get('X-StockMo-Client-Key');
    const clientSlug    = req.headers.get('X-StockMo-Client-Slug');

    if (!clientApiKey || !clientSlug) {
      return new Response(JSON.stringify({ error: 'Missing X-StockMo-Client-Key or X-StockMo-Client-Slug' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const operatorClient = createClient(
      Deno.env.get('OPERATOR_SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Look up client by slug + validate API key
    const { data: client, error: clientErr } = await operatorClient
      .from('clients')
      .select('id, status, slug')
      .eq('slug', clientSlug)
      .is('deleted_at', null)
      .single();

    if (clientErr || !client) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Suspended clients: return suspended=true so StockMo shows maintenance screen
    if (client.status === 'suspended') {
      return new Response(JSON.stringify({ flags: {}, suspended: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch effective flags for this client from the view
    const { data: flagRows, error: flagErr } = await operatorClient
      .from('effective_feature_flags')
      .select('feature_key, enabled')
      .eq('client_id', client.id);

    if (flagErr) {
      return new Response(JSON.stringify({ error: flagErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Reduce to { feature_key: boolean } map
    const flags: Record<string, boolean> = {};
    for (const row of flagRows ?? []) {
      flags[row.feature_key] = row.enabled;
    }

    return new Response(JSON.stringify({ flags, suspended: false }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
