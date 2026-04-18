import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ─── Health Check ─────────────────────────────────────────────────────────────
// Pings all active client projects, measuring latency and vehicle/user counts.
// Upserts results into operator.client_sync_cache.
// Called by pg_cron every 15 minutes and on-demand from Master Dashboard.

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const operatorClient = createClient(
      Deno.env.get('OPERATOR_SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch all active clients
    const { data: clients, error: clientErr } = await operatorClient
      .from('clients')
      .select('id, supabase_url')
      .eq('status', 'active');

    if (clientErr || !clients) {
      return new Response(JSON.stringify({ error: clientErr?.message ?? 'No clients' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fan out health checks in parallel
    const checks = await Promise.allSettled(
      clients.map(async (c) => {
        const start = Date.now();

        const { data: secret, error: secretErr } = await operatorClient.rpc('get_client_secret', {
          p_client_id: c.id,
          p_key_type: 'service_role',
        });

        if (secretErr || !secret) throw new Error('Credential retrieval failed');

        const cc = createClient(c.supabase_url as string, secret as string);

        // Parallel queries: vehicle count by stage + user count
        const [vehicleRes, userRes] = await Promise.all([
          cc.from('vehicles').select('stage'),
          cc.from('technicians').select('id', { count: 'exact', head: true }),
        ]);

        const latency = Date.now() - start;

        // Count vehicles by stage
        const byStage: Record<string, number> = {};
        for (const v of vehicleRes.data ?? []) {
          byStage[v.stage] = (byStage[v.stage] ?? 0) + 1;
        }
        const totalVehicles = vehicleRes.data?.length ?? 0;
        const totalUsers = userRes.count ?? 0;

        return {
          client_id: c.id,
          total_vehicles: totalVehicles,
          total_users: totalUsers,
          active_users: totalUsers,
          vehicles_by_stage: byStage,
          latency_ms: latency,
          healthy: true,
          synced_at: new Date().toISOString(),
        };
      })
    );

    // Separate succeeded from failed
    const toUpsert: Record<string, unknown>[] = [];
    const failed: string[] = [];

    checks.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        toUpsert.push(result.value);
      } else {
        const clientId = clients[i].id;
        failed.push(clientId);
        // Mark as unhealthy in cache
        toUpsert.push({
          client_id: clientId,
          healthy: false,
          synced_at: new Date().toISOString(),
        });

        // Create operator alert for repeated failures
        operatorClient.from('operator_alerts').insert({
          client_id: clientId,
          type: 'health_failure',
          message: `Health check failed: ${String(result.reason)}`,
        }).then(() => {});
      }
    });

    // Upsert all results into sync cache
    if (toUpsert.length > 0) {
      await operatorClient
        .from('client_sync_cache')
        .upsert(toUpsert, { onConflict: 'client_id' });
    }

    return new Response(JSON.stringify({
      checked: clients.length,
      healthy: clients.length - failed.length,
      failed: failed.length,
      client_failures: failed,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
