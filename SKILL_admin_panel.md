# SKILL: Supervisor Admin Panel

**Use this skill when:** Building a supervisor/admin view that sits on top of a technician-facing app, showing fleet-wide stats, team management, and an audit trail.

---

## Panel Architecture

The admin panel is a slide-up overlay — not a separate page. This means:
- Supervisors access it without losing their place in the main app
- It renders fresh every time it opens (always shows current data)
- It shares the same data layer as the technician views

```javascript
function openAdmin() {
  renderAdminBody();  // Always re-render with latest data
  document.getElementById('admin-ov').classList.add('open');
}
```

---

## Admin Panel Sections (in order)

1. **Stat cards** — fleet-wide counts at a glance (2×2 grid)
2. **Stage breakdown** — horizontal bar chart showing vehicles per stage
3. **Technician roster** — who's working on what
4. **Exception alerts** — Hold vehicles, overdue items (only shown if present)
5. **Assign technician** — quick reassignment form
6. **Audit log** — all recent activity across all vehicles

---

## Stat Cards

```javascript
function renderStatCards(items) {
  const total    = items.length;
  const onHold   = items.filter(i => i.stage === 'hold').length;
  const maintDue = items.filter(i => i.stage === 'stock' && hasMaintDue(i)).length;
  const ready    = items.filter(i => i.stage === 'ready').length;
  const released = items.filter(i => i.stage === 'released').length;

  return `
    <div class="stat-grid">
      <div class="stat-card info">
        <div class="stat-label">Total Fleet</div>
        <div class="stat-val">${total}</div>
        <div class="stat-sub">${released} released</div>
      </div>
      <div class="stat-card warn">
        <div class="stat-label">Maint Due</div>
        <div class="stat-val">${maintDue}</div>
        <div class="stat-sub">stockyard vehicles</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-label">On Hold</div>
        <div class="stat-val">${onHold}</div>
        <div class="stat-sub">PDI failures</div>
      </div>
      <div class="stat-card ok">
        <div class="stat-label">Ready</div>
        <div class="stat-val">${ready}</div>
        <div class="stat-sub">awaiting dealer</div>
      </div>
    </div>
  `;
}
```

```css
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.stat-card { background: var(--bg1); border: 1px solid var(--bd); border-radius: var(--rL); padding: 11px 13px; }
.stat-label { font-size: 10px; font-weight: 700; letter-spacing: .8px; color: var(--t3); text-transform: uppercase; margin-bottom: 4px; }
.stat-val { font-size: 25px; font-weight: 900; letter-spacing: -1px; line-height: 1; }
.stat-sub { font-size: 10px; color: var(--t3); margin-top: 3px; }
.stat-card.info .stat-val   { color: var(--inf); }
.stat-card.warn .stat-val   { color: var(--wn);  }
.stat-card.danger .stat-val { color: var(--dn);  }
.stat-card.ok .stat-val     { color: var(--ok);  }
```

---

## Stage Breakdown Bar Chart

A visual horizontal bar chart — no library needed:

