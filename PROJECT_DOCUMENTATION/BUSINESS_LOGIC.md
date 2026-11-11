# DineTogether — Business Logic

Reviewed workflow-by-workflow against the implemented code (not against assumptions).

## 1. Companion discovery

| Rule | Implementation |
|---|---|
| Age buckets | `18-24`, `25-29`, `30-34`, `35+`; applied in `renderProfiles()` |
| Interest filter | Exact slug match against `profiles.interests` (`art`, `music`, `travel`, `fitness`, `tech`, `food`) |
| Search | Case-insensitive substring over name + bio + location + interests |
| Combined filters | AND semantics; results count is live (`filtered of total`) |
| Empty state | Explicit message + "clear all filters" reset |

## 2. Likes

- Identity: `getUserKey()` → `ip_<ip>` (cached in localStorage) or device UUID fallback. **No accounts.**
- One like per key per profile, enforced by the `profile_likes` composite primary key.
- Toggle: insert + increment, or delete + decrement with `MAX(0, …)`.
- Card and modal stay in sync; counts come back from SQLite after every toggle.
- Seed count is `profiles.likes`; `parseProfile()` only derives a display count when the column is NULL.

## 3. Booking request

```
name ≥2 chars
phone: 7–15 digits, only + digits space - . ( )
date: required AND >= today (ISO)
time: required
venue: ≥2 chars
→ client upsert by phone (phone is the natural key; existing name is preserved)
→ request snapshot stores denormalized client + profile data
→ status = pending, createdAt = today
```

- Buttons are disabled while persisting; the label switches to a localized "Saving…".
- The same modal is reused for "Propose Alternative", which swaps the profile snapshot, resets the
  request to `pending`, and appends a localized “Admin suggested” note.

## 4. Booking lifecycle

| From | Action | To |
|---|---|---|
| pending | Accept | accepted |
| pending | Decline | declined |
| pending | Propose alternative | pending (new companion) |
| accepted | Cancel booking | declined |
| accepted | Move to pending | pending |
| declined | Re-accept | accepted |
| declined | Move to pending | pending |
| any | Delete | removed (permanent) |

`cancelled` is displayed and filtered together with `declined`. Status updates are optimistic and **rolled
back** if SQLite persistence fails.

## 5. Profiles and photos

- New IDs are allocated as `max(id) + 1`; `photoIndex` uses the same target ID so server files line up.
- Validation: name ≥2, age 18–99, bio ≥20.
- Photos: canvas resize to ≤800×1000, JPEG q≈0.85; the optimized data URL is always kept in the form, and
  the local server copy is used when `/api/upload` succeeds.
- Photo records are written to IndexedDB with the **target profile id** (previously `null`, which made
  per-profile photo lookup impossible).
- Deleting a profile removes its likes; the local server deletes `profile-<id>-*` files when available.
- Removing a photo from the form deletes it from the form state only (the IndexedDB record is not unlinked;
  see TODO).

## 6. Clients

- Created on first booking for a phone number; the same phone reuses the existing client.
- Admin client cards show join date and accepted/pending counts derived from `requests`.
- Deleting a client does not delete requests; request rows keep their own snapshots by design.

## 7. Database manager

- Live row counts for `profiles`, `clients`, `requests`, plus photo-record count.
- SQL runner: `SELECT`/`PRAGMA` render a table (first 100 rows); any other statement executes and persists.
- Exports: binary `.sqlite` (real SQLite file) and a JSON backup.

## 8. Corrections made during this audit

| Problem | Correction |
|---|---|
| Past dates accepted when typed | reject `date < today` |
| Phone hint claims 7 digits, validation allowed 6 | minimum raised to 7 |
| Confirm dialogs interpolated raw profile/client names into HTML | names escaped at both call sites |
| Public cards/modals showed English locations in FR/AR | `formatLocation()` applied |
| Interest chips stayed English in FR/AR | `formatInterest()` + tag keys added |
| Client-facing toasts/labels hardcoded English | moved into the I18N dictionary |
| Photo records saved with `profile_id = null` | now saved with the target profile id |
| Failed status update left the optimistic status in memory | rollback added |
| Route switch inherited the previous scroll offset | scroll reset in `showPage()` |
| `todayISO()` used UTC, so validation could shift by a day in non-UTC timezones | local calendar date |
