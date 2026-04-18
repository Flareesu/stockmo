import { useState, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAuth } from './hooks/useAuth';
import { getFeatureFlags, type FeatureFlags } from './lib/featureFlags';
import { hasMigrated, hasLocalData, migrateLocalStorageToSupabase } from './lib/migrateFromLocalStorage';
import { supabase } from './lib/supabase';

// ─── Pages ─────────────────────────────────────────────────────────────────────
import { AuthPage }            from './pages/AuthPage';
import { AddVehiclePage }      from './pages/AddVehiclePage';
import { ChecklistPage, type ChecklistType } from './pages/ChecklistPage';
import { RepairTablePage }     from './pages/RepairTablePage';
import { DropdownConfigPage }  from './pages/DropdownConfigPage';
import { ExportPage }          from './pages/ExportPage';
import { VehicleListPage }     from './pages/VehicleListPage';
import { VehicleDetailPage }   from './pages/VehicleDetailPage';
import { VehicleSelectorPage } from './pages/VehicleSelectorPage';

type Route =
  | { screen: 'auth' }
  | { screen: 'tech-dashboard' }
  | { screen: 'admin-dashboard' }
  | { screen: 'add-vehicle' }
  | { screen: 'vehicle-list' }
  | { screen: 'vehicle-detail'; vehicleId: string }
  | { screen: 'vehicle-select'; checklistType: ChecklistType }
  | { screen: 'checklist'; vehicleId: string; vehicleLabel: string; type: ChecklistType; readOnly?: boolean }
  | { screen: 'repairs' }
  | { screen: 'dropdown-config' }
  | { screen: 'export' }
  | { screen: 'suspended' };

