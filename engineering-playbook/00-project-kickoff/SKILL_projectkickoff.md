---
name: project-kickoff
description: Use this skill at the very start of any new product, feature, or service. Covers discovery, requirements gathering, PRD creation, stakeholder alignment, scope definition, success metrics, risk assessment, and timeline estimation. Trigger whenever someone says "new project", "start building", "product requirements", "PRD", "project plan", "scope document", "feature spec", or "kickoff".
---

# 00 — Project Kickoff

Everything starts here. No code is written until this skill is complete.

## Phase 1: Discovery & Problem Definition

### Problem Statement
Write a single paragraph that answers:
- **Who** has the problem?
- **What** is the problem?
- **Why** does it matter now?
- **What happens** if we do nothing?

### User Research Inputs
Before defining solutions, gather:
- User interviews (minimum 5 for B2C, 3 for internal tools)
- Existing analytics on the problem area
- Support tickets / bug reports related to the problem
- Competitor analysis (how do others solve this?)

### Assumptions Log
Create a table of every assumption you're making:

| # | Assumption | Risk if Wrong | Validation Method | Status |
|---|-----------|---------------|-------------------|--------|
| 1 | Users want X | High | A/B test | Unvalidated |

---

## Phase 2: Product Requirements Document (PRD)

Every PRD must contain these sections:

### 2.1 Overview
- Problem statement (from Phase 1)
- Proposed solution (one paragraph)
- Success criteria (measurable, time-bound)

### 2.2 User Stories
Format: `As a [persona], I want to [action] so that [outcome].`
- Prioritize using MoSCoW: Must have / Should have / Could have / Won't have
- Each story must have acceptance criteria

### 2.3 Functional Requirements
- Numbered list (FR-001, FR-002...) for traceability
- Each requirement is testable and unambiguous
- Include edge cases inline

### 2.4 Non-Functional Requirements
Cover every category:
- **Performance**: Response time targets, throughput, concurrent users
- **Scalability**: Expected growth, scaling strategy
- **Availability**: Uptime target (99.9%? 99.99%?)
- **Security**: Authentication, authorization, data sensitivity
- **Compliance**: GDPR, CCPA, SOC2, HIPAA — which apply?
- **Accessibility**: WCAG level target (AA minimum)
- **Internationalization**: Supported locales, RTL support needed?

### 2.5 Out of Scope
Explicitly list what this project does NOT include. This prevents scope creep.

### 2.6 Technical Constraints
- Existing systems to integrate with
- Technology mandates from org
- Budget constraints
- Team skill constraints
- Timeline constraints

### 2.7 Dependencies
| Dependency | Owner | Risk | Mitigation |
|-----------|-------|------|-----------|
| Payment provider API | External | Medium | Build abstraction layer |

### 2.8 Milestones & Timeline

| Milestone | Target Date | Exit Criteria |
|----------|------------|---------------|
| Design Complete | Week 2 | Figma reviewed and approved |
| Backend API v1 | Week 4 | All endpoints passing integration tests |
| MVP Launch | Week 8 | All P0 stories complete, monitoring live |

---

## Phase 3: Stakeholder Alignment

### RACI Matrix
| Decision | Responsible | Accountable | Consulted | Informed |
|---------|------------|-------------|-----------|----------|
| Tech stack | Lead Engineer | CTO | Team | PM |
| UX decisions | Designer | PM | Eng Lead | Stakeholders |
| Launch date | PM | VP Product | Eng Lead | All |

### Sign-off Checklist
- [ ] Engineering lead has reviewed and approved technical feasibility
- [ ] Design lead has reviewed UX requirements
- [ ] Security has reviewed compliance requirements
- [ ] Product owner has prioritized all user stories
- [ ] Stakeholders have signed off on timeline and scope

---

## Phase 4: Risk Assessment

### Risk Register
| Risk | Probability | Impact | Mitigation | Owner |
|------|------------|--------|-----------|-------|
| Third-party API instability | Medium | High | Build circuit breaker, fallback | Backend lead |
| Scope creep | High | High | Strict PRD sign-off, change request process | PM |
| Key person dependency | Medium | High | Pair programming, documentation | Eng lead |

---

## Phase 5: Definition of Done (Global)

A feature is "done" when:
- [ ] Code is written, reviewed, and merged
- [ ] Unit tests pass (coverage threshold met)
- [ ] Integration tests pass
- [ ] Accessibility audit passes
- [ ] Performance budget met
- [ ] Security review complete (if applicable)
- [ ] Documentation updated
- [ ] Monitoring and alerting configured
- [ ] Product owner has accepted the story
- [ ] Deployed to staging, validated, and promoted to production

---

## External Skills (skills.sh)
```bash
npx skills add obra/superpowers/writing-plans
npx skills add obra/superpowers/brainstorming
npx skills add github/awesome-copilot/prd
npx skills add supercent-io/skills-template/task-planning
```
