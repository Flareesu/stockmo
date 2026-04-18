-- ─── PDI Checklist Template Seed ──────────────────────────────────────────────
-- This file documents the 25-item PDI template used when initializing a new vehicle.
-- The actual seed is generated in JavaScript (src/data/pdiTemplate.ts) from this spec.
-- 'na' state is intentionally NOT included — only pending, done, issue.

-- PDI sections and items:
-- Section: Exterior (7 items)
--   EXT-01 Body panel alignment and gaps          priority: high
--   EXT-02 Paint surface condition (no scratches) priority: high
--   EXT-03 Windshield and glass integrity         priority: high
--   EXT-04 All exterior lights function           priority: med
--   EXT-05 Door seals and weatherstripping        priority: med
--   EXT-06 Wheels and tire condition              priority: high
--   EXT-07 Wipers and washer nozzles              priority: low

-- Section: Interior (7 items)
--   INT-01 Dashboard and instrument cluster       priority: high
--   INT-02 All controls and switches operate      priority: med
--   INT-03 Air conditioning (cooling + heating)   priority: high
--   INT-04 Seatbelts and airbag indicators        priority: high
--   INT-05 Seat adjustment and condition          priority: med
--   INT-06 Interior trim and upholstery           priority: low
--   INT-07 Infotainment system and Bluetooth      priority: low

-- Section: Mechanical (6 items)
--   MECH-01 Engine start and idle quality         priority: high
--   MECH-02 Brake operation and pedal feel        priority: high
--   MECH-03 Steering alignment                    priority: high
--   MECH-04 Battery charge level                  priority: med
--   MECH-05 All fluid levels (oil, coolant, etc.) priority: high
--   MECH-06 Exhaust condition                     priority: med

-- Section: Electrical (2 items)
--   ELEC-01 All power windows operate             priority: med
--   ELEC-02 Central locking and remote key        priority: med

-- Section: Safety (3 items)
--   SAFE-01 Warning lights clear on startup       priority: high
--   SAFE-02 Parking brake operation               priority: high
--   SAFE-03 Horn operation                        priority: low

-- Final Inspection Template (14 items):
-- Section: Pre-Delivery (5 items)
--   FIN-01 Full exterior wash and polish          priority: high
--   FIN-02 Interior vacuum and wipe-down          priority: high
--   FIN-03 Fuel level minimum 3/4 tank            priority: high
--   FIN-04 Tire pressure set to spec              priority: high
--   FIN-05 All accessories installed              priority: med

-- Section: Documentation (4 items)
--   DOC-01 Owner's manual present                 priority: high
--   DOC-02 Service schedule booklet               priority: med
--   DOC-03 All keys and key cards accounted for   priority: high
--   DOC-04 Registration documents                 priority: high

-- Section: Handover (5 items)
--   HND-01 VIN verified against documents         priority: high
--   HND-02 Dealer inspection sign-off             priority: high
--   HND-03 Customer walkthrough completed         priority: med
--   HND-04 PDI checklist attached                 priority: high
--   HND-05 Final photos taken                     priority: low

-- Maintenance Schedule Template (12 tasks):
-- MAINT-01  Exterior wash                    freq: 7 days   priority: low
-- MAINT-02  Interior cleaning                freq: 7 days   priority: low
-- MAINT-03  Tire pressure check              freq: 14 days  priority: high
-- MAINT-04  Battery charge check             freq: 14 days  priority: high
-- MAINT-05  Fluid levels check               freq: 14 days  priority: high
-- MAINT-06  Start and run engine (5 min)     freq: 7 days   priority: high
-- MAINT-07  Brake system visual check        freq: 30 days  priority: high
-- MAINT-08  AC system run test               freq: 30 days  priority: med
-- MAINT-09  Lights and electronics check     freq: 30 days  priority: med
-- MAINT-10  Wiper condition check            freq: 60 days  priority: low
-- MAINT-11  Undercarriage inspection         freq: 60 days  priority: med
-- MAINT-12  Full detail and touch-up         freq: 30 days  priority: low
