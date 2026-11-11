# Page record — Client view

- **Route:** `/` (`index.html`, view `#client-view`)
- **Purpose:** let a visitor browse curated dining companions, inspect a profile, like, and request a dinner.
- **Audited:** 10 Nov 2026 · **Status:** VERIFIED (local)

## Business logic reviewed

- Filtering/search AND semantics; results count; empty state reset.
- Like identity + one-like-per-key toggle with SQLite persistence.
- Booking validation (name, phone, date, time, venue), client upsert by phone, pending request creation.
- PWA install prompt state; theme/language persistence.

## Components reviewed

Hero, fixed toggles, filter bar, results header, profile cards (image/availability/photo count/tags/like/book),
footer, aurora canvas, orbs, install banner, toast host, loading overlay.

## Modals reviewed

Profile detail (gallery, thumbnails, swipe, lightbox, like, book), booking sheet, lightbox, confirm fallback.

## Defects found and fixed

| Defect | Fix |
|---|---|
| Past date accepted if typed rather than picked | `date < todayISO()` rejected |
| Phone rule allowed 6 digits while hint said 7 | minimum 7 |
| Booked/validation toasts hardcoded English | I18N keys for EN/FR/AR |
| “Saving…” and submit-restore labels hardcoded | localized |
| Locations and interest chips untranslated in FR/AR | `formatLocation`, `formatInterest` |
| Route switch kept previous scroll offset | scroll reset in `showPage()` |
| Focus-trap listener accumulated on every modal open | single bound handler with live focusable list |
| Like toasts hardcoded | `likeToast` / `unlikeToast` / `likeError` |

## Responsive results

320 / 390 / 768 / 1024 / 1440: no horizontal document overflow; booking sheet fits at 320 with 0 clipped
controls; 768 now renders a 2-column grid instead of one stretched card.

## Tests

See `TESTING.md` scenarios 1–9, 17–19, plus the RTL checks. No errors in the console. Screenshot evidence
could not be captured because the preview window was not drawn — layout was verified via DOM geometry.

## Remaining issues

- Install prompt not exercised (browser did not emit `beforeinstallprompt` in the test session).
- Lighthouse/axe and a real screen-reader pass are outstanding.
