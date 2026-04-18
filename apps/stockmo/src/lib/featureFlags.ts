import { OPERATOR_FUNCTIONS_URL, CLIENT_SLUG, CLIENT_API_KEY } from './supabase';

// ─── Feature Flag Client ───────────────────────────────────────────────────────
// Fetches resolved flags from the operator get-flags Edge Function.
// Caches in localStorage for 5 minutes.
// Falls back to stale cache if operator is unreachable (soft dependency).

const FLAGS_CACHE_KEY = 'stockmo_flags_cache_v1';
const FLAGS_TTL_MS    = 5 * 60 * 1000; // 5 minutes

export interface FeatureFlags {
  offline_sync_v2:    boolean;
  photo_capture:      boolean;
  export_reports:     boolean;
  repair_table:       boolean;
  stockyard_location: boolean;
  dropdown_config:    boolean;
  [key: string]: boolean;
}

interface FlagsCache {
  flags: FeatureFlags;
  fetched_at: number;
  suspended?: boolean;
}

const SAFE_DEFAULTS: FeatureFlags = {
  offline_sync_v2:    false,
  photo_capture:      true,
  export_reports:     true,
  repair_table:       true,
  stockyard_location: true,
  dropdown_config:    true,
};

function readCache(): FlagsCache | null {
  try {
    const raw = localStorage.getItem(FLAGS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(flags: FeatureFlags, suspended = false): void {
  try {
    localStorage.setItem(FLAGS_CACHE_KEY, JSON.stringify({
      flags,
      fetched_at: Date.now(),
      suspended,
    }));
  } catch { /* storage full — ignore */ }
}

export async function getFeatureFlags(): Promise<{ flags: FeatureFlags; suspended: boolean }> {
  // Return valid cache if fresh
  const cached = readCache();
  if (cached && Date.now() - cached.fetched_at < FLAGS_TTL_MS) {
    return { flags: cached.flags, suspended: cached.suspended ?? false };
  }

  // No operator URL configured — return safe defaults
  if (!OPERATOR_FUNCTIONS_URL || !CLIENT_SLUG || !CLIENT_API_KEY) {
    return { flags: SAFE_DEFAULTS, suspended: false };
  }

  try {
    const res = await fetch(`${OPERATOR_FUNCTIONS_URL}/get-flags`, {
      method: 'GET',
      headers: {
        'Content-Type':          'application/json',
        'X-StockMo-Client-Key':  CLIENT_API_KEY,
        'X-StockMo-Client-Slug': CLIENT_SLUG,
      },
      signal: AbortSignal.timeout(3000), // 3-second timeout
    });

    if (!res.ok) throw new Error(`Flag fetch HTTP ${res.status}`);

    const { flags, suspended } = await res.json();
    const merged = { ...SAFE_DEFAULTS, ...flags } as FeatureFlags;
    writeCache(merged, suspended);
    return { flags: merged, suspended: suspended ?? false };

  } catch {
    // Operator unreachable — serve stale cache or safe defaults
    if (cached) {
      return { flags: cached.flags, suspended: cached.suspended ?? false };
    }
    return { flags: SAFE_DEFAULTS, suspended: false };
  }
}

export function getCachedFlag(key: keyof FeatureFlags): boolean {
  const cached = readCache();
  if (cached) return cached.flags[key] ?? SAFE_DEFAULTS[key] ?? false;
  return SAFE_DEFAULTS[key] ?? false;
}
