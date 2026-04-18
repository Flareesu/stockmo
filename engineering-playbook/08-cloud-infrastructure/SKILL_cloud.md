---
name: cloud-infrastructure
description: Use this skill for cloud provider selection, networking (VPC, subnets, load balancers), auto-scaling, managed services selection, multi-region architecture, CDN configuration, and cloud-native patterns. Trigger whenever someone mentions "AWS", "GCP", "Azure", "cloud", "VPC", "load balancer", "auto-scaling", "CDN", "S3", "Lambda", "serverless", "cloud architecture", or "managed services".
---

# 08 — Cloud Infrastructure

## Provider Selection

| Criteria | AWS | GCP | Azure |
|---------|-----|-----|-------|
| Market share | Largest | 3rd | 2nd |
| Startup credits | Activate | $200K+ for startups | $150K BizSpark |
| Kubernetes | EKS (mature) | GKE (best DX) | AKS |
| Serverless | Lambda (most mature) | Cloud Run (easiest) | Functions |
| AI/ML | Bedrock, SageMaker | Vertex AI (best) | Azure AI |
| Best for | Enterprise, most services | Data/ML, developer UX | Microsoft ecosystem |

## Networking Architecture

### Standard VPC Layout
```
VPC (10.0.0.0/16)
├── Public Subnets (10.0.1.0/24, 10.0.2.0/24)
│   ├── Load Balancer
│   ├── NAT Gateway
│   └── Bastion Host (if needed)
├── Private Subnets - Application (10.0.10.0/24, 10.0.11.0/24)
│   ├── Application servers
│   └── Background workers
├── Private Subnets - Data (10.0.20.0/24, 10.0.21.0/24)
│   ├── Database (RDS/CloudSQL)
│   └── Cache (ElastiCache/Memorystore)
└── Minimum 2 Availability Zones
```

### Load Balancer Configuration
- Application Load Balancer (Layer 7) for HTTP/HTTPS traffic
- Health check: `/health` endpoint, 10s interval, 3 failures to unhealthy
- SSL termination at the load balancer
- Connection draining: 30 seconds
- Sticky sessions: avoid unless stateful (use Redis for sessions instead)

## Auto-Scaling Rules

### Scaling Triggers
| Metric | Scale Up | Scale Down | Cooldown |
|--------|---------|-----------|----------|
| CPU | > 70% for 3 min | < 30% for 10 min | 5 min |
| Memory | > 80% for 3 min | < 40% for 10 min | 5 min |
| Request count | > 1000 req/min | < 200 req/min | 3 min |
| Queue depth | > 100 messages | < 10 messages | 2 min |

### Scaling Boundaries
- Minimum: 2 instances (high availability)
- Maximum: Set based on budget, not infinity
- Scale up fast (1 minute evaluation), scale down slow (10 minute evaluation)

## Managed Services Selection

**Default to managed services.** Self-hosting is only justified when:
- Cost is 5x+ cheaper at your scale
- You need customization the managed service doesn't allow
- Compliance requires it (data residency, specific certifications)

| Need | Managed Service |
|------|----------------|
| PostgreSQL | RDS / Cloud SQL / Neon |
| Redis | ElastiCache / Memorystore / Upstash |
| Object Storage | S3 / GCS / R2 |
| CDN | CloudFront / Cloudflare / Vercel Edge |
| Email | SES / SendGrid / Postmark |
| Search | OpenSearch / Algolia / Typesense Cloud |
| Monitoring | Datadog / Grafana Cloud |

## CDN Configuration
- Cache static assets with long TTL (1 year) + content-hash filenames
- Cache API responses with short TTL (60s) + `stale-while-revalidate`
- Set proper `Cache-Control` headers at origin
- Purge cache on deploy for HTML/index files
- Use edge functions for personalization without sacrificing caching

## Disaster Recovery
- **RPO (Recovery Point Objective)**: Maximum acceptable data loss (target: 1 hour)
- **RTO (Recovery Time Objective)**: Maximum acceptable downtime (target: 4 hours)
- Automated database backups: daily snapshots, continuous WAL archiving
- Cross-region backup replication for critical data
- Disaster recovery runbook tested quarterly
- DNS failover configured for multi-region setups

## Cloud Infrastructure Checklist
- [ ] VPC with public/private subnet separation
- [ ] Minimum 2 availability zones for all services
- [ ] Load balancer with health checks configured
- [ ] Auto-scaling policies with min/max boundaries
- [ ] All resources tagged (team, service, environment, cost-center)
- [ ] IAM follows least-privilege principle
- [ ] Database in private subnet (no public access)
- [ ] Automated backups enabled with retention policy
- [ ] Monitoring and alerting for all managed services
- [ ] SSL/TLS certificates auto-renewing
- [ ] NAT Gateway for outbound traffic from private subnets
- [ ] Security groups restrict traffic to minimum required ports

---

## External Skills (skills.sh)
```bash
npx skills add microsoft/github-copilot-for-azure/azure-ai
npx skills add microsoft/azure-skills/microsoft-foundry
npx skills add supercent-io/skills-template/vercel-deploy
```
