# Page record — Admin view

- **Route:** `/#/_/admin` (+ `/#/admin`, `/_/admin/` redirect)
- **Purpose:** manage companion profiles/photos, booking requests, clients and the SQLite store.
- **Audited:** 10 Nov 2026 · **Status:** VERIFIED functionally; **BLOCKED for production (no auth)**.

## Business logic reviewed

- Profile create/edit/delete, id allocation, photo targeting, availability, likes editing.
- Booking state machine (accept/decline/cancel/re-accept/pending), alternative proposal, deletion.
- Client listing with derived accepted/pending counts, deletion.
- Live row stats, SQL runner (`SELECT`/`PRAGMA` vs. mutating statements), `.sqlite` and JSON export.

## Components reviewed

Header strip + quick stats, tab bar (with badge), profile cards, request cards + filter pills, client cards,
DB status cards, SQL runner table, modal form (basic info, preferences, photo studio, likes/status).

## Defects found and fixed

| Defect | Fix |
|---|---|
| Empty photo studio rendered the literal text `${(I18N[currentLang]…).adminNoPhotosYet}` | corrected to a template literal (EN/FR/AR verified) |
| Profile/client names injected unescaped into confirm dialogs (stored XSS) | escaped at both call sites |
| Uploaded photo records saved with `profile_id = null` | saved with the target profile id |
| Admin save/delete/photo toasts hardcoded English | localized keys added for EN/FR/AR |
| Status change stayed applied in UI when persistence failed | rollback + reload |
| SQL success toast ignored existing translations | uses `adminSqlSuccess` / `adminSqlError` |
| Delete-profile toast concatenated an English prefix | localized prefix |

## Responsive results

320: 0 px overflow outside the tab scroller (tabs scroll horizontally by design; filter pills likewise),
cards 284 px. Quick stats remain visible above 900 px; hidden below 900 px by existing design.

## Tests

`TESTING.md` scenarios 12–16, 21, plus SQL runner counts (6/3/2), create/delete cleanup, and the escaped-XSS
regression. Console clean. No screenshot evidence (preview window not drawn).

## Remaining issues

- **SEC-01:** no authentication/authorization. This is the single reason the app cannot be called
  production-ready as an operator-facing product.
- Raw SQL runner is intentionally unrestricted; it must stay behind authenticated infrastructure.
- File-picker upload was validated through the endpoint, not through an automated browser file selection.
