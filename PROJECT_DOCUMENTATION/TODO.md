# DineTogether — Remaining Work

## P0 — before any public production use

1. **Admin authentication/authorization.** The dashboard is route-obscured only. Requires an edge/server
   auth layer (platform password protection, or a serverless auth provider) plus authenticated write APIs.
   Owner decision needed: static-host password protection vs. introducing a backend.
2. **Decide the data architecture.** Today every visitor gets an isolated browser-local database and the
   operator sees only bookings made on their own device. A shared database/API (Supabase, D1, etc.) is
   required for a real marketplace. This is an architecture change, not a bug fix.

## P1 — correctness/robustness

3. Move photo storage out of `profiles.photos` JSON when data-URL fallback is used (SQLite is re-exported
   in full on every write; large galleries will degrade persistence).
4. Unlink IndexedDB photo records when a photo is removed from the profile form or a profile is deleted.
5. Reuse one like-handler implementation (card + modal duplicate the same logic).
6. Localize the remaining admin utility strings (exports, SQL runner empty states, install/fallback toasts).
7. Replace `api.ipify.org` identity with a privacy-preserving device key (or make it optional).

## P2 — quality

8. Add a CSP (extract inline theme bootstrap or add hashes) and SRI for CDN resources.
9. Add automated Playwright smoke specs for the 22 scenarios in `TESTING.md`, wired into CI.
10. Add a real 404 page/route handling for unknown paths on static hosts.
11. Add pagination/virtualization if the companion list grows beyond a few dozen.
12. Add Lighthouse + axe accessibility passes; verify with a screen reader.
13. Validate the deployed origin (headers, service worker update path, auth) once a host is authorised.

## Explicitly not planned without a request

- Native iOS/Android app (no Expo/React Native project exists).
- Payments, messaging, notifications, reviews/ratings UI (data columns exist but there is no product flow).
