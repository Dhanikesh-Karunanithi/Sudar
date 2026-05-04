---
title: Enterprise provisioning checklist
description: SSO, roster sync, LMS, AI keys, and telemetry—anchors for integrations deep links.
audience: admin
category: admins
order: 3
marketing: false
---

<a id="identity"></a>

### Identity

Configure SSO (**SAML or OIDC**) in Supabase Auth → Providers, then mirror any policy annotations your security team expects inside Sudar Org settings.

<a id="directory"></a>

### Directory / roster sync

Use provisioning APIs or scheduled jobs mirroring learners from HRIS/SIS—the Integration Guide outlines field mapping nuances.

<a id="lms"></a>

### LMS / LTI

Issue ALP keys from **Sudar Studio → Organization → Integrations**, then wire LTI placements or iframe embed URLs per LMS vendor guidance.

<a id="ai-keys"></a>

### AI keys

Add cloud or private inference endpoints inside **Organization → AI & API Keys**.

<a id="data"></a>

### Data-plane telemetry

Pipe learning events (`module_start`, `module_complete`, `modality_switch`, etc.) via Learn’s ingestion endpoint—batch friendly for warehouse replay.
