---
name: monitoring-observability
description: Use this skill for setting up logging, metrics, distributed tracing, alerting, dashboards, SLOs/SLIs/SLAs, health checks, and observability infrastructure. Trigger whenever someone mentions "monitoring", "logging", "metrics", "tracing", "alerting", "dashboard", "SLO", "observability", "Datadog", "Grafana", "Prometheus", "uptime", or "health check".
---

# 12 — Monitoring & Observability

## Three Pillars of Observability

### 1. Structured Logging
```json
{
  "timestamp": "2026-03-17T12:00:00Z",
  "level": "error",
  "message": "Payment processing failed",
  "service": "payment-service",
  "request_id": "req-abc123",
  "user_id": "usr-456",
  "error_code": "STRIPE_DECLINED",
  "duration_ms": 1250,
  "environment": "production"
}
```

**Rules:**
- JSON format, one line per entry (no multi-line stack traces as separate entries)
- Every log entry must have: timestamp, level, message, service, request_id
- Log levels: DEBUG (dev only), INFO, WARN, ERROR, FATAL
- Never log: passwords, tokens, PII (mask credit cards, emails)
- Include correlation/request ID for request tracing across services

### 2. Metrics (RED + USE Methods)

**RED Method (for services):**
| Metric | What | Alert Threshold |
|--------|------|----------------|
| **R**ate | Requests per second | Deviation > 50% from baseline |
| **E**rrors | Error rate percentage | > 1% for 5 minutes |
| **D**uration | Response time (p50, p95, p99) | p95 > 500ms for 5 minutes |

**USE Method (for infrastructure):**
| Metric | What | Alert Threshold |
|--------|------|----------------|
| **U**tilization | CPU, memory, disk usage | > 80% for 10 minutes |
| **S**aturation | Queue depth, thread pool | > 90% capacity |
| **E**rrors | Hardware/system errors | Any |

### 3. Distributed Tracing
- Instrument all service-to-service calls with trace context (W3C TraceContext)
- Trace ID propagated via `traceparent` header
- Every span includes: service name, operation, duration, status
- Sample rate: 100% for errors, 10% for success in production
- Tool: OpenTelemetry (vendor-agnostic) → Jaeger, Datadog, Honeycomb

## SLO Framework

### Defining SLOs
| Service | SLI | SLO | Error Budget (30 days) |
|---------|-----|-----|----------------------|
| API | Request success rate | 99.9% | 43.2 minutes downtime |
| API | p95 latency | < 500ms | 5% of requests can exceed |
| Web App | Page load time | < 3s for 95% of users | 5% can exceed |
| Database | Query success rate | 99.99% | 4.3 minutes downtime |

### Alert Hierarchy
```
P0 (Page immediately): Service down, data loss risk, security breach
P1 (Page within 15m): Error budget burn rate > 10x, SLO at risk
P2 (Notify in Slack): Elevated error rate, performance degradation
P3 (Dashboard only): Minor anomalies, capacity warnings
```

## Dashboards (Standard Set)
Every service needs these dashboards:
1. **Service Health**: Request rate, error rate, latency percentiles
2. **Infrastructure**: CPU, memory, disk, network for all hosts
3. **Business Metrics**: Signups, transactions, key product events
4. **Dependencies**: External API health, database metrics, cache hit rate

## Health Check Endpoints
```
GET /health          → 200 if service is running (liveness)
GET /health/ready    → 200 if ready to accept traffic (readiness)
GET /health/startup  → 200 once initialization is complete
```

---

## External Skills (skills.sh)
```bash
npx skills add microsoft/azure-skills/azure-observability
npx skills add supercent-io/skills-template/workflow-automation
```
