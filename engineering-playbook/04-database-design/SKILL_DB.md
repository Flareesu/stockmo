---
name: database-design
description: Use this skill for database schema design, migrations, indexing strategy, query optimization, data modeling, normalization, PostgreSQL or MySQL configuration, ORM setup, and database performance tuning. Trigger whenever someone mentions "database", "schema", "migration", "SQL", "PostgreSQL", "MySQL", "MongoDB", "ORM", "Prisma", "Drizzle", "indexing", "query optimization", or "data model".
---

# 04 — Database Design

## Schema Design Process

### Step 1: Entity Identification
List every noun in your PRD. Each noun is a potential table. Group related nouns.

### Step 2: Relationship Mapping
For every pair of entities, determine:
- One-to-one (1:1) — Use foreign key on either side
- One-to-many (1:N) — Foreign key on the "many" side
- Many-to-many (M:N) — Junction table required

### Step 3: Normalization
Apply at minimum 3NF (Third Normal Form):
- 1NF: No repeating groups, atomic values
- 2NF: No partial dependencies (all non-key columns depend on full primary key)
- 3NF: No transitive dependencies

**Denormalize intentionally** only when query performance demands it, and document the reason in an ADR.

---

## Table Conventions

### Naming
- Table names: `snake_case`, plural (`users`, `order_items`)
- Column names: `snake_case` (`created_at`, `user_id`)
- Foreign keys: `{referenced_table_singular}_id` (`user_id`, `order_id`)
- Boolean columns: `is_` or `has_` prefix (`is_active`, `has_verified_email`)
- Timestamps: `created_at`, `updated_at`, `deleted_at` (for soft delete)

### Required Columns on Every Table
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
```

### Soft Delete Standard
Add `deleted_at TIMESTAMPTZ NULL` and filter in application queries. Never hard-delete user data without explicit compliance requirements.

---

## Indexing Strategy

### Index Decision Framework
- **Primary key**: Automatic index (B-tree)
- **Foreign keys**: ALWAYS index. No exceptions.
- **WHERE clause columns**: Index if used in > 10% of queries
- **ORDER BY columns**: Composite index with WHERE columns
- **Unique constraints**: Creates an index automatically

### Index Types (PostgreSQL)
| Type | Use Case |
|------|----------|
| B-tree | Default, equality and range queries |
| Hash | Equality-only lookups |
| GIN | Full-text search, JSONB, arrays |
| GiST | Geometric data, range types |
| BRIN | Large tables with natural ordering (time-series) |

### Composite Index Rule
Column order matters. Put the most selective column first.
```sql
-- For: WHERE status = 'active' AND created_at > '2026-01-01'
CREATE INDEX idx_users_status_created ON users (status, created_at);
```

---

## Migration Standards

### Rules
- Migrations are **forward-only** in production. Never edit a deployed migration.
- Every migration has an `up` and `down` function.
- Destructive changes (drop column, drop table) require a multi-step process:
  1. Stop writing to the column
  2. Deploy code that doesn't read the column
  3. Drop the column in a separate migration
- Large table migrations must be tested against production-sized data first
- Always set a `statement_timeout` for DDL operations

### Migration File Naming
```
YYYYMMDDHHMMSS_descriptive_name.sql
20260317120000_add_email_verified_to_users.sql
```

---

## Query Optimization

### EXPLAIN ANALYZE Checklist
Before any query goes to production:
1. Run `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` on the query
2. Check for sequential scans on large tables — add index if needed
3. Verify estimated rows match actual rows (10x mismatch = stale statistics)
4. Look for nested loops on large joins — consider hash joins
5. Check `shared hit` vs `read` in buffers — high reads = cold cache

### N+1 Query Prevention
- Use eager loading (`JOIN` or `include` in ORM)
- Use DataLoader pattern for GraphQL
- Monitor query count per request in development

### Connection Pooling
- Use PgBouncer or built-in pool (Prisma, Drizzle)
- Pool size formula: `(2 * CPU_cores) + number_of_disks`
- Set connection timeout (5s) and idle timeout (30s)

---

## External Skills (skills.sh)
```bash
npx skills add supercent-io/skills-template/database-schema-design
npx skills add supabase/agent-skills/supabase-postgres-best-practices
npx skills add neondatabase/agent-skills/neon-postgres
```
