---
name: security-hardening
description: Use this skill for application security hardening, OWASP Top 10 mitigation, secrets management, supply chain security, penetration testing, security headers, input sanitization, and threat modeling. Trigger whenever someone mentions "security", "OWASP", "XSS", "CSRF", "SQL injection", "secrets", "vulnerability", "penetration test", "threat model", "security headers", or "supply chain security".
---

# 09 — Security Hardening

## OWASP Top 10 Mitigation Checklist

| # | Vulnerability | Mitigation |
|---|-------------|-----------|
| A01 | Broken Access Control | RBAC at service layer, deny by default, test authorization in integration tests |
| A02 | Cryptographic Failures | TLS 1.3 everywhere, AES-256-GCM for data at rest, never roll your own crypto |
| A03 | Injection | Parameterized queries only, input validation with Zod, CSP headers |
| A04 | Insecure Design | Threat modeling in design phase, abuse case stories, security review gates |
| A05 | Security Misconfiguration | Automated config scanning, least-privilege IAM, disable unused features |
| A06 | Vulnerable Components | Automated dependency scanning (Dependabot, Snyk), update within 72hrs for critical |
| A07 | Auth Failures | MFA, account lockout, bcrypt/argon2, session management (see Skill 06) |
| A08 | Data Integrity Failures | CI/CD pipeline integrity, signed artifacts, verify dependency checksums |
| A09 | Logging Failures | Log all auth events, access control failures, input validation failures |
| A10 | SSRF | Allowlist outbound URLs, block internal IPs, validate URL schemas |

## Security Headers (Required)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Input Validation Rules
- Validate ALL input on the server, regardless of client-side validation
- Use allowlists, not blocklists
- Validate type, length, range, and format
- Sanitize HTML output (DOMPurify for user-generated content)
- Never construct SQL, HTML, or shell commands from string concatenation

## Secrets Management
- Use a secrets manager (AWS Secrets Manager, Vault, Doppler)
- Rotate secrets every 90 days
- Audit secret access logs monthly
- Pre-commit hooks to block secret commits (git-secrets, detect-secrets)
- Separate secrets per environment, per service

## Threat Modeling (STRIDE)

For every new feature, evaluate:
| Threat | Question |
|--------|---------|
| **S**poofing | Can someone impersonate a user or service? |
| **T**ampering | Can someone modify data they shouldn't? |
| **R**epudiation | Can someone deny performing an action? |
| **I**nformation Disclosure | Can sensitive data leak? |
| **D**enial of Service | Can the service be overwhelmed? |
| **E**levation of Privilege | Can someone gain unauthorized access? |

## Dependency Security
- Enable Dependabot or Renovate for automated PRs
- Run `npm audit` / `pip audit` in CI — fail on critical/high
- Pin exact versions in lockfiles
- Review dependency tree for unnecessary transitive deps
- Evaluate new dependencies: maintenance activity, download count, license

## Penetration Testing Schedule
- Annual third-party penetration test (minimum)
- Quarterly automated DAST scans (OWASP ZAP)
- SAST in every CI run (Semgrep, CodeQL, SonarQube)
- Bug bounty program for mature products (HackerOne, Bugcrowd)
- Red team exercises for critical infrastructure annually

## Incident Response for Security Events
- Documented escalation path for security incidents
- Ability to revoke all sessions within 5 minutes
- Ability to rotate all API keys within 15 minutes
- Forensic logging: who accessed what, when, from where
- Communication template for security disclosures

## Security Hardening Checklist
- [ ] All OWASP Top 10 mitigations implemented
- [ ] Security headers configured and validated (securityheaders.com)
- [ ] All user input validated server-side
- [ ] SQL queries use parameterized statements only
- [ ] File uploads restricted by type, size, and scanned for malware
- [ ] CORS configured with explicit origin allowlist
- [ ] Rate limiting on all public endpoints
- [ ] Secrets stored in secrets manager (not env files in production)
- [ ] Pre-commit hooks block secret commits
- [ ] Dependency vulnerabilities scanned in CI
- [ ] SAST scanner runs on every PR
- [ ] CSP headers block inline scripts
- [ ] Admin interfaces behind VPN or IP allowlist
- [ ] Audit log for all data access and mutations

---

## External Skills (skills.sh)
```bash
npx skills add supercent-io/skills-template/security-best-practices
npx skills add squirrelscan/skills/audit-website
npx skills add pbakaus/impeccable/harden
```
