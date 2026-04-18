---
name: frontend-engineering
description: Use this skill for all frontend development work including UI framework setup, component architecture, state management, routing, bundling, styling, responsive design, and client-side performance. Trigger whenever someone mentions "frontend", "React", "Next.js", "Vue", "Svelte", "CSS", "Tailwind", "component", "state management", "SPA", "SSR", "SSG", "hydration", "client-side", "UI development", or "web app".
---

# 02 — Frontend Engineering

## Project Structure (Next.js / React Standard)

```
src/
├── app/                    # App Router pages and layouts
│   ├── (auth)/            # Route groups for auth pages
│   ├── (dashboard)/       # Route groups for dashboard
│   ├── api/               # API routes (if using Next.js)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # Primitive UI components (Button, Input, Modal)
│   ├── features/          # Feature-specific components
│   ├── layouts/           # Layout components (Sidebar, Header, Footer)
│   └── providers/         # Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions, API clients, constants
│   ├── api/              # API client and request functions
│   ├── utils/            # Pure utility functions
│   └── constants/        # App-wide constants
├── stores/               # State management (Zustand, Jotai, Redux)
├── types/                # TypeScript type definitions
├── styles/               # Global styles, CSS variables
└── __tests__/            # Test files (mirror src structure)
```

## Component Architecture Rules

### Component Hierarchy
1. **Pages** — Route-level components, handle data fetching
2. **Features** — Domain-specific composites (UserProfile, InvoiceTable)
3. **UI** — Reusable primitives (Button, Card, Dialog) — zero business logic
4. **Layouts** — Structural wrappers (PageShell, Sidebar)

### Component Checklist
Every component must:
- [ ] Have TypeScript props interface defined
- [ ] Have a default export
- [ ] Handle loading, error, and empty states
- [ ] Be accessible (keyboard nav, ARIA attributes, focus management)
- [ ] Not exceed 200 lines — split if larger
- [ ] Have at least one test (unit or integration)

### State Management Decision Tree
```
Is the state used by one component only?
  → Yes: useState / useReducer
  → No: Is it server-fetched data?
    → Yes: React Query / SWR / Server Components
    → No: Is it shared across many components?
      → Limited scope: React Context
      → Global scope: Zustand (simple) or Redux Toolkit (complex)
      → URL state: nuqs or URLSearchParams
```

---

## Styling Standards

### Approach: Tailwind CSS + CSS Variables
- Use Tailwind utility classes for all styling
- Define design tokens as CSS custom properties in `globals.css`
- Never use inline `style={}` except for truly dynamic values
- Extract repeated patterns into component variants, not utility classes

### Responsive Breakpoints
```
sm: 640px    — Mobile landscape
md: 768px    — Tablet
lg: 1024px   — Desktop
xl: 1280px   — Large desktop
2xl: 1536px  — Ultra-wide
```
Design mobile-first. Add complexity at larger breakpoints, not the reverse.

---

## Data Fetching Patterns

### Server Components (Preferred for Next.js)
- Fetch data at the page level in Server Components
- Pass data down as props
- Use `loading.tsx` and `error.tsx` for boundaries

### Client-Side Fetching (When needed)
- Use React Query / TanStack Query for cache, deduplication, background refresh
- Define query keys as constants
- Set stale time and cache time intentionally, never use defaults blindly
- Handle optimistic updates for mutations

### API Client Structure
```typescript
// lib/api/client.ts
const api = {
  get: <T>(url: string) => fetch(url).then(res => res.json() as T),
  post: <T>(url: string, data: unknown) => fetch(url, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json() as T),
  // ... put, patch, delete
};
```

---

## Performance Budget

| Metric | Target | Tool |
|--------|--------|------|
| Largest Contentful Paint | < 2.5s | Lighthouse |
| First Input Delay | < 100ms | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Total Bundle Size (JS) | < 200KB gzipped | Bundle analyzer |
| Time to Interactive | < 3.5s | WebPageTest |

### Performance Rules
- Lazy-load routes with `React.lazy()` or Next.js dynamic imports
- Images: Use `<Image>` component with `sizes` and `priority` attributes
- Fonts: Self-host, use `font-display: swap`, preload critical fonts
- Third-party scripts: Load with `defer` or `async`, audit with Lighthouse
- Virtualize long lists (TanStack Virtual, react-window)

---

## Form Handling

Use React Hook Form + Zod for all forms:
- Define Zod schema first (shared with backend if possible)
- Use controlled components via `register()`
- Display inline validation errors
- Handle submission loading/error states
- Support keyboard submission (Enter key)

---

## External Skills (skills.sh)
```bash
npx skills add anthropics/skills/frontend-design
npx skills add vercel-labs/agent-skills/vercel-react-best-practices
npx skills add vercel-labs/agent-skills/web-design-guidelines
npx skills add shadcn/ui/shadcn
npx skills add supercent-io/skills-template/responsive-design
npx skills add supercent-io/skills-template/ui-component-patterns
npx skills add wshobson/agents/tailwind-design-system
npx skills add wshobson/agents/nextjs-app-router-patterns
```
