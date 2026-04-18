// ─── Stock Maintenance Template ───────────────────────────────────────────────
// 12 recurring tasks generated when a vehicle enters the stockyard stage.
// next_due is calculated from today's date + freq_days.

export interface MaintTask {
  task_id:   string;
  name:      string;
  freq_days: number;
  priority:  'high' | 'med' | 'low';
  state:     'pending' | 'done' | 'issue';
  last_done: string | null;
  next_due:  string;
  note:      string;
}

const MAINT_TEMPLATE: Omit<MaintTask, 'state' | 'last_done' | 'next_due' | 'note'>[] = [
  { task_id: 'MAINT-01', name: 'Exterior wash',               freq_days:  7, priority: 'low'  },
  { task_id: 'MAINT-02', name: 'Interior cleaning',           freq_days:  7, priority: 'low'  },
  { task_id: 'MAINT-03', name: 'Tire pressure check',         freq_days: 14, priority: 'high' },
  { task_id: 'MAINT-04', name: 'Battery charge check',        freq_days: 14, priority: 'high' },
  { task_id: 'MAINT-05', name: 'Fluid levels check',          freq_days: 14, priority: 'high' },
  { task_id: 'MAINT-06', name: 'Start and run engine (5 min)',freq_days:  7, priority: 'high' },
  { task_id: 'MAINT-07', name: 'Brake system visual check',   freq_days: 30, priority: 'high' },
  { task_id: 'MAINT-08', name: 'AC system run test',          freq_days: 30, priority: 'med'  },
  { task_id: 'MAINT-09', name: 'Lights and electronics check',freq_days: 30, priority: 'med'  },
  { task_id: 'MAINT-10', name: 'Wiper condition check',       freq_days: 60, priority: 'low'  },
  { task_id: 'MAINT-11', name: 'Undercarriage inspection',    freq_days: 60, priority: 'med'  },
  { task_id: 'MAINT-12', name: 'Full detail and touch-up',    freq_days: 30, priority: 'low'  },
];

/** Add freq_days to a date string, return ISO date string. */
function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Generate a maintenance schedule for a vehicle entering stockyard. */
export function makeMaintTasks(vehicleId: string, startDate = new Date()): (MaintTask & { vehicle_id: string })[] {
  return MAINT_TEMPLATE.map(t => ({
    vehicle_id: vehicleId,
    ...t,
    state:     'pending' as const,
    last_done: null,
    next_due:  addDays(startDate, t.freq_days),
    note:      '',
  }));
}
