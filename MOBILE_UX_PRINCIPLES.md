# StockMo — Mobile UX Principles

Design rules specifically for low-tech mobile use in a stockyard environment.

---

## Core Constraint: The Yard

StockMo is used outdoors, in a noisy stockyard, by technicians who may be wearing gloves, looking at a bright screen in sunlight, and switching between the app and physical tasks dozens of times per shift. Every design decision must account for this context.

---

## Rule 1: Minimum 52px Tap Targets

All interactive elements must have a minimum height of 52px (`--tap: 52px`). This includes:
- All buttons
- All checklist items
- All filter chips (touch area, not visual size)
- Technician picker rows
- Car cards

**Why:** Fingers wearing gloves are 2–3× less precise. Anything smaller will cause mis-taps and frustration.

---

## Rule 2: One-Thumb Navigation

All primary navigation must be reachable by the right thumb without repositioning the phone:
- Bottom navigation bar for all primary pages
- Action buttons at the bottom of panels
- Slide-up panels (not top-down modals) for detail views

**Never** put primary actions at the top of the screen.

---

## Rule 3: Zero-Login Open

The app opens directly to the Home screen. No login, no PIN, no onboarding. Technicians pick up their phone and start working.

Admin access is a single tap — no friction, no gate. Trust the people, not the lock.

---

## Rule 4: Offline by Default

The app must function completely without network access:
- All data stored in `localStorage`
- No CDN fonts (use system font stack)
- No API calls of any kind
- No images loaded from external URLs
- The entire app is contained in a single `.html` file

If there is no WiFi, the app works exactly the same as if there is WiFi.

---

## Rule 5: Large, High-Contrast Status Indicators

Status must be readable at a glance in bright sunlight:
- 4px color stripe at the top of every card (stage color)
- Stage badges: background + border + text all in stage color
- Overdue maintenance: red text, red background, red border — cannot be missed
- PDI issues: same triple-red treatment

Status should never require reading — it should be visible from 30cm away.

---

## Rule 6: Single-Tap Actions

Checklist items cycle through states on a single tap. No confirmation dialogs for routine actions. Only irreversible or critical actions (releasing a vehicle to a dealer) should require a separate confirm step.

**Tap cycle:** `pending → done → issue → n/a → pending`

---

## Rule 7: Numeric Keyboards for Number Fields

Any input that expects a number must set `inputmode="numeric"` so the phone shows the number pad instead of the full keyboard. This applies to:
- Odometer / mileage fields
- Year fields
- VIN input (use `text-transform: uppercase` and strip invalid chars)

---

## Rule 8: System Fonts Only

No Google Fonts, no external font CDN. Use: `'Segoe UI', 'Helvetica Neue', system-ui, sans-serif`

**Why:** External fonts require a network request. They also cause a flash of unstyled text on slow connections. System fonts render instantly, look native, and never fail.

---

## Rule 9: Panels Slide Up, Not Down

All secondary views (vehicle detail, admin panel, add vehicle wizard) slide up from the bottom as sheet panels:
- `border-radius: 18px 18px 0 0` — rounded top corners only
- Drag handle visible at top
- Can be dismissed by tapping the background
- Max height: 94vh to allow slight peek of the background

This is the standard mobile pattern on both Android and iOS. Users understand it instinctively.

---

## Rule 10: Dense but Never Crowded

Information density is high — technicians need a lot of data at a glance. But padding must be respected:
- Card body padding: 10px 12px
- Section labels: 14px 0 7px
- Between cards: 8px gap
- Inside panels: 14px 16px 28px

Dense ≠ cramped. Every element needs breathing room.

---

## Rule 11: Tagalog as a First-Class Language

The EN/TL toggle is always visible in the topbar. It must:
- Switch all UI strings instantly (no page reload)
- Persist the user's preference for the session
- Cover 100% of user-facing strings — no partial translations
- Use natural, spoken Filipino — not formal or bureaucratic

Checklist items in Tagalog should use terms a yard technician would actually say, not translated technical manuals.

---

## Rule 12: Progressive Disclosure in the Wizard

The Add Vehicle wizard uses 4 discrete steps. Each step shows only what's needed for that step:
1. Port Arrival — VIN + vehicle specs
2. PDI — checklist items only
3. Assign — lot position + technician picker
4. Confirm — summary review before commit

Never show step 3 content on step 1. Users feel overwhelmed by long forms — breaking into steps increases completion rate.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Reason |
|-------------|--------|
| Full-screen modal (not sheet) | Feels jarring, no context behind it |
| Horizontal scrolling lists | Not obvious on mobile, users miss content |
| Tooltips | Hover doesn't exist on touch |
| Placeholder-only labels | Labels must persist above the field when filled |
| Auto-advance on form completion | Users may need to review before moving forward |
| Toast at bottom below nav bar | Must appear above nav: `bottom: 64px` |
| Disabled buttons with no explanation | Tell the user what's missing |
