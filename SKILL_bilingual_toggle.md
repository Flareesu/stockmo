# SKILL: Bilingual Language Toggle (EN / TL)

**Use this skill when:** Building an app that needs instant full-page language switching between English and Filipino (Tagalog) without a page reload.

---

## Architecture Overview

The bilingual system has three parts:
1. **Translation object `T`** — all strings keyed by language and string ID
2. **`t(key)` function** — returns the string for the current language
3. **Re-render on toggle** — updates both `data-k` static elements and dynamically rendered views

---

## Translation Object Structure

```javascript
let lang = 'en'; // Global language state

const T = {
  en: {
    // Navigation
    nav_home:    'HOME',
    nav_stock:   'STOCK',
    nav_arrive:  'ARRIVE',
    
    // Stage names
    stage_port:     'Port',
    stage_pdi:      'PDI',
    stage_stock:    'Stockyard',
    stage_ready:    'Ready',
    stage_released: 'Released',
    stage_hold:     'Hold',
    
    // Action buttons
    start_pdi:    'START PDI INSPECTION',
    pdi_pass:     'PDI PASSED — MOVE TO STOCKYARD',
    put_hold:     'PUT ON HOLD',
    save_notes:   'SAVE NOTES',
    notes_saved:  'Notes saved',
    
    // Status messages
    attn_none:    'No urgent items right now.',
    maint_starts: 'Maintenance starts when vehicle enters stockyard.',
    all_schedule: 'All on schedule',
    overdue:      'Overdue',
    due_in:       'Due in',
  },
  tl: {
    // Navigation
    nav_home:    'HOME',
    nav_stock:   'STOCK',
    nav_arrive:  'DATING',
    
    // Stage names
    stage_port:     'Port',
    stage_pdi:      'PDI',
    stage_stock:    'Stockyard',
    stage_ready:    'Handa',
    stage_released: 'Na-release',
    stage_hold:     'Hold',
    
    // Action buttons
    start_pdi:    'SIMULAN ANG PDI',
    pdi_pass:     'PUMASA SA PDI — ILIPAT SA STOCKYARD',
    put_hold:     'ILAGAY SA HOLD',
    save_notes:   'I-SAVE ANG MGA TALA',
    notes_saved:  'Nai-save ang mga tala',
    
    // Status messages
    attn_none:    'Walang urgent na kailangan ng aksyon.',
    maint_starts: 'Magsisimula ang maintenance kapag nandito na sa stockyard.',
    all_schedule: 'Lahat ay on schedule',
    overdue:      'Huli na',
    due_in:       'Due in',
  }
};

// Lookup function — falls back to English if key missing in TL
function t(key) {
  return (T[lang] && T[lang][key]) || T.en[key] || key;
}

// Convenience for stage labels
function stageLabel(s) {
  return t('stage_' + s) || s;
}
```

---

## Static Elements — `data-k` Attribute

For elements whose content is only the translated string (labels, nav items, section headers), use a `data-k` attribute and batch-update on language change:

```html
<!-- In HTML -->
<div class="slabel" data-k="pipeline">Pipeline</div>
<span data-k="nav_home">HOME</span>
<div data-k="admin_title">Admin Panel</div>
```

```javascript
// In setLang() — update all static elements at once
document.querySelectorAll('[data-k]').forEach(el => {
  el.textContent = t(el.dataset.k);
});
```

This handles all static labels with one line. No need to manually target each element.

---

## Dynamic Elements — Re-render Views

For content built by JS (cards, checklists, buttons), the views must be re-rendered after language change:

```javascript
function setLang(l) {
  // 1. Update global state
  lang = l;
  
  // 2. Update toggle button styles
  document.getElementById('lt-en').classList.toggle('active', l === 'en');
  document.getElementById('lt-tl').classList.toggle('active', l === 'tl');
  
  // 3. Update static data-k elements
  document.querySelectorAll('[data-k]').forEach(el => {
    el.textContent = t(el.dataset.k);
  });
  
  // 4. Re-render active dynamic views
  const activePage = document.querySelector('.page.active')?.id;
  if (activePage === 'pg-home')  renderHome();
  if (activePage === 'pg-stock') renderStock();
  if (activePage === 'pg-maint') renderMaint();
  if (activePage === 'pg-final') renderFinal();
  
  // 5. Re-render open overlays
  if (document.getElementById('admin-ov').classList.contains('open')) {
    renderAdminBody();
  }
  if (document.getElementById('detail-ov').classList.contains('open') && selId) {
    const car = items.find(c => c.id === selId);
    if (car) renderDetail(car);
  }
  if (document.getElementById('wiz-ov').classList.contains('open')) {
    renderWizard();
  }
}
```

