import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ─── Update Client Config (Kill Switch + Config Writes) ───────────────────────
// Writes a key-value pair to a client project's client_config table.
// Setting maintenance_mode=true activates the RLS kill switch in StockMo.
// Only authenticated operator superadmins can call this.

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const operatorClient = createClient(
      Deno.env.get('OPERATOR_SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify operator user and check superadmin role
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

    const { data: opUser } = await operatorClient
      .from('operator_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!opUser || opUser.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Forbidden: superadmin required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { client_id, key, value } = await req.json();
    if (!client_id || !key || value === undefined) {
      return new Response(JSON.stringify({ error: 'Missing client_id, key, or value' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the client's Supabase URL
    const { data: client, error: clientErr } = await operatorClient
      .from('clients')
      .select('supabase_url, status')
      .eq('id', client_id)
      .single();

    if (clientErr || !client) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Retrieve service_role key from Vault
    const { data: secret, error: secretErr } = await operatorClient.rpc('get_client_secret', {
      p_client_id: client_id,
      p_key_type: 'service_role',
    });

    if (secretErr || !secret) {
      return new Response(JSON.stringify({ error: 'Credential retrieval failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Write to the client's client_config table
    const cc = createClient(client.supabase_url as string, secret as string);
    const { error: writeErr } = await cc
      .from('client_config')
      .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() },
               { onConflict: 'key' });

    if (writeErr) {
      return new Response(JSON.stringify({ error: writeErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sync suspension status back to operator DB
    if (key === 'maintenance_mode') {
      const newStatus = value === true ? 'suspended' : 'active';
      await operatorClient
        .from('clients')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', client_id);
    }

    // Write to audit log
    await operatorClient.from('operator_audit_log').insert({
      actor_id: user.id,
      action: `set_client_config.${key}`,
      target_type: 'client',
      target_id: client_id,
      old_values: { status: client.status },
      new_values: { key, value },
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
