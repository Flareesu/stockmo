---
name: accessibility
description: Use this skill for WCAG compliance, screen reader testing, keyboard navigation, ARIA attributes, color contrast, focus management, accessible forms, and a11y automation. Trigger whenever someone mentions "accessibility", "a11y", "WCAG", "screen reader", "ARIA", "keyboard navigation", "color contrast", "focus management", or "assistive technology".
---

# 17 — Accessibility (a11y)

## WCAG 2.2 Compliance Target: Level AA

### The Four Principles (POUR)

| Principle | Meaning | Key Requirements |
|-----------|---------|-----------------|
| **Perceivable** | Users can see/hear content | Alt text, captions, contrast, resizable text |
| **Operable** | Users can navigate and interact | Keyboard access, focus visible, no time traps |
| **Understandable** | Users can comprehend content | Clear language, predictable behavior, error help |
| **Robust** | Works with assistive tech | Valid HTML, ARIA usage, tested with screen readers |

## HTML Semantics (First Line of Defense)

Use semantic elements before ARIA:
```html
<!-- WRONG -->
<div class="button" onclick="submit()">Submit</div>

<!-- RIGHT -->
<button type="submit">Submit</button>
```

### Element Selection Order
1. Native HTML element (button, nav, main, input, select)
2. HTML element + ARIA attribute (role, aria-label)
3. Custom component + full ARIA implementation (last resort)

## Keyboard Navigation Requirements
- Every interactive element reachable via Tab
- Logical tab order (follows visual layout)
- Focus indicator visible at all times (minimum 2px solid outline)
- Escape closes modals/popovers and returns focus to trigger
- Arrow keys for navigation within composites (tabs, menus, grids)
- No keyboard traps — user can always tab away

## Color & Contrast
- Normal text (< 18pt): minimum 4.5:1 contrast ratio
- Large text (≥ 18pt or 14pt bold): minimum 3:1 contrast ratio
- UI components and graphics: minimum 3:1 against background
- Never use color alone to convey information (add icons, patterns, labels)
- Test with color blindness simulators (Sim Daltonism, Chrome DevTools)

## Forms Accessibility
- Every input has a visible `<label>` linked via `for`/`id`
- Required fields marked with text ("Required"), not just asterisk
- Error messages linked to field via `aria-describedby`
- Group related fields with `<fieldset>` and `<legend>`
- Autocomplete attributes set (`autocomplete="email"`, etc.)

## Images & Media
- All `<img>` have `alt` text (descriptive, not "image of...")
- Decorative images: `alt=""` or CSS background
- Videos: captions for deaf users, audio descriptions for blind users
- Animations: respect `prefers-reduced-motion` media query

## Testing Checklist
- [ ] Automated: axe-core or Lighthouse a11y audit (in CI, score ≥ 90)
- [ ] Keyboard: Navigate entire app using only keyboard
- [ ] Screen reader: Test with VoiceOver (Mac), NVDA (Windows), or TalkBack (Android)
- [ ] Zoom: Content usable at 200% zoom
- [ ] Contrast: Run contrast checker on all text/UI elements

## ARIA Patterns Reference
| Pattern | Component | Key ARIA |
|---------|-----------|----------|
| Dialog | Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Tabs | Tab panel | `role="tablist"`, `role="tab"`, `aria-selected` |
| Menu | Dropdown | `role="menu"`, `role="menuitem"`, `aria-expanded` |
| Alert | Toast/Banner | `role="alert"`, `aria-live="assertive"` |
| Combobox | Autocomplete | `role="combobox"`, `aria-expanded`, `aria-activedescendant` |

---

## External Skills (skills.sh)
```bash
npx skills add supercent-io/skills-template/web-accessibility
```
