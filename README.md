# StockMo — Stockyard Management System

Purpose-built fleet app for car-dealership technicians. Tracks every vehicle from port arrival → PDI → stockyard care → final inspection → dealer release, with bilingual EN/TL UI (Chinese also wired).

**Stack:** React 18 + Tailwind + Supabase, loaded via CDN inside a single HTML file served by Vercel. Single-file on purpose — Babel compiles JSX in-browser so there's no build step.

**Users:** admin (full CRUD, fleet ops) · tech (inspect, update, deliver) · employee (limited).

---

## Quick start (dev)

```bash
# 1. Serve the HTML locally
npx serve public                # or: python3 -m http.server 8000 --directory public
open http://localhost:3000      # adjust port

# 2. When you change StockMo-V2.html, mirror to public/ before deploying
./scripts/sync-public.sh
```

That's the whole dev loop. No bundler, no node_modules at the root. The Supabase anon key and URL are baked into the HTML at the top of `StockMo-V2.html`.

### Test credentials (dev project only)

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@stockmo.com  | Admin123!  |
| Tech  | tech@stockmo.com   | Tech123!   |

---

## Layout

```
.
├── StockMo-V2.html             ← source of truth, what you edit
├── public/index.html           ← what Vercel serves (mirror of V2, run sync-public.sh)
├── scripts/sync-public.sh      ← copies V2 → public/index.html
├── vercel.json                 ← security headers + CSP
├── supabase/
│   └── client-template/
│       └── migrations/         ← 10 numbered SQL files, apply in order
├── lambda/                     ← bulk-import Excel/CSV → vehicles via S3 trigger
├── infra/                      ← Terraform (S3 bucket + Lambdas + IAM)
├── apps/                       ← experimental Vite/TS rewrite — status TBD
└── docs/                       ← product, design, and workflow docs
```

---

## Architecture overview

- **Auth:** Supabase Auth (email/password). Role stored on `user_profiles.role`.
- **Data:** All tables live in one Supabase project per dealership (template at `supabase/client-template/`).
- **Realtime:** Three channels — `vehicles`, `pdi_checks`, `stock_maintenance` — keep screens live.
- **Bulk import:** Upload Excel/CSV via a presigned URL → S3 → Lambda parses → inserts into `vehicles`.
- **RLS:** Every table has policies; `is_admin()` / `is_tech()` / `is_maintenance_mode()` helpers gate writes. A maintenance-mode kill switch in `client_config` freezes writes globally.

Project detail lives in [`docs/`](docs/) — `ARCHITECTURE.md`, `DATA_SCHEMA.md`, `DESIGN_SYSTEM.md`, `LIFECYCLE_OVERVIEW.md`, etc.

---

## Supabase setup

Active dev project: `eoxwapxwdshfmlyubfkw` (stockmo-dev).

To spin up a fresh client project, apply migrations in order:

```bash
supabase db push --db-url "postgresql://..."
# or from the SQL editor, paste each file in 01..10 order
```

---

## Deployment

Pushes to `main` auto-deploy to Vercel. Vercel serves `public/index.html`. Before committing, always run:

```bash
./scripts/sync-public.sh
```

otherwise the deployed build stays behind your local edits.

---

## Known gaps (as of 2026-04-18)

- **Offline:** not implemented. The app requires network — `OFFLINE_STRATEGY.md` is a design doc, not live code.
- **Template editing UI:** admin screens (`ChecklistEditorScreen`, `PipelineManagerScreen`) now have real DB tables behind them (migration 09); seed lives in migration 08.
- **Language persistence:** resets to EN on reload. Tracked for Tier 2.
- **Tests:** none yet.

See [`FEATURE_REGISTRY.md`](FEATURE_REGISTRY.md) and [`ROADMAP.md`](ROADMAP.md) for what's built vs. next.
