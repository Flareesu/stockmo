# StockMo — Project Brief

## Background

Apex Motors operates a multi-lot car dealership stockyard (Lot B and Lot C). Vehicles arrive by port shipment and must pass through a structured series of inspections and care routines before they are released to purchasing dealers. Previously, this process was tracked manually on paper — leading to missed maintenance, undocumented damage claims, and unclear vehicle status across shifts.

StockMo digitizes this entire process into a single offline-capable mobile app purpose-built for the technicians who physically work in the yard.

---

## Problem Statement

1. **No visibility** — supervisors cannot see which vehicles are in PDI, stockyard, or final inspection at a glance
2. **Missed maintenance** — recurring tasks (tire rotation, battery check, engine idle run) are forgotten as vehicles sit in the yard for weeks or months
3. **Damage claims** — dealers receive vehicles with undocumented scratches or issues that were present since port arrival, creating disputes
4. **Language barrier** — technical forms and checklists are in English; most yard technicians are more comfortable in Filipino
5. **No connectivity** — the stockyard has unreliable WiFi; any digital tool must work fully offline

---

## Goals

### Primary
- Track every vehicle through 5 lifecycle stages: Port → PDI → Stockyard → Final Inspection → Released
- Provide a pre-delivery inspection (PDI) checklist to document vehicle condition at arrival
- Auto-schedule recurring stockyard maintenance tasks per vehicle with overdue alerts
- Provide a final inspection checklist before any vehicle is released to a dealer
- Run fully offline on low-spec Android phones

### Secondary
- Allow supervisors to assign technicians to vehicles and view fleet-wide status
- Support full Tagalog language toggle for native-language technician workflows
- Log every action with technician name and timestamp for accountability
- Register vehicles via VIN (Vehicle Identification Number) with a 4-step guided wizard

---

## Scope

### In Scope (v1.0)
- Single `.html` file app, no server or install required
- Vehicle lifecycle pipeline with 5 stages + Hold branch
- 18-item PDI checklist (Exterior, Interior, Mechanical, Documentation)
- 9-task recurring stockyard maintenance schedule with frequency tracking
- 12-item final inspection checklist
- Admin panel: fleet stats, technician roster, assignment, audit log
- Add Vehicle wizard: 4-step guided flow (Arrival → PDI → Assign → Confirm)
- English / Tagalog bilingual toggle
- `localStorage` offline persistence

### Out of Scope (v1.0)
- Backend server or cloud sync
- Multi-dealership support
- Photo capture and attachment
- PWA / Add to Home Screen manifest
- VIN barcode camera scanning

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to register a new arrival | < 3 minutes via wizard |
| PDI completion documentation | 100% of vehicles before stockyard entry |
| Missed maintenance tasks | 0 — overdue items surface on home screen |
| Damage claim disputes | Resolved via PDI/Final inspection log |
| Tech adoption | Usable on first open, no training required |
| Language comfort | All Filipino techs use TL mode |

---

## Stakeholders

| Role | Name | Responsibility |
|------|------|----------------|
| Product Owner | Dealership Manager | Defines requirements, approves releases |
| Supervisor | Senior Tech / Admin | Uses Admin panel, assigns techs, reviews audit log |
| Primary Users | Stockyard Technicians | Uses full app daily for inspections and maintenance |
| Dealer Partners | Purchasing Dealers | Benefit from Final Inspection documentation |
