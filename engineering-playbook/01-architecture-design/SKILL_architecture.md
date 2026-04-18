---
name: architecture-design
description: Use this skill when designing system architecture, selecting tech stacks, creating Architecture Decision Records (ADRs), drawing system diagrams, evaluating monolith vs microservices, or planning how components communicate. Trigger whenever someone mentions "system design", "architecture", "tech stack", "ADR", "microservices", "monolith", "event-driven", or "system diagram".
---

# 01 — Architecture Design

## Tech Stack Selection Framework

Never choose a technology because it's trending. Evaluate against these criteria:

### Decision Matrix
| Criteria | Weight | Option A | Option B | Option C |
|---------|--------|----------|----------|----------|
| Team familiarity | 25% | | | |
| Ecosystem maturity | 20% | | | |
| Performance characteristics | 15% | | | |
| Hiring pool availability | 15% | | | |
| Long-term maintenance cost | 15% | | | |
| Community & documentation | 10% | | | |

### Recommended Default Stacks

**Web Application (Standard)**
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: Node.js (Express/Fastify) or Go (for high-throughput)
- Database: PostgreSQL (primary), Redis (cache/sessions)
- Search: Elasticsearch or Typesense
- Queue: BullMQ (Redis-backed) or RabbitMQ
- Infrastructure: Docker + Kubernetes or serverless (Vercel/AWS Lambda)

**High-Scale API Service**
- Language: Go or Rust
- Database: PostgreSQL + read replicas
- Cache: Redis Cluster
- Message broker: Apache Kafka or NATS
- API Gateway: Kong or AWS API Gateway

**Data-Intensive Application**
- Backend: Python (FastAPI)
- Database: PostgreSQL + TimescaleDB or ClickHouse
- Pipeline: Apache Airflow or Dagster
- Storage: S3-compatible object store

---

## Architecture Decision Records (ADRs)

Every significant technical decision gets an ADR. Store them in `docs/adrs/`.

### ADR Template
```markdown
# ADR-{NNN}: {Title}

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Date:** YYYY-MM-DD
**Deciders:** [names]

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult because of this decision?

### Positive
- ...

### Negative
- ...

### Risks
- ...
```

---

## Architecture Patterns

### When to Use What

| Pattern | Use When | Avoid When |
|---------|----------|-----------|
| Monolith | Team < 10, product-market fit unclear | Multiple teams, independent deploy needed |
| Modular Monolith | Team 5-20, clear domain boundaries | Need polyglot services |
| Microservices | Team > 20, independent scaling needed | Early-stage, small team |
| Serverless | Event-driven, spiky traffic | Long-running processes, cost predictability needed |
| Event-Driven | Async workflows, audit trails needed | Simple CRUD, low complexity |

### System Design Checklist
- [ ] Load estimation: peak QPS, storage growth per month
- [ ] Single points of failure identified and mitigated
- [ ] Data flow diagram (DFD) created
- [ ] Network topology documented
- [ ] Service communication patterns defined (sync vs async)
- [ ] Data consistency model chosen (strong, eventual, causal)
- [ ] Failure modes documented with recovery strategies
- [ ] Capacity planning for 10x current load

### Diagramming Standards
Use C4 Model for architecture documentation:
1. **Level 1 — System Context**: Shows your system in relation to users and external systems
2. **Level 2 — Container**: Shows high-level technology decisions (web app, API, database)
3. **Level 3 — Component**: Shows components within each container
4. **Level 4 — Code**: Shows class/module-level detail (only for complex areas)

Tools: Mermaid (in-repo), Excalidraw (collaborative), draw.io (detailed)

---

## Cross-Cutting Concerns

Address these before writing application code:
- **Logging**: Structured JSON, correlation IDs, log levels
- **Configuration**: Environment-based, secrets separate from config
- **Error handling**: Global error handler, typed errors, error codes
- **Health checks**: Liveness, readiness, startup probes
- **Graceful shutdown**: Drain connections, complete in-flight requests
- **Idempotency**: All write operations must be safely retryable
- **Rate limiting**: Per-user, per-endpoint, global
- **Request tracing**: Distributed trace context propagation

---

## External Skills (skills.sh)
```bash
npx skills add wshobson/agents/architecture-patterns
npx skills add supercent-io/skills-template/database-schema-design
npx skills add vercel-labs/agent-skills/vercel-composition-patterns
```
