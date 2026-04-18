---
name: testing-qa
description: Use this skill for testing strategy, unit testing, integration testing, end-to-end testing, load testing, contract testing, visual regression testing, test-driven development, and quality assurance processes. Trigger whenever someone mentions "test", "testing", "QA", "unit test", "integration test", "E2E", "Playwright", "Cypress", "Jest", "Vitest", "load test", "TDD", "test coverage", "regression", or "quality assurance".
---

# 10 — Testing & QA

## Testing Pyramid

```
        ╱ E2E Tests ╲           Few, slow, expensive
       ╱─────────────╲
      ╱ Integration    ╲        Moderate count
     ╱─────────────────╲
    ╱    Unit Tests      ╲      Many, fast, cheap
   ╱─────────────────────╲
```

### Distribution Target
| Type | Count | Speed | Coverage Purpose |
|------|-------|-------|-----------------|
| Unit | ~70% of tests | < 10ms each | Logic correctness |
| Integration | ~20% of tests | < 1s each | Component interactions |
| E2E | ~10% of tests | < 30s each | Critical user flows |

## Unit Testing Standards

### Rules
- Test behavior, not implementation
- One assertion per logical concept (multiple `expect` calls are fine if testing one thing)
- Use the AAA pattern: Arrange → Act → Assert
- Name tests: `should {expected behavior} when {condition}`
- Mock external dependencies, never mock the thing you're testing
- Test edge cases: null, undefined, empty string, zero, negative, max values, boundary conditions

### Coverage Targets
| Metric | Target | Hard Minimum |
|--------|--------|-------------|
| Line coverage | 80% | 70% |
| Branch coverage | 75% | 60% |
| Critical path coverage | 100% | 95% |

### What NOT to Unit Test
- Third-party library internals
- Simple getters/setters with no logic
- Framework configuration
- Auto-generated code

## Integration Testing

### What to Integration Test
- Database queries (use test database, not mocks)
- API endpoints (use supertest or similar)
- Service-to-service calls
- Cache read/write behavior
- Queue publish/consume
- Authentication flows

### Test Database Strategy
- Use Docker containers for test databases
- Run migrations before test suite
- Truncate tables between tests (not drop/recreate — too slow)
- Use transactions with rollback for test isolation when possible

## End-to-End Testing

### Tool: Playwright (Recommended)
- Run against staging environment
- Test the top 10-20 critical user flows only
- Use page object model for maintainability
- Configure retries (flaky E2E tests are inevitable)
- Run in CI on a schedule + before production deploys
- Screenshot on failure for debugging

### Critical Flows to Always Cover
- [ ] User signup and login
- [ ] Core product action (create, edit, delete primary entity)
- [ ] Payment flow (if applicable)
- [ ] Search functionality
- [ ] Error states (404 page, server error page)

## Load Testing

### Tool: k6 (Recommended)
- Test against staging with production-like data volume
- Scenarios: spike test, soak test, stress test, breakpoint test
- Establish baseline metrics before optimization
- Run before every major release

### Key Metrics
| Metric | Target |
|--------|--------|
| p50 response time | < 200ms |
| p95 response time | < 500ms |
| p99 response time | < 1000ms |
| Error rate | < 0.1% |
| Throughput | Defined per service |

## Contract Testing
For microservices: use Pact or similar to verify API contracts between services.
- Consumer defines expected interactions
- Provider verifies it can satisfy them
- Run in CI for both consumer and provider

## Pre-Merge Checklist (QA Gate)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No new lint warnings
- [ ] Coverage thresholds met
- [ ] No known security vulnerabilities in dependencies
- [ ] Manual QA completed for UI changes (screenshot attached)
- [ ] Accessibility check passed (axe-core in tests)

---

## External Skills (skills.sh)
```bash
npx skills add obra/superpowers/test-driven-development
npx skills add anthropics/skills/webapp-testing
npx skills add supercent-io/skills-template/backend-testing
npx skills add supercent-io/skills-template/testing-strategies
npx skills add currents-dev/playwright-best-practices-skill/playwright-best-practices
```
