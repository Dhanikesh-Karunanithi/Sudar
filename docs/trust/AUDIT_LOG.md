# Admin audit log (planned)

**Status:** Design backlog — not yet a database table.

## Recommended table shape (draft)

- `id` (uuid)
- `org_id` (uuid)
- `actor_user_id` (uuid)
- `action` (text) — e.g. `org_settings_updated`, `user_invited`, `export_users_csv`
- `payload` (jsonb) — non-sensitive metadata only
- `created_at` (timestamptz)

## MVP events to log

- Org settings PATCH (which keys changed, not secret values)
- User invite / role change
- CSV exports initiated

Implement when enterprise customers require immutable audit trails.
