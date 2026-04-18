# StockMo — Technical Architecture

## Overview

StockMo is a **zero-dependency, single-file web application**. The entire system — UI, logic, data, and translations — lives in one `.html` file. No server, no build step, no install, no network required.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer — UI Views                          │
│  Home · Stock · Maint · Final · Detail · Admin · Wizard │
├─────────────────────────────────────────────────────────┤
│  Language Layer — Bilingual Engine                      │
│  T{} object · setLang() · data-k attribute re-render    │
├─────────────────────────────────────────────────────────┤
│  Lifecycle State Machine                                │
│  port → pdi → stock → ready → released · hold branch   │
├─────────────────────────────────────────────────────────┤
│  Checklist Engines (3 independent)                      │
│  PDI Engine · Maintenance Scheduler · Final Engine      │
├─────────────────────────────────────────────────────────┤
│  App Logic Layer — JavaScript                           │
│  Date math · Stage router · Render engine · Auto-save   │
├─────────────────────────────────────────────────────────┤
│  Data Layer — localStorage                              │
│  Key: stockmo_v4 · Full vehicle array serialized JSON   │
├─────────────────────────────────────────────────────────┤
│  Device Layer — Phone Hardware                          │
│  Browser engine · System fonts · Touch input            │
└─────────────────────────────────────────────────────────┘
```

---

## Key Functions

### Data
| Function | Purpose |
|----------|---------|
| `loadCars()` | Read from localStorage, fall back to SEED data |
| `saveCars(arr)` | Write full cars array to localStorage as JSON |
| `makePDI()` | Generate fresh PDI checklist from PDI_ITEMS template |
| `makeMaint(date)` | Generate maintenance schedule from arrival date |
| `makeFinal()` | Generate fresh final inspection checklist |

### Date Engine
| Function | Purpose |
|----------|---------|
| `dAgo(date)` | Days elapsed since a date (positive = past) |
| `addD(date, n)` | Add n days to a date string, return ISO string |
| `todayS()` | Return today's date as ISO string (YYYY-MM-DD) |

### Lifecycle
| Function | Purpose |
|----------|---------|
| `advStage(id, newStage)` | Advance a vehicle to a new stage, log the transition |
| `releaseCar(id)` | Final release with dealer name, sets stage to 'released' |
| `hasMaintDue(car)` | Returns true if any maintenance task is overdue |

### UI
| Function | Purpose |
|----------|---------|
| `nav(page)` | Switch active page, trigger re-render |
| `renderHome()` | Render dashboard: pipeline, stats, attention list, log |
| `renderStock()` | Render filtered inventory list |
| `renderMaint()` | Render stockyard vehicles sorted by overdue count |
| `renderFinal()` | Render ready-stage vehicles for final inspection |
| `openDetail(id)` | Open detail panel for a vehicle |
| `renderDetail(car)` | Render all detail tabs for a car object |
| `updBadges()` | Update all topbar pills and nav badges |

### Admin
| Function | Purpose |
|----------|---------|
| `openAdmin()` | Render and open admin panel |
| `renderAdminBody()` | Build admin HTML: stats, stages, roster, holds, assign, log |
| `adminAssign()` | Assign selected tech to selected car, log it |

### Wizard
| Function | Purpose |
|----------|---------|
| `openWizard()` | Reset wizard state, open overlay |
| `renderWiz()` | Render current wizard step |
| `wizNext()` | Validate current step, collect data, advance |
| `wizBack()` | Go to previous step |
| `wizConfirm()` | Build car object, push to cars[], save, close |
| `wizToggle(idx)` | Cycle a PDI item state during wizard |
| `wizSelTech(id)` | Select a technician in wizard step 3 |

### Language
| Function | Purpose |
|----------|---------|
| `setLang(l)` | Set lang variable, re-render all `data-k` elements, re-render active views |
| `t(key)` | Return translated string for current language |
| `stageLabel(s)` | Return translated stage name for stage code |

---

## Data Flow

```
User action (tap)
      ↓
Event handler (onclick / oninput)
      ↓
Modify cars[] in memory
      ↓
saveCars(cars) → localStorage
      ↓
Re-render affected view (renderHome / renderDetail / etc.)
      ↓
DOM updated
```

---

## Storage Schema

**Key:** `stockmo_v4`  
**Value:** `JSON.stringify(cars[])` — full array of vehicle objects

Version key in storage name allows future migrations (`v5`, `v6`) without corrupting old data.

---

## File Size Budget

| Component | Estimated Size |
|-----------|---------------|
| HTML structure | ~5KB |
| CSS | ~15KB |
| JavaScript | ~25KB |
| Translation strings | ~8KB |
| Seed data | ~6KB |
| **Total** | **~60KB** |

A 60KB single file loads in under 1 second on 3G. No external requests means no additional load time regardless of network.

---

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome for Android 60+ | ✅ Full support |
| Samsung Internet 8+ | ✅ Full support |
| Firefox for Android | ✅ Full support |
| Safari (iOS 13+) | ✅ Full support |
| Chrome for iOS | ✅ Full support |
| IE / Legacy Edge | ✗ Not supported (no need) |

---

## Security Considerations

- No authentication required (by design — yard context)
- No data transmitted over network (no exfiltration risk)
- localStorage is device-local (no cross-device data leak)
- No user-generated HTML rendered as HTML (text content only)
- VIN input is sanitized: uppercase, alphanumeric only, 17-char max
