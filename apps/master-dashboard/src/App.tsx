import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, FUNCTIONS_URL } from './lib/supabase';

// ─── Master Dashboard ─────────────────────────────────────────────────────────
// Completely separate from the StockMo app. Accessible only by the Master
// (operator). Login is manually provisioned — no self-signup.

type Tab = 'god-view' | 'clients' | 'flags' | 'raw-data' | 'audit';

interface Client {
  id:           string;
  name:         string;
  slug:         string;
  status:       string;
  supabase_url: string;
  dpa_signed_at: string | null;
}

interface SyncCache {
  client_id:        string;
  total_vehicles:   number;
  total_users:      number;
  vehicles_by_stage: Record<string, number>;
  healthy:          boolean;
  latency_ms:       number;
  synced_at:        string;
}

export default function App() {
  const [user, setUser]     = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Spinner />;
  if (!user)   return <LoginPage />;
  return <Dashboard user={user} />;
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginPage() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError(err.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <div className="mb-8">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">StockMo</div>
          <h1 className="text-2xl font-bold text-white">Master Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Operator access only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" required
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 transition-colors">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-gray-600 text-center mt-6">
          Accounts are provisioned by the system administrator.
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function Dashboard({ user }: { user: User }) {
  const [tab, setTab]         = useState<Tab>('god-view');
  const [clients, setClients] = useState<Client[]>([]);
  const [cache, setCache]     = useState<SyncCache[]>([]);

  useEffect(() => {
    supabase.from('clients').select('id, name, slug, status, supabase_url, dpa_signed_at')
      .is('deleted_at', null).order('name')
      .then(({ data }) => setClients(data ?? []));

    supabase.from('client_sync_cache').select('*')
      .then(({ data }) => setCache(data ?? []));
  }, []);

  const cacheById = Object.fromEntries(cache.map(c => [c.client_id, c]));

  async function signOut() { await supabase.auth.signOut(); }

  async function forceSync() {
    await fetch(`${FUNCTIONS_URL}/health-check`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
    });
    const { data } = await supabase.from('client_sync_cache').select('*');
    setCache(data ?? []);
  }

  async function toggleSuspend(client: Client) {
    const suspend = client.status !== 'suspended';
    const token   = (await supabase.auth.getSession()).data.session?.access_token;
    await fetch(`${FUNCTIONS_URL}/update-client-config`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ client_id: client.id, key: 'maintenance_mode', value: suspend }),
    });
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: suspend ? 'suspended' : 'active' } : c));
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-6 py-6 border-b border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-widest">StockMo</div>
          <div className="text-base font-bold text-white mt-0.5">Master</div>
          <div className="text-xs text-gray-500 mt-1 truncate">{user.email}</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {([
            { key: 'god-view',  icon: '🌐', label: 'God View'      },
            { key: 'clients',   icon: '🏢', label: 'Clients'       },
            { key: 'flags',     icon: '🚩', label: 'Feature Flags' },
            { key: 'raw-data',  icon: '🗄️', label: 'Raw Data'      },
            { key: 'audit',     icon: '📋', label: 'Audit Log'     },
          ] as { key: Tab; icon: string; label: string }[]).map(({ key, icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === key ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <span>{icon}</span> {label}
            </button>
          ))}
        </nav>
        <button onClick={signOut}
          className="mx-3 mb-4 px-3 py-2 text-xs text-gray-500 hover:text-white rounded-xl hover:bg-gray-800 transition-colors text-left">
          Sign out
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8">
        {tab === 'god-view' && (
          <GodView clients={clients} cacheById={cacheById} onForceSync={forceSync} />
        )}
        {tab === 'clients' && (
          <ClientsTable clients={clients} cacheById={cacheById} onToggleSuspend={toggleSuspend} />
        )}
        {tab === 'flags' && <FeatureFlagsPanel clients={clients} />}
        {tab === 'raw-data' && <RawDataExplorer clients={clients} />}
        {tab === 'audit' && <AuditLogPanel />}
      </main>
    </div>
  );
}

// ─── God View ─────────────────────────────────────────────────────────────────

