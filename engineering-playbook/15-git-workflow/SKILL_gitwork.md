---
name: git-workflow
description: Use this skill for branching strategies, commit conventions, pull request processes, code review standards, merge policies, and Git best practices. Trigger whenever someone mentions "git", "branch", "commit", "pull request", "PR", "merge", "code review", "branching strategy", "trunk-based", "git flow", "rebase", or "merge conflict".
---

# 15 — Git Workflow

## Branching Strategy

### Recommended: Trunk-Based Development (for teams with CI/CD)

```
main (always deployable)
  ├── feature/PROJ-123-user-auth     (short-lived, < 2 days)
  ├── feature/PROJ-456-search-api    (short-lived, < 2 days)
  └── fix/PROJ-789-login-crash       (short-lived, < 1 day)
```

**Rules:**
- `main` is always deployable. Broken main = stop everything and fix.
- Feature branches live < 2 days. If longer, you're building too much before merging.
- No long-lived develop/staging branches. Use feature flags instead.
- Delete branches after merge. No exceptions.

### Alternative: GitHub Flow (for smaller teams)
- `main` is production
- Feature branches off `main`
- PR → Review → Merge → Deploy

### Alternative: Release Branches (for mobile / versioned software)
- `main` for development
- `release/v1.2` cut from main when ready
- Hotfixes cherry-picked to release branches

## Branch Naming Convention
```
{type}/{ticket}-{short-description}

feature/PROJ-123-add-user-search
fix/PROJ-456-fix-login-timeout
chore/PROJ-789-update-dependencies
refactor/PROJ-101-extract-auth-module
docs/PROJ-202-add-api-docs
```

## Commit Message Convention (Conventional Commits)
```
{type}({scope}): {description}

feat(auth): add OAuth2 login with Google
fix(api): handle null response from payment provider
docs(readme): add local development setup instructions
refactor(users): extract validation into shared module
test(orders): add integration tests for checkout flow
chore(deps): update React to v19
perf(dashboard): lazy-load chart components
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`, `style`

**Rules:**
- Subject line: imperative mood, < 72 characters, no period
- Body: explain WHY, not WHAT (the diff shows what)
- Footer: reference ticket (`Closes PROJ-123`) and breaking changes

## Pull Request Standards

### PR Template (Required)
```markdown
## What
Brief description of changes.

## Why
Link to ticket/issue. Context on the problem being solved.

## How
Technical approach taken. Key decisions made.

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed (describe what you tested)

## Screenshots
(If UI changes — before/after)

## Checklist
- [ ] Self-reviewed my code
- [ ] No console.logs or debugging artifacts left
- [ ] Documentation updated (if needed)
- [ ] No new TypeScript `any` types introduced
- [ ] Accessibility checked (if UI change)
```

### PR Size Limits
| Size | Lines Changed | Review Time |
|------|--------------|-------------|
| Small | < 200 | Same day |
| Medium | 200-500 | Within 24 hours |
| Large | 500+ | **Split it.** |

PRs over 500 lines changed require justification and should be the exception.

## Code Review Standards

### Reviewer Responsibilities
- Review within 24 hours (4 hours for urgent/blocking PRs)
- Focus on: correctness, security, performance, readability, edge cases
- Be specific: point to lines, suggest alternatives, explain why
- Use conventional comments: `nit:`, `suggestion:`, `question:`, `issue:`, `blocking:`

### Author Responsibilities
- Self-review before requesting review
- Respond to all comments (even if just "done")
- Keep PR description updated as changes are made
- Don't force-push after review has started (append commits instead)

### Merge Policy
- Minimum 1 approval required (2 for critical paths: auth, payments, infra)
- All CI checks must pass
- No unresolved `blocking:` comments
- Squash merge to main (clean history)

---

## External Skills (skills.sh)
```bash
npx skills add supercent-io/skills-template/git-workflow
npx skills add obra/superpowers/requesting-code-review
npx skills add obra/superpowers/receiving-code-review
npx skills add obra/superpowers/finishing-a-development-branch
npx skills add obra/superpowers/using-git-worktrees
npx skills add github/awesome-copilot/git-commit
npx skills add supercent-io/skills-template/code-review
npx skills add wshobson/agents/code-review-excellence
```
