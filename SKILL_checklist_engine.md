# SKILL: Tap-Cycle Checklist Engine

**Use this skill when:** Building a mobile checklist where each item has multiple states that the user cycles through with a single tap — no separate confirm dialogs.

---

## Core Concept

A tap-cycle checklist item moves through states on each tap:

```
pending → done → issue → (na) → pending → ...
```

This is faster than separate buttons for each state, works with gloves, and creates immediate visual feedback.

---

## Checklist Item Data Structure

```javascript
const checklistTemplate = [
  { id: 'c1', section: 'Section A', name: 'Item description', priority: 'high' },
  { id: 'c2', section: 'Section A', name: 'Another item',    priority: 'med'  },
  { id: 'c3', section: 'Section B', name: 'Third item',      priority: 'low'  },
];

// Generated per object — add state and note fields
function generateChecklist() {
  return checklistTemplate.map(item => ({
    ...item,
    state: 'pending',  // 'pending' | 'done' | 'issue' | 'na'
    note:  '',         // Tech note — only shown/required for 'issue' state
  }));
}
```

---

## Toggle Function

```javascript
function toggleCheckItem(objectId, checklistType, itemIndex) {
  const obj = items.find(i => i.id === objectId);
  if (!obj) return;
  
  // Select the right checklist
  const list = checklistType === 'pdi' ? obj.pdiChecks : obj.finalChecks;
  
  // Cycle states
  const states = ['pending', 'done', 'issue', 'na'];
  const current = states.indexOf(list[itemIndex].state);
  list[itemIndex].state = states[(current + 1) % states.length];
  
  // Persist
  saveData(items);
  
  // Re-render the checklist view (not the full page)
  renderChecklist(obj, checklistType);
}
```

If you want only 3 states (no 'na'), remove it from the array:
```javascript
const states = ['pending', 'done', 'issue'];
```

---

## Rendering a Checklist

Group items by section for visual organization:

```javascript
function renderChecklist(obj, type) {
  const items = type === 'pdi' ? obj.pdiChecks : obj.finalChecks;
  const done  = items.filter(i => i.state === 'done').length;
  const issues = items.filter(i => i.state === 'issue').length;
  const sections = [...new Set(items.map(i => i.section))];
  
  let html = `
    <div class="checklist-summary">
      ${done}/${items.length} done ·
      <span class="${issues ? 'issues-found' : 'no-issues'}">
        ${issues} issue${issues !== 1 ? 's' : ''}
      </span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill ${issues ? 'warn' : 'ok'}"
           style="width: ${Math.round(done / items.length * 100)}%">
      </div>
    </div>
  `;
  
  sections.forEach(section => {
    html += `<div class="section-header">${section}</div>`;
    items.filter(i => i.section === section).forEach(item => {
      const idx = items.indexOf(item);
      html += renderCheckItem(obj.id, type, idx, item);
    });
  });
  
  return html;
}

function renderCheckItem(objId, type, idx, item) {
  return `
    <div class="chk-item">
      <div class="chkbox ${item.state}"
           onclick="toggleCheckItem('${objId}', '${type}', ${idx})">
        ${item.state === 'done'  ? '✓' :
          item.state === 'issue' ? '!' :
          item.state === 'na'    ? '—' : ''}
      </div>
      <div class="chk-content">
        <div class="chk-name">${item.name}</div>
        <div class="chk-priority ${item.priority}">${item.priority.toUpperCase()}</div>
        ${item.state === 'issue' ? `
          <input class="chk-note"
                 placeholder="Describe the issue…"
                 value="${item.note || ''}"
                 onblur="saveCheckNote('${objId}', '${type}', ${idx}, this.value)">
        ` : item.note ? `
          <div class="chk-note-display">${item.note}</div>
        ` : ''}
      </div>
    </div>
  `;
}
```

---

## CSS for Checklist Items

