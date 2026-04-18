---
name: api-design
description: Use this skill for designing RESTful APIs, GraphQL schemas, API versioning, pagination, filtering, rate limiting, error responses, OpenAPI specifications, and API governance. Trigger whenever someone mentions "API design", "REST", "GraphQL", "endpoint", "OpenAPI", "Swagger", "API versioning", "pagination", "rate limit", or "API contract".
---

# 05 — API Design

## REST API Conventions

### URL Structure
```
/{resource}              GET (list), POST (create)
/{resource}/{id}         GET (read), PUT (replace), PATCH (update), DELETE
/{resource}/{id}/{sub}   Nested resource operations
```

### Naming Rules
- Use **plural nouns**: `/users`, `/orders`, `/invoices`
- Use **kebab-case** for multi-word resources: `/order-items`
- Never use verbs in URLs: `/users/123/activate` not `/activateUser`
- Use query parameters for filtering: `/users?status=active&role=admin`

### HTTP Methods & Status Codes

| Method | Success | Use |
|--------|---------|-----|
| GET | 200 | Retrieve resource(s) |
| POST | 201 | Create resource (return `Location` header) |
| PUT | 200 | Full replacement |
| PATCH | 200 | Partial update |
| DELETE | 204 | Remove resource (no body) |

| Status | Meaning |
|--------|---------|
| 400 | Bad request (validation error) |
| 401 | Unauthenticated |
| 403 | Forbidden (authenticated but unauthorized) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, state conflict) |
| 422 | Unprocessable entity (business logic error) |
| 429 | Rate limited |
| 500 | Internal server error |

---

## Pagination

### Cursor-Based (Preferred for Large Datasets)
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTAwfQ==",
    "has_more": true,
    "limit": 25
  }
}
```

### Offset-Based (Acceptable for Small Datasets)
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "per_page": 25,
    "total": 150,
    "total_pages": 6
  }
}
```

---

## Filtering, Sorting, Field Selection

```
GET /users?status=active&role=admin          # Filtering
GET /users?sort=-created_at,name             # Sort (- prefix = desc)
GET /users?fields=id,name,email              # Sparse fields
GET /users?search=john                       # Full-text search
```

---

## API Versioning Strategy

**Recommended: URL Path Versioning**
```
/api/v1/users
/api/v2/users
```

### Versioning Rules
- Bump major version only for breaking changes
- Support N-1 versions (current + previous)
- Deprecation notice: 6-month minimum with `Sunset` header
- Breaking changes: removing fields, changing field types, removing endpoints

---

## Rate Limiting

### Standard Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1679097600
Retry-After: 30
```

### Tiers
| Tier | Limit | Window |
|------|-------|--------|
| Unauthenticated | 60 req | 1 minute |
| Authenticated (Free) | 1000 req | 1 hour |
| Authenticated (Pro) | 10000 req | 1 hour |
| Admin/Internal | No limit | — |

---

## Request/Response Standards

### Request Validation
- Validate ALL input at the API boundary using Zod/Joi
- Reject early, respond with specific field-level errors
- Strip unknown fields (don't pass through to business logic)

### Response Envelope
```json
{
  "data": { ... },
  "meta": {
    "request_id": "req-abc123",
    "timestamp": "2026-03-17T00:00:00Z"
  }
}
```

### Error Envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ],
    "request_id": "req-abc123"
  }
}
```

---

## OpenAPI Specification

Every API must have an OpenAPI 3.1 spec. Generate from code annotations or maintain as source of truth:
- Store in `docs/openapi.yaml`
- Auto-generate client SDKs from spec
- Validate requests/responses against spec in tests
- Publish interactive docs via Swagger UI or Redoc

---

## External Skills (skills.sh)
```bash
npx skills add wshobson/agents/api-design-principles
npx skills add supercent-io/skills-template/api-design
npx skills add supercent-io/skills-template/api-documentation
```
