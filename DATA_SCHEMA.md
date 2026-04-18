# StockMo — Data Schema

## Vehicle Object

Every vehicle in the system is represented by a single flat object. The full array is serialized to `localStorage` on every save.

```javascript
{
  // Identity
  id:           String,   // "STK-001" — auto-generated sequential
  vin:          String,   // "4T1B11HK0JU000001" — 17-char, uppercase
  make:         String,   // "Toyota"
  model:        String,   // "Camry"
  year:         Number,   // 2024
  color:        String,   // "Midnight Black"
  engine:       String,   // "2.5L 4-cyl"
  fuel:         String,   // "Gasolina" | "Diesel" | "Hybrid" | "Electric"

  // Location
  lot:          String,   // "B-01" | "C-04" | "TBD"

  // Lifecycle
  stage:        String,   // "port" | "pdi" | "stock" | "ready" | "released" | "hold"
  arrivalDate:  String,   // "2025-03-16" — ISO date string
  pdiDate:      String | null,
  stockDate:    String | null,
  finalDate:    String | null,
  releaseDate:  String | null,
  dealer:       String | null,   // Dealer name on release

  // Assignment
  assignedTech: String | null,  // Tech ID: "t1" | "t2" etc.

  // PDI Checklist — array of CheckItem
  pdiChecks:    CheckItem[],

  // Stockyard Maintenance — array of MaintTask
  stockMaint:   MaintTask[],

  // Final Inspection — array of CheckItem
  finalChecks:  CheckItem[],

  // Activity
  history:      String[],  // ["2025-03-16: Dumating mula sa port — J. Ramirez"]
  notes:        String,    // Free-text technician notes
}
```

---

## CheckItem Object

Used for both `pdiChecks` and `finalChecks`.

```javascript
{
  id:       String,   // "p1" | "f1" etc.
  section:  String,   // "Panlabas" | "Loob" | "Mekanikal" | "Dokumento"
  name:     String,   // Checklist item name (Tagalog in current build)
  priority: String,   // "high" | "med" | "low"
  state:    String,   // "pending" | "done" | "issue" | "na"
  note:     String,   // Tech note on issue (empty string if no issue)
}
```

**State transitions:** `pending → done → issue → na → pending` (cyclic tap)

---

## MaintTask Object

Used in `stockMaint`. Generated from `STOCK_MAINT` template on stockyard entry.

```javascript
{
  id:       String,   // "sm1" | "sm2" etc.
  name:     String,   // Task name (Tagalog)
  freq:     Number,   // Days between required completions (7 | 14 | 30 | 60)
  priority: String,   // "high" | "med" | "low"
  lastDone: String,   // ISO date of last completion
  nextDue:  String,   // ISO date of next required completion (lastDone + freq)
  note:     String,   // Optional tech note
}
```

**Overdue check:** `dAgo(task.nextDue) >= 0` → task is overdue

---

## Technician Object (static, not persisted)

```javascript
{
  id:     String,   // "t1" through "t5"
  name:   String,   // "J. Ramirez"
  ini:    String,   // "JR" — avatar initials
  role:   String,   // "Senior Tech" | "Tech II" | "Tech I"
  color:  String,   // Hex color for avatar and highlights
  online: Boolean,  // Current shift status (static in v1)
}
```

---

## PDI Items Template

18 items, always in the same order. Used to generate `pdiChecks` for new vehicles.

| ID | Section | Priority |
|----|---------|----------|
| p1 | Panlabas | high |
| p2 | Panlabas | high |
| p3 | Panlabas | high |
| p4 | Panlabas | med |
| p5 | Panlabas | med |
| p6 (id: 'Loob') | Loob | high |
| p7 | Loob | med |
| p8 | Loob | med |
| p9 | Loob | high |
| p10 | Loob | med |
| p11 | Mekanikal | high |
| p12 | Mekanikal | high |
| p13 | Mekanikal | high |
| p14 | Mekanikal | high |
| p15 | Mekanikal | med |
| p16 | Dokumento | med |
| p17 | Dokumento | high |
| p18 | Dokumento | high |

---

## Maintenance Schedule Template

9 tasks. Generated from `stockDate` (the date the vehicle entered the stockyard).

| ID | Frequency (days) | Priority |
|----|-----------------|----------|
| sm1 | 7 | high |
| sm2 | 30 | high |
| sm3 | 30 | high |
| sm4 | 14 | med |
| sm5 | 14 | low |
| sm6 | 30 | low |
| sm7 | 60 | med |
| sm8 | 60 | med |
| sm9 | 30 | med |

---

## Storage Key Versioning

| Version | Key | Notes |
|---------|-----|-------|
| v1 | `stockmo_v1` | Original desktop app |
| v2 | `stockmo_v2` | Mobile rebuild |
| v3 | `stockmo_lifecycle_v2` | Lifecycle pipeline added |
| v4 | `stockmo_v4` | Tagalog + admin panel, current |

Incrementing the version key on breaking schema changes prevents old data from breaking new code.

---

## Migration Strategy (v4 → v5)

When the schema changes:
1. Try loading from new key (`stockmo_v5`)
2. If not found, try loading from old key (`stockmo_v4`)
3. If found, migrate: add missing fields with defaults, save to new key
4. If neither found, use SEED data

```javascript
function loadCars() {
  const newData = localStorage.getItem('stockmo_v5');
  if (newData) return JSON.parse(newData);

  const oldData = localStorage.getItem('stockmo_v4');
  if (oldData) {
    const migrated = migrateV4toV5(JSON.parse(oldData));
    saveCars(migrated);
    return migrated;
  }

  saveCars(SEED);
  return JSON.parse(JSON.stringify(SEED));
}
```
