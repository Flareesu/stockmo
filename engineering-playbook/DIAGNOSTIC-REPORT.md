# Engineering Playbook — Diagnostic Report & Expansion Roadmap

> Generated: March 17, 2026
> Status: v1.0 Complete — 28 skills, 3,300+ lines of actionable guidance

---

## Diagnostic Summary

### Coverage Assessment

| Category | Skills | Status |
|----------|--------|--------|
| Planning & Discovery | 00, 21 | Complete |
| Architecture | 01 | Complete |
| Frontend | 02, 27 | Complete |
| Backend | 03, 04, 05 | Complete |
| Auth & Security | 06, 09 | Complete |
| Infrastructure & DevOps | 07, 08 | Complete |
| Quality Assurance | 10, 16, 25 | Complete |
| Performance | 11 | Complete |
| Observability | 12 | Complete |
| Cost Management | 13 | Complete |
| Documentation | 14 | Complete |
| Workflows | 15, 22, 23 | Complete |
| Compliance & Privacy | 17, 18, 19 | Complete |
| Incident Management | 20 | Complete |
| Analytics | 24 | Complete |
| Mobile | 26 | Complete |

### Metrics

- **28 skill files** with valid YAML frontmatter
- **98 external skills.sh references** across the playbook
- **3,300+ lines** of structured guidance
- **100+ checklist items** across all skills
- **120+ reference tables** for quick decision-making
- **75+ code examples** for implementation patterns

---

## Issues Found & Fixed

| Issue | Severity | Resolution |
|-------|----------|-----------|
| Skills 06-09 were undersized (< 100 lines) | Medium | Expanded with checklists, deeper content, and additional sections |
| Several skills lacked actionable checklists | Medium | Added implementation checklists to Auth, DevOps, Cloud, Security |
| Skill 06 missing API key management section | Medium | Added full API key lifecycle management |
| Skill 07 missing build optimization & env management | Medium | Added CI optimization, environment parity detail |
| Skill 08 missing disaster recovery section | High | Added RPO/RTO framework, backup strategy, DR runbook |
| Skill 09 missing penetration testing schedule | Medium | Added pentest cadence, SAST/DAST, bug bounty guidance |

---

## Gaps Identified — Recommended Expansion Skills (v2.0)

These are domains NOT yet covered that a senior lead engineer would want before building a production product:

### Priority 1 — High Impact, Add Next

| # | Proposed Skill | What It Covers | Why It's Needed |
|---|---------------|----------------|----------------|
| 28 | **AI/ML Integration** | LLM API integration, embedding pipelines, RAG architecture, prompt management, model evaluation, AI cost tracking | Every modern product now includes AI features; this is no longer optional |
| 29 | **Internationalization (i18n/l10n)** | Locale management, translation workflows, RTL support, date/currency formatting, pluralization rules | Global products fail without this; retrofitting i18n is 10x harder |
| 30 | **Payment Processing** | Stripe/payment provider integration, PCI compliance, subscription billing, invoicing, refund flows, webhook handling | Revenue-generating products need this hardened from day one |
| 31 | **Email & Notification Systems** | Transactional email (SendGrid/SES), push notifications, in-app notifications, notification preferences, template management | Core to user engagement; poorly built notifications cause churn |
| 32 | **Feature Flag Management** | LaunchDarkly/Unleash/Flagsmith setup, progressive rollouts, kill switches, experiment flags, flag lifecycle | Currently mentioned in Skill 22 but deserves full treatment for safe deploys |

### Priority 2 — Strategic Depth

| # | Proposed Skill | What It Covers |
|---|---------------|----------------|
| 33 | **Technical Debt Management** | Debt classification, debt register, paydown sprints, refactoring strategies, code health metrics |
| 34 | **Developer Experience (DX)** | Local dev setup speed, onboarding time, inner loop optimization, dev tooling, CLI tools |
| 35 | **Real-Time Systems** | WebSockets, SSE, pub/sub patterns, presence indicators, live cursors, conflict resolution |
| 36 | **Search Infrastructure** | Elasticsearch/Typesense/Algolia, indexing strategy, relevance tuning, faceting, autocomplete |
| 37 | **File Storage & Media** | Upload pipelines, CDN delivery, image processing, video transcoding, presigned URLs |
| 38 | **Background Processing & Workflows** | Temporal/Inngest, saga patterns, long-running workflows, state machines, retry strategies |

### Priority 3 — Specialized

