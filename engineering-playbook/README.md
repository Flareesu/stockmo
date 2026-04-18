# Engineering Playbook — Full-Stack Product Development

> The definitive skill library for building production-grade products from zero to scale.
> Written from the perspective of a senior lead engineer who has shipped at every layer of the stack.

---

## Philosophy

This playbook operates on three principles:

1. **Nothing ships without a plan.** Every feature, every service, every deploy has a written spec, a reviewed design, and a tested rollback path.
2. **Ownership is end-to-end.** The person who writes the code owns the deploy, the monitoring, the on-call, and the postmortem.
3. **Quality is not a phase.** Testing, security, accessibility, and performance are built into every skill — not bolted on at the end.

---

## Playbook Structure

Each numbered directory is a **skill domain**. Each contains a `SKILL.md` that acts as the authoritative playbook for that domain. Skills are designed to be read in order for greenfield projects, but can be consulted independently for brownfield work.

| #  | Domain                        | What It Covers                                                   |
|----|-------------------------------|------------------------------------------------------------------|
| 00 | Project Kickoff               | Discovery, PRD, stakeholder alignment, scope definition          |
| 01 | Architecture Design           | System design, tech stack selection, ADRs, diagramming           |
| 02 | Frontend Engineering          | UI framework, component architecture, state, routing, bundling   |
| 03 | Backend Engineering           | Server framework, business logic, middleware, job queues          |
| 04 | Database Design               | Schema design, migrations, indexing, query optimization           |
| 05 | API Design                    | REST/GraphQL conventions, versioning, pagination, rate limiting   |
| 06 | Auth & Security               | Authentication flows, authorization, RBAC, OAuth/OIDC, sessions  |
| 07 | DevOps & CI/CD                | Pipelines, containerization, IaC, environment management         |
| 08 | Cloud Infrastructure          | Provider selection, networking, scaling, managed services         |
| 09 | Security Hardening            | OWASP, secrets management, supply chain, penetration testing     |
| 10 | Testing & QA                  | Unit, integration, E2E, load, contract, visual regression        |
| 11 | Performance Optimization      | Caching, CDN, bundle size, rendering, database query tuning      |
| 12 | Monitoring & Observability    | Logging, metrics, tracing, alerting, dashboards, SLOs            |
| 13 | FinOps & Cost Management      | Cloud budgets, right-sizing, reserved instances, cost attribution |
| 14 | Documentation                 | Technical docs, API docs, runbooks, onboarding guides            |
| 15 | Git Workflow                  | Branching strategy, commit conventions, PR process, code review  |
| 16 | Error Handling & Debugging    | Error boundaries, structured logging, debugging strategies       |
| 17 | Accessibility                 | WCAG compliance, screen reader testing, a11y automation          |
| 18 | SEO & Web Vitals              | Core Web Vitals, meta tags, structured data, crawlability        |
| 19 | Data Privacy & Compliance     | GDPR, CCPA, DPA, data classification, retention policies         |
| 20 | Incident Response             | On-call, escalation, postmortems, runbooks, blameless culture    |
| 21 | Team Processes                | Agile/Scrum, estimation, sprint planning, retros, RFC process    |
| 22 | Release Management            | Versioning, feature flags, canary deploys, rollback procedures   |
| 23 | Dependency Management         | Package auditing, update cadence, license compliance, lockfiles  |
| 24 | Analytics & Tracking          | Event taxonomy, A/B testing, funnels, product metrics            |
| 25 | API Collection & Management   | Postman/Bruno workflows, contract testing, mock servers          |
| 26 | Mobile Engineering            | React Native/Flutter, app store, deep linking, push notifications|
| 27 | Design System                 | Tokens, component library, Storybook, visual regression          |

---

## Skills.sh Ecosystem Integration

This playbook cross-references installable skills from the [skills.sh](https://skills.sh) ecosystem. Look for the `## External Skills` section in each SKILL.md for `npx skills add` commands that extend your agent with domain-specific best practices from the community.

---

## How to Use This Playbook

**For a new project:** Read skills 00 through 05 sequentially. Then selectively consult 06+ based on your requirements.

**For joining an existing project:** Start with 15 (Git Workflow), then 01 (Architecture) to understand the system, then the domain most relevant to your first ticket.

**For an audit:** Run through each SKILL.md checklist section against your current codebase and infrastructure.

---

## Quick Start Checklist

Before writing any production code, confirm:

- [ ] PRD is written and stakeholder-approved (Skill 00)
- [ ] Architecture Decision Records exist (Skill 01)
- [ ] Tech stack is chosen with rationale documented (Skill 01)
- [ ] Repository is bootstrapped with linting, formatting, CI (Skill 07, 15)
- [ ] Auth strategy is defined (Skill 06)
- [ ] Database schema v1 is designed and reviewed (Skill 04)
- [ ] API contract is drafted (Skill 05)
- [ ] Testing strategy is agreed upon (Skill 10)
- [ ] Monitoring and alerting baseline is configured (Skill 12)
- [ ] Security threat model exists (Skill 09)
- [ ] Compliance requirements are identified (Skill 19)
- [ ] Cost budget is estimated (Skill 13)
- [ ] On-call rotation and escalation paths are defined (Skill 20)
