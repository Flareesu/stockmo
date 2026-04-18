---
name: api-collection-management
description: Use this skill for API collection tools (Postman, Bruno, Insomnia), contract testing, mock servers, API environment management, request chaining, and API documentation generation. Trigger whenever someone mentions "Postman", "Bruno", "Insomnia", "API collection", "mock server", "contract test", "API testing", "API environment", "request chaining", or "API workspace".
---

# 25 — API Collection & Management

## Tool Selection

| Tool | Best For | Pricing | Git-Friendly |
|------|---------|---------|-------------|
| Bruno | Open source, git-native collections | Free | Native (files on disk) |
| Postman | Team collaboration, enterprise | Freemium | Export/import JSON |
| Insomnia | Lightweight, plugin ecosystem | Freemium | Git sync plugin |
| HTTPie | CLI-first, scripting | Free | N/A (CLI) |
| Thunder Client | VS Code integrated | Free | Workspace files |

### Recommendation: Bruno (for git-native teams)
- Collections stored as files in the repo (`/api-collections/`)
- Version controlled alongside code
- No account required, no cloud sync needed
- Supports environments, scripting, tests

## Collection Organization

```
api-collections/
├── environments/
│   ├── local.bru
│   ├── staging.bru
│   └── production.bru
├── auth/
│   ├── login.bru
│   ├── register.bru
│   └── refresh-token.bru
├── users/
│   ├── list-users.bru
│   ├── get-user.bru
│   ├── create-user.bru
│   ├── update-user.bru
│   └── delete-user.bru
└── orders/
    ├── list-orders.bru
    └── create-order.bru
```

## Environment Variables

### Variable Hierarchy
```
Collection Variables (defaults)
  → Environment Variables (per env overrides)
    → Request Variables (per request overrides)
```

### Standard Variables
```
base_url: http://localhost:3000/api/v1
auth_token: {{login_response.token}}
test_user_id: {{create_user_response.id}}
```

### Sensitive Variables
- Never commit tokens or passwords to collection files
- Use environment files that are gitignored
- Share via secrets manager, not Slack/email

## Request Chaining & Workflows

### Pre-Request Scripts
```javascript
// Auto-login before authenticated requests
const loginResponse = await bru.runRequest('auth/login');
bru.setVar('auth_token', loginResponse.body.token);
```

### Test Scripts (Post-Response)
```javascript
// Validate response
test('status is 200', () => expect(res.status).to.equal(200));
test('has user id', () => expect(res.body.data.id).to.be.a('string'));

// Chain: save ID for next request
bru.setVar('created_user_id', res.body.data.id);
```

## Mock Servers
- Create mock server for frontend development before backend is ready
- Match responses to OpenAPI spec
- Use tools: Prism (OpenAPI-based), WireMock, MSW (for frontend tests)
- Mock servers should return realistic data with edge cases (empty arrays, null fields, error responses)

## Contract Testing
- Consumer-Driven Contracts (Pact) for microservice APIs
- Generate contract from API collection tests
- Provider runs contract verification in their CI
- Break the build if contract is violated

## API Collection as Documentation
- Auto-generate API docs from collection (Bruno/Postman can export)
- Include example requests AND responses for every endpoint
- Document error responses (not just happy paths)
- Keep collection in sync with OpenAPI spec (validate in CI)

## External Skills (skills.sh)
```bash
npx skills add supercent-io/skills-template/api-documentation
npx skills add wshobson/agents/api-design-principles
```