```css
.chk-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.chk-item:last-child { border-bottom: none; }

/* The tap target */
.chkbox {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 2px solid var(--bd);
  background: var(--bg3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 800;
  transition: all .15s;
  /* Note: the row itself provides the 52px tap area via padding */
}

.chkbox.done  { background: var(--ok); border-color: var(--ok); color: #000; }
.chkbox.issue { background: var(--dn); border-color: var(--dn); color: #fff; }
.chkbox.na    { background: var(--bg4); border-color: var(--bd); color: var(--t3); }

/* Priority badge */
.chk-priority { font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 3px; margin-top: 3px; display: inline-block; }
.chk-priority.high { background: var(--dnbg); color: #fca5a5; }
.chk-priority.med  { background: var(--wnbg); color: #fcd34d; }
.chk-priority.low  { background: var(--infbg); color: #93c5fd; }

/* Issue note input */
.chk-note {
  width: 100%;
  background: var(--bg2);
  border: 1px solid var(--dnbd);
  border-radius: 5px;
  color: var(--t1);
  font-size: 12px;
  padding: 6px 8px;
  outline: none;
  margin-top: 5px;
}
.chk-note-display {
  font-size: 11px;
  color: var(--wn);
  margin-top: 3px;
}

/* Section header */
.section-header {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .8px;
  color: var(--acc);
  text-transform: uppercase;
  margin: 10px 0 6px;
  padding: 5px 8px;
  background: var(--bg2);
  border-radius: 5px;
  border-left: 3px solid var(--acc);
}
```

---

## Note Auto-Save Pattern

Notes save on `onblur` (when the user taps away from the field), not on every keystroke:

```javascript
function saveCheckNote(objId, type, idx, value) {
  const obj = items.find(i => i.id === objId);
  if (!obj) return;
  const list = type === 'pdi' ? obj.pdiChecks : obj.finalChecks;
  list[idx].note = value;
  saveData(items);
  // No re-render needed — the input value is already correct in DOM
}
```

---

## Checklist Outcome Logic

```javascript
function getChecklistOutcome(checklist) {
  const issues  = checklist.filter(i => i.state === 'issue').length;
  const pending = checklist.filter(i => i.state === 'pending').length;
  const done    = checklist.filter(i => i.state === 'done').length;
  
  if (issues > 0)  return 'issues';   // Must address before advancing
  if (pending > 0) return 'partial';  // Can advance with warning
  return 'passed';                    // Clean pass
}

// Use in stage action rendering:
const outcome = getChecklistOutcome(obj.pdiChecks);
if (outcome === 'issues')  { /* Show hold button */ }
if (outcome === 'partial') { /* Show proceed with warning */ }
if (outcome === 'passed')  { /* Show clean pass button */ }
```

---

## Progress Visualization

```javascript
function checklistProgressHTML(checklist) {
  const total   = checklist.length;
  const done    = checklist.filter(i => i.state === 'done').length;
  const issues  = checklist.filter(i => i.state === 'issue').length;
  const pct     = Math.round(done / total * 100);
  const color   = issues > 0 ? 'wn' : 'ok';
  
  return `
    <div style="font-size:11px;color:var(--t2);margin-bottom:3px">
      ${done}/${total} done ·
      <span style="color:var(--${issues ? 'dn' : 'ok'})">
        ${issues} issue${issues !== 1 ? 's' : ''}
      </span>
    </div>
    <div class="prog-bar">
      <div class="prog-fill ${color}" style="width:${pct}%"></div>
    </div>
  `;
}
```

---

## Wizard Checklist (Subset)

For registration wizards, show only the highest-priority items (e.g., first 8 of 18):

```javascript
let wizardChecklist = generateChecklist().slice(0, 8);

// On wizard confirm, merge with the full checklist:
function buildFinalChecklist(wizPDI, fullTemplate) {
  return [
    ...wizPDI, // Wizard items with their states
    ...fullTemplate
      .filter(t => !wizPDI.find(w => w.id === t.id))
      .map(t => ({ ...t, state: 'pending', note: '' }))
  ];
}
```

This gives an immediate snapshot of the vehicle's condition at port while leaving the full checklist available for the detailed inspection in the yard.

---

## Accessibility Notes

- The `chkbox` element is 26×26px visual, but the full row (`chk-item`) is ≥52px due to padding — this is the actual tap area
- Never rely on the small checkbox alone as the only tap target
- Color alone must not convey state — the ✓ / ! / — symbols carry the meaning
- Issue notes should auto-focus when the state changes to 'issue'
