# StockMo — Vehicle Seed Data Reference

7 demo vehicles pre-loaded on first app launch. Designed to demonstrate every stage of the lifecycle pipeline simultaneously.

---

## Seed Vehicles Summary

| ID | Make / Model | Stage | Lot | Assigned | Scenario |
|----|-------------|-------|-----|----------|---------|
| STK-001 | 2024 Toyota Camry | Stockyard | B-01 | J. Ramirez | Healthy — passed PDI, in stock |
| STK-002 | 2023 Honda Accord | PDI | B-02 | M. Torres | PDI in progress — scuff found |
| STK-003 | 2024 Ford F-150 | Stockyard | B-03 | D. Kim | In stock — long time, maint overdue |
| STK-004 | 2022 BMW 3 Series | Hold | C-01 | A. Patel | PDI failure — scratch + paint mismatch |
| STK-005 | 2023 Mercedes C-Class | Ready | B-05 | J. Ramirez | Final inspection passed, dealer confirmed |
| STK-006 | 2024 Chevrolet Silverado | Stockyard | B-06 | R. Santos | New in stock, all clear |
| STK-007 | 2023 Audi A4 | Port | C-02 | Unassigned | Just arrived, nothing done yet |

---

## Why These 7?

These vehicles are chosen to demonstrate every pipeline state and common scenario:

- **Port** (STK-007) — shows a fresh arrival with no checklist started
- **PDI in progress with issue** (STK-002) — shows partial checklist and an issue flag
- **Hold** (STK-004) — shows the exception branch with critical PDI failures
- **Stockyard — healthy** (STK-001, STK-006) — shows normal state
- **Stockyard — maint overdue** (STK-003) — shows overdue maintenance alert (arrived Jan 15, many tasks past due by March)
- **Ready** (STK-005) — shows final inspection complete, dealer assigned, awaiting release
- *(Released can be added by the user via normal workflow)*

---

## Seed Data JavaScript

