# Tier 3 — Open architectural decisions

Tier 1 and Tier 2 from the audit plan at `.claude/plans/do-a-full-diagnosis-virtual-wall.md` are complete.
This file captures the items that were intentionally deferred and why, so the next engineer can pick them up without re-deriving the context.

---

## T2.12 — Fleet list pagination

**Deferred. Keeping `.limit(10000)` for now.**

The fetch at [StockMo-V2.html:5512](../StockMo-V2.html) feeds a single in-memory `vehicles` array that every screen filters against (`TechDashboardScreen`, `StockyardScreen`, `DeliveryScreen`, `FleetListScreen`, `AdminDashboard`, `ReportsScreen` — ~20 filter sites). Switching to `.range(0, 49)` + infinite scroll requires rewriting each consumer to query the DB on demand and reconciling that with realtime updates.

At current fleet sizes (<500 vehicles per dealership) the fetch is ~2s and fine. Revisit when a dealership crosses ~2k vehicles.

**When picked up:** design a data layer (likely TanStack Query + per-screen queries) before touching the screens.

---

## T2.14 — Terraform remote backend (S3 + DynamoDB lock)

**Deferred. State still local.**

Requires provisioning an S3 bucket, DynamoDB lock table, and IAM for state access *before* migrating — a coordinated ops change that shouldn't happen unilaterally from a code audit. [`infra/main.tf`](../infra/main.tf) already has a comment flagging the intent.

**When picked up:**
1. Create `tfstate-stockmo` bucket (versioning on, encryption, public access blocked).
2. Create `tfstate-stockmo-lock` DynamoDB table with `LockID` string hash key.
3. Add `terraform { backend "s3" { ... } }` block.
4. `terraform init -migrate-state` once, then commit.

---

## T3.17 — Fate of `apps/stockmo/` (Vite/TS migration)

**Undecided.** The directory exists but is half-started. It's confusing to have next to the live `StockMo-V2.html`.

**Options:**
- **A) Finish the migration.** Biggest win: removes `'unsafe-eval'` from CSP, enables real tests and component extraction, unlocks bundler-level optimizations. Biggest cost: multi-week rewrite of 6,100 lines across 15 screens.
- **B) Delete `apps/`.** Commit to the single-file+CDN model. Document the tradeoff in README so the next person doesn't restart the migration.
- **C) Leave it.** Current state — costs ongoing confusion, blocks nothing.

Recommend A if tests matter, B otherwise. C is the default-by-inaction trap.

---

## T3.18 — Offline support

**Not implemented.** [`OFFLINE_STRATEGY.md`](../OFFLINE_STRATEGY.md) is a design doc, not live code.

If it's still a product goal: needs a service worker for the HTML shell, IndexedDB for the vehicles/pdi tables, and a write-queue that drains when `navigator.onLine` flips. If it's not a product goal: rewrite the doc to say "online-only".

---

## T3.19 — Test harness

**None exists.** Smoke tests for login, PDI submit, and vehicle create would catch most regressions. Hard to add cleanly with the Babel-in-browser setup — practically requires T3.17 option A first.

---

## T3.20 — Supabase key rotation

The anon key is baked into the HTML at [`StockMo-V2.html`](../StockMo-V2.html) top. That's fine — the anon key is designed to be public and RLS enforces authorization. But if the key was ever used with different RLS policies than today, rotate it. Set a quarterly reminder regardless.

---

## Completed in this audit pass

- T1.1 Missing DB tables → [09_missing_tables.sql](../supabase/client-template/migrations/09_missing_tables.sql)
- T1.2 `is_admin()`/`is_tech()` aligned with `user_profiles` → [10_role_helpers_from_profiles.sql](../supabase/client-template/migrations/10_role_helpers_from_profiles.sql)
- T1.3 `StockMo-V2.html` → `public/index.html` sync via [scripts/sync-public.sh](../scripts/sync-public.sh)
- T1.4 Legacy HTMLs removed
- T1.5 README rewritten to reflect React+Supabase reality
- T1.6 Native `alert()`/`confirm()` replaced with a shared `stockmoDialog` system (modal with Esc, focus trap, backdrop)
- T1.7 Missing `.catch()` handlers added on Supabase queries
- T2.9 Shared `Modal` component extracted
- T2.10 Language choice persisted to `localStorage`
- T2.11 `loading="lazy"` on all 14 `<img>` tags
- T2.13 `AdminDashboard` derivations collapsed into a single `useMemo` (pipeline counts + hold vehicles + recent activity + model breakdown, single pass over `vehicles`)
- T2.16 Design assets moved to `docs/assets/`
