---
name: backend-engineering
description: Use this skill for server-side development including API server setup, business logic architecture, middleware design, background job processing, caching strategies, and service layer patterns. Trigger whenever someone mentions "backend", "server", "Express", "Fastify", "NestJS", "Django", "FastAPI", "Rails", "middleware", "background jobs", "queue", "caching", "service layer", or "business logic".
---

# 03 — Backend Engineering

## Project Structure (Node.js Standard)

```
src/
├── config/              # Environment config, feature flags
│   ├── index.ts        # Central config export
│   ├── database.ts     # DB connection config
│   └── redis.ts        # Cache config
├── modules/            # Domain modules (bounded contexts)
│   ├── users/
│   │   ├── user.controller.ts   # HTTP handlers
│   │   ├── user.service.ts      # Business logic
│   │   ├── user.repository.ts   # Data access
│   │   ├── user.model.ts        # Data model / entity
│   │   ├── user.schema.ts       # Validation schemas (Zod)
│   │   ├── user.types.ts        # TypeScript types
│   │   └── __tests__/           # Module tests
│   ├── orders/
│   └── payments/
├── middleware/          # Express/Fastify middleware
│   ├── auth.ts         # Authentication
│   ├── rate-limit.ts   # Rate limiting
│   ├── error-handler.ts # Global error handler
│   ├── request-id.ts   # Correlation ID injection
│   └── validate.ts     # Request validation middleware
├── jobs/               # Background job processors
│   ├── email.job.ts
│   └── report.job.ts
├── lib/                # Shared utilities
│   ├── logger.ts       # Structured logger
│   ├── errors.ts       # Custom error classes
│   ├── cache.ts        # Cache abstraction
│   └── events.ts       # Event emitter / bus
├── db/
│   ├── migrations/     # Database migrations
│   ├── seeds/          # Seed data
│   └── client.ts       # DB client initialization
└── server.ts           # Server bootstrap
```

## Layered Architecture Rules

### Controller → Service → Repository

| Layer | Responsibility | Can Call | Cannot Call |
|-------|---------------|---------|-------------|
| Controller | Parse request, call service, format response | Service | Repository, DB directly |
| Service | Business logic, orchestration, validation | Repository, other Services, Cache | HTTP objects (req/res) |
| Repository | Data access, queries, transactions | Database client | Services, Controllers |

**Hard rules:**
- Controllers never contain business logic
- Services never access `req` or `res` objects
- Repositories never throw HTTP errors (throw domain errors instead)
- Each layer has its own error types

---

## Middleware Stack (Order Matters)

```
1. Request ID (correlation ID)
2. Request logging (method, path, timing)
3. Security headers (Helmet)
4. CORS
5. Body parsing
6. Rate limiting
7. Authentication
8. Authorization
9. Request validation
10. Route handler
11. Error handler (catch-all)
```

---

## Error Handling Pattern

```typescript
// lib/errors.ts
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'NOT_FOUND', `${resource} with id ${id} not found`);
  }
}

class ValidationError extends AppError {
  constructor(public errors: Record<string, string[]>) {
    super(400, 'VALIDATION_ERROR', 'Validation failed');
  }
}
```

### Error Response Format (Standard)
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User with id abc123 not found",
    "requestId": "req-uuid-here",
    "timestamp": "2026-03-17T00:00:00Z"
  }
}
```

---

## Background Jobs

### When to Use a Job Queue
- Sending emails or notifications
- Generating reports or PDFs
- Processing file uploads
- Calling slow external APIs
- Any task that takes > 500ms

### Job Design Rules
- Jobs must be **idempotent** (safe to retry)
- Jobs must have **timeout limits**
- Jobs must log **start, progress, completion, and failure**
- Failed jobs must have a **dead letter queue**
- Critical jobs must have **alerting on failure**

### Recommended: BullMQ (Redis-backed)
```typescript
const emailQueue = new Queue('email', { connection: redis });
emailQueue.add('welcome', { userId, email }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
});
```

---

## Caching Strategy

| Pattern | Use Case | TTL |
|---------|----------|-----|
| Cache-aside | User profiles, settings | 5-15 min |
| Write-through | Session data | Until expiry |
| Cache-invalidation | After mutations | Immediate |
| Stale-while-revalidate | Dashboard data | 1 min stale, 5 min max |

### Cache Key Convention
```
{service}:{entity}:{id}:{variant}
Example: users:profile:abc123:full
```

---

## External Skills (skills.sh)
```bash
npx skills add wshobson/agents/nodejs-backend-patterns
npx skills add supercent-io/skills-template/api-design
npx skills add supercent-io/skills-template/code-refactoring
npx skills add wshobson/agents/api-design-principles
```
