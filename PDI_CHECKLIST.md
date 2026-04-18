# StockMo — PDI Checklist Reference

18 items across 4 sections. All items are in Tagalog in the app.  
Priority: HIGH = must not miss | MED = important | LOW = nice to have

---

## Section 1: Panlabas (Exterior)

| # | English | Tagalog | Priority |
|---|---------|---------|----------|
| 1 | Body panels — no dents or scratches | Mga panel — walang kalmot o pisa | HIGH |
| 2 | Paint condition & color match | Kondisyon ng pintura at kulay | HIGH |
| 3 | All glass — no chips or cracks | Lahat ng salamin — walang basag | HIGH |
| 4 | Lights — all bulbs functional | Mga ilaw — gumagana lahat | MED |
| 5 | Door seals & gaps even | Mga rubber seal ng pinto | MED |

---

## Section 2: Loob (Interior)

| # | English | Tagalog | Priority |
|---|---------|---------|----------|
| 6 | Dashboard — no warning lights | Dashboard — walang warning lights | HIGH |
| 7 | All controls & switches work | Lahat ng kontrol at switch | MED |
| 8 | AC / heater operational | AC / heater — gumagana | MED |
| 9 | Seat belts latch & retract | Seat belt — nagkukuha at naka-lock | HIGH |
| 10 | Interior trim — no damage | Interior trim — walang sira | MED |

---

## Section 3: Mekanikal (Mechanical)

| # | English | Tagalog | Priority |
|---|---------|---------|----------|
| 11 | Engine starts — no warning lights | Engine — umaandar, walang warning | HIGH |
| 12 | Brake pedal firm — no noise | Preno — matatag, walang ingay | HIGH |
| 13 | All 4 tires — correct pressure | Lahat ng gulong — tamang hangin | HIGH |
| 14 | Battery voltage check | Battery voltage — ok | HIGH |
| 15 | Engine oil & coolant levels | Langis ng makina at coolant | MED |

---

## Section 4: Dokumento (Documentation)

| # | English | Tagalog | Priority |
|---|---------|---------|----------|
| 16 | Manual & service book present | Manual at service book — kumpleto | MED |
| 17 | Keys — all sets accounted for | Susi — kumpleto ang lahat | HIGH |
| 18 | VIN plate matches documents | VIN plate — tugma sa dokumento | HIGH |

---

## Checklist States

| State | Display | Meaning |
|-------|---------|---------|
| `pending` | Empty box | Not yet checked |
| `done` | Green ✓ | Checked and passed |
| `issue` | Red ! | Problem found — note required |
| `na` | Gray — | Not applicable for this vehicle |

**Tap cycle:** pending → done → issue → na → pending

---

## PDI Outcome Logic

```
If ANY item = "issue":
  → Recommend HOLD
  → Button: "PUT ON HOLD — N ISSUE(S)"
  → Override available: "Send to stock anyway"
  → Vehicle history logs: "HOLD — PDI nabigo"

If items pending > 0, none = "issue":
  → Button: "COMPLETE PDI — N ITEMS STILL PENDING"
  → Tech warned but can proceed

If all items = "done" or "na":
  → Button: "PDI PASSED — MOVE TO STOCKYARD"
  → Clean pass
```

---

## Wizard PDI (First 8 Items)

During the Add Vehicle wizard (Step 2), only the first 8 PDI items are shown — the highest-priority quick checks that can be done at port before the vehicle is even parked. The remaining 10 items default to `pending` and are completed in the full PDI tab after the vehicle is in the system.

This reduces the time to register a new arrival (goal: < 3 minutes) while still capturing critical condition notes at first contact.