export default function App() {
  const auth = useAuth();
  const [route, setRoute]                   = useState<Route>({ screen: 'auth' });
  const [flags, setFlags]                   = useState<FeatureFlags | null>(null);
  const [migrationPrompt, setMigrationPrompt] = useState(false);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) { setRoute({ screen: 'auth' }); return; }

    getFeatureFlags().then(({ flags: f, suspended }) => {
      setFlags(f);
      if (suspended) { setRoute({ screen: 'suspended' }); return; }
      if (!hasMigrated() && hasLocalData()) setMigrationPrompt(true);
      setRoute(auth.role === 'admin' ? { screen: 'admin-dashboard' } : { screen: 'tech-dashboard' });
    });
  }, [auth.user, auth.loading, auth.role]);

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-[#8A8FA3] text-sm">Loading…</div>
      </div>
    );
  }

  if (route.screen === 'suspended') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6 text-center">
        <span className="material-symbols-outlined text-5xl text-[#D0112B] mb-4">block</span>
        <h1 className="text-xl font-bold text-[#1A1A2E] mb-2">Account Suspended</h1>
        <p className="text-sm text-[#8A8FA3]">
          This account has been suspended. Please contact your system administrator.
        </p>
      </div>
    );
  }

  if (route.screen === 'auth') return <AuthPage />;

  const goToDashboard = () =>
    setRoute(auth.role === 'admin' ? { screen: 'admin-dashboard' } : { screen: 'tech-dashboard' });

  // ── Sub-screens ────────────────────────────────────────────────────────────
  if (route.screen === 'add-vehicle')
    return <AddVehiclePage onBack={() => setRoute({ screen: 'vehicle-list' })} onSuccess={() => setRoute({ screen: 'vehicle-list' })} />;

  if (route.screen === 'vehicle-list')
    return (
      <VehicleListPage
        onBack={goToDashboard}
        onAdd={() => setRoute({ screen: 'add-vehicle' })}
        onSelect={(vehicleId) => setRoute({ screen: 'vehicle-detail', vehicleId })}
      />
    );

  if (route.screen === 'vehicle-detail')
    return (
      <VehicleDetailPage
        vehicleId={route.vehicleId}
        isAdmin={auth.role === 'admin'}
        onBack={() => setRoute(auth.role === 'admin' ? { screen: 'vehicle-list' } : { screen: 'tech-dashboard' })}
        onOpenChecklist={(type, vehicleLabel) => setRoute({
          screen:       'checklist',
          vehicleId:    route.vehicleId,
          vehicleLabel,
          type,
          readOnly:     auth.role === 'admin',
        })}
      />
    );

  if (route.screen === 'vehicle-select')
    return (
      <VehicleSelectorPage
        checklistType={route.checklistType}
        onBack={() => setRoute({ screen: 'tech-dashboard' })}
        onSelect={(vehicleId, vehicleLabel) => setRoute({
          screen: 'checklist', vehicleId, vehicleLabel, type: route.checklistType,
        })}
      />
    );

  if (route.screen === 'checklist')
    return <ChecklistPage {...route} onBack={() => history.length > 1 ? history.back() : goToDashboard()} />;

  if (route.screen === 'repairs')
    return <RepairTablePage onBack={goToDashboard} />;

  if (route.screen === 'dropdown-config')
    return <DropdownConfigPage onBack={goToDashboard} />;

  if (route.screen === 'export')
    return <ExportPage onBack={goToDashboard} />;

  // ── Dashboards ─────────────────────────────────────────────────────────────
  return (
    <>
      {migrationPrompt && (
        <MigrationPrompt
          onAccept={async () => { setMigrationPrompt(false); await migrateLocalStorageToSupabase(); }}
          onDismiss={() => setMigrationPrompt(false)}
        />
      )}

      {route.screen === 'admin-dashboard' && (
        <AdminDashboard
          flags={flags}
          onNavigate={setRoute}
          onSignOut={auth.signOut}
        />
      )}

      {route.screen === 'tech-dashboard' && (
        <TechDashboard
          techName={auth.techProfile?.name ?? auth.user?.email ?? 'Technician'}
          flags={flags}
          onNavigate={setRoute}
          onSignOut={auth.signOut}
        />
      )}
      <SpeedInsights />
    </>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

interface AlertRow {
  id:           string;
  vehicle_id:   string;
  source:       string;
  check_name:   string;
  note:         string | null;
  created_at:   string;
}

function AdminDashboard({ flags, onNavigate, onSignOut }: {
  flags:      FeatureFlags | null;
  onNavigate: (r: Route) => void;
  onSignOut:  () => void;
}) {
  const [tab, setTab]         = useState<'fleet' | 'alerts' | 'settings'>('fleet');
  const [alerts, setAlerts]   = useState<AlertRow[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'alerts') return;
    setAlertsLoading(true);
    supabase
      .from('admin_alerts')
      .select('id, vehicle_id, source, check_name, note, created_at')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAlerts((data as AlertRow[]) ?? []);
        setAlertsLoading(false);
      });
  }, [tab]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Header */}
      <div className="bg-[#D0112B] px-6 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-70 uppercase tracking-widest">Administrator</p>
            <h1 className="text-2xl font-bold mt-0.5">StockMo</h1>
          </div>
          <button onClick={onSignOut} className="opacity-70">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {/* Fleet tab */}
        {tab === 'fleet' && (
          <>
            <NavCard
              icon="garage"
              label="Fleet"
              color="#D0112B"
              onClick={() => onNavigate({ screen: 'vehicle-list' })}
              wide
            />
            <div className="grid grid-cols-2 gap-3">
              <NavCard
                icon="add_circle"
                label="Add Vehicle"
                color="#1A1A2E"
                onClick={() => onNavigate({ screen: 'add-vehicle' })}
              />
              <NavCard
                icon="report_problem"
                label="Repairs"
                color="#D0112B"
                onClick={() => onNavigate({ screen: 'repairs' })}
              />
            </div>
            {flags?.export_reports && (
              <NavCard
                icon="download"
                label="Export Reports"
                color="#8A8FA3"
                onClick={() => onNavigate({ screen: 'export' })}
                wide
              />
            )}
          </>
        )}

        {/* Alerts tab */}
        {tab === 'alerts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#8A8FA3] uppercase tracking-wide">
                Open Issues
              </p>
              <button
                onClick={() => onNavigate({ screen: 'repairs' })}
                className="text-xs text-[#D0112B] font-semibold"
              >
                View Repairs →
              </button>
            </div>

            {alertsLoading ? (
              <div className="flex justify-center py-10">
                <span className="text-[#8A8FA3] text-sm">Loading…</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <span className="material-symbols-outlined text-[#C4C7D0] text-5xl">check_circle</span>
                <p className="text-[#8A8FA3] text-sm">No open issues.</p>
              </div>
            ) : (
              alerts.map(alert => (
                <button
                  key={alert.id}
                  onClick={() => onNavigate({ screen: 'vehicle-detail', vehicleId: alert.vehicle_id })}
                  className="w-full bg-white rounded-[20px] p-4 shadow-sm text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-[#1A1A2E]">{alert.vehicle_id}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#D0112B] flex-shrink-0 capitalize">
                      {alert.source}
                    </span>
                  </div>
                  <p className="text-sm text-[#1A1A2E]">{alert.check_name}</p>
                  {alert.note && (
                    <p className="text-xs text-[#8A8FA3] mt-0.5 truncate">{alert.note}</p>
                  )}
                  <p className="text-[10px] text-[#C4C7D0] mt-1.5">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div className="space-y-3">
            {flags?.dropdown_config && (
              <SettingsRow
                icon="tune"
                label="Vehicle Form Options"
                sub="Configure model, color, engine, fuel dropdowns"
                onClick={() => onNavigate({ screen: 'dropdown-config' })}
              />
            )}
            <SettingsRow
              icon="logout"
              label="Sign Out"
              sub="Log out of administrator account"
              onClick={onSignOut}
            />
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="bg-white border-t border-[#E8E8EE] flex flex-shrink-0">
        {([
          { key: 'fleet',    icon: 'garage',         label: 'Fleet' },
          { key: 'alerts',   icon: 'notifications',  label: 'Alerts' },
          { key: 'settings', icon: 'settings',       label: 'Settings' },
        ] as const).map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium gap-1 ${
              tab === key ? 'text-[#D0112B]' : 'text-[#8A8FA3]'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tech Dashboard ───────────────────────────────────────────────────────────

function TechDashboard({ techName, flags, onNavigate, onSignOut }: {
  techName:   string;
  flags:      FeatureFlags | null;
  onNavigate: (r: Route) => void;
  onSignOut:  () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-[#1A1A2E] px-6 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-60 uppercase tracking-widest">Technician</p>
            <h1 className="text-xl font-bold mt-0.5">Hi, {techName.split(' ')[0]}</h1>
          </div>
          <button onClick={onSignOut} className="opacity-60">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        <p className="text-xs font-semibold text-[#8A8FA3] uppercase tracking-wide">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          <NavCard
            icon="fact_check"
            label="PDI"
            color="#D0112B"
            onClick={() => onNavigate({ screen: 'vehicle-select', checklistType: 'pdi' })}
          />
          <NavCard
            icon="build"
            label="Maintenance"
            color="#1A1A2E"
            onClick={() => onNavigate({ screen: 'vehicle-select', checklistType: 'stockyard' })}
          />
          <NavCard
            icon="verified"
            label="Final Check"
            color="#2D9E5F"
            onClick={() => onNavigate({ screen: 'vehicle-select', checklistType: 'final' })}
          />
          {flags?.stockyard_location && (
            <NavCard
              icon="location_on"
              label="All Vehicles"
              color="#8A8FA3"
              onClick={() => onNavigate({ screen: 'vehicle-list' })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function NavCard({ icon, label, color, onClick, wide }: {
  icon: string; label: string; color: string; onClick: () => void; wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{ borderTopColor: color }}
      className={`bg-white rounded-[20px] p-4 text-left shadow-sm border-t-4 active:scale-95 transition-transform ${wide ? 'col-span-2' : ''}`}
    >
      <span className="material-symbols-outlined text-2xl" style={{ color }}>{icon}</span>
      <p className="text-sm font-bold text-[#1A1A2E] mt-2">{label}</p>
    </button>
  );
}

function SettingsRow({ icon, label, sub, onClick }: {
  icon: string; label: string; sub: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-[20px] px-4 py-4 flex items-center gap-4 shadow-sm text-left"
    >
      <span className="material-symbols-outlined text-[#D0112B] text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-[#1A1A2E]">{label}</p>
        <p className="text-xs text-[#8A8FA3]">{sub}</p>
      </div>
      <span className="material-symbols-outlined text-[#C4C7D0] text-lg">chevron_right</span>
    </button>
  );
}

// ─── Migration Prompt ─────────────────────────────────────────────────────────

function MigrationPrompt({ onAccept, onDismiss }: { onAccept: () => void; onDismiss: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-[24px] p-6">
        <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Import Local Data?</h2>
        <p className="text-sm text-[#8A8FA3] mb-4">
          We found existing vehicle data saved on this device. Import it to your cloud account?
        </p>
        <div className="flex gap-3">
          <button
            onClick={async () => { setLoading(true); await onAccept(); }}
            disabled={loading}
            className="flex-1 bg-[#D0112B] text-white rounded-full py-3 font-semibold text-sm disabled:opacity-50"
          >
            {loading ? 'Importing…' : 'Import Data'}
          </button>
          <button onClick={onDismiss} className="px-6 py-3 text-[#8A8FA3] text-sm font-semibold">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
