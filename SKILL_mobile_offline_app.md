# SKILL: Mobile-First Offline App (Single HTML File)

**Use this skill when:** Building any app that must work without WiFi on a low-spec mobile phone, deployed as a single `.html` file.

---

## Core Constraint Checklist

Before writing a line of code, verify:
- [ ] No external fonts (system font stack only)
- [ ] No CDN libraries unless absolutely essential and cached
- [ ] No API calls
- [ ] localStorage or IndexedDB for all persistence
- [ ] All content renders in a single `.html` file
- [ ] Minimum 52px tap targets on all interactive elements
- [ ] Bottom navigation for primary pages
- [ ] Viewport meta: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no`

---

## App Shell Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>AppName</title>
  <style>/* All CSS inline */</style>
</head>
<body>
<div id="app">
  <!-- Topbar -->
  <!-- Pages (display:none by default, one active) -->
  <!-- Bottom nav -->
</div>
<!-- Overlays (fixed position) -->
<!-- Toast -->
<script>/* All JS inline */</script>
</body>
</html>
```

---

## CSS Reset for Mobile

```css
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
html,body{height:100%;overflow:hidden}
#app{display:flex;flex-direction:column;height:100%;max-width:480px;margin:0 auto}
```

Key rules:
- `touch-action:manipulation` — eliminates 300ms tap delay on Android
- `-webkit-tap-highlight-color:transparent` — removes blue flash on tap
- `overflow:hidden` on html/body — prevents bounce scrolling on iOS
- `max-width:480px` — centers on tablets, maintains phone feel

---

## Page System

```javascript
function nav(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.bn').forEach(el => el.classList.remove('active'));
  
  // Show target page
  document.getElementById('pg-' + pageId).classList.add('active');
  document.getElementById('bn-' + pageId).classList.add('active');
  
  // Trigger render
  if (pageId === 'home') renderHome();
  if (pageId === 'stock') renderStock();
  // etc.
}
```

```css
.page { display: none; flex-direction: column; flex: 1; overflow: hidden; }
.page.active { display: flex; }
.scroll { overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch; padding: 12px 12px 80px; }
```

`padding-bottom: 80px` on scroll containers prevents content from hiding behind the bottom nav.

---

## localStorage Pattern

```javascript
const STORAGE_KEY = 'myapp_v1';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  // First run — use seed data
  const seed = getSeedData();
  saveData(seed);
  return seed;
}

function saveData(arr) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch(e) {
    // Silent fail — data in memory for session
  }
}
```

**Version the key** (`v1`, `v2`) so schema changes don't break existing users.

---

## Slide-Up Panel Pattern

```html
<!-- Trigger -->
<button onclick="openPanel()">Open</button>

<!-- Overlay -->
<div class="overlay" id="my-panel" onclick="closeIfBg(event,'my-panel')">
  <div class="panel">
    <div class="panel-handle"></div>
    <div class="panel-head">...</div>
    <div class="panel-scroll" id="panel-content"></div>
  </div>
</div>
```

```css
.overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:200; align-items:flex-end; }
.overlay.open { display:flex; }
.panel { background:var(--bg1); border-radius:18px 18px 0 0; width:100%; max-height:94vh; display:flex; flex-direction:column; overflow:hidden; }
.panel-handle { width:32px; height:4px; border-radius:2px; background:var(--bg4); margin:9px auto 0; flex-shrink:0; }
.panel-scroll { overflow-y:auto; flex:1; padding:14px 16px 28px; -webkit-overflow-scrolling:touch; }
```

```javascript
function closeIfBg(e, id) {
  if (e.target === document.getElementById(id)) closePanel(id);
}
function closePanel(id) {
  document.getElementById(id).classList.remove('open');
}
```

---

## Bottom Navigation

```html
<nav class="bnav">
  <div class="bn active" id="bn-home" onclick="nav('home')">
    <svg viewBox="0 0 24 24">...</svg>
    HOME
  </div>
  <!-- more tabs -->
</nav>
```

```css
.bnav { display:flex; background:var(--bg1); border-top:1px solid var(--bd); flex-shrink:0; }
.bn { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8px 2px 10px; gap:3px; font-size:9px; font-weight:700; letter-spacing:.4px; color:var(--t3); cursor:pointer; min-height:54px; }
.bn.active { color:var(--acc); }
.bn svg { width:20px; height:20px; stroke:currentColor; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
```

---

## Toast Notification

```javascript
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => t.classList.remove('show'), 2200);
}
```

```css
.toast { position:fixed; bottom:64px; left:50%; transform:translateX(-50%) translateY(14px); background:var(--bg3); border:1px solid var(--bd); border-radius:8px; padding:8px 16px; font-size:12px; font-weight:600; opacity:0; transition:all .25s; z-index:999; pointer-events:none; white-space:nowrap; max-width:90vw; }
.toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
.toast.ok { border-color:var(--okbd); color:var(--ok); }
.toast.dn { border-color:var(--dnbd); color:var(--dn); }
```

**Critical:** `bottom: 64px` — must appear above the bottom nav bar.

---

## Performance Rules for Low-Spec Devices

1. **Avoid `position: fixed` inside scroll containers** — causes repaint on every scroll frame
2. **Use `transform` not `top/left` for animations** — GPU-composited
3. **innerHTML over createElement** for list rendering — fewer DOM operations
4. **Debounce search inputs** — `setTimeout(fn, 150)` prevents re-render on every keystroke
5. **No CSS `backdrop-filter`** — too expensive on low-end GPUs
6. **No `box-shadow` on scrolling content** — repaints on scroll
7. **Minimize `overflow: auto`** on nested elements — one scroll container per page

---

## Deployment

A single `.html` file can be distributed by:
- USB cable (copy to phone storage)
- Email attachment (open in browser)
- WhatsApp / Telegram file share
- Local network file share
- Google Drive (download and open)

No server, no app store, no install process.
