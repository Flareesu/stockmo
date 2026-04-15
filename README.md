# StockMo — Stockyard Management System

**Version:** 1.0  
**Client:** Apex Motors (Car Dealership)  
**Platform:** Mobile-first, offline-capable single HTML file  
**Languages:** English / Filipino (Tagalog)  
**Target Users:** Stockyard technicians, service supervisors

---

## What is StockMo?

StockMo is a purpose-built stockyard management app for car dealership technicians. It tracks every vehicle from the moment it arrives at port through pre-delivery inspection (PDI), stockyard care, final inspection, and dealer release — all offline, from a single `.html` file that runs on any low-spec Android or iOS phone.

---

## Folder Structure

```
StockMo/
├── README.md                          ← You are here
├── 01_project_brief/
│   ├── PROJECT_BRIEF.md               ← Full project overview & goals
│   └── USER_PERSONAS.md               ← Technician & supervisor profiles
├── 02_product_design/
│   ├── DESIGN_SYSTEM.md               ← Colors, typography, components
│   ├── MOBILE_UX_PRINCIPLES.md        ← Low-tech mobile design rules
│   └── TAGALOG_TRANSLATIONS.md        ← Full EN/TL string reference
├── 03_technical_architecture/
│   ├── ARCHITECTURE.md                ← System layers & data flow
│   ├── DATA_SCHEMA.md                 ← Vehicle object structure
│   ├── OFFLINE_STRATEGY.md            ← localStorage + PWA plan
│   └── ROADMAP.md                     ← Next up, future, infra features
├── 04_lifecycle_workflow/
│   ├── LIFECYCLE_OVERVIEW.md          ← 5-stage pipeline description
│   ├── PDI_CHECKLIST.md               ← 18-item PDI reference (EN + TL)
│   ├── STOCK_MAINTENANCE.md           ← 9-task recurring schedule
│   └── FINAL_INSPECTION.md            ← 12-item final checklist (EN + TL)
├── 05_feature_registry/
│   └── FEATURE_REGISTRY.md            ← All features: Built / Next / Future
├── 06_skills/
│   ├── SKILL_mobile_offline_app.md    ← How to build mobile-first offline apps
│   ├── SKILL_lifecycle_ui.md          ← How to build stage-gated pipeline UIs
│   ├── SKILL_bilingual_toggle.md      ← How to implement EN/TL language toggle
│   ├── SKILL_checklist_engine.md      ← How to build tap-cycle checklist systems
│   └── SKILL_admin_panel.md           ← How to build supervisor admin panels
└── 07_assets/
    └── VEHICLE_SEED_DATA.md           ← 7 demo vehicles for first-load
```

---

## Quick Start

1. Open `StockMo.html` in any mobile browser (Chrome recommended)
2. Data auto-loads from `localStorage` — 7 demo vehicles on first run
3. Tap `+ ARRIVE` to register a new vehicle via the 4-step wizard
4. Tap `ADMIN` for supervisor controls, technician assignments, and audit log
5. Toggle `EN / TL` in the topbar to switch language at any time

---

## Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Offline first** | All data in `localStorage`, zero network calls |
| **Single file** | Entire app in one `.html` — no install, no server |
| **Mobile native feel** | 52px tap targets, bottom nav, slide-up panels |
| **Tagalog native** | Full bilingual toggle, checklist items in TL |
| **Lifecycle gated** | Vehicles can only advance forward through stages |
| **Low-spec ready** | System fonts only, no CDN, runs on Android Go |
