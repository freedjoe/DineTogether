# DineTogether — Project Inventory

Baseline commit: `516b32a` (main). Audited at v3.2, 10 Nov 2026.
Application type: **single-page, client-side-only PWA** (no framework, no build step).

## 1. Web routes

| Route | Type | Purpose | Status |
|---|---|---|---|
| `/` and `/index.html` | Real page | Client-facing companion discovery | Verified |
| `/#/_/admin` | Hash route (client-side) | Admin dashboard | Verified |
| `/#/admin` | Compatibility alias | Same admin view | Verified |
| `/_/admin/` | Static redirect page (`_/admin/index.html`) | Rewrites to `/#/_/admin` via script + meta refresh | Verified (HTTP 200) |
| `/{path}/_/admin` | Path alias | Detected by `isCurrentRouteAdmin()` | Not host-configured |

There are **no dynamic routes, no nested pages and no route-level modals**. Modals are DOM overlays, not URLs.
Admin is also reachable via `Ctrl/Cmd+Shift+A` and a triple-click on the logo.

## 2. Client view (single page)

| Section | Components | Actions |
|---|---|---|
| Fixed chrome | Language toggle (EN/FR/AR), theme toggle | Cycle language, toggle theme (persisted) |
| Hero | Logo, `h1`, subtitle, aurora canvas, floating orbs | Triple-click logo → admin |
| Filters | Age select, interest select, search input + clear | Filter/search the grid, clear all |
| Results | Heading, live results count, profile grid | Open profile, like, book |
| Footer | Brand, copyright year | — |
| Global | PWA install banner, toast host, loading overlay | Install / dismiss |

## 3. Admin view (single page, four tabs)

| Tab | Components | Actions |
|---|---|---|
| Profiles | Quick stats, profile cards | Add, edit (incl. photo studio), delete |
| Bookings | Status filter pills + counts, request cards | Accept, decline, cancel, re-accept, move to pending, propose alternative, delete |
| Clients | Client cards with booking counts | Delete client |
| SQLite DB | Engine/storage info, live row counts, SQL runner, export buttons | Run SQL, export `.sqlite`, export JSON |

## 4. Modals and overlays

| Overlay | Purpose | Key behaviours |
|---|---|---|
| `#profile-modal` | Full-screen profile detail | Photo gallery, thumbnails, swipe, lightbox, like, book |
| `#booking-modal` | Booking form **and** "propose alternative" picker (shared) | Validation, phone capture, submit |
| `#profile-form-modal` | Add/edit profile + photo studio | Upload (canvas compression), URL import, cover photo, delete photo |
| `#lightbox-modal` | Full-size photo | Swipe / pull-down dismiss |
| `#confirm-dialog-modal` | Built-in confirm fallback | SweetAlert2 is preferred when available |
| `#install-banner` | PWA install prompt | Install / dismiss (sessionStorage) |

## 5. Data model (SQLite via sql.js, persisted to IndexedDB)

| Table | Columns | Notes |
|---|---|---|
| `profiles` | id, name, age, bio, cuisine, interests (JSON), location, rating, reviews, ratings (JSON), available, photos (JSON), likes, created_at | Photos may be `/assets/images/...` URLs or base64 data URLs |
| `clients` | id, name, email, phone, avatar, join_date | Created automatically on booking; deduped by phone |
| `requests` | id, client_id, client_name, client_phone, client_avatar, profile_id, profile_name, profile_image, date, time, restaurant, message, status, created_at | Status: `pending` / `accepted` / `declined` (`cancelled` treated as declined) |
| `profile_likes` | profile_id, user_key, created_at | Composite PK; one like per profile per user key |

IndexedDB database `DineTogetherV3`:
- `sqlite_db` — the whole SQLite binary (`main`) rewritten on every write.
- `photos` — optimized data URLs (`id` autoIncrement, `profile_id` index).

Local storage: `dt_device_id`, `dt_client_ip`, `dinetogether-theme`, `dinetogether-lang`.
Session storage: `pwa-dismissed`.

## 6. Backend and integrations

| Surface | Reality |
|---|---|
| Production backend | **None** — static hosting only; all data is per-browser |
| `server.js` (local dev only) | Static server + `POST /api/upload`, `POST /api/upload-url`, `POST /api/delete-profile-images` |
| Google Fonts | Runtime CSS/woff2 |
| cdnjs | `sql-wasm.js` + `sql-wasm.wasm` 1.10.3 |
| `api.ipify.org` | Optional 1.2 s IP lookup for like identity |
| `ui-avatars.com` | Fallback avatars for newly created clients/profiles |
| Unsplash | Legacy seed URLs only; current seed photos are local `/assets/images/*` |

## 7. Mobile

No React Native / Expo / Capacitor project exists and no native screens are present.
The mobile product is the **installable PWA**: manifest, service worker, safe-area CSS, bottom-sheet modals,
touch swipe, 320 px–1440 px responsive layouts. It was therefore audited as mobile web, not as a native app.

## 8. Source map

| File | Lines | Responsibility |
|---|---|---|
| `index.html` | 451 | Shell, all views/modals, theme bootstrap |
| `app.js` | 3144 | State, rendering, i18n, admin, modals, booking, likes |
| `db.js` | 587 | sql.js schema, migrations, seed, CRUD, IndexedDB persistence |
| `styles.css` | 3248 | Tokens, components, responsive, RTL |
| `server.js` | 350 | Local static + upload helper |
| `sw.js` | 94 | Offline cache (v24) |
| `manifest.json` | — | PWA metadata |
