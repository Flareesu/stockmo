---
name: design-system
description: Use this skill for building design systems, component libraries, design tokens, Storybook setup, visual regression testing, theme management, and design-development handoff. Trigger whenever someone mentions "design system", "component library", "design tokens", "Storybook", "theme", "visual regression", "Figma tokens", "brand guidelines", or "style guide".
---

# 27 — Design System

## Design Token Architecture

### Token Hierarchy
```
Global Tokens (raw values)
  → Alias Tokens (semantic meaning)
    → Component Tokens (component-specific)
```

### Example
```css
/* Global: raw values */
--color-blue-500: #3b82f6;
--spacing-4: 1rem;
--radius-md: 0.375rem;

/* Alias: semantic meaning */
--color-primary: var(--color-blue-500);
--color-background: var(--color-white);
--color-text: var(--color-gray-900);

/* Component: specific usage */
--button-bg: var(--color-primary);
--button-radius: var(--radius-md);
--button-padding: var(--spacing-4);
```

### Token Categories
| Category | Examples |
|----------|---------|
| Color | Primary, secondary, success, warning, error, neutral scale |
| Typography | Font family, size scale (xs-3xl), weight, line height |
| Spacing | 4px grid: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 |
| Border Radius | none, sm, md, lg, full |
| Shadow | sm, md, lg, xl |
| Breakpoints | sm (640), md (768), lg (1024), xl (1280) |
| Z-index | dropdown (10), sticky (20), modal (30), toast (40) |
| Animation | Duration (150ms, 300ms), easing (ease-in-out) |

## Component Library Structure

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Card/
│   │   └── Toast/
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   └── index.ts          # Public API exports
├── .storybook/
└── package.json
```

### Component API Standards
- Props use TypeScript interfaces (exported for consumers)
- Support `className` prop for style overrides
- Support `ref` forwarding (`React.forwardRef`)
- Implement variants via props, not separate components
- Include `data-testid` prop for testing
- All interactive components are keyboard accessible

### Component Variants Pattern (using CVA)
```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('inline-flex items-center justify-center rounded-md font-medium', {
  variants: {
    variant: {
      primary: 'bg-primary text-white hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-input bg-transparent hover:bg-accent',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-white hover:bg-destructive/90',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});
```

## Storybook Configuration

### Every component story must include:
1. **Default**: Component with default props
2. **Variants**: All visual variants side by side
3. **States**: Hover, focus, disabled, loading, error
4. **Sizes**: All size options
5. **Interactive**: Args controls for live editing
6. **Accessibility**: a11y addon panel visible

### Storybook Addons (Required)
- `@storybook/addon-a11y` — Accessibility audit per story
- `@storybook/addon-viewport` — Responsive testing
- `@storybook/addon-interactions` — Test interactions in stories
- `chromatic` or `loki` — Visual regression testing

## Visual Regression Testing
- Capture screenshot of every story in CI
- Compare against baseline on every PR
- Auto-approve if pixel diff < 0.1%
- Manual review required for visual changes > 0.1%
- Update baselines intentionally (not auto-approve all)

## Design-Development Handoff
- Figma as source of truth for design
- Design tokens exported from Figma (Tokens Studio or Style Dictionary)
- Component specs include: spacing, typography, colors, states, responsive behavior
- Designers review Storybook deployment before code merges

## Theme Support (Dark Mode)
```css
:root { --color-bg: #ffffff; --color-text: #111827; }
[data-theme="dark"] { --color-bg: #111827; --color-text: #f9fafb; }
```
- Respect `prefers-color-scheme` on first visit
- Store preference in localStorage
- Apply theme class at `<html>` level (prevents flash)
- Test ALL components in both themes

## External Skills (skills.sh)
```bash
npx skills add wshobson/agents/tailwind-design-system
npx skills add shadcn/ui/shadcn
npx skills add supercent-io/skills-template/frontend-design-system
npx skills add supercent-io/skills-template/ui-component-patterns
npx skills add nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max
npx skills add anthropics/skills/frontend-design
npx skills add dammyjay93/interface-design/interface-design
npx skills add pbakaus/impeccable/frontend-design
```
