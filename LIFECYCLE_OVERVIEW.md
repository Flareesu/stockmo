# StockMo — Vehicle Lifecycle Overview

## The 5-Stage Pipeline

Every vehicle moves forward through stages. Once a vehicle advances, it cannot go back — except via the Hold branch, which returns a vehicle to PDI after repair.

```
PORT ARRIVAL
     │
     ▼
   PDI ──── issues found ──► HOLD ──── after repair ──┐
     │                                                 │
     │ all clear (or override)                         │
     ▼                                                 │
STOCKYARD ◄──────────────────────────────────────────┘
  (active maintenance loop)
     │
     │ dealer places order
     ▼
FINAL INSPECTION
     │
     ├── issues found ──► flag, fix, re-inspect
     │
     │ all clear
     ▼
RELEASED TO DEALER
```

---

## Stage 1: Port Arrival

**Trigger:** Vehicle arrives at the dealership port/delivery point  
**App action:** Tap `+ ARRIVE` → 4-step wizard  
**Duration:** Same day as physical arrival  

**What happens:**
- VIN entered and validated (17 chars, no duplicates)
- Vehicle specs recorded: make, model, year, color, engine, fuel
- Lot position assigned (B-01, C-04, etc.)
- Technician assigned to handle PDI
- Arrival notes recorded (condition on delivery, shipping observations)
- PDI checklist auto-generated (18 items, all pending)
- Stage set to `port`

**Outputs:** Vehicle record created, PDI ready to begin

---

## Stage 2: Pre-Delivery Inspection (PDI)

**Trigger:** Technician opens vehicle and taps "Start PDI"  
**Stage:** `pdi`  
**Duration:** 1–2 hours per vehicle  

**What happens:**
- Technician works through 18-item checklist: Exterior, Interior, Mechanical, Documentation
- Each item tapped to cycle: pending → done → issue
- Issues trigger a text note field for description
- Tech notes any findings in the vehicle notes field
- Progress bar shows completion percentage

**Decision point:**
- **All done, no issues** → "PDI PASSED — MOVE TO STOCKYARD" button active
- **Items still pending** → "COMPLETE PDI" button with pending count warning
- **Issues found** → "PUT ON HOLD" button (recommended) + override option

**Outputs:**
- All findings documented before vehicle enters stock
- Protects dealer from claiming damage that was present at arrival

---

## Stage 2b: Hold

**Trigger:** PDI finds issues that need repair  
**Stage:** `hold`  
**Duration:** Varies — depends on repair time  

**What happens:**
- Vehicle flagged in red across all views
- Issues listed on vehicle card and detail
- Appears in Admin Panel's Hold alert section
- Supervisor assigns appropriate tech for repairs
- Tech resolves issues and taps "RESUME PDI AFTER REPAIR"
- Vehicle returns to PDI stage for re-inspection

**Key rule:** A vehicle should never reach the stockyard with undocumented damage.

---

## Stage 3: Stockyard

**Trigger:** PDI passes  
**Stage:** `stock`  
**Duration:** Days to months (until dealer order)  

**What happens:**
- Vehicle assigned a lot position (if not already)
- Maintenance schedule auto-generated from stock entry date
- 9 recurring tasks with individual frequencies (7–60 days)
- Overdue tasks flag on home screen, maintenance tab, and vehicle card
- Tech performs tasks and taps DONE — schedule resets
- All completed maintenance logged to vehicle history

**Active care tasks:**
| Task | Frequency | Why |
|------|-----------|-----|
| Engine idle run | Every 7 days | Prevents battery drain, keeps seals lubricated |
| Tire rotation | Every 30 days | Prevents flat spots from static load |
| Battery check & charge | Every 30 days | Prevents dead battery on delivery |
| Tire pressure check | Every 14 days | Temperature changes affect pressure |
| Exterior wash | Every 14 days | Prevents paint damage from bird droppings, dust |
| Interior clean | Every 30 days | Prevents mold, keeps presentable |
| Fluid levels check | Every 60 days | Oil, coolant, brake fluid |
| Brake check | Every 60 days | Prevents brake binding during long storage |
| Pest inspection | Every 30 days | Prevents wiring damage from rodents |

---

## Stage 4: Final Inspection

**Trigger:** Dealer places an order for a specific vehicle  
**Stage:** `ready` (vehicle passes from stock to ready for final)  
**Duration:** 1–2 hours  

**What happens:**
- Vehicle pulled from lot and thoroughly inspected
- 12-item final checklist covering all areas the dealer will inspect
- Verifies no new damage occurred during stockyard period since PDI
- All checklist items compared against PDI record
- Any new issues flagged and repaired before release
- Exterior wash and polish completed
- Vehicle prepared to dealership presentation standards

**Purpose:** Creates an undeniable paper trail — if a dealer claims damage post-delivery, the final inspection record shows the vehicle was clear at time of release.

---

## Stage 5: Released to Dealer

**Trigger:** Final inspection passes, dealer name confirmed  
**Stage:** `released`  
**Duration:** Immediate — tap to release  

**What happens:**
- Dealer name recorded
- Release date timestamped
- Vehicle archived (excluded from active fleet counts)
- Full history preserved for reference
- Vehicle appears in "released" filter in stock list

**Record retained:** All PDI findings, maintenance history, and final inspection results are permanently attached to the vehicle record.

---

## Stage Transitions Summary

| From | To | Trigger | Data created |
|------|----|---------|----|
| — | port | Wizard completed | Full vehicle record |
| port | pdi | "Start PDI" tapped | PDI log entry |
| pdi | stock | PDI passed | pdiDate, stockDate, maintenance schedule |
| pdi | hold | Issues flagged | Hold log entry |
| hold | pdi | Repair completed | Resume log entry |
| stock | ready | Dealer order, passed to final | Final log entry |
| ready | released | Final passed, dealer confirmed | releaseDate, dealer name |
