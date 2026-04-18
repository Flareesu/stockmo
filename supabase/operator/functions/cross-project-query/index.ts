import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuerySpec {
  table: string;
  select: string;
  filters?: Record<string, unknown>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

interface WriteSpec {
  table: string;
  upsert: Record<string, unknown>;
  onConflict?: string;
}

interface FanOutRequest {
  client_ids: string[];
  query?: QuerySpec;
  write?: WriteSpec;
}

interface ClientResult {
  client_id: string;
  status: 'fulfilled' | 'rejected';
  data?: unknown;
  error?: string;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate caller against the operator project
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Operator client (service_role — only used server-side)
    const operatorClient = createClient(
      Deno.env.get('OPERATOR_SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify caller is an authenticated operator user
    const userClient = createClient(
      Deno.env.get('OPERATOR_SUPABASE_URL')!,
      Deno.env.get('OPERATOR_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: FanOutRequest = await req.json();
    const { client_ids, query, write } = body;

    if (!client_ids || client_ids.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch client project URLs (only active clients)
    const { data: clients, error: clientErr } = await operatorClient
      .from('clients')
      .select('id, supabase_url, status')
      .in('id', client_ids)
      .eq('status', 'active');

    if (clientErr) {
      return new Response(JSON.stringify({ error: clientErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fan out in parallel — one request per client project
    const settled = await Promise.allSettled(
      (clients ?? []).map(async (client): Promise<ClientResult> => {
        // Retrieve decrypted service_role key from Vault (SECURITY DEFINER fn)
        const { data: secret, error: secretErr } = await operatorClient.rpc('get_client_secret', {
          p_client_id: client.id,
          p_key_type: 'service_role',
        });

        if (secretErr || !secret) {
          return { client_id: client.id, status: 'rejected', error: 'Credential retrieval failed' };
        }

        const cc = createClient(client.supabase_url as string, secret as string);

        // ── Write operation (used by kill switch, config updates) ────────────
        if (write) {
          const { error } = await cc
            .from(write.table)
            .upsert(write.upsert, { onConflict: write.onConflict ?? 'key' });
          return {
            client_id: client.id,
            status: error ? 'rejected' : 'fulfilled',
            error: error?.message,
          };
        }

        // ── Read operation ────────────────────────────────────────────────────
        if (query) {
          let q = cc.from(query.table).select(query.select);

          if (query.filters) {
            for (const [col, val] of Object.entries(query.filters)) {
              q = q.eq(col, val as string);
            }
          }
          if (query.order) {
            q = q.order(query.order.column, { ascending: query.order.ascending ?? true });
          }
          if (query.limit) {
            q = q.limit(query.limit);
          }

          const { data, error } = await q;
          return {
            client_id: client.id,
            status: error ? 'rejected' : 'fulfilled',
            data,
            error: error?.message,
          };
        }

        return { client_id: client.id, status: 'rejected', error: 'No query or write spec provided' };
      })
    );

    // Map settled results
    const results: ClientResult[] = settled.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return {
        client_id: (clients ?? [])[i]?.id ?? 'unknown',
        status: 'rejected' as const,
        error: String(r.reason),
      };
    });

    return new Response(JSON.stringify({ results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