function GodView({ clients, cacheById, onForceSync }: {
  clients: Client[]; cacheById: Record<string, SyncCache>; onForceSync: () => void;
}) {
  const totalVehicles = Object.values(cacheById).reduce((s, c) => s + c.total_vehicles, 0);
  const totalUsers    = Object.values(cacheById).reduce((s, c) => s + c.total_users, 0);
  const healthy       = Object.values(cacheById).filter(c => c.healthy).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">God View</h1>
        <button onClick={onForceSync}
          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl transition-colors">
          Force Sync
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Clients',   value: clients.length },
          { label: 'Total Vehicles',  value: totalVehicles },
          { label: 'Total Users',     value: totalUsers },
          { label: 'Healthy',         value: `${healthy}/${clients.length}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-3xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Per-client table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-6 py-4 text-left">Client</th>
              <th className="px-6 py-4 text-right">Vehicles</th>
              <th className="px-6 py-4 text-right">Users</th>
              <th className="px-6 py-4 text-right">Stage Breakdown</th>
              <th className="px-6 py-4 text-right">Latency</th>
              <th className="px-6 py-4 text-right">Synced</th>
              <th className="px-6 py-4 text-right">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {clients.map(c => {
              const cache = cacheById[c.id];
              const ageMin = cache ? Math.round((Date.now() - new Date(cache.synced_at).getTime()) / 60000) : null;
              return (
                <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-300">{cache?.total_vehicles ?? '—'}</td>
                  <td className="px-6 py-4 text-right text-gray-300">{cache?.total_users ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    {cache?.vehicles_by_stage
                      ? Object.entries(cache.vehicles_by_stage).map(([stage, n]) =>
                          <span key={stage} className="text-xs text-gray-400 ml-1">{stage}:{n}</span>
                        )
                      : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400 text-xs">{cache?.latency_ms ? `${cache.latency_ms}ms` : '—'}</td>
                  <td className="px-6 py-4 text-right text-xs">
                    {ageMin !== null
                      ? <span className={ageMin > 10 ? 'text-amber-400' : 'text-gray-400'}>{ageMin}m ago</span>
                      : <span className="text-gray-600">never</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      c.status === 'suspended' ? 'bg-red-900/50 text-red-400' :
                      cache?.healthy ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
                    }`}>
                      {c.status === 'suspended' ? 'Suspended' : cache?.healthy ? 'OK' : 'Error'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Clients Table ────────────────────────────────────────────────────────────

function ClientsTable({ clients, cacheById, onToggleSuspend }: {
  clients: Client[]; cacheById: Record<string, SyncCache>; onToggleSuspend: (c: Client) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clients</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-6 py-4 text-left">Client</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-right">Vehicles</th>
              <th className="px-6 py-4 text-right">DPA Signed</th>
              <th className="px-6 py-4 text-right">Kill Switch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    c.status === 'active' ? 'bg-green-900/50 text-green-400' :
                    c.status === 'suspended' ? 'bg-red-900/50 text-red-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>{c.status}</span>
                </td>
                <td className="px-6 py-4 text-right text-gray-300">
                  {cacheById[c.id]?.total_vehicles ?? '—'}
                </td>
                <td className="px-6 py-4 text-right text-xs">
                  {c.dpa_signed_at
                    ? <span className="text-green-400">{new Date(c.dpa_signed_at).toLocaleDateString()}</span>
                    : <span className="text-red-400">Not signed</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onToggleSuspend(c)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${
                      c.status === 'suspended'
                        ? 'bg-green-800 hover:bg-green-700 text-white'
                        : 'bg-red-900 hover:bg-red-800 text-red-300'
                    }`}
                  >
                    {c.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Feature Flags Panel ──────────────────────────────────────────────────────

function FeatureFlagsPanel({ clients }: { clients: Client[] }) {
  const [flags, setFlags]   = useState<{ id: string; feature_key: string; description: string; default_enabled: boolean }[]>([]);
  const [overrides, setOverrides] = useState<{ definition_id: string; client_id: string; enabled: boolean }[]>([]);

  useEffect(() => {
    supabase.from('feature_flag_definitions').select('*').order('feature_key')
      .then(({ data }) => setFlags(data ?? []));
    supabase.from('feature_flag_overrides').select('*')
      .then(({ data }) => setOverrides(data ?? []));
  }, []);

  function getOverride(defId: string, clientId: string) {
    return overrides.find(o => o.definition_id === defId && o.client_id === clientId);
  }

  async function toggleOverride(defId: string, clientId: string, current: boolean | undefined, defaultVal: boolean) {
    const effective = current ?? defaultVal;
    if (current === undefined) {
      // Create override
      const { data } = await supabase.from('feature_flag_overrides')
        .insert({ definition_id: defId, client_id: clientId, enabled: !effective }).select().single();
      if (data) setOverrides(p => [...p, data]);
    } else {
      // Toggle existing
      await supabase.from('feature_flag_overrides')
        .update({ enabled: !current }).eq('definition_id', defId).eq('client_id', clientId);
      setOverrides(p => p.map(o =>
        o.definition_id === defId && o.client_id === clientId ? { ...o, enabled: !o.enabled } : o
      ));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Feature Flags</h1>
      <div className="space-y-4">
        {flags.map(flag => (
          <div key={flag.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <code className="text-sm font-mono text-red-400">{flag.feature_key}</code>
                <p className="text-xs text-gray-500 mt-0.5">{flag.description}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${flag.default_enabled ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                default: {flag.default_enabled ? 'on' : 'off'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {clients.map(client => {
                const override = getOverride(flag.id, client.id);
                const effective = override?.enabled ?? flag.default_enabled;
                return (
                  <button key={client.id}
                    onClick={() => toggleOverride(flag.id, client.id, override?.enabled, flag.default_enabled)}
                    className={`text-xs px-3 py-2 rounded-xl text-left transition-colors ${
                      effective ? 'bg-green-900/40 text-green-300' : 'bg-gray-800 text-gray-500'
                    } ${override !== undefined ? 'ring-1 ring-amber-500/50' : ''}`}>
                    <div className="font-medium truncate">{client.name}</div>
                    <div className="text-xs opacity-60 mt-0.5">
                      {effective ? 'on' : 'off'}{override !== undefined ? ' (override)' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Raw Data Explorer ────────────────────────────────────────────────────────

function RawDataExplorer({ clients }: { clients: Client[] }) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTable, setSelectedTable]   = useState('vehicles');
  const [rows, setRows]     = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const TABLES = ['vehicles','technicians','pdi_checks','stock_maintenance','final_checks',
                  'photos','admin_alerts','repairs','vehicle_history','dropdown_options','client_config'];

  async function fetchData() {
    if (!selectedClient) return;
    setLoading(true);
    setError('');
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    try {
      const res = await fetch(`${FUNCTIONS_URL}/cross-project-query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_ids: [selectedClient],
          query: { table: selectedTable, select: '*', limit: 100 },
        }),
      });
      const { results } = await res.json();
      const result = results[0];
      if (result?.status === 'fulfilled') setRows((result.data as Record<string, unknown>[]) ?? []);
      else setError(result?.error ?? 'Query failed');
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  }

  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Raw Data Explorer</h1>
      <div className="flex gap-3 mb-4">
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white">
          <option value="">Select client…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white">
          {TABLES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={fetchData} disabled={!selectedClient || loading}
          className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50 transition-colors">
          {loading ? 'Loading…' : 'Fetch'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {rows.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-auto max-h-[60vh]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-4 py-3 text-left text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-800/50">
                  {columns.map(col => (
                    <td key={col} className="px-4 py-2.5 text-gray-300 max-w-[200px] truncate">
                      {row[col] === null ? <span className="text-gray-600">null</span> :
                       typeof row[col] === 'object' ? <code className="text-xs text-amber-400">{JSON.stringify(row[col]).slice(0, 60)}</code> :
                       String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <p className="text-xs text-gray-600 mt-2">{rows.length} rows (max 100)</p>
      )}
    </div>
  );
}

// ─── Audit Log Panel ──────────────────────────────────────────────────────────

function AuditLogPanel() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    supabase.from('operator_audit_log')
      .select('*, operator_users(email)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => setRows(data ?? []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-6 py-4 text-left">Time</th>
              <th className="px-6 py-4 text-left">Actor</th>
              <th className="px-6 py-4 text-left">Action</th>
              <th className="px-6 py-4 text-left">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-800/50">
                <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(r.created_at as string).toLocaleString()}
                </td>
                <td className="px-6 py-3 text-xs text-gray-400">
                  {(r.operator_users as { email: string } | null)?.email ?? '—'}
                </td>
                <td className="px-6 py-3">
                  <code className="text-xs text-red-400">{r.action as string}</code>
                </td>
                <td className="px-6 py-3 text-xs text-gray-500">
                  {r.target_type ? `${r.target_type} / ${String(r.target_id ?? '').slice(0, 8)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-6 py-10 text-center text-gray-600 text-sm">No audit entries yet.</div>
        )}
      </div>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading…</div>
    </div>
  );
}