```javascript
function renderStageBreakdown(items, stages) {
  const total = items.length || 1;
  
  return `
    <div class="admin-section">
      <div class="admin-section-head">
        <div class="admin-section-title">Stage Breakdown</div>
        <div style="font-size:10px;color:var(--t3)">${total} total</div>
      </div>
      <div class="admin-section-body">
        ${stages.map(({ stage, label, color }) => {
          const count = items.filter(i => i.stage === stage).length;
          const pct   = Math.round(count / total * 100);
          return `
            <div class="sr-row">
              <div class="sr-label" style="color:${color}">${label}</div>
              <div class="sr-bar-wrap">
                <div class="sr-bar" style="width:${pct}%;background:${color}"></div>
              </div>
              <div class="sr-cnt" style="color:${color}">${count}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
```

```css
.sr-row { display:flex; align-items:center; gap:10px; padding:7px 0; border-bottom:1px solid rgba(255,255,255,.04); }
.sr-row:last-child { border-bottom: none; }
.sr-label { font-size:11px; font-weight:700; width:76px; flex-shrink:0; }
.sr-bar-wrap { flex:1; height:7px; background:var(--bg3); border-radius:4px; overflow:hidden; }
.sr-bar { height:100%; border-radius:4px; transition: width .4s; }
.sr-cnt { font-size:12px; font-weight:800; width:24px; text-align:right; flex-shrink:0; }
```

---

## Technician Roster

Shows each technician, their active vehicle assignments, and online status:

```javascript
function renderTechRoster(techs, items) {
  return techs.map(tech => {
    const active   = items.filter(i => i.assignedTech === tech.id && i.stage !== 'released');
    const released = items.filter(i => i.assignedTech === tech.id && i.stage === 'released').length;
    
    return `
      <div class="tech-row">
        <div class="tech-avatar" style="background:${tech.color}22;color:${tech.color};border:1px solid ${tech.color}44">
          ${tech.initials}
        </div>
        <div class="tech-info">
          <div class="tech-name">${tech.name}</div>
          <div class="tech-role">${tech.role}</div>
          <div class="tech-stats">
            <div class="tech-stat">${active.length} active</div>
            <div class="tech-stat">${released} released</div>
            ${active.map(i => `<div class="tech-stat" style="color:${tech.color}">${i.id}</div>`).join('')}
          </div>
        </div>
        <div class="tech-online ${tech.online ? 'on' : 'off'}"></div>
      </div>
    `;
  }).join('');
}
```

```css
.tech-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,.04); }
.tech-row:last-child { border-bottom: none; }
.tech-avatar { width:33px; height:33px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; flex-shrink:0; }
.tech-stats { display:flex; gap:5px; margin-top:3px; flex-wrap:wrap; }
.tech-stat { font-size:10px; padding:2px 5px; border-radius:3px; background:var(--bg3); color:var(--t2); font-weight:600; }
.tech-online { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.tech-online.on  { background: var(--ok); }
.tech-online.off { background: var(--t3); }
```

---

## Exception Alerts Section

Only render this section if exceptions exist — don't show an empty section:

```javascript
function renderHoldAlerts(items) {
  const holds = items.filter(i => i.stage === 'hold');
  if (!holds.length) return ''; // Hidden if no holds
  
  return `
    <div class="admin-section">
      <div class="admin-section-head">
        <div class="admin-section-title" style="color:var(--dn)">Hold Vehicles — Action Needed</div>
      </div>
      <div class="admin-section-body">
        ${holds.map(item => `
          <div class="hold-row" onclick="closeAdmin(); openDetail('${item.id}')">
            <div>
              <div class="hold-name">${item.id} — ${item.make} ${item.model}</div>
              <div class="hold-issues">${item.pdiChecks.filter(c => c.state === 'issue').length} PDI issues · LOT ${item.lot}</div>
            </div>
            <div class="sbadge hold">Hold</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
```

Tapping a Hold vehicle closes the admin panel and opens the vehicle detail directly.

---

## Assign Technician Form

```javascript
function renderAssignForm(items, techs) {
  return `
    <div class="admin-section">
      <div class="admin-section-head">
        <div class="admin-section-title">Assign Technician</div>
      </div>
      <div class="admin-section-body">
        <div class="form-field">
          <label>Vehicle</label>
          <select id="asgn-vehicle" style="min-height:44px">
            ${items.filter(i => i.stage !== 'released').map(i =>
              `<option value="${i.id}">${i.id} — ${i.make} ${i.model} (${stageLabel(i.stage)})</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Technician</label>
          <select id="asgn-tech" style="min-height:44px">
            ${techs.map(t => `<option value="${t.id}">${t.name} — ${t.role}</option>`).join('')}
          </select>
        </div>
        <button class="btn acc sm" onclick="adminAssign()" style="min-height:44px">
          ASSIGN
        </button>
      </div>
    </div>
  `;
}

function adminAssign() {
  const vehicleId = document.getElementById('asgn-vehicle').value;
  const techId    = document.getElementById('asgn-tech').value;
  const item = items.find(i => i.id === vehicleId);
  const tech = techs.find(t => t.id === techId);
  if (!item || !tech) return;
  
  item.assignedTech = techId;
  item.history.unshift(`${todayString()}: Assigned to ${tech.name} — Admin`);
  
  saveData(items);
  showToast(`${vehicleId} → ${tech.name}`, 'ok');
  renderAdminBody(); // Re-render to show updated assignment
}
```

---

## Audit Log

Aggregates history from all vehicles, newest first:

```javascript
function renderAuditLog(items, limit = 15) {
  const allHistory = items
    .flatMap(item =>
      item.history.map(entry => {
        const colonIdx = entry.indexOf(':');
        return {
          date: entry.slice(0, colonIdx),
          text: entry.slice(colonIdx + 2),
          stage: item.stage,
          itemId: item.id,
        };
      })
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
  
  return allHistory.map(h => `
    <div class="hist-item">
      <div class="hdot ${h.stage}"></div>
      <div>
        <div class="htxt"><strong>${h.itemId}</strong>: ${h.text}</div>
        <div class="htime">${h.date}</div>
      </div>
    </div>
  `).join('');
}
```

---

## Admin Panel CSS Shell

```css
.admin-section { background:var(--bg1); border:1px solid var(--bd); border-radius:var(--rL); margin-bottom:12px; overflow:hidden; }
.admin-section-head { padding:11px 13px 9px; border-bottom:1px solid var(--bd); display:flex; align-items:center; justify-content:space-between; }
.admin-section-title { font-size:11px; font-weight:700; letter-spacing:.8px; color:var(--t2); text-transform:uppercase; }
.admin-section-body { padding:11px 13px; }
```

---

## Access Control Options

**No gate (StockMo v1.0):** Direct tap — appropriate for small teams with mutual trust  
**Soft gate (optional):** Simple 4-digit PIN stored in the app:
```javascript
const ADMIN_PIN = '1234';
let pinBuffer = '';

function checkPin() {
  if (pinBuffer === ADMIN_PIN) { openAdminPanel(); pinBuffer = ''; }
  else if (pinBuffer.length >= 4) { pinBuffer = ''; showError(); }
}
```

**Never use PIN for security** — `localStorage` is readable by anyone with physical access to the phone. PIN is only for accidental access prevention.
