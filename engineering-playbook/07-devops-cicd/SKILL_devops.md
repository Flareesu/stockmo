---
name: devops-cicd
description: Use this skill for CI/CD pipeline design, containerization (Docker), orchestration (Kubernetes), infrastructure as code (Terraform, Pulumi), environment management, build optimization, and deployment automation. Trigger whenever someone mentions "CI/CD", "pipeline", "Docker", "Kubernetes", "Terraform", "deploy", "GitHub Actions", "Jenkins", "build", "container", "infrastructure as code", or "environment".
---

# 07 — DevOps & CI/CD

## CI/CD Pipeline Stages

Every pipeline must follow this sequence:

```
1. Lint & Format Check     → Fail fast on style issues
2. Type Check              → Catch type errors before tests
3. Unit Tests              → Fast, isolated tests
4. Build                   → Compile/bundle the application
5. Integration Tests       → Test with real dependencies (DB, cache)
6. Security Scan           → SAST, dependency audit, secret scan
7. Docker Image Build      → Build container image
8. Image Scan              → Scan for vulnerabilities (Trivy, Snyk)
9. Deploy to Staging       → Automatic on main branch
10. E2E Tests on Staging   → Playwright/Cypress against staging
11. Manual Approval Gate   → Required for production
12. Deploy to Production   → Canary or blue-green
13. Smoke Tests            → Verify critical paths post-deploy
14. Notify                 → Slack/Teams notification
```

## Docker Standards

### Dockerfile Best Practices
- Use **multi-stage builds** to keep images small
- Pin base image versions: `node:20.11-alpine`, never `node:latest`
- Run as non-root user
- Use `.dockerignore` (mirror `.gitignore` + add `node_modules`, `.git`)
- Order layers by change frequency (rarely-changing first for cache hits)
- Health check instruction included
- Image size target: < 200MB for Node.js apps, < 50MB for Go apps

### Docker Compose (Local Development)
Every project must have a `docker-compose.yml` that starts ALL dependencies:
```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    depends_on: [db, redis]
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app_dev
  redis:
    image: redis:7-alpine
```
One command to start: `docker compose up`

## Infrastructure as Code

### Terraform Standards
- State stored remotely (S3 + DynamoDB lock, or Terraform Cloud)
- Modules for reusable components
- Environments separated by workspaces or directory structure
- Never hardcode values — use variables with defaults
- Plan review required before apply (in CI)
- Use `terraform fmt` and `terraform validate` in CI

### Environment Parity
| Aspect | Dev | Staging | Production |
|--------|-----|---------|-----------|
| Database | Local Docker | Managed (same engine) | Managed (same engine) |
| Config | .env file | Environment vars | Secrets manager |
| Scale | Single instance | 1 replica | Auto-scaled |
| Data | Seed data | Sanitized prod copy | Real data |

## Secrets Management
- Never commit secrets to git (use `.env.example` with placeholder values)
- Use secrets manager: AWS Secrets Manager, Vault, Doppler
- Rotate secrets on a schedule (90 days minimum)
- Separate secrets per environment
- Inject at runtime via environment variables, never bake into images

## Build Optimization
- Cache dependency installation layers (Docker layer caching, npm ci cache)
- Parallelize independent CI steps (lint + type check + unit tests)
- Use incremental builds (Turborepo, nx, or framework-native)
- Fail fast: run cheapest checks first (lint before tests)
- CI machine sizing: use larger runners for build steps, smaller for linting
- Target CI time: < 10 minutes for PR checks, < 20 minutes for full deploy pipeline

## Environment Management
- Every developer can spin up a full local env in one command
- Feature branch previews (Vercel preview deploys, Render review apps)
- Staging mirrors production config (same DB engine, same cache, same queues)
- Production deploys are automated after staging validation (no manual steps)

## CI/CD Checklist
- [ ] Pipeline defined as code (YAML in repository, not UI-configured)
- [ ] All checks run on every PR (no skipping CI)
- [ ] Secrets are injected via CI platform secrets, not hardcoded
- [ ] Docker images are scanned before deploy
- [ ] Staging deploy is automatic on merge to main
- [ ] Production deploy requires manual approval
- [ ] Rollback can be performed in < 5 minutes
- [ ] Deployment notifications go to team channel
- [ ] Build artifacts are versioned and stored (for rollback)
- [ ] CI caching is configured for dependencies and build outputs

---

## External Skills (skills.sh)
```bash
npx skills add supercent-io/skills-template/deployment-automation
npx skills add supercent-io/skills-template/vercel-deploy
npx skills add obra/superpowers/finishing-a-development-branch
```
