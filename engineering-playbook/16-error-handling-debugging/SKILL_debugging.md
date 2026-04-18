---
name: error-handling-debugging
description: Use this skill for error handling patterns, error boundaries, structured error logging, debugging strategies, stack trace analysis, and production debugging. Trigger whenever someone mentions "error handling", "error boundary", "debugging", "stack trace", "exception", "try-catch", "bug fixing", "troubleshooting", or "production error".
---

# 16 — Error Handling & Debugging

## Error Classification

| Category | Operational | Programmer |
|----------|-----------|-----------|
| Definition | Expected failures (timeout, invalid input, 3rd-party down) | Bugs (null ref, type error, logic error) |
| Recovery | Handle gracefully, retry, fallback | Fix the code — should never reach production |
| Logging | WARN or INFO | ERROR with full stack trace |
| User Impact | User-friendly message | Generic "something went wrong" |

## Error Hierarchy (TypeScript)

```typescript
class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} ${id} not found`, 404);
  }
}

class ValidationError extends AppError {
  constructor(public readonly fields: Record<string, string[]>) {
    super('VALIDATION_ERROR', 'Input validation failed', 400);
  }
}

class ExternalServiceError extends AppError {
  constructor(service: string, cause: Error) {
    super('EXTERNAL_SERVICE_ERROR', `${service} failed: ${cause.message}`, 502, true, { service });
  }
}
```

## Frontend Error Handling

### React Error Boundaries
- Wrap every route in an error boundary
- Wrap independent widgets in their own boundaries
- Log caught errors to monitoring service (Sentry, Datadog)
- Show fallback UI with retry option

### User-Facing Error Messages
- Never show stack traces, SQL errors, or internal codes
- Be specific: "Email is already registered" not "Conflict"
- Be actionable: "Try again in a few minutes" or "Contact support at..."
- Include request ID for support reference

## Backend Global Error Handler

```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'];
  if (err instanceof AppError && err.isOperational) {
    logger.warn({ err, requestId, path: req.path });
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, request_id: requestId }
    });
  }
  logger.error({ err, requestId, path: req.path, stack: err.stack });
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', request_id: requestId }
  });
});
```

## Retry Strategy for External Calls
- Retry only on transient errors (5xx, timeouts, connection reset)
- Never retry on 4xx
- Exponential backoff: 1s → 2s → 4s (max 3 retries) with jitter
- Circuit breaker: open after 5 consecutive failures, half-open after 30s

## Production Debugging Checklist
1. **Reproduce**: Same inputs, same environment?
2. **Correlate**: Find request ID in logs, trace full path
3. **Narrow**: Which service/layer threw the error?
4. **Timeline**: When did it start? Recent deploys or config changes?
5. **Hypothesize**: Form theory, test it
6. **Fix**: Staging first, deploy with monitoring

---

## External Skills (skills.sh)
```bash
npx skills add obra/superpowers/systematic-debugging
npx skills add supercent-io/skills-template/code-refactoring
```
