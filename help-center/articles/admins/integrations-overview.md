---
title: Integrations and ALP (overview)
description: High-level map of Authenticated Learning Plane patterns, without duplicating secrets.
audience: admin
category: admins
order: 2
marketing: true
---

Sudar separates **Sudar Learn** deliveries from **Sudar Studio** administration. External systems (Canvas, Moodle, internal portals, data lakes) talk to learner APIs through organisation-scoped ALP credentials.

Patterns your integration team will recognise:

- **SudarMemory**: batched learning events land on Learn’s events endpoint with your API key.
- **SudarChat**: server-to-server tutor calls or embed iframes share the same auth model.
- **SudarRecommend**: next-best-action endpoints power widgets that keep learners progressing.
- **Embed**: time-bound URLs generated from Studio stitch Sudar surfaces into LMS pages.

Authoritative wire-level documentation remains in-repo (`docs/ALP_API.md`, `docs/INTEGRATION_GUIDE.md`). Operational pages walk you through Studios’ **Integrations** UI.
