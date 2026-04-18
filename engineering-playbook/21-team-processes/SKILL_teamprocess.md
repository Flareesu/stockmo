---
name: team-processes
description: Use this skill for Agile/Scrum processes, sprint planning, estimation, retrospectives, RFC process, team rituals, engineering levels, and technical decision-making frameworks. Trigger whenever someone mentions "sprint", "agile", "scrum", "kanban", "retro", "retrospective", "estimation", "story points", "RFC", "standup", "planning", or "team process".
---

# 21 — Team Processes

## Sprint Cadence (2-Week Sprints)

| Day | Event | Duration | Purpose |
|-----|-------|----------|---------|
| Mon W1 | Sprint Planning | 2 hours | Commit to sprint scope |
| Daily | Standup | 15 min | Blockers, progress, plan |
| Wed W1 | Backlog Refinement | 1 hour | Groom upcoming stories |
| Thu W2 | Sprint Review/Demo | 1 hour | Show completed work to stakeholders |
| Fri W2 | Retrospective | 1 hour | What to improve, action items |

## Estimation Framework

### T-Shirt Sizing for Roadmap
| Size | Effort | Calendar Time |
|------|--------|---------------|
| XS | < 1 day | 1 day |
| S | 1-3 days | 1 week |
| M | 1-2 weeks | 2-3 weeks |
| L | 2-4 weeks | 1-2 months |
| XL | > 1 month | Needs decomposition |

### Story Points for Sprint Work
- 1 point: trivial (config change, copy update)
- 2 points: small (single function, simple UI change)
- 3 points: moderate (new endpoint with tests, new component)
- 5 points: significant (new feature, complex integration)
- 8 points: large (new service, major refactor) — consider splitting
- 13 points: too big — MUST be split

## RFC Process (Request for Comments)

### When to Write an RFC
- New service or major feature
- Changing shared infrastructure
- Adopting new technology
- Breaking changes to APIs
- Process changes affecting multiple teams

### RFC Template
```markdown
# RFC: {Title}
**Author:** {Name}  **Date:** YYYY-MM-DD  **Status:** Draft | In Review | Accepted | Rejected

## Problem Statement
{What problem are we solving?}

## Proposed Solution
{How do we solve it?}

## Alternatives Considered
{What else did we evaluate and why not?}

## Trade-offs
{What are we giving up?}

## Implementation Plan
{High-level steps and timeline}

## Open Questions
{Unresolved decisions}
```

### RFC Lifecycle
1. Author writes draft (2-3 days)
2. Share for async review (5 business days minimum)
3. Address feedback, revise
4. Decision meeting if needed (30 min)
5. Accept, reject, or request revision
6. Accepted RFCs become ADRs (Skill 01)

## Retrospective Format (Start/Stop/Continue)
- **Start**: What should we begin doing?
- **Stop**: What should we stop doing?
- **Continue**: What's working well?
- Generate 2-3 action items with owners and due dates
- Review previous retro action items first

## Definition of Ready (for Sprint Planning)
A story is ready for sprint when:
- [ ] Acceptance criteria are clear and testable
- [ ] Dependencies are identified and unblocked
- [ ] Design/UX is approved (if applicable)
- [ ] Story is estimated (≤ 8 points)
- [ ] Technical approach is agreed upon

## External Skills (skills.sh)
```bash
npx skills add obra/superpowers/writing-plans
npx skills add obra/superpowers/executing-plans
npx skills add obra/superpowers/dispatching-parallel-agents
npx skills add supercent-io/skills-template/task-planning
```
