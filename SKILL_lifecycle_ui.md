# SKILL: Stage-Gated Lifecycle Pipeline UI

**Use this skill when:** Building a UI where objects (vehicles, orders, tasks) move forward through discrete stages, with gates and decision branches.

---

## Core Concept

A lifecycle pipeline has:
1. **Stages** — discrete states an object can be in
2. **Transitions** — allowed moves between stages
3. **Gates** — conditions that must be met to advance
4. **Branch** — an exception path (Hold, Rejected, etc.) that eventually rejoins the main flow

```
STAGE_A → STAGE_B → STAGE_C → STAGE_D → DONE
                  ↘ HOLD ↗ (rejoins at B after fix)
```

---

## Stage Definition Pattern

```javascript
const STAGES = ['port', 'pdi', 'stock', 'ready', 'released'];
const STAGE_LABELS = {
  port:     'Port Arrival',
  pdi:      'PDI',
  stock:    'Stockyard',
  ready:    'Ready',
  released: 'Released',
  hold:     'Hold'  // Exception stage
};

// Allowed forward transitions
const TRANSITIONS = {
  port:  ['pdi'],
  pdi:   ['stock', 'hold'],  // Normal or exception
  stock: ['ready'],
  ready: ['released'],
  hold:  ['pdi'],            // Return to inspection after fix
};
```

---

## Stage Advancement Function

```javascript
function advanceStage(id, newStage) {
  const obj = items.find(i => i.id === id);
  if (!obj) return;
  
  // Validate transition is allowed
  const allowed = TRANSITIONS[obj.stage];
  if (!allowed || !allowed.includes(newStage)) {
    console.warn(`Invalid transition: ${obj.stage} → ${newStage}`);
    return;
  }
  
  obj.stage = newStage;
  
  // Stage-specific side effects
  if (newStage === 'stock') {
    obj.stockDate = todayString();
    obj.maintenanceSchedule = generateSchedule(obj.stockDate);
  }
  if (newStage === 'released') {
    obj.releaseDate = todayString();
  }
  
  // Log the transition
  obj.history.unshift(`${todayString()}: Advanced to ${STAGE_LABELS[newStage]}`);
  
  saveData(items);
  refreshUI();
}
```

---

## Pipeline Progress Visualizer

For showing where an object is in the pipeline:

```javascript
function renderPipelineProgress(currentStage) {
  const stages = ['port', 'pdi', 'stock', 'ready', 'released'];
  const currentIdx = stages.indexOf(currentStage);
  // Hold maps to same position as PDI
  const activeIdx = currentStage === 'hold' ? 1 : currentIdx;
  
  return stages.map((s, i) => {
    const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending';
    return `
      <div class="sp-step">
        <div class="sp-node ${state}">${i < activeIdx ? '✓' : i + 1}</div>
        <div class="sp-label ${state}">${STAGE_LABELS[s]}</div>
      </div>
      ${i < stages.length - 1 ? `<div class="sp-line ${i < activeIdx ? 'done' : ''}"></div>` : ''}
    `;
  }).join('');
}
```

```css
.sp-node.done    { background: var(--ok);  color: #000; }
.sp-node.active  { background: var(--acc); color: #000; animation: pulse 1.4s ease-in-out infinite; }
.sp-node.pending { background: var(--bg3); color: var(--t3); border: 1px solid var(--bd); }
.sp-line         { flex: 1; height: 2px; background: var(--bg3); }
.sp-line.done    { background: var(--ok); }
@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.55 } }
```

---

## Stage-Conditional Action Buttons

The action a user can take depends on the current stage:

```javascript
function renderStageAction(obj) {
  switch(obj.stage) {
    case 'port':
      return `<button class="btn" onclick="advanceStage('${obj.id}','pdi')">
        START INSPECTION
      </button>`;
      
    case 'pdi': {
      const issues = obj.checks.filter(c => c.state === 'issue').length;
      const pending = obj.checks.filter(c => c.state === 'pending').length;
      if (issues > 0) return `
        <button class="btn dn" onclick="advanceStage('${obj.id}','hold')">
          PUT ON HOLD — ${issues} ISSUE${issues > 1 ? 'S' : ''}
        </button>
        <button class="btn ghost sm" onclick="advanceStage('${obj.id}','stock')">
          Override — proceed anyway
        </button>`;
      if (pending > 0) return `
        <div class="warning">${pending} items still pending</div>
        <button class="btn" onclick="advanceStage('${obj.id}','stock')">
          COMPLETE — ADVANCE
        </button>`;
      return `<button class="btn ok" onclick="advanceStage('${obj.id}','stock')">
        PASSED — ADVANCE
      </button>`;
    }
      
    case 'stock':
      return `<button class="btn ok" onclick="advanceStage('${obj.id}','ready')">
        PASS TO FINAL
      </button>`;
      
    case 'ready':
      return `
        <input id="recipient" placeholder="Recipient name">
        <button class="btn ok" onclick="release('${obj.id}')">RELEASE</button>
      `;
      
    case 'hold':
      return `<button class="btn" onclick="advanceStage('${obj.id}','pdi')">
        RESUME AFTER REPAIR
      </button>`;
      
    case 'released':
      return `<div class="info">Released on ${obj.releaseDate}</div>`;
  }
}
```

---

## Pipeline Bar (Home Screen Overview)

Shows counts at each stage at a glance:

```javascript
function renderPipelineBar(items) {
  const stages = ['port', 'pdi', 'stock', 'ready', 'released'];
  return stages.map((s, i) => {
    const count = items.filter(obj => obj.stage === s).length;
    return `
      <div class="pipe-step" onclick="filterToStage('${s}')">
        <div class="pipe-dot ${s}">${count}</div>
        <div class="pipe-label">${STAGE_LABELS[s]}</div>
      </div>
      ${i < stages.length - 1 ? '<div class="pipe-arr">›</div>' : ''}
    `;
  }).join('');
}
```

---

## Stage Color System

Assign a distinct color to each stage. Use it consistently on stripes, badges, dots, and the pipeline bar:

```css
/* Stage colors — apply to stripe, badge, dot, pipeline node */
.port     { --stage-color: #3b82f6; }  /* Blue  — new arrival */
.pdi      { --stage-color: #8b5cf6; }  /* Purple — inspection */
.stock    { --stage-color: #f59e0b; }  /* Amber  — active care */
.ready    { --stage-color: #22c55e; }  /* Green  — cleared */
.released { --stage-color: #8b91a0; }  /* Gray   — done */
.hold     { --stage-color: #ef4444; }  /* Red    — blocked */
```

The stripe at the top of each card is the most efficient stage indicator — readable in under a second across a list of 20+ items.

---

## History Log Pattern

Every stage transition should create an immutable log entry:

```javascript
// Format: "YYYY-MM-DD: Action description — TechName"
obj.history.unshift(`${todayString()}: PDI passed — moved to stockyard — J. Ramirez`);

// Never edit history, only prepend
// Display newest first (unshift pattern)
```

---

## Hold Branch Anti-Patterns

**Don't delete and recreate** — the object must keep its original ID, history, and data  
**Don't use a separate "rejected" dead end** — always provide a path back  
**Don't auto-advance on issue resolution** — require explicit tech confirmation  
**Do surface holds prominently** — they should be impossible to miss
