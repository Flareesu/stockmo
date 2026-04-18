# StockMo — Design System

## Aesthetic Direction

**Industrial utilitarian dark.** The app feels like it belongs in a yard — built for people who work with their hands, not a polished consumer product. High contrast, functional density, amber as the signature accent. Every element earns its place.

---

## Color Tokens

```css
:root {
  /* Backgrounds — 5 depth levels */
  --bg0: #0b0d11;   /* Page background */
  --bg1: #13161d;   /* Cards, panels */
  --bg2: #1a1e28;   /* Input fields, section backgrounds */
  --bg3: #222735;   /* Hover states, chips */
  --bg4: #2b3044;   /* Deep insets, drag handles */

  /* Accent */
  --acc:  #f5a623;  /* Primary amber — brand color */
  --acc2: #d4880f;  /* Amber pressed state */

  /* Semantic status */
  --ok:   #22c55e;  --okbg:  rgba(34,197,94,.12);  --okbd:  rgba(34,197,94,.28);
  --wn:   #f59e0b;  --wnbg:  rgba(245,158,11,.12); --wnbd:  rgba(245,158,11,.28);
  --dn:   #ef4444;  --dnbg:  rgba(239,68,68,.12);  --dnbd:  rgba(239,68,68,.28);
  --inf:  #3b82f6;  --infbg: rgba(59,130,246,.12); --infbd: rgba(59,130,246,.28);
  --pu:   #8b5cf6;  --pubg:  rgba(139,92,246,.12); --pubd:  rgba(139,92,246,.28);

  /* Text */
  --t1: #e8eaf0;   /* Primary text */
  --t2: #8b91a0;   /* Secondary / muted */
  --t3: #4a5060;   /* Tertiary / labels */

  /* Borders */
  --bd:  rgba(255,255,255,.06);   /* Default border */
  --bd2: rgba(255,255,255,.11);   /* Emphasized border */
}
```

---

## Stage Color Mapping

Each lifecycle stage has a consistent color used across stripes, badges, dots, and charts:

| Stage     | Color Variable | Hex       | Usage |
|-----------|---------------|-----------|-------|
| Port      | `--inf`       | `#3b82f6` | Blue — new arrival |
| PDI       | `--pu`        | `#8b5cf6` | Purple — inspection in progress |
| Stockyard | `--wn`        | `#f59e0b` | Amber — active care |
| Ready     | `--ok`        | `#22c55e` | Green — cleared for dealer |
| Released  | `--t2`        | `#8b91a0` | Gray — archived |
| Hold      | `--dn`        | `#ef4444` | Red — blocked, needs action |

---

## Typography

**Font stack:** `'Segoe UI', 'Helvetica Neue', system-ui, sans-serif`

No external font CDN is used. System fonts render instantly and work offline on all devices.

| Use | Size | Weight |
|-----|------|--------|
| App logo | 20–22px | 900 |
| Card ID / primary value | 15–17px | 900 |
| Section title | 12–14px | 700 |
| Body / card name | 13px | 600 |
| Secondary text | 11–12px | 400–500 |
| Labels / tags / badges | 9–11px | 700 |
| Section label (uppercase) | 10px | 700 + letter-spacing: 1.4px |

---

## Spacing & Sizing

```css
--tap: 52px;    /* Minimum interactive element height */
--r:   8px;     /* Default border radius */
--rL:  12px;    /* Card border radius */
```

All interactive elements (buttons, checklist items, filter chips, tech pickers) must meet the `--tap` 52px minimum height. This is non-negotiable for yard use with gloves.

---

## Component Patterns

### Status Badge
```html
<div class="sbadge stock">Stockyard</div>
```
- Background: `stage-color + bg opacity`
- Text: `stage-color` at full opacity
- Border: `stage-color + bd opacity`
- Font: 10px, weight 700, uppercase, letter-spacing 0.4px

### Car Card
Structure:
1. 4px color stripe (stage color) — instant visual scan
2. Card body: ID + badge row → make/model → color/VIN excerpt → spec tags → flags → assigned tech

### Checklist Item
3-state tap cycle: `pending` → `done` → `issue` (→ `n/a` optional)
- Pending: gray outlined box
- Done: green filled, white ✓
- Issue: red filled, white !

### Section Heading (Checklist)
```css
background: var(--bg2);
border-left: 3px solid var(--acc);
color: var(--acc);
```

### Progress Bar
```html
<div class="prog-bar">
  <div class="prog-fill ok" style="width: 75%"></div>
</div>
```
Height: 5px. Color classes: `ok` (green), `wn` (amber), `inf` (blue).

---

## Animation

- **Pulse** on active lifecycle stage node: `animation: pn 1.4s ease-in-out infinite` — opacity 1 → 0.55
- **Wizard step line**: `transition: background 0.3s` on completion
- **Wizard node**: `transition: all 0.2s` on state change
- **Stage badge / card**: `:active` opacity 0.7–0.8 for tap feedback

No heavy animations — performance is prioritized for low-spec devices.

---

## Layout Rules

### Topbar
- Logo left, status pills + offline tag center, lang toggle + admin button right
- Fixed height, always visible, never scrolls

### Bottom Navigation
- 5 tabs: Home / Stock / Maint / Final / Arrive (+)
- Font: 9px, 700 weight, uppercase
- Active: `--acc` amber
- Badges: `--dn` red dot, top-right of icon

### Panels (slide-up)
- Border radius: 18px top corners only
- Handle bar: 32px × 4px, `--bg4`, centered
- Max height: 94vh
- Scroll: `-webkit-overflow-scrolling: touch`

### Cards
- Border radius: `--rL` (12px)
- Border: 1px solid `--bd`
- `:active` state: border-color transitions to amber

---

## Scrollbar
```css
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 2px; }
```
Minimal, non-intrusive.
