---
name: auth-security
description: Use this skill for implementing authentication, authorization, session management, OAuth/OIDC flows, JWT handling, RBAC/ABAC, multi-factor authentication, password policies, and API key management. Trigger whenever someone mentions "auth", "login", "signup", "OAuth", "JWT", "session", "RBAC", "permissions", "password", "MFA", "SSO", or "access control".
---

# 06 — Authentication & Authorization

## Authentication Strategy Selection

| Method | Best For | Avoid When |
|--------|----------|-----------|
| Session-based (cookies) | Traditional web apps, SSR | Pure API services |
| JWT (Bearer tokens) | SPAs, mobile apps, microservices | Need instant revocation |
| OAuth 2.0 / OIDC | Third-party login, enterprise SSO | Simple internal tools |
| API Keys | Server-to-server, developer APIs | End-user authentication |
| Passkeys / WebAuthn | High-security consumer apps | Legacy browser support needed |

## Password Policy
- Minimum 12 characters (NIST SP 800-63B)
- Check against breached password databases (HaveIBeenPwned API)
- No arbitrary complexity rules (uppercase, special char) — length matters more
- Hash with **Argon2id** (preferred) or bcrypt (minimum cost factor 12)
- Never log passwords, even hashed

## Session Management
- Session ID: Cryptographically random, minimum 128 bits
- Store server-side (Redis/DB), not in JWT
- Rotate session ID after login (prevent session fixation)
- Set cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax`, path-scoped
- Idle timeout: 30 minutes (configurable)
- Absolute timeout: 24 hours
- Invalidate all sessions on password change

## JWT Best Practices (When JWT Is Chosen)
- Sign with RS256 (asymmetric) for microservices, HS256 for monolith
- Access token TTL: 15 minutes maximum
- Refresh token TTL: 7-30 days, stored server-side, rotated on use
- Never store sensitive data in JWT payload (it's base64, not encrypted)
- Include: `sub`, `iat`, `exp`, `iss`, `aud`, `jti` (for revocation)
- Revocation strategy: token blacklist in Redis or short-lived tokens + refresh

## Authorization (RBAC)

### Permission Model
```
Role → has many → Permissions
User → has many → Roles
Permission = {resource}:{action}
Example: orders:read, orders:write, users:delete
```

### Enforcement Rules
- Check permissions at the **service layer**, not the controller
- Never trust client-side role checks alone
- Use middleware for route-level checks, service methods for row-level checks
- Log every authorization failure with user ID and attempted action

### Row-Level Security
For multi-tenant apps:
- Add `tenant_id` to every table
- Filter ALL queries by `tenant_id` at the repository layer
- Use PostgreSQL Row Level Security (RLS) as defense-in-depth

## OAuth 2.0 / OIDC Implementation
- Use Authorization Code flow with PKCE (even for server apps)
- Never use Implicit flow (deprecated)
- Validate `state` parameter to prevent CSRF
- Validate ID token signature, issuer, audience, and expiry
- Store refresh tokens encrypted at rest

## API Key Management
- Generate with cryptographically secure randomness (minimum 256 bits)
- Hash stored keys (SHA-256) — never store plaintext
- Prefix keys for identification: `sk_live_`, `sk_test_`, `pk_`
- Support key rotation without downtime (accept both old and new during transition)
- Log all key usage (who, when, which endpoint)
- Implement per-key rate limits and scope restrictions

## Security Checklist
- [ ] Password hashing uses Argon2id or bcrypt (cost 12+)
- [ ] Session IDs rotate after login
- [ ] Cookies set HttpOnly, Secure, SameSite
- [ ] JWT expiry is 15 minutes or less
- [ ] Refresh tokens are stored server-side and rotated on use
- [ ] MFA is available for sensitive operations
- [ ] Account lockout after 10 failed attempts (with exponential backoff)
- [ ] Password reset tokens expire in 1 hour
- [ ] All auth events are logged (login, logout, failed attempts, password changes)
- [ ] Row-level security enforced for multi-tenant data
- [ ] CORS whitelist is explicit (no wildcard in production)
- [ ] Rate limiting on auth endpoints (login, register, password reset)

---

## External Skills (skills.sh)
```bash
npx skills add better-auth/skills/better-auth-best-practices
npx skills add better-auth/skills/create-auth-skill
npx skills add supercent-io/skills-template/security-best-practices
```
