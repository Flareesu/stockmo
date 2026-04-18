import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ─── Sync Analytics ───────────────────────────────────────────────────────────
// ETL job: fans out to all active client projects, collects vehicle/user counts,
// and upserts into operator.client_sync_cache.
// Invoked by pg_cron every 5 minutes. Also called on-demand from Master Dashboard.

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

    const { data: clients, error: clientErr } = await operatorClient
      .from('clients')
      .select('id, supabase_url')
      .eq('status', 'active');

    if (clientErr || !clients) {
      return new Response(JSON.stringify({ error: clientErr?.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const updates = await Promise.allSettled(
      clients.map(async (c) => {
        const { data: secret } = await operatorClient.rpc('get_client_secret', {
          p_client_id: c.id,
          p_key_type: 'service_role',
        });
        if (!secret) throw new Error('No credentials');

        const cc = createClient(c.supabase_url as string, secret as string);

        const [vehicleRes, userRes, alertRes] = await Promise.all([
          cc.from('vehicles').select('stage'),
          cc.from('technicians').select('id, online'),
          cc.from('admin_alerts').select('id', { count: 'exact', head: true })
            .eq('resolved', false),
        ]);

        const byStage: Record<string, number> = {};
        for (const v of vehicleRes.data ?? []) {
          byStage[v.stage] = (byStage[v.stage] ?? 0) + 1;
        }

        const techs = userRes.data ?? [];
        const activeUsers  = techs.filter((t: { online: boolean }) => t.online).length;
        const totalUsers   = techs.length;
        const totalVehicles = vehicleRes.data?.length ?? 0;

        return {
          client_id:        c.id,
          total_vehicles:   totalVehicles,
          total_users:      totalUsers,
          active_users:     activeUsers,
          vehicles_by_stage: byStage,
          healthy:          true,
          synced_at:        new Date().toISOString(),
        };
      })
    );

    const toUpsert = updates
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<Record<string, unknown>>).value);

    const failed = updates
      .map((r, i) => r.status === 'rejected' ? clients[i].id : null)
      .filter(Boolean);

    if (toUpsert.length > 0) {
      await operatorClient
        .from('client_sync_cache')
        .upsert(toUpsert, { onConflict: 'client_id' });
    }

    return new Response(JSON.stringify({
      synced: toUpsert.length,
      failed: failed.length,
      failed_ids: failed,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
