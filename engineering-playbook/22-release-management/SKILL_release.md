---
name: release-management
description: Use this skill for semantic versioning, feature flags, canary deployments, blue-green deployments, rollback procedures, changelog generation, and release train processes. Trigger whenever someone mentions "release", "versioning", "semver", "feature flag", "canary deploy", "blue-green", "rollback", "changelog", "release notes", or "deployment strategy".
---

# 22 — Release Management

## Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH
  │      │     └── Bug fixes (backward compatible)
  │      └──────── New features (backward compatible)
  └─────────────── Breaking changes
```

### When to Bump
| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| Bug fix, security patch | PATCH (1.0.0 → 1.0.1) | Fix null pointer in checkout |
| New feature, no breaking changes | MINOR (1.0.0 → 1.1.0) | Add search filter |
| Breaking API change, major refactor | MAJOR (1.0.0 → 2.0.0) | Remove deprecated endpoint |

## Feature Flags

### Implementation
Use a feature flag service (LaunchDarkly, Unleash, Flagsmith, or custom):
```typescript
if (featureFlags.isEnabled('new-checkout-flow', { userId })) {
  return <NewCheckoutFlow />;
}
return <LegacyCheckoutFlow />;
```

### Flag Lifecycle
1. **Create** flag in code + flag service (default: off)
2. **Test** on staging, then enable for internal users
3. **Rollout** gradually: 5% → 25% → 50% → 100%
4. **Monitor** metrics at each stage, auto-rollback on error spike
5. **Clean up** — remove flag code within 2 sprints of 100% rollout

### Flag Naming Convention
```
{scope}-{feature}-{variant}
Example: checkout-new-flow-enabled
Example: search-ai-suggestions-percentage
```

### Stale Flag Policy
- Flags at 100% for > 30 days: remove the flag, keep the new code
- Flags at 0% for > 30 days: remove the flag AND the dead code
- Monthly audit of all active flags

## Deployment Strategies

| Strategy | Risk | Complexity | Best For |
|----------|------|-----------|----------|
| Rolling | Low | Low | Most deployments |
| Blue-Green | Low | Medium | Zero-downtime requirement |
| Canary | Very Low | High | High-traffic services |
| Feature Flag | Very Low | Medium | Individual features |

### Canary Deployment Process
1. Deploy new version to 5% of instances
2. Monitor error rate, latency, business metrics for 15 minutes
3. If metrics healthy: expand to 25%, then 50%, then 100%
4. If metrics degrade: auto-rollback to previous version
5. Alert team on any auto-rollback

## Rollback Procedure
1. Identify the problem (which deploy, which commit)
2. Revert to last known good version (one command)
3. Verify rollback restored service
4. Investigate root cause on a branch
5. Fix, test in staging, re-deploy with monitoring

### Rollback Requirements
- Every deploy must be rollback-capable within 5 minutes
- Database migrations must be backward-compatible (no rollback-blocking DDL)
- Rollback tested quarterly in production drills

## Changelog (Keep a Changelog Format)
```markdown
## [1.2.0] - 2026-03-17
### Added
- User search with autocomplete
- Export to CSV for reports

### Changed
- Improved checkout loading speed by 40%

### Fixed
- Login redirect loop on expired sessions

### Security
- Updated dependency X to patch CVE-2026-XXXXX
```

## External Skills (skills.sh)
```bash
npx skills add obra/superpowers/finishing-a-development-branch
npx skills add supercent-io/skills-template/deployment-automation
```