| # | Proposed Skill | What It Covers |
|---|---------------|----------------|
| 39 | **Multi-Tenancy Architecture** | Tenant isolation strategies, shared vs dedicated DB, tenant-aware middleware |
| 40 | **GraphQL Specific** | Schema design, DataLoader, subscriptions, federation, persisted queries |
| 41 | **Serverless Patterns** | Cold start mitigation, function composition, Step Functions, edge computing |
| 42 | **Open Source Management** | OSS licensing, contribution guidelines, community management, release process |
| 43 | **Data Engineering** | ETL pipelines, data warehousing, event streaming, data quality, analytics engineering |

---

## Skills.sh Ecosystem — Additional Skills Worth Integrating

These high-value skills from skills.sh weren't referenced yet but align with playbook domains:

```bash
# AI/ML (for proposed Skill 28)
npx skills add vercel/ai/ai-sdk
npx skills add inferen-sh/skills/ai-image-generation

# Debugging & Development
npx skills add obra/superpowers/systematic-debugging
npx skills add obra/superpowers/verification-before-completion
npx skills add obra/superpowers/subagent-driven-development
npx skills add obra/superpowers/dispatching-parallel-agents
npx skills add obra/superpowers/executing-plans

# Marketing & Growth (for product teams)
npx skills add coreyhaines31/marketingskills/seo-audit
npx skills add coreyhaines31/marketingskills/content-strategy
npx skills add coreyhaines31/marketingskills/copywriting
npx skills add coreyhaines31/marketingskills/launch-strategy
npx skills add coreyhaines31/marketingskills/analytics-tracking
npx skills add coreyhaines31/marketingskills/marketing-psychology
npx skills add coreyhaines31/marketingskills/page-cro
npx skills add coreyhaines31/marketingskills/churn-prevention

# Infrastructure & Cloud
npx skills add microsoft/azure-skills/azure-ai
npx skills add microsoft/github-copilot-for-azure/azure-compute
npx skills add microsoft/azure-skills/azure-observability

# Code Quality & Architecture
npx skills add wshobson/agents/typescript-advanced-types
npx skills add wshobson/agents/architecture-patterns
npx skills add supercent-io/skills-template/code-refactoring
npx skills add supercent-io/skills-template/file-organization

# Mobile (for Skill 26 enrichment)
npx skills add expo/skills/building-native-ui
npx skills add expo/skills/native-data-fetching
npx skills add expo/skills/expo-deployment
npx skills add expo/skills/upgrading-expo
npx skills add expo/skills/expo-tailwind-setup

# Frameworks
npx skills add vercel-labs/next-skills/next-best-practices
npx skills add antfu/skills/vite
npx skills add antfu/skills/vitest
npx skills add antfu/skills/vue
npx skills add vercel/turborepo/turborepo

# Design & Polish
npx skills add pbakaus/impeccable/polish
npx skills add pbakaus/impeccable/critique
npx skills add pbakaus/impeccable/clarify
npx skills add pbakaus/impeccable/delight
npx skills add pbakaus/impeccable/bolder
```

---

## Improvement Ideas to Build on Top

### Idea 1: Interactive Playbook Dashboard (React Artifact)
Build a React app that visualizes the entire playbook as an interactive dependency graph where you can click into any skill, see its checklist progress, and track which skills your project has completed.

### Idea 2: Project Bootstrapper Skill
Create a meta-skill that asks about your project (type, team size, compliance needs, tech preferences) and generates a customized subset of the playbook with only the relevant skills, pre-configured checklists, and a scaffolded repository structure.

### Idea 3: Audit Runner
Build a skill that runs against an existing codebase and scores it against each playbook domain (0-100), identifying which skills need the most attention and generating a prioritized remediation plan.

### Idea 4: Onboarding Path Generator
Create a skill that generates a personalized reading path through the playbook based on a new hire's role (frontend, backend, full-stack, SRE, QA) and experience level.

### Idea 5: Playbook-as-CI
Convert each skill's checklist into automated CI checks where possible — linting rules that enforce naming conventions, GitHub Actions that verify ADRs exist, PR template enforcement, security header validation.

### Idea 6: Team Compliance Tracker
Build a spreadsheet or dashboard that tracks which playbook skills each team/service has adopted, with quarterly review cadence and gap analysis reporting.

---

## How to Install This Playbook

### For Claude Code / Agent Use
```bash
# Copy entire playbook to your project
cp -r engineering-playbook/ /path/to/your/project/.claude/skills/

# Or install individual skills
cp -r engineering-playbook/10-testing-qa/ ~/.claude/skills/testing-qa/
```

### For skills.sh Distribution
To publish this playbook to skills.sh, structure the repository as:
```
your-org/engineering-playbook/
├── 00-project-kickoff/SKILL.md
├── 01-architecture-design/SKILL.md
├── ...
└── 27-design-system/SKILL.md
```
Then users install with: `npx skills add your-org/engineering-playbook`

---

*This diagnostic was generated as part of the playbook development process. Re-run after v2.0 expansion.*
