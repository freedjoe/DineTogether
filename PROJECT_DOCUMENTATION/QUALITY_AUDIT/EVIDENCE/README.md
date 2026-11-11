# Evidence

## Screenshots: none retained

The Freebuff preview window was not visible/drawn during this session. Captures came back blank
(“page has not been drawn yet”) or with a distorted aspect ratio that made layout look clipped even though
the DOM reported no overflow. Retaining them would have been misleading evidence, so they were removed.

What was used instead, for every page and breakpoint:

- `document.documentElement.scrollWidth - clientWidth === 0` for horizontal overflow.
- Per-element `getBoundingClientRect()` checks for controls outside the viewport.
- `getComputedStyle(...).gridTemplateColumns` to confirm column counts.
- Accessibility snapshots from the preview browser (roles, labels, values).

## Test results

Detailed, reproducible results are in `../../TESTING.md` (22 scenarios plus a responsive matrix).
No CI artifacts exist; tests were run interactively against `node server.js` on `localhost:8080`.

## Build results

No build step exists (static files). “Build” verification is `node --check` for the four JS files plus
`JSON.parse` on the manifest; both pass. See `../../TESTING.md`.
