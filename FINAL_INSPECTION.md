# StockMo — Final Inspection Checklist

12 items completed before any vehicle is released to a dealer. This checklist confirms no new damage has occurred since PDI and that the vehicle meets delivery standards.

---

## Section 1: Panlabas (Exterior)

| # | English | Tagalog | Priority |
|---|---------|---------|----------|
| f1 | No new damage since PDI | Walang bagong sira mula PDI | HIGH |
| f2 | Paint — no swirls or new scratches | Pintura — walang bagong kalmot | HIGH |
| f3 | All glass clean & undamaged | Salamin — malinis at buo | HIGH |
| f4 | Exterior wash & polish done | Hugasan at polish na | MED |

---

## Section 2: Loob (Interior)

| # | English | Tagalog | Priority |
|---|---------|---------|----------|
| f5 | Full interior clean & vacuum | Nilinis ang loob nang buo | MED |
| f6 | No new interior damage since PDI | Walang bagong sira sa loob mula PDI | HIGH |

---

## Section 3: Mekanikal (Mechanical)

| # | English | Tagalog | Priority |
|---|---------|---------|----------|
| f7 | Engine start — no new warning lights | Engine — walang bagong warning lights | HIGH |
| f8 | All 4 tires at delivery pressure | Lahat ng gulong — delivery pressure | HIGH |
| f9 | Battery fully charged | Battery — puno na ang charge | HIGH |

---

## Section 4: Dokumento (Documentation)

| # | English | Tagalog | Priority |
|---|---------|---------|----------|
| f10 | All key sets present | Kumpleto ang mga susi | HIGH |
| f11 | Manual, docs, service book complete | Manual, docs, service book — kumpleto | HIGH |
| f12 | PDI findings resolved or noted | Mga natuklasan sa PDI — naayos o naitala | HIGH |

---

## Difference from PDI

The final inspection is **not** a full re-inspection. It focuses on:

1. **Delta check** — what changed since PDI? Any new damage from stockyard handling?
2. **Delivery readiness** — is the vehicle clean, fueled, and presentable?
3. **Documentation completeness** — are all keys and papers present?
4. **PDI resolution** — were any PDI issues noted and resolved?

This is explicitly not checking things already confirmed at PDI (like VIN match or seat belt function) — those don't change in the stockyard.

---

## Release Gate

A vehicle can only be released to a dealer after:
1. Stage is `ready` (passed from stockyard)
2. Dealer name is entered in the release form
3. "RELEASE TO DEALER" / "I-RELEASE SA DEALER" is tapped

If final inspection has outstanding issues, a warning is shown but the supervisor can still proceed (override is intentional — sometimes minor notes don't block delivery).

---

## Dealer Release Record

On release, the following is stamped to the vehicle record:
```javascript
car.stage       = 'released';
car.releaseDate = todayString();
car.finalDate   = todayString();  // If not already set
car.dealer      = dealerName;
car.history.unshift(`${todayString()}: Na-release sa ${dealerName}`);
```

This record is permanent and searchable for dispute resolution.

---

## Why This Matters

Dealer damage claims are a significant source of dispute in the Philippine automotive distribution chain. A final inspection with:
- Timestamped checklist completion
- Technician name in the history log
- Documented PDI findings showing pre-existing conditions

...provides a clear, device-local record that can be referenced if a dealer claims a vehicle arrived damaged.