```javascript
const SEED = [
  {
    id: 'STK-001',
    vin: '4T1B11HK0JU000001',
    make: 'Toyota', model: 'Camry', year: 2024,
    color: 'Midnight Black', engine: '2.5L 4-cyl', fuel: 'Gasolina',
    lot: 'B-01', stage: 'stock',
    arrivalDate: '2025-02-01', pdiDate: '2025-02-02',
    stockDate: '2025-02-04',
    finalDate: null, releaseDate: null, dealer: null,
    assignedTech: 't1',
    pdiChecks:   PDI_ITEMS.map(i => ({ ...i, state: 'done',  note: '' })),
    stockMaint:  makeMaint('2025-02-04'),
    finalChecks: makeFinal(),
    history: [
      '2025-02-01: Dumating mula sa port — J. Ramirez',
      '2025-02-02: PDI pumasa — maayos — M. Torres',
      '2025-02-04: Inilipat sa stockyard B-01',
    ],
    notes: '',
  },
  {
    id: 'STK-002',
    vin: '1HGCV1F36NA000002',
    make: 'Honda', model: 'Accord', year: 2023,
    color: 'Lunar Silver', engine: '1.5L Turbo', fuel: 'Gasolina',
    lot: 'B-02', stage: 'pdi',
    arrivalDate: '2025-03-10', pdiDate: null,
    stockDate: null, finalDate: null, releaseDate: null, dealer: null,
    assignedTech: 't2',
    pdiChecks: PDI_ITEMS.map((i, x) => ({
      ...i,
      state: x < 8 ? 'done' : x === 9 ? 'issue' : 'pending',
      note:  x === 9 ? 'May kalmot sa B-pillar trim' : '',
    })),
    stockMaint:  [],
    finalChecks: makeFinal(),
    history: [
      '2025-03-10: Dumating — D. Kim',
      '2025-03-10: Sinimulan ang PDI — M. Torres',
    ],
    notes: 'May kalmot sa B-pillar',
  },
  {
    id: 'STK-003',
    vin: '1FTEW1EP0NFA00003',
    make: 'Ford', model: 'F-150', year: 2024,
    color: 'Agate Black', engine: '3.5L EcoBoost V6', fuel: 'Gasolina',
    lot: 'B-03', stage: 'stock',
    arrivalDate: '2025-01-15', pdiDate: '2025-01-16',
    stockDate: '2025-01-18',
    finalDate: null, releaseDate: null, dealer: null,
    assignedTech: 't3',
    pdiChecks:   PDI_ITEMS.map(i => ({ ...i, state: 'done', note: '' })),
    stockMaint:  makeMaint('2025-01-18'),  // Many tasks overdue by March 16
    finalChecks: makeFinal(),
    history: [
      '2025-01-15: Dumating',
      '2025-01-16: PDI maayos',
      '2025-01-18: Stockyard B-03',
    ],
    notes: '',
  },
  {
    id: 'STK-004',
    vin: 'WBA5A5C52MFU00004',
    make: 'BMW', model: '3 Series', year: 2022,
    color: 'Alpine White', engine: '2.0L TwinPwr', fuel: 'Gasolina',
    lot: 'C-01', stage: 'hold',
    arrivalDate: '2025-03-01', pdiDate: null,
    stockDate: null, finalDate: null, releaseDate: null, dealer: null,
    assignedTech: 't4',
    pdiChecks: PDI_ITEMS.map((i, x) => ({
      ...i,
      state: x === 0 || x === 1 ? 'issue' : 'pending',
      note:  x === 0 ? 'Malalim na kalmot sa L/R door' : x === 1 ? 'Hindi tugma ang kulay ng panel' : '',
    })),
    stockMaint:  [],
    finalChecks: makeFinal(),
    history: [
      '2025-03-01: Dumating',
      '2025-03-02: HOLD — PDI nabigo — A. Patel',
    ],
    notes: 'HOLD: kalmot at hindi tugma ang kulay. Kailangan ng ayos.',
  },
  {
    id: 'STK-005',
    vin: '55SWF4JB3NU000005',
    make: 'Mercedes', model: 'C-Class', year: 2023,
    color: 'Obsidian Black', engine: '2.0L Turbo', fuel: 'Gasolina',
    lot: 'B-05', stage: 'ready',
    arrivalDate: '2025-01-20', pdiDate: '2025-01-21',
    stockDate: '2025-01-23', finalDate: '2025-03-14',
    releaseDate: null, dealer: 'Apex Motors Makati',
    assignedTech: 't1',
    pdiChecks:   PDI_ITEMS.map(i  => ({ ...i, state: 'done', note: '' })),
    stockMaint:  makeMaint('2025-01-23'),
    finalChecks: FINAL_ITEMS.map(i => ({ ...i, state: 'done', note: '' })),
    history: [
      '2025-01-20: Dumating',
      '2025-01-21: PDI maayos',
      '2025-01-23: Stockyard',
      '2025-03-14: Final inspection pumasa — handa para sa Apex Makati',
    ],
    notes: 'Confirmed ang order ng dealer.',
  },
  {
    id: 'STK-006',
    vin: '3GCUYEED1PG000006',
    make: 'Chevrolet', model: 'Silverado', year: 2024,
    color: 'Red Hot', engine: '5.3L V8', fuel: 'Gasolina',
    lot: 'B-06', stage: 'stock',
    arrivalDate: '2025-02-10', pdiDate: '2025-02-11',
    stockDate: '2025-02-13',
    finalDate: null, releaseDate: null, dealer: null,
    assignedTech: 't5',
    pdiChecks:   PDI_ITEMS.map(i => ({ ...i, state: 'done', note: '' })),
    stockMaint:  makeMaint('2025-02-13'),
    finalChecks: makeFinal(),
    history: [
      '2025-02-10: Dumating',
      '2025-02-11: PDI maayos',
      '2025-02-13: Stockyard B-06',
    ],
    notes: '',
  },
  {
    id: 'STK-007',
    vin: 'WAUENAF44LA000007',
    make: 'Audi', model: 'A4', year: 2023,
    color: 'Navarra Blue', engine: '2.0L TFSI', fuel: 'Gasolina',
    lot: 'C-02', stage: 'port',
    arrivalDate: '2025-03-15', pdiDate: null,
    stockDate: null, finalDate: null, releaseDate: null, dealer: null,
    assignedTech: null,
    pdiChecks:   makePDI(),
    stockMaint:  [],
    finalChecks: makeFinal(),
    history: [
      '2025-03-15: Dumating mula sa port — R. Santos',
    ],
    notes: '',
  },
];
```

---

## Technician Roster (Static)

```javascript
const TECHS = [
  { id: 't1', name: 'J. Ramirez', ini: 'JR', role: 'Senior Tech',  color: '#f59e0b', online: true  },
  { id: 't2', name: 'M. Torres',  ini: 'MT', role: 'Tech II',      color: '#3b82f6', online: true  },
  { id: 't3', name: 'D. Kim',     ini: 'DK', role: 'Tech II',      color: '#8b5cf6', online: false },
  { id: 't4', name: 'A. Patel',   ini: 'AP', role: 'Tech I',       color: '#22c55e', online: true  },
  { id: 't5', name: 'R. Santos',  ini: 'RS', role: 'Tech I',       color: '#ef4444', online: false },
];
```

Color choices for technicians:
- Each tech gets a unique color used for their avatar and vehicle assignment highlights
- Colors are chosen to be visually distinct and accessible
- Colors do not overlap with stage colors to avoid confusion

---

## Reset / Reload Seed Data

To reset the app to its demo state (useful for testing):
```javascript
function resetToSeedData() {
  localStorage.removeItem('stockmo_v4');
  location.reload();
}
```

Or from the browser console: `localStorage.clear(); location.reload();`
