# StockMo — User Personas

---

## Persona 1: The Stockyard Technician

**Name:** Juan / Maria  
**Role:** Stockyard Technician (Tech I / Tech II)  
**Age:** 22–38  
**Device:** Low-to-mid spec Android phone (e.g. Samsung Galaxy A-series)  
**Language preference:** Filipino (Tagalog) for work, can read English

### Day in the Life
Juan arrives at the yard at 7am. He checks his phone to see which vehicles need attention today — which have overdue maintenance, which are in PDI that he's assigned to, and if any new arrivals came in overnight. He spends the day moving between vehicles, ticking off checklist items, logging maintenance tasks as done, and noting any issues he finds. He hands off his phone to the next shift with the app showing the current state of everything.

### Goals
- Know immediately which vehicle to work on next
- Log completed work quickly without typing much
- Flag damage or issues with notes so they're documented
- Not have to remember due dates — the app should tell him

### Frustrations
- English-only interfaces slow him down
- Small tap targets are hard to use with work gloves
- Apps that need WiFi are useless in the yard
- Long forms are annoying — he just wants to tick boxes

### Design implications
- TL language toggle must be default-accessible in one tap
- All tap targets minimum 52px
- Checklist items must be single-tap cycle (pending → done → issue)
- No login screen — open and go
- Everything persists offline automatically

---

## Persona 2: The Supervisor / Admin

**Name:** Supervisor Reyes  
**Role:** Senior Technician / Shift Supervisor  
**Age:** 35–50  
**Device:** Mid-range Android or iPhone  
**Language preference:** Mixed — comfortable in both EN and TL

### Day in the Life
Reyes oversees 4–5 technicians across two lots. Each morning he checks the Admin panel for fleet status: how many vehicles are in each stage, which are on hold, which need maintenance. He assigns specific techs to new arrivals and reviews the audit log to know what happened during the overnight shift. He is accountable to management for vehicle condition and dealer satisfaction.

### Goals
- See fleet status at a glance — no digging
- Know which technician is responsible for which vehicle
- Catch hold vehicles and PDI failures early
- Have a trail of who did what, when, for accountability
- Release vehicles to dealers with documentation

### Frustrations
- Can't tell who worked on what without asking around
- Hold vehicles sit unnoticed if no one flags them
- Dealer damage claims with no documentation to counter them

### Design implications
- Admin panel must surface stats, roster, and holds on one screen
- Assign tech feature must be fast — dropdown + one button
- Audit log must be comprehensive and timestamped
- Hold vehicles get a dedicated alert section

---

## Persona 3: The Dealer Representative

**Name:** Dealer Contact (external)  
**Role:** Purchasing Dealer's Representative  
**Interaction with StockMo:** Indirect — benefits from Final Inspection documentation

### Goals
- Receive vehicles in the condition described
- Have documentation to reference if a dispute arises

### Design implications
- Final Inspection checklist must be comprehensive and cover all areas a dealer would inspect
- Release to Dealer step records dealer name and date for traceability
