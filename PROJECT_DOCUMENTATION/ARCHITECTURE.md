# DineTogether — Architecture

## 1. Shape

```
Browser
├── index.html            shell: client view, admin view, 5 overlays
├── styles.css            design tokens + all component styles (LTR/RTL, light/dark)
├── app.js                state, rendering, routing, i18n, business rules
├── db.js                 SQLite (sql.js WASM) + IndexedDB persistence
├── sw.js                 offline cache (network-first shell, cache-first CDN)
└── manifest.json         installability

Local development only
└── server.js             static server + /api/upload* + /api/delete-profile-images

Production
└── static host (Vercel config present) — no server APIs, no shared database
```

## 2. Layers

**Presentation** — markup is generated as template strings inside `app.js`; every dynamic value passes
through `escapeHtml()`. Pages are toggled by `showPage()`; admin panels by `switchAdminTab()`.
Overlays use `openOverlay()` / `closeOverlay()` with focus trapping and scroll locking.

**State** — module-level `profiles`, `clients`, `requests`, `userLikedIds`, gallery and form state.
There is no store library and no reactive binding: mutations call explicit re-render functions
(`renderProfiles`, `renderAdminRequests`, `updateQuickStats`, …).

**Persistence** — `db.js` runs SQLite compiled to WASM in memory and exports the binary to IndexedDB
after every write (`persist()`). Photos are stored separately as data URLs in an IndexedDB object store.
The initial seed only runs when `profiles` is empty.

**Localization** — a single `I18N` dictionary (EN/FR/AR) with a `t()` accessor, `data-i18n*` attributes for
static markup, and explicit `t()` calls in generated markup. `dir` is switched on `<html>`; CSS contains
dedicated RTL rules. Location names and interest labels are mapped through `formatLocation()` and
`formatInterest()`.

**Offline** — the service worker pre-caches the shell, serves fonts/images/`sql.js` cache-first, and the
shell network-first with a cache fallback. `sw.js` is registered with `updateViaCache: 'none'` and served
with `Cache-Control: no-cache`, so a release cannot be pinned by a stale worker.

## 3. Request/data flow (booking)

```
Book button
→ openBookingModal(profileId)
→ client validation (name, phone ≥7 digits, date ≥ today, time, venue)
→ DB.clients.byPhone(phone)  ── miss → DB.clients.save(...)
→ DB.requests.save({status:'pending', profile snapshot, client snapshot})
→ SQLite persisted to IndexedDB
→ re-read clients/requests → admin badge + quick stats + hero stats update
→ toast + close modal
```

## 4. Deliberate constraints

- **Browser-local data** is the product model, not an accident. There is no account system, no API and
  no cross-device sync.
- **Admin is a route, not a role.** It is URL-obscured only; this is the main production blocker.
- **Photos** work in two modes: server-uploaded files (local dev) and inlined data URLs (any static host).
- **Identity for likes** is `ip_<ip>` when the IP lookup succeeds, otherwise the device UUID — one like per
  key, toggleable.

## 5. Dependencies

Runtime only, no package manager: Google Fonts, sql.js 1.10.3 (CDN), SweetAlert2 (vendored in
`assets/vendor`), `api.ipify.org`, `ui-avatars.com`. No npm install and no bundler are required.
