---
name: analytics-tracking
description: Use this skill for event taxonomy design, analytics implementation, A/B testing, funnel analysis, product metrics (AARRR/HEART), tracking plans, and data pipeline setup. Trigger whenever someone mentions "analytics", "tracking", "events", "A/B test", "funnel", "conversion", "product metrics", "Mixpanel", "Amplitude", "PostHog", "Google Analytics", or "experiment".
---

# 24 — Analytics & Tracking

## Event Taxonomy

### Naming Convention
```
{object}_{action}
Examples:
  page_viewed
  button_clicked
  form_submitted
  user_signed_up
  order_completed
  search_performed
  feature_activated
```

### Rules
- snake_case for all event names
- Past tense for actions (viewed, clicked, submitted)
- Object first, then action (user_signed_up, not signed_up_user)
- Never include PII in event properties (no emails, names, IPs)
- Include context: page, source, variant (for A/B tests)

### Standard Event Properties
Every event should include:
```json
{
  "event": "button_clicked",
  "properties": {
    "page": "/dashboard",
    "component": "export-dropdown",
    "label": "Export CSV",
    "user_id": "anonymous-hash",
    "session_id": "sess-abc",
    "timestamp": "2026-03-17T12:00:00Z",
    "platform": "web",
    "app_version": "2.4.0"
  }
}
```

## Tracking Plan

Create a spreadsheet before implementation:

| Event | Category | Trigger | Properties | Owner | Status |
|-------|----------|---------|-----------|-------|--------|
| page_viewed | Navigation | Route change | page, referrer | Frontend | Implemented |
| user_signed_up | Activation | Registration complete | method (email/google/github) | Backend | Implemented |
| feature_used | Engagement | Any core action | feature_name, context | Frontend | Planned |

## Product Metrics Frameworks

### AARRR (Pirate Metrics)
| Stage | Metric | Example |
|-------|--------|---------|
| **A**cquisition | How users find you | Visits by source, signup rate |
| **A**ctivation | First value moment | Completed onboarding, first action |
| **R**etention | Users coming back | D1/D7/D30 retention, WAU/MAU |
| **R**evenue | Monetization | Conversion to paid, ARPU, LTV |
| **R**eferral | Users inviting others | Referral rate, viral coefficient |

### North Star Metric
Define ONE metric that best captures value delivery:
- SaaS: Weekly active teams completing core workflow
- Marketplace: Weekly transactions
- Content: Weekly engaged reading time

## A/B Testing Standards
- Minimum sample size calculated before launch (use Evan Miller calculator)
- Run for minimum 2 full business cycles (typically 2 weeks)
- Primary metric defined before launch (no fishing for significance)
- Statistical significance threshold: p < 0.05
- Track guardrail metrics (don't improve conversion by breaking retention)
- Document results in experiment log regardless of outcome

## Implementation Architecture
```
Client (browser/app)
  → Analytics SDK (Segment, PostHog, or custom)
    → Event queue (batched, max 30s delay)
      → Analytics API
        → Data warehouse (BigQuery, Snowflake)
          → BI tool (Metabase, Looker, Mode)
```

## External Skills (skills.sh)
```bash
npx skills add coreyhaines31/marketingskills/analytics-tracking
npx skills add supercent-io/skills-template/data-analysis
```
