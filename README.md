# DineTogether

A premium dining companion matching PWA (Progressive Web App). Connects clients with curated dining companions through a beautifully designed, offline-capable web application.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES2022, `'use strict'`) |
| Database | [sql.js](https://sql.js.org/) — SQLite compiled to WebAssembly |
| Persistence | IndexedDB (binary SQLite blob + photo blob store) |
| PWA | Service Worker + Web App Manifest |
| Photos | Canvas API — auto-resize & JPEG compress to 800×1000px |
| Fonts | Google Fonts (Playfair Display, Inter) |

No build step, no framework, no server required — serves directly as static files.

---

## Project Structure

```
DineTogether/
├── index.html          # Single-page app shell (all views)
├── app.js              # Application logic, UI, event handling
├── db.js               # SQLite/IndexedDB database layer
├── styles.css          # Complete design system & responsive layout
├── sw.js               # Service Worker (offline + caching)
├── manifest.json       # PWA Web App Manifest
├── icons/
│   ├── icon-192.png    # PWA icon (192×192)
│   └── icon-512.png    # PWA icon (512×512)
└── _/
    └── admin/
        └── index.html  # Redirect to admin hash route
```

---

## Getting Started

### Development

No build process needed. Serve with any static file server:

```bash
# Option 1: Python (built-in)
python -m http.server 8080

# Option 2: Node.js (npx)
npx serve .

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Admin Panel

Navigate to `http://localhost:8080/#/_/admin` or use either of these shortcuts:
- **URL**: Append `#/_/admin` to the URL
- **Keyboard**: Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac)
- **Hidden trigger**: Click the DineTogether logo 3 times rapidly

---

## Features

### Client View
- **Browse Companions** — Grid of available dining companions with photos, bio, interests
- **Filter by Age** — 18–24, 25–29, 30–34, 35+
- **Filter by Interest** — Art, Music, Travel, Fitness, Technology, Food & Wine
- **Search** — Full-text search across name, bio, location, interests
- **Profile Modal** — Multi-photo gallery with lightbox, like button, booking CTA
- **Like System** — Device+IP keyed; each user can like once per companion
- **Book for Dinner** — Full booking form with client phone capture

### Admin Panel (`/#/_/admin`)
- **Profile Management** — Add/edit/delete companion profiles
- **Photo Studio** — Upload, optimize (canvas resize + JPEG compress), reorder, set cover photo
- **Booking Management** — Accept, decline, propose alternatives, move to pending, delete
- **Client Registry** — Auto-registered when a booking is submitted
- **SQLite Database Manager** — Live table stats, SQL query runner, export `.sqlite` & JSON

### PWA Features
- Installable on home screen (iOS & Android)
- Offline support via Service Worker cache
- Aurora canvas animation background
- Responsive from 320px to 1440px+
- Bottom sheet modals on mobile
- Touch swipe for photo gallery & lightbox

---

## Data & Storage

All data is stored **client-side only** (in the browser):

| Store | Contents | Technology |
|-------|----------|-----------|
| `sqlite_db` (IDB) | Profiles, clients, requests, likes | IndexedDB → sql.js SQLite |
| `photos` (IDB) | Optimized photo blobs (base64 JPEG) | IndexedDB |
| `dt_device_id` | Persistent device identifier | localStorage |
| `dt_client_ip` | Cached IP for like deduplication | localStorage |
| `pwa-dismissed` | PWA install banner state | sessionStorage |

**No backend server is required.** Data persists across browser sessions via IndexedDB. To reset data, clear the browser's IndexedDB for the origin.

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| ≥1200px | 4-column profile grid, full admin |
| 768–1199px | 2–3 column grid |
| ≤768px | Single column, bottom-sheet modals |
| ≤480px | Compact forms, 2-column client grid |

Tested at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440px.

---

## Production Deployment

Since this is a fully static app, deploy to any static hosting:

### Netlify
```bash
# Drag & drop the project folder at netlify.com/drop
# Or use CLI:
npx netlify deploy --dir . --prod
```

### Vercel
```bash
npx vercel --prod
```

### GitHub Pages
Push to a GitHub repo, then enable Pages from Settings → Pages → Deploy from branch.

### Nginx / Apache
Copy all files to the web server's document root. No server-side configuration needed.

---

## Environment Variables

This application has **no server-side environment variables** — it runs entirely in the browser.

The only external services used are:
- **Google Fonts** — CDN fonts (no API key required)
- **sql.js CDN** — WebAssembly SQLite from cdnjs.cloudflare.com (no API key required)
- **api.ipify.org** — Public IP lookup for like deduplication (no API key, gracefully falls back to device ID if unavailable)
- **Unsplash** — Public image CDN for seed data photos (no API key required for direct image URLs)
- **ui-avatars.com** — Auto-generated avatars for new clients (no API key required)

---

## Known Limitations

1. **Data is browser-local** — No multi-user sync, no cloud backup. Data lives in the current browser's IndexedDB.
2. **Like deduplication** — Based on IP + device ID. VPN users or shared IPs may be able to like multiple times.
3. **Photo storage** — Photos uploaded via the admin are stored as base64 in IndexedDB. Large numbers of high-resolution photos may impact performance. External URL photos have no storage impact.
4. **No authentication** — The admin panel is protected only by URL obscurity (`/#/_/admin`). For production use, add HTTP Basic Auth at the server/CDN level.
5. **sql.js bundle size** — The sql.js WASM file (~1.5MB) is loaded from CDN on first visit. Cached by Service Worker thereafter.
6. **Offline limitations** — Unsplash images require network on first load; they're cached by the Service Worker afterward.

---

## Security Notes

- No user passwords or sensitive credentials are stored
- All user input is HTML-escaped before rendering (`escapeHtml()`)
- SQL queries use parameterized statements throughout `db.js`
- The admin panel should be protected with HTTP Basic Auth in production (configure at your web server/CDN level)
- The `api.ipify.org` call is made with a 1.2s timeout and graceful fallback

---

## Build & Test

Since this is vanilla HTML/JS/CSS with no build step:

```bash
# Syntax check JavaScript (requires Node.js)
node --check app.js
node --check db.js

# Serve locally for testing
npx serve . -p 8080

# Check PWA manifest validity
npx pwa-asset-generator icons/icon-512.png icons/ --manifest manifest.json
```

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Edge 90+ | ✅ Full |
| Firefox 90+ | ✅ Full |
| Safari 15+ (iOS 15+) | ✅ Full |
| Samsung Internet 14+ | ✅ Full |

Requires: ES2022 (optional chaining, nullish coalescing), WebAssembly, IndexedDB, CSS custom properties.

---

*DineTogether v3.2 — Built with ❤️ and vanilla web technologies.*

