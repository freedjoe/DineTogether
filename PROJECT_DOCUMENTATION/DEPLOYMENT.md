# DineTogether — Deployment

## 1. Local development

```bash
node server.js          # http://localhost:8080 and /#/_/admin
```

The dev server additionally exposes photo endpoints used by the admin photo studio:

| Endpoint | Purpose |
|---|---|
| `POST /api/upload` | Writes a base64/data-URL image to `assets/images/profile-<id>-<index>.<ext>` (30 MB cap) |
| `POST /api/upload-url` | Downloads an external image URL server-side and stores it (15 s timeout, 5 redirects) |
| `POST /api/delete-profile-images` | Deletes `profile-<id>-*` files and explicit photo URLs |

Security posture of the dev server: same-origin only (no wildcard CORS), URL-decoded path check against
`ROOT + path.sep`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Cache-Control: no-cache` for `sw.js` and HTML. It binds `0.0.0.0` for device testing; do not expose it to
an untrusted network.

## 2. Static production (Vercel configuration included)

```bash
npx vercel --prod
```

- `vercel.json`: `outputDirectory: "."`, `cleanUrls: true`, headers for `sw.js` (no-cache) and
  `nosniff`/`Referrer-Policy` for everything.
- `.vercelignore` keeps `server.js`, env files and `PROJECT_DOCUMENTATION/` out of the upload.
- Alternative hosts (Netlify, GitHub Pages, Nginx) work as plain static hosts; replicate the `sw.js`
  no-cache header and the two security headers there.

**Important:** `/api/upload*` does **not** exist on a static host. The photo studio then falls back to
storing optimized data URLs inside SQLite/IndexedDB, which works but grows the database. Uploaded files
written by the local dev server are not part of the deployed bundle.

## 3. Environment variables

None are required. `.env.example` is documentation only (`PORT`, `PUBLIC_URL`). No secrets are used by
the browser app.

## 4. Data migrations

There is no server database. Migrations run in `db.js#createSchema()` on every start and are additive:
`ALTER TABLE … ADD COLUMN` wrapped in try/catch, plus `profile_likes` creation and legacy image-URL
rewrites. The SQLite file can be exported from the admin UI and inspected with any SQLite client.
Rollback = restore a previous `.sqlite`/JSON export; the app has no destructive migration step.

## 5. Release checklist

1. `node --check` on the four JS files.
2. Bump `CACHE_NAME` in `sw.js` whenever shell assets change (currently `dinetogether-v24`).
3. Reload twice in a fresh browser profile; confirm only the current cache remains.
4. Verify `/`, `/#/_/admin`, `/_/admin/` and `/manifest.json` on the deployed origin.
5. Confirm no `server.js` or env file is publicly reachable.
6. **Do not** call the deployment production-ready until admin authentication and a shared backend exist
   (see `SECURITY_AUDIT.md`).
