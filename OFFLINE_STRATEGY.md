# StockMo — Offline Strategy

## Current: localStorage

All vehicle data is persisted to `localStorage` under the key `stockmo_v4`.

```javascript
function saveCars(arr) {
  try {
    localStorage.setItem('stockmo_v4', JSON.stringify(arr));
  } catch(e) {
    // Silent fail — data still in memory for session
  }
}
```

**Capacity:** localStorage allows ~5MB per origin. At ~2KB per vehicle object, this supports ~2,500 vehicles before hitting limits.

**Persistence:** Survives browser close, phone sleep, and app switch. Cleared only by explicit browser data wipe or user clearing site data.

---

## Roadmap: IndexedDB Upgrade

For fleets larger than 200 vehicles, migrate to IndexedDB:

```javascript
// Future: IndexedDB adapter
const DB_NAME = 'stockmo';
const DB_VERSION = 1;

async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('vehicles')) {
        db.createObjectStore('vehicles', { keyPath: 'id' });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
```

IndexedDB supports hundreds of MBs and allows indexed queries by stage, technician, or date — enabling faster filtering without loading the full array.

---

## Roadmap: PWA Install (Add to Home Screen)

Adding a Web App Manifest and Service Worker converts StockMo into an installable PWA:

### manifest.json
```json
{
  "name": "StockMo",
  "short_name": "StockMo",
  "start_url": "/StockMo.html",
  "display": "standalone",
  "background_color": "#0b0d11",
  "theme_color": "#f5a623",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker (sw.js)
```javascript
const CACHE = 'stockmo-v1';
const ASSETS = ['/StockMo.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
```

Once installed, the app loads from cache even with airplane mode on.

---

## Roadmap: QR Code Sync

Transfer full inventory between phones without WiFi using QR codes:

```javascript
// Export: compress cars[] to base64 QR payload
function exportQR() {
  const data = JSON.stringify(cars);
  const compressed = btoa(unescape(encodeURIComponent(data)));
  // Generate QR from compressed string
  // QR libraries: qrcode.js (CDN: cdnjs.cloudflare.com)
}

// Import: scan QR on receiving phone
function importQR(qrString) {
  const data = JSON.parse(decodeURIComponent(escape(atob(qrString))));
  // Merge or replace — user choice
  cars = data;
  saveCars(cars);
  renderHome();
}
```

For large fleets, use a diff-based approach: only transmit vehicles modified since a given date.

---

## Roadmap: Plain Text Shift Report (SMS)

Generate a shift handoff report shareable via SMS or messaging apps:

```javascript
function generateShiftReport() {
  const holds = cars.filter(c => c.stage === 'hold');
  const pdi = cars.filter(c => c.stage === 'pdi');
  const maintDue = cars.filter(c => c.stage === 'stock' && hasMaintDue(c));

  let report = `STOCKMO SHIFT REPORT — ${todayS()}\n\n`;
  report += `HOLD (${holds.length}): ${holds.map(c => c.id).join(', ')}\n`;
  report += `PDI IN PROGRESS (${pdi.length}): ${pdi.map(c => c.id).join(', ')}\n`;
  report += `MAINT OVERDUE (${maintDue.length}): ${maintDue.map(c => c.id).join(', ')}\n`;

  // Web Share API — works on Android Chrome
  if (navigator.share) {
    navigator.share({ title: 'StockMo Shift Report', text: report });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(report);
  }
}
```
