---
name: documentation
description: Use this skill for creating and maintaining technical documentation, API docs, runbooks, onboarding guides, architecture diagrams, README files, changelogs, and internal knowledge bases. Trigger whenever someone mentions "documentation", "docs", "README", "runbook", "onboarding guide", "API docs", "changelog", "wiki", "knowledge base", "technical writing", or "doc site".
---

# 14 — Documentation

## Documentation Hierarchy

Every project must maintain these documentation layers:

### Layer 1: In-Code Documentation
- **Code comments**: Explain WHY, not WHAT. The code explains what.
- **JSDoc / TSDoc**: Public API functions, exported types, complex algorithms
- **TODO/FIXME/HACK**: Tracked with ticket numbers (`// TODO(PROJ-123): Refactor after v2 migration`)

### Layer 2: Repository Documentation
```
docs/
├── README.md              # Project overview, quickstart, contributing
├── CONTRIBUTING.md         # How to contribute, PR process, code style
├── CHANGELOG.md           # Version history (Keep a Changelog format)
├── architecture/
│   ├── overview.md        # System architecture overview with diagrams
│   ├── data-flow.md       # How data moves through the system
│   └── adrs/              # Architecture Decision Records
├── api/
│   ├── openapi.yaml       # OpenAPI specification
│   └── examples/          # Request/response examples
├── runbooks/
│   ├── deploy.md          # How to deploy
│   ├── rollback.md        # How to rollback
│   ├── incident.md        # Incident response steps
│   └── database.md        # DB maintenance procedures
└── onboarding/
    ├── setup.md           # Local dev environment setup
    ├── codebase-tour.md   # Guided tour of the codebase
    └── first-ticket.md    # Walkthrough of completing a first task
```

### Layer 3: External Documentation
- Product documentation (user-facing)
- API reference (developer-facing)
- Status page

## README Template (Required)

Every repository README must contain:
```markdown
# Project Name
One-line description of what this project does.

## Quick Start
Three commands or fewer to get running locally.

## Architecture
Brief description + link to architecture docs.

## Development
- Prerequisites (Node version, Docker, etc.)
- Setup commands
- Running tests
- Running locally

## Deployment
How to deploy, or link to deploy runbook.

## Contributing
Link to CONTRIBUTING.md.

## Team
Who owns this project and how to reach them.
```

## Changelog Format (Keep a Changelog)
```markdown
## [1.2.0] - 2026-03-17
### Added
- User profile editing page
- Email notification preferences

### Changed
- Improved dashboard loading performance by 40%

### Fixed
- Fixed pagination on search results page

### Security
- Updated lodash to patch prototype pollution vulnerability
```

## Runbook Standards

Every runbook must follow this structure:
1. **Title**: What this runbook is for
2. **When to use**: Conditions that trigger this runbook
3. **Prerequisites**: Access, tools, permissions needed
4. **Steps**: Numbered, specific, copy-pasteable commands
5. **Verification**: How to confirm the procedure worked
6. **Rollback**: How to undo if something goes wrong
7. **Contacts**: Who to escalate to if stuck

## Documentation Review Process
- Docs are reviewed alongside code in PRs
- Stale docs are worse than no docs — delete aggressively
- Onboarding new team members is the best docs audit: have them follow the docs and note every point of confusion
- Quarterly docs review: each team reviews their docs for accuracy

## API Documentation
- Auto-generate from OpenAPI spec using Redoc or Swagger UI
- Include runnable examples for every endpoint
- Document error responses with all possible error codes
- Authentication section with working examples
- Rate limiting documentation with tier details

---

## External Skills (skills.sh)
```bash
npx skills add supercent-io/skills-template/api-documentation
npx skills add supercent-io/skills-template/technical-writing
npx skills add github/awesome-copilot/documentation-writer
npx skills add obra/superpowers/writing-skills
```
