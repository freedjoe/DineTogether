# DineTogether — Testing Record

Date: 10–11 Nov 2026
Host: Windows (Dell), Node.js **v26.13.0**, Chromium via the Freebuff Local browser.
Server: `node server.js` → `http://localhost:8080` (logs: `/tmp/dinetogether-server.log`).
Browser data: fresh profile for the audit, seeded by the app on first run.

## Static checks

| Command | Result |
|---|---|
| `node --check app.js` | PASS |
| `node --check db.js` | PASS |
| `node --check server.js` | PASS |
| `node --check sw.js` | PASS |
| `JSON.parse(manifest.json)` | PASS |
| `curl` `/`, `/app.js`, `/styles.css`, `/assets/images/profile-1-1.jpg`, `/_/admin/` | 200 |
| Console after load and all flows | no errors, no failed requests |

## Functional scenarios

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | Initial load | 6 seeded companions, 2 bookings, 3 clients, no console errors | PASS |
| 2 | Age filter `18–24` | Yuki, Olivia | PASS |
| 3 | Age + interest (`18–24` + music) | Olivia only | PASS |
| 4 | Search `tokyo` | Yuki; count “1 of 6 companions”; clear button visible | PASS |
| 5 | Search `zzzzzz` | Empty state; “clear all filters” restores 6 cards | PASS |
| 6 | Profile modal | 4 thumbnails, counter `1 / 4`, next → `2 / 4`, main image changes | PASS |
| 7 | Lightbox | Opens from modal, closes, body scroll restored | PASS |
| 8 | Like toggle (card) | 184 → 185 → 184; `aria-pressed` flips; persisted in SQLite | PASS |
| 9 | Booking invalid phone (`123`) | Localized error toast, no row written | PASS |
| 10 | Booking past date (`2020-01-01`) | Localized error toast, no row written | PASS |
| 11 | Booking valid | Row persisted (`pending`), client created, modal closes, success toast | PASS |
| 12 | Admin: booking accept | Status becomes `accepted` in SQLite, toast + badge update | PASS |
| 13 | Admin: SQL runner `SELECT id,name FROM profiles` | 6 rows rendered | PASS |
| 14 | Admin: add profile | Row created (id 7), modal closes, toast | PASS |
| 15 | Admin: clients / bookings / DB tabs | All render, counts consistent (6/3/2) | PASS |
| 16 | Confirm dialog with `<img onerror>` name | Escaped text, no injected element, no script execution | PASS |
| 17 | EN → FR → AR | Headings, filters, tags, locations, toasts translate; `dir=rtl` for AR | PASS |
| 18 | AR card data | `28 سنة · باريس، فرنسا`, tags `فن / طعام / سفر` | PASS |
| 19 | Theme toggle | Light/dark variables switch; `meta[theme-color]` follows (`#fdf9fa` / `#080206`) | PASS |
| 20 | Service worker | v24 installs, old v23 cache pruned after reloads | PASS |
| 21 | `POST /api/upload` + `POST /api/delete-profile-images` | File written, served 200, then deleted (404) | PASS |
| 22 | Corrupt/missing profile on booking | Localized failure toast, no partial row | PASS (code path) |
| 23 | Local date handling | `todayISO()` = date picker `min` = local calendar date (`2026-11-11`) | PASS |

## Layout verification (DOM metrics, not screenshots)

| Viewport | Client | Admin |
|---|---|---|
| 320 × 568 | 0 px horizontal overflow; booking sheet fits (0 clipped controls) | 0 px overflow outside the intentional tab scroller |
| 390 × 844 | 0 px overflow; toggles inside the viewport | tabs scroll horizontally by design |
| 768 × 1024 | 2-column grid (357 px cards) after the tablet fix | auto-fill grid |
| 1024 × 768 | 3 columns | — |
| 1440 × 900 | 4 columns, results count inside the section | — |
| RTL 1280 | text blocks inside the viewport, 0 px document overflow | RTL padding rules applied |

## Verification limits (not passes)

- **No native mobile runtime**: the repository contains no React Native/Expo/Capacitor app, so Android/iOS
  builds, emulators and native keyboard/safe-area behaviour could not be tested. Only mobile **web** was
  validated.
- **No hosted deployment**: Vercel/Netlify were not deployed (not authorised and no credentials used).
  Production headers in `vercel.json` are configuration only, not verified live.
- **Screenshots blocked**: the preview window was not drawn/visible during capture (“page has not been
  drawn yet”), so screenshots were distorted or blank. No visual evidence is claimed; layout was verified
  through computed geometry, `scrollWidth`/`clientWidth`, and element rects.
- **No automated test suite in CI**: all checks above were run interactively through the local browser and
  curl. Adding Playwright specs (`playwright-chromium`) is listed in TODO.
- **No performance profiling** (Lighthouse/WebPageTest) and no accessibility audit with a screen reader.
