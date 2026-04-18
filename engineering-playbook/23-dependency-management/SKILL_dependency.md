---
name: dependency-management
description: Use this skill for package auditing, dependency update cadence, license compliance, lockfile management, vulnerability remediation, and supply chain security. Trigger whenever someone mentions "dependencies", "npm audit", "package update", "Dependabot", "Renovate", "lockfile", "license compliance", "vulnerability", "supply chain", or "node_modules".
---

# 23 — Dependency Management

## Update Cadence

| Priority | Update Window | Examples |
|----------|-------------|---------|
| Critical security | Within 24 hours | CVE with known exploit |
| High security | Within 72 hours | CVE without known exploit |
| Major version | Quarterly, planned sprint | React 19 → 20, Next.js 15 → 16 |
| Minor/Patch | Monthly batch | Bug fixes, minor features |

## Automated Dependency Updates
Enable one of:
- **Dependabot** (GitHub native): good for simple repos
- **Renovate** (preferred): more flexible, group updates, auto-merge patches

### Renovate Configuration (Recommended)
```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "packageRules": [
    { "matchUpdateTypes": ["patch"], "automerge": true },
    { "matchUpdateTypes": ["minor"], "groupName": "minor-updates", "schedule": ["before 6am on Monday"] },
    { "matchUpdateTypes": ["major"], "groupName": "major-updates", "dependencyDashboardApproval": true }
  ]
}
```

## Lockfile Policy
- **Always commit lockfiles** (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`)
- Use `npm ci` (not `npm install`) in CI — installs exactly from lockfile
- Never manually edit lockfiles
- If lockfile conflicts in PR, regenerate with fresh install

## License Compliance

### Allowed Licenses (Default)
| License | Status | Notes |
|---------|--------|-------|
| MIT | Allowed | Most permissive |
| Apache 2.0 | Allowed | Patent grant included |
| BSD (2/3-clause) | Allowed | Simple attribution |
| ISC | Allowed | Simplified MIT |
| MPL 2.0 | Review | File-level copyleft |
| LGPL | Review | Dynamic linking usually OK |
| GPL | Blocked | Viral copyleft — avoid for proprietary software |
| AGPL | Blocked | Network use triggers copyleft |
| Unlicensed | Blocked | No license = all rights reserved |

### Audit Process
- Run `license-checker` or `license-report` in CI
- Block PR if new dependency introduces blocked license
- Quarterly manual review of dependency tree

## Vulnerability Management
- `npm audit` / `pip audit` runs in every CI build
- Critical/High: fail the build
- Medium: warn, create ticket, fix within 2 weeks
- Low: batch fix monthly
- If no fix available: document risk, set review reminder, consider alternatives

## Dependency Evaluation (Before Adding)

Before `npm install new-package`, evaluate:
- [ ] Active maintenance? (commits in last 6 months)
- [ ] Downloads? (> 10K weekly for Node.js packages)
- [ ] License compatible?
- [ ] Bundle size acceptable? (check on bundlephobia.com)
- [ ] Security history? (check Snyk advisor)
- [ ] Can we achieve this with existing deps or stdlib?
- [ ] TypeScript types included or available?

## External Skills (skills.sh)
```bash
npx skills add supercent-io/skills-template/security-best-practices
```
