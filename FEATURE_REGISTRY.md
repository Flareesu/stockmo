# StockMo — Feature Registry

Complete record of all features across all categories.  
Status: ✅ Built | 🔜 Next Up | 🔵 Future | ⚙️ Infrastructure

---

## 1. Core Inventory & Tracking (13 features)

| Feature | Status | Description |
|---------|--------|-------------|
| Vehicle inventory grid | ✅ | Card list with color-coded status stripes and flag indicators |
| Stock ID & lot position | ✅ | Unique ID (STK-001) and physical lot coordinate (B-01) |
| Add vehicle wizard (4-step) | ✅ | Guided: Port Arrival → PDI → Assign → Confirm |
| Stage pipeline (5 stages + Hold) | ✅ | Port → PDI → Stockyard → Ready → Released |
| VIN entry & validation | ✅ | 17-char, uppercase, no duplicate detection |
| Filter inventory by stage | ✅ | Filter chips: All / Port / PDI / Stock / Ready / Hold / Released |
| Technician assignment | ✅ | Dropdown in detail panel and admin panel |
| Odometer / days-in-stage tracking | ✅ | Days since stockDate shown on vehicle detail |
| Active issue flags per vehicle | ✅ | PDI issues shown on card and detail |
| Vehicle notes (free text) | ✅ | Per-vehicle textarea, persisted to localStorage |
| Activity history log | ✅ | Timestamped per-vehicle action log |
| Search inventory | 🔜 | Real-time text filter by ID, make, model, lot |
| Edit existing vehicle | 🔜 | Tap-to-edit any spec field |
| Delete / archive | 🔜 | With confirmation dialog |
| Bulk status update | 🔵 | Multi-select + update all |

---

## 2. Maintenance & Service (11 features)

| Feature | Status | Description |
|---------|--------|-------------|
| 9-task maintenance schedule | ✅ | Auto-generated on stockyard entry |
| Frequency-based next-due calc | ✅ | lastDone + freq = nextDue |
| Overdue alert on home screen | ✅ | Red flag on vehicle card |
| DONE tap resets schedule | ✅ | Logs date, calculates new nextDue |
| Maintenance logged to history | ✅ | Tech name + timestamp |
| Overdue count in nav badge | ✅ | Maint tab shows red badge |
| Custom maintenance items | 🔜 | Supervisor adds site-specific tasks |
| Parts & labor log per task | 🔜 | What was used, time spent |
| Shift handoff report | 🔜 | Plain text summary via Web Share API |
| Service due notifications | 🔵 | Requires PWA + notifications API |
| Recurring auto-reset engine | ⚙️ | Background recalculation on app open |

---

## 3. PDI & Inspection (10 features)

| Feature | Status | Description |
|---------|--------|-------------|
| 18-item PDI checklist (Tagalog) | ✅ | 4 sections: Exterior, Interior, Mechanical, Docs |
| 12-item final inspection checklist | ✅ | Covers delta since PDI |
| 4-state tap cycle | ✅ | pending → done → issue → na |
| Issue note field | ✅ | Opens on issue state, persisted |
| Hold stage on PDI failure | ✅ | Auto-recommended, override available |
| Resume PDI after repair | ✅ | Returns vehicle to PDI stage |
| PDI progress bar | ✅ | Done/total count + visual bar |
| Wizard PDI (8-item quick check) | ✅ | First 8 items at port registration |
| Photo attachment to PDI item | 🔜 | Camera capture, base64 stored |
| Damage location marker | 🔜 | Tap on SVG car outline to pin damage |

---

## 4. 3D Vehicle Viewer (7 features)

| Feature | Status | Description |
|---------|--------|-------------|
| Side / Front / Top SVG views | ✅ | Three angle views in detail panel |
| Vehicle type detection | ✅ | Sedan / SUV / truck silhouette |
| Make-based color rendering | ✅ | Brand-associated color per make |
| View toggle buttons | ✅ | SIDE / FRONT / TOP in detail panel |
| Animated 360 rotation | 🔜 | CSS rotate on idle |
| Damage marker overlay | 🔜 | Tap car to pin location notes |
| Three.js 3D model | 🔵 | WebGL per vehicle class |

---

## 5. Admin Panel (10 features)

| Feature | Status | Description |
|---------|--------|-------------|
| Fleet stat cards (4) | ✅ | Total / Maint Due / On Hold / Ready |
| Stage breakdown bar chart | ✅ | Visual count per stage |
| Technician roster | ✅ | All techs with online status and active vehicles |
| Hold vehicles alert section | ✅ | Surfaces PDI failures needing action |
| Assign tech to vehicle | ✅ | Dropdown + button in admin panel |
| Fleet audit log | ✅ | All vehicle history in chronological order |
| No PIN / direct access | ✅ | Removed per user request |
| Technician PIN profiles | 🔵 | Each tech logs in, actions attributed |
| Role-based permissions | 🔵 | Senior vs junior capabilities |
| Supervisor read-only mode | 🔵 | View-only for managers |

---

## 6. Mobile & Offline UX (14 features)

| Feature | Status | Description |
|---------|--------|-------------|
| Mobile-first layout | ✅ | Single column, 320px+ |
| 52px minimum tap targets | ✅ | All buttons, cards, checklist items |
| Bottom navigation bar | ✅ | 5 tabs, thumb-reachable |
| Slide-up sheet panels | ✅ | Detail, admin, wizard all slide up |
| System font stack | ✅ | No CDN, renders instantly offline |
| No external dependencies | ✅ | Zero network calls |
| numeric inputmode | ✅ | Number pad on numeric fields |
| Tagalog / English toggle | ✅ | Instant switch, all strings |
| localStorage persistence | ✅ | Survives close and reopen |
| Seed data on first load | ✅ | 7 demo vehicles |
| Toast notifications | ✅ | Action feedback above nav |
| PWA installable | 🔜 | manifest.json + service worker |
| VIN barcode scanner | 🔜 | Camera-based VIN input |
| Photo capture per vehicle | 🔜 | base64 in vehicle object |
| Haptic feedback | 🔵 | navigator.vibrate() on state change |

---

## 7. Data Transfer & Sync (5 features)

| Feature | Status | Description |
|---------|--------|-------------|
| JSON export / backup | 🔜 | Download full fleet as .json |
| QR code sync | 🔜 | Phone-to-phone without WiFi |
| Plain text shift report | 🔜 | Web Share API → SMS/messaging |
| CSV import | 🔵 | Bulk upload from dealer management system |
| Real-time WiFi sync | 🔵 | Optional when network available |

---

## 8. Infrastructure (8 items)

| Feature | Status | Description |
|---------|--------|-------------|
| Storage version key (v4) | ✅ | Safe schema migrations |
| Seed data — first load | ✅ | 7 bilingual demo vehicles |
| Single .html deployment | ✅ | USB / email / folder share |
| Service Worker + manifest | ⚙️ | PWA app shell caching |
| IndexedDB upgrade | ⚙️ | For fleets 200+ vehicles |
| Schema migration engine | ⚙️ | v4 → v5 with field defaults |
| QR diff sync protocol | ⚙️ | Transmit only changed records |
| Offline notification engine | ⚙️ | Background task due calculation |

---

## Summary Counts

| Status | Count |
|--------|-------|
| ✅ Built | 57 |
| 🔜 Next Up | 17 |
| 🔵 Future | 12 |
| ⚙️ Infrastructure | 8 |
| **Total** | **94** |
