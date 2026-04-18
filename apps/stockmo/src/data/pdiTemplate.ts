// ─── PDI Checklist Template ────────────────────────────────────────────────────
// 25 items across 5 sections.
// 'na' state is NOT included — only pending, done, issue.

export interface CheckItem {
  item_id:  string;
  section:  string;
  name:     string;
  priority: 'high' | 'med' | 'low';
  state:    'pending' | 'done' | 'issue';
  note:     string;
}

export const PDI_TEMPLATE: Omit<CheckItem, 'state' | 'note'>[] = [
  // ── Exterior (7) ──────────────────────────────────────────────────────────
  { item_id: 'EXT-01', section: 'Exterior',   name: 'Body panel alignment and gaps',          priority: 'high' },
  { item_id: 'EXT-02', section: 'Exterior',   name: 'Paint surface condition (no scratches)', priority: 'high' },
  { item_id: 'EXT-03', section: 'Exterior',   name: 'Windshield and glass integrity',         priority: 'high' },
  { item_id: 'EXT-04', section: 'Exterior',   name: 'All exterior lights function',           priority: 'med'  },
  { item_id: 'EXT-05', section: 'Exterior',   name: 'Door seals and weatherstripping',        priority: 'med'  },
  { item_id: 'EXT-06', section: 'Exterior',   name: 'Wheels and tire condition',              priority: 'high' },
  { item_id: 'EXT-07', section: 'Exterior',   name: 'Wipers and washer nozzles',              priority: 'low'  },

  // ── Interior (7) ──────────────────────────────────────────────────────────
  { item_id: 'INT-01', section: 'Interior',   name: 'Dashboard and instrument cluster',       priority: 'high' },
  { item_id: 'INT-02', section: 'Interior',   name: 'All controls and switches operate',      priority: 'med'  },
  { item_id: 'INT-03', section: 'Interior',   name: 'Air conditioning (cooling + heating)',   priority: 'high' },
  { item_id: 'INT-04', section: 'Interior',   name: 'Seatbelts and airbag indicators',        priority: 'high' },
  { item_id: 'INT-05', section: 'Interior',   name: 'Seat adjustment and condition',          priority: 'med'  },
  { item_id: 'INT-06', section: 'Interior',   name: 'Interior trim and upholstery',           priority: 'low'  },
  { item_id: 'INT-07', section: 'Interior',   name: 'Infotainment system and Bluetooth',      priority: 'low'  },

  // ── Mechanical (6) ────────────────────────────────────────────────────────
  { item_id: 'MECH-01', section: 'Mechanical', name: 'Engine start and idle quality',         priority: 'high' },
  { item_id: 'MECH-02', section: 'Mechanical', name: 'Brake operation and pedal feel',        priority: 'high' },
  { item_id: 'MECH-03', section: 'Mechanical', name: 'Steering alignment',                    priority: 'high' },
  { item_id: 'MECH-04', section: 'Mechanical', name: 'Battery charge level',                  priority: 'med'  },
  { item_id: 'MECH-05', section: 'Mechanical', name: 'All fluid levels (oil, coolant, etc.)', priority: 'high' },
  { item_id: 'MECH-06', section: 'Mechanical', name: 'Exhaust condition',                     priority: 'med'  },

  // ── Electrical (2) ────────────────────────────────────────────────────────
  { item_id: 'ELEC-01', section: 'Electrical', name: 'All power windows operate',             priority: 'med'  },
  { item_id: 'ELEC-02', section: 'Electrical', name: 'Central locking and remote key',        priority: 'med'  },

  // ── Safety (3) ────────────────────────────────────────────────────────────
  { item_id: 'SAFE-01', section: 'Safety',    name: 'Warning lights clear on startup',        priority: 'high' },
  { item_id: 'SAFE-02', section: 'Safety',    name: 'Parking brake operation',                priority: 'high' },
  { item_id: 'SAFE-03', section: 'Safety',    name: 'Horn operation',                         priority: 'low'  },
];

/** Generate a fresh PDI checklist for a vehicle (all items pending). */
export function makePdiChecks(vehicleId: string): (CheckItem & { vehicle_id: string })[] {
  return PDI_TEMPLATE.map(item => ({
    vehicle_id: vehicleId,
    ...item,
    state: 'pending' as const,
    note:  '',
  }));
}
