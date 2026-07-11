# Database Schema

## Tables

### profiles
Extends `auth.users`. Stores user profile, course info, timezone.

### settings
Per-user preferences: notifications, theme, language, warning threshold.

### employers
User's employers with colour and hourly rate.

### work_shifts
All shift records. Status: `scheduled`, `worked`, `cancelled`, `missed`.

### semester_breaks
Date ranges where work hour limits are not enforced.

## RLS

All tables use Row Level Security. Users can only access their own records (`auth.uid() = user_id`).

## Indexes

- `work_shifts(user_id, start_time)` — primary query pattern
- `work_shifts(user_id, status, start_time)` — filtered lists
- `semester_breaks(user_id, start_date, end_date)` — break lookups

## Local SQLite

Mirrors remote schema plus:
- `sync_status` on mutable tables
- `pending_mutations` queue
- `sync_metadata` for schema version

See migration files in `supabase/migrations/`.
