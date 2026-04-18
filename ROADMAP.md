# StockMo — Product Roadmap

## Status Key
- ✅ **Built** — Live in current version
- 🔜 **Next Up** — High value, fits current architecture
- 🔵 **Future** — Larger scope, needs planning
- ⚙️ **Infrastructure** — Technical foundation for other features

---

## Core Inventory & Tracking

| Feature | Status | Notes |
|---------|--------|-------|
| Vehicle inventory grid with status stripes | ✅ Built | |
| Stock ID & lot position tracking | ✅ Built | |
| VIN entry & validation | ✅ Built | 17-char, no duplicates |
| Add vehicle 4-step guided wizard | ✅ Built | |
| Status management (stage pipeline) | ✅ Built | 5 stages + Hold |
| Search inventory | 🔜 Next Up | Real-time filter by ID/make/model |
| Edit existing vehicle specs | 🔜 Next Up | Tap-to-edit any field |
| Delete / archive vehicle | 🔜 Next Up | With confirmation |
| Bulk status update | 🔵 Future | Select multiple, update all |

---

## Maintenance & Service

| Feature | Status | Notes |
|---------|--------|-------|
| Per-vehicle maintenance schedule (9 tasks) | ✅ Built | |
| Frequency-based next-due calculation | ✅ Built | |
| Overdue alert on home screen | ✅ Built | |
| DONE tap resets next-due date | ✅ Built | |
| Maintenance logged to vehicle history | ✅ Built | |
| Custom checklist items | 🔜 Next Up | Supervisor adds dealer-specific tasks |
| Parts & labor log per task | 🔜 Next Up | What was used, time spent |
| Service due date notifications | 🔵 Future | Requires PWA + notifications permission |
| Recurring task auto-reset engine | ⚙️ Infra | Background calculation on app open |

---

## PDI & Inspection

| Feature | Status | Notes |
|---------|--------|-------|
| 18-item PDI checklist (Tagalog) | ✅ Built | |
| 12-item final inspection checklist | ✅ Built | |
| 4-state tap cycle (pending/done/issue/na) | ✅ Built | |
| Issue note field | ✅ Built | Opens on issue state |
| Hold stage on PDI failure | ✅ Built | Auto-recommended if issues found |
| Resume PDI after repair | ✅ Built | |
| Photo attachment to PDI item | 🔜 Next Up | Camera capture, stored as base64 |
| Damage location marker on car diagram | 🔜 Next Up | Tap SVG car outline to pin damage |

---

## 3D Vehicle Viewer

| Feature | Status | Notes |
|---------|--------|-------|
| SVG side/front/top schematic views | ✅ Built | |
| Vehicle type detection (sedan/SUV/truck) | ✅ Built | |
| Make-based color rendering | ✅ Built | |
| True Three.js 3D model | 🔵 Future | WebGL per vehicle type |
| Color preview matching stock color | 🔵 Future | Requires color-to-hex mapping |

---

## Admin Panel

| Feature | Status | Notes |
|---------|--------|-------|
| Fleet stats dashboard (4 stat cards) | ✅ Built | |
| Stage breakdown bar chart | ✅ Built | |
| Technician roster with online status | ✅ Built | |
| Hold vehicles alert section | ✅ Built | |
| Assign technician to vehicle | ✅ Built | |
| Audit log (all vehicle history) | ✅ Built | |
| Technician login / PIN profiles | 🔵 Future | Each tech logs in, actions attributed |
| Role-based permissions | 🔵 Future | Senior vs junior capabilities |
| Supervisor read-only dashboard | 🔵 Future | View-only mode for managers |

---

## Offline & Mobile

| Feature | Status | Notes |
|---------|--------|-------|
| localStorage offline persistence | ✅ Built | |
| Single .html file deployment | ✅ Built | |
| System fonts (no CDN) | ✅ Built | |
| 52px minimum tap targets | ✅ Built | |
| Bottom navigation | ✅ Built | |
| Slide-up sheet panels | ✅ Built | |
| Tagalog / English toggle | ✅ Built | |
| numeric inputmode on number fields | ✅ Built | |
| PWA manifest + Add to Home Screen | 🔜 Next Up | manifest.json + service worker |
| Service Worker offline cache | ⚙️ Infra | App shell cached for airplane mode |
| VIN barcode camera scanner | 🔜 Next Up | `<input capture>` + camera API |
| Photo capture per vehicle | 🔜 Next Up | base64 stored in vehicle object |
| IndexedDB upgrade | ⚙️ Infra | For fleets 200+ vehicles |
| Haptic feedback on actions | 🔵 Future | `navigator.vibrate()` on state change |

---

## Data Transfer & Sync

| Feature | Status | Notes |
|---------|--------|-------|
| JSON export / backup | 🔜 Next Up | Download full fleet as .json |
| QR code sync between phones | 🔜 Next Up | No WiFi needed |
| Plain text shift report (SMS) | 🔜 Next Up | Web Share API |
| CSV import from dealer management system | 🔵 Future | Bulk upload from Excel |
| Real-time WiFi sync (optional) | 🔵 Future | When network available |

---

## Infrastructure

| Feature | Status | Notes |
|---------|--------|-------|
| Storage version key (v4) | ✅ Built | Enables safe migrations |
| Seed data on first load | ✅ Built | 7 demo vehicles |
| Data schema documentation | ✅ Built | |
| PWA service worker | ⚙️ Infra | App shell caching |
| IndexedDB adapter | ⚙️ Infra | Replace localStorage for scale |
| Schema migration engine | ⚙️ Infra | v4 → v5 migration function |
| QR diff sync protocol | ⚙️ Infra | Only transmit changed records |

---

## Recommended Build Order (Next Sprint)

1. **PWA install** — manifest.json + service worker (1 day)
2. **VIN barcode scanner** — camera input for fast registration (1 day)
3. **Photo attachment** — capture damage photos per PDI item (2 days)
4. **JSON export / QR sync** — backup and multi-device transfer (2 days)
5. **Edit vehicle** — tap-to-edit any field (1 day)
6. **Shift report** — one-tap SMS summary (0.5 days)
7. **Search inventory** — real-time filter by any field (0.5 days)
