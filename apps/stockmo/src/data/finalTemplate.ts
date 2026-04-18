// ─── Final Inspection Template ────────────────────────────────────────────────
// 14 items across 3 sections.
// 'na' state is NOT included — only pending, done, issue.

export interface FinalItem {
  item_id:  string;
  section:  string;
  name:     string;
  priority: 'high' | 'med' | 'low';
  state:    'pending' | 'done' | 'issue';
  note:     string;
}

export const FINAL_TEMPLATE: Omit<FinalItem, 'state' | 'note'>[] = [
  // ── Pre-Delivery (5) ──────────────────────────────────────────────────────
  { item_id: 'FIN-01', section: 'Pre-Delivery', name: 'Full exterior wash and polish',       priority: 'high' },
  { item_id: 'FIN-02', section: 'Pre-Delivery', name: 'Interior vacuum and wipe-down',       priority: 'high' },
  { item_id: 'FIN-03', section: 'Pre-Delivery', name: 'Fuel level minimum 3/4 tank',         priority: 'high' },
  { item_id: 'FIN-04', section: 'Pre-Delivery', name: 'Tire pressure set to spec',           priority: 'high' },
  { item_id: 'FIN-05', section: 'Pre-Delivery', name: 'All accessories installed',           priority: 'med'  },

  // ── Documentation (4) ─────────────────────────────────────────────────────
  { item_id: 'DOC-01', section: 'Documentation', name: "Owner's manual present",             priority: 'high' },
  { item_id: 'DOC-02', section: 'Documentation', name: 'Service schedule booklet',           priority: 'med'  },
  { item_id: 'DOC-03', section: 'Documentation', name: 'All keys and key cards accounted for', priority: 'high' },
  { item_id: 'DOC-04', section: 'Documentation', name: 'Registration documents',             priority: 'high' },

  // ── Handover (5) ──────────────────────────────────────────────────────────
  { item_id: 'HND-01', section: 'Handover', name: 'VIN verified against documents',          priority: 'high' },
  { item_id: 'HND-02', section: 'Handover', name: 'Dealer inspection sign-off',              priority: 'high' },
  { item_id: 'HND-03', section: 'Handover', name: 'Customer walkthrough completed',          priority: 'med'  },
  { item_id: 'HND-04', section: 'Handover', name: 'PDI checklist attached',                  priority: 'high' },
  { item_id: 'HND-05', section: 'Handover', name: 'Final photos taken',                      priority: 'low'  },
];

/** Generate a fresh final checklist for a vehicle (all items pending). */
export function makeFinalChecks(vehicleId: string): (FinalItem & { vehicle_id: string })[] {
  return FINAL_TEMPLATE.map(item => ({
    vehicle_id: vehicleId,
    ...item,
    state: 'pending' as const,
    note:  '',
  }));
}