---

## Language Toggle UI

```html
<div class="lang-toggle">
  <div class="lt-btn active" id="lt-en" onclick="setLang('en')">EN</div>
  <div class="lt-btn"        id="lt-tl" onclick="setLang('tl')">TL</div>
</div>
```

```css
.lang-toggle {
  display: flex;
  align-items: center;
  background: var(--bg3);
  border: 1px solid var(--bd2);
  border-radius: 20px;
  padding: 2px;
  gap: 0;
  flex-shrink: 0;
}
.lt-btn {
  padding: 4px 9px;
  border-radius: 18px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .4px;
  cursor: pointer;
  color: var(--t3);
  transition: all .18s;
}
.lt-btn.active {
  background: var(--acc);
  color: #000;
}
```

---

## Inline Language Conditionals

For strings that aren't worth adding to the T object, use inline ternary:

```javascript
// Simple binary string
const label = lang === 'tl' ? 'Tapos na' : 'Done';

// Inside template literals
`<div>${lang === 'tl' ? 'Dumating' : 'Arrived'}: ${car.arrivalDate}</div>`

// In history entries (log in current language)
car.history.unshift(
  `${todayString()}: ${lang === 'tl' ? 'Nai-save ang mga tala' : 'Notes updated'}`
);
```

---

## Tagalog Verb Patterns for Button Labels

Filipino uses the `i-` prefix to verb-ify English words:

| English | Tagalog |
|---------|---------|
| Save | I-save |
| Release | I-release |
| Assign | I-assign |
| Override | I-override |
| Update | I-update |

For longer actions, use full Filipino constructions:
- "Start PDI" → "SIMULAN ANG PDI"
- "Move to Stockyard" → "ILIPAT SA STOCKYARD"
- "Resume after repair" → "IPAGPATULOY PAGKATAPOS NG AYOS"

---

## What to Keep in English

Some terms are used daily by Filipino technicians as English loanwords — keep these in English even in TL mode:

- PDI (Pre-Delivery Inspection)
- VIN
- Battery
- Engine
- Hold
- Stock
- Port
- Tab labels: PDI, MAINT, FINAL
- Lot codes: B-01, C-04

---

## Data in Tagalog

In StockMo, the checklist item names themselves are stored in Tagalog in the data layer (PDI_ITEMS, STOCK_MAINT, FINAL_ITEMS arrays). This means:
- The data is always in TL
- History log entries are logged in whichever language is active when the action happens
- Specs (make, model, color) remain as entered (usually English)

This is acceptable for a primarily Tagalog-speaking user base. If you need a bilingual data layer, store both languages in the item object:
```javascript
{ id: 'p1', name_en: 'Body panels — no dents', name_tl: 'Mga panel — walang kalmot o pisa' }
// Access: item['name_' + lang]
```

---

## Persistence

If you want language preference to persist between sessions:

```javascript
function setLang(l) {
  lang = l;
  try { localStorage.setItem('lang_pref', l); } catch(e) {}
  // ... rest of setLang
}

// On init
const savedLang = localStorage.getItem('lang_pref') || 'tl'; // Default to TL
setLang(savedLang);
```

---

## Testing Checklist

Before shipping a bilingual app:
- [ ] Every `data-k` element has a corresponding key in both `T.en` and `T.tl`
- [ ] All dynamically rendered buttons and labels use `t()` not hardcoded strings
- [ ] Switching language while a panel is open updates the panel content
- [ ] Toast messages use `t()` or lang ternary
- [ ] History log entries are logged in the active language
- [ ] No English strings leak into TL mode (search for hardcoded button text)
- [ ] Long Tagalog strings don't overflow buttons (check at 320px width)
