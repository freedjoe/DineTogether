# DineTogether — Security Audit

Scope: this repository, its browser data model, and the local helper server. No hosted environment was
available, so no production penetration test was performed.

## Severity summary

| ID | Severity | Finding | State |
|---|---|---|---|
| SEC-01 | **P1** | Admin dashboard has no authentication; `/#/_/admin` is URL obscurity only | **OPEN — production blocker** |
| SEC-02 | **P1** | No shared backend: all data (including client phone numbers) lives in the browser profile of whoever collected it | **OPEN — architectural** |
| SEC-03 | P2 | Stored XSS via profile/client names interpolated into SweetAlert2 HTML | **FIXED** |
| SEC-04 | P2 | Static server path traversal check used a bare prefix (`ROOTxyz` passed) | **FIXED** |
| SEC-05 | P2 | Wildcard CORS on all responses let any website call the local upload API | **FIXED** |
| SEC-06 | P2 | No Content-Security-Policy; app relies on inline scripts/styles and two CDNs | OPEN (needs nonce/hash migration) |
| SEC-07 | P2 | Third-party CDN script (`sql.js`) loaded without SRI/version pin beyond the URL | OPEN (documented) |
| SEC-08 | P3 | `api.ipify.org` receives client IPs for like deduplication | OPEN (privacy trade-off) |
| SEC-09 | P3 | Photo data URLs are stored inside the SQLite JSON column; the whole DB is re-exported on every write | OPEN (performance) |
| SEC-10 | P3 | Stale service-worker caches could pin an old release offline | **FIXED** |

## Fixed in this pass

**SEC-03 — stored XSS.** `deleteProfile()` / `deleteClient()` passed `profile.name` / `client.name`
unescaped into `adminConfirmDeleteProfileMsg` / `adminConfirmDeleteClientMsg`, which are rendered with
`innerHTML` by SweetAlert2. A companion named `<img src=x onerror=…>` executed in the admin session.
Both call sites now call `escapeHtml()` before interpolation. Regression-tested with a malicious name:
the dialog rendered `&lt;img …&gt;` and no element was injected.

**SEC-04 — path traversal.** `path.join(ROOT, url)` followed by `filePath.startsWith(ROOT)` allowed a
sibling directory such as `DineTogether-evil`. The check now compares against `ROOT + path.sep` (and URL
decoding happens once, with a 400 on malformed encoding).

**SEC-05 — CORS.** `Access-Control-Allow-Origin: *` was returned for static files and upload APIs.
It was removed; same-origin use is unaffected, cross-origin preflight/writes are now blocked.

**SEC-10 — cache pinning.** `sw.js` is registered with `updateViaCache: 'none'`, served with
`Cache-Control: no-cache`, and prunes non-current caches on fetch. Verified: only `dinetogether-v24`
remains after two reloads.

**SEC-11 — SVG upload hardening.** `/api/upload` and `/api/upload-url` now reject SVG payloads and
non-raster image MIME types, allowing only JPEG/PNG/WEBP/GIF uploads to reduce scriptable-file risk.

## Verified protections

- All user-supplied strings rendered through `escapeHtml()` (quotes and angle brackets).
- SQLite access is parameterized throughout `db.js`; the only raw SQL surface is the admin SQL runner,
  which is intentionally unrestricted and therefore part of SEC-01.
- No credentials, tokens or API keys exist in the repository; `.env.example` contains no secrets.
- Upload endpoints cap payloads (30 MB base64 / 5 MB URL) and whitelist file extensions; filenames are
  generated server-side from an integer id + index, so path injection through filenames is not possible.
- Uploaded SVG is accepted (`.svg`) and served from the same origin — an SVG with script could execute if
  opened directly. Mitigated by `X-Content-Type-Options: nosniff` but **not** by a CSP; treat as SEC-06.

## Required before public production

1. Put the admin behind real authentication/authorization (edge middleware, platform password protection,
   or a serverless auth provider) and move all writes behind authenticated APIs.
2. Move client/booking data to a shared database with server-side validation and row ownership.
3. Add a CSP with hashed/nonced inline scripts (or extract them) and SRI for CDN assets.
4. Decide whether IP collection is necessary; otherwise dedupe purely by device key.
5. Serve uploads from a dedicated bucket with content-type restrictions (reject SVG or rasterize).
