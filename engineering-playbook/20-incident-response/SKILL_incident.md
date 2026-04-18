---
name: incident-response
description: Use this skill for on-call processes, incident escalation, postmortems, runbooks, communication templates, blameless retrospectives, and disaster recovery. Trigger whenever someone mentions "incident", "on-call", "outage", "postmortem", "escalation", "disaster recovery", "runbook", "page", "downtime", or "blameless".
---

# 20 — Incident Response

## Severity Levels

| Severity | Definition | Response Time | Communication |
|----------|-----------|---------------|---------------|
| SEV-1 | Service down, data loss, security breach | Immediate (< 5 min) | All-hands war room, exec notification, status page |
| SEV-2 | Major feature degraded, significant user impact | < 15 min | Eng team + PM, status page update |
| SEV-3 | Minor feature issue, workaround exists | < 1 hour | Team Slack channel |
| SEV-4 | Cosmetic issue, minimal impact | Next business day | Ticket created |

## Incident Response Flow

```
1. DETECT   → Alert fires or user reports
2. TRIAGE   → Assign severity, identify incident commander
3. RESPOND  → Assemble team, begin diagnosis
4. MITIGATE → Apply fix or rollback to restore service
5. RESOLVE  → Verify full recovery, close incident
6. REVIEW   → Postmortem within 72 hours
```

## On-Call Standards
- Primary + secondary on-call rotation (1 week shifts)
- Maximum 2 pages per night average (reduce alert noise)
- Acknowledged within 5 minutes or auto-escalate to secondary
- On-call handoff document updated at each rotation
- Compensatory time off for overnight incidents

## Incident Commander Responsibilities
- Owns communication and coordination (not debugging)
- Updates status page every 15 minutes during SEV-1/2
- Decides when to escalate or call in additional help
- Documents timeline in real-time
- Calls "all clear" and initiates postmortem

## Communication Template (Status Page)

```
**[Investigating]** We are investigating reports of {issue description}.

**[Identified]** The issue has been identified as {root cause}. We are working on a fix.

**[Monitoring]** A fix has been deployed. We are monitoring for stability.

**[Resolved]** This incident has been resolved. Total duration: {X hours}. A postmortem will follow.
```

## Postmortem Template

```markdown
# Postmortem: {Incident Title}
**Date:** YYYY-MM-DD
**Severity:** SEV-X
**Duration:** X hours Y minutes
**Impact:** {Number of users affected, revenue impact if applicable}
**Authors:** {Names}

## Summary
{2-3 sentence summary of what happened}

## Timeline (UTC)
| Time | Event |
|------|-------|
| 14:00 | Alert fired for elevated 5xx rate |
| 14:05 | On-call engineer acknowledged |
| 14:15 | Root cause identified: bad database migration |
| 14:30 | Rollback deployed |
| 14:35 | Service restored |

## Root Cause
{Technical explanation of what went wrong}

## Contributing Factors
- {Factor 1}
- {Factor 2}

## What Went Well
- {Positive observation}

## What Went Poorly
- {Negative observation}

## Action Items
| Action | Owner | Priority | Due Date |
|--------|-------|----------|---------|
| Add integration test for migration | @engineer | P1 | 2026-03-24 |
| Improve alerting threshold | @sre | P2 | 2026-03-31 |

## Lessons Learned
{Key takeaway for the team}
```

### Postmortem Rules
- Blameless — focus on systems, not individuals
- Required for all SEV-1 and SEV-2 incidents
- Published within 72 hours
- Reviewed in team meeting
- Action items tracked to completion

## External Skills (skills.sh)
```bash
npx skills add obra/superpowers/systematic-debugging
npx skills add supercent-io/skills-template/workflow-automation
```
