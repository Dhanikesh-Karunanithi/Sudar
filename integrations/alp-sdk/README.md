# ALP SDK (starter)

Minimal TypeScript client for Sudar ALP endpoints hosted on Learn.

## Covered endpoints

- `POST /api/alp/events`
- `POST /api/alp/tutor/query`
- `POST /api/alp/next-action`
- `POST /api/alp/embed-token`
- `POST /api/alp/identity/resolve` (org-scoped key only; `AlpClient.resolveIdentity`)

## Example

```ts
import { AlpClient } from './client'

const alp = new AlpClient('https://learn.example.com', {
  kind: 'apiKey',
  value: process.env.ALP_API_KEY!,
})

await alp.ingestEvents({
  user_id: '00000000-0000-0000-0000-000000000000',
  events: [{ event_type: 'module_complete', course_id: '...' }],
})
```

## Notes

- This is intentionally small and dependency-free so LMS connectors can copy or vendor it easily.
- For Moodle/PHP, see `integrations/moodle/local_sudaralp`.
