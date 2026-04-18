---
name: finops-cost-management
description: Use this skill for cloud cost optimization, budget forecasting, reserved instance planning, right-sizing infrastructure, cost attribution, FinOps practices, and build-vs-buy decisions. Trigger whenever someone mentions "cost", "FinOps", "budget", "cloud spend", "right-sizing", "reserved instances", "cost optimization", "billing", "savings", or "build vs buy".
---

# 13 — FinOps & Cost Management

## Cost Estimation Before Building

### Per-Service Cost Model
For every new service, estimate:
| Line Item | Monthly Cost | Notes |
|----------|-------------|-------|
| Compute (instances/containers) | $ | Size × count × hours |
| Database (managed) | $ | Instance + storage + IOPS |
| Cache (Redis/Memcached) | $ | Instance size |
| Storage (S3/GCS) | $ | GB stored + requests |
| CDN (bandwidth) | $ | GB transferred |
| Third-party APIs | $ | Calls × price per call |
| Monitoring/Logging | $ | GB ingested/stored |
| DNS + Certificates | $ | Usually minimal |
| **Total** | **$** | |

### Cost Per User Metric
Calculate and track: `Total infrastructure cost / Monthly Active Users`
- Seed stage: $0.50-2.00 per MAU is normal
- Scale stage target: < $0.10 per MAU
- Alert if cost-per-user trends upward for 3 consecutive months

## Optimization Strategies

### Right-Sizing
- Review instance utilization monthly
- If average CPU < 40%, downsize
- If average memory < 50%, downsize
- Use spot/preemptible instances for: batch jobs, dev/staging, CI runners
- Auto-scaling with aggressive scale-down policies

### Reserved Instances / Savings Plans
- Commit only after 3+ months of stable baseline usage
- Start with 1-year commitments (not 3-year until patterns are proven)
- Use convertible reservations for flexibility
- Target: 70% baseline covered by reservations, 30% on-demand for burst

### Storage Optimization
- Lifecycle policies: move to cold storage after 30-90 days
- Delete unused snapshots and old backups monthly
- Compress logs before archival
- Use intelligent tiering for unpredictable access patterns

### Network Cost Reduction
- Keep traffic within the same AZ when possible (cross-AZ transfer costs)
- Use VPC endpoints for AWS service calls (avoids NAT gateway costs)
- CDN for static content (cheaper than origin bandwidth)
- Compress API responses (gzip/brotli)

## Cost Attribution
- Tag ALL resources with: `team`, `service`, `environment`, `cost-center`
- Enforce tagging in Terraform/IaC (fail deploy if missing)
- Monthly cost review per team/service
- Anomaly alerts: > 20% increase from previous month

## Build vs Buy Decision Framework
| Factor | Build | Buy/SaaS |
|--------|-------|----------|
| Core differentiator? | Yes → Build | No → Buy |
| Team has expertise? | Yes | Doesn't matter |
| Time to market critical? | Buy | Build if long-term |
| Ongoing maintenance cost | Factor in 2x dev time | Factor in subscription growth |

---

## External Skills (skills.sh)
```bash
npx skills add microsoft/azure-skills/azure-quotas
```
