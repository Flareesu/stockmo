---
name: data-privacy-compliance
description: Use this skill for GDPR compliance, CCPA compliance, data classification, data processing agreements, privacy by design, data retention policies, cookie consent, user data export/deletion, and regulatory requirements. Trigger whenever someone mentions "GDPR", "CCPA", "privacy", "compliance", "data protection", "DPA", "cookie consent", "data retention", "right to be forgotten", "data classification", or "SOC2".
---

# 19 — Data Privacy & Compliance

## Compliance Framework Selection

| Regulation | Applies When | Key Requirements |
|-----------|-------------|-----------------|
| GDPR | Users in EU/EEA | Consent, DPO, data portability, right to erasure, 72hr breach notification |
| CCPA/CPRA | Users in California (>50K records or >$25M revenue) | Opt-out of sale, data access, deletion rights |
| SOC 2 | B2B SaaS, enterprise customers | Security controls audit, annual certification |
| HIPAA | Health data in US | BAA required, encryption at rest+transit, audit logs |
| PCI DSS | Credit card processing | Never store full card numbers, annual compliance validation |

## Data Classification

| Level | Definition | Examples | Controls |
|-------|-----------|----------|----------|
| Public | Intentionally public | Marketing content, pricing | None |
| Internal | Business operational | Internal docs, metrics | Auth required |
| Confidential | Sensitive business data | Revenue, contracts, PII | Encrypted, access-logged |
| Restricted | Highest sensitivity | Passwords, SSN, health records | Encrypted at rest + transit, MFA, audit trail |

## Privacy by Design Checklist
- [ ] Data minimization: collect only what you need
- [ ] Purpose limitation: use data only for stated purpose
- [ ] Retention policy: auto-delete data after retention period
- [ ] Consent: explicit opt-in for non-essential data collection
- [ ] Access controls: least-privilege for all data access
- [ ] Encryption: at rest (AES-256) and in transit (TLS 1.3)
- [ ] Audit logging: who accessed what data and when
- [ ] Data portability: export user data in standard format (JSON/CSV)
- [ ] Right to erasure: delete all user data within 30 days of request
- [ ] Breach notification process documented

## Cookie Consent Implementation
- Show consent banner before setting non-essential cookies
- Categories: Necessary (no consent), Functional, Analytics, Marketing
- Store consent preference server-side (not just in a cookie)
- Respect "Do Not Track" and Global Privacy Control headers
- Re-consent required if categories change

## Data Retention Policy

| Data Type | Retention Period | After Expiry |
|----------|-----------------|-------------|
| Active user data | While account active | N/A |
| Deleted user data | 30 days (grace period) | Hard delete |
| Access logs | 90 days | Archive then delete |
| Financial records | 7 years (legal) | Archive encrypted |
| Analytics (aggregated) | Indefinite | N/A (no PII) |
| Session data | 24 hours | Auto-expire |

## User Data Export (GDPR Article 20)
- Format: JSON + CSV zip file
- Include: profile, content, activity, settings, communications
- Exclude: internal analytics, aggregated data, other users' data
- Delivery: within 30 days of request (target: 48 hours automated)

## Vendor Data Processing Agreements
Every third-party service that processes user data needs:
- [ ] Signed DPA (Data Processing Agreement)
- [ ] Sub-processor list reviewed
- [ ] Data residency confirmed (EU for GDPR)
- [ ] Breach notification clause (≤ 72 hours)
- [ ] Annual security review

## External Skills (skills.sh)
```bash
npx skills add supercent-io/skills-template/security-best-practices
```
